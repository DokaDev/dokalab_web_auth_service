import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { LOGIN_REQUIRED_KEY } from '../decorators/login-required.decorator';
import { RequestContext } from '../request-context';

@Injectable()
export class LoginGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresLogin = this.reflector.getAllAndOverride<boolean>(
      LOGIN_REQUIRED_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 데코레이터가 없는 경우 pass
    if (!requiresLogin) return true;

    const ctx = GqlExecutionContext.create(context);
    const requestContext: RequestContext = ctx.getContext();

    if (!requestContext.currentUser) {
      throw new UnauthorizedException('Login required');
    }

    return true;
  }
}
