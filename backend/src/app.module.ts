import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { getDatabaseConfig } from './config/database.config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

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

    // Feature Modules
    UsersModule,
    AuthModule,
    
    // TODO: Add modules as they are implemented
    // SessionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

// Made with Bob
