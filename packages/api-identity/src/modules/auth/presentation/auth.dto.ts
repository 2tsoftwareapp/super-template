import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

import { UserDto } from '../../users/presentation/users.dto';

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty()
  @IsString()
  displayName: string;
}

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  token: string;
}

export class SwitchOrganizationDto {
  @ApiProperty()
  @IsString()
  organizationId: string;
}

export class ResendVerificationDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}

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

  @ApiProperty({ nullable: true })
  organizationId: string | null;
}

// Login can either complete immediately or require a follow-up MFA challenge,
// so only one of (session fields) or (mfaToken) is populated depending on mfaRequired.
export class LoginResponseDto {
  @ApiProperty()
  mfaRequired: boolean;

  @ApiPropertyOptional()
  mfaToken?: string;

  @ApiPropertyOptional()
  accessToken?: string;

  @ApiPropertyOptional()
  refreshToken?: string;

  @ApiPropertyOptional({ type: UserDto })
  user?: UserDto;

  @ApiPropertyOptional({ type: [String] })
  permissions?: string[];

  @ApiPropertyOptional({ type: AuthSessionDto })
  session?: AuthSessionDto;

  @ApiPropertyOptional({ nullable: true })
  organizationId?: string | null;
}

export class VerifyMfaChallengeDto {
  @ApiProperty()
  @IsString()
  mfaToken: string;

  @ApiProperty()
  @IsString()
  code: string;
}

export class AuthMeDto {
  @ApiProperty({ type: UserDto })
  user: UserDto;

  @ApiProperty({ type: [String] })
  permissions: string[];

  @ApiProperty()
  sessionId: string;

  @ApiProperty({ nullable: true })
  organizationId: string | null;
}
