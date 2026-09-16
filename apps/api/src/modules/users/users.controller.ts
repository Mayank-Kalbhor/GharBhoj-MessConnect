import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto, StudentVerificationDto, CreateAddressDto, UpdateAddressDto } from './dto/users.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@messconnect/shared-types';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.getMe(user.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update profile (fullName, email)' })
  async updateMe(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateUserDto
  ) {
    return this.usersService.updateMe(user.userId, dto);
  }

  @Post('me/student-verification')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Submit student ID document for verification' })
  async submitStudentVerification(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: StudentVerificationDto
  ) {
    return this.usersService.submitStudentVerification(user.userId, dto);
  }

  @Get('me/addresses')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'List saved delivery addresses' })
  async getAddresses(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.getAddresses(user.userId);
  }

  @Post('me/addresses')
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new delivery address' })
  async createAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateAddressDto
  ) {
    return this.usersService.createAddress(user.userId, dto);
  }

  @Patch('me/addresses/:id')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Update delivery address' })
  async updateAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto
  ) {
    return this.usersService.updateAddress(user.userId, id, dto);
  }

  @Delete('me/addresses/:id')
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete delivery address' })
  async deleteAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string
  ) {
    return this.usersService.deleteAddress(user.userId, id);
  }
}
