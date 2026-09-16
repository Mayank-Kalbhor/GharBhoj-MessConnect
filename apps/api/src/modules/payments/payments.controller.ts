import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Headers,
  Req,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { PaymentFilterQueryDto } from './dto/payments.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('razorpay-webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Razorpay asynchronous payment confirmation webhook' })
  async handleWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Req() req: Request,
    @Body() payload: any
  ) {
    const rawBody = (req as any).rawBody || JSON.stringify(payload);
    return this.paymentsService.handleRazorpayWebhook(rawBody, signature, payload);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get payment transaction by ID' })
  async getPaymentById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string
  ) {
    return this.paymentsService.getPaymentById(user.userId, user.role, id);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List payment transactions' })
  async getPayments(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: PaymentFilterQueryDto
  ) {
    return this.paymentsService.getPayments(user.userId, user.role, query);
  }
}
