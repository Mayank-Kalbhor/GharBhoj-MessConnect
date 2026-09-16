import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsEnum
} from 'class-validator';
import { MealType, SubscriptionStatus } from '@messconnect/shared-types';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateSubscriptionDto {
  @IsNotEmpty()
  @IsString()
  messId: string;

  @IsNotEmpty()
  @IsString()
  planId: string;

  @IsNotEmpty()
  @IsString()
  startDate: string; // YYYY-MM-DD

  @IsNotEmpty()
  @IsString()
  addressId: string;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @IsOptional()
  @IsString()
  walletCreditToApply?: string = '0.00';
}

export class SkipMealDto {
  @IsNotEmpty()
  @IsString()
  date: string; // YYYY-MM-DD
}

export class RedeemSkipCreditDto {
  @IsNotEmpty()
  @IsString()
  date: string; // YYYY-MM-DD

  @IsNotEmpty()
  @IsEnum(MealType)
  mealType: MealType;
}

export class PauseSubscriptionDto {
  @IsNotEmpty()
  @IsString()
  pauseStart: string; // YYYY-MM-DD

  @IsNotEmpty()
  @IsString()
  pauseEnd: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  reason?: string | null;
}

export class CancelSubscriptionDto {
  @IsOptional()
  @IsString()
  reason?: string | null;
}

export class SwitchMessDto {
  @IsNotEmpty()
  @IsString()
  newMessId: string;

  @IsNotEmpty()
  @IsString()
  newPlanId: string;

  @IsNotEmpty()
  @IsString()
  startDate: string; // YYYY-MM-DD
}

export class SubscriptionFilterQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;
}
