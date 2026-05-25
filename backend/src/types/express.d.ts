import { User } from '../users/entities/user.entity';
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    csrfSecret?: string;
  }
}

declare global {
  namespace Express {
    interface User extends User {}
    
    interface Request {
      user?: User;
    }
  }
}

// Made with Bob
