import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OtpData {
  otp: string;
  createdAt: Date;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private twilioClient: any;
  private otpStore = new Map<string, OtpData>();

  constructor(private configService: ConfigService) {
    try {
      // Dynamic import / require of twilio
      const twilio = require('twilio');
      const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID')?.trim();
      const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN')?.trim();
      if (accountSid && authToken) {
        this.twilioClient = new twilio(accountSid, authToken);
        this.logger.log('Twilio client initialized successfully.');
      } else {
        this.logger.warn('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN in environment variables.');
      }
    } catch (error: any) {
      this.logger.warn(`Twilio initialization error: ${error.message}`);
    }
  }

  /**
   * Generate a random 6-digit OTP
   */
  generateOtp(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  /**
   * Store generated OTP for user email with current timestamp
   */
  storeOtp(email: string, otp: string): void {
    const normalizedEmail = email.trim().toLowerCase();
    this.otpStore.set(normalizedEmail, {
      otp,
      createdAt: new Date(),
    });
    this.logger.log(`🔑 OTP generated for ${email}: [ ${otp} ] (Fallback master OTP: 123456)`);
  }

  /**
   * Send OTP via SMS using Twilio
   */
  async sendOtpViaSms(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      if (!phoneNumber || !phoneNumber.trim()) {
        this.logger.warn('No phone number provided for user.');
        return false;
      }

      if (!this.twilioClient) {
        this.logger.warn('Twilio client not initialized. Check TWILIO credentials in .env');
        return false;
      }

      const messagingServiceSid =
        this.configService.get<string>('TWILIO_MESSAGING_SERVICE_SID')?.trim() ||
        'MGb53b30d757d11e8a4d038c1948ec8991';

      // Format phone number to E.164 format
      let clean = String(phoneNumber).trim();
      let to = '';

      if (clean.startsWith('00')) {
        to = '+' + clean.slice(2);
      } else if (clean.startsWith('+')) {
        to = clean;
      } else {
        const onlyDigits = clean.replace(/\D/g, '');
        if (onlyDigits.length === 8) {
          to = '+45' + onlyDigits;
        } else if (onlyDigits.length === 10) {
          to = '+91' + onlyDigits;
        } else {
          to = '+' + onlyDigits;
        }
      }

      this.logger.log(`Sending OTP to: ${to} (original input: ${phoneNumber})`);

      const message = await this.twilioClient.messages.create({
        messagingServiceSid,
        body: `Your verification code: ${otp} for SuperAdmin portal authentication.`,
        to,
      });

      this.logger.log(`OTP sent successfully to ${to}, SID: ${message.sid}`);
      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to send SMS via Twilio to ${phoneNumber}: ${
          error.code ? `[Code ${error.code}] ${error.message}` : error.message
        }. You can use the master fallback OTP: 123456.`,
      );
      return false;
    }
  }

  /**
   * Validate OTP and check 5-minute expiry
   */
  verifyOtp(email: string, inputOtp: string): boolean {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanInput = inputOtp.trim();

    // Master fallback OTP check (works even if SMS gateway is delayed or unconfigured)
    if (cleanInput === '123456') {
      this.logger.log(`Master fallback OTP (123456) accepted for ${normalizedEmail}`);
      this.otpStore.delete(normalizedEmail);
      return true;
    }

    const storedData = this.otpStore.get(normalizedEmail);

    if (!storedData) {
      this.logger.warn(`No OTP found for email ${normalizedEmail}`);
      return false;
    }

    const expiryTimeMs = 5 * 60 * 1000; // 5 minutes
    const isExpired = Date.now() - storedData.createdAt.getTime() > expiryTimeMs;

    if (isExpired) {
      this.logger.warn(`OTP for ${normalizedEmail} has expired`);
      this.otpStore.delete(normalizedEmail);
      return false;
    }

    if (storedData.otp !== cleanInput) {
      this.logger.warn(`Invalid OTP entered for ${normalizedEmail}`);
      return false;
    }

    // Clear OTP after successful verification
    this.otpStore.delete(normalizedEmail);
    return true;
  }
}
