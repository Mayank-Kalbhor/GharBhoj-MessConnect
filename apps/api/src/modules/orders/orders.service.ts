import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  ForbiddenException,
  Logger
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RazorpayService } from '../../integrations/razorpay/razorpay.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  CancelOrderDto,
  OrderFilterQueryDto
} from './dto/orders.dto';
import {
  OrderStatus,
  OrderType,
  PaymentType,
  PaymentStatus,
  UserRole
} from '@messconnect/shared-types';
import { ErrorCode } from '../../common/error-codes';
import { buildPaginatedResponse } from '../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  // Status transition map: only forward moves allowed
  private readonly validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PLACED]: [OrderStatus.ACCEPTED],
    [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING],
    [OrderStatus.PREPARING]: [OrderStatus.OUT_FOR_DELIVERY],
    [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.SKIPPED]: []
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpayService: RazorpayService
  ) {}

  async createOrder(customerId: string, dto: CreateOrderDto) {
    const scheduledDateObj = new Date(dto.scheduledDate);

    // Fetch items to compute total amount
    const menuItemIds = dto.items.map(i => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, messId: dto.messId, isAvailable: true }
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new UnprocessableEntityException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'One or more selected menu items are unavailable or not offered by this mess.'
      });
    }

    // Calculate total order amount with Decimal.js
    let totalAmount = new Decimal(0);
    const itemDetails = dto.items.map(reqItem => {
      const item = menuItems.find(m => m.id === reqItem.menuItemId)!;
      const priceEach = new Decimal(item.price.toString());
      const itemTotal = priceEach.mul(reqItem.quantity);
      totalAmount = totalAmount.plus(itemTotal);
      return {
        menuItemId: item.id,
        quantity: reqItem.quantity,
        priceEach: item.price
      };
    });

    // Execute interactive transaction with row lock implementing Rule 6
    return this.prisma.$transaction(async (tx) => {
      // Find and lock target DailyMenu row using SELECT ... FOR UPDATE
      const dailyMenus: any[] = await tx.$queryRaw`
        SELECT id, capacity, "ordersPlaced", "cutoffTime"
        FROM "DailyMenu"
        WHERE "messId" = ${dto.messId}
          AND date = ${scheduledDateObj}
          AND "mealType"::text = ${dto.mealType}
        FOR UPDATE;
      `;

      if (!dailyMenus || dailyMenus.length === 0) {
        throw new NotFoundException({
          code: ErrorCode.NOT_FOUND,
          message: `No daily menu published for ${dto.scheduledDate} (${dto.mealType}).`
        });
      }

      const dailyMenu = dailyMenus[0];
      const now = new Date();

      // Rule 6.2: Rejects with 422 CUTOFF_PASSED if now() > cutoffTime
      if (now > new Date(dailyMenu.cutoffTime)) {
        throw new UnprocessableEntityException({
          code: ErrorCode.CUTOFF_PASSED,
          message: `The cutoff time for ordering ${dto.mealType} on ${dto.scheduledDate} has passed.`
        });
      }

      // Rule 6.3: Rejects with 409 CAPACITY_EXCEEDED if ordersPlaced >= capacity
      if (dailyMenu.ordersPlaced >= dailyMenu.capacity) {
        throw new ConflictException({
          code: ErrorCode.CAPACITY_EXCEEDED,
          message: 'This meal slot is sold out. Vendor capacity reached.'
        });
      }

      // Increment ordersPlaced inside locked transaction
      await tx.$executeRaw`
        UPDATE "DailyMenu"
        SET "ordersPlaced" = "ordersPlaced" + 1
        WHERE id = ${dailyMenu.id};
      `;

      // Create Order & OrderItems
      const order = await tx.order.create({
        data: {
          orderType: OrderType.ONE_TIME,
          userId: customerId,
          messId: dto.messId,
          addressId: dto.addressId,
          mealType: dto.mealType,
          scheduledDate: scheduledDateObj,
          status: OrderStatus.PLACED,
          amount: new Prisma.Decimal(totalAmount.toFixed(2)),
          orderItems: {
            create: itemDetails.map(i => ({
              menuItemId: i.menuItemId,
              quantity: i.quantity,
              priceEach: i.priceEach
            }))
          }
        }
      });

      // Initiate Razorpay Order & Payment row
      const amountInPaise = Math.round(totalAmount.mul(100).toNumber());
      const rzpOrder = await this.razorpayService.createOrder({
        amountInPaise,
        receipt: `rcpt_${order.id.slice(0, 10)}`
      });

      await tx.payment.create({
        data: {
          userId: customerId,
          orderId: order.id,
          amount: new Prisma.Decimal(totalAmount.toFixed(2)),
          currency: 'INR',
          type: PaymentType.ORDER_PAYMENT,
          status: PaymentStatus.PENDING,
          razorpayOrderId: rzpOrder.id
        }
      });

      return {
        id: order.id,
        orderType: OrderType.ONE_TIME,
        status: order.status,
        amount: order.amount.toString(),
        razorpayOrderId: rzpOrder.id
      };
    }, { maxWait: 30000, timeout: 60000 });
  }

  async getOrderById(userId: string, role: UserRole, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: { include: { menuItem: true } },
        payment: true,
        delivery: true,
        address: true,
        mess: { select: { id: true, name: true, ownerId: true } }
      }
    });

    if (!order) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Order not found.'
      });
    }

    // Permission check: owning CUSTOMER, owning VENDOR, or ADMIN
    if (role === UserRole.CUSTOMER && order.userId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'Not authorized to view this order.' });
    }
    if (role === UserRole.VENDOR && order.mess.ownerId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'Not authorized to view this order.' });
    }

    return {
      ...order,
      amount: order.amount.toString(),
      scheduledDate: order.scheduledDate.toISOString().split('T')[0]
    };
  }

  async getOrders(userId: string, role: UserRole, query: OrderFilterQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.scheduledDate && { scheduledDate: new Date(query.scheduledDate) }),
      ...(query.mealType && { mealType: query.mealType })
    };

    if (role === UserRole.CUSTOMER) {
      where.userId = userId;
    } else if (role === UserRole.VENDOR) {
      const mess = await this.prisma.mess.findUnique({ where: { ownerId: userId } });
      if (!mess) return buildPaginatedResponse([], 0, page, limit);
      where.messId = mess.id;
    }

    const [totalItems, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          orderItems: { include: { menuItem: true } },
          payment: true
        }
      })
    ]);

    const formatted = orders.map(o => ({
      ...o,
      amount: o.amount.toString(),
      scheduledDate: o.scheduledDate.toISOString().split('T')[0]
    }));

    return buildPaginatedResponse(formatted, totalItems, page, limit);
  }

  async updateOrderStatus(userId: string, role: UserRole, orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        mess: { select: { ownerId: true } },
        delivery: true
      }
    });

    if (!order) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Order not found.' });
    }

    // Role check
    if (role === UserRole.VENDOR && order.mess.ownerId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'Not authorized to manage this order.' });
    }
    if (role === UserRole.DELIVERY_PARTNER) {
      const partner = await this.prisma.deliveryPartner.findUnique({ where: { userId } });
      if (!order.delivery || order.delivery.deliveryPartnerId !== partner?.id) {
        throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'Not assigned to this delivery.' });
      }
    }

    // Strict forward transition validation
    const allowedNext = this.validTransitions[order.status as OrderStatus];
    if (!allowedNext || !allowedNext.includes(dto.status)) {
      throw new UnprocessableEntityException({
        code: ErrorCode.INVALID_STATUS_TRANSITION,
        message: `Invalid order status transition from ${order.status} to ${dto.status}. Forward sequence: PLACED → ACCEPTED → PREPARING → OUT_FOR_DELIVERY → DELIVERED.`
      });
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status }
    });

    return {
      ...updated,
      amount: updated.amount.toString()
    };
  }

  async cancelOrder(userId: string, role: UserRole, orderId: string, dto: CancelOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        mess: { select: { ownerId: true } },
        payment: true
      }
    });

    if (!order) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Order not found.' });
    }

    // Customer can only cancel while status IN (PLACED, ACCEPTED)
    if (role === UserRole.CUSTOMER) {
      if (order.userId !== userId) {
        throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'Not your order.' });
      }
      if (![OrderStatus.PLACED, OrderStatus.ACCEPTED].includes(order.status as OrderStatus)) {
        throw new UnprocessableEntityException({
          code: ErrorCode.ORDER_CANNOT_BE_CANCELLED,
          message: `Order cannot be cancelled in status ${order.status}.`
        });
      }
    } else if (role === UserRole.VENDOR) {
      if (order.mess.ownerId !== userId) {
        throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'Not your mess order.' });
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Mark order CANCELLED
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED }
      });

      // Append-only refund payment row (Rule 5 & I4)
      let refundPayment: any = null;
      if (order.payment && order.payment.status === PaymentStatus.SUCCESS) {
        refundPayment = await tx.payment.create({
          data: {
            userId: order.userId,
            orderId: order.id,
            amount: order.amount,
            currency: 'INR',
            type: PaymentType.REFUND,
            status: PaymentStatus.SUCCESS,
            razorpayPaymentId: `rfnd_${order.payment.razorpayPaymentId || 'auto'}`
          }
        });
      }

      return {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        refundPaymentId: refundPayment ? refundPayment.id : null,
        reason: dto.reason
      };
    });
  }
}
