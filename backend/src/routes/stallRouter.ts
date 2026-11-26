
import { Router } from 'express';
import { StallController } from '../controllers/stallController.ts';
import { ReviewController } from '../controllers/reviewController.ts';
import { createReviewSchema } from '../validators/reviewValidator.ts';
import { validate } from '../middlewares/validate.ts';
import {
  stallQuerySchema,
  stallIdSchema,
  createStallSchema,
  updateStallSchema,
} from '../validators/stallValidator.ts';
import {
  authenticate,
  authorize,
} from '../middlewares/authMiddleware.ts';

const stallRouter = Router();
const stallController = new StallController();
const reviewController = new ReviewController();

// GET semua warung
// Public: tidak perlu login
stallRouter.get(
  '/',
  validate(stallQuerySchema, 'query'),
  (req, res) => {
    // #swagger.responses[200] = { description: 'Daftar warung' }
    // #swagger.responses[400] = { description: 'Bad Request' }
    return stallController.getStalls(req, res);
  },
);

// GET detail warung
// Public: tidak perlu login
stallRouter.get(
  '/:id',
  validate(stallIdSchema, 'params'),
  (req, res) => {
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    // #swagger.responses[200] = { description: 'Detail warung' }
    // #swagger.responses[400] = { description: 'Bad Request' }
    // #swagger.responses[404] = { description: 'Tidak ditemukan' }
    return stallController.getStallById(req, res);
  },
);

// POST membuat warung
// Hanya owner dan admin
stallRouter.post(
  '/',
  authenticate,
  authorize('owner', 'admin'),
  validate(createStallSchema, 'body'),
  (req, res) => {
    // #swagger.security = [{ "bearerAuth": [] }]
    // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $name: 'Warung Tini', $category: 'Geprek', $location: 'Kantin FKIP', $description: '' } }
    // #swagger.responses[201] = { description: 'Warung dibuat' }
    // #swagger.responses[400] = { description: 'Validasi gagal' }
    // #swagger.responses[401] = { description: 'Token tidak valid atau tidak tersedia' }
    // #swagger.responses[403] = { description: 'Tidak memiliki izin' }
    return stallController.createStall(req, res);
  },
);

// PUT mengubah warung
// Owner hanya bisa mengubah warung miliknya, admin bisa mengubah semua
stallRouter.put(
  '/:id',
  authenticate,
  authorize('owner', 'admin'),
  validate(stallIdSchema, 'params'),
  validate(updateStallSchema, 'body'),
  (req, res) => {
    // #swagger.security = [{ "bearerAuth": [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/StallInput' } }
    // #swagger.responses[200] = { description: 'Warung ter-update' }
    // #swagger.responses[401] = { description: 'Token tidak valid atau tidak tersedia' }
    // #swagger.responses[403] = { description: 'Tidak memiliki izin' }
    // #swagger.responses[404] = { description: 'Tidak ditemukan' }
    return stallController.updateStall(req, res);
  },
);

// DELETE menghapus warung
// Hanya admin
stallRouter.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(stallIdSchema, 'params'),
  (req, res) => {
    // #swagger.security = [{ "bearerAuth": [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    // #swagger.responses[200] = { description: 'Warung terhapus' }
    // #swagger.responses[401] = { description: 'Token tidak valid atau tidak tersedia' }
    // #swagger.responses[403] = { description: 'Tidak memiliki izin' }
    // #swagger.responses[404] = { description: 'Tidak ditemukan' }
    return stallController.deleteStall(req, res);
  },
);

// POST review untuk warung
// Semua role yang login
stallRouter.post(
  '/:id/reviews',
  authenticate,
  validate(stallIdSchema, 'params'),
  validate(createReviewSchema, 'body'),
  (req, res) => {
    // #swagger.security = [{ "bearerAuth": [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $rating: 5, comment: 'Enak dan murah' } }
    // #swagger.responses[201] = { description: 'Review dibuat, audit CREATE_REVIEW dicatat' }
    // #swagger.responses[400] = { description: 'Validasi gagal' }
    // #swagger.responses[401] = { description: 'Token tidak valid atau tidak tersedia' }
    // #swagger.responses[404] = { description: 'Warung tidak ditemukan' }
    // #swagger.responses[409] = { description: 'Sudah pernah review warung ini' }
    return reviewController.createStallReview(req, res);
  },
);

export { stallRouter };
