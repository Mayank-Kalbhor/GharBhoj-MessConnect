import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { OnboardDeliveryPartnerDto, UpdateAvailabilityDto, DeliverOrderDto } from './dto/delivery.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@messconnect/shared-types';

@ApiTags('Delivery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DELIVERY_PARTNER)
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('partners')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Delivery partner onboarding' })
  async onboardPartner(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: OnboardDeliveryPartnerDto
  ) {
    return this.deliveryService.onboardPartner(user.userId, dto);
  }

  @Patch('partners/me/availability')
  @ApiOperation({ summary: 'Update partner availability and location' })
  async updateAvailability(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateAvailabilityDto
  ) {
    return this.deliveryService.updateAvailability(user.userId, dto);
  }

  @Get('assignments/me')
  @ApiOperation({ summary: 'Get active delivery assignments' })
  async getMyAssignments(@CurrentUser() user: CurrentUserPayload) {
    return this.deliveryService.getMyAssignments(user.userId);
  }

  @Post('assignments/:id/pickup')
  @ApiOperation({ summary: 'Mark order as picked up' })
  async pickupOrder(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string
  ) {
    return this.deliveryService.pickupOrder(user.userId, id);
  }

  @Post('assignments/:id/deliver')
  @ApiOperation({ summary: 'Verify OTP and deliver order' })
  async deliverOrder(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: DeliverOrderDto
  ) {
    return this.deliveryService.deliverOrder(user.userId, id, dto);
  }
}
