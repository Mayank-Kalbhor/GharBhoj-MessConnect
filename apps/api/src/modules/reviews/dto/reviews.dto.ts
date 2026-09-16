import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray
} from 'class-validator';

export class CreateReviewDto {
  @IsNotEmpty()
  @IsString()
  messId: string;

  @IsOptional()
  @IsString()
  orderId?: string | null;

  @IsOptional()
  @IsString()
  subscriptionId?: string | null;

  @IsInt()
  @Min(1)
  @Max(5)
  tasteRating: number;

  @IsInt()
  @Min(1)
  @Max(5)
  hygieneRating: number;

  @IsInt()
  @Min(1)
  @Max(5)
  quantityRating: number;

  @IsInt()
  @Min(1)
  @Max(5)
  punctualityRating: number;

  @IsOptional()
  @IsString()
  comment?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}

export class UpdateReviewDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  tasteRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  hygieneRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  quantityRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  punctualityRating?: number;

  @IsOptional()
  @IsString()
  comment?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}
