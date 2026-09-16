import { IsOptional, IsEnum, IsString } from 'class-validator';
import { PaymentType, PaymentStatus } from '@messconnect/shared-types';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class PaymentFilterQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(PaymentType)
  type?: PaymentType;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  messId?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
