import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { UserToken } from '../middlewares/authMiddleware.ts';
import { UserRepository } from '../repositories/userRepository.ts';
import type { RequestContext } from '../utils/requestContext.ts';
import { AuditLogService } from './auditLogService.ts';

export class AuthService {
  constructor(
    private userRepository: UserRepository = new UserRepository(),
    private auditLogService: AuditLogService = new AuditLogService(),
  ) {}

  async register(input: {
    name: string;
    email: string;
    password: string;
  }) {
    const email = input.email.trim().toLowerCase();

    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new Error('EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await this.userRepository.create({
      name: input.name.trim(),
      email,
      passwordHash,
      role: 'customer',
    });

    if (!user) {
      throw new Error('REGISTER_FAILED');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async login(
    input: {
      email: string;
      password: string;
    },
    context: RequestContext,
  ) {
    const email = input.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      // Email tidak terdaftar: tidak ada user_id yang bisa dicatat
      // (kolom user_id wajib terisi), jadi tidak ditulis ke audit.
      throw new Error('INVALID_CREDENTIALS');
    }

    const passwordMatch = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatch) {
      // Best-effort: password salah dicatat sebagai LOGIN dengan result failed.
      await this.auditLogService.recordAuth({
        action: 'LOGIN',
        user,
        context,
        result: 'failed',
        reason: 'INVALID_PASSWORD',
      });
      throw new Error('INVALID_CREDENTIALS');
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET_MISSING');
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      secret,
      { expiresIn: '1d' },
    );

    // Best-effort: kegagalan audit tidak boleh menggagalkan login.
    await this.auditLogService.recordAuth({
      action: 'LOGIN',
      user,
      context,
      result: 'success',
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * JWT bersifat stateless, jadi logout di backend cukup mencatat audit.
   * Token dihapus oleh frontend. Kegagalan audit tidak menggagalkan logout.
   */
  async logout(user: UserToken, context: RequestContext): Promise<void> {
    await this.auditLogService.recordAuth({
      action: 'LOGOUT',
      user,
      context,
      result: 'success',
    });
  }
}
