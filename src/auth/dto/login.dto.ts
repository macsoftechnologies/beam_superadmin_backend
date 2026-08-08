import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@safesiteworks.com', description: 'Admin email address' })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ example: 'Admin@123', description: 'Admin password' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
