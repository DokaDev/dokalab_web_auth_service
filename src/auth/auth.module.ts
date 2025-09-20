import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/adapter/prisma/prisma.module';
import { RedisModule } from 'src/adapter/redis/redis.module';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';

@Module({
  imports: [PrismaModule, RedisModule, JwtModule],
  providers: [AuthService, AuthResolver],
  exports: [AuthService],
})
export class AuthModule {}
