import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { TopupWalletDto } from './dto/wallet.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current wallet balance and recent transactions' })
  async getMyWallet(@CurrentUser() user: CurrentUserPayload) {
    return this.walletService.getMyWallet(user.userId);
  }

  @Post('me/topup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initiate wallet top-up order' })
  async topup(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: TopupWalletDto
  ) {
    return this.walletService.initiateTopup(user.userId, dto);
  }
}
