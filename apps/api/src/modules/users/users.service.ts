import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto, StudentVerificationDto, CreateAddressDto, UpdateAddressDto } from './dto/users.dto';
import { ErrorCode } from '../../common/error-codes';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException({
        code: ErrorCode.USER_NOT_FOUND,
        message: 'User profile not found'
      });
    }

    const { firebaseUid, ...userProfile } = user;
    return userProfile;
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.email !== undefined && { email: dto.email }),
      }
    });

    const { firebaseUid, ...userProfile } = user;
    return userProfile;
  }

  async submitStudentVerification(userId: string, dto: StudentVerificationDto) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        studentIdDocUrl: dto.studentIdDocUrl,
        isStudentVerified: false // Always set to false until Admin reviews and approves
      }
    });

    return {
      isStudentVerified: false,
      status: 'PENDING_REVIEW'
    };
  }

  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        // Enforce single default address invariant: unset isDefault on user's other addresses
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false }
        });
      }

      return tx.address.create({
        data: {
          userId,
          label: dto.label,
          addressLine: dto.addressLine,
          city: dto.city,
          state: dto.state,
          pincode: dto.pincode,
          latitude: dto.latitude,
          longitude: dto.longitude,
          isDefault: dto.isDefault || false
        }
      });
    });
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId }
    });

    if (!address) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Address not found or does not belong to user.'
      });
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true, id: { not: addressId } },
          data: { isDefault: false }
        });
      }

      return tx.address.update({
        where: { id: addressId },
        data: {
          ...(dto.label !== undefined && { label: dto.label }),
          ...(dto.addressLine !== undefined && { addressLine: dto.addressLine }),
          ...(dto.city !== undefined && { city: dto.city }),
          ...(dto.state !== undefined && { state: dto.state }),
          ...(dto.pincode !== undefined && { pincode: dto.pincode }),
          ...(dto.latitude !== undefined && { latitude: dto.latitude }),
          ...(dto.longitude !== undefined && { longitude: dto.longitude }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        }
      });
    });
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId }
    });

    if (!address) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Address not found.'
      });
    }

    await this.prisma.address.delete({
      where: { id: addressId }
    });
  }
}
