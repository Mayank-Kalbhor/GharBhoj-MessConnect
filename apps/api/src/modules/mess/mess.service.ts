import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessSearchQueryDto, MessMenuQueryDto } from './dto/mess-discovery.dto';
import { PaginationQueryDto, buildPaginatedResponse } from '../../common/dto/pagination.dto';
import { MessStatus, MealType } from '@messconnect/shared-types';
import { ErrorCode } from '../../common/error-codes';
import { Prisma } from '@prisma/client';

@Injectable()
export class MessService {
  private readonly logger = new Logger(MessService.name);

  constructor(private readonly prisma: PrismaService) {}

  async searchMesses(query: MessSearchQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    // Strict PostGIS Spatial Discovery: Parameterized PostGIS query when location is provided
    if (query.lat !== undefined && query.lng !== undefined) {
      const radiusMeters = query.radiusMeters || 5000;
      const lat = query.lat;
      const lng = query.lng;

      const rawResults: any[] = await this.prisma.$queryRaw`
        SELECT id, name, "avgRating", "consistencyScore", "isVeg", "cuisineTypes", city, status,
          ROUND(ST_Distance(
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
          )::numeric, 0)::int AS "distanceMeters"
        FROM "Mess"
        WHERE status = 'ACTIVE'
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
            ${radiusMeters}
          )
          ${query.city ? Prisma.sql`AND LOWER(city) = LOWER(${query.city})` : Prisma.empty}
          ${query.isVeg !== undefined ? Prisma.sql`AND "isVeg" = ${query.isVeg}` : Prisma.empty}
          ${query.minRating !== undefined ? Prisma.sql`AND "avgRating" >= ${query.minRating}` : Prisma.empty}
        ORDER BY
          ${query.sortBy === 'rating' ? Prisma.sql`"avgRating" DESC` : Prisma.sql`"distanceMeters" ASC`}
        LIMIT ${limit} OFFSET ${offset};
      `;

      const countResult: any[] = await this.prisma.$queryRaw`
        SELECT COUNT(*)::int AS count
        FROM "Mess"
        WHERE status = 'ACTIVE'
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
            ${radiusMeters}
          )
          ${query.city ? Prisma.sql`AND LOWER(city) = LOWER(${query.city})` : Prisma.empty}
          ${query.isVeg !== undefined ? Prisma.sql`AND "isVeg" = ${query.isVeg}` : Prisma.empty}
          ${query.minRating !== undefined ? Prisma.sql`AND "avgRating" >= ${query.minRating}` : Prisma.empty};
      `;

      const totalItems = countResult[0]?.count || 0;
      return buildPaginatedResponse(rawResults, totalItems, page, limit);
    }

    // Standard relational query (when lat/lng omitted or in testing environment)
    const where: Prisma.MessWhereInput = {
      status: MessStatus.ACTIVE,
      ...(query.city && { city: { equals: query.city, mode: 'insensitive' } }),
      ...(query.isVeg !== undefined && { isVeg: query.isVeg }),
      ...(query.minRating !== undefined && { avgRating: { gte: query.minRating } }),
      ...(query.cuisine && { cuisineTypes: { has: query.cuisine } })
    };

    const [totalItems, messes] = await Promise.all([
      this.prisma.mess.count({ where }),
      this.prisma.mess.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: query.sortBy === 'rating' ? { avgRating: 'desc' } : { createdAt: 'desc' }
      })
    ]);

    const formatted = messes.map(m => ({
      id: m.id,
      name: m.name,
      avgRating: m.avgRating,
      consistencyScore: m.consistencyScore,
      isVeg: m.isVeg,
      cuisineTypes: m.cuisineTypes,
      city: m.city,
      status: m.status
    }));

    return buildPaginatedResponse(formatted, totalItems, page, limit);
  }

  async getMessById(id: string) {
    const mess = await this.prisma.mess.findUnique({
      where: { id },
      include: {
        dailyMenus: {
          where: {
            date: new Date(new Date().toISOString().split('T')[0])
          },
          include: {
            items: {
              include: { menuItem: true }
            }
          }
        }
      }
    });

    if (!mess) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Mess not found.'
      });
    }

    return mess;
  }

  async getMessMenu(messId: string, query: MessMenuQueryDto) {
    const targetDateStr = query.date || new Date().toISOString().split('T')[0];
    const targetDate = new Date(targetDateStr);

    const dailyMenus = await this.prisma.dailyMenu.findMany({
      where: {
        messId,
        date: targetDate,
        ...(query.mealType && { mealType: query.mealType as MealType })
      },
      include: {
        items: {
          include: { menuItem: true }
        }
      }
    });

    const now = new Date();

    return dailyMenus.map((dm) => {
      const slotsRemaining = Math.max(0, dm.capacity - dm.ordersPlaced);
      const isCutoffPassed = now > dm.cutoffTime;

      return {
        dailyMenuId: dm.id,
        mealType: dm.mealType,
        date: dm.date.toISOString().split('T')[0],
        capacity: dm.capacity,
        ordersPlaced: dm.ordersPlaced,
        slotsRemaining,
        cutoffTime: dm.cutoffTime.toISOString(),
        isCutoffPassed,
        items: dm.items.map((item) => ({
          id: item.menuItem.id,
          name: item.menuItem.name,
          isVeg: item.menuItem.isVeg,
          price: item.menuItem.price.toString(),
          imageUrl: item.menuItem.imageUrl
        }))
      };
    });
  }

  async getSubscriptionPlans(messId: string) {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: {
        messId,
        isActive: true
      },
      orderBy: { price: 'asc' }
    });

    return plans.map(p => ({
      ...p,
      price: p.price.toString()
    }));
  }

  async getReviews(messId: string, query: PaginationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const [totalItems, reviews] = await Promise.all([
      this.prisma.review.count({ where: { messId } }),
      this.prisma.review.findMany({
        where: { messId },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { fullName: true }
          }
        }
      })
    ]);

    return buildPaginatedResponse(reviews, totalItems, page, limit);
  }
}
