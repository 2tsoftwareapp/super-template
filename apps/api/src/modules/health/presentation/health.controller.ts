import { Controller, Get } from '@nestjs/common';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { ApiDataResponse } from '../../../common/decorators/api-response.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { HealthService } from '../application/health.service';

class HealthStatusDto {
  @ApiProperty({ enum: ['ok', 'ready'] })
  status!: 'ok' | 'ready';
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  @ApiDataResponse(HealthStatusDto)
  getHealth() {
    return { data: this.healthService.getLiveness() };
  }

  @Get('ready')
  @Public()
  @ApiDataResponse(HealthStatusDto)
  async getReady() {
    return { data: await this.healthService.getReadiness() };
  }
}
