import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import logger from '../config/logger';
import userRepository from '../repositories/userRepository';
import { RegisterRequest, LoginRequest, JWTPayload } from '../types';
import { UserRole, UserType } from '@prisma/client';

class AuthService {
  private readonly saltRounds = 10;

  async register(data: RegisterRequest): Promise<{ user: unknown; token: string }> {
    // Validate passwords match
    if (data.password !== data.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Validate terms acceptance
    if (!data.termsAccepted) {
      throw new Error('Terms and conditions must be accepted');
    }

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Check username uniqueness if provided
    if (data.username) {
      const existingUsername = await userRepository.findByUsername(data.username);
      if (existingUsername) {
        throw new Error('Username already taken');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, this.saltRounds);

    // Create user
    const user = await userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      userType: data.userType || UserType.INDIVIDUAL,
      role: UserRole.SELLER, // Default to SELLER, can be changed later
      username: data.username,
    });

    // Generate JWT token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info({ userId: user.id, email: user.email }, 'User registered successfully');

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async login(data: LoginRequest): Promise<{ user: unknown; token: string }> {
    // Find user by email
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info({ userId: user.id, email: user.email }, 'User logged in successfully');

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });
  }

  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    } catch (error) {
      logger.error({ error }, 'JWT verification failed');
      throw new Error('Invalid or expired token');
    }
  }
}

export default new AuthService();

