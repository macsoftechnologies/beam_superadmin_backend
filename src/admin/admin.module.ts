import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Admin } from './entities/admin.entity';
import { Employee } from './entities/employee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Admin, Employee])],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
