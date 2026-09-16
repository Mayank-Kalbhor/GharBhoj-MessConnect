import { IsNotEmpty, IsString } from 'class-validator';

export class TopupWalletDto {
  @IsNotEmpty()
  @IsString()
  amount: string; // Decimal(10,2) string
}
