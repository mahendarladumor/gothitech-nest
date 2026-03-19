# 🍓 GothiTech Pi Controller System

A complete **Raspberry Pi + Android APK** system for managing Android devices remotely — install APKs, run full device diagnostics, and control WiFi, all from a beautiful CRED-inspired mobile app.

---

## 🏗 Architecture

```
📱 Android APK (GothiTech Controller)
         │
         │  WiFi / LAN / Hotspot
         ▼
🍓 Raspberry Pi (NestJS API :3000)
         │
         ├── ADB (USB) ──► 📲 Android Phone 1
         ├── ADB (USB) ──► 📲 Android Phone 2
         └── WiFi (nmcli) ──► 🌐 Internet / Hotspot
```

---

## 📦 Project Structure

```
gothitech-apk/          ← Android Jetpack Compose app
  app/src/main/
    java/.../
      ui/screens/       ← ConnectScreen, Dashboard, Diagnosis, WiFi, Install
      ui/components/    ← GothiCard, GothiButton, GothiTextField
      ui/theme/         ← CRED-style dark theme (GothiColors)
      ui/viewmodel/     ← All ViewModels (Hilt DI)
      data/api/         ← Retrofit API + DI Module
      data/models/      ← All data classes

gothitech-nest/         ← NestJS Raspberry Pi backend
  src/
    auth/               ← JWT device pairing
    adb/                ← ADB service + controller
    wifi/               ← WiFi / hotspot via nmcli
    device/             ← Pi system status
    common/             ← Shared response wrapper
  setup-pi.sh           ← One-command Pi installer
  ecosystem.config.js   ← PM2 process config
```

---

## 🚀 Quick Start

### Step 1 — Set up Raspberry Pi

```bash
# On your Raspberry Pi (as root):
git clone <your-repo> /tmp/gothitech
cd /tmp/gothitech/gothitech-nest
sudo bash setup-pi.sh
```

This installs:
- Node.js 20 LTS
- ADB + udev rules for all Android brands
- NetworkManager + optional wifi-connect
- NestJS API running via PM2 on port 3000

### Step 2 — Build & install the APK

```bash
cd gothitech-apk
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Step 3 — Open the app

1. Open **GothiTech Controller** on your phone
2. Enter your Pi's IP (e.g. `192.168.1.100`) and port `3000`
3. Tap **Connect**
4. Done! You now have full control.

---

## 📱 App Screens

| Screen | Description |
|--------|-------------|
| **Connect** | Enter Pi IP, auto-discover on LAN, pair device |
| **Dashboard** | Live Pi status, connected devices, quick actions |
| **Install APK** | Select APK from Pi, install to connected phone |
| **Diagnosis** | Animated scan → full health report with score |
| **WiFi Control** | See networks, connect/disconnect, toggle hotspot |
| **Devices** | All ADB-connected phones |
| **Settings** | Change Pi IP/port |

---

## 🌐 API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/pair` | Pair Android device, get JWT token |
| GET | `/auth/ping` | Check API is alive |

### Device (Pi)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/device/status` | CPU, RAM, disk, ADB devices, WiFi |

### ADB
| Method | Path | Description |
|--------|------|-------------|
| GET | `/adb/devices` | List all USB-connected phones |
| POST | `/adb/install` | Install APK from Pi path |
| POST | `/adb/diagnose?serial=` | Full phone health report |
| POST | `/adb/reboot?mode=` | Reboot phone (normal/recovery/bootloader) |
| GET | `/adb/shell?cmd=` | Run ADB shell command |

### WiFi
| Method | Path | Description |
|--------|------|-------------|
| GET | `/wifi/status` | Current WiFi connection |
| GET | `/wifi/list` | Scan available networks |
| POST | `/wifi/connect` | Connect to a network |
| POST | `/wifi/disconnect` | Disconnect from WiFi |
| POST | `/wifi/hotspot/start` | Start AP/portal hotspot |
| POST | `/wifi/hotspot/stop` | Stop hotspot |

**Swagger UI**: `http://<pi-ip>:3000/docs`

---

## 🔌 Phone Connection Methods

| Method | Use Case |
|--------|----------|
| USB (ADB) | APK install, diagnosis, shell |
| Same WiFi LAN | App talks to Pi API |
| Pi Hotspot | No router? Pi becomes the hotspot |

---

## 📊 Diagnosis Report

The diagnosis runs these ADB checks:

- `getprop ro.product.*` — Device model, brand, Android version
- `dumpsys battery` — Level, health, temperature, charging status
- `/proc/meminfo` — RAM total & available
- `df /data` — Internal storage
- `wm size` + `wm density` — Display info
- `dumpsys wifi` — WiFi SSID + IP
- `pm list packages | wc -l` — Installed package count

Health score is calculated from 100, deducting points for:
- Critical issues: -25 pts each
- Warnings: -10 pts each
- Info: -2 pts each

---

## 🔐 Security

- JWT token auth (30-day expiry)
- Local network only (no internet exposure)
- Blocked ADB shell commands (rm -rf, mkfs, etc.)
- Rate limiting: 120 requests/minute
- Helmet.js HTTP security headers

---

## 🛠 Development

```bash
# NestJS dev server (hot reload)
cd gothitech-nest
npm run start:dev

# Android development
cd gothitech-apk
./gradlew assembleDebug

# View PM2 logs on Pi
pm2 logs gothitech-api

# Check ADB devices on Pi
adb devices
```

---

## 📋 Pi Hardware Requirements

- Raspberry Pi 3B+ / 4 / 5 (recommended: Pi 4, 2GB+)
- Raspberry Pi OS 64-bit (Bookworm or Bullseye)
- USB port for connecting phones
- WiFi adapter (built-in on Pi 3/4/5)
- MicroSD: 16GB minimum

---

## 🗺 Roadmap

- [ ] Bluetooth device scanning
- [ ] Multi-device parallel install
- [ ] OTA APK upload from app
- [ ] Battery health history graph
- [ ] Push notifications (device connected/disconnected)
- [ ] QR code pairing
