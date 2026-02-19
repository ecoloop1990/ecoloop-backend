import prisma from '../config/database';
import {
  Listing,
  ListingStatus,
  Prisma,
} from '@prisma/client';
import { FeedQueryParams } from '../types';

class ListingRepository {
  async create(data: Prisma.ListingCreateInput): Promise<Listing> {
    return prisma.listing.create({
      data,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
    });
  }

  async findById(id: string): Promise<Listing | null> {
    return prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
    });
  }

  async findBySellerId(sellerId: string): Promise<Listing[]> {
    return prisma.listing.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findFeed(params: FeedQueryParams): Promise<Listing[]> {
    const {
      latitude,
      longitude,
      materialType,
      minPrice,
      maxPrice,
      limit = 50,
      offset = 0,
    } = params;

    const where: Prisma.ListingWhereInput = {
      status: {
        not: 'COMPLETED',
      },
    };

    // Filter by material type
    if (materialType) {
      where.materialType = materialType;
    }

    // Filter by price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    // Filter by location (if coordinates provided)
    if (latitude && longitude) {
      // Note: Prisma doesn't support native geospatial queries
      // We'll filter in memory after fetching
      // For production, consider using PostGIS extension
      where.latitude = { not: null };
      where.longitude = { not: null };
    }

    return prisma.listing.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async updateStatus(
    id: string,
    status: ListingStatus
  ): Promise<Listing> {
    return prisma.listing.update({
      where: { id },
      data: { status },
    });
  }

  async update(id: string, data: Partial<Listing>): Promise<Listing> {
    return prisma.listing.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.listing.delete({
      where: { id },
    });
  }
}

export default new ListingRepository();

