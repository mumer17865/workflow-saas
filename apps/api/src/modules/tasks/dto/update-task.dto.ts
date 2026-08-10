import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";
import { TaskPriority, TaskStatus } from "@prisma/client";

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  // Float ordering key used for Kanban positioning within a column.
  @IsOptional()
  @IsNumber()
  position?: number;

  // Pass null to unassign; a string to assign to an org member.
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  assigneeId?: string | null;

  // Pass null to clear the due date.
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  dueDate?: string | null;
}
