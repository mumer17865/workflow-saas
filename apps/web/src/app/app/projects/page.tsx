"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api-client";
import {
  createProject,
  getProjects,
  type Project,
} from "@/lib/api/projects";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";

export default function ProjectsPage() {
  const { activeOrg } = useAuth();
  const canWrite =
    activeOrg?.role === "ADMIN" || activeOrg?.role === "MANAGER";

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setProjects(await getProjects());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setCreating(true);
    try {
      await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName("");
      setDescription("");
      setShowForm(false);
      toast.success("Project created");
      await load();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Failed to create project",
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded-md bg-black/10 dark:bg-white/10" />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <CardSkeleton />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {projects.length} {projects.length === 1 ? "project" : "projects"} in{" "}
            {activeOrg?.name}
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {showForm ? "Cancel" : "New project"}
          </button>
        )}
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {showForm && canWrite && (
        <form
          onSubmit={onCreate}
          className="space-y-3 rounded-xl border border-black/10 p-4 dark:border-white/10"
        >
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="project-name">
              Name
            </label>
            <input
              id="project-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/15"
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="project-description"
            >
              Description <span className="text-neutral-400">(optional)</span>
            </label>
            <textarea
              id="project-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/15"
            />
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create project"}
          </button>
        </form>
      )}

      {error ? null : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description={
            canWrite
              ? "Create your first project to get started."
              : "Ask an admin or manager to create one."
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/app/projects/${p.id}`}
                className="block h-full rounded-xl border border-black/10 p-4 transition-colors hover:bg-black/[0.02] dark:border-white/10 dark:hover:bg-white/[0.03]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">{p.name}</span>
                  <StatusBadge status={p.status} />
                </div>
                {p.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-neutral-500">
                    {p.description}
                  </p>
                )}
                <p className="mt-3 text-xs text-neutral-400">
                  by {p.createdByName}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Project["status"] }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
        active
          ? "bg-green-500/10 text-green-600 dark:text-green-400"
          : "bg-black/5 text-neutral-500 dark:bg-white/10"
      }`}
    >
      {status.toLowerCase()}
    </span>
  );
}
