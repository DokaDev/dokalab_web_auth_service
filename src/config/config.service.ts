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
  JWT_EXPIRATION_TIME: Joi.string().default('1h'),
});

export type TypedConfigService = InstanceType<typeof TypedConfigService>;
