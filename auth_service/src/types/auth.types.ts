import { Role } from "@prisma/client";

export interface RegisterData {
  email: string;
  password: string;
  role?: Role;
  profile?: {
    firstname?: string;
    lastname?: string;
    phonenumber?: string;
    address: string;
  };
}

export interface JwtPayload {
  id: number;
  role: Role;
}

export interface RequestWithUser extends Request {
  user?: {
    id: number;
    email: string;
    role: Role;
    profile?: any;
    admin?: any;
    endUser?: any;
    specificRole?: any;
  };
}
