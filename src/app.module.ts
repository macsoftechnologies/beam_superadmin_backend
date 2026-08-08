import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { PowerBiModule } from './powerbi/powerbi.module';
import { RegionalDbModule } from './database/regional-db.module';
import { Admin } from './admin/entities/admin.entity';
import { Employee } from './admin/entities/employee.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RegionalDbModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: configService.get<number>('DB_PORT') || 3306,
        username: configService.get<string>('DB_USERNAME') || 'root',
        password: configService.get<string>('DB_PASSWORD') || 'rootpassword',
        database: configService.get<string>('DB_NAME') || 'superadmin',
        entities: [Admin, Employee],
        synchronize: false, // Don't auto-drop production tables
        multipleStatements: true,
        extra: {
          connectionLimit: 10,
          enableKeepAlive: true,
          keepOverhead: true,
          connectTimeout: 10000,
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    AdminModule,
    PowerBiModule,
  ],
})
export class AppModule {}
