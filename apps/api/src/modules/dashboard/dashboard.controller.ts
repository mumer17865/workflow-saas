import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OrgContextGuard } from "../../common/auth/org-context.guard";
import { CurrentOrg } from "../../common/auth/current-org.decorator";
import { ActiveOrg } from "../../common/auth/active-org.type";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
@UseGuards(JwtAuthGuard, OrgContextGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get("stats")
  stats(@CurrentOrg() org: ActiveOrg) {
    return this.dashboard.stats(org.organizationId);
  }
}
