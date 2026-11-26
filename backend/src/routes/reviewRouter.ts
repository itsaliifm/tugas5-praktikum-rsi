import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController.ts';
import { authenticate } from '../middlewares/authMiddleware.ts';
import { validate } from '../middlewares/validate.ts';
import { createReviewLegacySchema, reviewIdSchema } from '../validators/reviewValidator.ts';

const reviewRouter = Router();
const reviewController = new ReviewController();

reviewRouter.get('/', (req, res) => {
  // #swagger.parameters['stallId'] = { in: 'query', type: 'integer' }
  // #swagger.responses[200] = { description: 'Daftar review (JOIN nama user)' }
  return reviewController.getReviews(req, res);
});

// Wajib login, userId dari token.
reviewRouter.post('/', authenticate, validate(createReviewLegacySchema, 'body'), (req, res) => {
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $stallId: 1, $rating: 5, comment: 'Enak' } }
  // #swagger.responses[201] = { description: 'Review dibuat, audit CREATE_REVIEW dicatat' }
  // #swagger.responses[409] = { description: 'Sudah pernah review warung ini' }
  return reviewController.createReview(req, res);
});

reviewRouter.delete('/:id', authenticate, validate(reviewIdSchema, 'params'), (req, res) => {
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.responses[200] = { description: 'Review dihapus, audit DELETE_REVIEW dicatat' }
  // #swagger.responses[403] = { description: 'Bukan penulis review atau admin' }
  return reviewController.deleteReview(req, res);
});

export { reviewRouter };
