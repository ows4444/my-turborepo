import { NestFactory } from '@nestjs/core';
import { getApiEnv } from '@repo/env';
import cookieParser from 'cookie-parser';

import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CsrfGuard } from './common/guards/csrf.guard';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const env = getApiEnv();

  app.use(helmet());

  app.use(cookieParser(env.COOKIE_SECRET));

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalGuards(new CsrfGuard());

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(env.PORT);
}

void bootstrap();
