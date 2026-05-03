import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DeviceService } from './device/device.service';
import { JwtStrategy } from './jwt.strategy';
import { SessionRepository } from './session.repository';

import { UsersService } from '../users/users.service';

@Module({
  imports: [ConfigModule, JwtModule],
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
