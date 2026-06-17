import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { EnvironmentService } from '@repo/api-core';

import type {
  ObjectStorage,
  UploadInput,
  UploadResult,
} from '../application/object-storage.interface';

@Injectable()
export class S3ObjectStorage implements ObjectStorage {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly environmentService: EnvironmentService) {
    const env = this.environmentService.values;
    this.bucket = env.S3_BUCKET ?? '';

    const config = {
      region: env.S3_REGION ?? 'us-east-1',
      forcePathStyle: Boolean(env.S3_ENDPOINT),
      ...(env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
        ? {
            credentials: {
              accessKeyId: env.S3_ACCESS_KEY_ID,
              secretAccessKey: env.S3_SECRET_ACCESS_KEY,
            },
          }
        : {}),
      ...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT } : {}),
    };

    this.client = new S3Client(config);
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.mimeType,
      }),
    );

    return { key: input.key };
  }

  async read(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    const body = response.Body;

    if (!body) {
      throw new Error('S3 object body is empty');
    }

    return Buffer.from(await body.transformToByteArray());
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
      { expiresIn: expiresInSeconds },
    );
  }
}
