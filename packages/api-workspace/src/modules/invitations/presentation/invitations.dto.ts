import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@repo/api-core';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

const invitationEntityTypes = ['organization', 'project'] as const;

export class InvitationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  entityType: string;

  @ApiProperty()
  entityId: string;

  @ApiPropertyOptional()
  role: string | null;

  @ApiProperty()
  invitedById: string;

  @ApiProperty({
    enum: ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'],
  })
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

  @ApiProperty()
  expiresAt: string;

  @ApiPropertyOptional()
  acceptedAt: string | null;

  @ApiPropertyOptional()
  acceptedById: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class CreateInvitationDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ enum: invitationEntityTypes })
  @IsEnum(invitationEntityTypes)
  entityType: 'organization' | 'project';

  @ApiProperty()
  @IsUUID()
  entityId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  role?: string;
}

export class AcceptInvitationDto {
  @ApiProperty()
  @IsString()
  token: string;
}

export class InvitationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: invitationEntityTypes })
  @IsOptional()
  @IsEnum(invitationEntityTypes)
  entityType?: 'organization' | 'project';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({
    enum: ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'],
  })
  @IsOptional()
  @IsEnum(['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'])
  status?: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
}
