import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/reviews.dto';
import { SubscriptionStatus, UserRole } from '@messconnect/shared-types';
import { ErrorCode } from '../../common/error-codes';
import Decimal from 'decimal.js';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createReview(userId: string, dto: CreateReviewDto) {
    const mess = await this.prisma.mess.findUnique({
      where: { id: dto.messId }
    });

    if (!mess) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Mess not found.' });
    }

    // Business Logic Rule 7.2: Server-computed overallRating
    const overallRating = Math.round(
      ((dto.tasteRating + dto.hygieneRating + dto.quantityRating + dto.punctualityRating) / 4) * 10
    ) / 10;

    // Business Logic Rule 7.1: Server-computed isVerifiedSubscriber
    const activeOrPastSub = await this.prisma.subscription.findFirst({
      where: {
        userId,
        messId: dto.messId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.COMPLETED] }
      }
    });
    const isVerifiedSubscriber = Boolean(activeOrPastSub);

    const review = await this.prisma.review.create({
      data: {
        userId,
        messId: dto.messId,
        orderId: dto.orderId || null,
        subscriptionId: dto.subscriptionId || null,
        tasteRating: dto.tasteRating,
        hygieneRating: dto.hygieneRating,
        quantityRating: dto.quantityRating,
        punctualityRating: dto.punctualityRating,
        overallRating,
        comment: dto.comment || null,
        photoUrls: dto.photoUrls || [],
        isVerifiedSubscriber
      }
    });

    // Recompute mess avgRating & consistencyScore (Rule 7)
    await this.recalculateMessRatings(dto.messId);

    return review;
  }

  async getReviewById(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true } }
      }
    });

    if (!review) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Review not found.' });
    }

    return review;
  }

  async updateReview(userId: string, id: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Review not found.' });
    }
    if (review.userId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'Not authorized to edit this review.' });
    }

    const taste = dto.tasteRating ?? review.tasteRating;
    const hygiene = dto.hygieneRating ?? review.hygieneRating;
    const quantity = dto.quantityRating ?? review.quantityRating;
    const punctuality = dto.punctualityRating ?? review.punctualityRating;
    const overallRating = Math.round(((taste + hygiene + quantity + punctuality) / 4) * 10) / 10;

    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        ...(dto.tasteRating !== undefined && { tasteRating: dto.tasteRating }),
        ...(dto.hygieneRating !== undefined && { hygieneRating: dto.hygieneRating }),
        ...(dto.quantityRating !== undefined && { quantityRating: dto.quantityRating }),
        ...(dto.punctualityRating !== undefined && { punctualityRating: dto.punctualityRating }),
        overallRating,
        ...(dto.comment !== undefined && { comment: dto.comment }),
        ...(dto.photoUrls !== undefined && { photoUrls: dto.photoUrls })
      }
    });

    await this.recalculateMessRatings(review.messId);
    return updated;
  }

  async deleteReview(userId: string, role: UserRole, id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Review not found.' });
    }
    if (role !== UserRole.ADMIN && review.userId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'Not authorized to delete this review.' });
    }

    await this.prisma.review.delete({ where: { id } });
    await this.recalculateMessRatings(review.messId);
    return { success: true };
  }

  async recalculateMessRatings(messId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { messId },
      orderBy: { createdAt: 'desc' },
      take: 50 // last 50 reviews for consistency score
    });

    if (reviews.length === 0) {
      await this.prisma.mess.update({
        where: { id: messId },
        data: { avgRating: 0, consistencyScore: 0, hygieneRating: 0 }
      });
      return;
    }

    // Business Logic Rule 7.3: Weighted Average
    // weight = 1.5 if isVerifiedSubscriber else 1.0
    let totalWeightedScore = new Decimal(0);
    let totalWeight = new Decimal(0);
    let totalHygiene = new Decimal(0);

    for (const r of reviews) {
      const weight = new Decimal(r.isVerifiedSubscriber ? 1.5 : 1.0);
      totalWeightedScore = totalWeightedScore.plus(new Decimal(r.overallRating).mul(weight));
      totalWeight = totalWeight.plus(weight);
      totalHygiene = totalHygiene.plus(r.hygieneRating);
    }

    const avgRating = totalWeightedScore.div(totalWeight).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
    const hygieneRating = totalHygiene.div(reviews.length).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();

    // Business Logic Rule 7.4: Consistency Score
    // consistencyScore = round(100 - (stdDev(overallRating) * 20), 0) clamped to [0, 100]
    const mean = reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length;
    const variance = reviews.reduce((sum, r) => sum + Math.pow(r.overallRating - mean, 2), 0) / reviews.length;
    const stdDev = Math.sqrt(variance);

    const rawConsistency = Math.round(100 - (stdDev * 20));
    const consistencyScore = Math.max(0, Math.min(100, rawConsistency));

    await this.prisma.mess.update({
      where: { id: messId },
      data: {
        avgRating,
        hygieneRating,
        consistencyScore
      }
    });
  }
}
