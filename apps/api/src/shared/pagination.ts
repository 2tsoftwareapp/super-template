export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** The only place that turns rows + total into page metadata. */
export function buildPageMeta(total: number, page: number, limit: number): PageMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
