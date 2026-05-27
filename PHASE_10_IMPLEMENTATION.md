# Phase 10: Security Hardening - Implementation Guide

Complete guide for implementing comprehensive security hardening measures in the Angular + NestJS authentication system.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Helmet Configuration](#helmet-configuration)
3. [Rate Limiting](#rate-limiting)
4. [Input Validation](#input-validation)
5. [Logging Infrastructure](#logging-infrastructure)
6. [Security Audit](#security-audit)
7. [Testing](#testing)
8. [Deployment Checklist](#deployment-checklist)

---

## 🎯 Overview

Phase 10 focuses on hardening the application's security posture through:
- **Enhanced HTTP security headers** via Helmet
- **Rate limiting** to prevent brute force attacks
- **Comprehensive input validation** to prevent injection attacks
- **Structured logging** for security monitoring and audit trails
- **Security audit** to identify and fix vulnerabilities

---

## 🛡️ Helmet Configuration

### Step 1: Install Dependencies

```bash
cd backend
npm install --save @nestjs/throttler helmet
npm install --save-dev @types/helmet
```

### Step 2: Enhanced Helmet Configuration

**File:** `backend/src/main.ts`

```typescript
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enhanced Helmet configuration
  app.use(
    helmet({
      // Content Security Policy
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
          frameAncestors: ["'self'", 'http://localhost:8080'], // For iframe support
        },
      },
      
      // HTTP Strict Transport Security
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      
      // X-Frame-Options (already configured, but enhanced)
      frameguard: {
        action: 'deny', // Default deny, override per request
      },
      
      // X-Content-Type-Options
      noSniff: true,
      
      // X-XSS-Protection
      xssFilter: true,
      
      // Referrer-Policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      
      // X-Permitted-Cross-Domain-Policies
      permittedCrossDomainPolicies: {
        permittedPolicies: 'none',
      },
      
      // X-DNS-Prefetch-Control
      dnsPrefetchControl: {
        allow: false,
      },
      
      // Hide X-Powered-By
      hidePoweredBy: true,
    }),
  );

  // ... rest of configuration
}
```

### Step 3: Environment-Specific CSP

**File:** `backend/src/config/security.config.ts`

```typescript
export const getSecurityConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", ...(isProduction ? [] : ["'unsafe-eval'"])],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: [
            "'self'",
            ...(isProduction 
              ? ['https://api.yourdomain.com'] 
              : ['http://localhost:3000', 'http://localhost:4200']
            ),
          ],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          frameAncestors: [
            "'self'",
            ...(isProduction 
              ? ['https://parent.yourdomain.com'] 
              : ['http://localhost:8080']
            ),
          ],
        },
      },
      hsts: {
        maxAge: isProduction ? 31536000 : 0,
        includeSubDomains: isProduction,
        preload: isProduction,
      },
    },
  };
};
```

---

## 🚦 Rate Limiting

### Step 1: Configure Throttler Module

**File:** `backend/src/app.module.ts`

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    // Global rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: 'long',
        ttl: 900000, // 15 minutes
        limit: 1000, // 1000 requests per 15 minutes
      },
    ]),
    // ... other imports
  ],
  providers: [
    // Apply throttler globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // ... other providers
  ],
})
export class AppModule {}
```

### Step 2: Login-Specific Rate Limiting

**File:** `backend/src/auth/auth.controller.ts`

```typescript
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  
  // Strict rate limiting for login attempts
  @Post('login')
  @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 attempts per minute
  @UseGuards(LocalAuthGuard, CsrfGuard)
  async login(@Req() req: Request) {
    // ... login logic
  }
  
  // Skip throttling for CSRF token endpoint
  @Get('csrf')
  @SkipThrottle()
  getCsrfToken(@Req() req: Request) {
    // ... CSRF logic
  }
  
  // Moderate rate limiting for status checks
  @Get('status')
  @Throttle({ medium: { limit: 60, ttl: 60000 } }) // 60 per minute
  async getStatus(@Req() req: Request) {
    // ... status logic
  }
}
```

### Step 3: Custom Rate Limit Storage (Redis)

**File:** `backend/src/config/throttler.config.ts`

```typescript
import { ThrottlerStorageRedisService } from 'throttler-storage-redis';
import Redis from 'ioredis';

