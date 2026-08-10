import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { ProjectsService } from "./projects.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";

@Controller("projects")
@UseGuards(JwtAuthGuard, OrgContextGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@CurrentOrg() org: ActiveOrg) {
    return this.projects.list(org.organizationId);
  }

  @Get(":id")
  get(@CurrentOrg() org: ActiveOrg, @Param("id") id: string) {
    return this.projects.get(org.organizationId, id);
  }

  @Post()
  @Roles(OrgRole.ADMIN, OrgRole.MANAGER)
  create(
    @CurrentOrg() org: ActiveOrg,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projects.create(org.organizationId, user.id, dto);
  }

  @Patch(":id")
  @Roles(OrgRole.ADMIN, OrgRole.MANAGER)
  update(
    @CurrentOrg() org: ActiveOrg,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(org.organizationId, id, dto, user.id);
  }

  @Delete(":id")
  @Roles(OrgRole.ADMIN, OrgRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  remove(@CurrentOrg() org: ActiveOrg, @Param("id") id: string) {
    return this.projects.remove(org.organizationId, id);
  }
}
