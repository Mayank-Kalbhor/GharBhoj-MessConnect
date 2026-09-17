import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  IsDateString,
  IsIn,
  Min
} from 'class-validator';
import { MealType } from '@messconnect/shared-types';

export class CreateMessDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsNotEmpty()
  @IsString()
  fssaiLicenseNumber: string;

  @IsOptional()
  @IsString()
  licenseDocUrl?: string | null;

  @IsNotEmpty()
  @IsString()
  addressLine: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['Indore'], { message: 'In V1, mess onboarding is restricted exclusively to Indore.' })
  city: string = 'Indore';

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsBoolean()
  isVeg?: boolean;

  @IsArray()
  @IsString({ each: true })
  cuisineTypes: string[];

  @IsOptional()
  @IsString()
  bankAccountNumber?: string | null;

  @IsOptional()
  @IsString()
  bankIfscCode?: string | null;

  @IsOptional()
  @IsString()
  bankAccountHolder?: string | null;
}

export class UpdateMessDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  fssaiLicenseNumber?: string;

  @IsOptional()
  @IsString()
  licenseDocUrl?: string | null;

  @IsOptional()
  @IsString()
  addressLine?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Indore'], { message: 'In V1, mess city can only be Indore.' })
  city?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  isVeg?: boolean;

  @IsOptional()
  @IsArray()
  cuisineTypes?: string[];

  @IsOptional()
  @IsString()
  bankAccountNumber?: string | null;

  @IsOptional()
  @IsString()
  bankIfscCode?: string | null;

  @IsOptional()
  @IsString()
  bankAccountHolder?: string | null;
}

export class CreateMenuItemDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsNotEmpty()
  @IsEnum(MealType)
  mealType: MealType;

  @IsOptional()
  @IsBoolean()
  isVeg?: boolean;

  @IsNotEmpty()
  @IsString()
  price: string;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;
}

export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsEnum(MealType)
  mealType?: MealType;

  @IsOptional()
  @IsBoolean()
  isVeg?: boolean;

  @IsOptional()
  @IsString()
  price?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class CreateDailyMenuDto {
  @IsNotEmpty()
  @IsString()
  date: string; // YYYY-MM-DD

  @IsNotEmpty()
  @IsEnum(MealType)
  mealType: MealType;

  @IsNumber()
  @Min(1)
  capacity: number;

  @IsNotEmpty()
  @IsDateString()
  cutoffTime: string; // ISO string

  @IsArray()
  @IsString({ each: true })
  menuItemIds: string[];
}
