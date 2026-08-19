import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { UserDto } from "../../../users/presentation/users.dto";

export class AuthSessionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  expiresAt: string;

  @ApiPropertyOptional()
  revokedAt: string | null;

  @ApiPropertyOptional()
  lastUsedAt: string | null;

  @ApiPropertyOptional()
  ipAddress: string | null;

  @ApiPropertyOptional()
  userAgent: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty()
  current: boolean;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ type: UserDto })
  user: UserDto;

  @ApiProperty({ type: [String] })
  permissions: string[];

  @ApiProperty({ type: AuthSessionDto })
  session: AuthSessionDto;

  @ApiProperty({ type: String, nullable: true })
  organizationId: string | null;

  @ApiPropertyOptional()
  mustChangePassword?: boolean;
}

export class AuthMeDto {
  @ApiProperty({ type: UserDto })
  user: UserDto;

  @ApiProperty({ type: [String] })
  permissions: string[];

  @ApiProperty()
  sessionId: string;

  @ApiProperty({ type: String, nullable: true })
  organizationId: string | null;

  @ApiPropertyOptional()
  mustChangePassword?: boolean;
}

export class SwitchOrganizationResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  organizationId: string;
}
