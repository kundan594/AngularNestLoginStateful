import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { SessionSerializer } from './session.serializer';
import { UsersModule } from '../users/users.module';

/**
 * Authentication Module
 * 
 * Provides authentication functionality including:
 * - Passport local strategy
 * - Session management
 * - Login/logout endpoints
 * - Authentication guards
 */
@Module({
  imports: [
    UsersModule,
    PassportModule.register({ session: true }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    SessionSerializer,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

// Made with Bob
