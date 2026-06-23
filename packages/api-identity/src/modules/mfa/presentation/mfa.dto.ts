import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class MfaCodeDto {
  @ApiProperty()
  @IsString()
  @Length(4, 16)
  code: string;
}

export class MfaSetupResponseDto {
  @ApiProperty()
  secret: string;

  @ApiProperty()
  otpauthUrl: string;
}

export class MfaRecoveryCodesResponseDto {
  @ApiProperty({ type: [String] })
  recoveryCodes: string[];
}

export class MfaStatusDto {
  @ApiProperty()
  enabled: boolean;
}

export class MfaVerifyChallengeDto {
  @ApiProperty()
  @IsString()
  mfaToken: string;

  @ApiProperty()
  @IsString()
  @Length(4, 16)
  code: string;
}
