import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, TaskStatus } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { TaskQueryDto } from "./dto/task-query.dto";

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true, avatar: true } },
  createdBy: { select: { id: true, name: true } },
} as const;

type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

function toDto(task: TaskWithRelations) {
  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    position: task.position,
    dueDate: task.dueDate,
    assignee: task.assignee
      ? {
          id: task.assignee.id,
          name: task.assignee.name,
          email: task.assignee.email,
          avatar: task.assignee.avatar,
        }
      : null,
    createdBy: { id: task.createdBy.id, name: task.createdBy.name },
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    organizationId: string,
    projectId: string,
    filters: TaskQueryDto,
  ) {
    await this.assertProject(organizationId, projectId);

    const tasks = await this.prisma.task.findMany({
      where: {
        projectId,
        organizationId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.priority ? { priority: filters.priority } : {}),
        ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
      },
      include: taskInclude,
      orderBy: [{ status: "asc" }, { position: "asc" }],
    });
    return tasks.map(toDto);
  }

  async get(organizationId: string, projectId: string, id: string) {
    await this.assertProject(organizationId, projectId);
    const task = await this.prisma.task.findFirst({
      where: { id, projectId, organizationId },
      include: taskInclude,
    });
    if (!task) {
      throw new NotFoundException("Task not found");
    }
    return toDto(task);
  }

  async create(
    organizationId: string,
    projectId: string,
    createdById: string,
    dto: CreateTaskDto,
  ) {
    await this.assertProject(organizationId, projectId);
    if (dto.assigneeId) {
      await this.assertOrgMember(organizationId, dto.assigneeId);
    }

    const status = dto.status ?? TaskStatus.TODO;
    // Append to the bottom of its column.
    const last = await this.prisma.task.findFirst({
      where: { projectId, status },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const task = await this.prisma.task.create({
      data: {
        organizationId,
        projectId,
        createdById,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        status,
        priority: dto.priority ?? undefined,
        position: (last?.position ?? 0) + 1,
        assigneeId: dto.assigneeId || null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
      include: taskInclude,
    });
    return toDto(task);
  }

  async update(
    organizationId: string,
    projectId: string,
    id: string,
    dto: UpdateTaskDto,
  ) {
    await this.get(organizationId, projectId, id); // scoped existence check

    if (dto.assigneeId) {
      await this.assertOrgMember(organizationId, dto.assigneeId);
    }

    const data: Prisma.TaskUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined)
      data.description = dto.description.trim() || null;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.position !== undefined) data.position = dto.position;
    if (dto.assigneeId !== undefined) {
      data.assignee = dto.assigneeId
        ? { connect: { id: dto.assigneeId } }
        : { disconnect: true };
    }
    if (dto.dueDate !== undefined) {
      data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }

    const task = await this.prisma.task.update({
      where: { id },
      data,
      include: taskInclude,
    });
    return toDto(task);
  }

  async remove(organizationId: string, projectId: string, id: string) {
    await this.get(organizationId, projectId, id);
    await this.prisma.task.delete({ where: { id } });
    return { success: true };
  }

  /** Ensure the project exists within this organization (404 otherwise). */
  private async assertProject(organizationId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: { id: true },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }
  }

  /** Ensure a would-be assignee actually belongs to the organization. */
  private async assertOrgMember(organizationId: string, userId: string) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      select: { id: true },
    });
    if (!membership) {
      throw new BadRequestException("Assignee must be a member of the organization");
    }
  }
}
