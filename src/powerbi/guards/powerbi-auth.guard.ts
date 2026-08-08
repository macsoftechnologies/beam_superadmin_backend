import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PowerBiAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authKeyHeader = request.headers['auth-key'] || request.headers['Auth-Key'];
    const expectedKey = this.configService.get<string>('POWERBI_AUTH_KEY') || 'powerbeamApi';

    if (authKeyHeader === expectedKey) {
      return true;
    }

    throw new UnauthorizedException('Unauthorized API key provided in Auth-Key header');
  }
}
