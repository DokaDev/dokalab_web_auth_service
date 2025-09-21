import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { CurrentUserDto } from 'src/auth/dto/current-user.dto';
import { AdminRequired } from 'src/context/decorators/admin-required.decorator';
import { RequestContext } from 'src/context/request-context';
import { AuthService } from './auth.service';
import { SessionResponseDto } from './dto/jwt/login.response.dto';
import { LoginInputDto } from './dto/login.input.dto';
import { RegisterInputDto } from './dto/register.input.dto';
import { UserDto } from './dto/user.dto';

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
    @Args('id', { type: () => Int }) id: number,
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
    return await this.authService.generateJwtTokens(user);
  }

  @Mutation(() => UserDto)
  async register(
    @Args('registerInput', { type: () => RegisterInputDto })
    input: RegisterInputDto,
  ) {
    const existingUser = await this.authService.findUserByEmail(input.email);
    if (existingUser) {
      throw new GraphQLError('Email already in use', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    const registeredUser = await this.authService.createUser(input);

    return {
      ...registeredUser,
      nickname: registeredUser.nickName,
    };
  }

  @Mutation(() => SessionResponseDto)
  async refreshAccessToken(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('refreshToken', { type: () => String }) refreshToken: string,
  ): Promise<SessionResponseDto> {
    const accessToken = await this.authService.refreshAccessToken(
      userId,
      refreshToken,
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  @Mutation(() => Boolean)
  async logout(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('refreshToken', { type: () => String }) refreshToken: string,
  ): Promise<boolean> {
    return this.authService.revokeRefreshToken(userId, refreshToken);
  }

  // master 위임
  @Mutation(() => Boolean)
  @AdminRequired()
  async grantMasterRole(
    @Args('userId', { type: () => Int }) userId: number,
    @Context() context: RequestContext,
  ): Promise<boolean> {
    return await this.authService.grantMasterRole(context, userId);
  }
}
