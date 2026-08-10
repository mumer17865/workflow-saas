import { Injectable } from "@nestjs/common";
import { TaskPriority, TaskStatus } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";

const STATUSES: TaskStatus[] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
];
const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async stats(organizationId: string) {
    const [
      projectsTotal,
      projectsActive,
      tasksTotal,
      overdue,
      unassigned,
      members,
    ] = await Promise.all([
      this.prisma.project.count({ where: { organizationId } }),
      this.prisma.project.count({
        where: { organizationId, status: "ACTIVE" },
      }),
      this.prisma.task.count({ where: { organizationId } }),
      this.prisma.task.count({
        where: {
          organizationId,
          dueDate: { lt: new Date() },
          status: { not: "DONE" },
        },
      }),
      this.prisma.task.count({
        where: {
          organizationId,
          assigneeId: null,
          status: { not: "DONE" },
        },
      }),
      this.prisma.organizationMember.count({ where: { organizationId } }),
    ]);

    const byStatusRaw = await this.prisma.task.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: { _all: true },
    });
    const byPriorityRaw = await this.prisma.task.groupBy({
      by: ["priority"],
      where: { organizationId },
      _count: { _all: true },
    });

    const byStatus = Object.fromEntries(
      STATUSES.map((s) => [s, 0]),
    ) as Record<TaskStatus, number>;
    for (const row of byStatusRaw) byStatus[row.status] = row._count._all;

    const byPriority = Object.fromEntries(
      PRIORITIES.map((p) => [p, 0]),
    ) as Record<TaskPriority, number>;
    for (const row of byPriorityRaw) byPriority[row.priority] = row._count._all;

    const completed = byStatus.DONE;
    const completionRate =
      tasksTotal > 0 ? Math.round((completed / tasksTotal) * 100) : 0;

    return {
      projects: {
        total: projectsTotal,
        active: projectsActive,
        archived: projectsTotal - projectsActive,
      },
      tasks: {
        total: tasksTotal,
        completed,
        completionRate,
        overdue,
        unassigned,
        byStatus,
        byPriority,
      },
      members,
    };
  }
}
