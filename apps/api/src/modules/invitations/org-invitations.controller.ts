import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { OrgRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/types/jwt-payload";
import { OrgContextGuard } from "../../common/auth/org-context.guard";
import { RolesGuard } from "../../common/auth/roles.guard";
import { Roles } from "../../common/auth/roles.decorator";
import { CurrentOrg } from "../../common/auth/current-org.decorator";
import { ActiveOrg } from "../../common/auth/active-org.type";
import { InvitationsService } from "./invitations.service";
import { CreateInvitationDto } from "./dto/create-invitation.dto";

@Controller("organizations/current/invitations")
@UseGuards(JwtAuthGuard, OrgContextGuard, RolesGuard)
export class OrgInvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Post()
  @Roles(OrgRole.ADMIN)
  create(
    @CurrentOrg() org: ActiveOrg,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitations.create(
      org.organizationId,
      user.id,
      dto.email,
      dto.role ?? OrgRole.MEMBER,
    );
  }

  @Get()
  @Roles(OrgRole.ADMIN)
  list(@CurrentOrg() org: ActiveOrg) {
    return this.invitations.list(org.organizationId);
  }

  @Delete(":id")
  @Roles(OrgRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  revoke(@CurrentOrg() org: ActiveOrg, @Param("id") id: string) {
    return this.invitations.revoke(org.organizationId, id);
  }
}
