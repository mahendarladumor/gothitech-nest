"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WifiModule = void 0;
const common_1 = require("@nestjs/common");
const wifi_controller_1 = require("./wifi.controller");
const wifi_service_1 = require("./wifi.service");
let WifiModule = class WifiModule {
};
exports.WifiModule = WifiModule;
exports.WifiModule = WifiModule = __decorate([
    (0, common_1.Module)({
        controllers: [wifi_controller_1.WifiController],
        providers: [wifi_service_1.WifiService],
        exports: [wifi_service_1.WifiService],
    })
], WifiModule);
//# sourceMappingURL=wifi.module.js.map