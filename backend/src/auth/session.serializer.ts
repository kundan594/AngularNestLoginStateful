import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';

/**
 * Session Serializer for Passport
 * 
 * Handles serialization and deserialization of user data in sessions
 * - serializeUser: Stores minimal user data (ID) in session
 * - deserializeUser: Retrieves full user object from ID
 */
@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private authService: AuthService) {
    super();
  }

  /**
   * Serialize user for session storage
   * Only stores user ID to minimize session data
   * 
   * @param user - User object from authentication
   * @param done - Callback function
   */
  serializeUser(user: User, done: (err: Error | null, userId: string) => void): void {
    done(null, user.id);
  }

  /**
   * Deserialize user from session
   * Retrieves full user object from stored ID
   * 
   * @param userId - User ID from session
   * @param done - Callback function
   */
  async deserializeUser(
    userId: string,
    done: (err: Error | null, user: User | null) => void,
  ): Promise<void> {
    try {
      const user = await this.authService.getUserById(userId);
      done(null, user);
    } catch (error) {
      done(error as Error, null);
    }
  }
}

// Made with Bob
