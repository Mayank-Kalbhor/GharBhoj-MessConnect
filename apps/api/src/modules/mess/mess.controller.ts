import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MessService } from './mess.service';
import { MessSearchQueryDto, MessMenuQueryDto } from './dto/mess-discovery.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@ApiTags('Mess Discovery')
@Controller('mess')
export class MessController {
  constructor(private readonly messService: MessService) {}

  @Get()
  @ApiOperation({ summary: 'Public search and geo-discovery of messes' })
  async search(@Query() query: MessSearchQueryDto) {
    return this.messService.searchMesses(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full mess profile with today menu summary' })
  async getById(@Param('id') id: string) {
    return this.messService.getMessById(id);
  }

  @Get(':id/menu')
  @ApiOperation({ summary: 'Get daily menu for a date with computed remaining capacity' })
  async getMenu(@Param('id') id: string, @Query() query: MessMenuQueryDto) {
    return this.messService.getMessMenu(id, query);
  }

  @Get(':id/subscription-plans')
  @ApiOperation({ summary: 'List active subscription plans offered by this mess' })
  async getSubscriptionPlans(@Param('id') id: string) {
    return this.messService.getSubscriptionPlans(id);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get paginated reviews for a mess' })
  async getReviews(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.messService.getReviews(id, query);
  }
}
