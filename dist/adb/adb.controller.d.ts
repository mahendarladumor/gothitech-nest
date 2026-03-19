import { AdbService } from './adb.service';
export declare class InstallDto {
    apk_path: string;
    serial?: string;
}
export declare class AdbController {
    private readonly adb;
    constructor(adb: AdbService);
    getDevices(): Promise<import("../common/response").ApiResponse<import("./adb.service").AdbDevice[]>>;
    installApk(dto: InstallDto): Promise<import("../common/response").ApiResponse<import("./adb.service").InstallResult>>;
    diagnose(serial?: string): Promise<import("../common/response").ApiResponse<import("./adb.service").DiagnosisReport>>;
    reboot(serial?: string, mode?: string): Promise<import("../common/response").ApiResponse<any>>;
    shell(cmd: string, serial?: string): Promise<import("../common/response").ApiResponse<{
        output: string;
        command: string;
    }>>;
}
