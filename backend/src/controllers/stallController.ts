import type { UserToken } from '../middlewares/authMiddleware.ts';
import type { Request, Response } from 'express';
import { StallService } from '../services/stallService.ts';

export class StallController {
  private stallService: StallService;

  constructor(stallService: StallService = new StallService()) {
    this.stallService = stallService;
  }

  private handleError(res: Response, error: unknown): Response {
    if (error instanceof Error && error.message === 'STALL_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Data warung tidak ditemukan' });
    }
    console.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
    });
  }

  getStalls = async (req: Request, res: Response): Promise<Response> => {
    try {
      const query = res.locals.validated?.query;
      
      const page = query?.page ?? 1;
      const limit = query?.limit ?? 10;
      const search = query?.search;
      const category = query?.category;

      const { data, total } = await this.stallService.getAllStalls({
        search,
        category,
        page,
        limit,
      });

      return res.status(200).json({ status: 'success', meta: { page, limit, total }, data });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  getStallById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const stall = await this.stallService.getStallById(Number(req.params.id));
      return res.status(200).json({ status: 'success', data: stall });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  createStall = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = res.locals.user as UserToken;
    const input = res.locals.validated?.body ?? req.body;

    const stall = await this.stallService.createStall(
      {
        ...input,
        ownerId: user.id,
      },
      user,
    );

    return res.status(201).json({ status: 'success', data: stall });
  } catch (error) {
    return this.handleError(res, error);
  }
};

  updateStall = async (req: Request, res: Response): Promise<Response> => {
    try {
      const user = res.locals.user as UserToken;
      const id = Number(req.params.id);

      const currentStall = await this.stallService.getStallById(id);

    if (user.role !== 'admin' && currentStall.ownerId !== user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'Kamu tidak memiliki izin untuk mengubah warung ini',
      });
    }

    const input = res.locals.validated?.body ?? req.body;
    const stall = await this.stallService.updateStall(id, input, user);

    return res.status(200).json({ status: 'success', data: stall });
  } catch (error) {
    return this.handleError(res, error);
  }
};

  deleteStall = async (req: Request, res: Response): Promise<Response> => {
    try {
      const user = res.locals.user as UserToken;
      const stall = await this.stallService.deleteStall(Number(req.params.id), user);
      return res.status(200).json({ status: 'success', data: stall });
    } catch (error) {
      return this.handleError(res, error);
    }
  };
}
