import { Module } from '@nestjs/common';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { LinksModule } from './links/links.module';

@Module({
  imports: [LinksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
