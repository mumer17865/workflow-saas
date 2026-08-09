import { apiFetch } from "@/lib/api-client";

export type ProjectStatus = "ACTIVE" | "ARCHIVED";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

export const getProjects = () => apiFetch<Project[]>("/projects");

export const getProject = (id: string) => apiFetch<Project>(`/projects/${id}`);

export const createProject = (input: CreateProjectInput) =>
  apiFetch<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const updateProject = (id: string, input: UpdateProjectInput) =>
  apiFetch<Project>(`/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

export const deleteProject = (id: string) =>
  apiFetch<{ success: boolean }>(`/projects/${id}`, { method: "DELETE" });
