import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

export interface UserToken {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'owner' | 'customer';
}

export const authenticate: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'fail',
      message: 'Token autentikasi diperlukan',
    });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    return res.status(401).json({
      status: 'fail',
      message: 'Token tidak valid',
    });
  }

  try {
    const decoded = jwt.verify(token, secret);

    if (
      typeof decoded === 'string' ||
      typeof decoded.id !== 'number' ||
      !['admin', 'owner', 'customer'].includes(String(decoded.role))
    ) {
      return res.status(401).json({
        status: 'fail',
        message: 'Token tidak valid',
      });
    }

    res.locals.user = decoded as UserToken;
    next();
  } catch {
    return res.status(401).json({
      status: 'fail',
      message: 'Token tidak valid atau kedaluwarsa',
    });
  }
};

type UserRole = 'admin' | 'owner' | 'customer';

export const authorize = (...roles: UserRole[]): RequestHandler => {
  return (req, res, next) => {
    const user = res.locals.user as UserToken | undefined;

    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Autentikasi diperlukan',
      });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'Kamu tidak memiliki izin untuk mengakses resource ini',
      });
    }

    next();
  };
};
