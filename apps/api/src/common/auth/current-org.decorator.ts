import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { ActiveOrg } from "./active-org.type";

export const CurrentOrg = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ActiveOrg => {
    const request = ctx.switchToHttp().getRequest();
    return request.organization as ActiveOrg;
  },
);
