import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseAdminService } from '../../src/integrations/firebase-admin/firebase-admin.service';

describe('FirebaseAdminService - Environment Gate', () => {
  it('should allow mock token in development when ALLOW_MOCK_AUTH is true', async () => {
    const configService = {
      get: (key: string) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'ALLOW_MOCK_AUTH') return 'true';
        return null;
      }
    } as unknown as ConfigService;

    const service = new FirebaseAdminService(configService);
    const decoded = await service.verifyIdToken('mock_testuser123_9876543210');

    expect(decoded.uid).toBe('firebase_testuser123');
    expect(decoded.phone_number).toBe('+919876543210');
  });

  it('should strictly throw UnauthorizedException when mock token is used in production', async () => {
    const configService = {
      get: (key: string) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'ALLOW_MOCK_AUTH') return 'true'; // even if mistakenly set true
        return null;
      }
    } as unknown as ConfigService;

    const service = new FirebaseAdminService(configService);
    await expect(service.verifyIdToken('mock_user')).rejects.toThrow(UnauthorizedException);
  });

  it('should strictly throw UnauthorizedException when ALLOW_MOCK_AUTH is not true', async () => {
    const configService = {
      get: (key: string) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'ALLOW_MOCK_AUTH') return 'false';
        return null;
      }
    } as unknown as ConfigService;

    const service = new FirebaseAdminService(configService);
    await expect(service.verifyIdToken('mock_user')).rejects.toThrow(UnauthorizedException);
  });
});
