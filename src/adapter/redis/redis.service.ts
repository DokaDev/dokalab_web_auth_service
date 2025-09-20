import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { TypedConfigService } from 'src/config/config.service';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnApplicationShutdown {
  constructor(private readonly configService: TypedConfigService) {
    super({
      host: configService.get('REDIS_HOST'),
      port: configService.get('REDIS_PORT'),
    });
  }

  async onApplicationShutdown() {
    await this.quit();
  }
}
