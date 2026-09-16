import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto, buildPaginatedResponse } from '../../common/dto/pagination.dto';
import { UpdateNotificationDto } from './dto/notifications.dto';
import { ErrorCode } from '../../common/error-codes';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMyNotifications(userId: string, query: PaginationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const [totalItems, items] = await Promise.all([
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.findMany({
        where: { userId },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return buildPaginatedResponse(items, totalItems, page, limit);
  }

  async markAsRead(userId: string, id: string, dto: UpdateNotificationDto) {
    const notif = await this.prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!notif) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Notification not found.' });
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: dto.isRead }
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    return { success: true };
  }
}
