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

/**
 * Authentication Controller
 * 
 * Handles authentication endpoints:
 * - POST /auth/login - User login
 * - POST /auth/logout - User logout
 * - GET /auth/session - Check session status
 */
@Controller('auth')
export class AuthController {
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
}

// Made with Bob
