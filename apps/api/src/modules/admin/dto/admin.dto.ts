import { IsNotEmpty, IsString, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { MessStatus } from '@messconnect/shared-types';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class UpdateMessStatusDto {
  @IsNotEmpty()
  @IsEnum(MessStatus)
  status: MessStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateStudentVerificationDto {
  @IsNotEmpty()
  @IsBoolean()
  isStudentVerified: boolean;
}

export class CreateCityConfigDto {
  @IsNotEmpty()
  @IsString()
  cityName: string;

  @IsNotEmpty()
  @IsString()
  commissionPercentage: string; // Decimal(5,2) string
}

export class UpdateCityConfigDto {
  @IsOptional()
  @IsString()
  commissionPercentage?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class MessAdminQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(MessStatus)
  status?: MessStatus;
}
