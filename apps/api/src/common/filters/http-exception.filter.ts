import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();

      const response = exception.getResponse();

      const error =
        typeof response === 'object' &&
        response !== null &&
        'message' in response
          ? (response as { message?: string }).message
          : 'HTTP_ERROR';

      return res.status(status).json({
        data: null,
        error,
      });
    }

    return res.status(500).json({
      data: null,
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
}
