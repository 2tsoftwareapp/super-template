import type { JsonObject } from "@repo/api-core";

import { Injectable } from "@nestjs/common";

export interface MailDeliveryRecord {
  id: string;
  templateKey: string;
  recipient: string;
  subject: string;
  status: string;
  errorMessage: string | null;
  metadata: JsonObject | null;
  sentAt: Date | null;
  createdAt: Date;
}

export interface MailDeliveryView {
  id: string;
  templateKey: string;
  recipient: string;
  subject: string;
  status: string;
  errorMessage: string | null;
  metadata: JsonObject | null;
  sentAt: string | null;
  createdAt: string;
}

@Injectable()
export class MailMapper {
  toDeliveryView(row: MailDeliveryRecord): MailDeliveryView {
    return {
      id: row.id,
      templateKey: row.templateKey,
      recipient: row.recipient,
      subject: row.subject,
      status: row.status,
      errorMessage: row.errorMessage ?? null,
      metadata: row.metadata ?? null,
      sentAt: row.sentAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
