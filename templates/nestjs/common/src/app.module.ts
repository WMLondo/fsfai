import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { LoggerModule } from 'nestjs-pino';
import { auth } from './auth/index.js';
import { type Config, loadConfig } from './config/index.js';
import { DatabaseModule } from './database/index.js';
import { HealthModule } from './health/index.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [loadConfig] }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Config, true>) => {
        const logger = config.get('logger', { infer: true });
        return {
          pinoHttp: {
            level: logger.level,
            transport: logger.pretty
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
          },
        };
      },
    }),
    DatabaseModule,
    AuthModule.forRoot({ auth }),
    HealthModule,
  ],
})
export class AppModule {}
