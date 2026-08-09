import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "crypto";
import { PrismaService } from "../../common/prisma/prisma.service";
import { parseDurationToMs } from "./auth.constants";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { AuthenticatedUser, JwtPayload } from "./types/jwt-payload";

interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

@Injectable()
export class AuthService {
  private readonly refreshTtlMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.refreshTtlMs = parseDurationToMs(
      this.config.get<string>("JWT_REFRESH_TTL"),
      7 * 86_400_000,
    );
  }

  async register(dto: RegisterDto): Promise<{
    user: AuthenticatedUser;
    accessToken: string;
    refreshToken: string;
    refreshExpiresAt: Date;
  }> {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException("Email is already registered");
    }

    const passwordHash = await argon2.hash(dto.password);
    const orgName =
      dto.organizationName?.trim() || `${dto.name.trim()}'s Organization`;

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name: dto.name.trim(), email, passwordHash },
      });
      const org = await tx.organization.create({
        data: { name: orgName, ownerId: created.id },
      });
      await tx.organizationMember.create({
        data: { organizationId: org.id, userId: created.id, role: "ADMIN" },
      });
      return created;
    });

    const tokens = await this.issueTokens(user.id, user.email);
    return { user: this.toAuthUser(user), ...tokens };
  }

  async login(dto: LoginDto): Promise<{
    user: AuthenticatedUser;
    accessToken: string;
    refreshToken: string;
    refreshExpiresAt: Date;
  }> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Verify against a real hash when the user exists; otherwise fall through
    // to a generic error so we don't leak which emails are registered.
    const valid = user
      ? await argon2.verify(user.passwordHash, dto.password).catch(() => false)
      : false;

    if (!user || !valid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const tokens = await this.issueTokens(user.id, user.email);
    return { user: this.toAuthUser(user), ...tokens };
  }

  async refresh(rawToken: string | undefined): Promise<IssuedTokens> {
    if (!rawToken) {
      throw new UnauthorizedException("Missing refresh token");
    }

    const tokenHash = this.hashToken(rawToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!record) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Reuse of an already-rotated token signals theft — revoke the whole chain.
    if (record.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException("Refresh token reuse detected");
    }

    if (record.expiresAt.getTime() < Date.now()) {
      await this.prisma.refreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException("Refresh token expired");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: record.userId },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Rotate: revoke the presented token, issue a fresh pair.
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(user.id, user.email);
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    const tokenHash = this.hashToken(rawToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: { organization: { select: { id: true, name: true } } },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt,
      organizations: user.memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        role: m.role,
      })),
    };
  }

  /** Used by the JWT strategy to confirm the user still exists. */
  async validateById(userId: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user ? this.toAuthUser(user) : null;
  }

  private async issueTokens(
    userId: string,
    email: string,
  ): Promise<IssuedTokens> {
    const payload: JwtPayload = { sub: userId, email };
    const accessToken = await this.jwt.signAsync(payload);

    const refreshToken = randomBytes(48).toString("hex");
    const refreshExpiresAt = new Date(Date.now() + this.refreshTtlMs);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: refreshExpiresAt,
      },
    });

    return { accessToken, refreshToken, refreshExpiresAt };
  }

  private hashToken(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
  }

  private toAuthUser(user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  }): AuthenticatedUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    };
  }
}
