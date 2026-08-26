import { Injectable } from "@nestjs/common";

import type { Jwk } from "../domain/oidc-verify";

const DEFAULT_TTL_MS = 60 * 60 * 1000;

interface CacheEntry {
  jwks: Jwk[];
  expiresAt: number;
}

@Injectable()
export class JwksCacheService {
  private readonly cache = new Map<string, CacheEntry>();

  async fetch(jwksUri: string): Promise<Jwk[]> {
    const cached = this.cache.get(jwksUri);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.jwks;
    }

    const response = await fetch(jwksUri);

    if (!response.ok) {
      throw new Error(`Failed to fetch JWKS from ${jwksUri}: ${response.status}`);
    }

    const body = (await response.json()) as { keys: Jwk[] };
    this.cache.set(jwksUri, {
      jwks: body.keys,
      expiresAt: Date.now() + DEFAULT_TTL_MS,
    });

    return body.keys;
  }
}
