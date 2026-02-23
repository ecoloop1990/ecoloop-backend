import { Request, Response, NextFunction } from 'express';
import marketplaceService from '../services/marketplaceService';
import { AppError } from '../middlewares/errorHandler';
import logger from '../config/logger';

export const getMarketplace = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const state = req.query.state as string | undefined;

    const listings = await marketplaceService.getMarketplaceListings(state);

    res.status(200).json({
      listings,
      count: listings.length,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get marketplace listings');
    if (error instanceof Error) {
      next(new AppError(error.message, 400));
      return;
    }
    next(error);
  }
};

