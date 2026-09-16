import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VendorMessService } from './vendor-mess.service';
import {
  CreateMessDto,
  UpdateMessDto,
  CreateMenuItemDto,
  UpdateMenuItemDto,
  CreateDailyMenuDto
} from './dto/vendor-mess.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@messconnect/shared-types';

@ApiTags('Vendor Mess Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.VENDOR)
@Controller('vendor/mess')
export class VendorMessController {
  constructor(private readonly vendorMessService: VendorMessService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Vendor onboarding — create Mess profile' })
  async createProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateMessDto
  ) {
    return this.vendorMessService.createMessProfile(user.userId, dto);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own Mess profile' })
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateMessDto
  ) {
    return this.vendorMessService.updateMyMess(user.userId, dto);
  }

  @Get('me/menu-items')
  @ApiOperation({ summary: 'List own menu items' })
  async getMenuItems(@CurrentUser() user: CurrentUserPayload) {
    return this.vendorMessService.getMenuItems(user.userId);
  }

  @Post('me/menu-items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new menu item' })
  async createMenuItem(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateMenuItemDto
  ) {
    return this.vendorMessService.createMenuItem(user.userId, dto);
  }

  @Patch('me/menu-items/:id')
  @ApiOperation({ summary: 'Update menu item or toggle availability' })
  async updateMenuItem(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemDto
  ) {
    return this.vendorMessService.updateMenuItem(user.userId, id, dto);
  }

  @Delete('me/menu-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete menu item' })
  async deleteMenuItem(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string
  ) {
    return this.vendorMessService.deleteMenuItem(user.userId, id);
  }

  @Post('me/daily-menus')
  @ApiOperation({ summary: 'Publish or update daily menu for a date & meal slot' })
  async publishDailyMenu(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateDailyMenuDto
  ) {
    return this.vendorMessService.publishDailyMenu(user.userId, dto);
  }

  @Get('me/meal-count-sheet')
  @ApiOperation({ summary: 'Vendor demand forecast / meal count sheet' })
  async getMealCountSheet(
    @CurrentUser() user: CurrentUserPayload,
    @Query('date') date?: string
  ) {
    return this.vendorMessService.getMealCountSheet(user.userId, date);
  }
}
