import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@messconnect/shared-types';

export interface CurrentUserPayload {
  userId: string;
  role: UserRole;
  phone: string;
  email?: string | null;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload;
    return data && user ? user[data] : user;
  },
);
