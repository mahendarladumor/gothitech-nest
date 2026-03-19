import { JwtService } from '@nestjs/jwt';
export declare class PairRequestDto {
    device_id: string;
    device_name: string;
}
export declare class AuthService {
    private readonly jwt;
    constructor(jwt: JwtService);
    pair(deviceId: string, deviceName: string): {
        token: string;
        pi_name: string;
        expires_at: string;
    };
    verify(token: string): any;
    extractToken(authHeader: string | undefined): string | null;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    pairDevice(dto: PairRequestDto): Promise<import("../common/response").ApiResponse<{
        token: string;
        pi_name: string;
        expires_at: string;
    }>>;
    ping(auth: string): Promise<import("../common/response").ApiResponse<string>>;
}
export declare class AuthModule {
}
