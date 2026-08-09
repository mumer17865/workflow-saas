import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    // Attempt an eager connection, but don't crash the app if the database
    // is unreachable at boot — the health endpoint reports status instead,
    // and Prisma reconnects lazily on the first successful query.
    try {
      await this.$connect();
      this.logger.log("Connected to PostgreSQL");
    } catch (error) {
      this.logger.warn(
        `Could not connect to PostgreSQL at startup: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
