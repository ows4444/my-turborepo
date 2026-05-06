import { NestFactory } from '@nestjs/core';
import { getApiEnv } from '@repo/env';
import cookieParser from 'cookie-parser';

import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CsrfGuard } from './common/guards/csrf.guard';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

  const env = getApiEnv();

  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['content-type', 'x-csrf-token', 'x-request-id'],
  });

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: {
        policy: 'no-referrer',
      },
      permittedCrossDomainPolicies: {
        permittedPolicies: 'none',
      },
    }),
  );

  app.use(cookieParser(env.COOKIE_SECRET));

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalGuards(new CsrfGuard());

  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableShutdownHooks();

  await app.listen(env.PORT);
}

void bootstrap();
