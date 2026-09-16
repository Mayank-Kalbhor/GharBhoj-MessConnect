import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  CancelOrderDto,
  OrderFilterQueryDto
} from './dto/orders.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@messconnect/shared-types';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Place a one-time order' })
  async createOrder(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateOrderDto
  ) {
    return this.ordersService.createOrder(user.userId, dto);
  }

  @Get(':id')
  @Roles(UserRole.CUSTOMER, UserRole.VENDOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get order details by ID' })
  async getOrderById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string
  ) {
    return this.ordersService.getOrderById(user.userId, user.role, id);
  }

  @Get()
  @Roles(UserRole.CUSTOMER, UserRole.VENDOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'List orders (filtered by status, date, mealType)' })
  async getOrders(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: OrderFilterQueryDto
  ) {
    return this.ordersService.getOrders(user.userId, user.role, query);
  }

  @Patch(':id/status')
  @Roles(UserRole.VENDOR, UserRole.DELIVERY_PARTNER)
  @ApiOperation({ summary: 'Transition order status forward (PLACED → ACCEPTED → PREPARING → OUT_FOR_DELIVERY → DELIVERED)' })
  async updateStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto
  ) {
    return this.ordersService.updateOrderStatus(user.userId, user.role, id, dto);
  }

  @Post(':id/cancel')
  @Roles(UserRole.CUSTOMER, UserRole.VENDOR)
  @ApiOperation({ summary: 'Cancel an order and trigger refund' })
  async cancelOrder(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CancelOrderDto
  ) {
    return this.ordersService.cancelOrder(user.userId, user.role, id, dto);
  }
}
