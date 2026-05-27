# Comprehensive Testing Guide

## Angular + NestJS Authentication System

This guide provides detailed instructions for testing the authentication system, including unit tests, integration tests, E2E tests, performance testing, and load testing.

---

## Table of Contents

- [Testing Overview](#testing-overview)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [E2E Testing](#e2e-testing)
- [Performance Testing](#performance-testing)
- [Load Testing](#load-testing)
- [Security Testing](#security-testing)
- [Test Coverage](#test-coverage)
- [CI/CD Integration](#cicd-integration)

---

## Testing Overview

### Testing Pyramid

```
        /\
       /  \
      / E2E \
     /--------\
    /          \
   / Integration \
  /--------------\
 /                \
/   Unit Tests     \
--------------------
```

**Distribution:**
- **Unit Tests**: 70% - Fast, isolated, many
- **Integration Tests**: 20% - Medium speed, component interaction
- **E2E Tests**: 10% - Slow, full system, critical paths

### Test Environment Setup

```bash
# Install dependencies
npm install

# Backend tests
cd backend
npm test                    # Unit tests
npm run test:watch         # Watch mode
npm run test:cov           # Coverage report
npm run test:e2e           # E2E tests

# Frontend tests
cd frontend
npm test                    # Unit tests
npm run test:coverage      # Coverage report
ng e2e                     # E2E tests
```

---

## Unit Testing

### Backend Unit Tests (Jest)

#### Testing Services

**Example: AuthService Test**
```typescript
// backend/src/auth/auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByUsername: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: await bcrypt.hash('password123', 10),
      };

      jest.spyOn(usersService, 'findByUsername').mockResolvedValue(mockUser);

      const result = await service.validateUser('testuser', 'password123');

      expect(result).toBeDefined();
      expect(result.username).toBe('testuser');
      expect(result.password).toBeUndefined(); // Password should be removed
    });

    it('should return null when credentials are invalid', async () => {
      jest.spyOn(usersService, 'findByUsername').mockResolvedValue(null);

      const result = await service.validateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return null when password does not match', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: await bcrypt.hash('password123', 10),
      };

      jest.spyOn(usersService, 'findByUsername').mockResolvedValue(mockUser);

      const result = await service.validateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });
  });
});
```

#### Testing Controllers

**Example: AuthController Test**
```typescript
// backend/src/auth/auth.controller.spec.ts
describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let csrfService: CsrfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
          },
        },
        {
          provide: CsrfService,
          useValue: {
            generateCsrfToken: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    csrfService = module.get<CsrfService>(CsrfService);
  });

  describe('getCsrfToken', () => {
    it('should return CSRF token', () => {
      const mockToken = 'mock-csrf-token';
      jest.spyOn(csrfService, 'generateCsrfToken').mockReturnValue(mockToken);

      const result = controller.getCsrfToken({} as any);

      expect(result).toEqual({ csrfToken: mockToken });
    });
  });

  describe('login', () => {
    it('should return user on successful login', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      const mockRequest = {
        user: mockUser,
        session: { save: jest.fn((cb) => cb()) },
      };

      const result = await controller.login(mockRequest as any);

      expect(result).toEqual({
        message: 'Login successful',
        user: mockUser,
      });
    });
  });
});
```

#### Testing Guards

**Example: CSRF Guard Test**
```typescript
// backend/src/auth/guards/csrf.guard.spec.ts
describe('CsrfGuard', () => {
  let guard: CsrfGuard;

  beforeEach(() => {
    guard = new CsrfGuard();
  });

  it('should allow request with valid CSRF token', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-csrf-token': 'valid-token' },
          session: { csrfToken: 'valid-token' },
        }),
      }),
    } as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should reject request with invalid CSRF token', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-csrf-token': 'invalid-token' },
          session: { csrfToken: 'valid-token' },
        }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should reject request with missing CSRF token', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
          session: { csrfToken: 'valid-token' },
        }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });
});
```

### Frontend Unit Tests (Jasmine/Karma)

#### Testing Services

**Example: AuthService Test**
```typescript
// frontend/src/app/core/services/auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('login', () => {
    it('should login user and return user data', () => {
      const mockUser = { id: 1, username: 'testuser' };
      const credentials = { username: 'testuser', password: 'password123' };

      service.login(credentials).subscribe((user) => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush({ user: mockUser });
    });

    it('should handle login error', () => {
      const credentials = { username: 'testuser', password: 'wrong' };

      service.login(credentials).subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.status).toBe(401);
        }
      );

      const req = httpMock.expectOne('/api/auth/login');
      req.flush('Invalid credentials', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    it('should logout user', () => {
      service.logout().subscribe((response) => {
        expect(response.message).toBe('Logout successful');
      });

      const req = httpMock.expectOne('/api/auth/logout');
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Logout successful' });
    });
  });
});
```

#### Testing Components

**Example: LoginComponent Test**
```typescript
// frontend/src/app/features/auth/login/login.component.spec.ts
describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have invalid form when empty', () => {
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('should validate username field', () => {
    const username = component.loginForm.controls['username'];
    
    expect(username.valid).toBeFalsy();
    expect(username.errors?.['required']).toBeTruthy();

    username.setValue('ab');
    expect(username.errors?.['minlength']).toBeTruthy();

    username.setValue('validuser');
    expect(username.valid).toBeTruthy();
  });

  it('should call authService.login on form submit', () => {
    const mockUser = { id: 1, username: 'testuser' };
    authService.login.and.returnValue(of(mockUser));

    component.loginForm.setValue({
      username: 'testuser',
      password: 'password123',
    });

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'password123',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
```

---

## Integration Testing

### Backend Integration Tests

**Example: Auth Integration Test**
```typescript
// backend/test/auth.integration.spec.ts
describe('Auth Integration', () => {
  let app: INestApplication;
  let usersService: UsersService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    usersService = moduleFixture.get<UsersService>(UsersService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      // 1. Get CSRF token
      const csrfResponse = await request(app.getHttpServer())
        .get('/auth/csrf')
        .expect(200);

      const csrfToken = csrfResponse.body.csrfToken;
      expect(csrfToken).toBeDefined();

      // 2. Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-CSRF-Token', csrfToken)
        .send({ username: 'testuser', password: 'Test123!@#' })
        .expect(200);

      expect(loginResponse.body.user).toBeDefined();
      const cookies = loginResponse.headers['set-cookie'];

      // 3. Access protected route
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', cookies)
        .expect(200);

      // 4. Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', csrfToken)
        .expect(200);

      // 5. Verify logout
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', cookies)
        .expect(401);
    });
  });
});
```

---

## E2E Testing

### Existing E2E Tests

The project includes comprehensive E2E tests:

1. **auth.e2e-spec.ts** - Authentication flow testing
2. **csrf.e2e-spec.ts** - CSRF protection testing
3. **security.e2e-spec.ts** - Security features testing
4. **users.e2e-spec.ts** - User management testing

### Running E2E Tests

```bash
# Backend E2E tests
cd backend
npm run test:e2e

# Frontend E2E tests (if configured)
cd frontend
ng e2e
```

### E2E Test Example

```typescript
// backend/test/auth.e2e-spec.ts
describe('Authentication (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/login (POST) - successful login', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'testuser', password: 'Test123!@#' })
      .expect(200)
      .expect((res) => {
        expect(res.body.user).toBeDefined();
        expect(res.body.user.password).toBeUndefined();
      });
  });

  it('/auth/login (POST) - invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'testuser', password: 'wrongpassword' })
      .expect(401);
  });
});
```

---

## Performance Testing

### Tools

1. **Apache Bench (ab)**
2. **Artillery**
3. **k6**
4. **JMeter**

### Performance Test Scenarios

#### 1. Response Time Testing

**Using Apache Bench:**
```bash
# Test login endpoint
ab -n 1000 -c 10 -p login.json -T application/json \
   http://localhost:3000/auth/login

# login.json
{
  "username": "testuser",
  "password": "Test123!@#"
}
```

**Expected Results:**
- Average response time: < 100ms
- 95th percentile: < 200ms
- 99th percentile: < 500ms

#### 2. Throughput Testing

**Using Artillery:**
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"

scenarios:
  - name: "Authentication flow"
    flow:
      - get:
          url: "/auth/csrf"
          capture:
            - json: "$.csrfToken"
              as: "csrfToken"
      - post:
          url: "/auth/login"
          headers:
            X-CSRF-Token: "{{ csrfToken }}"
          json:
            username: "testuser"
            password: "Test123!@#"
      - get:
          url: "/auth/me"
```

**Run test:**
```bash
artillery run artillery-config.yml
```

**Expected Results:**
- Requests per second: > 100
- Error rate: < 1%
- P95 latency: < 200ms

#### 3. Stress Testing

**Using k6:**
```javascript
// stress-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Spike to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],    // Error rate under 1%
  },
};

export default function () {
  // Get CSRF token
  let csrfRes = http.get('http://localhost:3000/auth/csrf');
  check(csrfRes, {
    'CSRF token received': (r) => r.status === 200,
  });

  let csrfToken = csrfRes.json('csrfToken');

  // Login
  let loginRes = http.post(
    'http://localhost:3000/auth/login',
    JSON.stringify({
      username: 'testuser',
      password: 'Test123!@#',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
    }
  );

  check(loginRes, {
    'Login successful': (r) => r.status === 200,
  });

  sleep(1);
}
```

**Run test:**
```bash
k6 run stress-test.js
```

### Performance Benchmarks

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| Response Time (avg) | < 100ms | < 200ms | > 500ms |
| Response Time (p95) | < 200ms | < 500ms | > 1000ms |
| Throughput | > 100 req/s | > 50 req/s | < 50 req/s |
| Error Rate | < 0.1% | < 1% | > 1% |
| CPU Usage | < 50% | < 70% | > 80% |
| Memory Usage | < 512MB | < 1GB | > 1GB |

---

## Load Testing

### Load Test Scenarios

#### 1. Baseline Load Test

**Objective:** Establish baseline performance

**Configuration:**
- Users: 50 concurrent
- Duration: 10 minutes
- Ramp-up: 2 minutes

**Expected:**
- All requests successful
- Response time stable
- No memory leaks

#### 2. Sustained Load Test

**Objective:** Test system under normal load

**Configuration:**
- Users: 100 concurrent
- Duration: 30 minutes
- Ramp-up: 5 minutes

**Expected:**
- Error rate < 0.1%
- Response time < 200ms (p95)
- Resource usage stable

#### 3. Peak Load Test

**Objective:** Test system under peak load

**Configuration:**
- Users: 500 concurrent
- Duration: 15 minutes
- Ramp-up: 5 minutes

**Expected:**
- Error rate < 1%
- Response time < 500ms (p95)
- Graceful degradation

#### 4. Spike Test

**Objective:** Test system recovery from sudden load

**Configuration:**
- Normal: 100 users
- Spike: 1000 users (2 minutes)
- Duration: 20 minutes

**Expected:**
- System remains stable
- Quick recovery after spike
- No crashes

### Load Testing with Artillery

**Complete Load Test Configuration:**
```yaml
# load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    # Baseline
    - duration: 120
      arrivalRate: 5
      name: "Baseline"
    
    # Ramp up
    - duration: 300
      arrivalRate: 5
      rampTo: 50
      name: "Ramp up"
    
    # Sustained load
    - duration: 600
      arrivalRate: 50
      name: "Sustained load"
    
    # Peak load
    - duration: 300
      arrivalRate: 50
      rampTo: 100
      name: "Peak load"
    
    # Spike
    - duration: 120
      arrivalRate: 200
      name: "Spike"
    
    # Recovery
    - duration: 300
      arrivalRate: 200
      rampTo: 50
      name: "Recovery"
    
    # Ramp down
    - duration: 120
      arrivalRate: 50
      rampTo: 0
      name: "Ramp down"

  processor: "./load-test-processor.js"

scenarios:
  - name: "Full user journey"
    weight: 70
    flow:
      - function: "getCsrfToken"
      - function: "login"
      - think: 5
      - function: "getProfile"
      - think: 10
      - function: "updateProfile"
      - think: 5
      - function: "logout"

  - name: "Browse only"
    weight: 30
    flow:
      - function: "getCsrfToken"
      - function: "login"
      - think: 3
      - function: "getProfile"
      - think: 5
      - function: "logout"
```

**Processor Functions:**
```javascript
// load-test-processor.js
module.exports = {
  getCsrfToken: function(context, events, done) {
    // Implementation
    return done();
  },
  
  login: function(context, events, done) {
    // Implementation
    return done();
  },
  
  getProfile: function(context, events, done) {
    // Implementation
    return done();
  },
  
  updateProfile: function(context, events, done) {
    // Implementation
    return done();
  },
  
  logout: function(context, events, done) {
    // Implementation
    return done();
  },
};
```

**Run load test:**
```bash
artillery run load-test.yml --output report.json
artillery report report.json
```

---

## Security Testing

### Security Test Checklist

- [ ] SQL Injection testing
- [ ] XSS testing
- [ ] CSRF testing
- [ ] Authentication bypass testing
- [ ] Authorization testing
- [ ] Session management testing
- [ ] Rate limiting testing
- [ ] Input validation testing

### Security Testing Tools

1. **OWASP ZAP** - Automated security scanner
2. **Burp Suite** - Manual security testing
3. **npm audit** - Dependency vulnerability scanning
4. **Snyk** - Continuous security monitoring

### Running Security Tests

```bash
# Dependency audit
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated

# Security scan with Snyk
npx snyk test
```

---

## Test Coverage

### Coverage Goals

| Test Type | Target Coverage |
|-----------|----------------|
| Unit Tests | > 80% |
| Integration Tests | > 60% |
| E2E Tests | Critical paths |

### Generating Coverage Reports

**Backend:**
```bash
cd backend
npm run test:cov

# View report
open coverage/lcov-report/index.html
```

**Frontend:**
```bash
cd frontend
npm run test:coverage

# View report
open coverage/index.html
```

### Coverage Report Analysis

**Good Coverage:**
- All critical paths covered
- Edge cases tested
- Error handling tested
- Security features tested

**Areas to Improve:**
- Low coverage modules
- Untested error paths
- Missing edge cases
- Complex logic without tests

---

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run unit tests
        run: |
          cd backend
          npm test
      
      - name: Run E2E tests
        run: |
          cd backend
          npm run test:e2e
      
      - name: Generate coverage
        run: |
          cd backend
          npm run test:cov
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run tests
        run: |
          cd frontend
          npm test -- --watch=false --browsers=ChromeHeadless
      
      - name: Generate coverage
        run: |
          cd frontend
          npm run test:coverage
```

---

## Best Practices

### Testing Best Practices

1. **Write tests first (TDD)**
   - Define expected behavior
   - Write failing test
   - Implement feature
   - Refactor

2. **Keep tests independent**
   - No shared state
   - Clean up after each test
   - Use beforeEach/afterEach

3. **Test behavior, not implementation**
   - Focus on what, not how
   - Test public API
   - Avoid testing internals

4. **Use descriptive test names**
   ```typescript
   // ❌ Bad
   it('test1', () => {});
   
   // ✅ Good
   it('should return user when credentials are valid', () => {});
   ```

5. **Follow AAA pattern**
   - Arrange: Set up test data
   - Act: Execute the code
   - Assert: Verify results

6. **Mock external dependencies**
   - Database
   - External APIs
   - File system
   - Time/dates

---

**Made with Bob**