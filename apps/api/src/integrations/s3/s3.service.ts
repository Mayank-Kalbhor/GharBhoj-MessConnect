import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly bucketName: string;
  private readonly cdnDomain: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME') || 'messconnect-media';
    this.cdnDomain = this.configService.get<string>('AWS_CLOUDFRONT_DOMAIN') || 'https://cdn.messconnect.in';
  }

  async getPresignedUploadUrl(key: string, contentType: string): Promise<{ uploadUrl: string; fileUrl: string }> {
    this.logger.log(`Generated pre-signed upload URL for: ${key} (${contentType})`);
    return {
      uploadUrl: `https://${this.bucketName}.s3.ap-south-1.amazonaws.com/${key}?mock_presigned=true`,
      fileUrl: `${this.cdnDomain}/${key}`
    };
  }
}
