import { apiFetch } from "@/lib/api-client";
import type { OrgRole } from "@/lib/types";

export interface OrgDetails {
  id: string;
  name: string;
  ownerId: string;
  memberCount: number;
  createdAt: string;
}

export interface Member {
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  role: OrgRole;
  isOwner: boolean;
  joinedAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: OrgRole;
  status: "PENDING" | "ACCEPTED" | "REVOKED";
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
}

export interface CreatedInvitation {
  id: string;
  email: string;
  role: OrgRole;
  status: string;
  expiresAt: string;
  token: string;
}

export interface InvitationPreview {
  email: string;
  role: OrgRole;
  organizationName: string;
  expiresAt: string;
}

export const getOrganization = () =>
  apiFetch<OrgDetails>("/organizations/current");

export const updateOrganization = (name: string) =>
  apiFetch<{ id: string; name: string }>("/organizations/current", {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });

export const getMembers = () =>
  apiFetch<Member[]>("/organizations/current/members");

export const updateMemberRole = (userId: string, role: OrgRole) =>
  apiFetch<{ userId: string; role: OrgRole }>(
    `/organizations/current/members/${userId}`,
    { method: "PATCH", body: JSON.stringify({ role }) },
  );

export const removeMember = (userId: string) =>
  apiFetch<{ success: boolean }>(
    `/organizations/current/members/${userId}`,
    { method: "DELETE" },
  );

export const getInvitations = () =>
  apiFetch<Invitation[]>("/organizations/current/invitations");

export const createInvitation = (email: string, role: OrgRole) =>
  apiFetch<CreatedInvitation>("/organizations/current/invitations", {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });

export const revokeInvitation = (id: string) =>
  apiFetch<{ success: boolean }>(
    `/organizations/current/invitations/${id}`,
    { method: "DELETE" },
  );

export const previewInvitation = (token: string) =>
  apiFetch<InvitationPreview>(
    `/invitations/preview?token=${encodeURIComponent(token)}`,
  );

export const acceptInvitation = (token: string) =>
  apiFetch<{ organizationId: string; role: OrgRole }>("/invitations/accept", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
