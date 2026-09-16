import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';
import { RunPayoutsDto } from './dto/payouts.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@messconnect/shared-types';

@ApiTags('Payouts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get('vendor/payouts/me')
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Get vendor payout settlement history' })
  async getVendorPayouts(@CurrentUser() user: CurrentUserPayload) {
    return this.payoutsService.getVendorPayouts(user.userId);
  }

  @Post('admin/payouts/run')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger payout batch execution for a settlement period' })
  async runPayoutBatch(@Body() dto: RunPayoutsDto) {
    return this.payoutsService.runPayoutBatch(dto);
  }
}
