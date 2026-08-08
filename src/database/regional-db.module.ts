import { Module, Global } from '@nestjs/common';
import { RegionalDbService } from './regional-db.service';

@Global()
@Module({
  providers: [RegionalDbService],
  exports: [RegionalDbService],
})
export class RegionalDbModule {}
