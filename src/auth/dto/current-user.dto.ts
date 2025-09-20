import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CurrentUserDto {
  @Field(() => Number)
  id: number;

  @Field(() => String)
  nickname: string;

  @Field(() => Boolean)
  isAdmin: boolean;

  @Field(() => String, { nullable: true })
  userInput?: string;
}
