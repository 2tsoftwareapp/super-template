import { applyDecorators, type Type } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiProperty,
  getSchemaPath,
} from '@nestjs/swagger';

export class RequestMetaDto {
  @ApiProperty()
  requestId!: string;
}

export class PaginationMetaDto extends RequestMetaDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}

export class SuccessFlagDto {
  @ApiProperty()
  success!: boolean;
}

export class SuccessMessageDto extends SuccessFlagDto {
  @ApiProperty()
  message!: string;
}

export class CountDto {
  @ApiProperty()
  count!: number;
}

const responseDecoratorByStatus = (status: 200 | 201) =>
  status === 201 ? ApiCreatedResponse : ApiOkResponse;

export const ApiDataResponse = <TModel extends Type<unknown>>(
  model: TModel,
  status: 200 | 201 = 200,
) =>
  applyDecorators(
    ApiExtraModels(RequestMetaDto, model),
    responseDecoratorByStatus(status)({
      schema: {
        type: 'object',
        required: ['data', 'meta'],
        properties: {
          data: {
            $ref: getSchemaPath(model),
          },
          meta: {
            $ref: getSchemaPath(RequestMetaDto),
          },
        },
      },
    }),
  );

export const ApiPaginatedResponse = <TModel extends Type<unknown>>(
  model: TModel,
) =>
  applyDecorators(
    ApiExtraModels(PaginationMetaDto, model),
    ApiOkResponse({
      schema: {
        type: 'object',
        required: ['data', 'meta'],
        properties: {
          data: {
            type: 'array',
            items: {
              $ref: getSchemaPath(model),
            },
          },
          meta: {
            $ref: getSchemaPath(PaginationMetaDto),
          },
        },
      },
    }),
  );

export const ApiArrayResponse = <TModel extends Type<unknown>>(model: TModel) =>
  applyDecorators(
    ApiExtraModels(RequestMetaDto, model),
    ApiOkResponse({
      schema: {
        type: 'object',
        required: ['data', 'meta'],
        properties: {
          data: {
            type: 'array',
            items: {
              $ref: getSchemaPath(model),
            },
          },
          meta: {
            $ref: getSchemaPath(RequestMetaDto),
          },
        },
      },
    }),
  );
