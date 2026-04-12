declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        phone?: string;
        role?: string;
        iat?: number;
        exp?: number;
      };
    }
  }
}

export {};
