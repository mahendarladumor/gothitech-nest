import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { WifiService } from './wifi.service';
import { ok, fail } from '../common/response';

export class WifiConnectDto {
  @IsString() ssid: string;
  @IsOptional() @IsString() password?: string;
}

export class HotspotDto {
  @IsOptional() @IsString() ssid?: string;
  @IsOptional() @IsString() password?: string;
}

@ApiTags('wifi')
@ApiBearerAuth()
@Controller('wifi')
export class WifiController {
  constructor(private readonly wifi: WifiService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get current WiFi connection status' })
  async getStatus() {
    try {
      return ok(await this.wifi.getStatus());
    } catch (e) {
      return fail(e.message);
    }
  }

  @Get('list')
  @ApiOperation({ summary: 'Scan and list available WiFi networks' })
  async listNetworks() {
    try {
      const networks = await this.wifi.scan();
      return ok(networks, `Found ${networks.length} network(s)`);
    } catch (e) {
      return fail(e.message);
    }
  }

  @Post('connect')
  @ApiOperation({ summary: 'Connect Pi to a WiFi network' })
  async connectWifi(@Body() dto: WifiConnectDto) {
    try {
      const status = await this.wifi.connect(dto.ssid, dto.password || '');
      return ok(status, `Connected to ${dto.ssid}`);
    } catch (e) {
      return fail(e.message);
    }
  }

  @Post('disconnect')
  @ApiOperation({ summary: 'Disconnect Pi from current WiFi' })
  async disconnect() {
    try {
      await this.wifi.disconnect();
      return ok(null, 'Disconnected from WiFi');
    } catch (e) {
      return fail(e.message);
    }
  }

  @Post('hotspot/start')
  @ApiOperation({ summary: 'Start WiFi hotspot on Pi (portal mode)' })
  async startHotspot(@Body() dto: HotspotDto) {
    try {
      const status = await this.wifi.startHotspot(dto.ssid, dto.password);
      return ok(status, `Hotspot "${dto.ssid || 'gothitech'}" started`);
    } catch (e) {
      return fail(e.message);
    }
  }

  @Post('hotspot/stop')
  @ApiOperation({ summary: 'Stop WiFi hotspot' })
  async stopHotspot() {
    try {
      const status = await this.wifi.stopHotspot();
      return ok(status, 'Hotspot stopped');
    } catch (e) {
      return fail(e.message);
    }
  }
}
