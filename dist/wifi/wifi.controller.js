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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WifiController = exports.HotspotDto = exports.WifiConnectDto = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const wifi_service_1 = require("./wifi.service");
const response_1 = require("../common/response");
class WifiConnectDto {
}
exports.WifiConnectDto = WifiConnectDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WifiConnectDto.prototype, "ssid", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WifiConnectDto.prototype, "password", void 0);
class HotspotDto {
}
exports.HotspotDto = HotspotDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HotspotDto.prototype, "ssid", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HotspotDto.prototype, "password", void 0);
let WifiController = class WifiController {
    constructor(wifi) {
        this.wifi = wifi;
    }
    async getStatus() {
        try {
            return (0, response_1.ok)(await this.wifi.getStatus());
        }
        catch (e) {
            return (0, response_1.fail)(e.message);
        }
    }
    async listNetworks() {
        try {
            const networks = await this.wifi.scan();
            return (0, response_1.ok)(networks, `Found ${networks.length} network(s)`);
        }
        catch (e) {
            return (0, response_1.fail)(e.message);
        }
    }
    async connectWifi(dto) {
        try {
            const status = await this.wifi.connect(dto.ssid, dto.password || '');
            return (0, response_1.ok)(status, `Connected to ${dto.ssid}`);
        }
        catch (e) {
            return (0, response_1.fail)(e.message);
        }
    }
    async disconnect() {
        try {
            await this.wifi.disconnect();
            return (0, response_1.ok)(null, 'Disconnected from WiFi');
        }
        catch (e) {
            return (0, response_1.fail)(e.message);
        }
    }
    async startHotspot(dto) {
        try {
            const status = await this.wifi.startHotspot(dto.ssid, dto.password);
            return (0, response_1.ok)(status, `Hotspot "${dto.ssid || 'gothitech'}" started`);
        }
        catch (e) {
            return (0, response_1.fail)(e.message);
        }
    }
    async stopHotspot() {
        try {
            const status = await this.wifi.stopHotspot();
            return (0, response_1.ok)(status, 'Hotspot stopped');
        }
        catch (e) {
            return (0, response_1.fail)(e.message);
        }
    }
};
exports.WifiController = WifiController;
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current WiFi connection status' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WifiController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('list'),
    (0, swagger_1.ApiOperation)({ summary: 'Scan and list available WiFi networks' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WifiController.prototype, "listNetworks", null);
__decorate([
    (0, common_1.Post)('connect'),
    (0, swagger_1.ApiOperation)({ summary: 'Connect Pi to a WiFi network' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [WifiConnectDto]),
    __metadata("design:returntype", Promise)
], WifiController.prototype, "connectWifi", null);
__decorate([
    (0, common_1.Post)('disconnect'),
    (0, swagger_1.ApiOperation)({ summary: 'Disconnect Pi from current WiFi' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WifiController.prototype, "disconnect", null);
__decorate([
    (0, common_1.Post)('hotspot/start'),
    (0, swagger_1.ApiOperation)({ summary: 'Start WiFi hotspot on Pi (portal mode)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [HotspotDto]),
    __metadata("design:returntype", Promise)
], WifiController.prototype, "startHotspot", null);
__decorate([
    (0, common_1.Post)('hotspot/stop'),
    (0, swagger_1.ApiOperation)({ summary: 'Stop WiFi hotspot' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WifiController.prototype, "stopHotspot", null);
exports.WifiController = WifiController = __decorate([
    (0, swagger_1.ApiTags)('wifi'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('wifi'),
    __metadata("design:paramtypes", [wifi_service_1.WifiService])
], WifiController);
//# sourceMappingURL=wifi.controller.js.map