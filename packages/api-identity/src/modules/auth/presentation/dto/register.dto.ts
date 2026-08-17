import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

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

export class ResendVerificationDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  token: string;
}
