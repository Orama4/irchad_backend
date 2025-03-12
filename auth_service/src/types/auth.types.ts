// auth/types/auth.types.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstname?: string;
  lastname?: string;
  phonenumber?: string;
  address: string;
  role?: string;
}

export interface TokenPayload {
  userId: number;
  email: string;
  role?: string;
}

export interface AuthenticatedRequest extends Express.Request {
  user?: TokenPayload;
}
