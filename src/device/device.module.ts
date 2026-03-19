import { Controller, Get, Module, Injectable, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as fs from 'fs';
import { ok, fail } from '../common/response';

const execAsync = promisify(exec);

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  private async run(cmd: string): Promise<string> {
    try {
      const { stdout } = await execAsync(cmd, { timeout: 8000 });
      return stdout.trim();
    } catch {
      return '';
    }
  }

  async getStatus() {
    const [adbRaw, wifiRaw, ipRaw, uptimeRaw, cpuTempRaw, diskRaw] = await Promise.all([
      this.run('adb devices'),
      this.run("nmcli -t -f active,ssid device wifi | grep '^yes' | head -1"),
      this.run("ip addr show wlan0 | grep 'inet ' | awk '{print $2}' | cut -d'/' -f1"),
      this.run('uptime -p'),
      this.run("cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null || echo '0'"),
      this.run("df -h / | tail -1 | awk '{print $3\"/\"$2\" (\"$5\" used)\"}'"),
    ]);

    // Parse ADB devices
    const adbLines = adbRaw.split('\n').slice(1).filter(l => l.trim() && !l.includes('*'));
    const adbDevices = adbLines.map(line => {
      const parts = line.trim().split(/\s+/);
      return { serial: parts[0], state: parts[1] || 'unknown' };
    });

    const wifiParts = wifiRaw.split(':');
    const wifiSsid = wifiParts[1] || null;

    const cpuTempRaw2 = parseInt(cpuTempRaw) || 0;
    const cpuTemp = cpuTempRaw2 > 1000 ? cpuTempRaw2 / 1000 : cpuTempRaw2;

    return {
      connected: true,
      ip: ipRaw || os.networkInterfaces().wlan0?.[0]?.address || null,
      hostname: os.hostname(),
      adb_devices: adbDevices,
      wifi_ssid: wifiSsid,
      uptime: uptimeRaw || 'unknown',
      cpu_temp: `${cpuTemp.toFixed(1)}°C`,
      disk: diskRaw || 'unknown',
      cpu_cores: os.cpus().length,
      ram_total: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)} GB`,
      ram_free: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(1)} GB`,
      node_version: process.version,
      platform: os.platform(),
      arch: os.arch(),
    };
  }
}

@ApiTags('device')
@ApiBearerAuth()
@Controller('device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get Raspberry Pi system status' })
  async getStatus() {
    try {
      return ok(await this.deviceService.getStatus());
    } catch (e) {
      return fail(e.message);
    }
  }
}

@Module({
  controllers: [DeviceController],
  providers: [DeviceService],
  exports: [DeviceService],
})
export class DeviceModule {}
