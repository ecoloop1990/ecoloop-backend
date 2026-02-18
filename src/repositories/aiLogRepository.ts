import prisma from '../config/database';
import { AI_Log, Prisma } from '@prisma/client';

export interface CreateAILogData {
  listingId: string;
  predictedClass: string;
  confidenceScore: number;
  override: boolean;
  inferenceLatency: number;
}

class AILogRepository {
  async create(data: CreateAILogData): Promise<AI_Log> {
    return prisma.aI_Log.create({
      data,
    });
  }

  async findByListingId(listingId: string): Promise<AI_Log[]> {
    return prisma.aI_Log.findMany({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<AI_Log | null> {
    return prisma.aI_Log.findUnique({
      where: { id },
      include: {
        listing: true,
      },
    });
  }

  async getStatistics(listingId?: string): Promise<{
    totalPredictions: number;
    averageConfidence: number;
    averageLatency: number;
    overrideCount: number;
  }> {
    const where: Prisma.AI_LogWhereInput = listingId
      ? { listingId }
      : {};

    const logs = await prisma.aI_Log.findMany({ where });

    if (logs.length === 0) {
      return {
        totalPredictions: 0,
        averageConfidence: 0,
        averageLatency: 0,
        overrideCount: 0,
      };
    }

    const totalPredictions = logs.length;
    const averageConfidence =
      logs.reduce((sum, log) => sum + log.confidenceScore, 0) /
      totalPredictions;
    const averageLatency =
      logs.reduce((sum, log) => sum + log.inferenceLatency, 0) /
      totalPredictions;
    const overrideCount = logs.filter((log) => log.override).length;

    return {
      totalPredictions,
      averageConfidence,
      averageLatency,
      overrideCount,
    };
  }
}

export default new AILogRepository();

