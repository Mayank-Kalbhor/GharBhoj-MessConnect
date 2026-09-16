import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class OnboardDeliveryPartnerDto {
  @IsNotEmpty()
  @IsString()
  vehicleType: string;
}

export class UpdateAvailabilityDto {
  @IsNotEmpty()
  @IsBoolean()
  isAvailable: boolean;

  @IsOptional()
  @IsNumber()
  currentLatitude?: number;

  @IsOptional()
  @IsNumber()
  currentLongitude?: number;
}

export class DeliverOrderDto {
  @IsNotEmpty()
  @IsString()
  otp: string;
}
