import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import passport from 'passport';
import session from 'express-session';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { getCorsConfig } from './config/cors.config';

/**
 * Bootstrap the NestJS application
 * Sets up security middleware, CORS, sessions, Passport, and global validation
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security Headers with Helmet
  // Configure Content Security Policy and other security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          // Allow embedding from specific origins
          frameAncestors: [
            "'self'",
            'http://localhost:8080',
            'http://localhost:3000',
            'http://127.0.0.1:8080',
          ],
        },
      },
      // Configure X-Frame-Options
      // DENY prevents all framing, SAMEORIGIN allows same-origin framing
      // For iframe support, we'll use CSP frame-ancestors instead
      frameguard: false, // Disabled in favor of CSP frame-ancestors
    }),
  );

  // Custom X-Frame-Options middleware for more control
  // Allows embedding from specific origins
  app.use((req: Request, res: Response, next: NextFunction) => {
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:3000',
      'http://127.0.0.1:8080',
    ];

    const origin = req.headers.origin;
    
    // If origin is in allowed list, allow framing
    if (origin && allowedOrigins.includes(origin)) {
      // Modern browsers prefer CSP frame-ancestors over X-Frame-Options
      // X-Frame-Options is kept for older browser support
      res.setHeader('X-Frame-Options', 'ALLOWALL');
    } else {
      // Deny framing from unauthorized origins
      res.setHeader('X-Frame-Options', 'DENY');
    }

    next();
  });

  // Session Configuration
  // Must be configured before Passport initialization
  const sessionConfig = configService.get('session');
  app.use(session(sessionConfig));

  // Initialize Passport and session support
  app.use(passport.initialize());
  app.use(passport.session());

  // CORS Configuration
  // Dynamically configure CORS based on environment (development vs production)
  const nodeEnv = configService.get<string>('app.nodeEnv') || 'development';
  const allowedOrigins = configService.get<string[]>('cors.allowedOrigins');
  const corsConfig = getCorsConfig(nodeEnv, allowedOrigins);
  
  app.enableCors(corsConfig);

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
      disableErrorMessages: process.env.NODE_ENV === 'production', // Hide details in prod
      validationError: {
        target: false, // Don't expose target object
        value: false, // Don't expose submitted values
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
