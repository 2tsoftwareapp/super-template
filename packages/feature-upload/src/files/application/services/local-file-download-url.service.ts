import { HttpStatus, Injectable } from "@nestjs/common";
import { AppError } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";
import { EnvironmentService } from "@repo/api-runtime";
import { createHmac, timingSafeEqual } from "node:crypto";

const LOCAL_DOWNLOAD_TTL_SECONDS = 3600;

@Injectable()
export class LocalFileDownloadUrlService {
  constructor(private readonly environmentService: EnvironmentService) {}

  get expiresInSeconds(): number {
    return LOCAL_DOWNLOAD_TTL_SECONDS;
  }

  isEnabled(): boolean {
    return this.environmentService.values.STORAGE_DRIVER === "local";
  }

  createSignedUrl(fileId: string, storageKey: string): string {
    const expiresAt = Date.now() + this.expiresInSeconds * 1000;
    const token = this.createToken(fileId, storageKey, expiresAt);
    const baseUrl = this.environmentService.values.API_INTERNAL_URL.replace(/\/$/, "");

    return `${baseUrl}/api/v1/files/${fileId}/download/local?token=${encodeURIComponent(token)}`;
  }

  assertValidToken(fileId: string, storageKey: string, token?: string) {
    if (!token) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        "Download token is required",
        HttpStatus.FORBIDDEN,
      );
    }

    const [expiresAtRaw, providedSignature] = token.split(".", 2);
    const expiresAt = Number(expiresAtRaw);

    if (!providedSignature || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        "Download token is invalid or expired",
        HttpStatus.FORBIDDEN,
      );
    }

    const expectedSignature = this.sign(fileId, storageKey, expiresAt);
    const providedBuffer = Buffer.from(providedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        "Download token is invalid or expired",
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private createToken(fileId: string, storageKey: string, expiresAt: number): string {
    const signature = this.sign(fileId, storageKey, expiresAt);

    return `${expiresAt}.${signature}`;
  }

  private sign(fileId: string, storageKey: string, expiresAt: number): string {
    return createHmac("sha256", this.environmentService.values.JWT_ACCESS_SECRET)
      .update(`${fileId}:${storageKey}:${expiresAt}`)
      .digest("hex");
  }
}
