import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as session from 'express-session';
import * as passport from 'passport';

describe('CSRF Protection (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configure session for testing
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
          maxAge: 3600000,
          httpOnly: true,
          secure: false,
        },
      }),
    );

    // Initialize Passport
    app.use(passport.initialize());
    app.use(passport.session());

    // Apply global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('CSRF Token Generation', () => {
    it('should generate CSRF token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/csrf')
        .expect(200);

      expect(response.body).toHaveProperty('csrfToken');
      expect(typeof response.body.csrfToken).toBe('string');
    });

    it('should maintain same token within session', async () => {
      const agent = request.agent(app.getHttpServer());

      const response1 = await agent.get('/auth/csrf').expect(200);
      const token1 = response1.body.csrfToken;

      const response2 = await agent.get('/auth/csrf').expect(200);
      const token2 = response2.body.csrfToken;

      expect(token1).toBe(token2);
    });

    it('should generate different tokens for different sessions', async () => {
      const response1 = await request(app.getHttpServer())
        .get('/auth/csrf')
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get('/auth/csrf')
        .expect(200);

      expect(response1.body.csrfToken).not.toBe(response2.body.csrfToken);
    });
  });

  describe('CSRF Protection on Login', () => {
    it('should allow login without CSRF token (POST is exempt initially)', async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'Admin123!',
        })
        .expect(200);
    });
  });

  describe('CSRF Protection on Logout', () => {
    it('should allow logout without CSRF token (will be protected later)', async () => {
      const agent = request.agent(app.getHttpServer());

      // Login first
      await agent
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'Admin123!',
        })
        .expect(200);

      // Logout
      await agent.post('/auth/logout').expect(200);
    });
  });

  describe('GET requests', () => {
    it('should allow GET requests without CSRF token', async () => {
      await request(app.getHttpServer()).get('/auth/status').expect(200);
    });

    it('should allow GET /auth/csrf without CSRF token', async () => {
      await request(app.getHttpServer()).get('/auth/csrf').expect(200);
    });
  });
});

// Made with Bob
