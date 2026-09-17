import Decimal from 'decimal.js';

describe('Business Logic Specification Verification (Rules 1 - 11)', () => {

  describe('Rule 2: Subscription Meal Allotment', () => {
    it('should calculate totalMealsAllotted as durationDays × mealsPerDay', () => {
      const durationDays = 30;
      const mealTypes = ['LUNCH', 'DINNER']; // 2 meals per day
      const totalMealsAllotted = durationDays * mealTypes.length;

      expect(totalMealsAllotted).toBe(60);
    });

    it('should calculate calendar end date correctly', () => {
      const startDate = new Date('2026-09-01');
      const durationDays = 30;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + durationDays);

      expect(endDate.toISOString().split('T')[0]).toBe('2026-10-01');
    });
  });

  describe('Rule 3: Skip Credit Cap Calculation', () => {
    it('should compute default skip credit cap as floor(totalMealsAllotted * 0.25)', () => {
      const totalMealsAllotted = 60;
      const cap = Math.floor(totalMealsAllotted * 0.25);

      expect(cap).toBe(15);
    });

    it('should not bank skip credit once cap is reached', () => {
      const cap = 15;
      let skipCreditsRemaining = 15;

      const creditBanked = skipCreditsRemaining < cap;
      if (creditBanked) {
        skipCreditsRemaining += 1;
      }

      expect(creditBanked).toBe(false);
      expect(skipCreditsRemaining).toBe(15);
    });
  });

  describe('Rule 4: Subscription Pause (Inclusive Date Arithmetic)', () => {
    it('should calculate inclusive pause days (Sep 10 to Sep 16 = 7 days)', () => {
      const pauseStart = new Date('2026-09-10');
      const pauseEnd = new Date('2026-09-16');

      const msPerDay = 1000 * 60 * 60 * 24;
      const pauseDays = Math.round((pauseEnd.getTime() - pauseStart.getTime()) / msPerDay) + 1;

      expect(pauseDays).toBe(7);

      const originalEndDate = new Date('2026-10-01');
      const newEndDate = new Date(originalEndDate);
      newEndDate.setDate(newEndDate.getDate() + pauseDays);

      expect(newEndDate.toISOString().split('T')[0]).toBe('2026-10-08');
    });

    it('should detect overlapping pauses', () => {
      const existingPause = {
        start: new Date('2026-09-10'),
        end: new Date('2026-09-16')
      };

      const requestedPause = {
        start: new Date('2026-09-14'),
        end: new Date('2026-09-20')
      };

      const isOverlapping = requestedPause.start <= existingPause.end && requestedPause.end >= existingPause.start;
      expect(isOverlapping).toBe(true);
    });
  });

  describe('Rule 5: Cancellation & Pro-Rated Refund Math', () => {
    it('should reproduce the exact worked example from BusinessLogic_MessConnect.md', () => {
      // Worked example: Plan price ₹2,500 for 60 meals
      const planPrice = new Decimal('2500.00');
      const totalMealsAllotted = 60;
      const mealsDelivered = 22;
      const mealsSkipped = 3;

      const perMealValue = planPrice.div(totalMealsAllotted);
      const unusedMeals = totalMealsAllotted - mealsDelivered - mealsSkipped; // 35
      expect(unusedMeals).toBe(35);

      const grossRefund = perMealValue.mul(unusedMeals); // 41.666... * 35 = 1458.333...
      expect(grossRefund.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString()).toBe('1458.33');

      // 10% cancellation fee
      const feePercent = 10;
      const cancellationDeduction = grossRefund.mul(feePercent / 100);
      expect(cancellationDeduction.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString()).toBe('145.83');

      const netRefund = Decimal.max(0, grossRefund.minus(cancellationDeduction)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      expect(netRefund.toFixed(2)).toBe('1312.50');
    });

    it('should clamp net refund to zero when cancellation deduction exceeds gross refund', () => {
      const grossRefund = new Decimal('100.00');
      const cancellationDeduction = new Decimal('150.00');

      const netRefund = Decimal.max(0, grossRefund.minus(cancellationDeduction)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      expect(netRefund.toFixed(2)).toBe('0.00');
    });
  });

  describe('Rule 7: Review Ratings & Weighted Averages', () => {
    it('should derive overallRating as round((taste + hygiene + quantity + punctuality) / 4, 1)', () => {
      const taste = 4;
      const hygiene = 5;
      const quantity = 4;
      const punctuality = 5;

      const overallRating = Math.round(((taste + hygiene + quantity + punctuality) / 4) * 10) / 10;
      expect(overallRating).toBe(4.5);
    });

    it('should calculate weighted average with 1.5x weight for verified subscribers', () => {
      const reviews = [
        { overallRating: 5.0, isVerifiedSubscriber: true },  // 5.0 * 1.5 = 7.5
        { overallRating: 3.0, isVerifiedSubscriber: false }  // 3.0 * 1.0 = 3.0
      ];

      let weightedSum = new Decimal(0);
      let totalWeight = new Decimal(0);

      for (const r of reviews) {
        const weight = new Decimal(r.isVerifiedSubscriber ? 1.5 : 1.0);
        weightedSum = weightedSum.plus(new Decimal(r.overallRating).mul(weight));
        totalWeight = totalWeight.plus(weight);
      }

      // (7.5 + 3.0) / (1.5 + 1.0) = 10.5 / 2.5 = 4.20
      const weightedAvg = weightedSum.div(totalWeight).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
      expect(weightedAvg).toBe(4.20);
    });
  });

  describe('Rule 9: Payout & Commission Calculation', () => {
    it('should reproduce the exact worked example from BusinessLogic_MessConnect.md', () => {
      // Worked example: A mess in Indore (launch city, seeded at 14% commission) does ₹1,00,000 gross in a week
      const grossAmount = new Decimal('100000.00');
      const commissionPercent = new Decimal('14.00');

      const commissionAmount = grossAmount.mul(commissionPercent.div(100)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const netAmount = grossAmount.minus(commissionAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      expect(commissionAmount.toFixed(2)).toBe('14000.00');
      expect(netAmount.toFixed(2)).toBe('86000.00');
    });

    it('should net out refunds issued within the period', () => {
      const orderPayments = new Decimal('10000.00');
      const refundsInPeriod = new Decimal('1500.00');
      const grossAmount = orderPayments.minus(refundsInPeriod); // 8500.00
      const commissionPercent = new Decimal('14.00');

      const commissionAmount = grossAmount.mul(commissionPercent.div(100)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const netAmount = grossAmount.minus(commissionAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      expect(grossAmount.toFixed(2)).toBe('8500.00');
      expect(commissionAmount.toFixed(2)).toBe('1190.00');
      expect(netAmount.toFixed(2)).toBe('7310.00');
    });
  });
});
