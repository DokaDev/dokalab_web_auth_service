import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import bcrypt from 'node_modules/bcryptjs';
import { PrismaService } from 'src/adapter/prisma/prisma.service';
import { RedisService } from 'src/adapter/redis/redis.service';
import { generateUUID } from 'src/util/uuid/uuid.util';
import { REFRESH_TOKEN_EXPIRATION } from './constant/jwt.constant';
import { CurrentUserDto } from './dto/current-user.dto';
import { AccessTokenPayloadDto } from './dto/jwt/jwt.payload.dto';
import { SessionResponseDto } from './dto/jwt/login.response.dto';
import { RegisterInputDto } from './dto/register.input.dto';
import { TypedConfigService } from 'src/config/config.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: TypedConfigService,
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

  /**
   * refresh-token value -> uuid
   * @param user
   * @returns
   */
  public async generateJwtTokens(user: User): Promise<SessionResponseDto> {
    const sessionKey = `user_refresh:${user.id}`;

    // refresh token = session
    const userSession = await this.redisService.get(sessionKey);

    let sessionId: string;

    if (!userSession) sessionId = generateUUID();
    else sessionId = userSession.toString();

    await this.redisService.setex(
      sessionKey,
      REFRESH_TOKEN_EXPIRATION,
      sessionId,
    );

    console.log('Generated Refresh Token:', sessionId);

    const accessToken = await this.generateAccessToken(user);

    console.log('Generated Access Token:', accessToken);

    return {
      accessToken,
      refreshToken: sessionId,
    };
  }

  public async refreshAccessToken(
    userId: number,
    refreshToken: string,
  ): Promise<string> {
    const sessionKey = `user_refresh:${userId}`;

    // 세션 존재하는지 확인
    const userSession = await this.redisService.get(sessionKey);

    if (!userSession) {
      throw new Error('No active session found. Please log in again.');
    } else {
      if (userSession !== refreshToken) {
        throw new Error('Invalid refresh token. Please log in again.');
      }
      const user = await this.findUserById(userId);
      if (!user) {
        throw new Error('User not found. Please log in again.');
      }

      await this.redisService.setex(
        sessionKey,
        REFRESH_TOKEN_EXPIRATION,
        userSession,
      );

      return await this.generateAccessToken(user);
    }
  }

  private async generateAccessToken(user: User): Promise<string> {
    const secret = this.configService.get('JWT_SECRET');
    const expiresIn = this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION');

    const payload: AccessTokenPayloadDto = {
      ...user,
      nickname: user.nickName,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });

    return accessToken;
  }

  public async verifyTokenAndCreateUserContext(accessToken: string) {
    const secret = this.configService.get('JWT_SECRET');

    try {
      const payload: AccessTokenPayloadDto = await this.jwtService.verifyAsync(
        accessToken,
        {
          secret,
        },
      );
      console.log('Verified JWT Payload:', payload);

      const user = await this.findUserById(payload.id);
      if (!user) {
        return null; // 로그인 문제 관련해서는 login guard에서 처리
      }

      const currentUser: CurrentUserDto = {
        id: payload.id,
        nickname: payload.nickname,
        isAdmin: payload.isAdmin,
        userInput: accessToken,
      };

      return currentUser;
    } catch {
      return null;
    }
  }
}
