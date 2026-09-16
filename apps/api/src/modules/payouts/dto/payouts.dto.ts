import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class RunPayoutsDto {
  @IsOptional()
  @IsString()
  messId?: string | null;

  @IsNotEmpty()
  @IsString()
  periodStart: string; // YYYY-MM-DD

  @IsNotEmpty()
  @IsString()
  periodEnd: string; // YYYY-MM-DD
}
