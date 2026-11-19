import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class RefreshDto {
  @IsString()
  @MinLength(16)
  refreshToken!: string;
}

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

export interface SessionResponse {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}
