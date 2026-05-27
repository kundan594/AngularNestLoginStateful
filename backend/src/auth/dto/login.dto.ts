import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Data Transfer Object for user login
 *
 * Validates login credentials with:
 * - Valid email format
 * - Non-empty password with minimum length
 */
export class LoginDto {
  /**
   * User's email address
   * Must be a valid email format
   */
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  /**
   * User's password
   * Must be at least 8 characters long
   */
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password!: string;
}

// Made with Bob
