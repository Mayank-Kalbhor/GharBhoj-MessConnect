import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { VerifyAuthDto, SignupDto } from './dto/auth.dto';
import { VerifyAuthResponse, SignupResponse } from '@messconnect/shared-types';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange Firebase ID token for session JWT or signup requirement' })
  @ApiResponse({ status: 200, description: 'Token verified successfully' })
  async verify(@Body() dto: VerifyAuthDto): Promise<VerifyAuthResponse> {
    return this.authService.verify(dto);
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Complete signup for first-time Firebase-verified user' })
  @ApiResponse({ status: 201, description: 'User signed up and wallet created' })
  async signup(@Body() dto: SignupDto): Promise<SignupResponse> {
    return this.authService.signup(dto);
  }
}
