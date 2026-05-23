# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-05-23

### Added

#### Phase 2: User Management & Database Implementation

**Overview:**
Implemented complete user management system with TypeORM and PostgreSQL integration. This phase establishes the foundation for user authentication by creating the database schema, user entity, and all necessary CRUD operations with secure password hashing.

**Database Configuration:**

1. **TypeORM Integration:**
   - Added TypeORM and PostgreSQL dependencies to `backend/package.json`
   - Created `backend/src/config/database.config.ts` for database configuration
   - Configured connection pooling and SSL support for production
   - Enabled auto-loading of entities and synchronization for development
   - Integrated TypeORM with NestJS ConfigService for environment-based configuration

2. **User Entity:**
   - Created `backend/src/users/entities/user.entity.ts`
   - Defined user schema with UUID primary key
   - Fields: id, email (unique), password, firstName, lastName, isActive
   - Automatic timestamps: createdAt, updatedAt
   - Proper TypeORM decorators for all columns

**User Module Implementation:**

1. **Data Transfer Objects (DTOs):**
   - `backend/src/users/dto/create-user.dto.ts` - User creation with validation
   - `backend/src/users/dto/update-user.dto.ts` - Partial user updates
   - Comprehensive validation using class-validator decorators
   - Email validation, string length constraints, required fields

2. **User Service:**
   - Created `backend/src/users/users.service.ts` with full CRUD operations
   - **Security Features:**
     - Password hashing with bcrypt (10 salt rounds)
     - Password validation method for authentication
     - Secure password storage (never returned in queries)
   - **CRUD Operations:**
     - `create()` - Create user with duplicate email check
     - `findAll()` - List all users (excludes password)
     - `findOne()` - Get user by ID (excludes password)
     - `findByEmail()` - Find user by email (includes password for auth)
     - `update()` - Update user with password re-hashing if changed
     - `remove()` - Soft delete (sets isActive to false)
     - `hardDelete()` - Permanent deletion (for testing)
     - `validatePassword()` - Compare plain text with hashed password
   - **Error Handling:**
     - ConflictException for duplicate emails
     - NotFoundException for missing users
     - InternalServerErrorException for unexpected errors

3. **User Module:**
   - Created `backend/src/users/users.module.ts`
   - Registered User entity with TypeORM
   - Exported UsersService for use in other modules (e.g., AuthModule)

**Application Integration:**

1. **App Module Updates:**
   - Modified `backend/src/app.module.ts`
   - Added TypeOrmModule.forRootAsync() with database configuration
   - Imported UsersModule
   - Updated module documentation

2. **Dependencies Added:**
   - `@nestjs/typeorm@^10.0.0` - NestJS TypeORM integration
   - `@nestjs/mapped-types@^2.0.2` - DTO utilities
   - `typeorm@^0.3.17` - TypeORM ORM
   - `pg@^8.11.3` - PostgreSQL driver

**Files Created:**
- `backend/src/users/entities/user.entity.ts`
- `backend/src/users/dto/create-user.dto.ts`
- `backend/src/users/dto/update-user.dto.ts`
- `backend/src/users/users.service.ts`
- `backend/src/users/users.module.ts`
- `backend/src/config/database.config.ts`

**Files Modified:**
- `backend/package.json` - Added TypeORM dependencies
- `backend/src/app.module.ts` - Integrated TypeORM and UsersModule

**Environment Variables Required:**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=authdb
DB_USER=authuser
DB_PASSWORD=devpassword123
```

**Next Steps:**
Before running the application, users must:
1. Run `npm install` in the backend directory to install new dependencies
2. Ensure PostgreSQL is running (via Docker or locally)
3. Database tables will be auto-created on first run (development mode)

**Impact:**
- Complete user management foundation established
- Secure password handling with bcrypt
- Ready for authentication module integration (Phase 4)
- Database schema automatically synchronized in development
- Production-ready with proper error handling and validation

---

## [0.1.1] - 2026-05-23

### Fixed

#### Angular Routing Error: NG04002 - Cannot match any routes for 'dashboard'

**Problem Description:**
The Angular application was throwing a critical routing error `NG04002: Cannot match any routes. URL Segment: 'dashboard'`. This occurred because the application's root route (`app-routing.module.ts`) was configured to redirect to `/dashboard`, but the dashboard route was commented out and the dashboard component/module did not exist.

**Root Cause:**
- The `app-routing.module.ts` had a redirect from root path (`''`) to `/dashboard`
- The dashboard route configuration was commented out in the routes array
- No dashboard component or module files existed in `frontend/src/app/features/dashboard/`
- This caused the router to fail when trying to navigate to the dashboard path

**Technical Changes:**

1. **Created Dashboard Component Files:**
   - `frontend/src/app/features/dashboard/dashboard.component.ts` - Main component class with proper Angular decorators
   - `frontend/src/app/features/dashboard/dashboard.component.html` - Template with basic dashboard structure
   - `frontend/src/app/features/dashboard/dashboard.component.scss` - Styles for dashboard container and elements

2. **Created Dashboard Module:**
   - `frontend/src/app/features/dashboard/dashboard.module.ts` - Feature module with lazy loading configuration
   - Configured child routes within the module
   - Declared DashboardComponent in the module
   - Imported CommonModule and RouterModule.forChild()

3. **Updated App Routing Configuration:**
   - Modified `frontend/src/app/app-routing.module.ts`
   - Uncommented and activated the dashboard route
   - Configured lazy loading: `loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)`
   - Route now properly resolves the '/dashboard' path

**Files Created:**
- `frontend/src/app/features/dashboard/dashboard.component.ts`
- `frontend/src/app/features/dashboard/dashboard.component.html`
- `frontend/src/app/features/dashboard/dashboard.component.scss`
- `frontend/src/app/features/dashboard/dashboard.module.ts`

**Files Modified:**
- `frontend/src/app/app-routing.module.ts`

**Impact:**
- Application now successfully routes to the dashboard on initial load
- No more NG04002 routing errors
- Dashboard feature is properly lazy-loaded for optimal performance
- Foundation established for future dashboard functionality

**Testing:**
After these changes, the application should:
1. Load without routing errors
2. Successfully redirect from root (`/`) to `/dashboard`
3. Display the dashboard component with "Welcome to your dashboard!" message
4. Lazy-load the dashboard module only when the route is accessed

---

## [0.1.0] - 2026-05-23

### Added
- Initial project setup with Angular frontend and NestJS backend
- Docker configuration for development environment
- Session management with Redis
- CORS configuration
- Project documentation (README.md, HOW_TO_RUN.md, PROJECT_SPECIFICATION.md)