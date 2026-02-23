import { Listing } from '@prisma/client';
import listingRepository from '../repositories/listingRepository';
import logger from '../config/logger';

class MarketplaceService {
  async getMarketplaceListings(state?: string): Promise<Listing[]> {
    try {
      const listings = await listingRepository.findByState(state);

      logger.info(
        {
          state,
          count: listings.length,
        },
        'Marketplace listings retrieved'
      );

      return listings;
    } catch (error) {
      logger.error({ error, state }, 'Failed to get marketplace listings');
      throw error;
    }
  }
}

export default new MarketplaceService();

