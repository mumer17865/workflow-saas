import { IsEnum, IsOptional, IsString } from "class-validator";
import { TaskPriority, TaskStatus } from "@prisma/client";

/** Optional filters for listing a project's tasks. */
export class TaskQueryDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  assigneeId?: string;
}
