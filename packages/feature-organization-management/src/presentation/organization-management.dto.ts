import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString, MaxLength, MinLength } from "class-validator";

export class CreateOrganizationDto {
  @ApiProperty({ example: "Acme Corp" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: ["OWNER", "ADMIN", "MEMBER"] })
  @IsIn(["OWNER", "ADMIN", "MEMBER"])
  role!: "OWNER" | "ADMIN" | "MEMBER";
}

export class OrganizationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ enum: ["OWNER", "ADMIN", "MEMBER"] })
  role!: "OWNER" | "ADMIN" | "MEMBER";

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
