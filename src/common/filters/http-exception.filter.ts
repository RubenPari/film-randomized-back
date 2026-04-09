import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

/**
 * Global exception filter that produces a consistent JSON shape for every error.
 * 5xx errors are logged and stripped of their internal details before being sent
 * to the client; 4xx errors are forwarded as-is so validation messages remain useful.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error';
    let errorName = 'InternalServerError';

    if (isHttp) {
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        message = payload;
      } else if (payload && typeof payload === 'object') {
        const obj = payload as { message?: string | string[]; error?: string };
        message = obj.message ?? exception.message;
        errorName = obj.error ?? exception.name;
      } else {
        message = exception.message;
        errorName = exception.name;
      }
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorResponseBody = {
      statusCode: status,
      error: errorName,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(body);
  }
}
