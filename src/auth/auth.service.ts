import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import bcrypt from 'node_modules/bcryptjs';
import { PrismaService } from 'src/adapter/prisma/prisma.service';
import { RegisterInputDto } from './dto/register.input.dto';
import { RedisService } from 'src/adapter/redis/redis.service';
import { AccessTokenPayloadDto } from './dto/jwt/jwt.payload.dto';
import { SessionResponseDto } from './dto/jwt/login.response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  public async findUserById(id: number): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { id },
    });
  }

  /**
   * email field is unique
   * @param email string
   */
  public async findUserByEmail(email: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { email },
    });
  }

  public async validateUser(user: User, password: string): Promise<boolean> {
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
    return isPasswordValid;
  }

  public async createUser(input: RegisterInputDto): Promise<User> {
    const { email, password, nickname } = input;

    // 10은 salt의 라운드 수
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prismaService.user.create({
      data: {
        email,
        nickName: nickname,
        hashedPassword,
        isAdmin: false, // 기본적으로 일반 사용자로 생성
      },
    });

    return user;
  }

  public async generateJwtTokens(user: User): Promise<SessionResponseDto> {
    const sessionKey = `user_refresh:${user.id}`;

    return new SessionResponseDto();
  }
}
