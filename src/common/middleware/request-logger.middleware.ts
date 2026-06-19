import { Injectable, NestMiddleware } from '@nestjs/common';

import { Request, Response } from 'express';

import { NextFunction } from 'express';

import { AppLoggerService } from '../logger/app-logger.service';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;

      this.logger.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`,
        'HTTP',
      );
    });

    next();
  }
}
