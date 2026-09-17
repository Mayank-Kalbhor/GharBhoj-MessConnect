import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ErrorCode } from '../../common/error-codes';
import { AdminService } from './admin.service';
import {
  UpdateMessStatusDto,
  UpdateStudentVerificationDto,
  CreateCityConfigDto,
  UpdateCityConfigDto,
  MessAdminQueryDto
} from './dto/admin.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@messconnect/shared-types';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('mess')
  @ApiOperation({ summary: 'List messes with approval queue filter' })
  async getMesses(@Query() query: MessAdminQueryDto) {
    return this.adminService.getMesses(query);
  }

  @Patch('mess/:id/status')
  @ApiOperation({ summary: 'Approve or suspend a mess' })
  async updateMessStatus(
    @Param('id') id: string,
    @Body() dto: UpdateMessStatusDto
  ) {
    return this.adminService.updateMessStatus(id, dto);
  }

  @Get('users/student-verifications')
  @ApiOperation({ summary: 'List pending student ID verifications' })
  async getStudentVerifications(@Query() query: PaginationQueryDto) {
    return this.adminService.getStudentVerifications(query);
  }

  @Patch('users/:id/student-verification')
  @ApiOperation({ summary: 'Approve or reject student verification' })
  async updateStudentVerification(
    @Param('id') id: string,
    @Body() dto: UpdateStudentVerificationDto
  ) {
    return this.adminService.updateStudentVerification(id, dto);
  }

  @Get('reviews/flagged')
  @ApiOperation({ summary: 'Review moderation queue' })
  async getFlaggedReviews(@Query() query: PaginationQueryDto) {
    return this.adminService.getFlaggedReviews(query);
  }

  @Get('city-configs')
  @ApiOperation({ summary: 'List platform city configs' })
  async getCityConfigs() {
    if (process.env.ENABLE_CITY_CONFIG_UI !== 'true') {
      throw new ForbiddenException({
        code: ErrorCode.FEATURE_DISABLED,
        message: 'City config management is disabled in V1.'
      });
    }
    return this.adminService.getCityConfigs();
  }

  @Post('city-configs')
  @ApiOperation({ summary: 'Create new city config with commission rate' })
  async createCityConfig(@Body() dto: CreateCityConfigDto) {
    if (process.env.ENABLE_CITY_CONFIG_UI !== 'true') {
      throw new ForbiddenException({
        code: ErrorCode.FEATURE_DISABLED,
        message: 'City config management is disabled in V1.'
      });
    }
    return this.adminService.createCityConfig(dto);
  }

  @Patch('city-configs/:id')
  @ApiOperation({ summary: 'Update city commission rate or status' })
  async updateCityConfig(
    @Param('id') id: string,
    @Body() dto: UpdateCityConfigDto
  ) {
    if (process.env.ENABLE_CITY_CONFIG_UI !== 'true') {
      throw new ForbiddenException({
        code: ErrorCode.FEATURE_DISABLED,
        message: 'City config management is disabled in V1.'
      });
    }
    return this.adminService.updateCityConfig(id, dto);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Platform-wide analytics (GMV, active subscriptions, churn)' })
  async getAnalytics() {
    return this.adminService.getPlatformAnalytics();
  }
}
