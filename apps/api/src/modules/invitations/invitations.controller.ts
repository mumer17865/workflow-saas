import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/types/jwt-payload";
import { InvitationsService } from "./invitations.service";

@Controller("invitations")
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Get("preview")
  preview(@Query("token") token: string) {
    return this.invitations.preview(token);
  }

  @Post("accept")
  @HttpCode(HttpStatus.OK)
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Body("token") token: string,
  ) {
    return this.invitations.accept(token, user.id, user.email);
  }
}
