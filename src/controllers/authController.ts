import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import { AppError } from '../middlewares/errorHandler';
import logger from '../config/logger';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user, token } = await authService.register(req.body);

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (error) {
    logger.error({ error }, 'Registration failed');
    if (error instanceof Error) {
      next(new AppError(error.message, 400));
      return;
    }
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user, token } = await authService.login(req.body);

    res.status(200).json({
      message: 'Login successful',
      user,
      token,
    });
  } catch (error) {
    logger.error({ error }, 'Login failed');
    if (error instanceof Error) {
      next(new AppError(error.message, 401));
      return;
    }
    next(error);
  }
};

