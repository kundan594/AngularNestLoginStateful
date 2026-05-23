# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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