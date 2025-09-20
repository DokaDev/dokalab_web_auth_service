import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SessionResponseDto {
  @Field(() => String)
  accessToken: string;

  @Field(() => String)
  refreshToken: string;
}
