export type OrgRole = "ADMIN" | "MANAGER" | "MEMBER";

export interface OrganizationSummary {
  id: string;
  name: string;
  role: OrgRole;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  organizations?: OrganizationSummary[];
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}
