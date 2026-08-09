"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api-client";
import type { OrgRole } from "@/lib/types";
import {
  createInvitation,
  getInvitations,
  getMembers,
  removeMember,
  revokeInvitation,
  updateMemberRole,
  type Invitation,
  type Member,
} from "@/lib/api/organizations";

const ROLES: OrgRole[] = ["ADMIN", "MANAGER", "MEMBER"];

export default function TeamPage() {
  const { user, activeOrg } = useAuth();
  const isAdmin = activeOrg?.role === "ADMIN";

  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgRole>("MEMBER");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [m, inv] = await Promise.all([
        getMembers(),
        isAdmin ? getInvitations() : Promise.resolve<Invitation[]>([]),
      ]);
      setMembers(m);
      setInvitations(inv);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const onRoleChange = async (userId: string, role: OrgRole) => {
    try {
      await updateMemberRole(userId, role);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update role");
    }
  };

  const onRemove = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from the organization?`)) return;
    try {
      await removeMember(userId);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove member");
    }
  };

  const onInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteLink(null);
    setInviting(true);
    try {
      const created = await createInvitation(inviteEmail.trim(), inviteRole);
      setInviteLink(
        `${window.location.origin}/invite/accept?token=${created.token}`,
      );
      setInviteEmail("");
      await load();
    } catch (err) {
      setInviteError(
        err instanceof ApiError ? err.message : "Failed to create invitation",
      );
    } finally {
      setInviting(false);
    }
  };

  const onRevoke = async (id: string) => {
    try {
      await revokeInvitation(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to revoke");
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading team…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {activeOrg?.name} · {members.length}{" "}
          {members.length === 1 ? "member" : "members"}
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <section className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
        <table className="w-full text-sm">
          <thead className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-white/10">
            <tr>
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Role</th>
              {isAdmin && <th className="px-4 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const editable = isAdmin && !m.isOwner;
              return (
                <tr
                  key={m.userId}
                  className="border-b border-black/5 last:border-0 dark:border-white/5"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {m.name}
                      {m.userId === user?.id && (
                        <span className="ml-2 text-xs text-neutral-400">
                          (you)
                        </span>
                      )}
                      {m.isOwner && (
                        <span className="ml-2 rounded bg-black/5 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-white/10">
                          Owner
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500">{m.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {editable ? (
                      <select
                        value={m.role}
                        onChange={(e) =>
                          onRoleChange(m.userId, e.target.value as OrgRole)
                        }
                        className="rounded-md border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/15"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>{m.role}</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      {editable && (
                        <button
                          onClick={() => onRemove(m.userId, m.name)}
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {isAdmin && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Invite a member</h2>
          <form
            onSubmit={onInvite}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium" htmlFor="invite-email">
                Email
              </label>
              <input
                id="invite-email"
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/15"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="invite-role">
                Role
              </label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                className="rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={inviting}
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {inviting ? "Creating…" : "Create invite"}
            </button>
          </form>

          {inviteError && (
            <p className="text-sm text-red-600">{inviteError}</p>
          )}
          {inviteLink && (
            <div className="rounded-lg border border-black/10 bg-black/[0.02] p-3 text-sm dark:border-white/10 dark:bg-white/[0.03]">
              <p className="mb-1 font-medium">Invite link created</p>
              <p className="mb-2 text-xs text-neutral-500">
                Share this link with the invitee. It is shown only once.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-x-auto rounded bg-black/5 px-2 py-1 text-xs dark:bg-white/10">
                  {inviteLink}
                </code>
                <button
                  onClick={() => navigator.clipboard?.writeText(inviteLink)}
                  className="rounded border border-black/10 px-2 py-1 text-xs dark:border-white/15"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          {invitations.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Pending invitations</h3>
              <ul className="divide-y divide-black/5 rounded-xl border border-black/10 dark:divide-white/5 dark:border-white/10">
                {invitations.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <div>
                      <span className="font-medium">{inv.email}</span>
                      <span className="ml-2 text-xs text-neutral-500">
                        {inv.role}
                      </span>
                    </div>
                    <button
                      onClick={() => onRevoke(inv.id)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Revoke
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
