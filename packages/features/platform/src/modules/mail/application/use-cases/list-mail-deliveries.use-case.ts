import { Inject, Injectable } from "@nestjs/common";

import { MailMapper } from "../mail.mapper";
import {
  MAIL_DELIVERIES_REPOSITORY,
  type MailDeliveriesRepositoryPort,
} from "../ports/mail-deliveries.repository.port";

export interface ListMailDeliveriesQuery {
  page: number;
  limit: number;
  templateKey?: string;
  status?: "SENT" | "FAILED";
}

@Injectable()
export class ListMailDeliveriesUseCase {
  constructor(
    @Inject(MAIL_DELIVERIES_REPOSITORY)
    private readonly mailDeliveriesRepository: MailDeliveriesRepositoryPort,
    private readonly mailMapper: MailMapper,
  ) {}

  async execute(query: ListMailDeliveriesQuery) {
    const result = await this.mailDeliveriesRepository.list({
      page: query.page,
      limit: query.limit,
      ...(query.templateKey !== undefined ? { templateKey: query.templateKey } : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
    });

    return {
      rows: result.rows.map((row) => this.mailMapper.toDeliveryView(row)),
      total: result.total,
    };
  }
}
