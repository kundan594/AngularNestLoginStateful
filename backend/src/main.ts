import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as helmet from 'helmet';

/**
 * Bootstrap the NestJS application
 * Sets up security middleware, CORS, and global validation
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security: Apply Helmet middleware for secure HTTP headers
  // Protects against common web vulnerabilities (XSS, clickjacking, etc.)
  app.use(helmet());

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
