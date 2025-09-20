import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { CurrentUserDto } from 'src/auth/dto/current-user.dto';
import { AdminRequired } from 'src/context/decorators/admin-required.decorator';
import { RequestContext } from 'src/context/request-context';
import { AuthService } from './auth.service';
import { LoginInputDto } from './dto/login.input.dto';
import { RegisterInputDto } from './dto/register.input.dto';
import { UserDto } from './dto/user.dto';
import { SessionResponseDto } from './dto/jwt/login.response.dto';
import { RedisService } from 'src/adapter/redis/redis.service';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Query(() => CurrentUserDto, { nullable: true })
  currentUser(@Context() context: RequestContext) {
    return context.currentUser;
  }

  @AdminRequired()
  @Query(() => UserDto, { nullable: true })
  async userById(
    @Args('id', { type: () => Number }) id: number,
  ): Promise<UserDto | null> {
    const user = await this.authService.findUserById(id);
    if (!user) {
      return null;
    }

    return {
      ...user,
      nickname: user.nickName,
    };
  }

  @Query(() => UserDto, { nullable: true })
  async userByEmail(
    @Args('email', { type: () => String }) email: string,
  ): Promise<UserDto | null> {
    const user = await this.authService.findUserByEmail(email);
    if (!user) {
      return null;
    }

    return {
      ...user,
      nickname: user.nickName,
    };
  }

  @Mutation(() => SessionResponseDto)
  async login(
    @Args('loginInput', { type: () => LoginInputDto })
    loginInput: LoginInputDto,
  ): Promise<SessionResponseDto> {
    // Implement your login logic here
    const { email, password } = loginInput;

    const user = await this.authService.findUserByEmail(email);
    if (!user) {
      throw new GraphQLError('User not found', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    const isPasswordValid = await this.authService.validateUser(user, password);
    if (!isPasswordValid) {
      throw new GraphQLError('Invalid password', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // TODO: 해당 사용자에게 활성화된 상태의 refresh token이 있는지 확인
    // const userSessionKey: string = `refresh:userId:${user.id}`;
    // const buf = await this.redisService.getBuffer(userSessionKey);
    // if (buf) {
    //   // 활성화된 세션이 이미 존재함
    //   // TODO: 현재 해당 세션의 TTL을 현 시점을 기준으로 업데이트 후 액세스 토큰 발급
    // } else {
    //   // 활성화된 세션이 존재하지 않음

    const jwt = await this.authService.generateJwtTokens(user);

    // TODO: generate JWT access token and refresh token
    // 리프레시 토큰은 redis에 ttl로 저장

    return new SessionResponseDto();
  }

  @Mutation(() => UserDto)
  async register(
    @Args('registerInput', { type: () => RegisterInputDto })
    input: RegisterInputDto,
  ) {
    const registeredUser = await this.authService.createUser(input);

    return {
      ...registeredUser,
      nickname: registeredUser.nickName,
    };
  }
}
