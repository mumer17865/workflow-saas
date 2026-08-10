import { Module } from "@nestjs/common";
import { ActivityModule } from "../activity/activity.module";
import { InvitationsService } from "./invitations.service";
import { OrgInvitationsController } from "./org-invitations.controller";
import { InvitationsController } from "./invitations.controller";

@Module({
  imports: [ActivityModule],
  controllers: [OrgInvitationsController, InvitationsController],
  providers: [InvitationsService],
})
export class InvitationsModule {}
