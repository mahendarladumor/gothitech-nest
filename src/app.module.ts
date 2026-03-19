import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { AdbModule } from './adb/adb.module';
import { WifiModule } from './wifi/wifi.module';
import { DeviceModule } from './device/device.module';

@Module({
  imports: [
    // Rate limiting: 120 requests / minute
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    // Cron jobs
    ScheduleModule.forRoot(),
    // Feature modules
    AuthModule,
    DeviceModule,
    AdbModule,
    WifiModule,
  ],
})
export class AppModule {}
