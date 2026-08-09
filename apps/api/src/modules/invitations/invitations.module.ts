import { Module } from "@nestjs/common";
import { InvitationsService } from "./invitations.service";
import { OrgInvitationsController } from "./org-invitations.controller";
import { InvitationsController } from "./invitations.controller";

@Module({
  controllers: [OrgInvitationsController, InvitationsController],
  providers: [InvitationsService],
})
export class InvitationsModule {}
