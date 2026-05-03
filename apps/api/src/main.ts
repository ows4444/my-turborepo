import { NestFactory } from '@nestjs/core';
import { getApiEnv } from '@repo/env';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const env = getApiEnv();

  app.use(cookieParser(env.COOKIE_SECRET));

  await app.listen(env.PORT);
}

void bootstrap();
