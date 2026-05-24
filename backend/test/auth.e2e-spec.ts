import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as session from 'express-session';
import * as passport from 'passport';

describe('AuthController (e2e)', () => {
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

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'Admin123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'admin@example.com');
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should fail with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);
    });

    it('should fail with invalid password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should fail with missing email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400);
    });

    it('should fail with missing password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
        })
        .expect(400);
    });

    it('should fail with invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('should fail with short password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: '12345',
        })
        .expect(400);
    });
  });

  describe('/auth/session (GET)', () => {
    it('should return session info when authenticated', async () => {
      const agent = request.agent(app.getHttpServer());

      // Login first
      await agent
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'Admin123!',
        })
        .expect(200);

      // Check session
      const response = await agent.get('/auth/session').expect(200);

      expect(response.body).toHaveProperty('authenticated', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'admin@example.com');
    });

    it('should fail when not authenticated', async () => {
      await request(app.getHttpServer()).get('/auth/session').expect(403);
    });
  });

  describe('/auth/status (GET)', () => {
    it('should return authenticated status when logged in', async () => {
      const agent = request.agent(app.getHttpServer());

      // Login first
      await agent
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'Admin123!',
        })
        .expect(200);

      // Check status
      const response = await agent.get('/auth/status').expect(200);

      expect(response.body).toHaveProperty('authenticated', true);
      expect(response.body).toHaveProperty('user');
    });

    it('should return unauthenticated status when not logged in', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/status')
        .expect(200);

      expect(response.body).toHaveProperty('authenticated', false);
      expect(response.body).toHaveProperty('user', null);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout successfully', async () => {
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
      const response = await agent.post('/auth/logout').expect(200);

      expect(response.body).toHaveProperty('message', 'Logout successful');

      // Verify session is destroyed
      await agent.get('/auth/session').expect(403);
    });

    it('should fail when not authenticated', async () => {
      await request(app.getHttpServer()).post('/auth/logout').expect(403);
    });
  });
});

// Made with Bob
