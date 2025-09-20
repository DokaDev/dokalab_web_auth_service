import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { RequestContext } from './request-context';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class ContextMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    let user: CurrentUserDto | null = null;

    const auth = req.headers['authorization']; // ignore-case
    if (auth?.startsWith('Bearer ')) {
      try {
        const token = auth.substring(7); // 'Bearer ' 제거
        user = await this.authService.verifyTokenAndCreateUserContext(token);
      } catch {
        user = null;
      }
    }
    if (user) {
      req.context = new RequestContext(req, res, user);
    } else {
      req.context = new RequestContext(req, res);
    }

    next();
  }
}
