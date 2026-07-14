import type { JsonObject } from '@repo/api-core';
import type { TransactionExecutor } from '@repo/api-core';

export interface MailDeliveriesRepositoryPort {
  create(
    values: {
      templateKey: string;
      recipient: string;
      subject: string;
      status: 'SENT' | 'FAILED';
      errorMessage?: string | null;
      metadata?: JsonObject | null;
      sentAt?: Date | null;
    },
    executor?: TransactionExecutor,
  ): Promise<{
    id: string;
    templateKey: string;
    recipient: string;
    subject: string;
    status: string;
    errorMessage: string | null;
    metadata: JsonObject | null;
    sentAt: Date | null;
    createdAt: Date;
  } | null>;

  list(
    params: {
      page: number;
      limit: number;
      templateKey?: string;
      status?: 'SENT' | 'FAILED';
    },
    executor?: TransactionExecutor,
  ): Promise<{
    rows: {
      id: string;
      templateKey: string;
      recipient: string;
      subject: string;
      status: string;
      errorMessage: string | null;
      metadata: JsonObject | null;
      sentAt: Date | null;
      createdAt: Date;
    }[];
    total: number;
  }>;
}

export const MAIL_DELIVERIES_REPOSITORY = Symbol('MAIL_DELIVERIES_REPOSITORY');
