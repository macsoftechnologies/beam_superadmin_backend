import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PowerBiService } from './powerbi.service';
import { QueryPowerBiDto } from './dto/query-powerbi.dto';
import { PowerBiAuthGuard } from './guards/powerbi-auth.guard';

@ApiTags('PowerBI Data Export')
@UseGuards(PowerBiAuthGuard)
@ApiHeader({ name: 'Auth-Key', description: 'API Key for PowerBI integrations (Default: powerbeamApi)', required: true })
@Controller('powerbi')
export class PowerBiController {
  constructor(private readonly powerBiService: PowerBiService) {}

  @Get('m3south')
  @ApiOperation({ summary: 'Get paginated data from M3 South region' })
  async getM3South(@Query() queryDto: QueryPowerBiDto) {
    return this.powerBiService.getRegionData('m3south', queryDto);
  }

  @Get('m3north')
  @ApiOperation({ summary: 'Get paginated data from M3 North region' })
  async getM3North(@Query() queryDto: QueryPowerBiDto) {
    return this.powerBiService.getRegionData('m3north', queryDto);
  }

  @Get('m3infrastructure')
  @ApiOperation({ summary: 'Get paginated data from M3 Infrastructure region' })
  async getM3Infrastructure(@Query() queryDto: QueryPowerBiDto) {
    return this.powerBiService.getRegionData('m3infrastructure', queryDto);
  }

  @Get(':portal_name/:table_name')
  @ApiOperation({ summary: 'Get paginated data by region portal name and table name' })
  async getByPortalAndTable(
    @Param('portal_name') portalName: string,
    @Param('table_name') tableName: string,
    @Query() queryDto: QueryPowerBiDto,
  ) {
    const region = portalName.toLowerCase() as any;
    const dto = { ...queryDto, tablename: tableName || queryDto.tablename };
    return this.powerBiService.getRegionData(region, dto);
  }
}
