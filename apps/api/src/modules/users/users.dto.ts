import { Transform } from "class-transformer";
import { IsEmail, IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from "class-validator";

import { MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE } from "../../shared/pagination";

export const USER_ROLES = ["USER", "ADMIN"] as const;
export const USER_STATUSES = ["ACTIVE", "BLOCKED"] as const;

export class ListUsersQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number = DEFAULT_PAGE_SIZE;

  @IsOptional()
  @IsString()
  @MinLength(1)
  search?: string;
}

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(1)
  displayName!: string;

  @IsOptional()
  @IsIn(USER_ROLES)
  role: (typeof USER_ROLES)[number] = "USER";
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  displayName?: string;

  @IsOptional()
  @IsIn(USER_ROLES)
  role?: (typeof USER_ROLES)[number];
}

export class UpdateUserStatusDto {
  @IsIn(USER_STATUSES)
  status!: (typeof USER_STATUSES)[number];
}

export interface UserDto {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  createdAt: string;
}
