// Shared pagination vocabulary. Single source of truth for the default page
// size and the allowed page-size options across the NestJS API, the web/admin
// BFFs, and the Flutter app (via the generated artifact).

export const DEFAULT_PAGE_SIZE = 20;

export const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100] as const;

export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

/** Largest selectable page size — the upper bound the API must accept. */
export const MAX_PAGE_SIZE: number = Math.max(...PAGE_SIZE_OPTIONS);
