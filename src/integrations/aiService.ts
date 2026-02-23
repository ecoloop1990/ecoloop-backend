import axios, { AxiosError } from 'axios';
import { env } from '../config/env';
import logger from '../config/logger';
import { AIPredictionRequest, AIPredictionResponse } from '../types';

class AIService {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = env.AI_SERVICE_URL;
    this.timeout = env.AI_SERVICE_TIMEOUT;
  }

  /**
   * Analyze image and get waste data
   * @param imageFile Image file buffer
   * @returns Analysis result with weight, carbon footprint, and detected items
   */
  async analyzeImage(
    imageFile: Buffer
  ): Promise<{
    total_weight: number;
    total_carbon_footprint: number;
    detected_items: string[];
  } | null> {
    const startTime = Date.now();

    try {
      // Convert buffer to base64 for sending to AI service
      const base64Image = imageFile.toString('base64');

      logger.info({ imageSize: imageFile.length }, 'Sending image to AI service for analysis');

      const response = await axios.post<{
        total_weight: number;
        total_carbon_footprint: number;
        detected_items: string[];
      }>(
        `${this.baseUrl}/analyze`,
        {
          image: base64Image,
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const latency = Date.now() - startTime;

      logger.info(
        {
          totalWeight: response.data.total_weight,
          carbonFootprint: response.data.total_carbon_footprint,
          detectedItems: response.data.detected_items,
          latency,
        },
        'AI analysis successful'
      );

      return response.data;
    } catch (error) {
      const latency = Date.now() - startTime;

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        logger.error(
          {
            error: axiosError.message,
            status: axiosError.response?.status,
            latency,
          },
          'AI service request failed'
        );
      } else {
        logger.error(
          { error, latency },
          'Unexpected error in AI service'
        );
      }

      // Return null instead of throwing to allow graceful fallback
      return null;
    }
  }

  /**
   * Predict material class from image
   * @param imageUrl URL of the image to analyze
   * @returns Prediction result with class and confidence
   */
  async predictMaterialClass(
    imageUrl: string
  ): Promise<AIPredictionResponse | null> {
    const startTime = Date.now();

    try {
      const payload: AIPredictionRequest = { imageUrl };

      logger.info({ imageUrl }, 'Sending request to AI service');

      const response = await axios.post<AIPredictionResponse>(
        `${this.baseUrl}/predict`,
        payload,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const latency = Date.now() - startTime;

      logger.info(
        {
          imageUrl,
          predictedClass: response.data.predicted_class,
          confidence: response.data.confidence,
          latency,
        },
        'AI prediction successful'
      );

      return {
        predicted_class: response.data.predicted_class,
        confidence: response.data.confidence,
      };
    } catch (error) {
      const latency = Date.now() - startTime;

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        logger.error(
          {
            error: axiosError.message,
            status: axiosError.response?.status,
            imageUrl,
            latency,
          },
          'AI service request failed'
        );
      } else {
        logger.error(
          { error, imageUrl, latency },
          'Unexpected error in AI service'
        );
      }

      // Gracefully fall back - return null instead of throwing
      return null;
    }
  }

  /**
   * Check if AI service is available
   * @returns true if service is reachable
   */
  async isAvailable(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/health`, {
        timeout: 2000,
      });
      return true;
    } catch {
      return false;
    }
  }
}

export default new AIService();

