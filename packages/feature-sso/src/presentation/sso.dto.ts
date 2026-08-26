import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, IsUrl } from "class-validator";

export class StartSsoLoginQueryDto {
  @ApiProperty()
  @IsUrl({ require_tld: false })
  redirectUri: string;

  @ApiPropertyOptional({
    description: 'Only honored by the "fake" provider (dev/test); seeds the mock identity email.',
  })
  @IsOptional()
  @IsEmail()
  testEmail?: string;
}

export class StartSsoLoginResponseDto {
  @ApiProperty()
  authorizationUrl: string;
}

export class SsoCallbackQueryDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  state: string;
}

export class ExchangeSsoSessionDto {
  @ApiProperty()
  @IsString()
  code: string;
}
