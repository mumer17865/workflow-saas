import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Resolves which organization the request acts on and the caller's role in it.
 *
 * The active org is taken from the `x-organization-id` header when present;
 * otherwise it falls back to the user's earliest membership. Membership is
 * verified against the database on every request, so a client can never act on
 * an organization it does not belong to. Must run after JwtAuthGuard.
 */
@Injectable()
export class OrgContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.id) {
      throw new UnauthorizedException();
    }

    const headerOrgId = request.headers["x-organization-id"] as
      | string
      | undefined;

    const membership = headerOrgId
      ? await this.prisma.organizationMember.findUnique({
          where: {
            organizationId_userId: {
              organizationId: headerOrgId,
              userId: user.id,
            },
          },
        })
      : await this.prisma.organizationMember.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "asc" },
        });

    if (!membership) {
      throw new ForbiddenException(
        "You are not a member of this organization",
      );
    }

    request.organization = {
      organizationId: membership.organizationId,
      role: membership.role,
      membershipId: membership.id,
    };

    return true;
  }
}
