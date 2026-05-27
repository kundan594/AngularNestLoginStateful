import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Security Tests (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply same validation pipe as main app
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
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
    }, 10000);
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
      expect(response.body.message).toBeDefined();
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

    it('should reject XSS attempts in email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: '<script>alert("xss")</script>@test.com',
          password: 'password',
        });

      expect(response.status).toBe(400);
    });

    it('should reject password that is too short', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'short',
        });

      expect(response.status).toBe(400);
    });

    it('should reject password that is too long', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'a'.repeat(200),
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
    });

    it('should include CSP headers', async () => {
      const response = await request(app.getHttpServer()).get('/auth/status');

      expect(response.headers['content-security-policy']).toBeDefined();
    });
  });

  describe('CSRF Protection', () => {
    it('should provide CSRF token', async () => {
      const response = await request(app.getHttpServer()).get('/auth/csrf');

      expect(response.status).toBe(200);
      expect(response.body.csrfToken).toBeDefined();
    });
  });

  afterAll(async () => {
    await app.close();
  });
});

// Made with Bob
