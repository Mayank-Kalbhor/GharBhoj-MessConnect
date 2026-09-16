import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { FirebaseAdminService } from '../../integrations/firebase-admin/firebase-admin.service';
import { VerifyAuthDto, SignupDto } from './dto/auth.dto';
import { VerifyAuthResponse, SignupResponse, UserRole } from '@messconnect/shared-types';
import { ErrorCode } from '../../common/error-codes';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly firebaseAdmin: FirebaseAdminService
  ) {}

  async verify(dto: VerifyAuthDto): Promise<VerifyAuthResponse> {
    const decoded = await this.firebaseAdmin.verifyIdToken(dto.firebaseIdToken);

    // Look for existing user by firebaseUid
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid: decoded.uid }
    });

    if (!user) {
      return {
        accessToken: null,
        requiresSignup: true,
        firebaseUid: decoded.uid,
        phone: decoded.phone_number || ''
      };
    }

    const accessToken = await this.generateSessionToken(user.id, user.role, user.phone, user.email);

    return {
      accessToken,
      user: {
        id: user.id,
        role: user.role as UserRole,
        fullName: user.fullName,
        phone: user.phone,
        isStudentVerified: user.isStudentVerified
      }
    };
  }

  async signup(dto: SignupDto): Promise<SignupResponse> {
    const decoded = await this.firebaseAdmin.verifyIdToken(dto.firebaseIdToken);
    const phone = decoded.phone_number || '+919999999999';

    // Verify user doesn't already exist
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { firebaseUid: decoded.uid },
          { phone: phone }
        ]
      }
    });

    if (existing) {
      throw new ConflictException({
        code: ErrorCode.CONFLICT,
        message: 'A user with this phone or account already exists.'
      });
    }

    // Atomic transaction: Create User AND Wallet in the same transaction (Rule 10)
    const newUser = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          role: dto.role,
          fullName: dto.fullName,
          phone: phone,
          email: dto.email || null,
          firebaseUid: decoded.uid,
        }
      });

      // Business Logic Rule 10: Automatic Wallet creation on signup
      await tx.wallet.create({
        data: {
          userId: createdUser.id,
          balance: 0,
          currency: 'INR'
        }
      });

      return createdUser;
    });

    const accessToken = await this.generateSessionToken(newUser.id, newUser.role, newUser.phone, newUser.email);

    return {
      accessToken,
      user: {
        id: newUser.id,
        role: newUser.role as UserRole,
        fullName: newUser.fullName,
        phone: newUser.phone
      }
    };
  }

  private async generateSessionToken(userId: string, role: string, phone: string, email?: string | null): Promise<string> {
    return this.jwtService.signAsync({
      userId,
      role,
      phone,
      email
    });
  }
}
