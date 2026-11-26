import {
  MenuItemRepository,
  type CreateMenuItemInput,
} from '../repositories/menuItemRepository.ts';
import { StallRepository } from '../repositories/stallRepository.ts';
import { withTransaction, type DbExecutor } from '../db/transaction.ts';
import type { MenuItemResponseDto } from '../dtos/menuItemDto.ts';
import type { UserToken } from '../middlewares/authMiddleware.ts';
import { AuditLogService } from './auditLogService.ts';

export class MenuItemService {
  constructor(
    private menuItemRepository: MenuItemRepository = new MenuItemRepository(),
    private stallRepository: StallRepository = new StallRepository(),
    private auditLogService: AuditLogService = new AuditLogService(),
  ) {}

  private toDto(row: any): MenuItemResponseDto {
    return {
      id: row.id,
      stallId: row.stallId,
      name: row.name,
      price: row.price,
      isAvailable: Boolean(row.isAvailable),
      ...(row.stallName !== undefined ? { stallName: row.stallName } : {}),
    };
  }

  private changedFields(before: MenuItemResponseDto, after: MenuItemResponseDto): string[] {
    const fields: (keyof MenuItemResponseDto)[] = ['stallId', 'name', 'price', 'isAvailable'];
    return fields.filter((field) => before[field] !== after[field]);
  }

  // Owner hanya boleh mengelola menu di warung miliknya. Admin boleh semua.
  private async assertCanManageStall(
    stallId: number,
    actor: UserToken,
    executor: DbExecutor,
  ): Promise<void> {
    const stall = await this.stallRepository.findById(stallId, executor);
    if (!stall) throw new Error('STALL_NOT_FOUND');
    if (actor.role !== 'admin' && stall.ownerId !== actor.id) {
      throw new Error('FORBIDDEN');
    }
  }

  async getAllMenuItems(): Promise<MenuItemResponseDto[]> {
    const rows = await this.menuItemRepository.findAllWithStall();
    return rows.map((row) => this.toDto(row));
  }

  async getMenuItemById(id: number): Promise<MenuItemResponseDto> {
    const row = await this.menuItemRepository.findById(id);
    if (!row) throw new Error('MENU_ITEM_NOT_FOUND');
    return this.toDto(row);
  }

  // Mutasi dan audit dalam satu transaksi.
  async createMenuItem(input: CreateMenuItemInput, actor: UserToken): Promise<MenuItemResponseDto> {
    return withTransaction(async (tx) => {
      await this.assertCanManageStall(input.stallId, actor, tx);

      const row = await this.menuItemRepository.create(input, tx);
      if (!row) throw new Error('MENU_ITEM_NOT_FOUND');
      const after = this.toDto(row);

      await this.auditLogService.record(
        {
          userId: actor.id,
          action: 'CREATE_MENU',
          targetTable: 'MENU_ITEMS',
          targetId: after.id,
          metadata: { role: actor.role, after },
        },
        tx,
      );

      return after;
    });
  }

  async updateMenuItem(
    id: number,
    input: Partial<CreateMenuItemInput>,
    actor: UserToken,
  ): Promise<MenuItemResponseDto> {
    return withTransaction(async (tx) => {
      const current = await this.menuItemRepository.findById(id, tx);
      if (!current) throw new Error('MENU_ITEM_NOT_FOUND');
      const before = this.toDto(current);

      await this.assertCanManageStall(before.stallId, actor, tx);
      // Jika menu dipindah ke warung lain, warung tujuan juga harus miliknya
      if (input.stallId !== undefined && input.stallId !== before.stallId) {
        await this.assertCanManageStall(input.stallId, actor, tx);
      }

      const row = await this.menuItemRepository.update(id, input, tx);
      if (!row) throw new Error('MENU_ITEM_NOT_FOUND');
      const after = this.toDto(row);

      await this.auditLogService.record(
        {
          userId: actor.id,
          action: 'UPDATE_MENU',
          targetTable: 'MENU_ITEMS',
          targetId: id,
          metadata: {
            role: actor.role,
            before,
            after,
            changed: this.changedFields(before, after),
          },
        },
        tx,
      );

      return after;
    });
  }

  async deleteMenuItem(id: number, actor: UserToken): Promise<MenuItemResponseDto> {
    return withTransaction(async (tx) => {
      const current = await this.menuItemRepository.findById(id, tx);
      if (!current) throw new Error('MENU_ITEM_NOT_FOUND');
      const before = this.toDto(current);

      await this.assertCanManageStall(before.stallId, actor, tx);
      await this.menuItemRepository.remove(id, tx);

      await this.auditLogService.record(
        {
          userId: actor.id,
          action: 'DELETE_MENU',
          targetTable: 'MENU_ITEMS',
          targetId: id,
          metadata: { role: actor.role, before },
        },
        tx,
      );

      return before;
    });
  }
}
