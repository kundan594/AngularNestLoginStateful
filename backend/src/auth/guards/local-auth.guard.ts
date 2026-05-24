import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Local Authentication Guard
 * 
 * Uses Passport's LocalStrategy for authentication
 * Applied to login endpoint to validate credentials
 * 
 * Usage:
 * @UseGuards(LocalAuthGuard)
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  /**
   * Can activate method with custom error handling
   * 
   * @param context - Execution context
   * @returns Promise resolving to boolean
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = (await super.canActivate(context)) as boolean;
    const request = context.switchToHttp().getRequest();
    await super.logIn(request);
    return result;
  }
}

// Made with Bob