export const getThrottlerStorage = () => {
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: 1, // Use different DB than sessions
  });

  return new ThrottlerStorageRedisService(redis);
};
```

**Update app.module.ts:**

```typescript
ThrottlerModule.forRoot({
  throttlers: [
    { name: 'short', ttl: 1000, limit: 10 },
    { name: 'medium', ttl: 60000, limit: 100 },
    { name: 'long', ttl: 900000, limit: 1000 },
  ],
  storage: getThrottlerStorage(),
}),
```

---

## ✅ Input Validation

### Step 1: Review Existing DTOs

**File:** `backend/src/auth/dto/login.dto.ts`

```typescript
import { 
  IsEmail, 
  IsString, 
  MinLength, 
  MaxLength,
  Matches,
  IsNotEmpty 
} from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password: string;
}
```

### Step 2: Enhanced User DTOs

**File:** `backend/src/users/dto/create-user.dto.ts`

```typescript
import { 
  IsEmail, 
  IsString, 
  MinLength, 
  MaxLength,
  Matches,
  IsNotEmpty,
  IsOptional 
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password must contain uppercase, lowercase, number, and special character' }
  )
  password: string;

  @IsString({ message: 'First name must be a string' })
  @IsOptional()
  @MinLength(1, { message: 'First name must not be empty' })
  @MaxLength(100, { message: 'First name must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  @Matches(/^[a-zA-Z\s'-]+$/, { message: 'First name contains invalid characters' })
  firstName?: string;

  @IsString({ message: 'Last name must be a string' })
  @IsOptional()
  @MinLength(1, { message: 'Last name must not be empty' })
  @MaxLength(100, { message: 'Last name must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  @Matches(/^[a-zA-Z\s'-]+$/, { message: 'Last name contains invalid characters' })
  lastName?: string;
}
```

### Step 3: Global Validation Pipe

**File:** `backend/src/main.ts`

```typescript
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error for extra properties
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === 'production', // Hide details in prod
      validationError: {
        target: false, // Don't expose target object
        value: false, // Don't expose submitted values
      },
    }),
  );

  // ... rest of configuration
}
```

### Step 4: Input Sanitization

**File:** `backend/src/common/pipes/sanitize.pipe.ts`

```typescript
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import * as sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'string') {
      return sanitizeHtml(value, {
        allowedTags: [], // No HTML tags allowed
        allowedAttributes: {},
      });
    }
    
    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value);
    }
    
    return value;
  }

  private sanitizeObject(obj: any): any {
    const sanitized: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        
        if (typeof value === 'string') {
          sanitized[key] = sanitizeHtml(value, {
            allowedTags: [],
            allowedAttributes: {},
          });
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
    }
    
    return sanitized;
  }
}
```

**Install dependency:**
```bash
npm install --save sanitize-html
npm install --save-dev @types/sanitize-html
```

---

## 📝 Logging Infrastructure

### Step 1: Install Winston

```bash
cd backend
npm install --save nest-winston winston winston-daily-rotate-file
```

### Step 2: Configure Winston Logger

**File:** `backend/src/config/logger.config.ts`

```typescript
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, context, trace }) => {
    return `${timestamp} [${context}] ${level}: ${message}${trace ? `\n${trace}` : ''}`;
  }),
);

export const createLogger = () => {
  const transports: winston.transport[] = [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.LOG_LEVEL || 'info',
    }),
  ];

  // File transports for production
  if (process.env.NODE_ENV === 'production') {
    // Error logs
    transports.push(
      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        format: logFormat,
        maxSize: '20m',
        maxFiles: '30d',
        zippedArchive: true,
      }),
    );

    // Combined logs
    transports.push(
      new DailyRotateFile({
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        format: logFormat,
        maxSize: '20m',
        maxFiles: '30d',
        zippedArchive: true,
      }),
    );

    // Security logs
    transports.push(
      new DailyRotateFile({
        filename: 'logs/security-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'warn',
        format: logFormat,
        maxSize: '20m',
        maxFiles: '90d', // Keep security logs longer
        zippedArchive: true,
      }),
    );
  }

  return WinstonModule.createLogger({
    transports,
    exceptionHandlers: [
      new winston.transports.File({ filename: 'logs/exceptions.log' }),
    ],
    rejectionHandlers: [
      new winston.transports.File({ filename: 'logs/rejections.log' }),
    ],
  });
};
```

### Step 3: Integrate Logger in App Module

**File:** `backend/src/app.module.ts`

```typescript
import { createLogger } from './config/logger.config';

