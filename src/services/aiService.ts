import axios from 'axios';
import logger from '../config/logger';

export interface AIResponse {
  detected_items: string[];
  total_weight: number;
  total_carbon_footprint: number;
}

export class AIService {
  private readonly aiUrl: string;

  constructor() {
    const base = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.aiUrl = base.endsWith('/analyze') ? base : `${base.replace(/\/$/, '')}/analyze`;
  }

  async analyzeImage(imageBuffer: Buffer): Promise<AIResponse> {
    try {
      const response = await axios.post<AIResponse>(this.aiUrl, imageBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      logger.error({ err: error, aiUrl: this.aiUrl }, 'AI service error');
      throw new Error('AI analysis failed. Please try again.');
    }
  }
}


