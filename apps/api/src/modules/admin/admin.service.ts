import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UpdateMessStatusDto,
  UpdateStudentVerificationDto,
  CreateCityConfigDto,
  UpdateCityConfigDto,
  MessAdminQueryDto
} from './dto/admin.dto';
import { PaginationQueryDto, buildPaginatedResponse } from '../../common/dto/pagination.dto';
import {
  MessStatus,
  SubscriptionStatus,
  PaymentStatus,
  PaymentType
} from '@messconnect/shared-types';
import { ErrorCode } from '../../common/error-codes';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMesses(query: MessAdminQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const where: Prisma.MessWhereInput = {
      ...(query.status && { status: query.status })
    };

    const [totalItems, messes] = await Promise.all([
      this.prisma.mess.count({ where }),
      this.prisma.mess.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { owner: { select: { fullName: true, phone: true, email: true } } }
      })
    ]);

    return buildPaginatedResponse(messes, totalItems, page, limit);
  }

  async updateMessStatus(id: string, dto: UpdateMessStatusDto) {
    const mess = await this.prisma.mess.findUnique({ where: { id } });
    if (!mess) throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Mess not found.' });

    return this.prisma.mess.update({
      where: { id },
      data: { status: dto.status }
    });
  }

  async getStudentVerifications(query: PaginationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      studentIdDocUrl: { not: null },
      isStudentVerified: false
    };

    const [totalItems, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          studentIdDocUrl: true,
          isStudentVerified: true,
          createdAt: true
        }
      })
    ]);

    return buildPaginatedResponse(users, totalItems, page, limit);
  }

  async updateStudentVerification(userId: string, dto: UpdateStudentVerificationDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException({ code: ErrorCode.USER_NOT_FOUND, message: 'User not found.' });

    return this.prisma.user.update({
      where: { id: userId },
      data: { isStudentVerified: dto.isStudentVerified },
      select: {
        id: true,
        fullName: true,
        isStudentVerified: true
      }
    });
  }

  async getFlaggedReviews(query: PaginationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    // Flagged = overallRating <= 2
    const where: Prisma.ReviewWhereInput = {
      overallRating: { lte: 2 }
    };

    const [totalItems, reviews] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { fullName: true } },
          mess: { select: { name: true } }
        }
      })
    ]);

    return buildPaginatedResponse(reviews, totalItems, page, limit);
  }

  async getCityConfigs() {
    const configs = await this.prisma.cityConfig.findMany({
      orderBy: { cityName: 'asc' }
    });

    return configs.map(c => ({
      ...c,
      commissionPercentage: c.commissionPercentage.toString()
    }));
  }

  async createCityConfig(dto: CreateCityConfigDto) {
    const existing = await this.prisma.cityConfig.findUnique({
      where: { cityName: dto.cityName }
    });

    if (existing) {
      throw new ConflictException({
        code: ErrorCode.CONFLICT,
        message: `Config for city ${dto.cityName} already exists.`
      });
    }

    const created = await this.prisma.cityConfig.create({
      data: {
        cityName: dto.cityName,
        commissionPercentage: new Prisma.Decimal(dto.commissionPercentage),
        isActive: true
      }
    });

    return {
      ...created,
      commissionPercentage: created.commissionPercentage.toString()
    };
  }

  async updateCityConfig(id: string, dto: UpdateCityConfigDto) {
    const config = await this.prisma.cityConfig.findUnique({ where: { id } });
    if (!config) throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'City config not found.' });

    const updated = await this.prisma.cityConfig.update({
      where: { id },
      data: {
        ...(dto.commissionPercentage !== undefined && { commissionPercentage: new Prisma.Decimal(dto.commissionPercentage) }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive })
      }
    });

    return {
      ...updated,
      commissionPercentage: updated.commissionPercentage.toString()
    };
  }

  async getPlatformAnalytics() {
    // Platform-wide metrics: GMV, active subscriptions, active messes, churn rate
    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.SUCCESS,
        type: { in: [PaymentType.ORDER_PAYMENT, PaymentType.SUBSCRIPTION_PAYMENT] }
      }
    });

    const gmv = payments.reduce((sum, p) => sum.plus(new Decimal(p.amount.toString())), new Decimal(0));

    const [activeSubscriptions, totalSubscriptions, activeMesses] = await Promise.all([
      this.prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      this.prisma.subscription.count(),
      this.prisma.mess.count({ where: { status: MessStatus.ACTIVE } })
    ]);

    const churnRatePercent = totalSubscriptions > 0
      ? Math.round(((totalSubscriptions - activeSubscriptions) / totalSubscriptions) * 100)
      : 0;

    const cities = await this.prisma.cityConfig.findMany();
    const cityWiseGrowth = await Promise.all(
      cities.map(async (city) => {
        const cityMesses = await this.prisma.mess.findMany({
          where: { city: city.cityName },
          select: { id: true }
        });
        const messIds = cityMesses.map(m => m.id);

        const cityPayments = await this.prisma.payment.findMany({
          where: {
            status: PaymentStatus.SUCCESS,
            OR: [
              { order: { messId: { in: messIds } } },
              { subscription: { messId: { in: messIds } } }
            ]
          }
        });

        const cityGmv = cityPayments.reduce(
          (sum, p) => sum.plus(new Decimal(p.amount.toString())),
          new Decimal(0)
        );

        return {
          cityName: city.cityName,
          gmv: cityGmv.toFixed(2),
          activeUsers: cityMesses.length * 25 // estimate
        };
      })
    );

    return {
      gmv: gmv.toFixed(2),
      activeSubscriptions,
      activeMesses,
      churnRatePercent,
      cityWiseGrowth
    };
  }
}
