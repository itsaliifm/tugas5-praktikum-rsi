import {
  StallRepository,
  type CreateStallInput,
  type FindAllParams,
} from '../repositories/stallRepository.ts';
import { withTransaction } from '../db/transaction.ts';
import type { StallResponseDto } from '../dtos/stallDto.ts';
import type { UserToken } from '../middlewares/authMiddleware.ts';
import { AuditLogService } from './auditLogService.ts';

type StallRow = NonNullable<Awaited<ReturnType<StallRepository['findById']>>>;

export class StallService {
  constructor(
    private stallRepository: StallRepository = new StallRepository(),
    private auditLogService: AuditLogService = new AuditLogService(),
  ) {}

  private toDto(row: StallRow): StallResponseDto {
    const avgRating = Number(row.avgRating);
    return {
      id: row.id,
      ownerId: row.ownerId,
      name: row.name,
      category: row.category,
      location: row.location,
      description: row.description,
      avgRating,
      reviewCount: row.reviewCount,
      isPopular: avgRating >= 4.7,
    };
  }

  // Field yang berubah antara data sebelum dan sesudah update
  private changedFields(before: StallResponseDto, after: StallResponseDto): string[] {
    const fields: (keyof StallResponseDto)[] = ['name', 'category', 'location', 'description', 'ownerId'];
    return fields.filter((field) => before[field] !== after[field]);
  }

  async getAllStalls(params: FindAllParams) {
    const { rows, total } = await this.stallRepository.findAll(params);
    return { data: rows.map((row) => this.toDto(row)), total };
  }

  async getStallById(id: number): Promise<StallResponseDto> {
    const row = await this.stallRepository.findById(id);
    if (!row) throw new Error('STALL_NOT_FOUND');
    return this.toDto(row);
  }

  // Mutasi dan audit dalam satu transaksi.
  async createStall(input: CreateStallInput, actor: UserToken): Promise<StallResponseDto> {
    return withTransaction(async (tx) => {
      const row = await this.stallRepository.create(input, tx);
      if (!row) throw new Error('STALL_NOT_FOUND');
      const after = this.toDto(row);

      await this.auditLogService.record(
        {
          userId: actor.id,
          action: 'CREATE_STALL',
          targetTable: 'STALLS',
          targetId: after.id,
          metadata: { role: actor.role, after },
        },
        tx,
      );

      return after;
    });
  }

  async updateStall(
    id: number,
    input: Partial<CreateStallInput>,
    actor: UserToken,
  ): Promise<StallResponseDto> {
    return withTransaction(async (tx) => {
      // Snapshot "before" diambil sebelum data diubah
      const current = await this.stallRepository.findById(id, tx);
      if (!current) throw new Error('STALL_NOT_FOUND');
      const before = this.toDto(current);

      const row = await this.stallRepository.update(id, input, tx);
      if (!row) throw new Error('STALL_NOT_FOUND');
      const after = this.toDto(row);

      await this.auditLogService.record(
        {
          userId: actor.id,
          action: 'UPDATE_STALL',
          targetTable: 'STALLS',
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

  async deleteStall(id: number, actor: UserToken): Promise<StallResponseDto> {
    return withTransaction(async (tx) => {
      const current = await this.stallRepository.findById(id, tx);
      if (!current) throw new Error('STALL_NOT_FOUND');
      const before = this.toDto(current);

      await this.stallRepository.remove(id, tx);

      await this.auditLogService.record(
        {
          userId: actor.id,
          action: 'DELETE_STALL',
          targetTable: 'STALLS',
          targetId: id,
          metadata: { role: actor.role, before },
        },
        tx,
      );

      return before;
    });
  }
}
