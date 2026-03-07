import axios from 'axios';
import FormData from 'form-data';
import logger from '../config/logger';

export interface DetectedItem {
  name: string;
  material: string;
  weight: number;
  carbon_footprint: number;
}

export interface AIResponse {
  detected_items: DetectedItem[];
  total_weight: number;
  total_carbon_footprint: number;
}

export class AIService {
  private readonly aiUrl: string;

  constructor() {
    const base = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    // Spec: POST {AI_SERVICE_URL}/analyze with form-data:file
    this.aiUrl = `${base.replace(/\/$/, '')}/analyze`;
  }

  async analyzeImage(imageBuffer: Buffer): Promise<AIResponse> {
    try {
      const form = new FormData();
      form.append('file', imageBuffer, { filename: 'image.jpg' });

      const response = await axios.post<AIResponse>(this.aiUrl, form, {
        headers: form.getHeaders(),
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      logger.error('AI service error:', error);

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('AI analysis timed out');
        }

        if (error.response) {
          throw new Error(`AI service error: ${error.response.status}`);
        }
      }

      throw new Error('AI analysis failed. Please try again.');
    }
  }
}


