import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

/**
 * Authentication Service
 * 
 * Handles user authentication logic including:
 * - Credential validation
 * - Password verification
 * - User lookup
 */
@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  /**
   * Validates user credentials
   * 
   * @param email - User's email address
   * @param password - User's password (plain text)
   * @returns User object without password if valid, null otherwise
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    // Find user by email (includes password for validation)
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      return null;
    }

    // Check if user account is active
    if (!user.isActive) {
      return null;
    }

    // Validate password
    const isPasswordValid = await this.usersService.validatePassword(
      user,
      password,
    );

    if (!isPasswordValid) {
      return null;
    }

    // Remove password from user object before returning
    const { password: _, ...result } = user;
    return result as User;
  }

  /**
   * Get user by ID for session serialization
   * 
   * @param userId - User's UUID
   * @returns User object without password
   */
  async getUserById(userId: string): Promise<User | null> {
    return this.usersService.findOne(userId);
  }
}

// Made with Bob
