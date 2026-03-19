import { Module } from '@nestjs/common';
import { AdbController } from './adb.controller';
import { AdbService } from './adb.service';

@Module({
  controllers: [AdbController],
  providers: [AdbService],
  exports: [AdbService],
})
export class AdbModule {}
