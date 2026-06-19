import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message = 'Internal server error';
    let errors: unknown = null;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (exceptionResponse && typeof exceptionResponse === 'object') {
      const exceptionObj = exceptionResponse as {
        message?: string | string[];
        error?: string;
      };

      if (Array.isArray(exceptionObj.message)) {
        message = exceptionObj.message[0];
        errors = exceptionObj.message;
      } else {
        message = exceptionObj.message ?? exceptionObj.error ?? message;
      }
    }

    // Structured Error Log
    this.logger.error(
      [
        `Status: ${status}`,
        `Method: ${request.method}`,
        `URL: ${request.originalUrl}`,
        `Message: ${message}`,
      ].join(' | '),
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    });
  }
}
