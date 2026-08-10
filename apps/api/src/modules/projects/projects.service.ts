import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { ActivityService } from "../activity/activity.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";

const projectInclude = {
  createdBy: { select: { id: true, name: true } },
} as const;

type ProjectWithCreator = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdById: string;
  createdBy: { id: string; name: string };
  createdAt: Date;
  updatedAt: Date;
};

function toDto(project: ProjectWithCreator) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    createdById: project.createdById,
    createdByName: project.createdBy.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  async list(organizationId: string) {
    const projects = await this.prisma.project.findMany({
      where: { organizationId },
      include: projectInclude,
      orderBy: { createdAt: "desc" },
    });
    return projects.map(toDto);
  }

  async get(organizationId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, organizationId },
      include: projectInclude,
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    return toDto(project);
  }

  async create(
    organizationId: string,
    createdById: string,
    dto: CreateProjectDto,
  ) {
    const project = await this.prisma.project.create({
      data: {
        organizationId,
        createdById,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
      },
      include: projectInclude,
    });

    await this.activity.record({
      organizationId,
      actorId: createdById,
      type: "PROJECT_CREATED",
      entityType: "project",
      entityId: project.id,
      metadata: { name: project.name },
    });

    return toDto(project);
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateProjectDto,
    actorId: string,
  ) {
    // Scope the existence check to the org so cross-tenant ids 404 rather than leak.
    const before = await this.get(organizationId, id);

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() || null }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: projectInclude,
    });

    if (before.status !== "ARCHIVED" && project.status === "ARCHIVED") {
      await this.activity.record({
        organizationId,
        actorId,
        type: "PROJECT_ARCHIVED",
        entityType: "project",
        entityId: project.id,
        metadata: { name: project.name },
      });
    }

    return toDto(project);
  }

  async remove(organizationId: string, id: string) {
    await this.get(organizationId, id);
    await this.prisma.project.delete({ where: { id } });
    return { success: true };
  }
}