@Module({
  imports: [
    WinstonModule.forRoot(createLogger()),
    // ... other imports
  ],
})
export class AppModule {}
```

### Step 4: Authentication Event Logging

**File:** `backend/src/auth/auth.service.ts`

```typescript
import { Inject, Injectable, Logger } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly winstonLogger: Logger,
    // ... other dependencies
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.usersService.findByEmail(email);
      
      if (!user) {
        this.winstonLogger.warn('Login attempt with non-existent email', {
          email,
          timestamp: new Date().toISOString(),
          event: 'LOGIN_FAILED_USER_NOT_FOUND',
        });
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        this.winstonLogger.warn('Login attempt with invalid password', {
          userId: user.id,
          email: user.email,
          timestamp: new Date().toISOString(),
          event: 'LOGIN_FAILED_INVALID_PASSWORD',
        });
        return null;
      }

      this.winstonLogger.log('User logged in successfully', {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
        event: 'LOGIN_SUCCESS',
      });

      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      this.winstonLogger.error('Error during user validation', {
        email,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        event: 'LOGIN_ERROR',
      });
      throw error;
    }
  }

  async logout(userId: string, sessionId: string): Promise<void> {
    this.winstonLogger.log('User logged out', {
      userId,
      sessionId,
      timestamp: new Date().toISOString(),
      event: 'LOGOUT_SUCCESS',
    });
    
    // ... logout logic
  }
}
```

### Step 5: Security Event Logging Interceptor

**File:** `backend/src/common/interceptors/security-logging.interceptor.ts`

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class SecurityLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('SecurityLogger');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';
    const userId = request.user?.id || 'Anonymous';

    // Log security-relevant requests
    if (this.isSecurityRelevant(url)) {
      this.logger.log({
        event: 'SECURITY_REQUEST',
        method,
        url,
        ip,
        userAgent,
        userId,
        timestamp: new Date().toISOString(),
      });
    }

    return next.handle().pipe(
      tap(() => {
        // Log successful security operations
        if (this.isSecurityRelevant(url)) {
          this.logger.log({
            event: 'SECURITY_REQUEST_SUCCESS',
            method,
            url,
            userId,
            timestamp: new Date().toISOString(),
          });
        }
      }),
      catchError((error) => {
        // Log security failures
        this.logger.error({
          event: 'SECURITY_REQUEST_FAILED',
          method,
          url,
          userId,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        throw error;
      }),
    );
  }

  private isSecurityRelevant(url: string): boolean {
    const securityEndpoints = [
      '/auth/login',
      '/auth/logout',
      '/auth/csrf',
      '/users',
    ];
    return securityEndpoints.some((endpoint) => url.includes(endpoint));
  }
}
```

---

## 🔍 Security Audit

### Checklist

#### 1. SQL Injection Prevention
- ✅ Using TypeORM with parameterized queries
- ✅ No raw SQL queries with user input
- ✅ Input validation on all DTOs

#### 2. XSS Prevention
- ✅ Angular sanitizes templates by default
- ✅ CSP headers configured
- ✅ Input sanitization pipe implemented
- ✅ No `innerHTML` usage without sanitization

#### 3. CSRF Protection
- ✅ CSRF tokens on all state-changing requests
- ✅ SameSite cookie attribute set
- ✅ Origin validation

#### 4. Session Security
- ✅ Secure session cookies (httpOnly, secure, sameSite)
- ✅ Session stored server-side in Redis
- ✅ Session expiration and rotation
- ✅ Cross-tab logout synchronization

#### 5. Authentication Security
- ✅ Password hashing with bcrypt
- ✅ Rate limiting on login endpoint
- ✅ Account lockout after failed attempts (TODO)
- ✅ Strong password requirements

#### 6. Authorization
- ✅ Route guards on protected endpoints
- ✅ Session validation on each request
- ✅ Role-based access control (if needed)

#### 7. Data Exposure
- ✅ Passwords never returned in responses
- ✅ Error messages don't leak sensitive info
- ✅ Validation errors sanitized in production

#### 8. Dependencies
- ✅ Regular `npm audit` checks
- ✅ Automated dependency updates
- ✅ No known vulnerabilities

---

## 🧪 Testing

### Security Test Cases

**File:** `backend/test/security.e2e-spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Security Tests (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Rate Limiting', () => {
    it('should block excessive login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // Make 4 requests (limit is 3 per minute)
      for (let i = 0; i < 4; i++) {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginData);

        if (i < 3) {
          expect(response.status).not.toBe(429);
        } else {
          expect(response.status).toBe(429);
        }
      }
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('email');
    });

    it('should reject SQL injection attempts', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: "admin'--",
          password: 'password',
        });

      expect(response.status).toBe(400);
    });

    it('should reject XSS attempts', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: '<script>alert("xss")</script>@test.com',
          password: 'password',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app.getHttpServer()).get('/auth/status');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

---

## ✅ Deployment Checklist

### Pre-Deployment Security Review

- [ ] All environment variables configured
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Error handling doesn't leak sensitive info
- [ ] CORS configured for production domains
- [ ] Session cookies secure in production
- [ ] CSP configured for production
- [ ] Database credentials secured
- [ ] Redis credentials secured
- [ ] No hardcoded secrets in code
- [ ] `npm audit` shows no vulnerabilities
- [ ] All tests passing
- [ ] Security audit completed

### Production Environment Variables

```bash
# Security
NODE_ENV=production
LOG_LEVEL=warn

# Session
SESSION_SECRET=<strong-random-secret>
SESSION_DURATION=1800000  # 30 minutes

# Database
DB_HOST=<production-db-host>
DB_PORT=5432
DB_USERNAME=<db-user>
DB_PASSWORD=<strong-db-password>
DB_DATABASE=boblogin

# Redis
REDIS_HOST=<production-redis-host>
REDIS_PORT=6379
REDIS_PASSWORD=<strong-redis-password>

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/helmet)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Winston Logger](https://github.com/winstonjs/winston)
- [Rate Limiting with NestJS](https://docs.nestjs.com/security/rate-limiting)

---

**Made with Bob 🤖**

Last updated: May 25, 2026