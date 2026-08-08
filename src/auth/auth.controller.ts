import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Step 1: Superadmin login' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Step 2: Verify OTP' })
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyOtp(body.email, body.otp);
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate-sso-token')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate SSO token to impersonate/open regional portal' })
  async generateSsoToken(@Request() req, @Body() body: { targetRegion: string }) {
    return this.authService.generateSsoToken(req.user.adminId, body.targetRegion);
  }

  @Post('introspect')
  @ApiOperation({ summary: 'Public Introspection endpoint called by regional backends' })
  async introspect(@Body() body: { sso_token?: string; token?: string }) {
    const token = body.sso_token || body.token;
    return this.authService.introspectToken(token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get logged in admin profile' })
  getProfile(@Request() req) {
    return req.user;
  }
}
