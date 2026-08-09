import { SetMetadata } from "@nestjs/common";
import { OrgRole } from "@prisma/client";

export const ROLES_KEY = "roles";

/**
 * Declare the organization roles allowed to call a route. Enforced by
 * RolesGuard against the caller's role in the active organization.
 */
export const Roles = (...roles: OrgRole[]) => SetMetadata(ROLES_KEY, roles);
