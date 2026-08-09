import { IsEmail, IsEnum, IsOptional, MaxLength } from "class-validator";
import { OrgRole } from "@prisma/client";

export class CreateInvitationDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsOptional()
  @IsEnum(OrgRole)
  role?: OrgRole;
}
