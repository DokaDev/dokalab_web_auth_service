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
    .default('your_jwt_secret_key_here')
    .required(),
  JWT_ACCESS_TOKEN_EXPIRATION: Joi.string().default('15m'), // Access Token 짧게
  JWT_REFRESH_TOKEN_EXPIRATION: Joi.string().default('7d'), // Refresh Token 길게
});

export type TypedConfigService = InstanceType<typeof TypedConfigService>;
