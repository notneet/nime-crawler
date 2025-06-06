import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiGatewayService } from './api-gateway.service';

@ApiTags('health')
@Controller({ version: '1' })
export class ApiGatewayController {
  private readonly logger = new Logger(ApiGatewayController.name);

  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  @Get()
  @ApiOperation({ summary: 'Get API information' })
  @ApiResponse({ status: 200, description: 'API information retrieved successfully' })
  getApiInfo() {
    this.logger.log('API info requested');
    return {
      success: true,
      message: 'NIME Crawler API Gateway is running',
      data: this.apiGatewayService.getApiInfo(),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Health check completed successfully' })
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
  @ApiOperation({ summary: 'Get detailed API information' })
  @ApiResponse({ status: 200, description: 'API details retrieved successfully' })
  getApiDetails() {
    this.logger.log('API details requested');
    return {
      success: true,
      message: 'API details retrieved successfully',
      data: this.apiGatewayService.getApiInfo(),
    };
  }
}
