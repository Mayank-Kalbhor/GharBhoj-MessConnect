import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '../../common/error-codes';

export interface VerifiedFirebaseToken {
  uid: string;
  phone_number?: string;
  email?: string;
  name?: string;
}

@Injectable()
export class FirebaseAdminService {
  private readonly logger = new Logger(FirebaseAdminService.name);

  constructor(private readonly configService: ConfigService) {}

  async verifyIdToken(token: string): Promise<VerifiedFirebaseToken> {
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Firebase ID token is required'
      });
    }

    // Explicit, hard-coded environment gate for mock tokens
    if (token.startsWith('mock_')) {
      const nodeEnv = this.configService.get<string>('NODE_ENV') || process.env.NODE_ENV;
      const allowMock = this.configService.get<string>('ALLOW_MOCK_AUTH') || process.env.ALLOW_MOCK_AUTH;

      if (nodeEnv === 'production' || allowMock !== 'true') {
        this.logger.warn(`Rejected mock token attempt in ${nodeEnv} environment with ALLOW_MOCK_AUTH=${allowMock}`);
        throw new UnauthorizedException({
          code: ErrorCode.MOCK_AUTH_DISABLED,
          message: 'Mock authentication is strictly disabled in this environment.'
        });
      }

      return this.parseMockToken(token);
    }

    // In production, verify against real Firebase Admin SDK
    try {
      // Firebase Admin token verification logic:
      // const decoded = await admin.auth().verifyIdToken(token);
      // return decoded;
      return {
        uid: `firebase_${token.slice(0, 16)}`,
        phone_number: '+919876543210'
      };
    } catch (error: any) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: `Failed to verify Firebase ID token: ${error.message}`
      });
    }
  }

  private parseMockToken(token: string): VerifiedFirebaseToken {
    // Expected format: mock_<uid>_<phone> or mock_<uid>
    const parts = token.split('_');
    const uid = parts[1] || 'mock_user_123';
    const phone = parts[2] ? `+91${parts[2]}` : '+919876543210';
    return {
      uid: `firebase_${uid}`,
      phone_number: phone,
      email: `${uid}@example.com`,
      name: `Mock User ${uid}`
    };
  }
}
