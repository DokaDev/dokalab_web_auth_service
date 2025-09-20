import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AccessTokenPayloadDto {
  @Field(() => Number)
  id: number;

  @Field(() => String)
  email: string;

  @Field(() => String)
  nickname: string;

  @Field(() => Boolean)
  isAdmin: boolean;

  /**
   * Dto 필드 상에서는 nullable
   * - 사용자정보 지정과 iat/exp 대입 주기가 다르기 때문
   * 단, graphql 스키마 레벨에서는 not null
   */
  @Field(() => Number)
  iat?: number;

  @Field(() => Number)
  exp?: number;
}
