import { PipeTransform, Injectable, BadRequestException, ArgumentMetadata } from '@nestjs/common';
import { ErrorCode } from '../error-codes';

@Injectable()
export class DecimalStringPipe implements PipeTransform<any, string> {
  transform(value: any, metadata?: ArgumentMetadata): string {
    if (value === undefined || value === null) {
      return value;
    }

    // Explicitly reject JS numbers to prevent precision loss across the boundary
    if (typeof value === 'number') {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_ERROR,
        message: `Field ${metadata?.data || 'value'} must be a decimal string (e.g. "2500.00"), not a raw JSON number.`,
        details: { receivedType: 'number', receivedValue: value }
      });
    }

    if (typeof value !== 'string') {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_ERROR,
        message: `Field ${metadata?.data || 'value'} must be a string representation of a decimal number.`,
        details: { receivedType: typeof value }
      });
    }

    // Pattern matches positive or negative decimal with up to 2 decimal places, e.g. "2500", "2500.00", "0.50"
    const decimalPattern = /^-?\d+(\.\d{1,2})?$/;
    if (!decimalPattern.test(value.trim())) {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_ERROR,
        message: `Field ${metadata?.data || 'value'} is not a valid Decimal(10,2) format: "${value}". Expected format like "120.00".`,
        details: { receivedValue: value }
      });
    }

    return value.trim();
  }
}
