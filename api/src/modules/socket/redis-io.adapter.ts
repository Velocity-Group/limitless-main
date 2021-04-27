import { IoAdapter } from '@nestjs/platform-socket.io';
import { ConfigService } from 'nestjs-config';

const redisIoAdapter = require('socket.io-redis');

export class RedisIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: any): any {
    // TODO - load from config
    const redisAdapter = redisIoAdapter(ConfigService.get('redis'));

    const server = super.createIOServer(port, options);
    server.adapter(redisAdapter);
    return server;
  }
}
