import { NextFunction, Request, Response } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = process.hrtime.bigint();
  // Captured up front: req.path is rewritten relative to the mount point inside routers.
  const path = (req.originalUrl ?? req.url).split('?')[0];

  res.once('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    console.info(
      JSON.stringify({
        level: 'info',
        method: req.method,
        path,
        status: res.statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
      }),
    );
  });

  next();
}
