import { Controller, Get, Put, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Admins & Regions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('employees')
  @ApiOperation({ summary: 'Get list of regional admins' })
  async getAllRegionalAdmins() {
    return this.adminService.getAllRegionalAdmins();
  }

  @Get('employees/:regionKey/:id')
  @ApiOperation({ summary: 'Get specific regional admin details' })
  async getRegionalAdminById(
    @Param('regionKey') regionKey: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.getRegionalAdminById(regionKey, id);
  }

  @Put('employees/:regionKey/:id')
  @ApiOperation({ summary: 'Update regional admin employee details' })
  async updateRegionalAdmin(
    @Param('regionKey') regionKey: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateEmployeeDto,
  ) {
    return this.adminService.updateRegionalAdmin(regionKey, id, updateDto);
  }
}
