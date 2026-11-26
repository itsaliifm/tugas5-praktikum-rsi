
import { Router } from 'express';
import { AuthController } from '../controllers/authController.ts';
import { validate } from '../middlewares/validate.ts';
import { authenticate } from '../middlewares/authMiddleware.ts';
import {
  registerSchema,
  loginSchema,
} from '../validators/authValidator.ts';

const authRouter = Router();
const authController = new AuthController();

authRouter.post('/register', validate(registerSchema, 'body'), (req, res) => {
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $name: 'Aliifah', $email: 'aliifah@example.com', $password: 'Passwordnya123' } }
  // #swagger.responses[201] = { description: 'Registrasi berhasil' }
  // #swagger.responses[400] = { description: 'Validasi gagal' }
  // #swagger.responses[409] = { description: 'Email sudah terdaftar' }

  return authController.register(req, res);
});

authRouter.post('/login', validate(loginSchema, 'body'), (req, res) => {
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $email: 'aliifah@example.com', $password: 'Passwordnya123' } }
  // #swagger.responses[200] = { description: 'Login berhasil' }
  // #swagger.responses[400] = { description: 'Validasi gagal' }
  // #swagger.responses[401] = { description: 'Email atau password salah' }

  return authController.login(req, res);
});

authRouter.post('/logout', authenticate, (req, res) => {
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.responses[200] = { description: 'Logout berhasil, audit LOGOUT dicatat' }
  // #swagger.responses[401] = { description: 'Token tidak valid atau tidak tersedia' }

  return authController.logout(req, res);
});

authRouter.get('/me', authenticate, (req, res) => {
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.responses[200] = { description: 'Data pengguna yang sedang login' }
  // #swagger.responses[401] = { description: 'Token tidak valid atau tidak tersedia' }

  return authController.me(req, res);
});

export { authRouter };
