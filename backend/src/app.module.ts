import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';

/**
 * Root Application Module
 * 
 * This is the main module that bootstraps the NestJS application.
 * It imports the ConfigModule for environment variable management.
 * 
 * Additional modules will be added here as they are implemented:
 * - AuthModule: Authentication and authorization
 * - SessionModule: Session management with Redis
 * - UsersModule: User management and database operations
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
    
    // TODO: Add modules as they are implemented
    // AuthModule,
    // SessionModule,
    // UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

// Made with Bob
