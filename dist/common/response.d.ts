export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    timestamp: string;
}
export declare function ok<T>(data: T, message?: string): ApiResponse<T>;
export declare function fail(error: string): ApiResponse<null>;
