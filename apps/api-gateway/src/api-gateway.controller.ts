import { Controller, Get, Logger } from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';

@Controller()
export class ApiGatewayController {
  private readonly logger = new Logger(ApiGatewayController.name);

  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  @Get()
  getApiInfo() {
    this.logger.log('API info requested');
    return {
      success: true,
      message: 'NIME Crawler API Gateway is running',
      data: this.apiGatewayService.getApiInfo(),
    };
  }

  @Get('health')
  async getHealthCheck() {
    this.logger.log('Health check requested');
    const healthData = await this.apiGatewayService.getHealthCheck();
    return {
      success: true,
      message: 'Health check completed',
      data: healthData,
    };
  }

  @Get('api/info')
  getApiDetails() {
    this.logger.log('API details requested');
    return {
      success: true,
      message: 'API details retrieved successfully',
      data: this.apiGatewayService.getApiInfo(),
    };
  }
}
