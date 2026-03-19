export interface AdbDevice {
    serial: string;
    state: string;
    model?: string;
}
export interface InstallResult {
    success: boolean;
    message: string;
    serial: string;
}
export interface DiagnosisReport {
    serial: string;
    model: string;
    brand: string;
    android: string;
    battery: {
        level: number;
        health: string;
        temperature: number;
        voltage: number;
        status: string;
        is_charging: boolean;
    };
    storage: {
        total: string;
        used: string;
        free: string;
        usage_percent: number;
    };
    ram: {
        total: string;
        available: string;
        usage_percent: number;
    };
    display: {
        resolution: string;
        density: string;
        refresh_rate: string;
    };
    network: {
        wifi: string | null;
        ip: string | null;
        mac: string | null;
    };
    packages: number;
    issues: Array<{
        severity: string;
        category: string;
        message: string;
    }>;
    score: number;
    generated_at: string;
}
export declare class AdbService {
    private readonly logger;
    shell(command: string, serial?: string): Promise<string>;
    run(command: string): Promise<string>;
    getDevices(): Promise<AdbDevice[]>;
    installApk(apkPath: string, serial?: string): Promise<InstallResult>;
    runDiagnosis(serial?: string): Promise<DiagnosisReport>;
    reboot(serial?: string, mode?: string): Promise<void>;
    private parseBatteryHealth;
}
