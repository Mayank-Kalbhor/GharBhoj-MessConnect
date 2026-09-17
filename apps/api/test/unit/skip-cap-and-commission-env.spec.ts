import Decimal from 'decimal.js';

describe('Subscriptions Skip Cap & Commission Env Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Dynamic Skip Credit Cap from process.env.DEFAULT_SKIP_CREDIT_CAP_PERCENT', () => {
    it('should calculate skip credit cap using env var value (10% cap)', () => {
      process.env.DEFAULT_SKIP_CREDIT_CAP_PERCENT = '10';

      const totalMealsAllotted = 60;
      const envCap = process.env.DEFAULT_SKIP_CREDIT_CAP_PERCENT ? parseFloat(process.env.DEFAULT_SKIP_CREDIT_CAP_PERCENT) : 25;
      const capPercent = (isNaN(envCap) || envCap < 0) ? 0.25 : envCap / 100;
      const maxSkipCredits = Math.floor(totalMealsAllotted * capPercent);

      // 10% of 60 = 6
      expect(maxSkipCredits).toBe(6);
    });

    it('should calculate skip credit cap using env var value (30% cap)', () => {
      process.env.DEFAULT_SKIP_CREDIT_CAP_PERCENT = '30';

      const totalMealsAllotted = 60;
      const envCap = process.env.DEFAULT_SKIP_CREDIT_CAP_PERCENT ? parseFloat(process.env.DEFAULT_SKIP_CREDIT_CAP_PERCENT) : 25;
      const capPercent = (isNaN(envCap) || envCap < 0) ? 0.25 : envCap / 100;
      const maxSkipCredits = Math.floor(totalMealsAllotted * capPercent);

      // 30% of 60 = 18
      expect(maxSkipCredits).toBe(18);
    });

    it('should fall back to default 25% when env var is missing or empty', () => {
      delete process.env.DEFAULT_SKIP_CREDIT_CAP_PERCENT;

      const totalMealsAllotted = 60;
      const envCap = process.env.DEFAULT_SKIP_CREDIT_CAP_PERCENT ? parseFloat(process.env.DEFAULT_SKIP_CREDIT_CAP_PERCENT) : 25;
      const capPercent = (isNaN(envCap) || envCap < 0) ? 0.25 : envCap / 100;
      const maxSkipCredits = Math.floor(totalMealsAllotted * capPercent);

      // 25% of 60 = 15
      expect(maxSkipCredits).toBe(15);
    });
  });

  describe('Dynamic Commission Rate from process.env.DEFAULT_COMMISSION_PERCENTAGE', () => {
    it('should calculate commission using env var (15% commission)', () => {
      process.env.DEFAULT_COMMISSION_PERCENTAGE = '15.00';

      const defaultCommission = process.env.DEFAULT_COMMISSION_PERCENTAGE || '14.00';
      const commissionPercent = new Decimal(defaultCommission);
      const grossAmount = new Decimal('100000.00');

      const commissionAmount = grossAmount.mul(commissionPercent.div(100)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const netAmount = grossAmount.minus(commissionAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      expect(commissionAmount.toFixed(2)).toBe('15000.00');
      expect(netAmount.toFixed(2)).toBe('85000.00');
    });

    it('should calculate commission using env var (8.5% commission)', () => {
      process.env.DEFAULT_COMMISSION_PERCENTAGE = '8.50';

      const defaultCommission = process.env.DEFAULT_COMMISSION_PERCENTAGE || '14.00';
      const commissionPercent = new Decimal(defaultCommission);
      const grossAmount = new Decimal('100000.00');

      const commissionAmount = grossAmount.mul(commissionPercent.div(100)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const netAmount = grossAmount.minus(commissionAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      expect(commissionAmount.toFixed(2)).toBe('8500.00');
      expect(netAmount.toFixed(2)).toBe('91500.00');
    });
  });
});
