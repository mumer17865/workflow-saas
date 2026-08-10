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
  Query,
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
import { TasksService } from "./tasks.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { TaskQueryDto } from "./dto/task-query.dto";

@Controller("projects/:projectId/tasks")
@UseGuards(JwtAuthGuard, OrgContextGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list(
    @CurrentOrg() org: ActiveOrg,
    @Param("projectId") projectId: string,
    @Query() query: TaskQueryDto,
  ) {
    return this.tasks.list(org.organizationId, projectId, query);
  }

  @Get(":id")
  get(
    @CurrentOrg() org: ActiveOrg,
    @Param("projectId") projectId: string,
    @Param("id") id: string,
  ) {
    return this.tasks.get(org.organizationId, projectId, id);
  }

  @Post()
  @Roles(OrgRole.ADMIN, OrgRole.MANAGER)
  create(
    @CurrentOrg() org: ActiveOrg,
    @CurrentUser() user: AuthenticatedUser,
    @Param("projectId") projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasks.create(org.organizationId, projectId, user.id, dto);
  }

  @Patch(":id")
  @Roles(OrgRole.ADMIN, OrgRole.MANAGER)
  update(
    @CurrentOrg() org: ActiveOrg,
    @CurrentUser() user: AuthenticatedUser,
    @Param("projectId") projectId: string,
    @Param("id") id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasks.update(org.organizationId, projectId, id, dto, user.id);
  }

  @Delete(":id")
  @Roles(OrgRole.ADMIN, OrgRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  remove(
    @CurrentOrg() org: ActiveOrg,
    @Param("projectId") projectId: string,
    @Param("id") id: string,
  ) {
    return this.tasks.remove(org.organizationId, projectId, id);
  }
}
