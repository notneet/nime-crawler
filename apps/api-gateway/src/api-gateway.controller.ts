import {
  ApiResponse,
  ApiResponseDto,
  createSuccessResponse,
} from '@app/common';
import { Controller, Get, Logger } from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';
import { ApiGatewayService } from './api-gateway.service';

@ApiTags('health')
@Controller({ version: '1' })
export class ApiGatewayController {
  private readonly logger = new Logger(ApiGatewayController.name);

  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  @Get()
  @ApiOperation({ summary: 'Get API information' })
  @SwaggerApiResponse({
    status: 200,
    description: 'API information retrieved successfully',
    type: ApiResponseDto,
  })
  getApiInfo(): ApiResponse {
    this.logger.log('API info requested');
    return createSuccessResponse(
      'NIME Crawler API Gateway is running',
      this.apiGatewayService.getApiInfo(),
    );
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Health check completed successfully',
    type: ApiResponseDto,
  })
  async getHealthCheck(): Promise<ApiResponse> {
    this.logger.log('Health check requested');
    const healthData = await this.apiGatewayService.getHealthCheck();

    return createSuccessResponse('Health check completed', healthData);
  }

  @Get('api/info')
  @ApiOperation({ summary: 'Get detailed API information' })
  @SwaggerApiResponse({
    status: 200,
    description: 'API details retrieved successfully',
    type: ApiResponseDto,
  })
  async getDetailedApiInfo(): Promise<ApiResponse> {
    this.logger.log('Detailed API info requested');
    const apiDetails = await this.apiGatewayService.getDetailedApiInfo();

    return createSuccessResponse(
      'API details retrieved successfully',
      apiDetails,
    );
  }
}
