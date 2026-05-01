import { NestFactory } from '@nestjs/core';

import { getServerEnv } from '@repo/env';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  app.enableShutdownHooks();

  const env = getServerEnv();
  console.log('✅ ENV VALIDATED:', {
    NODE_ENV: env.NODE_ENV,
    PORT: env.PORT,
  });
  const port = env.PORT;

  await app.listen(String(port));
}

void bootstrap();
