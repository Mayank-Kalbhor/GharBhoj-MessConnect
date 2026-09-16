import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { CONFIG_DEFAULTS } from '@messconnect/shared-constants';
import { PaginationMeta, PaginatedResponse } from '@messconnect/shared-types';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(CONFIG_DEFAULTS.MAX_PAGE_SIZE)
  limit: number = CONFIG_DEFAULTS.DEFAULT_PAGE_SIZE;
}

export function buildPaginatedResponse<T>(
  data: T[],
  totalItems: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(totalItems / limit) || 1;
  return {
    data,
    meta: {
      page,
      limit,
      totalItems,
      totalPages
    }
  };
}
