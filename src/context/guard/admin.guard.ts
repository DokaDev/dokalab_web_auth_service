import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ADMIN_REQUIRED_KEY } from '../decorators/admin-required.decorator';
import { RequestContext } from '../request-context';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const requiresAdmin = this.reflector.getAllAndOverride<boolean>(
      ADMIN_REQUIRED_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 데코레이터가 없는 경우 pass
    if (!requiresAdmin) return true;

    const ctx = GqlExecutionContext.create(context);
    const requestContext: RequestContext = ctx.getContext();

    if (!requestContext.currentUser) {
      throw new UnauthorizedException('Login required');
    }

    if (!requestContext.currentUser?.isAdmin) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
