import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';
import logger from '../config/logger';

class S3Service {
  private client: S3Client;
  private bucketName: string;

  constructor() {
    this.client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = env.S3_BUCKET_NAME;
  }

  /**
   * Upload file to S3
   * @param file Buffer or stream
   * @param key S3 object key (path)
   * @param contentType MIME type
   * @returns S3 object URL
   */
  async uploadFile(
    file: Buffer,
    key: string,
    contentType: string
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        // ACL: 'public-read', // Adjust based on your security requirements
      });

      await this.client.send(command);

      const url = `https://${this.bucketName}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
      logger.info({ key, url }, 'File uploaded to S3');

      return url;
    } catch (error) {
      logger.error({ error, key }, 'Failed to upload file to S3');
      throw new Error('Failed to upload file to S3');
    }
  }

  /**
   * Generate presigned URL for file access
   * @param key S3 object key
   * @param expiresIn URL expiration time in seconds (default: 1 hour)
   * @returns Presigned URL
   */
  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      return url;
    } catch (error) {
      logger.error({ error, key }, 'Failed to generate presigned URL');
      throw new Error('Failed to generate presigned URL');
    }
  }

  /**
   * Delete file from S3
   * @param key S3 object key
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);
      logger.info({ key }, 'File deleted from S3');
    } catch (error) {
      logger.error({ error, key }, 'Failed to delete file from S3');
      throw new Error('Failed to delete file from S3');
    }
  }

  /**
   * Generate unique S3 key for listing images
   * @param listingId Listing ID
   * @param originalFilename Original filename
   * @returns S3 key
   */
  generateListingImageKey(listingId: string, originalFilename: string): string {
    const timestamp = Date.now();
    const extension = originalFilename.split('.').pop() || 'jpg';
    return `listings/${listingId}/${timestamp}.${extension}`;
  }
}

export default new S3Service();

