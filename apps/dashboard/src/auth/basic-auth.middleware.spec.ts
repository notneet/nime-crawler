import { UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { BasicAuthMiddleware } from './basic-auth.middleware';

describe('BasicAuthMiddleware', () => {
  const mw = new BasicAuthMiddleware();
  const makeRes = () => {
    const headers: Record<string, string> = {};
    return { setHeader: (k: string, v: string) => (headers[k] = v), headers } as unknown as Response & {
      headers: Record<string, string>;
    };
  };

  beforeEach(() => {
    process.env.DASH_USER = 'u';
    process.env.DASH_PASS = 'p';
  });

  it('calls next when credentials match', () => {
    const token = Buffer.from('u:p').toString('base64');
    const req = { headers: { authorization: `Basic ${token}` } } as unknown as Request;
    const next = jest.fn();
    mw.use(req, makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('throws Unauthorized and sets WWW-Authenticate when missing', () => {
    const req = { headers: {} } as unknown as Request;
    const res = makeRes();
    expect(() => mw.use(req, res, jest.fn())).toThrow(UnauthorizedException);
    expect(res.headers['WWW-Authenticate']).toContain('Basic');
  });

  it('throws Unauthorized when password wrong', () => {
    const token = Buffer.from('u:wrong').toString('base64');
    const req = { headers: { authorization: `Basic ${token}` } } as unknown as Request;
    expect(() => mw.use(req, makeRes(), jest.fn())).toThrow(UnauthorizedException);
  });
});
