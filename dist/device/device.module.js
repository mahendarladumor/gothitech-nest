"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DeviceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceModule = exports.DeviceController = exports.DeviceService = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const child_process_1 = require("child_process");
const util_1 = require("util");
const os = require("os");
const response_1 = require("../common/response");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let DeviceService = DeviceService_1 = class DeviceService {
    constructor() {
        this.logger = new common_1.Logger(DeviceService_1.name);
    }
    async run(cmd) {
        try {
            const { stdout } = await execAsync(cmd, { timeout: 8000 });
            return stdout.trim();
        }
        catch {
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
};
exports.DeviceService = DeviceService;
exports.DeviceService = DeviceService = DeviceService_1 = __decorate([
    (0, common_1.Injectable)()
], DeviceService);
let DeviceController = class DeviceController {
    constructor(deviceService) {
        this.deviceService = deviceService;
    }
    async getStatus() {
        try {
            return (0, response_1.ok)(await this.deviceService.getStatus());
        }
        catch (e) {
            return (0, response_1.fail)(e.message);
        }
    }
};
exports.DeviceController = DeviceController;
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Raspberry Pi system status' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "getStatus", null);
exports.DeviceController = DeviceController = __decorate([
    (0, swagger_1.ApiTags)('device'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('device'),
    __metadata("design:paramtypes", [DeviceService])
], DeviceController);
let DeviceModule = class DeviceModule {
};
exports.DeviceModule = DeviceModule;
exports.DeviceModule = DeviceModule = __decorate([
    (0, common_1.Module)({
        controllers: [DeviceController],
        providers: [DeviceService],
        exports: [DeviceService],
    })
], DeviceModule);
//# sourceMappingURL=device.module.js.map