import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import {
  CreateSubscriptionDto,
  SkipMealDto,
  RedeemSkipCreditDto,
  PauseSubscriptionDto,
  CancelSubscriptionDto,
  SwitchMessDto,
  SubscriptionFilterQueryDto
} from './dto/subscriptions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@messconnect/shared-types';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Purchase a new subscription' })
  async createSubscription(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateSubscriptionDto
  ) {
    return this.subscriptionsService.createSubscription(user.userId, dto);
  }

  @Get(':id')
  @Roles(UserRole.CUSTOMER, UserRole.VENDOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get subscription details by ID' })
  async getSubscriptionById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string
  ) {
    return this.subscriptionsService.getSubscriptionById(user.userId, user.role, id);
  }

  @Get()
  @Roles(UserRole.CUSTOMER, UserRole.VENDOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'List subscriptions (filtered by status)' })
  async getSubscriptions(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: SubscriptionFilterQueryDto
  ) {
    return this.subscriptionsService.getSubscriptions(user.userId, user.role, query);
  }

  @Post(':id/skip')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Skip one day scheduled meal before cutoff' })
  async skipMeal(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: SkipMealDto
  ) {
    return this.subscriptionsService.skipMeal(user.userId, id, dto);
  }

  @Post(':id/redeem-skip-credit')
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Redeem a banked skip credit for a meal' })
  async redeemSkipCredit(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: RedeemSkipCreditDto
  ) {
    return this.subscriptionsService.redeemSkipCredit(user.userId, id, dto);
  }

  @Post(':id/pause')
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Pause subscription and extend end date' })
  async pauseSubscription(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: PauseSubscriptionDto
  ) {
    return this.subscriptionsService.pauseSubscription(user.userId, id, dto);
  }

  @Post(':id/cancel')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Cancel subscription with pro-rated refund' })
  async cancelSubscription(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CancelSubscriptionDto
  ) {
    return this.subscriptionsService.cancelSubscription(user.userId, id, dto);
  }

  @Post(':id/switch-mess')
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Mid-cycle portability: switch mess with wallet credit transfer' })
  async switchMess(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: SwitchMessDto
  ) {
    return this.subscriptionsService.switchMess(user.userId, id, dto);
  }
}
