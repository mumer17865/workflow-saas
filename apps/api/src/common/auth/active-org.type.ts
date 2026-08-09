import { OrgRole } from "@prisma/client";

/**
 * The authenticated user's context within the active organization,
 * resolved per-request by OrgContextGuard and consumed via @CurrentOrg().
 */
export interface ActiveOrg {
  organizationId: string;
  role: OrgRole;
  membershipId: string;
}
