import { apiFetch } from "@/lib/api-client";
import type { TaskPriority, TaskStatus } from "@/lib/api/tasks";

export interface DashboardStats {
  projects: { total: number; active: number; archived: number };
  tasks: {
    total: number;
    completed: number;
    completionRate: number;
    overdue: number;
    unassigned: number;
    byStatus: Record<TaskStatus, number>;
    byPriority: Record<TaskPriority, number>;
  };
  members: number;
}

export type ActivityType =
  | "PROJECT_CREATED"
  | "PROJECT_ARCHIVED"
  | "TASK_CREATED"
  | "TASK_STATUS_CHANGED"
  | "MEMBER_JOINED";

export interface Activity {
  id: string;
  type: ActivityType;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  actor: { id: string; name: string; avatar: string | null } | null;
  createdAt: string;
}

export const getDashboardStats = () =>
  apiFetch<DashboardStats>("/dashboard/stats");

export const getActivity = (limit = 20) =>
  apiFetch<Activity[]>(`/activity?limit=${limit}`);
