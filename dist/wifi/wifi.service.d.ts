export interface WifiNetwork {
    ssid: string;
    signal: number;
    secured: boolean;
    connected: boolean;
}
export interface WifiStatus {
    connected: boolean;
    ssid: string | null;
    ip: string | null;
    mode: 'client' | 'hotspot' | 'none';
}
export declare class WifiService {
    private readonly logger;
    private run;
    getStatus(): Promise<WifiStatus>;
    scan(): Promise<WifiNetwork[]>;
    connect(ssid: string, password: string): Promise<WifiStatus>;
    disconnect(): Promise<void>;
    startHotspot(ssid?: string, password?: string): Promise<WifiStatus>;
    stopHotspot(): Promise<WifiStatus>;
}
