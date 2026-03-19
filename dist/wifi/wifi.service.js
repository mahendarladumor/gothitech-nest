"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WifiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WifiService = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let WifiService = WifiService_1 = class WifiService {
    constructor() {
        this.logger = new common_1.Logger(WifiService_1.name);
    }
    async run(cmd) {
        try {
            const { stdout } = await execAsync(cmd, { timeout: 15000 });
            return stdout.trim();
        }
        catch (e) {
            this.logger.error(`WiFi cmd failed: ${cmd}\n${e.message}`);
            throw new Error(e.message);
        }
    }
    async getStatus() {
        try {
            const hotspotCheck = await this.run('nmcli -t -f TYPE,STATE connection show --active 2>/dev/null || echo ""').catch(() => '');
            if (hotspotCheck.includes('802-11-wireless') && hotspotCheck.includes('activated')) {
                const apCheck = await this.run('nmcli -f 802-11-wireless.mode connection show --active 2>/dev/null || echo ""').catch(() => '');
                if (apCheck.includes('ap')) {
                    return { connected: false, ssid: null, ip: null, mode: 'hotspot' };
                }
            }
            const info = await this.run('nmcli -t -f active,ssid,signal device wifi | grep "^yes" | head -1').catch(() => '');
            if (info) {
                const parts = info.split(':');
                const ssid = parts[1] || null;
                let ip = null;
                try {
                    const ipRaw = await this.run("ip addr show wlan0 | grep 'inet ' | awk '{print $2}' | cut -d'/' -f1");
                    ip = ipRaw || null;
                }
                catch { }
                return { connected: true, ssid, ip, mode: 'client' };
            }
            return { connected: false, ssid: null, ip: null, mode: 'none' };
        }
        catch {
            return { connected: false, ssid: null, ip: null, mode: 'none' };
        }
    }
    async scan() {
        try {
            await this.run('nmcli device wifi rescan 2>/dev/null || true').catch(() => { });
            const raw = await this.run('nmcli -t -f SSID,SIGNAL,SECURITY,ACTIVE device wifi list 2>/dev/null');
            const networks = [];
            const seen = new Set();
            for (const line of raw.split('\n')) {
                const parts = line.split(':');
                if (parts.length < 4)
                    continue;
                const ssid = parts[0].trim();
                if (!ssid || ssid === '--' || seen.has(ssid))
                    continue;
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
            return networks.sort((a, b) => {
                if (a.connected !== b.connected)
                    return a.connected ? -1 : 1;
                return b.signal - a.signal;
            });
        }
        catch (e) {
            this.logger.error('WiFi scan failed: ' + e.message);
            return [];
        }
    }
    async connect(ssid, password) {
        this.logger.log(`Connecting to WiFi: ${ssid}`);
        try {
            if (password) {
                await this.run(`nmcli device wifi connect "${ssid}" password "${password}"`);
            }
            else {
                await this.run(`nmcli device wifi connect "${ssid}"`);
            }
            await new Promise(r => setTimeout(r, 3000));
            return this.getStatus();
        }
        catch (e) {
            throw new Error(`Failed to connect to ${ssid}: ${e.message}`);
        }
    }
    async disconnect() {
        await this.run('nmcli device disconnect wlan0').catch(() => { });
    }
    async startHotspot(ssid = 'gothitech', password = 'gothitech123') {
        this.logger.log(`Starting hotspot: ${ssid}`);
        try {
            const hasWifiConnect = await this.run('which wifi-connect').catch(() => '');
            if (hasWifiConnect) {
                (0, child_process_1.exec)(`wifi-connect --portal-ssid "${ssid}" --portal-passphrase "${password}" &`);
            }
            else {
                await this.run(`nmcli con add type wifi ifname wlan0 con-name hotspot ssid "${ssid}"`)
                    .catch(() => { });
                await this.run(`nmcli con modify hotspot wifi-sec.key-mgmt wpa-psk wifi-sec.psk "${password}"`);
                await this.run(`nmcli con modify hotspot 802-11-wireless.mode ap 802-11-wireless.band bg ipv4.method shared`);
                await this.run(`nmcli con up hotspot`);
            }
            await new Promise(r => setTimeout(r, 2000));
            return { connected: false, ssid, ip: '192.168.4.1', mode: 'hotspot' };
        }
        catch (e) {
            throw new Error(`Failed to start hotspot: ${e.message}`);
        }
    }
    async stopHotspot() {
        try {
            await this.run('nmcli con down hotspot').catch(() => { });
            await this.run('pkill wifi-connect').catch(() => { });
        }
        catch { }
        return this.getStatus();
    }
};
exports.WifiService = WifiService;
exports.WifiService = WifiService = WifiService_1 = __decorate([
    (0, common_1.Injectable)()
], WifiService);
//# sourceMappingURL=wifi.service.js.map