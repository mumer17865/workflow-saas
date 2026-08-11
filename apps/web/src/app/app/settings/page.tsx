"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api-client";
import { getOrganization, updateOrganization } from "@/lib/api/organizations";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";

export default function SettingsPage() {
  const { activeOrg, refreshUser } = useAuth();
  const isAdmin = activeOrg?.role === "ADMIN";

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const org = await getOrganization();
      setName(org.name);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateOrganization(name.trim());
      await refreshUser();
      toast.success("Organization updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your organization.
        </p>
      </div>

      {loadError ? (
        <ErrorState message={loadError} onRetry={load} />
      ) : (
        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="org-name">
              Organization name
            </label>
            <input
              id="org-name"
              type="text"
              value={name}
              disabled={!isAdmin}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 disabled:opacity-60 dark:border-white/15"
            />
            {!isAdmin && (
              <p className="mt-1 text-xs text-neutral-500">
                Only admins can change the organization name.
              </p>
            )}
          </div>

          {isAdmin && (
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          )}
        </form>
      )}
    </div>
  );
}
