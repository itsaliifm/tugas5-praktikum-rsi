import type { Request, Response } from 'express';
import type { UserToken } from '../middlewares/authMiddleware.ts';
import { ReviewService } from '../services/reviewService.ts';

export class ReviewController {
  constructor(private reviewService: ReviewService = new ReviewService()) {}

  private handleError(res: Response, error: unknown): Response {
    if (error instanceof Error && error.message === 'REVIEW_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Review tidak ditemukan' });
    }
    if (error instanceof Error && error.message === 'STALL_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Data warung tidak ditemukan' });
    }
    if (error instanceof Error && error.message === 'REVIEW_EXISTS') {
      return res.status(409).json({ status: 'fail', message: 'Kamu sudah memberi review untuk warung ini' });
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return res.status(403).json({ status: 'fail', message: 'Kamu tidak memiliki izin untuk menghapus review ini' });
    }
    console.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
    });
  }

  getReviews = async (req: Request, res: Response): Promise<Response> => {
    try {
      const stallId = req.query.stallId ? Number(req.query.stallId) : undefined;
      const reviews = await this.reviewService.getAllReviews(stallId);
      return res.status(200).json({ status: 'success', data: reviews });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  // POST /stalls/:id/reviews
  createStallReview = async (req: Request, res: Response): Promise<Response> => {
    try {
      const user = res.locals.user as UserToken;
      const { id } = res.locals.validated.params as { id: number };
      const input = res.locals.validated.body;
      const review = await this.reviewService.createReview(id, input, user);
      return res.status(201).json({ status: 'success', data: review });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  // POST /reviews (endpoint lama, stallId di body)
  createReview = async (req: Request, res: Response): Promise<Response> => {
    try {
      const user = res.locals.user as UserToken;
      const { stallId, ...input } = res.locals.validated.body;
      const review = await this.reviewService.createReview(stallId, input, user);
      return res.status(201).json({ status: 'success', data: review });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  deleteReview = async (req: Request, res: Response): Promise<Response> => {
    try {
      const user = res.locals.user as UserToken;
      const { id } = res.locals.validated.params as { id: number };
      const review = await this.reviewService.deleteReview(id, user);
      return res.status(200).json({ status: 'success', data: review });
    } catch (error) {
      return this.handleError(res, error);
    }
  };
}
