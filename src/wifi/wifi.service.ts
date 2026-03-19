import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface WifiNetwork {
  ssid: string;
  signal: number;
  secured: boolean;
  connected: boolean;
}

export interface WifiStatus {
  connected: boolean;
  ssid: string | null;
  ip: string | null;
  mode: 'client' | 'hotspot' | 'none';
}

@Injectable()
export class WifiService {
  private readonly logger = new Logger(WifiService.name);

  private async run(cmd: string): Promise<string> {
    try {
      const { stdout } = await execAsync(cmd, { timeout: 15000 });
      return stdout.trim();
    } catch (e) {
      this.logger.error(`WiFi cmd failed: ${cmd}\n${e.message}`);
      throw new Error(e.message);
    }
  }

  // ── Current WiFi status ───────────────────────────────────────────────────
  async getStatus(): Promise<WifiStatus> {
    try {
      // Check if hotspot is active
      const hotspotCheck = await this.run(
        'nmcli -t -f TYPE,STATE connection show --active 2>/dev/null || echo ""',
      ).catch(() => '');
      if (hotspotCheck.includes('802-11-wireless') && hotspotCheck.includes('activated')) {
        const apCheck = await this.run(
          'nmcli -f 802-11-wireless.mode connection show --active 2>/dev/null || echo ""',
        ).catch(() => '');
        if (apCheck.includes('ap')) {
          return { connected: false, ssid: null, ip: null, mode: 'hotspot' };
        }
      }

      // Check normal WiFi connection
      const info = await this.run(
        'nmcli -t -f active,ssid,signal device wifi | grep "^yes" | head -1',
      ).catch(() => '');

      if (info) {
        const parts = info.split(':');
        const ssid = parts[1] || null;
        // Get IP
        let ip: string | null = null;
        try {
          const ipRaw = await this.run("ip addr show wlan0 | grep 'inet ' | awk '{print $2}' | cut -d'/' -f1");
          ip = ipRaw || null;
        } catch { }
        return { connected: true, ssid, ip, mode: 'client' };
      }

      return { connected: false, ssid: null, ip: null, mode: 'none' };
    } catch {
      return { connected: false, ssid: null, ip: null, mode: 'none' };
    }
  }

  // ── Scan available networks ───────────────────────────────────────────────
  async scan(): Promise<WifiNetwork[]> {
    try {
      // Rescan
      await this.run('nmcli device wifi rescan 2>/dev/null || true').catch(() => {});

      const raw = await this.run(
        'nmcli -t -f SSID,SIGNAL,SECURITY,ACTIVE device wifi list 2>/dev/null',
      );

      const networks: WifiNetwork[] = [];
      const seen = new Set<string>();

      for (const line of raw.split('\n')) {
        const parts = line.split(':');
        if (parts.length < 4) continue;
        const ssid = parts[0].trim();
        if (!ssid || ssid === '--' || seen.has(ssid)) continue;
        seen.add(ssid);

        const signal = parseInt(parts[1]) || 0;
        const security = parts[2]?.trim() || '';
        const active = parts[3]?.trim() === 'yes';

        networks.push({
          ssid,
          signal,
          secured: security !== '' && security !== '--',
          connected: active,
        });
      }

      // Sort: connected first, then by signal strength
      return networks.sort((a, b) => {
        if (a.connected !== b.connected) return a.connected ? -1 : 1;
        return b.signal - a.signal;
      });
    } catch (e) {
      this.logger.error('WiFi scan failed: ' + e.message);
      return [];
    }
  }

  // ── Connect to network ────────────────────────────────────────────────────
  async connect(ssid: string, password: string): Promise<WifiStatus> {
    this.logger.log(`Connecting to WiFi: ${ssid}`);
    try {
      if (password) {
        await this.run(
          `nmcli device wifi connect "${ssid}" password "${password}"`,
        );
      } else {
        await this.run(`nmcli device wifi connect "${ssid}"`);
      }
      // Small wait for connection to establish
      await new Promise(r => setTimeout(r, 3000));
      return this.getStatus();
    } catch (e) {
      throw new Error(`Failed to connect to ${ssid}: ${e.message}`);
    }
  }

  // ── Disconnect ────────────────────────────────────────────────────────────
  async disconnect(): Promise<void> {
    await this.run('nmcli device disconnect wlan0').catch(() => {});
  }

  // ── Start hotspot (wifi-connect / nmcli AP) ───────────────────────────────
  async startHotspot(ssid: string = 'gothitech', password: string = 'gothitech123'): Promise<WifiStatus> {
    this.logger.log(`Starting hotspot: ${ssid}`);
    try {
      // First try wifi-connect (if installed)
      const hasWifiConnect = await this.run('which wifi-connect').catch(() => '');
      if (hasWifiConnect) {
        // Run wifi-connect in background
        exec(`wifi-connect --portal-ssid "${ssid}" --portal-passphrase "${password}" &`);
      } else {
        // Fallback: nmcli AP mode
        await this.run(`nmcli con add type wifi ifname wlan0 con-name hotspot ssid "${ssid}"`)
          .catch(() => {}); // Ignore if already exists
        await this.run(`nmcli con modify hotspot wifi-sec.key-mgmt wpa-psk wifi-sec.psk "${password}"`);
        await this.run(`nmcli con modify hotspot 802-11-wireless.mode ap 802-11-wireless.band bg ipv4.method shared`);
        await this.run(`nmcli con up hotspot`);
      }
      await new Promise(r => setTimeout(r, 2000));
      return { connected: false, ssid, ip: '192.168.4.1', mode: 'hotspot' };
    } catch (e) {
      throw new Error(`Failed to start hotspot: ${e.message}`);
    }
  }

  // ── Stop hotspot ──────────────────────────────────────────────────────────
  async stopHotspot(): Promise<WifiStatus> {
    try {
      await this.run('nmcli con down hotspot').catch(() => {});
      await this.run('pkill wifi-connect').catch(() => {});
    } catch { }
    return this.getStatus();
  }
}
