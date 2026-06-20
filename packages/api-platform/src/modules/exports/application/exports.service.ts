import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import type { CreateExportCommand } from './exports.types';

import { CreateExportUseCase } from './use-cases/create-export.use-case';
import { GetExportUseCase } from './use-cases/get-export.use-case';

@Injectable()
export class ExportsService {
  constructor(
    private readonly createExportUseCase: CreateExportUseCase,
    private readonly getExportUseCase: GetExportUseCase,
  ) {}

  async create(
    actor: AuthenticatedRequestUser,
    input: CreateExportCommand,
    requestContext?: RequestContext,
  ) {
    return this.createExportUseCase.execute(actor, input, requestContext);
  }

  async getById(actor: AuthenticatedRequestUser, jobId: string) {
    return this.getExportUseCase.execute(actor, jobId);
  }
}
