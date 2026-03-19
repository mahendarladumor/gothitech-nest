export declare class DeviceService {
    private readonly logger;
    private run;
    getStatus(): Promise<{
        connected: boolean;
        ip: string;
        hostname: string;
        adb_devices: {
            serial: string;
            state: string;
        }[];
        wifi_ssid: string;
        uptime: string;
        cpu_temp: string;
        disk: string;
        cpu_cores: number;
        ram_total: string;
        ram_free: string;
        node_version: string;
        platform: NodeJS.Platform;
        arch: string;
    }>;
}
export declare class DeviceController {
    private readonly deviceService;
    constructor(deviceService: DeviceService);
    getStatus(): Promise<import("../common/response").ApiResponse<{
        connected: boolean;
        ip: string;
        hostname: string;
        adb_devices: {
            serial: string;
            state: string;
        }[];
        wifi_ssid: string;
        uptime: string;
        cpu_temp: string;
        disk: string;
        cpu_cores: number;
        ram_total: string;
        ram_free: string;
        node_version: string;
        platform: NodeJS.Platform;
        arch: string;
    }>>;
}
export declare class DeviceModule {
}
