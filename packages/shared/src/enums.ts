import { z } from "zod";

/**
 * Domain enums shared between the API (validation) and the web app (types).
 * These mirror the Prisma enums introduced in Phase 2.
 */

export const OrgRole = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  MEMBER: "MEMBER",
} as const;
export const orgRoleSchema = z.nativeEnum(OrgRole);
export type OrgRole = z.infer<typeof orgRoleSchema>;

export const ProjectStatus = {
  ACTIVE: "ACTIVE",
  ON_HOLD: "ON_HOLD",
  COMPLETED: "COMPLETED",
  ARCHIVED: "ARCHIVED",
} as const;
export const projectStatusSchema = z.nativeEnum(ProjectStatus);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const TaskStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  IN_REVIEW: "IN_REVIEW",
  DONE: "DONE",
} as const;
export const taskStatusSchema = z.nativeEnum(TaskStatus);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const TaskPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;
export const taskPrioritySchema = z.nativeEnum(TaskPriority);
export type TaskPriority = z.infer<typeof taskPrioritySchema>;
