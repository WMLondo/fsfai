import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

export type HealthStatus = { status: 'ok' };

@ApiTags('health')
@AllowAnonymous()
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({
    description: 'La API está en marcha.',
    schema: {
      type: 'object',
      properties: { status: { type: 'string', enum: ['ok'] } },
      required: ['status'],
    },
  })
  check(): HealthStatus {
    return { status: 'ok' };
  }
}
