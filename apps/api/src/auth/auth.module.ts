import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { type StringValue } from 'ms';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionRepository } from './session.repository';
import { DeviceService } from './device/device.service';
import { JwtStrategy } from './jwt.strategy';

import { UsersService } from '../users/users.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('auth.accessTokenSecret'),
        signOptions: {
          expiresIn: config.getOrThrow<StringValue>('auth.accessTokenTtl'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    UsersService,
    DeviceService,
    SessionRepository,
  ],
  exports: [AuthService],
})
export class AuthModule {}
