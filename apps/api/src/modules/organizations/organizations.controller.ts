import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { OrganizationsService } from "./organizations.service";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { UpdateMemberRoleDto } from "./dto/update-member-role.dto";

@Controller("organizations/current")
@UseGuards(JwtAuthGuard, OrgContextGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get()
  getCurrent(@CurrentOrg() org: ActiveOrg) {
    return this.organizations.getCurrent(org.organizationId);
  }

  @Patch()
  @Roles(OrgRole.ADMIN)
  update(@CurrentOrg() org: ActiveOrg, @Body() dto: UpdateOrganizationDto) {
    return this.organizations.update(org.organizationId, dto.name);
  }

  @Get("members")
  listMembers(@CurrentOrg() org: ActiveOrg) {
    return this.organizations.listMembers(org.organizationId);
  }

  @Patch("members/:userId")
  @Roles(OrgRole.ADMIN)
  updateMemberRole(
    @CurrentOrg() org: ActiveOrg,
    @Param("userId") userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.organizations.updateMemberRole(
      org.organizationId,
      userId,
      dto.role,
    );
  }

  @Delete("members/:userId")
  @Roles(OrgRole.ADMIN)
  removeMember(
    @CurrentOrg() org: ActiveOrg,
    @Param("userId") userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizations.removeMember(org.organizationId, userId, user.id);
  }
}
