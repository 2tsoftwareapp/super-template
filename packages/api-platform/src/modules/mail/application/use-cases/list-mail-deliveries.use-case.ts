import { Injectable } from '@nestjs/common';

import { MailDeliveriesRepository } from '../../infrastructure/mail-deliveries.repository';

export interface ListMailDeliveriesQuery {
  page: number;
  limit: number;
  templateKey?: string;
  status?: 'SENT' | 'FAILED';
}

@Injectable()
export class ListMailDeliveriesUseCase {
  constructor(
    private readonly mailDeliveriesRepository: MailDeliveriesRepository,
  ) {}

  async execute(query: ListMailDeliveriesQuery) {
    const result = await this.mailDeliveriesRepository.list({
      page: query.page,
      limit: query.limit,
      ...(query.templateKey !== undefined
        ? { templateKey: query.templateKey }
        : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
    });

    return {
      rows: result.rows.map((row) => ({
        id: row.id,
        templateKey: row.templateKey,
        recipient: row.recipient,
        subject: row.subject,
        status: row.status,
        errorMessage: row.errorMessage ?? null,
        metadata: row.metadata ?? null,
        sentAt: row.sentAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
      })),
      total: result.total,
    };
  }
}
