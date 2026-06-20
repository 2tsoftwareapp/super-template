import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import type { CreateImportCommand } from './imports.types';

import { ConfirmImportUseCase } from './use-cases/confirm-import.use-case';
import { CreateImportUseCase } from './use-cases/create-import.use-case';
import { GetImportUseCase } from './use-cases/get-import.use-case';

export type { ImportJobView as ImportJobDto } from './imports.types';

@Injectable()
export class ImportsService {
  constructor(
    private readonly createImportUseCase: CreateImportUseCase,
    private readonly getImportUseCase: GetImportUseCase,
    private readonly confirmImportUseCase: ConfirmImportUseCase,
  ) {}

  create(
    actor: AuthenticatedRequestUser,
    input: CreateImportCommand,
    requestContext?: RequestContext,
  ) {
    return this.createImportUseCase.execute(actor, input, requestContext);
  }

  getById(actor: AuthenticatedRequestUser, jobId: string) {
    return this.getImportUseCase.execute(actor, jobId);
  }

  confirm(
    actor: AuthenticatedRequestUser,
    jobId: string,
    requestContext?: RequestContext,
  ) {
    return this.confirmImportUseCase.execute(actor, jobId, requestContext);
  }
}
