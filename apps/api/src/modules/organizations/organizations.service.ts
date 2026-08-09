import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrgRole } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrent(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { _count: { select: { members: true } } },
    });
    if (!org) {
      throw new NotFoundException("Organization not found");
    }
    return {
      id: org.id,
      name: org.name,
      ownerId: org.ownerId,
      memberCount: org._count.members,
      createdAt: org.createdAt,
    };
  }

  async update(organizationId: string, name: string) {
    const org = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { name: name.trim() },
    });
    return { id: org.id, name: org.name };
  }

  async listMembers(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true },
    });
    if (!org) {
      throw new NotFoundException("Organization not found");
    }

    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return members.map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatar: m.user.avatar,
      role: m.role,
      isOwner: m.user.id === org.ownerId,
      joinedAt: m.createdAt,
    }));
  }

  async updateMemberRole(
    organizationId: string,
    targetUserId: string,
    role: OrgRole,
  ) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true },
    });
    if (!org) {
      throw new NotFoundException("Organization not found");
    }
    if (targetUserId === org.ownerId) {
      throw new ForbiddenException("The organization owner's role cannot be changed");
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: targetUserId },
      },
    });
    if (!membership) {
      throw new NotFoundException("Member not found");
    }

    const updated = await this.prisma.organizationMember.update({
      where: { id: membership.id },
      data: { role },
    });
    return { userId: targetUserId, role: updated.role };
  }

  async removeMember(
    organizationId: string,
    targetUserId: string,
    actingUserId: string,
  ) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true },
    });
    if (!org) {
      throw new NotFoundException("Organization not found");
    }
    if (targetUserId === org.ownerId) {
      throw new ForbiddenException("The organization owner cannot be removed");
    }
    if (targetUserId === actingUserId) {
      throw new BadRequestException("You cannot remove yourself");
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: targetUserId },
      },
    });
    if (!membership) {
      throw new NotFoundException("Member not found");
    }

    await this.prisma.organizationMember.delete({
      where: { id: membership.id },
    });
    return { success: true };
  }
}
