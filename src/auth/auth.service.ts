import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Admin } from '../admin/entities/admin.entity';
import { LoginDto } from './dto/login.dto';
import { OtpService } from './otp.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private jwtService: JwtService,
    private otpService: OtpService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const admin = await this.adminRepository.findOne({
      where: [{ email: email }, { mobileNumber: email }],
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }

    let isMatch = false;

    // Check bcrypt hash
    if (admin.password.startsWith('$2b$') || admin.password.startsWith('$2a$')) {
      isMatch = await bcrypt.compare(pass, admin.password);
    } else {
      // Legacy MD5 fallback or plain text check
      const md5Hash = crypto.createHash('md5').update(pass).digest('hex');
      if (admin.password === md5Hash || admin.password === pass) {
        isMatch = true;
        // Upgrade password to bcrypt
        admin.password = await bcrypt.hash(pass, 10);
        await this.adminRepository.save(admin);
      }
    }

    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { password, ...result } = admin;
    return result;
  }

  async login(loginDto: LoginDto) {
    const admin = await this.validateUser(loginDto.email, loginDto.password);
    
    // Generate 6-digit OTP
    const otp = this.otpService.generateOtp();

    // Store OTP in memory associated with admin email
    this.otpService.storeOtp(admin.email, otp);

    // Send OTP via SMS using Twilio
    await this.otpService.sendOtpViaSms(admin.mobileNumber, otp);

    // Step 1 of auth: Return requiresOtp & response for OTP entry
    return {
      requiresOtp: true,
      message: `OTP sent to your registered mobile number (${admin.mobileNumber || 'N/A'}).`,
      email: admin.email,
    };
  }

  async verifyOtp(email: string, otp: string) {
    // Validate OTP using OtpService (removes static OTP option)
    const isValid = this.otpService.verifyOtp(email, otp);
    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP. Please request a new OTP.');
    }

    const admin = await this.adminRepository.findOne({
      where: [{ email: email }, { mobileNumber: email }],
    });

    if (!admin) {
      throw new UnauthorizedException('User not found');
    }

    const payload = { email: admin.email, sub: admin.adminId, name: admin.adminName, role: 'superadmin' };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        adminId: admin.adminId,
        name: admin.adminName,
        email: admin.email,
        mobileNumber: admin.mobileNumber,
        address: admin.address,
        role: 'superadmin',
      },
    };
  }


  async generateSsoToken(adminId: number, targetRegion: string) {
    const admin = await this.adminRepository.findOne({ where: { adminId } });
    if (!admin) {
      throw new UnauthorizedException('Superadmin not found');
    }

    // Sign a short-lived SSO token valid for 5 minutes
    const ssoPayload = {
      sub: admin.adminId,
      email: admin.email,
      name: admin.adminName,
      mobileNumber: admin.mobileNumber,
      address: admin.address,
      role: 'superadmin',
      targetRegion,
      type: 'sso_impersonation',
    };

    const sso_token = this.jwtService.sign(ssoPayload, { expiresIn: '5m' });

    let baseUrl = '';
    switch (targetRegion.toLowerCase()) {
      case 'm3north':
      case 'north':
        baseUrl = process.env.M3NORTH_URL || 'https://beam.safesiteworks.com/m3north/dashboard';
        break;
      case 'm3south':
      case 'south':
        baseUrl = process.env.M3SOUTH_URL || 'https://beam.safesiteworks.com/m3south/dashboard';
        break;
      case 'm3infrastructure':
      case 'infrastructure':
      case 'infra':
        baseUrl = process.env.M3INFRASTRUCTURE_URL || 'https://beam.safesiteworks.com/m3infrastructure/dashboard';
        break;
      default:
        baseUrl = process.env.M3SOUTH_URL || 'https://beam.safesiteworks.com/m3south/dashboard';
        break;
    }

    const separator = baseUrl.includes('?') ? '&' : '?';
    const redirectUrl = `${baseUrl}${separator}sso_token=${sso_token}`;

    return {
      sso_token,
      redirectUrl,
      targetRegion,
    };
  }

  async introspectToken(ssoToken: string) {
    try {
      const decoded = this.jwtService.verify(ssoToken);
      if (decoded.type !== 'sso_impersonation') {
        throw new UnauthorizedException('Token is not a valid SSO impersonation token');
      }

      return {
        valid: true,
        adminId: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        mobileNumber: decoded.mobileNumber || '9966996699',
        address: decoded.address || 'Vizag',
        role: decoded.role || 'superadmin',
        targetRegion: decoded.targetRegion,
      };
    } catch (err: any) {
      throw new UnauthorizedException(`Token Introspection failed: ${err.message}`);
    }
  }
}
