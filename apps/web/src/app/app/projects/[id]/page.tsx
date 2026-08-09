"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api-client";
import {
  deleteProject,
  getProject,
  updateProject,
  type Project,
  type ProjectStatus,
} from "@/lib/api/projects";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { activeOrg } = useAuth();
  const canWrite =
    activeOrg?.role === "ADMIN" || activeOrg?.role === "MANAGER";

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("ACTIVE");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const p = await getProject(id);
      setProject(p);
      setName(p.name);
      setDescription(p.description ?? "");
      setStatus(p.status);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      await updateProject(id, {
        name: name.trim(),
        description: description.trim(),
        status,
      });
      setEditing(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    try {
      await deleteProject(id);
      router.replace("/app/projects");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading project…</p>;
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">{error ?? "Project not found"}</p>
        <Link href="/app/projects" className="text-sm font-medium underline">
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/app/projects"
        className="text-sm text-neutral-500 hover:underline"
      >
        ← Projects
      </Link>

      {editing ? (
        <form
          onSubmit={onSave}
          className="space-y-4 rounded-xl border border-black/10 p-4 dark:border-white/10"
        >
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="edit-name">
              Name
            </label>
            <input
              id="edit-name"
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
              htmlFor="edit-description"
            >
              Description
            </label>
            <textarea
              id="edit-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/15"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="edit-status">
              Status
            </label>
            <select
              id="edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
            >
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setFormError(null);
                setName(project.name);
                setDescription(project.description ?? "");
                setStatus(project.status);
              }}
              className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/15"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {project.name}
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                {project.status.toLowerCase()} · created by{" "}
                {project.createdByName}
              </p>
            </div>
            {canWrite && (
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
                >
                  Edit
                </button>
                <button
                  onClick={onDelete}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/40"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
            {project.description ? (
              <p className="whitespace-pre-wrap text-sm">{project.description}</p>
            ) : (
              <p className="text-sm text-neutral-400">No description.</p>
            )}
          </div>

          <div className="rounded-xl border border-black/10 p-4 text-sm text-neutral-500 dark:border-white/10">
            Tasks for this project arrive in Phase 5.
          </div>
        </>
      )}
    </div>
  );
}
