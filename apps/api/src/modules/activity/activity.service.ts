import { Injectable, Logger } from "@nestjs/common";
import { ActivityType, Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";

export interface RecordActivityInput {
  organizationId: string;
  actorId?: string | null;
  type: ActivityType;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persist an audit event. Deliberately never throws: activity logging is a
   * side effect and must not fail the primary operation that triggered it.
   */
  async record(input: RecordActivityInput): Promise<void> {
    try {
      await this.prisma.activity.create({
        data: {
          organizationId: input.organizationId,
          actorId: input.actorId ?? null,
          type: input.type,
          entityType: input.entityType,
          entityId: input.entityId,
          metadata: input.metadata ?? Prisma.JsonNull,
        },
      });
    } catch (err) {
      this.logger.warn(
        `Failed to record activity ${input.type}: ${String(err)}`,
      );
    }
  }

  async list(organizationId: string, limit = 20) {
    const take = Math.min(Math.max(limit, 1), 100);
    const activities = await this.prisma.activity.findMany({
      where: { organizationId },
      include: { actor: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      take,
    });

    return activities.map((a) => ({
      id: a.id,
      type: a.type,
      entityType: a.entityType,
      entityId: a.entityId,
      metadata: a.metadata,
      actor: a.actor
        ? { id: a.actor.id, name: a.actor.name, avatar: a.actor.avatar }
        : null,
      createdAt: a.createdAt,
    }));
  }
}
