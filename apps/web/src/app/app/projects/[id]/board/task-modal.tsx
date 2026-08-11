"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import type { Member } from "@/lib/api/organizations";
import {
  createTask,
  updateTask,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/api/tasks";

interface Props {
  projectId: string;
  members: Member[];
  task: Task | null;
  onClose: () => void;
  onSaved: () => void;
}

export function TaskModal({ projectId, members, task, onClose, onSaved }: Props) {
  const editing = task !== null;

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "TODO");
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? "MEDIUM",
  );
  const [assigneeId, setAssigneeId] = useState(task?.assignee?.id ?? "");
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? task.dueDate.slice(0, 10) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      };
      if (editing) {
        await updateTask(projectId, task.id, {
          ...payload,
          assigneeId: assigneeId || null,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        });
      } else {
        await createTask(projectId, payload);
      }
      toast.success(editing ? "Task updated" : "Task created");
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-black/10 bg-background p-6 shadow-xl dark:border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold">
          {editing ? "Edit task" : "New task"}
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="t-title">
              Title
            </label>
            <input
              id="t-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/15"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="t-desc">
              Description
            </label>
            <textarea
              id="t-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/15"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="t-status">
                Status
              </label>
              <select
                id="t-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="t-priority">
                Priority
              </label>
              <select
                id="t-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="t-assignee">
                Assignee
              </label>
              <select
                id="t-assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="t-due">
                Due date
              </label>
              <input
                id="t-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/15"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : editing ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
