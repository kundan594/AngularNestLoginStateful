import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import configuration from './config/configuration';
import { getDatabaseConfig } from './config/database.config';
import { getThrottlerConfig } from './config/throttler.config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SecurityLoggingInterceptor } from './common/interceptors/security-logging.interceptor';

/**
 * Root Application Module
 *
 * This is the main module that bootstraps the NestJS application.
 * It imports the ConfigModule for environment variable management.
 *
 * Modules:
 * - ConfigModule: Environment variable management
 * - TypeOrmModule: Database ORM for PostgreSQL
 * - UsersModule: User management and database operations
 * - AuthModule: Authentication and authorization with Passport
 *
 * Additional modules will be added as they are implemented:
 * - SessionModule: Session management with Redis (configured in main.ts)
 */
@Module({
  imports: [
    // Global configuration module
    // Loads environment variables and makes them available throughout the app
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available globally without re-importing
      load: [configuration], // Load custom configuration factory
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env',
      ],
      cache: true, // Cache configuration for better performance
    }),

    // TypeORM Database Module
    // Configures PostgreSQL connection with TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),

    // Throttler Module for Rate Limiting
    ThrottlerModule.forRoot(getThrottlerConfig()),

    // Feature Modules
    UsersModule,
    AuthModule,
  ],
  controllers: [],
  providers: [
    // Global Throttler Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global Security Logging Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: SecurityLoggingInterceptor,
    },
  ],
})
export class AppModule {}

// Made with Bob
