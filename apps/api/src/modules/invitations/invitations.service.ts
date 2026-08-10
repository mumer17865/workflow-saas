import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrgRole } from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import { PrismaService } from "../../common/prisma/prisma.service";
import { ActivityService } from "../activity/activity.service";

const INVITE_TTL_MS = 7 * 86_400_000;

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  async create(
    organizationId: string,
    invitedById: string,
    email: string,
    role: OrgRole = OrgRole.MEMBER,
  ) {
    const normalizedEmail = email.toLowerCase().trim();

    // Reject if this email already belongs to a member of the org.
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existingUser) {
      const membership = await this.prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: { organizationId, userId: existingUser.id },
        },
      });
      if (membership) {
        throw new ConflictException("This person is already a member");
      }
    }

    // Supersede any outstanding invite for the same email in this org.
    await this.prisma.invitation.updateMany({
      where: { organizationId, email: normalizedEmail, status: "PENDING" },
      data: { status: "REVOKED" },
    });

    const rawToken = randomBytes(32).toString("hex");
    const invitation = await this.prisma.invitation.create({
      data: {
        organizationId,
        email: normalizedEmail,
        role,
        tokenHash: this.hashToken(rawToken),
        invitedById,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
    });

    // The raw token is returned exactly once, for building the invite link.
    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      token: rawToken,
    };
  }

  async list(organizationId: string) {
    const invitations = await this.prisma.invitation.findMany({
      where: { organizationId, status: "PENDING" },
      include: { invitedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      invitedBy: inv.invitedBy.name,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
    }));
  }

  async revoke(organizationId: string, invitationId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, organizationId },
    });
    if (!invitation) {
      throw new NotFoundException("Invitation not found");
    }
    if (invitation.status !== "PENDING") {
      throw new BadRequestException("Invitation is no longer pending");
    }
    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "REVOKED" },
    });
    return { success: true };
  }

  async preview(rawToken: string) {
    const invitation = await this.findValidByToken(rawToken);
    const org = await this.prisma.organization.findUnique({
      where: { id: invitation.organizationId },
      select: { name: true },
    });
    return {
      email: invitation.email,
      role: invitation.role,
      organizationName: org?.name ?? "",
      expiresAt: invitation.expiresAt,
    };
  }

  async accept(
    rawToken: string,
    userId: string,
    userEmail: string,
  ): Promise<{ organizationId: string; role: OrgRole }> {
    const invitation = await this.findValidByToken(rawToken);

    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new ForbiddenException(
        "This invitation was sent to a different email address",
      );
    }

    const existing = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: invitation.organizationId,
          userId,
        },
      },
    });
    if (existing) {
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });
      throw new ConflictException("You are already a member of this organization");
    }

    await this.prisma.$transaction([
      this.prisma.organizationMember.create({
        data: {
          organizationId: invitation.organizationId,
          userId,
          role: invitation.role,
        },
      }),
      this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      }),
    ]);

    await this.activity.record({
      organizationId: invitation.organizationId,
      actorId: userId,
      type: "MEMBER_JOINED",
      entityType: "member",
      entityId: userId,
      metadata: { email: invitation.email, role: invitation.role },
    });

    return { organizationId: invitation.organizationId, role: invitation.role };
  }

  private async findValidByToken(rawToken: string) {
    if (!rawToken) {
      throw new NotFoundException("Invitation not found");
    }
    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash: this.hashToken(rawToken) },
    });
    if (!invitation) {
      throw new NotFoundException("Invitation not found");
    }
    if (invitation.status !== "PENDING") {
      throw new BadRequestException("This invitation is no longer valid");
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException("This invitation has expired");
    }
    return invitation;
  }

  private hashToken(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
  }
}
