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

    // master 테이블의 가장 최근 레코드 하나(created_at 기준 desc)를 뽑아서, 이게 null일 경우, 즉 마스터 유저가 없을 경우에만, isAdmin을 true로 주는 로직
    const latestMasterRecord = await this.prismaService.master.findFirst({
      orderBy: { grantedAt: 'desc' },
    });
    const isFirstUser = !latestMasterRecord;

    // 10은 salt의 라운드 수
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prismaService.user.create({
      data: {
        email,
        nickName: nickname,
        hashedPassword,
        isAdmin: isFirstUser, // 최초 가입자에게만 관리자 권한 부여
      },
    });
    if (isFirstUser) {
      // 최초 가입자라면 Master 테이블에도 레코드 추가
      await this.prismaService.master.create({
        data: {
          userId: user.id,
        },
      });
    }

    return user;
  }

  /**
   * refresh-token value -> uuid
   * @param user
   * @returns
   */
  public async generateJwtTokens(user: User): Promise<SessionResponseDto> {
    const refreshToken = await this.generateRefreshToken(user);
    const accessToken = await this.generateAccessToken(user);
    return {
      accessToken,
      refreshToken,
    };
  }

  private async generateRefreshToken(user: User): Promise<string> {
    const refreshTokenBody = generateUUID();
    const sessionKey = `user_refresh:${user.id}:${refreshTokenBody}`;

    await this.redisService.setex(
      sessionKey,
      REFRESH_TOKEN_EXPIRATION,
      refreshTokenBody,
    );

    return refreshTokenBody;
  }

  public async refreshAccessToken(
    userId: number,
    refreshToken: string,
  ): Promise<string> {
    const sessionKey = `user_refresh:${userId}:${refreshToken}`;

    // 세션 존재하는지 확인
    const userSession = await this.redisService.get(sessionKey);

    if (!userSession) {
      throw new Error('No active session found. Please log in again.'); // 세션 무효화된 경우 + 위조된 토큰이라 서버 내 세션키와 매칭되지 않는 경우
    } else {
      if (userSession !== refreshToken) {
        throw new Error('Invalid refresh token. Please log in again.'); // 사용자가 제시한 리프레시토큰과 리프레시토큰 내의 실제 body가 불일치한 경우
      }
      const user = await this.findUserById(userId);
      if (!user) {
        throw new Error('User not found. Please log in again.');
      }

      // refresh token을 현 시점 기준으로 재연장
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
        return null; // 로그인 문제 관련해서는 login guard에서 처리 -> LoginRequired이거나 AdminRequired인 경우 context 내의 user가 null이면 에러 뱉는 상태
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

  public async revokeRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<boolean> {
    const sessionKey = `user_refresh:${userId}:${refreshToken}`;

    const result = await this.redisService.del(sessionKey);
    return result > 0;
  }
}
