#!/usr/bin/env bash
# ============================================================
#  GothiTech — Bluetooth Service Setup
#  Run: sudo bash bt-setup.sh
#  Pi par chalao — /home/gothitech/gothitech-nest/ ke andar
# ============================================================
set -e
GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[BT-SETUP]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

[[ $EUID -ne 0 ]] && { echo "sudo bash bt-setup.sh chalao"; exit 1; }

# ── 1. Dependencies ───────────────────────────────────────────────────────────
log "Step 1: Installing Bluetooth packages..."
apt-get update -qq
apt-get install -y bluetooth bluez python3-pip python3-dev libbluetooth-dev

# PyBluez install
pip3 install PyBluez --break-system-packages 2>/dev/null || \
pip3 install PyBluez 2>/dev/null || \
warn "PyBluez already installed or skipped"

log "Step 1 Done ✓"

# ── 2. Bluetooth config — always discoverable ─────────────────────────────────
log "Step 2: Configuring Bluetooth..."
systemctl enable bluetooth
systemctl start bluetooth
sleep 2

# Set device name and make always discoverable
bluetoothctl << 'BTEOF'
system-alias GothiTech-Pi
discoverable on
pairable on
BTEOF

# Permanent discoverable in config
BTCONF="/etc/bluetooth/main.conf"
if grep -q "DiscoverableTimeout" "$BTCONF"; then
  sed -i 's/.*DiscoverableTimeout.*/DiscoverableTimeout = 0/' "$BTCONF"
else
  echo -e "\n[General]\nDiscoverableTimeout = 0\nPairableTimeout = 0" >> "$BTCONF"
fi

systemctl restart bluetooth
sleep 2
log "Step 2 Done ✓"

# ── 3. Deploy Python BT service ───────────────────────────────────────────────
log "Step 3: Deploying GothiTech Bluetooth service..."
mkdir -p /opt/gothitech-bt
mkdir -p /var/log/gothitech

# Write the Python service directly
cat > /opt/gothitech-bt/bt_service.py << 'PYEOF'
#!/usr/bin/env python3
"""
GothiTech Bluetooth Service
Android APK ko Pi ka IP + status bhejta hai via Bluetooth SPP
"""
import bluetooth, json, socket, subprocess, threading, time, logging, os, signal, sys

os.makedirs('/var/log/gothitech', exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('/var/log/gothitech/bluetooth.log'),
        logging.StreamHandler()
    ]
)
log = logging.getLogger('GothiBT')

SPP_UUID    = "00001101-0000-1000-8000-00805F9B34FB"
API_PORT    = int(os.environ.get('API_PORT', 3000))
HB_INTERVAL = 5   # heartbeat har 5 sec

def get_ip():
    try:
        out = subprocess.check_output(["ip","-4","addr","show","wlan0"], stderr=subprocess.DEVNULL, text=True)
        for line in out.splitlines():
            line = line.strip()
            if line.startswith("inet "):
                return line.split()[1].split("/")[0]
    except: pass
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]; s.close(); return ip
    except: return "127.0.0.1"

def get_wifi():
    try:
        out = subprocess.check_output(["nmcli","-t","-f","active,ssid","device","wifi"], stderr=subprocess.DEVNULL, text=True)
        for line in out.splitlines():
            if line.startswith("yes:"): return line.split(":",1)[1].strip()
    except: pass
    return ""

def get_adb_count():
    try:
        out = subprocess.check_output(["adb","devices"], stderr=subprocess.DEVNULL, text=True)
        return len([l for l in out.splitlines()[1:] if l.strip() and "List" not in l])
    except: return 0

def status_packet():
    ip = get_ip()
    return {
        "type": "STATUS",
        "hostname": socket.gethostname(),
        "ip": ip,
        "api_port": API_PORT,
        "api_url": f"http://{ip}:{API_PORT}/",
        "wifi_ssid": get_wifi(),
        "adb_devices": get_adb_count(),
        "timestamp": int(time.time())
    }

