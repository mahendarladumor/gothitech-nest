import {
  Controller, Post, Get, Body, Headers,
  UnauthorizedException, Module, Injectable,
} from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ok, fail } from '../common/response';
import * as os from 'os';

// ── DTOs ──────────────────────────────────────────────────────────────────────
export class PairRequestDto {
  @IsString() device_id: string;
  @IsString() device_name: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'gothitech-secret-change-in-prod';
const JWT_EXPIRY = '30d';

// ── Service ───────────────────────────────────────────────────────────────────
@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  pair(deviceId: string, deviceName: string) {
    const payload = { sub: deviceId, name: deviceName, role: 'controller' };
    const token = this.jwt.sign(payload, { expiresIn: JWT_EXPIRY });
    const piName = os.hostname();
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    return { token, pi_name: piName, expires_at: expiresAt };
  }

  verify(token: string) {
    try {
      return this.jwt.verify(token);
    } catch {
      return null;
    }
  }

  extractToken(authHeader: string | undefined): string | null {
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.slice(7);
  }
}

// ── Controller ────────────────────────────────────────────────────────────────
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('pair')
  @ApiOperation({ summary: 'Pair a new Android device' })
  async pairDevice(@Body() dto: PairRequestDto) {
    try {
      const result = this.authService.pair(dto.device_id, dto.device_name);
      return ok(result, `Device "${dto.device_name}" paired successfully`);
    } catch (e) {
      return fail(e.message);
    }
  }

  @Get('ping')
  @ApiOperation({ summary: 'Check API reachability & auth' })
  @ApiBearerAuth()
  async ping(@Headers('authorization') auth: string) {
    // ping is semi-open – returns pong even without token, but validates if present
    if (auth) {
      const token = this.authService.extractToken(auth);
      if (!token || !this.authService.verify(token)) {
        throw new UnauthorizedException('Invalid token');
      }
    }
    return ok('pong', 'GothiTech API is online');
  }
}

// ── Module ────────────────────────────────────────────────────────────────────
@Module({
  imports: [
    JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: JWT_EXPIRY } }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
