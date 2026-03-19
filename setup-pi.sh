#!/usr/bin/env bash
# ============================================================
#  GothiTech Pi Setup Script
#  Run as root on Raspberry Pi OS (64-bit recommended)
#  Usage: sudo bash setup-pi.sh
# ============================================================

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[GOTHI]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
section() { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${CYAN}  $1${NC}"; echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"; }

[[ $EUID -ne 0 ]] && err "Please run as root: sudo bash setup-pi.sh"

section "🍓 GothiTech Pi Setup"
log "Starting full system setup..."

# ── 1. System Update ──────────────────────────────────────────────────────────
section "1/7 System Update"
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  curl wget git unzip \
  android-tools-adb \
  network-manager \
  usbutils \
  build-essential
log "System packages installed"

# ── 2. Node.js 20 (LTS) ───────────────────────────────────────────────────────
section "2/7 Node.js"
if ! command -v node &>/dev/null || [[ $(node --version | cut -d'.' -f1 | tr -d 'v') -lt 18 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  log "Node.js $(node --version) installed"
else
  log "Node.js $(node --version) already installed"
fi

# Install global tools
npm install -g pm2 @nestjs/cli typescript --quiet
log "PM2 + NestJS CLI installed globally"

# ── 3. ADB Global Setup ───────────────────────────────────────────────────────
section "3/7 ADB Configuration"
# Enable ADB server auto-start
cat > /etc/udev/rules.d/51-android.rules << 'EOF'
# Android devices - allow ADB
SUBSYSTEM=="usb", ATTR{idVendor}=="18d1", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="04e8", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="22b8", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="0bb4", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="12d1", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="2717", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="1004", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="0fce", MODE="0666", GROUP="plugdev"
# Generic - all USB devices
SUBSYSTEM=="usb", MODE="0666", GROUP="plugdev"
EOF
udevadm control --reload-rules
udevadm trigger
usermod -aG plugdev pi 2>/dev/null || true
log "ADB udev rules configured"

# Start ADB server
adb start-server
log "ADB server started"

# ── 4. APK Storage Directory ──────────────────────────────────────────────────
section "4/7 APK Directory"
mkdir -p /home/pi/apks
chown pi:pi /home/pi/apks
chmod 755 /home/pi/apks
log "APK directory: /home/pi/apks"

# ── 5. NetworkManager for WiFi ────────────────────────────────────────────────
section "5/7 WiFi (NetworkManager)"
# Ensure NetworkManager manages wlan0
if [ -f /etc/dhcpcd.conf ]; then
  # Prevent dhcpcd from managing wlan0 (let NM handle it)
  grep -q "nohook wlan0" /etc/dhcpcd.conf || echo "nohook wlan0" >> /etc/dhcpcd.conf
fi
systemctl enable NetworkManager
systemctl start NetworkManager
log "NetworkManager active"

# Optional: wifi-connect for portal-mode hotspot
if ! command -v wifi-connect &>/dev/null; then
  warn "wifi-connect not found. Installing..."
  curl -L https://github.com/balena-os/wifi-connect/releases/download/v4.11.25/wifi-connect-v4.11.25-linux-aarch64.tar.gz \
    -o /tmp/wc.tar.gz 2>/dev/null && \
    tar -xzf /tmp/wc.tar.gz -C /usr/local/bin wifi-connect && \
    chmod +x /usr/local/bin/wifi-connect && \
    log "wifi-connect installed" || \
    warn "wifi-connect install failed (optional - nmcli AP will be used instead)"
fi

# ── 6. Deploy NestJS API ──────────────────────────────────────────────────────
section "6/7 NestJS API Deployment"
DEPLOY_DIR="/opt/gothitech-api"
mkdir -p $DEPLOY_DIR

# Copy the backend files (assumes they are in same dir as this script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -d "$SCRIPT_DIR" ]; then
  cp -r "$SCRIPT_DIR"/. $DEPLOY_DIR/
  chown -R pi:pi $DEPLOY_DIR
fi

cd $DEPLOY_DIR
if [ -f package.json ]; then
  log "Installing npm dependencies..."
  npm install --quiet
  log "Building NestJS app..."
  npm run build
  log "NestJS build complete"
fi

# ── 7. PM2 Service ───────────────────────────────────────────────────────────
section "7/7 PM2 Service"
cd $DEPLOY_DIR
pm2 delete gothitech-api 2>/dev/null || true
pm2 start dist/main.js \
  --name gothitech-api \
  --env production \
  --exp-backoff-restart-delay=100 \
  --max-memory-restart 200M
pm2 save
pm2 startup systemd -u pi --hp /home/pi | tail -1 | bash || true

log "PM2 service configured"

# ── Done ──────────────────────────────────────────────────────────────────────
section "✅ Setup Complete!"
PI_IP=$(hostname -I | awk '{print $1}')
echo -e "${GREEN}"
echo "  GothiTech Pi is ready!"
echo ""
echo "  📡 API URL:   http://$PI_IP:3000"
echo "  📚 Swagger:   http://$PI_IP:3000/docs"
echo "  📱 APK dir:   /home/pi/apks"
echo "  🔌 ADB:       adb devices"
echo ""
echo "  Use this IP in your Android app: $PI_IP"
echo -e "${NC}"
