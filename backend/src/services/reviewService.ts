import { ReviewRepository } from '../repositories/reviewRepository.ts';
import { StallRepository } from '../repositories/stallRepository.ts';
import { withTransaction } from '../db/transaction.ts';
import type { ReviewResponseDto } from '../dtos/reviewDto.ts';
import type { UserToken } from '../middlewares/authMiddleware.ts';
import { AuditLogService } from './auditLogService.ts';

export interface ReviewInput {
  rating: number;
  comment?: string;
}

export class ReviewService {
  constructor(
    private reviewRepository: ReviewRepository = new ReviewRepository(),
    private stallRepository: StallRepository = new StallRepository(),
    private auditLogService: AuditLogService = new AuditLogService(),
  ) {}

  private toDto(row: any): ReviewResponseDto {
    return {
      id: row.id,
      stallId: row.stallId,
      userId: row.userId,
      rating: row.rating,
      comment: row.comment,
      likeCount: row.likeCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      ...(row.userName !== undefined ? { userName: row.userName } : {}),
    };
  }

  async getAllReviews(stallId?: number): Promise<ReviewResponseDto[]> {
    const rows = await this.reviewRepository.findAllWithUser(stallId);
    return rows.map((row) => this.toDto(row));
  }

  // Review, rating warung, dan audit dalam satu transaksi. userId dari token.
  async createReview(
    stallId: number,
    input: ReviewInput,
    actor: UserToken,
  ): Promise<ReviewResponseDto> {
    return withTransaction(async (tx) => {
      const stall = await this.stallRepository.findById(stallId, tx);
      if (!stall) throw new Error('STALL_NOT_FOUND');

      const existing = await this.reviewRepository.findByUserAndStall(actor.id, stallId, tx);
      if (existing) throw new Error('REVIEW_EXISTS');

      const row = await this.reviewRepository.create(
        {
          stallId,
          userId: actor.id,
          rating: input.rating,
          comment: input.comment ?? null,
        },
        tx,
      );
      if (!row) throw new Error('REVIEW_NOT_FOUND');
      const after = this.toDto(row);

      await this.stallRepository.refreshRating(stallId, tx);

      await this.auditLogService.record(
        {
          userId: actor.id,
          action: 'CREATE_REVIEW',
          targetTable: 'REVIEWS',
          targetId: after.id,
          metadata: { role: actor.role, after },
        },
        tx,
      );

      return after;
    });
  }

  // Review hanya boleh dihapus oleh penulisnya atau admin.
  async deleteReview(id: number, actor: UserToken): Promise<ReviewResponseDto> {
    return withTransaction(async (tx) => {
      const current = await this.reviewRepository.findById(id, tx);
      if (!current) throw new Error('REVIEW_NOT_FOUND');
      if (actor.role !== 'admin' && current.userId !== actor.id) {
        throw new Error('FORBIDDEN');
      }
      const before = this.toDto(current);

      await this.reviewRepository.remove(id, tx);
      await this.stallRepository.refreshRating(before.stallId, tx);

      await this.auditLogService.record(
        {
          userId: actor.id,
          action: 'DELETE_REVIEW',
          targetTable: 'REVIEWS',
          targetId: id,
          metadata: { role: actor.role, before },
        },
        tx,
      );

      return before;
    });
  }
}
