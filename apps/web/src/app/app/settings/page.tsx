"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api-client";
import { getOrganization, updateOrganization } from "@/lib/api/organizations";

export default function SettingsPage() {
  const { activeOrg, refreshUser } = useAuth();
  const isAdmin = activeOrg?.role === "ADMIN";

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const org = await getOrganization();
        setName(org.name);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setSaving(true);
    try {
      await updateOrganization(name.trim());
      await refreshUser();
      setMessage("Saved");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading settings…</p>;
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your organization.
        </p>
      </div>

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

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}

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
    </div>
  );
}
