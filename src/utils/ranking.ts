import { Listing, MaterialType } from '@prisma/client';
import { calculateDistance, normalizeDistance } from './haversine';
import { RankingScore } from '../types';

interface RankingParams {
  listings: Listing[];
  userLatitude?: number;
  userLongitude?: number;
  preferredMaterialType?: MaterialType;
  maxDistance?: number; // in kilometers
}

/**
 * Calculate ranking score for listings
 * Score = (Material match weight × 0.4) + (Proximity weight × 0.4) + (Recency weight × 0.2)
 */
export const calculateRankingScores = (params: RankingParams): RankingScore[] => {
  const {
    listings,
    userLatitude,
    userLongitude,
    preferredMaterialType,
    maxDistance = 100,
  } = params;

  const now = Date.now();
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  return listings.map((listing) => {
    // Material match score (0-1)
    let materialMatch = 0.5; // Default neutral score
    if (preferredMaterialType && listing.materialType === preferredMaterialType) {
      materialMatch = 1.0;
    } else if (preferredMaterialType) {
      materialMatch = 0.2; // Lower score for different material type
    }

    // Proximity score (0-1)
    let proximity = 0.5; // Default neutral score
    if (
      userLatitude &&
      userLongitude &&
      listing.latitude &&
      listing.longitude
    ) {
      const distance = calculateDistance(
        userLatitude,
        userLongitude,
        listing.latitude,
        listing.longitude
      );
      proximity = normalizeDistance(distance, maxDistance);
    }

    // Recency score (0-1)
    // Newer listings get higher scores
    const listingAge = now - listing.createdAt.getTime();
    const recency = Math.max(0, 1 - listingAge / maxAge);

    // Calculate final score
    const score =
      materialMatch * 0.4 + proximity * 0.4 + recency * 0.2;

    return {
      listingId: listing.id,
      score,
      materialMatch,
      proximity,
      recency,
    };
  });
};

/**
 * Sort listings by ranking score (descending)
 */
export const sortByRankingScore = (
  scores: RankingScore[]
): RankingScore[] => {
  return scores.sort((a, b) => b.score - a.score);
};

