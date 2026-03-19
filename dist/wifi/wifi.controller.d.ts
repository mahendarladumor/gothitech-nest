import { WifiService } from './wifi.service';
export declare class WifiConnectDto {
    ssid: string;
    password?: string;
}
export declare class HotspotDto {
    ssid?: string;
    password?: string;
}
export declare class WifiController {
    private readonly wifi;
    constructor(wifi: WifiService);
    getStatus(): Promise<import("../common/response").ApiResponse<import("./wifi.service").WifiStatus>>;
    listNetworks(): Promise<import("../common/response").ApiResponse<import("./wifi.service").WifiNetwork[]>>;
    connectWifi(dto: WifiConnectDto): Promise<import("../common/response").ApiResponse<import("./wifi.service").WifiStatus>>;
    disconnect(): Promise<import("../common/response").ApiResponse<any>>;
    startHotspot(dto: HotspotDto): Promise<import("../common/response").ApiResponse<import("./wifi.service").WifiStatus>>;
    stopHotspot(): Promise<import("../common/response").ApiResponse<import("./wifi.service").WifiStatus>>;
}
