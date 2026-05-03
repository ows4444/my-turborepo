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

      return res.status(status).json({
        data: null,
        error: exception.message,
      });
    }

    return res.status(500).json({
      data: null,
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
}
