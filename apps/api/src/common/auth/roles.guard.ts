import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { OrgRole } from "@prisma/client";
import { ROLES_KEY } from "./roles.decorator";
import { ActiveOrg } from "./active-org.type";

/**
 * Enforces @Roles(...) against the caller's role in the active organization.
 * Routes without @Roles are allowed for any member. Must run after
 * OrgContextGuard, which populates request.organization.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<OrgRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const org = request.organization as ActiveOrg | undefined;
    if (!org) {
      throw new ForbiddenException();
    }

    if (!required.includes(org.role)) {
      throw new ForbiddenException(
        "You do not have permission to perform this action",
      );
    }

    return true;
  }
}
