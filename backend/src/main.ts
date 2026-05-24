import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import passport from 'passport';
import session from 'express-session';
import { ConfigService } from '@nestjs/config';

/**
 * Bootstrap the NestJS application
 * Sets up security middleware, CORS, sessions, Passport, and global validation
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Session Configuration
  // Must be configured before Passport initialization
  const sessionConfig = configService.get('session');
  app.use(session(sessionConfig));

  // Initialize Passport and session support
  app.use(passport.initialize());
  app.use(passport.session());

  // CORS Configuration
  // TODO: Configure based on environment (development vs production)
  // For now, using placeholder - will be configured via ConfigService
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true, // Required for session cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  // Global Validation Pipe
  // Automatically validates all incoming requests against DTO classes
  // Uses class-validator decorators for validation rules
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Convert primitive types automatically
      },
    }),
  );

  // Start the application
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}

bootstrap();

// Made with Bob