class ClientThread(threading.Thread):
    def __init__(self, sock, info):
        super().__init__(daemon=True)
        self.sock = sock; self.info = info; self.alive = True

    def send(self, data):
        try: self.sock.send((json.dumps(data)+"\n").encode())
        except: self.alive = False

    def recv(self):
        buf = b""
        try:
            while True:
                ch = self.sock.recv(1)
                if not ch: return None
                if ch == b"\n": return buf.decode().strip()
                buf += ch
        except: return None

    def run(self):
        log.info(f"Connected: {self.info}")
        self.send(status_packet())

        def hb():
            while self.alive:
                time.sleep(HB_INTERVAL)
                if self.alive:
                    self.send({"type":"HEARTBEAT","ip":get_ip(),"api_port":API_PORT,"timestamp":int(time.time())})
        threading.Thread(target=hb, daemon=True).start()

        while self.alive:
            line = self.recv()
            if line is None: break
            try:
                cmd = json.loads(line)
                t = cmd.get("type","")
                if t == "GET_STATUS": self.send(status_packet())
                elif t == "PING": self.send({"type":"PONG","timestamp":int(time.time())})
                elif t == "GET_IP": self.send({"type":"IP","ip":get_ip(),"api_port":API_PORT})
            except: pass

        self.alive = False
        try: self.sock.close()
        except: pass
        log.info(f"Disconnected: {self.info}")

class BTServer:
    def __init__(self): self.srv = None; self.running = False

    def start(self):
        os.system("bluetoothctl system-alias 'GothiTech-Pi' 2>/dev/null || true")
        os.system("bluetoothctl discoverable on 2>/dev/null || true")
        os.system("bluetoothctl pairable on 2>/dev/null || true")

        self.srv = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
        self.srv.bind(("", bluetooth.PORT_ANY))
        self.srv.listen(3)
        port = self.srv.getsockname()[1]

        bluetooth.advertise_service(
            self.srv, "GothiTech Pi Controller",
            service_id=SPP_UUID,
            service_classes=[SPP_UUID, bluetooth.SERIAL_PORT_CLASS],
            profiles=[bluetooth.SERIAL_PORT_PROFILE]
        )
        log.info(f"BT Server started | Port={port} | IP={get_ip()} | API=:{API_PORT}")
        self.running = True

        while self.running:
            try:
                csock, cinfo = self.srv.accept()
                ClientThread(csock, cinfo).start()
            except Exception as e:
                if self.running: log.error(f"Accept error: {e}"); time.sleep(1)

    def stop(self):
        self.running = False
        try: self.srv.close()
        except: pass

def main():
    srv = BTServer()
    def bye(s,f): log.info("Stopping..."); srv.stop(); sys.exit(0)
    signal.signal(signal.SIGINT, bye)
    signal.signal(signal.SIGTERM, bye)
    srv.start()

if __name__ == '__main__': main()
PYEOF

chmod +x /opt/gothitech-bt/bt_service.py
log "Step 3 Done ✓"

# ── 4. Systemd service ────────────────────────────────────────────────────────
log "Step 4: Creating systemd service..."
cat > /etc/systemd/system/gothitech-bt.service << 'SVCEOF'
[Unit]
Description=GothiTech Bluetooth Controller Service
After=bluetooth.target network.target gothitech-api.service
Wants=bluetooth.target

[Service]
Type=simple
User=root
ExecStartPre=/bin/sleep 8
ExecStart=/usr/bin/python3 /opt/gothitech-bt/bt_service.py
Restart=always
RestartSec=5
Environment=API_PORT=3000

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable gothitech-bt
systemctl start gothitech-bt
log "Step 4 Done ✓"

# ── 5. PM2 — NestJS already running check ────────────────────────────────────
log "Step 5: Checking NestJS..."
if pm2 list 2>/dev/null | grep -q "gothitech"; then
    log "NestJS already running via PM2 ✓"
else
    warn "NestJS PM2 service not found — start karo: cd gothitech-nest && pm2 start ecosystem.config.js"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ GothiTech Bluetooth Setup Complete!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  BT Device Name : GothiTech-Pi"
echo "  Pi IP          : $(hostname -I | awk '{print $1}')"
echo "  NestJS API     : http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "  BT Service     : systemctl status gothitech-bt"
echo "  BT Logs        : journalctl -u gothitech-bt -f"
echo ""
echo "  📱 Android par:"
echo "     Settings → Bluetooth → Scan → 'GothiTech-Pi' se pair karo"
echo "     Phir app open karo — auto connect hoga!"
echo ""
