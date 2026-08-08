import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PowerBiService } from './powerbi.service';
import { PowerBiController } from './powerbi.controller';
import { PowerBiAuthGuard } from './guards/powerbi-auth.guard';

@Module({
  imports: [ConfigModule],
  controllers: [PowerBiController],
  providers: [PowerBiService, PowerBiAuthGuard],
})
export class PowerBiModule {}
