import { Listing, ListingStatus, MaterialType, Prisma } from '@prisma/client';
import listingRepository from '../repositories/listingRepository';
import s3Service from '../integrations/s3';
import { calculateRankingScores, sortByRankingScore } from '../utils/ranking';
import { calculateDistance } from '../utils/haversine';
import { CreateListingRequest, FeedQueryParams } from '../types';
import logger from '../config/logger';
import { AIService } from './aiService';

class ListingService {
  private readonly aiService = new AIService();

  /**
   * Manual listing creation flow.
   * Frontend → Backend → DB
   */
  async createManualListing(
    sellerId: string,
    data: CreateListingRequest
  ): Promise<Listing> {
    if (!data.materialType) {
      throw new Error('materialType is required for manual listing creation');
    }

    if (data.weight === undefined || Number.isNaN(Number(data.weight))) {
      throw new Error('weight is required for manual listing creation');
    }

    const weight = Number(data.weight);
    if (weight <= 0) {
      throw new Error('weight must be greater than 0');
    }

    return this.createBaseListing({
      sellerId,
      title: data.title,
      description: data.description,
      materialType: data.materialType,
      quantity: weight,
      unit: data.unit ?? 'kg',
      price: data.price,
      currency: data.currency ?? 'NGN',
      imageUrl: data.imageUrl,
      latitude: data.latitude,
      longitude: data.longitude,
      location: data.location,
      state: data.state,
      notes: data.notes,
      status: ListingStatus.ACTIVE,
      createType: 'manual',
      detectedItems: [],
      totalWeight: weight,
      carbonFootprint: undefined,
    });
  }

  /**
   * AI-powered listing creation flow.
   * Frontend → Backend → AI Service → Backend → DB
   */
  async createAIListing(
    sellerId: string,
    data: CreateListingRequest,
    imageFile: Express.Multer.File
  ): Promise<Listing> {
    if (!imageFile?.buffer) {
      throw new Error('Image is required for AI listing creation');
    }

    // Validate image size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (imageFile.buffer.length > maxSize) {
      throw new Error('Image size exceeds 10MB limit');
    }

    // Upload image to S3
    const tempId = `temp-${Date.now()}`;
    const s3Key = s3Service.generateListingImageKey(tempId, imageFile.originalname);
    const imageUrl = await s3Service.uploadFile(imageFile.buffer, s3Key, imageFile.mimetype);

    // Analyze image via external AI service
    const ai = await this.aiService.analyzeImage(imageFile.buffer);

    const normalizedDetected = ai.detected_items
      .map((i) => i.trim().toUpperCase())
      .filter((i) => i.length > 0);

    // Choose a valid materialType from detected items (enum safety)
    const allowedMaterialTypes = new Set<string>(Object.values(MaterialType));
    const firstDetectedMaterial = normalizedDetected.find((i) => allowedMaterialTypes.has(i));

    if (!firstDetectedMaterial) {
      throw new Error('AI did not detect a valid material type');
    }

    return this.createBaseListing({
      sellerId,
      title: data.title,
      description: data.description,
      materialType: firstDetectedMaterial as MaterialType,
      quantity: ai.total_weight,
      unit: data.unit ?? 'kg',
      price: data.price,
      currency: data.currency ?? 'NGN',
      imageUrl,
      latitude: data.latitude,
      longitude: data.longitude,
      location: data.location,
      state: data.state,
      notes: data.notes,
      status: ListingStatus.ACTIVE,
      createType: 'ai',
      detectedItems: normalizedDetected,
      totalWeight: ai.total_weight,
      carbonFootprint: ai.total_carbon_footprint,
    });
  }

  /**
   * Shared base creation method.
   * MUST contain only Prisma listing creation logic. No AI logic here.
   */
  private async createBaseListing(params: {
    sellerId: string;
    title: string;
    description?: string;
    materialType: MaterialType;
    quantity: number;
    unit: string;
    price: number;
    currency: string;
    imageUrl?: string;
    latitude?: number;
    longitude?: number;
    location?: string;
    state?: string;
    notes?: string;
    status: ListingStatus;
    createType: 'ai' | 'manual';
    detectedItems: string[];
    totalWeight: number;
    carbonFootprint?: number;
  }): Promise<Listing> {
    const data: Prisma.ListingCreateInput = {
      title: params.title,
      description: params.description,
      materialType: params.materialType,
      quantity: params.quantity,
      unit: params.unit,
      price: params.price,
      currency: params.currency,
      imageUrl: params.imageUrl,
      latitude: params.latitude,
      longitude: params.longitude,
      location: params.location,
      state: params.state,
      notes: params.notes,
      status: params.status,
      createType: params.createType,
      detectedItems: params.detectedItems,
      totalWeight: params.totalWeight,
      carbonFootprint: params.carbonFootprint,
      seller: { connect: { id: params.sellerId } },
    };

    const listing = await listingRepository.create(data);

    logger.info(
      { listingId: listing.id, sellerId: params.sellerId, createType: params.createType },
      'Listing created'
    );

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

  // No legacy AI helpers here by design.
}

export default new ListingService();

