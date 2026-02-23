import { Request, Response, NextFunction } from 'express';
import listingService from '../services/listingService';
import { AppError } from '../middlewares/errorHandler';
import logger from '../config/logger';
import { FeedQueryParams } from '../types';
import { MaterialType } from '../types';

export const createListing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      next(new AppError('Unauthorized', 401));
      return;
    }

    // Validate createType
    if (!req.body.createType || !['ai', 'manual'].includes(req.body.createType)) {
      next(new AppError('createType must be either "ai" or "manual"', 400));
      return;
    }

    const imageFile = req.file
      ? {
          buffer: req.file.buffer,
          mimetype: req.file.mimetype,
          originalname: req.file.originalname,
        }
      : undefined;

    try {
      const listing = await listingService.createListing(
        req.user.userId,
        req.body,
        imageFile
      );

      res.status(201).json({
        message: 'Listing created successfully',
        listing,
      });
    } catch (error) {
      // Check if it's an AI service error
      if (error instanceof Error && error.message.includes('AI service')) {
        logger.error({ error }, 'AI service error');
        next(new AppError('AI service is currently unavailable. Please try again later.', 502));
        return;
      }
      throw error;
    }
  } catch (error) {
    logger.error({ error }, 'Failed to create listing');
    if (error instanceof Error) {
      next(new AppError(error.message, 400));
      return;
    }
    next(error);
  }
};

export const getListingById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const listing = await listingService.getListingById(id);

    if (!listing) {
      next(new AppError('Listing not found', 404));
      return;
    }

    res.status(200).json({ listing });
  } catch (error) {
    logger.error({ error, listingId: req.params.id }, 'Failed to get listing');
    next(error);
  }
};

export const getFeed = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const params: FeedQueryParams = {
      latitude: req.query.latitude
        ? parseFloat(req.query.latitude as string)
        : undefined,
      longitude: req.query.longitude
        ? parseFloat(req.query.longitude as string)
        : undefined,
      radius: req.query.radius
        ? parseFloat(req.query.radius as string)
        : undefined,
      materialType: req.query.materialType as MaterialType,
      minPrice: req.query.minPrice
        ? parseFloat(req.query.minPrice as string)
        : undefined,
      maxPrice: req.query.maxPrice
        ? parseFloat(req.query.maxPrice as string)
        : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      offset: req.query.offset
        ? parseInt(req.query.offset as string, 10)
        : 0,
    };

    const result = await listingService.getFeed(params);

    res.status(200).json({
      listings: result.listings,
      scores: result.scores,
      count: result.listings.length,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get feed');
    next(error);
  }
};

export const updateListingStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      next(new AppError('Unauthorized', 401));
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    const listing = await listingService.updateListingStatus(
      id,
      status,
      req.user.userId
    );

    res.status(200).json({
      message: 'Listing status updated successfully',
      listing,
    });
  } catch (error) {
    logger.error(
      { error, listingId: req.params.id },
      'Failed to update listing status'
    );
    if (error instanceof Error) {
      next(new AppError(error.message, 400));
      return;
    }
    next(error);
  }
};

export const getMyListings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      next(new AppError('Unauthorized', 401));
      return;
    }

    const listings = await listingService.getListingsBySeller(req.user.userId);

    res.status(200).json({ listings, count: listings.length });
  } catch (error) {
    logger.error({ error }, 'Failed to get user listings');
    next(error);
  }
};

