export interface ErrorReportContext {
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  userId?: string | null;
  errorCode?: string;
  stack?: string;
  details?: unknown;
  tags?: Record<string, string>;
}
