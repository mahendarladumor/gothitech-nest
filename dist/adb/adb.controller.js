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
exports.AdbController = exports.InstallDto = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const adb_service_1 = require("./adb.service");
const response_1 = require("../common/response");
class InstallDto {
}
exports.InstallDto = InstallDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InstallDto.prototype, "apk_path", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InstallDto.prototype, "serial", void 0);
let AdbController = class AdbController {
    constructor(adb) {
        this.adb = adb;
    }
    async getDevices() {
        try {
            const devices = await this.adb.getDevices();
            return (0, response_1.ok)(devices, `Found ${devices.length} device(s)`);
        }
        catch (e) {
            return (0, response_1.fail)(e.message);
        }
    }
    async installApk(dto) {
        if (!dto.apk_path)
            throw new common_1.HttpException('apk_path is required', common_1.HttpStatus.BAD_REQUEST);
        try {
            const result = await this.adb.installApk(dto.apk_path, dto.serial);
            return (0, response_1.ok)(result, result.message);
        }
        catch (e) {
            return (0, response_1.fail)(e.message);
        }
    }
    async diagnose(serial) {
        try {
            const report = await this.adb.runDiagnosis(serial);
            return (0, response_1.ok)(report, `Diagnosis complete. Score: ${report.score}/100`);
        }
        catch (e) {
            return (0, response_1.fail)(`Diagnosis failed: ${e.message}`);
        }
    }
    async reboot(serial, mode = 'normal') {
        try {
            await this.adb.reboot(serial, mode);
            return (0, response_1.ok)(null, `Rebooting device${serial ? ` (${serial})` : ''} in ${mode} mode`);
        }
        catch (e) {
            return (0, response_1.fail)(e.message);
        }
    }
    async shell(cmd, serial) {
        if (!cmd)
            throw new common_1.HttpException('cmd is required', common_1.HttpStatus.BAD_REQUEST);
        const blocked = ['rm -rf', 'mkfs', 'dd if=', 'format', 'wipe'];
        if (blocked.some(b => cmd.includes(b))) {
            throw new common_1.HttpException('Command blocked for safety', common_1.HttpStatus.FORBIDDEN);
        }
        try {
            const output = await this.adb.shell(cmd, serial);
            return (0, response_1.ok)({ output, command: cmd });
        }
        catch (e) {
            return (0, response_1.fail)(e.message);
        }
    }
};
exports.AdbController = AdbController;
__decorate([
    (0, common_1.Get)('devices'),
    (0, swagger_1.ApiOperation)({ summary: 'List all ADB-connected devices' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdbController.prototype, "getDevices", null);
__decorate([
    (0, common_1.Post)('install'),
    (0, swagger_1.ApiOperation)({ summary: 'Install an APK from Pi filesystem to connected device' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [InstallDto]),
    __metadata("design:returntype", Promise)
], AdbController.prototype, "installApk", null);
__decorate([
    (0, common_1.Post)('diagnose'),
    (0, swagger_1.ApiOperation)({ summary: 'Run full device diagnosis and return health report' }),
    (0, swagger_1.ApiQuery)({ name: 'serial', required: false, description: 'Target device serial (uses first device if omitted)' }),
    __param(0, (0, common_1.Query)('serial')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdbController.prototype, "diagnose", null);
__decorate([
    (0, common_1.Post)('reboot'),
    (0, swagger_1.ApiOperation)({ summary: 'Reboot connected device' }),
    (0, swagger_1.ApiQuery)({ name: 'serial', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'mode', required: false, enum: ['normal', 'recovery', 'bootloader'] }),
    __param(0, (0, common_1.Query)('serial')),
    __param(1, (0, common_1.Query)('mode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdbController.prototype, "reboot", null);
__decorate([
    (0, common_1.Get)('shell'),
    (0, swagger_1.ApiOperation)({ summary: 'Run arbitrary ADB shell command (admin use)' }),
    (0, swagger_1.ApiQuery)({ name: 'cmd', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'serial', required: false }),
    __param(0, (0, common_1.Query)('cmd')),
    __param(1, (0, common_1.Query)('serial')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdbController.prototype, "shell", null);
exports.AdbController = AdbController = __decorate([
    (0, swagger_1.ApiTags)('adb'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('adb'),
    __metadata("design:paramtypes", [adb_service_1.AdbService])
], AdbController);
//# sourceMappingURL=adb.controller.js.map