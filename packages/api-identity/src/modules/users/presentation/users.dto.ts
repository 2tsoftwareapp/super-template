import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PaginationQueryDto } from '@repo/api-core';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  displayName: string;

  @ApiPropertyOptional()
  avatarUrl: string | null;

  @ApiProperty({ enum: ['PENDING', 'ACTIVE', 'BLOCKED'] })
  status: 'PENDING' | 'ACTIVE' | 'BLOCKED';

  @ApiPropertyOptional()
  emailVerifiedAt: string | null;

  @ApiProperty({ type: [String] })
  roles: string[];

  @ApiProperty({ type: [String] })
  roleIds: string[];

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatarUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  avatarFileId?: string | null;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class CreateAdminUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  displayName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatarUrl?: string | null;

  @ApiPropertyOptional({ enum: ['PENDING', 'ACTIVE', 'BLOCKED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'ACTIVE', 'BLOCKED'])
  status?: 'PENDING' | 'ACTIVE' | 'BLOCKED';

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  roleIds?: string[];
}

export class UpdateAdminUserDto extends PartialType(CreateAdminUserDto) {}

export class UpdateUserStatusDto {
  @ApiProperty({ enum: ['PENDING', 'ACTIVE', 'BLOCKED'] })
  @IsEnum(['PENDING', 'ACTIVE', 'BLOCKED'])
  status: 'PENDING' | 'ACTIVE' | 'BLOCKED';
}

export class ReplaceUserRolesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  roleIds: string[];
}

export class AdminUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['PENDING', 'ACTIVE', 'BLOCKED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'ACTIVE', 'BLOCKED'])
  status?: 'PENDING' | 'ACTIVE' | 'BLOCKED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    enum: ['createdAt', 'displayName', 'email', 'status'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsEnum(['createdAt', 'displayName', 'email', 'status'])
  sortField: 'createdAt' | 'displayName' | 'email' | 'status' = 'createdAt';
}
