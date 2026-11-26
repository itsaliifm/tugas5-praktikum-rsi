import type { Request } from 'express';

export interface RequestContext {
  ipAddress: string | null;
  userAgent: string | null;
}

// ip_address dan user_agent diambil dari HTTP request (bukan dari body),
// lalu disimpan ke metadata audit LOGIN dan LOGOUT.
export function getRequestContext(req: Request): RequestContext {
  return {
    ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
    userAgent: req.get('user-agent') ?? null,
  };
}
