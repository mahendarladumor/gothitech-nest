import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface AdbDevice {
  serial: string;
  state: string;
  model?: string;
}

export interface InstallResult {
  success: boolean;
  message: string;
  serial: string;
}

export interface DiagnosisReport {
  serial: string;
  model: string;
  brand: string;
  android: string;
  battery: {
    level: number;
    health: string;
    temperature: number;
    voltage: number;
    status: string;
    is_charging: boolean;
  };
  storage: {
    total: string;
    used: string;
    free: string;
    usage_percent: number;
  };
  ram: {
    total: string;
    available: string;
    usage_percent: number;
  };
  display: {
    resolution: string;
    density: string;
    refresh_rate: string;
  };
  network: {
    wifi: string | null;
    ip: string | null;
    mac: string | null;
  };
  packages: number;
  issues: Array<{ severity: string; category: string; message: string }>;
  score: number;
  generated_at: string;
}

@Injectable()
export class AdbService {
  private readonly logger = new Logger(AdbService.name);

  // ── Run adb shell command ─────────────────────────────────────────────────
  async shell(command: string, serial?: string): Promise<string> {
    const prefix = serial ? `-s ${serial} ` : '';
    const full = `adb ${prefix}shell ${command}`;
    this.logger.debug(`Executing: ${full}`);
    try {
      const { stdout } = await execAsync(full, { timeout: 15000 });
      return stdout.trim();
    } catch (e) {
      this.logger.error(`ADB shell failed: ${e.message}`);
      throw new Error(`ADB error: ${e.message}`);
    }
  }

  // ── Run raw adb command ───────────────────────────────────────────────────
  async run(command: string): Promise<string> {
    this.logger.debug(`Running: adb ${command}`);
    try {
      const { stdout } = await execAsync(`adb ${command}`, { timeout: 30000 });
      return stdout.trim();
    } catch (e) {
      throw new Error(`ADB error: ${e.message}`);
    }
  }

