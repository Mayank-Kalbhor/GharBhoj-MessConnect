import { BadRequestException } from '@nestjs/common';
import { DecimalStringPipe } from '../../src/common/pipes/decimal-string.pipe';

describe('DecimalStringPipe', () => {
  let pipe: DecimalStringPipe;

  beforeEach(() => {
    pipe = new DecimalStringPipe();
  });

  it('should reject a bare JSON number (e.g. 2500) with BadRequestException', () => {
    expect(() => pipe.transform(2500 as any)).toThrow(BadRequestException);
    try {
      pipe.transform(2500 as any);
    } catch (err: any) {
      expect(err.getResponse().details.receivedType).toBe('number');
    }
  });

  it('should accept valid decimal string representations (e.g. "2500.00", "120.5", "50")', () => {
    expect(pipe.transform('2500.00')).toBe('2500.00');
    expect(pipe.transform('120.50')).toBe('120.50');
    expect(pipe.transform('120.5')).toBe('120.5');
    expect(pipe.transform('50')).toBe('50');
  });

  it('should reject non-numeric strings or invalid decimal strings', () => {
    expect(() => pipe.transform('abc')).toThrow(BadRequestException);
    expect(() => pipe.transform('12.345')).toThrow(BadRequestException); // More than 2 decimal places
  });
});
