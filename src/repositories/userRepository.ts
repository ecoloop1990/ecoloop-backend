import prisma from '../config/database';
import { User, UserRole } from '@prisma/client';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  username?: string;
}

class UserRepository {
  async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({
      data,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }
}

export default new UserRepository();

