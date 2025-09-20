import Joi from 'joi';
import { createTypedConfig } from 'nestjs-typed-config';

export const { TypedConfigService, TypedConfigModule } = createTypedConfig({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  JWT_SECRET: Joi.string()
    .min(32)
    .default('your_jwt_secret_key_here_at_least_32_characters_long_dev'),
  // .required(),
  JWT_ACCESS_TOKEN_EXPIRATION: Joi.string().default('1h'), // Access Token 1시간 (블로그 읽기 충분)
});

export type TypedConfigService = InstanceType<typeof TypedConfigService>;
