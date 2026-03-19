"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = require("helmet");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['log', 'error', 'warn'],
    });
    app.use((0, helmet_1.default)());
    app.enableCors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('GothiTech Pi Controller API')
        .setDescription('Raspberry Pi backend for Android controller app. ' +
        'Manages ADB device control, WiFi, and diagnostics.')
        .setVersion('1.0.0')
        .addBearerAuth()
        .addTag('auth', 'Device pairing & authentication')
        .addTag('device', 'Pi system status')
        .addTag('adb', 'Android Debug Bridge control')
        .addTag('wifi', 'WiFi & hotspot management')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document, {
        swaggerOptions: { persistAuthorization: true },
    });
    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`\n🍓 GothiTech Pi API running on http://0.0.0.0:${port}`);
    console.log(`📚 Swagger docs at  http://0.0.0.0:${port}/docs\n`);
}
bootstrap();
//# sourceMappingURL=main.js.map