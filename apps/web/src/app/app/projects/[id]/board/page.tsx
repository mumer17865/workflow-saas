"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api-client";
import { getMembers, type Member } from "@/lib/api/organizations";
import { getProject } from "@/lib/api/projects";
import {
  deleteTask,
  getTasks,
  updateTask,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/api/tasks";
import { TaskModal } from "./task-modal";

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  LOW: "bg-neutral-500/10 text-neutral-500",
  MEDIUM: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  HIGH: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  URGENT: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function BoardPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const { activeOrg } = useAuth();
  const canWrite =
    activeOrg?.role === "ADMIN" || activeOrg?.role === "MANAGER";

  const [projectName, setProjectName] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [project, tasksList, memberList] = await Promise.all([
        getProject(projectId),
        getTasks(projectId),
        getMembers(),
      ]);
      setProjectName(project.name);
      setTasks(tasksList);
      setMembers(memberList);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load board");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (assigneeFilter && t.assignee?.id !== assigneeFilter) return false;
      if (q && !t.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tasks, priorityFilter, assigneeFilter, search]);

  const byStatus = useCallback(
    (status: TaskStatus) =>
      visibleTasks
        .filter((t) => t.status === status)
        .sort((a, b) => a.position - b.position),
    [visibleTasks],
  );

  // Compute a fractional position that slots the dragged task into `status`
  // immediately before `beforeId` (or at the end when null).
  const computePosition = (status: TaskStatus, beforeId: string | null) => {
    const column = tasks
      .filter((t) => t.status === status && t.id !== dragId)
      .sort((a, b) => a.position - b.position);
    const idx = beforeId
      ? column.findIndex((t) => t.id === beforeId)
      : column.length;
    const prev = idx > 0 ? column[idx - 1] : null;
    const next = idx >= 0 && idx < column.length ? column[idx] : null;
    if (!prev && !next) return 0;
    if (!prev) return next!.position - 1;
    if (!next) return prev.position + 1;
    return (prev.position + next.position) / 2;
  };

  const onDrop = async (status: TaskStatus, beforeId: string | null) => {
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    if (task.status === status && task.id === beforeId) return;

    const position = computePosition(status, beforeId);
    // Optimistic update.
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, position } : t)),
    );
    try {
      await updateTask(projectId, id, { status, position });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to move task");
      await load();
    }
  };

  const onDeleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteTask(projectId, id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete task");
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading board…</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/app/projects/${projectId}`}
            className="text-sm text-neutral-500 hover:underline"
          >
            ← {projectName}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Board</h1>
        </div>
        {canWrite && (
          <button
            onClick={() => {
              setEditingTask(null);
              setModalOpen(true);
            }}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            New task
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-black/10 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-black/30 dark:border-white/15"
        />
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | "")}
          className="rounded-lg border border-black/10 bg-transparent px-3 py-1.5 text-sm dark:border-white/15"
        >
          <option value="">All priorities</option>
          {TASK_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="rounded-lg border border-black/10 bg-transparent px-3 py-1.5 text-sm dark:border-white/15"
        >
          <option value="">All assignees</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {TASK_STATUSES.map((col) => {
          const columnTasks = byStatus(col.value);
          return (
            <div
              key={col.value}
              onDragOver={(e) => canWrite && e.preventDefault()}
              onDrop={() => canWrite && onDrop(col.value, null)}
              className="flex min-h-[200px] flex-col rounded-xl border border-black/10 bg-black/[0.015] p-2 dark:border-white/10 dark:bg-white/[0.02]"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {col.label}
                </span>
                <span className="text-xs text-neutral-400">
                  {columnTasks.length}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable={canWrite}
                    onDragStart={() => setDragId(task.id)}
                    onDragOver={(e) => canWrite && e.preventDefault()}
                    onDrop={(e) => {
                      if (!canWrite) return;
                      e.stopPropagation();
                      onDrop(col.value, task.id);
                    }}
                    onClick={() => {
                      if (!canWrite) return;
                      setEditingTask(task);
                      setModalOpen(true);
                    }}
                    className={`group rounded-lg border border-black/10 bg-background p-3 text-sm shadow-sm dark:border-white/10 ${
                      canWrite ? "cursor-grab active:cursor-grabbing" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium leading-snug">
                        {task.title}
                      </span>
                      {canWrite && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTask(task.id);
                          }}
                          className="opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="Delete task"
                        >
                          <span className="text-xs text-red-500">✕</span>
                        </button>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${PRIORITY_STYLES[task.priority]}`}
                      >
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] text-neutral-500 dark:bg-white/10">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {task.assignee && (
                      <p className="mt-2 text-xs text-neutral-500">
                        {task.assignee.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <TaskModal
          projectId={projectId}
          members={members}
          task={editingTask}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
