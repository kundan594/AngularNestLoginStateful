import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let createdUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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
    // Clean up test data
    if (createdUserId) {
      const userRepository = dataSource.getRepository(User);
      await userRepository.delete(createdUserId);
    }
    await app.close();
  });

  describe('/users (POST)', () => {
    it('should create a new user', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'e2etest@example.com',
          password: 'TestPassword123!',
          firstName: 'E2E',
          lastName: 'Test',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', 'e2etest@example.com');
          expect(res.body).toHaveProperty('firstName', 'E2E');
          expect(res.body).toHaveProperty('lastName', 'Test');
          expect(res.body).not.toHaveProperty('password');
          createdUserId = res.body.id;
        });
    });

    it('should return 409 if user already exists', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'e2etest@example.com',
          password: 'TestPassword123!',
          firstName: 'E2E',
          lastName: 'Test',
        })
        .expect(409);
    });

    it('should return 400 for invalid email', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123!',
          firstName: 'E2E',
          lastName: 'Test',
        })
        .expect(400);
    });

    it('should return 400 for short password', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'test2@example.com',
          password: 'short',
          firstName: 'E2E',
          lastName: 'Test',
        })
        .expect(400);
    });
  });

  describe('/users (GET)', () => {
    it('should return an array of users', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/users/:id (GET)', () => {
    it('should return a user by id', () => {
      return request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', createdUserId);
          expect(res.body).toHaveProperty('email');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/users/123e4567-e89b-12d3-a456-426614174999')
        .expect(404);
    });

    it('should return 400 for invalid UUID', () => {
      return request(app.getHttpServer())
        .get('/users/invalid-uuid')
        .expect(400);
    });
  });

  describe('/users/:id (PATCH)', () => {
    it('should update a user', () => {
      return request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .send({
          firstName: 'Updated',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('firstName', 'Updated');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .patch('/users/123e4567-e89b-12d3-a456-426614174999')
        .send({
          firstName: 'Updated',
        })
        .expect(404);
    });
  });

  describe('/users/:id (DELETE)', () => {
    it('should soft delete a user', () => {
      return request(app.getHttpServer())
        .delete(`/users/${createdUserId}`)
        .expect(204);
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .delete('/users/123e4567-e89b-12d3-a456-426614174999')
        .expect(404);
    });
  });
});

// Made with Bob