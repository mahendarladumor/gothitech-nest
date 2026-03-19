"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdbModule = void 0;
const common_1 = require("@nestjs/common");
const adb_controller_1 = require("./adb.controller");
const adb_service_1 = require("./adb.service");
let AdbModule = class AdbModule {
};
exports.AdbModule = AdbModule;
exports.AdbModule = AdbModule = __decorate([
    (0, common_1.Module)({
        controllers: [adb_controller_1.AdbController],
        providers: [adb_service_1.AdbService],
        exports: [adb_service_1.AdbService],
    })
], AdbModule);
//# sourceMappingURL=adb.module.js.map