import { Request, Response, NextFunction } from 'express';
import listingService from '../services/listingService';
import { AppError } from '../middlewares/errorHandler';
import logger from '../config/logger';
import { FeedQueryParams } from '../types';
import { MaterialType } from '../types';

export const createManualListing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      next(new AppError('Unauthorized', 401));
      return;
    }
    if (!req.file) {
      next(new AppError('Image is required', 400));
      return;
    }

    const listing = await listingService.createManualListing(
      req.user.userId,
      req.body,
      req.file
    );

    res.status(201).json({
      message: 'Listing created successfully',
      listing,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to create listing');
    if (error instanceof Error) {
      next(new AppError(error.message, 400));
      return;
    }
    next(error);
  }
};

export const createAIListing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      next(new AppError('Unauthorized', 401));
      return;
    }

    if (!req.file) {
      next(new AppError('Image is required', 400));
      return;
    }

    try {
      const listing = await listingService.createAIListing(req.user.userId, req.body, req.file);

      res.status(201).json({
        message: 'AI listing created successfully',
        listing,
      });
    } catch (err) {
      // AI dependency failure → 502
      if (err instanceof Error && err.message.toLowerCase().includes('ai')) {
        next(new AppError('AI analysis failed. Please try again.', 502));
        return;
      }
      throw err;
    }
  } catch (error) {
    logger.error({ error }, 'Failed to create AI listing');
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

export const getListings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const state = req.query.state as string | undefined;

    const listings = await listingService.getListings(state);

    res.status(200).json({
      listings,
      count: listings.length,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get listings');
    next(error);
  }
};

