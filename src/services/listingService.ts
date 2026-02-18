import { Listing, MaterialType, ListingStatus } from '@prisma/client';
import listingRepository from '../repositories/listingRepository';
import aiService from '../integrations/aiService';
import aiLogRepository from '../repositories/aiLogRepository';
import s3Service from '../integrations/s3';
import { calculateRankingScores, sortByRankingScore } from '../utils/ranking';
import { calculateDistance } from '../utils/haversine';
import { CreateListingRequest, FeedQueryParams } from '../types';
import logger from '../config/logger';

class ListingService {
  async createListing(
    sellerId: string,
    data: CreateListingRequest,
    imageFile?: { buffer: Buffer; mimetype: string; originalname: string }
  ): Promise<Listing> {
    let imageUrl = data.imageUrl;

    // Upload image to S3 if provided
    if (imageFile) {
      // Validate image size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (imageFile.buffer.length > maxSize) {
        throw new Error('Image size exceeds 10MB limit');
      }

      // Generate temporary listing ID for S3 key
      const tempId = `temp-${Date.now()}`;
      const s3Key = s3Service.generateListingImageKey(
        tempId,
        imageFile.originalname
      );

      imageUrl = await s3Service.uploadFile(
        imageFile.buffer,
        s3Key,
        imageFile.mimetype
      );
    }

    // Create listing
    const listing = await listingRepository.create({
      title: data.title,
      description: data.description,
      materialType: data.materialType,
      quantity: data.quantity,
      unit: data.unit || 'kg',
      price: data.price,
      currency: data.currency || 'NGN',
      imageUrl,
      latitude: data.latitude,
      longitude: data.longitude,
      location: data.location,
      notes: data.notes,
      status: ListingStatus.ACTIVE,
      seller: {
        connect: { id: sellerId },
      },
    });

    // Call AI service if image is available
    if (imageUrl) {
      this.processAIInference(listing.id, imageUrl, data.materialType).catch(
        (error) => {
          logger.error(
            { error, listingId: listing.id },
            'AI inference failed, continuing without AI data'
          );
        }
      );
    }

    return listing;
  }

  async getListingById(id: string): Promise<Listing | null> {
    return listingRepository.findById(id);
  }

  async getFeed(params: FeedQueryParams): Promise<{
    listings: Listing[];
    scores: Array<{ listingId: string; score: number }>;
  }> {
    // Fetch listings from repository
    let listings = await listingRepository.findFeed(params);

    // Filter by radius if coordinates provided
    if (params.latitude && params.longitude && params.radius) {
      listings = listings.filter((listing) => {
        if (!listing.latitude || !listing.longitude) return false;
        const distance = calculateDistance(
          params.latitude!,
          params.longitude!,
          listing.latitude,
          listing.longitude
        );
        return distance <= params.radius!;
      });
    }

    // Calculate ranking scores
    const rankingScores = calculateRankingScores({
      listings,
      userLatitude: params.latitude,
      userLongitude: params.longitude,
      preferredMaterialType: params.materialType,
      maxDistance: params.radius,
    });

    // Sort by score
    const sortedScores = sortByRankingScore(rankingScores);

    // Reorder listings based on scores
    const sortedListings = sortedScores.map(
      (score) => listings.find((l) => l.id === score.listingId)!
    );

    return {
      listings: sortedListings,
      scores: sortedScores.map((s) => ({
        listingId: s.listingId,
        score: s.score,
      })),
    };
  }

  async updateListingStatus(
    id: string,
    status: ListingStatus,
    sellerId: string
  ): Promise<Listing> {
    // Verify ownership
    const listing = await listingRepository.findById(id);
    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.sellerId !== sellerId) {
      throw new Error('Unauthorized: You can only update your own listings');
    }

    return listingRepository.updateStatus(id, status);
  }

  async getListingsBySeller(sellerId: string): Promise<Listing[]> {
    return listingRepository.findBySellerId(sellerId);
  }

  private async processAIInference(
    listingId: string,
    imageUrl: string,
    userSelectedMaterialType: MaterialType
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const prediction = await aiService.predictMaterialClass(imageUrl);

      if (!prediction) {
        logger.warn({ listingId }, 'AI service returned no prediction');
        return;
      }

      const latency = Date.now() - startTime;

      // Map AI prediction to our MaterialType enum
      const predictedMaterialType = this.mapAIClassToMaterialType(
        prediction.predicted_class
      );

      // Check if user override is needed
      const override =
        predictedMaterialType !== userSelectedMaterialType &&
        prediction.confidence < 0.7;

      // Log AI inference
      await aiLogRepository.create({
        listingId,
        predictedClass: prediction.predicted_class,
        confidenceScore: prediction.confidence,
        override,
        inferenceLatency: latency,
      });

      // Update listing if AI suggests different material type and confidence is high
      if (
        !override &&
        predictedMaterialType &&
        predictedMaterialType !== userSelectedMaterialType
      ) {
        await listingRepository.update(listingId, {
          materialType: predictedMaterialType,
        });
        logger.info(
          { listingId, predictedType: predictedMaterialType },
          'Listing material type updated based on AI prediction'
        );
      }
    } catch (error) {
      logger.error(
        { error, listingId },
        'Error processing AI inference'
      );
    }
  }

  private mapAIClassToMaterialType(aiClass: string): MaterialType | null {
    const classLower = aiClass.toLowerCase();

    if (classLower.includes('wood') || classLower.includes('timber')) {
      return MaterialType.WOOD;
    }
    if (classLower.includes('metal') || classLower.includes('steel')) {
      return MaterialType.METAL;
    }
    if (classLower.includes('plastic') || classLower.includes('polymer')) {
      return MaterialType.PLASTIC;
    }
    if (classLower.includes('glass')) {
      return MaterialType.GLASS;
    }
    if (classLower.includes('cardboard') || classLower.includes('paper')) {
      return MaterialType.CARDBOARD;
    }
    if (classLower.includes('electronic') || classLower.includes('e-waste')) {
      return MaterialType.ELECTRONICS;
    }
    if (classLower.includes('textile') || classLower.includes('fabric')) {
      return MaterialType.TEXTILES;
    }

    return null;
  }
}

export default new ListingService();

