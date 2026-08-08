import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPowerBiDto {
  @ApiProperty({ example: 'requests', description: 'Table name to query' })
  @IsNotEmpty()
  @IsString()
  tablename: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 100, default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 100;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  start?: number;

  @ApiPropertyOptional({ example: 99 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  end?: number;
}
