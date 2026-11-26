import { Router } from 'express';
import { AuditLogController } from '../controllers/auditLogController.ts';
import { authenticate, authorize } from '../middlewares/authMiddleware.ts';
import { validate } from '../middlewares/validate.ts';
import { auditLogIdSchema, auditLogQuerySchema } from '../validators/auditLogValidator.ts';

const auditLogRouter = Router();
const auditLogController = new AuditLogController();

// Riwayat audit hanya untuk admin. Tidak ada endpoint POST, PUT, atau DELETE:
// audit bersifat append-only dan hanya ditulis oleh backend.
auditLogRouter.get(
  '/',
  authenticate,
  authorize('admin'),
  validate(auditLogQuerySchema, 'query'),
  (req, res) => {
    // #swagger.security = [{ "bearerAuth": [] }]
    // #swagger.parameters['page'] = { in: 'query', type: 'integer' }
    // #swagger.parameters['pageSize'] = { in: 'query', type: 'integer' }
    // #swagger.parameters['action'] = { in: 'query', type: 'string' }
    // #swagger.parameters['targetTable'] = { in: 'query', type: 'string' }
    // #swagger.parameters['targetId'] = { in: 'query', type: 'integer' }
    // #swagger.parameters['userId'] = { in: 'query', type: 'integer' }
    // #swagger.parameters['from'] = { in: 'query', type: 'string', description: 'YYYY-MM-DD' }
    // #swagger.parameters['to'] = { in: 'query', type: 'string', description: 'YYYY-MM-DD' }
    // #swagger.responses[200] = { description: 'Daftar audit log dengan pagination' }
    // #swagger.responses[400] = { description: 'Parameter tidak valid' }
    // #swagger.responses[401] = { description: 'Token tidak valid atau tidak tersedia' }
    // #swagger.responses[403] = { description: 'Bukan admin' }
    return auditLogController.getLogs(req, res);
  },
);

auditLogRouter.get(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(auditLogIdSchema, 'params'),
  (req, res) => {
    // #swagger.security = [{ "bearerAuth": [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    // #swagger.responses[200] = { description: 'Detail satu catatan audit' }
    // #swagger.responses[401] = { description: 'Token tidak valid atau tidak tersedia' }
    // #swagger.responses[403] = { description: 'Bukan admin' }
    // #swagger.responses[404] = { description: 'Catatan audit tidak ditemukan' }
    return auditLogController.getLogById(req, res);
  },
);

export { auditLogRouter };
