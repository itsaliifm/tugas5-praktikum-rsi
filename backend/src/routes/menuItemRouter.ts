import { Router } from 'express';
import { MenuItemController } from '../controllers/menuItemController.ts';
import { authenticate, authorize } from '../middlewares/authMiddleware.ts';
import { validate } from '../middlewares/validate.ts';
import {
  createMenuItemSchema,
  menuItemIdSchema,
  updateMenuItemSchema,
} from '../validators/menuItemValidator.ts';

const menuItemRouter = Router();
const menuItemController = new MenuItemController();

menuItemRouter.get('/', (req, res) => {
  // #swagger.responses[200] = { description: 'Daftar menu (JOIN nama warung)' }
  return menuItemController.getMenuItems(req, res);
});

// Tambah, ubah, hapus menu: owner pemilik warung atau admin.
menuItemRouter.post(
  '/',
  authenticate,
  authorize('owner', 'admin'),
  validate(createMenuItemSchema, 'body'),
  (req, res) => {
    // #swagger.security = [{ "bearerAuth": [] }]
    // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $stallId: 1, $name: 'Nasi Goreng', $price: 15000, isAvailable: true } }
    // #swagger.responses[201] = { description: 'Menu item dibuat, audit CREATE_MENU dicatat' }
    // #swagger.responses[401] = { description: 'Token tidak valid atau tidak tersedia' }
    // #swagger.responses[403] = { description: 'Bukan pemilik warung' }
    return menuItemController.createMenuItem(req, res);
  },
);

menuItemRouter.get('/:id', validate(menuItemIdSchema, 'params'), (req, res) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  return menuItemController.getMenuItemById(req, res);
});

menuItemRouter.put(
  '/:id',
  authenticate,
  authorize('owner', 'admin'),
  validate(menuItemIdSchema, 'params'),
  validate(updateMenuItemSchema, 'body'),
  (req, res) => {
    // #swagger.security = [{ "bearerAuth": [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    // #swagger.parameters['body'] = { in: 'body', required: true, schema: { name: 'Nasi Goreng Spesial', price: 17000 } }
    // #swagger.responses[200] = { description: 'Menu item diubah, audit UPDATE_MENU dicatat' }
    return menuItemController.updateMenuItem(req, res);
  },
);

menuItemRouter.delete(
  '/:id',
  authenticate,
  authorize('owner', 'admin'),
  validate(menuItemIdSchema, 'params'),
  (req, res) => {
    // #swagger.security = [{ "bearerAuth": [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    // #swagger.responses[200] = { description: 'Menu item dihapus, audit DELETE_MENU dicatat' }
    return menuItemController.deleteMenuItem(req, res);
  },
);

export { menuItemRouter };