  // ── List connected devices ────────────────────────────────────────────────
  async getDevices(): Promise<AdbDevice[]> {
    try {
      const raw = await this.run('devices -l');
      const lines = raw.split('\n').slice(1).filter(l => l.trim() && !l.includes('*'));

      const devices: AdbDevice[] = [];
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 2) continue;
        const serial = parts[0];
        const state = parts[1];
        let model: string | undefined;

        // Try to get model name
        try {
          if (state === 'device') {
            model = await this.shell('getprop ro.product.model', serial);
          }
        } catch {
          model = undefined;
        }

        devices.push({ serial, state, model });
      }
      return devices;
    } catch {
      return [];
    }
  }

  // ── Install APK ───────────────────────────────────────────────────────────
  async installApk(apkPath: string, serial?: string): Promise<InstallResult> {
    const prefix = serial ? `-s ${serial} ` : '';
    const cmd = `adb ${prefix}install -r "${apkPath}"`;
    this.logger.log(`Installing APK: ${apkPath} on ${serial || 'first device'}`);

    try {
      const { stdout, stderr } = await execAsync(cmd, { timeout: 120000 });
      const combined = stdout + stderr;
      const success = combined.includes('Success');
      const targetSerial = serial || (await this.getDevices())[0]?.serial || 'unknown';

      return {
        success,
        message: success ? 'APK installed successfully' : `Install failed: ${combined.slice(0, 200)}`,
        serial: targetSerial,
      };
    } catch (e) {
      return { success: false, message: `Install error: ${e.message}`, serial: serial || 'unknown' };
    }
  }

  // ── Full device diagnosis ─────────────────────────────────────────────────
  async runDiagnosis(serial?: string): Promise<DiagnosisReport> {
    this.logger.log(`Running diagnosis on ${serial || 'first device'}`);
    const s = async (cmd: string) => this.shell(cmd, serial);

    // Run all checks in parallel where safe
    const [
      modelRaw, brandRaw, androidRaw,
      batteryRaw, memRaw, dfRaw,
      resRaw, densityRaw, packageCountRaw,
      wifiRaw, ipRaw,
    ] = await Promise.allSettled([
      s('getprop ro.product.model'),
      s('getprop ro.product.brand'),
      s('getprop ro.build.version.release'),
      s('dumpsys battery'),
      s('cat /proc/meminfo'),
      s('df /data'),
      s('wm size'),
      s('wm density'),
      s('pm list packages | wc -l'),
      s('dumpsys wifi | grep mWifiInfo'),
      s('ip addr show wlan0 | grep inet'),
    ]);

    const get = (r: PromiseSettledResult<string>) =>
      r.status === 'fulfilled' ? r.value : '';

    // ── Parse battery ─────────────────────────────────────────────────────
    const batteryText = get(batteryRaw);
    const battLevel = parseInt(batteryText.match(/level:\s*(\d+)/)?.[1] || '0');
    const battHealth = this.parseBatteryHealth(batteryText.match(/health:\s*(\d+)/)?.[1] || '2');
    const battTemp = parseFloat(batteryText.match(/temperature:\s*(\d+)/)?.[1] || '250') / 10;
    const battVoltage = parseInt(batteryText.match(/voltage:\s*(\d+)/)?.[1] || '0');
    const isCharging = batteryText.includes('status: 2') || batteryText.includes('AC powered: true');

    // ── Parse RAM ─────────────────────────────────────────────────────────
    const memText = get(memRaw);
    const memTotal = parseInt(memText.match(/MemTotal:\s+(\d+)/)?.[1] || '0');
    const memAvail = parseInt(memText.match(/MemAvailable:\s+(\d+)/)?.[1] || '0');
    const ramUsedPct = memTotal > 0 ? Math.round(((memTotal - memAvail) / memTotal) * 100) : 0;
    const fmtKb = (kb: number) =>
      kb > 1048576 ? `${(kb / 1048576).toFixed(1)} GB` : `${(kb / 1024).toFixed(0)} MB`;

    // ── Parse Storage ─────────────────────────────────────────────────────
    const dfText = get(dfRaw);
    const dfLine = dfText.split('\n').find(l => l.includes('/data')) || '';
    const dfParts = dfLine.trim().split(/\s+/);
    const storTotal = dfParts[1] || '0';
    const storUsed = dfParts[2] || '0';
    const storFree = dfParts[3] || '0';
    const storPct = parseInt((dfParts[4] || '0%').replace('%', '')) || 0;

    // ── Parse packages ────────────────────────────────────────────────────
    const pkgCount = parseInt(get(packageCountRaw)) || 0;

    // ── Parse WiFi ────────────────────────────────────────────────────────
    const wifiText = get(wifiRaw);
    const wifiSsid = wifiText.match(/SSID:\s*([^\s,]+)/)?.[1]?.replace(/"/g, '') || null;
    const ipText = get(ipRaw);
    const ipAddr = ipText.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/)?.[1] || null;

    // ── Build issues list ─────────────────────────────────────────────────
    const issues: DiagnosisReport['issues'] = [];
    if (battLevel < 20) issues.push({ severity: 'critical', category: 'Battery', message: 'Battery critically low' });
    if (battHealth !== 'Good') issues.push({ severity: 'warning', category: 'Battery', message: `Battery health: ${battHealth}` });
    if (battTemp > 45) issues.push({ severity: 'warning', category: 'Battery', message: `High temperature: ${battTemp}°C` });
    if (storPct > 90) issues.push({ severity: 'critical', category: 'Storage', message: 'Storage almost full (>90%)' });
    else if (storPct > 75) issues.push({ severity: 'warning', category: 'Storage', message: 'Storage usage above 75%' });
    if (ramUsedPct > 85) issues.push({ severity: 'warning', category: 'RAM', message: 'RAM usage is very high' });
    if (!wifiSsid) issues.push({ severity: 'info', category: 'Network', message: 'No WiFi connection active' });

    // ── Health score ──────────────────────────────────────────────────────
    let score = 100;
    for (const issue of issues) {
      if (issue.severity === 'critical') score -= 25;
      else if (issue.severity === 'warning') score -= 10;
      else score -= 2;
    }
    score = Math.max(0, Math.min(100, score));

    const target = serial || (await this.getDevices())[0]?.serial || 'unknown';

    return {
      serial: target,
      model: get(modelRaw) || 'Unknown',
      brand: get(brandRaw) || 'Unknown',
      android: get(androidRaw) || 'Unknown',
      battery: {
        level: battLevel,
        health: battHealth,
        temperature: battTemp,
        voltage: battVoltage,
        status: isCharging ? 'Charging' : 'Discharging',
        is_charging: isCharging,
      },
      storage: {
        total: storTotal,
        used: storUsed,
        free: storFree,
        usage_percent: storPct,
      },
      ram: {
        total: fmtKb(memTotal),
        available: fmtKb(memAvail),
        usage_percent: ramUsedPct,
      },
      display: {
        resolution: get(resRaw).replace('Physical size: ', '') || 'Unknown',
        density: get(densityRaw).replace('Physical density: ', '') || 'Unknown',
        refresh_rate: '60Hz',
      },
      network: {
        wifi: wifiSsid,
        ip: ipAddr,
        mac: null,
      },
      packages: pkgCount,
      issues,
      score,
      generated_at: new Date().toISOString(),
    };
  }

  // ── Reboot device ─────────────────────────────────────────────────────────
  async reboot(serial?: string, mode: string = 'normal'): Promise<void> {
    const prefix = serial ? `-s ${serial} ` : '';
    const suffix = mode === 'recovery' ? ' recovery' : mode === 'bootloader' ? ' bootloader' : '';
    await execAsync(`adb ${prefix}reboot${suffix}`, { timeout: 10000 });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private parseBatteryHealth(code: string): string {
    const map: Record<string, string> = {
      '1': 'Unknown', '2': 'Good', '3': 'Overheat',
      '4': 'Dead', '5': 'Over voltage', '6': 'Unspecified failure', '7': 'Cold',
    };
    return map[code] || 'Good';
  }
}
