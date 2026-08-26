import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

import { AuthSessionDto } from "./auth-response.dto";
import { AuthUserDto as UserDto } from "./auth-user.dto";

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

export class VerifyMfaChallengeDto {
  @ApiProperty()
  @IsString()
  mfaToken: string;

  @ApiProperty()
  @IsString()
  code: string;
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

  @ApiPropertyOptional({ type: String, nullable: true })
  organizationId?: string | null;

  @ApiPropertyOptional()
  mustChangePassword?: boolean;
}
