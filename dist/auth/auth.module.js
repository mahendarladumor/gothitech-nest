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
exports.AuthModule = exports.AuthController = exports.AuthService = exports.PairRequestDto = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const response_1 = require("../common/response");
const os = require("os");
class PairRequestDto {
}
exports.PairRequestDto = PairRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PairRequestDto.prototype, "device_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PairRequestDto.prototype, "device_name", void 0);
const JWT_SECRET = process.env.JWT_SECRET || 'gothitech-secret-change-in-prod';
const JWT_EXPIRY = '30d';
let AuthService = class AuthService {
    constructor(jwt) {
        this.jwt = jwt;
    }
    pair(deviceId, deviceName) {
        const payload = { sub: deviceId, name: deviceName, role: 'controller' };
        const token = this.jwt.sign(payload, { expiresIn: JWT_EXPIRY });
        const piName = os.hostname();
        const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
        return { token, pi_name: piName, expires_at: expiresAt };
    }
    verify(token) {
        try {
            return this.jwt.verify(token);
        }
        catch {
            return null;
        }
    }
    extractToken(authHeader) {
        if (!authHeader?.startsWith('Bearer '))
            return null;
        return authHeader.slice(7);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], AuthService);
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async pairDevice(dto) {
        try {
            const result = this.authService.pair(dto.device_id, dto.device_name);
            return (0, response_1.ok)(result, `Device "${dto.device_name}" paired successfully`);
        }
        catch (e) {
            return (0, response_1.fail)(e.message);
        }
    }
    async ping(auth) {
        if (auth) {
            const token = this.authService.extractToken(auth);
            if (!token || !this.authService.verify(token)) {
                throw new common_1.UnauthorizedException('Invalid token');
            }
        }
        return (0, response_1.ok)('pong', 'GothiTech API is online');
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('pair'),
    (0, swagger_1.ApiOperation)({ summary: 'Pair a new Android device' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PairRequestDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "pairDevice", null);
__decorate([
    (0, common_1.Get)('ping'),
    (0, swagger_1.ApiOperation)({ summary: 'Check API reachability & auth' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "ping", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [AuthService])
], AuthController);
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: JWT_EXPIRY } }),
        ],
        controllers: [AuthController],
        providers: [AuthService],
        exports: [AuthService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map