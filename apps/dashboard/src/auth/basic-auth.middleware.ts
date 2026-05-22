import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class BasicAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const user = process.env.DASH_USER ?? 'admin';
    const pass = process.env.DASH_PASS ?? 'admin';
    const header = req.headers.authorization ?? '';
    const [scheme, encoded] = header.split(' ');
    if (scheme === 'Basic' && encoded) {
      const [u, p] = Buffer.from(encoded, 'base64').toString().split(':');
      if (u === user && p === pass) {
        next();
        return;
      }
    }
    res.setHeader('WWW-Authenticate', 'Basic realm="dashboard"');
    throw new UnauthorizedException();
  }
}
