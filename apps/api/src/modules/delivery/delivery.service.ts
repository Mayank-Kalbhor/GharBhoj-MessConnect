import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  Logger
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OnboardDeliveryPartnerDto, UpdateAvailabilityDto, DeliverOrderDto } from './dto/delivery.dto';
import { DeliveryStatus, OrderStatus } from '@messconnect/shared-types';
import { ErrorCode } from '../../common/error-codes';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onboardPartner(userId: string, dto: OnboardDeliveryPartnerDto) {
    const existing = await this.prisma.deliveryPartner.findUnique({
      where: { userId }
    });

    if (existing) {
      throw new ConflictException({
        code: ErrorCode.CONFLICT,
        message: 'Delivery partner profile already exists.'
      });
    }

    return this.prisma.deliveryPartner.create({
      data: {
        userId,
        vehicleType: dto.vehicleType,
        isAvailable: true
      }
    });
  }

  async updateAvailability(userId: string, dto: UpdateAvailabilityDto) {
    const partner = await this.prisma.deliveryPartner.findUnique({
      where: { userId }
    });

    if (!partner) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Delivery partner profile not found.' });
    }

    return this.prisma.deliveryPartner.update({
      where: { id: partner.id },
      data: {
        isAvailable: dto.isAvailable,
        ...(dto.currentLatitude !== undefined && { currentLatitude: dto.currentLatitude }),
        ...(dto.currentLongitude !== undefined && { currentLongitude: dto.currentLongitude }),
      }
    });
  }

  async getMyAssignments(userId: string) {
    const partner = await this.prisma.deliveryPartner.findUnique({
      where: { userId }
    });

    if (!partner) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Delivery partner not found.' });
    }

    return this.prisma.deliveryAssignment.findMany({
      where: {
        deliveryPartnerId: partner.id,
        status: { in: [DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP] }
      },
      include: {
        order: {
          include: {
            address: true,
            mess: { select: { name: true, addressLine: true, latitude: true, longitude: true } }
          }
        }
      }
    });
  }

  async pickupOrder(userId: string, assignmentId: string) {
    const partner = await this.prisma.deliveryPartner.findUnique({ where: { userId } });
    if (!partner) throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Partner not found.' });

    const assignment = await this.prisma.deliveryAssignment.findFirst({
      where: { id: assignmentId, deliveryPartnerId: partner.id }
    });

    if (!assignment) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Assignment not found.' });
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedAssignment = await tx.deliveryAssignment.update({
        where: { id: assignmentId },
        data: {
          status: DeliveryStatus.PICKED_UP,
          pickedUpAt: new Date()
        }
      });

      await tx.order.update({
        where: { id: assignment.orderId },
        data: { status: OrderStatus.OUT_FOR_DELIVERY }
      });

      return updatedAssignment;
    });
  }

  async deliverOrder(userId: string, assignmentId: string, dto: DeliverOrderDto) {
    const partner = await this.prisma.deliveryPartner.findUnique({ where: { userId } });
    if (!partner) throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Partner not found.' });

    const assignment = await this.prisma.deliveryAssignment.findFirst({
      where: { id: assignmentId, deliveryPartnerId: partner.id }
    });

    if (!assignment) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Assignment not found.' });
    }

    // OTP validation
    if (assignment.otp !== dto.otp) {
      throw new UnprocessableEntityException({
        code: ErrorCode.INVALID_OTP,
        message: 'Invalid delivery OTP provided.'
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedAssignment = await tx.deliveryAssignment.update({
        where: { id: assignmentId },
        data: {
          status: DeliveryStatus.DELIVERED,
          deliveredAt: new Date()
        }
      });

      // Cascades Order.status = DELIVERED
      await tx.order.update({
        where: { id: assignment.orderId },
        data: { status: OrderStatus.DELIVERED }
      });

      return updatedAssignment;
    });
  }
}
