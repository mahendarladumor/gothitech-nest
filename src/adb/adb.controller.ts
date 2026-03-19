import {
  Controller, Get, Post, Query, Body,
  HttpException, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { AdbService } from './adb.service';
import { ok, fail } from '../common/response';

export class InstallDto {
  @IsString() apk_path: string;
  @IsOptional() @IsString() serial?: string;
}

@ApiTags('adb')
@ApiBearerAuth()
@Controller('adb')
export class AdbController {
  constructor(private readonly adb: AdbService) {}

  @Get('devices')
  @ApiOperation({ summary: 'List all ADB-connected devices' })
  async getDevices() {
    try {
      const devices = await this.adb.getDevices();
      return ok(devices, `Found ${devices.length} device(s)`);
    } catch (e) {
      return fail(e.message);
    }
  }

  @Post('install')
  @ApiOperation({ summary: 'Install an APK from Pi filesystem to connected device' })
  async installApk(@Body() dto: InstallDto) {
    if (!dto.apk_path) throw new HttpException('apk_path is required', HttpStatus.BAD_REQUEST);
    try {
      const result = await this.adb.installApk(dto.apk_path, dto.serial);
      return ok(result, result.message);
    } catch (e) {
      return fail(e.message);
    }
  }

  @Post('diagnose')
  @ApiOperation({ summary: 'Run full device diagnosis and return health report' })
  @ApiQuery({ name: 'serial', required: false, description: 'Target device serial (uses first device if omitted)' })
  async diagnose(@Query('serial') serial?: string) {
    try {
      const report = await this.adb.runDiagnosis(serial);
      return ok(report, `Diagnosis complete. Score: ${report.score}/100`);
    } catch (e) {
      return fail(`Diagnosis failed: ${e.message}`);
    }
  }

  @Post('reboot')
  @ApiOperation({ summary: 'Reboot connected device' })
  @ApiQuery({ name: 'serial', required: false })
  @ApiQuery({ name: 'mode', required: false, enum: ['normal', 'recovery', 'bootloader'] })
  async reboot(
    @Query('serial') serial?: string,
    @Query('mode') mode: string = 'normal',
  ) {
    try {
      await this.adb.reboot(serial, mode);
      return ok(null, `Rebooting device${serial ? ` (${serial})` : ''} in ${mode} mode`);
    } catch (e) {
      return fail(e.message);
    }
  }

  @Get('shell')
  @ApiOperation({ summary: 'Run arbitrary ADB shell command (admin use)' })
  @ApiQuery({ name: 'cmd', required: true })
  @ApiQuery({ name: 'serial', required: false })
  async shell(@Query('cmd') cmd: string, @Query('serial') serial?: string) {
    if (!cmd) throw new HttpException('cmd is required', HttpStatus.BAD_REQUEST);
    // Blocklist dangerous commands
    const blocked = ['rm -rf', 'mkfs', 'dd if=', 'format', 'wipe'];
    if (blocked.some(b => cmd.includes(b))) {
      throw new HttpException('Command blocked for safety', HttpStatus.FORBIDDEN);
    }
    try {
      const output = await this.adb.shell(cmd, serial);
      return ok({ output, command: cmd });
    } catch (e) {
      return fail(e.message);
    }
  }
}
