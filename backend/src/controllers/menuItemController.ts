import type { Request, Response } from 'express';
import type { UserToken } from '../middlewares/authMiddleware.ts';
import { MenuItemService } from '../services/menuItemService.ts';

export class MenuItemController {
  constructor(private menuItemService: MenuItemService = new MenuItemService()) {}

  private handleError(res: Response, error: unknown): Response {
    if (error instanceof Error && error.message === 'MENU_ITEM_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Menu item tidak ditemukan' });
    }
    if (error instanceof Error && error.message === 'STALL_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Data warung tidak ditemukan' });
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return res.status(403).json({
        status: 'fail',
        message: 'Kamu tidak memiliki izin untuk mengelola menu warung ini',
      });
    }
    console.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
    });
  }

  getMenuItems = async (req: Request, res: Response): Promise<Response> => {
    try {
      const items = await this.menuItemService.getAllMenuItems();
      return res.status(200).json({ status: 'success', data: items });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  getMenuItemById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const item = await this.menuItemService.getMenuItemById(Number(req.params.id));
      return res.status(200).json({ status: 'success', data: item });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  createMenuItem = async (req: Request, res: Response): Promise<Response> => {
    try {
      const user = res.locals.user as UserToken;
      const input = res.locals.validated?.body ?? req.body;
      const item = await this.menuItemService.createMenuItem(input, user);
      return res.status(201).json({ status: 'success', data: item });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  updateMenuItem = async (req: Request, res: Response): Promise<Response> => {
    try {
      const user = res.locals.user as UserToken;
      const input = res.locals.validated?.body ?? req.body;
      const item = await this.menuItemService.updateMenuItem(Number(req.params.id), input, user);
      return res.status(200).json({ status: 'success', data: item });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  deleteMenuItem = async (req: Request, res: Response): Promise<Response> => {
    try {
      const user = res.locals.user as UserToken;
      const item = await this.menuItemService.deleteMenuItem(Number(req.params.id), user);
      return res.status(200).json({ status: 'success', data: item });
    } catch (error) {
      return this.handleError(res, error);
    }
  };
}
