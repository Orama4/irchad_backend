import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

interface RegisterData {
  email: string;
  password: string;
  role?: Prisma.UserCreateInput["role"]; // Use the type from Prisma
  profile?: {
    firstname?: string;
    lastname?: string;
    phonenumber?: string;
    address?: string;
  };
}

export const register = async (data: RegisterData) => {
  const hashedPassword = await bcrypt.hash(data.password, 12);

  return prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      role: data.role || "normal",
      profile: data.profile
        ? {
            create: {
              ...data.profile,
              address: data.profile.address || "", // Required field
            },
          }
        : undefined,
    },
    select: {
      id: true,
      email: true,
      role: true,
      profile: true,
    },
  });
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile,
    },
  };
};
