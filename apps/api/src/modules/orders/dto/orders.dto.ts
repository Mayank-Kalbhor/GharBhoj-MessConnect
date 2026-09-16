import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsOptional
} from 'class-validator';
import { Type } from 'class-transformer';
import { MealType, OrderStatus } from '@messconnect/shared-types';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class OrderItemDto {
  @IsNotEmpty()
  @IsString()
  menuItemId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  messId: string;

  @IsNotEmpty()
  @IsString()
  addressId: string;

  @IsNotEmpty()
  @IsEnum(MealType)
  mealType: MealType;

  @IsNotEmpty()
  @IsString()
  scheduledDate: string; // YYYY-MM-DD

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsNotEmpty()
  @IsString()
  paymentMethod: string;
}

export class UpdateOrderStatusDto {
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

export class CancelOrderDto {
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class OrderFilterQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  scheduledDate?: string;

  @IsOptional()
  @IsEnum(MealType)
  mealType?: MealType;
}
