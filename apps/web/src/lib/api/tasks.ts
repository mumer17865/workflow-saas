import { apiFetch } from "@/lib/api-client";

export type TaskStatus =
  | "BACKLOG"
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TaskAssignee {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  dueDate: string | null;
  assignee: TaskAssignee | null;
  createdBy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  position?: number;
  assigneeId?: string | null;
  dueDate?: string | null;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
}

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "TODO", label: "Todo" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "DONE", label: "Done" },
];

export const TASK_PRIORITIES: TaskPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

export const getTasks = (projectId: string, filters: TaskFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
  const qs = params.toString();
  return apiFetch<Task[]>(
    `/projects/${projectId}/tasks${qs ? `?${qs}` : ""}`,
  );
};

export const createTask = (projectId: string, input: CreateTaskInput) =>
  apiFetch<Task>(`/projects/${projectId}/tasks`, {
    method: "POST",
    body: JSON.stringify(input),
  });

export const updateTask = (
  projectId: string,
  id: string,
  input: UpdateTaskInput,
) =>
  apiFetch<Task>(`/projects/${projectId}/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

export const deleteTask = (projectId: string, id: string) =>
  apiFetch<{ success: boolean }>(`/projects/${projectId}/tasks/${id}`, {
    method: "DELETE",
  });
