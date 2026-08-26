import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AuthUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  displayName: string;

  @ApiPropertyOptional()
  avatarUrl: string | null;

  @ApiProperty({ enum: ["PENDING", "ACTIVE", "BLOCKED"] })
  status: "PENDING" | "ACTIVE" | "BLOCKED";

  @ApiProperty({ type: String, nullable: true })
  emailVerifiedAt: string | null;

  @ApiProperty({ type: [String] })
  roles: string[];

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
