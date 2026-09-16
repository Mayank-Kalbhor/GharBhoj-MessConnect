import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  Logger
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateMessDto,
  UpdateMessDto,
  CreateMenuItemDto,
  UpdateMenuItemDto,
  CreateDailyMenuDto
} from './dto/vendor-mess.dto';
import { MessStatus, MealType, OrderType } from '@messconnect/shared-types';
import { ErrorCode } from '../../common/error-codes';
import { Prisma } from '@prisma/client';

@Injectable()
export class VendorMessService {
  private readonly logger = new Logger(VendorMessService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMyMess(ownerId: string) {
    const mess = await this.prisma.mess.findUnique({
      where: { ownerId }
    });

    if (!mess) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'No mess profile found for this vendor account.'
      });
    }

    return mess;
  }

  async createMessProfile(ownerId: string, dto: CreateMessDto) {
    const existing = await this.prisma.mess.findUnique({
      where: { ownerId }
    });

    if (existing) {
      throw new ConflictException({
        code: ErrorCode.CONFLICT,
        message: 'A mess profile already exists for this vendor.'
      });
    }

    return this.prisma.mess.create({
      data: {
        ownerId,
        name: dto.name,
        description: dto.description || null,
        fssaiLicenseNumber: dto.fssaiLicenseNumber,
        licenseDocUrl: dto.licenseDocUrl || null,
        addressLine: dto.addressLine,
        city: dto.city,
        latitude: dto.latitude,
        longitude: dto.longitude,
        isVeg: dto.isVeg || false,
        cuisineTypes: dto.cuisineTypes,
        status: MessStatus.PENDING_APPROVAL, // Fixed initial status per contract
        bankAccountNumber: dto.bankAccountNumber || null,
        bankIfscCode: dto.bankIfscCode || null,
        bankAccountHolder: dto.bankAccountHolder || null
      }
    });
  }

  async updateMyMess(ownerId: string, dto: UpdateMessDto) {
    const mess = await this.getMyMess(ownerId);

    return this.prisma.mess.update({
      where: { id: mess.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.fssaiLicenseNumber !== undefined && { fssaiLicenseNumber: dto.fssaiLicenseNumber }),
        ...(dto.licenseDocUrl !== undefined && { licenseDocUrl: dto.licenseDocUrl }),
        ...(dto.addressLine !== undefined && { addressLine: dto.addressLine }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.isVeg !== undefined && { isVeg: dto.isVeg }),
        ...(dto.cuisineTypes !== undefined && { cuisineTypes: dto.cuisineTypes }),
        ...(dto.bankAccountNumber !== undefined && { bankAccountNumber: dto.bankAccountNumber }),
        ...(dto.bankIfscCode !== undefined && { bankIfscCode: dto.bankIfscCode }),
        ...(dto.bankAccountHolder !== undefined && { bankAccountHolder: dto.bankAccountHolder }),
      }
    });
  }

  async getMenuItems(ownerId: string) {
    const mess = await this.getMyMess(ownerId);
    const items = await this.prisma.menuItem.findMany({
      where: { messId: mess.id },
      orderBy: { createdAt: 'desc' }
    });

    return items.map(item => ({
      ...item,
      price: item.price.toString()
    }));
  }

  async createMenuItem(ownerId: string, dto: CreateMenuItemDto) {
    const mess = await this.getMyMess(ownerId);

    const created = await this.prisma.menuItem.create({
      data: {
        messId: mess.id,
        name: dto.name,
        description: dto.description || null,
        mealType: dto.mealType,
        isVeg: dto.isVeg ?? true,
        price: new Prisma.Decimal(dto.price),
        imageUrl: dto.imageUrl || null,
        isAvailable: true
      }
    });

    return {
      ...created,
      price: created.price.toString()
    };
  }

  async updateMenuItem(ownerId: string, id: string, dto: UpdateMenuItemDto) {
    const mess = await this.getMyMess(ownerId);
    const item = await this.prisma.menuItem.findFirst({
      where: { id, messId: mess.id }
    });

    if (!item) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Menu item not found.'
      });
    }

    const updated = await this.prisma.menuItem.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.mealType !== undefined && { mealType: dto.mealType }),
        ...(dto.isVeg !== undefined && { isVeg: dto.isVeg }),
        ...(dto.price !== undefined && { price: new Prisma.Decimal(dto.price) }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
      }
    });

    return {
      ...updated,
      price: updated.price.toString()
    };
  }

  async deleteMenuItem(ownerId: string, id: string): Promise<void> {
    const mess = await this.getMyMess(ownerId);
    const item = await this.prisma.menuItem.findFirst({
      where: { id, messId: mess.id }
    });

    if (!item) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Menu item not found.'
      });
    }

    await this.prisma.menuItem.delete({
      where: { id }
    });
  }

  async publishDailyMenu(ownerId: string, dto: CreateDailyMenuDto) {
    const mess = await this.getMyMess(ownerId);
    const dateObj = new Date(dto.date);
    const cutoffObj = new Date(dto.cutoffTime);

    // Enforce @@unique([messId, date, mealType]) upsert
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.dailyMenu.findUnique({
        where: {
          messId_date_mealType: {
            messId: mess.id,
            date: dateObj,
            mealType: dto.mealType
          }
        }
      });

      if (existing) {
        // Validation: Reducing capacity below current ordersPlaced is rejected with 422
        if (dto.capacity < existing.ordersPlaced) {
          throw new UnprocessableEntityException({
            code: ErrorCode.CAPACITY_BELOW_PLACED_ORDERS,
            message: `Cannot reduce capacity to ${dto.capacity} because ${existing.ordersPlaced} orders have already been placed.`
          });
        }

        // Update existing daily menu
        const updated = await tx.dailyMenu.update({
          where: { id: existing.id },
          data: {
            capacity: dto.capacity,
            cutoffTime: cutoffObj
          }
        });

        // Reconnect items
        await tx.dailyMenuItem.deleteMany({
          where: { dailyMenuId: updated.id }
        });

        await tx.dailyMenuItem.createMany({
          data: dto.menuItemIds.map(menuItemId => ({
            dailyMenuId: updated.id,
            menuItemId
          }))
        });

        return tx.dailyMenu.findUnique({
          where: { id: updated.id },
          include: {
            items: {
              include: { menuItem: true }
            }
          }
        });
      }

      // Create new daily menu
      const created = await tx.dailyMenu.create({
        data: {
          messId: mess.id,
          date: dateObj,
          mealType: dto.mealType,
          capacity: dto.capacity,
          cutoffTime: cutoffObj,
          ordersPlaced: 0,
          items: {
            create: dto.menuItemIds.map(menuItemId => ({
              menuItemId
            }))
          }
        },
        include: {
          items: {
            include: { menuItem: true }
          }
        }
      });

      return created;
    });
  }

  async getMealCountSheet(ownerId: string, dateStr?: string) {
    const mess = await this.getMyMess(ownerId);
    const targetDate = new Date(dateStr || new Date().toISOString().split('T')[0]);

    const dailyMenus = await this.prisma.dailyMenu.findMany({
      where: {
        messId: mess.id,
        date: targetDate
      }
    });

    const orders = await this.prisma.order.findMany({
      where: {
        messId: mess.id,
        scheduledDate: targetDate,
        status: { notIn: ['CANCELLED', 'SKIPPED'] }
      },
      select: {
        mealType: true,
        orderType: true
      }
    });

    const mealTypes: MealType[] = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER, MealType.SNACK];
    const byMealType = mealTypes.map((mealType) => {
      const dm = dailyMenus.find(m => m.mealType === mealType);
      const ordersForType = orders.filter(o => o.mealType === mealType);
      const subscriptionOrders = ordersForType.filter(o => o.orderType === OrderType.SUBSCRIPTION_MEAL).length;
      const oneTimeOrders = ordersForType.filter(o => o.orderType === OrderType.ONE_TIME).length;

      return {
        mealType,
        subscriptionOrders,
        oneTimeOrders,
        total: subscriptionOrders + oneTimeOrders,
        capacity: dm ? dm.capacity : 0
      };
    }).filter(slot => slot.capacity > 0 || slot.total > 0);

    return {
      date: targetDate.toISOString().split('T')[0],
      byMealType
    };
  }
}
