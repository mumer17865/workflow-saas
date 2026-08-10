import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OrgContextGuard } from "../../common/auth/org-context.guard";
import { CurrentOrg } from "../../common/auth/current-org.decorator";
import { ActiveOrg } from "../../common/auth/active-org.type";
import { ActivityService } from "./activity.service";

@Controller("activity")
@UseGuards(JwtAuthGuard, OrgContextGuard)
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Get()
  list(
    @CurrentOrg() org: ActiveOrg,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.activity.list(org.organizationId, limit);
  }
}
