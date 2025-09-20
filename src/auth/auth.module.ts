import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { PrismaModule } from 'src/adapter/prisma/prisma.module';
import { RedisModule } from 'src/adapter/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [AuthService, AuthResolver],
  exports: [AuthService],
})
export class AuthModule {}
