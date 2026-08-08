import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateEmployeeDto {
  @ApiProperty({ example: 'south_admin' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'south@safesiteworks.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1-555-0192' })
  @IsNotEmpty()
  @IsString()
  phonenumber: string;

  @ApiPropertyOptional({ example: 'newpassword123', description: 'Leave empty to keep existing password' })
  @IsOptional()
  @IsString()
  password?: string;
}
