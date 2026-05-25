import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthenticatedGuard } from './guards/authenticated.guard';
import { User } from '../users/entities/user.entity';
import { CsrfService } from './csrf.service';

/**
 * Authentication Controller
 *
 * Handles authentication endpoints:
 * - POST /auth/login - User login
 * - POST /auth/logout - User logout
 * - GET /auth/session - Check session status
 * - GET /auth/csrf - Get CSRF token
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly csrfService: CsrfService) {}

  /**
   * Get CSRF token
   * Generates or retrieves CSRF token for the session
   *
   * @param req - Express request
   * @returns CSRF token
   */
  @Get('csrf')
  async getCsrfToken(@Req() req: Request) {
    // Generate CSRF secret if not exists
    if (!req.session.csrfSecret) {
      req.session.csrfSecret = this.csrfService.generateSecret();
    }

    // Generate token from secret
    const token = this.csrfService.generateToken(req.session.csrfSecret);

    return {
      csrfToken: token,
    };
  }

  /**
   * Login endpoint
   * Validates credentials and creates session
   * 
   * @param loginDto - Login credentials
   * @param req - Express request with user
   * @returns User object and success message
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() _loginDto: LoginDto, @Req() req: Request) {
    return {
      message: 'Login successful',
      user: req.user,
    };
  }

  /**
   * Logout endpoint
   * Destroys session and logs out user
   * 
   * @param req - Express request
   * @returns Success message
   */
  @UseGuards(AuthenticatedGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request) {
    return new Promise((resolve, reject) => {
      req.logout((err) => {
        if (err) {
          return reject(err);
        }
        req.session.destroy((err) => {
          if (err) {
            return reject(err);
          }
          resolve({ message: 'Logout successful' });
        });
      });
    });
  }

  /**
   * Check session status
   * Returns current user if authenticated
   * 
   * @param req - Express request
   * @returns User object if authenticated
   */
  @UseGuards(AuthenticatedGuard)
  @Get('session')
  async getSession(@Req() req: Request) {
    return {
      user: req.user as User,
      authenticated: true,
    };
  }

  /**
   * Public endpoint to check if user is authenticated
   * Does not require authentication
   * 
   * @param req - Express request
   * @returns Authentication status
   */
  @Get('status')
  async getStatus(@Req() req: Request) {
    return {
      authenticated: req.isAuthenticated(),
      user: req.isAuthenticated() ? req.user : null,
    };
  }

  /**
   * Keepalive endpoint
   * Extends the session by updating the last activity timestamp
   * Requires authentication
   *
   * @param req - Express request
   * @returns Success message with updated expiry time
   */
  @UseGuards(AuthenticatedGuard)
  @Post('keepalive')
  @HttpCode(HttpStatus.OK)
  async keepalive(@Req() req: Request) {
    // Session is automatically extended by the rolling session configuration
    // Just need to update the lastActivity timestamp in session data
    if (req.session) {
      req.session.lastActivity = Date.now();
    }

    // Calculate new expiry time (2 minutes from now for TESTING)
    // TODO: Change back to 30 minutes for production
    const expiresAt = Date.now() + (2 * 60 * 1000);

    return {
      message: 'Session extended',
      expiresAt,
    };
  }
}

// Made with Bob
