# Eye Strain Monitoring System
## Sistem Web-Based Monitoring Viewing Distance Mata

**Sebuah sistem IoT real-time untuk mencegah Computer Vision Syndrome (CVS) dan eye strain dengan monitoring jarak pandang otomatis**

---

## 📋 Daftar Isi
1. [Gambaran Umum](#gambaran-umum)
2. [Fitur Utama](#fitur-utama)
3. [Komponen Hardware](#komponen-hardware)
4. [Komponen Software](#komponen-software)
5. [Setup & Instalasi](#setup--instalasi)
6. [Kalibrasi Sensor](#kalibrasi-sensor)
7. [API Documentation](#api-documentation)
8. [Panduan Pengguna](#panduan-pengguna)
9. [Tips Kesehatan Mata](#tips-kesehatan-mata)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Gambaran Umum

Sistem ini dirancang untuk memantau jarak antara mata pengguna dan layar monitor secara real-time menggunakan sensor ultrasonik HC-SR04 dan mikrokontroler ESP32. Sistem memberikan peringatan otomatis ketika jarak pandang terdeteksi tidak sesuai standar ergonomi kesehatan mata.

### Standar Kesehatan Mata (Clinical Standards)
- **Jarak Aman**: 62-75 cm (Optimal untuk monitor komputer)
- **Jarak Peringatan**: 40-62 cm (Mulai menunjukkan gejala)
- **Jarak Bahaya**: <40 cm (Risiko tinggi CVS dan miopia)

### Target Pengguna
- 🎓 Pelajar dan mahasiswa
- 💼 Pekerja kantoran/office worker
- 👨‍💻 Developer dan programmer
- 🎮 Gamer
- 📱 Content creator

---

## ✨ Fitur Utama

### 1. **Real-Time Distance Gauge** 👁️
- Indikator jarak visual dengan gradasi warna (hijau = aman, merah = bahaya)
- Tampilan angka digital besar untuk mudah dibaca
- Update real-time setiap 3 detik

### 2. **Distance History Chart** 📊
- Grafik riwayat jarak pandang dengan time-range filter
- Filter waktu: 1 jam, 6 jam, 24 jam, 7 hari
- Visualisasi tren kebiasaan duduk pengguna
- Statistik: rata-rata, maksimum, minimum, count peringatan

### 3. **System Status Report** 🔧
- Status sensor (Terhubung/Offline)
- Status WiFi (Connected/Disconnected)
- Status Database
- Timestamp update terakhir

### 4. **Calibration Tool** 🎯
- Wizard kalibrasi 3 langkah
- Penyesuaian sensor terhadap posisi kerja individual
- Validasi akurasi sensor

### 5. **Advanced Settings** ⚙️
- Pengaturan threshold jarak (aman, peringatan, bahaya)
- Kontrol notifikasi (suara, desktop notification, getaran)
- Sensitivitas alarm (5 level)
- Penyimpanan otomatis settings ke localStorage

### 6. **Notification System** 🔔
- Notifikasi desktop browser
- Suara alarm urgency
- Getaran/Vibration (jika device support)
- Tidak mengganggu namun efektif

### 7. **Eye Care Tips** 💡
- Aturan 20-20-20
- Panduan pencahayaan
- Tips berkedip
- Posisi duduk ergonomis
- Istirahat mata
- Blue light protection

---

## 🔧 Komponen Hardware

### Required Components
```
┌─────────────────────────┐
│     KOMPONEN UTAMA      │
├─────────────────────────┤
│ 1. ESP32 Microcontroller│ $8-12
│    - WiFi integrated    │
│    - Low power          │
│    - GPIO support       │
│                         │
│ 2. HC-SR04 Sensor       │ $2-3
│    - Ultrasonic sensor  │
│    - Range: 2-400 cm    │
│    - Accuracy: ±3mm     │
│                         │
│ 3. Buzzer 5V            │ $1-2
│    - Audio feedback      │
│                         │
│ 4. Breadboard & Jumpers │ $2-3
│ 5. USB Power Supply     │ $3-5
│ 6. Voltage Divider      │ $1
│    (Resistor 1K + 2K)   │
├─────────────────────────┤
│ Total Cost: $17-26      │
└─────────────────────────┘
```

### Hardware Schematic
```
ESP32 PIN CONNECTIONS:
┌──────────────────┐
│      ESP32       │
├──────────────────┤
│ GPIO5  ────┐    │
│ GND    ─┐  │    │
│ 5V     │  │    │
│        │  │    │
│ GPIO4  ──┐│    │
│ GPIO2  ─┐││    │
│        │││    │
│        │││    │
│ 3.3V   ─┼┼┼──→ Sensor VCC
│ GND    ─┼┼┴──→ Sensor GND
│        └┼─────→ HC-SR04 TRIG
│         └──────→ HC-SR04 ECHO
│ (via voltage divider)
└──────────────────┘

HC-SR04 PINOUT:
VCC (5V)  - Red
GND       - Black
TRIG      - Yellow (GPIO5)
ECHO      - Green (GPIO4 via voltage divider)

VOLTAGE DIVIDER (5V → 3.3V):
5V ──[1kΩ]──┬── 3.3V
            │
         [2kΩ]
            │
           GND
```

---

## 💻 Komponen Software

### Frontend
- **HTML5**: Structure & semantic markup
- **CSS3**: Modern responsive design dengan glassmorphism
- **JavaScript (Vanilla)**: Real-time updates & interactivity
- **Chart.js**: Data visualization
- **Font Awesome**: Icon library

### Backend
- **PHP 7+**: Server-side logic
- **MySQL**: Database storage
- **REST API**: Device communication

### Browser Support
- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Android)

---

## 🚀 Setup & Instalasi

### Prerequisites
```bash
- XAMPP atau LAMP stack
- PHP 7.0+
- MySQL 5.7+
- Modern web browser
- ESP32 dengan Arduino IDE
```

### Step 1: Database Setup

```bash
# Login ke MySQL
mysql -u root -p

# Create database
CREATE DATABASE eye_monitoring;
USE eye_monitoring;

# Import schema
SOURCE /path/to/schema_eye_monitoring.sql;

# Verify tables
SHOW TABLES;
```

### Step 2: File Structure

```
/opt/lampp/htdocs/web-medis/
├── eye-monitoring.html          # Main dashboard
├── eye-monitoring-style.css     # Styling
├── eye-monitoring-script.js     # Client-side logic
├── config.php                   # Database config
├── api/
│   └── eye-monitoring.php       # API endpoints
├── schema_eye_monitoring.sql    # Database schema
└── README.md                    # Documentation
```

### Step 3: Configure Database Connection

Edit `config.php`:
```php
<?php
// Database Configuration
define('DB_SERVER', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'eye_monitoring');

// Create connection
$conn = new mysqli(DB_SERVER, DB_USER, DB_PASS, DB_NAME);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Set charset
$conn->set_charset("utf8mb4");
?>
```

### Step 4: Setup ESP32

#### Required Libraries
- WiFi.h
- HTTPClient.h
- NewPing.h (or Ultrasonic.h)

#### Firmware Example
```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <NewPing.h>

// Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverName = "http://192.168.x.x/web-medis/api/eye-monitoring.php";

// Sensor pins
#define TRIGGER_PIN 5
#define ECHO_PIN 4
#define MAX_DISTANCE 400
#define BUZZER_PIN 26

NewPing sonar(TRIGGER_PIN, ECHO_PIN, MAX_DISTANCE);
unsigned long lastUpdate = 0;
const unsigned long updateInterval = 3000; // 3 seconds

void setup() {
    Serial.begin(115200);
    pinMode(BUZZER_PIN, OUTPUT);
    
    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi");
    
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    
    Serial.println("\nWiFi connected");
    Serial.println(WiFi.localIP());
}

void loop() {
    if (millis() - lastUpdate >= updateInterval) {
        lastUpdate = millis();
        
        // Measure distance
        int distance = sonar.ping_cm();
        
        // Send to server
        if (WiFi.status() == WL_CONNECTED) {
            HTTPClient http;
            http.begin(serverName);
            http.addHeader("Content-Type", "application/json");
            
            String payload = "{\"device_id\":\"ESP32-001\",\"distance\":" + 
                           String(distance) + ",\"signal_strength\":" + 
                           String(WiFi.RSSI()) + "}";
            
            int httpResponseCode = http.POST(payload);
            
            if (distance < 30) {
                digitalWrite(BUZZER_PIN, HIGH);
                delay(200);
                digitalWrite(BUZZER_PIN, LOW);
            }
            
            http.end();
        }
    }
}
```

---

## 🎯 Kalibrasi Sensor

### Langkah Kalibrasi Manual

1. **Posisikan Sensor**
   - Letakkan di bawah monitor
   - Harus mengarah langsung ke wajah Anda

2. **Setup Posisi Duduk**
   - Duduk normal di posisi kerja
   - Jangan mengubah posisi selama kalibrasi

3. **Jalankan Kalibrasi**
   - Buka Settings
   - Klik "Mulai Kalibrasi"
   - Tunggu 30 detik
   - Sistem akan mencatat jarak rata-rata

### Troubleshooting Kalibrasi
- **Pembacaan 0 cm**: Sensor menghadap ke bawah/salah arah
- **Pembacaan >150 cm**: Sensor terlalu jauh atau ada halangan
- **Pembacaan berfluktuasi**: Ada benda bergerak di depan sensor

---

## 📡 API Documentation

### Base URL
```
http://localhost/web-medis/api/eye-monitoring.php
```

### 1. POST: Send Distance Data
**Endpoint**: `?action=distance`

**Request**:
```json
{
  "device_id": "ESP32-001",
  "distance": 55.5,
  "signal_strength": -45
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Data saved",
  "distance": 55.5,
  "timestamp": "2026-05-12 14:30:45"
}
```

### 2. GET: Get Latest Distance
**Endpoint**: `?action=distance&device_id=ESP32-001&limit=5`

**Response**:
```json
{
  "status": "success",
  "device_id": "ESP32-001",
  "data": [
    {
      "distance": 55.5,
      "signal_strength": -45,
      "timestamp": "2026-05-12 14:30:45"
    }
  ]
}
```

### 3. GET: Get Distance History
**Endpoint**: `?action=history&device_id=ESP32-001&range=24h`

**Parameters**:
- `range`: 1h, 6h, 24h, 7d

**Response**: Array of distance measurements

### 4. GET: Get Statistics
**Endpoint**: `?action=stats&device_id=ESP32-001&range=24h`

**Response**:
```json
{
  "statistics": {
    "average_distance": 58.3,
    "max_distance": 75.2,
    "min_distance": 35.1,
    "total_measurements": 480,
    "danger_count": 12,
    "warning_count": 35,
    "safe_count": 433
  }
}
```

### 5. GET: Get System Status
**Endpoint**: `?action=status&device_id=ESP32-001`

**Response**:
```json
{
  "device": {
    "device_id": "ESP32-001",
    "sensor_status": "Online",
    "wifi_status": "Connected",
    "database_status": "Online",
    "latest_distance": 58.5,
    "signal_strength": -45
  }
}
```

### 6. POST: Save Settings
**Endpoint**: `?action=settings`

**Request**:
```json
{
  "user_id": "user123",
  "threshold_safe": 62,
  "threshold_warning": 40,
  "threshold_danger": 30,
  "alarm_sound": true,
  "desktop_notification": true,
  "vibration": false,
  "sensitivity": 3
}
```

---

## 👥 Panduan Pengguna

### Dashboard Overview
1. **Gauge Display**: Lihat jarak mata real-time
2. **Status Report**: Check kesehatan sistem
3. **History Chart**: Analisis tren 24 jam
4. **Eye Care Tips**: Baca tips kesehatan

### Menggunakan Settings

#### Kalibrasi Sensor
1. Buka Settings (gear icon)
2. Scroll ke "Calibration"
3. Ikuti 3 langkah panduan
4. Klik "Mulai Kalibrasi"
5. Tunggu 30 detik

#### Atur Ambang Batas
1. Di tab "Threshold"
2. Gunakan slider untuk menyesuaikan
3. Nilai minimum/maximum terlampir
4. Klik "Simpan"

#### Notifikasi
1. Toggle untuk aktifkan/nonaktifkan
2. Pilih jenis notifikasi (suara, desktop, getaran)
3. Atur sensitivitas (1-5)
4. Klik "Simpan"

### Tips Penggunaan
- ✅ Kalibrasi ulang setiap bulan
- ✅ Gunakan saat bekerja 8+ jam
- ✅ Kombinasi dengan aturan 20-20-20
- ✅ Periksa statistik mingguan
- ✅ Jangan non-aktifkan notifikasi

---

## 💡 Tips Kesehatan Mata

### Aturan 20-20-20
```
Setiap 20 menit:
  - Lihat objek sejauh 20 kaki (6 meter)
  - Selama 20 detik
  - Untuk merelaksasi otot akomodasi
```

### Pencahayaan Optimal
```
Intensitas cahaya ideal: 300-500 lux
- Hindari silau langsung
- Gunakan task lighting
- Cahaya dari samping/belakang monitor
- Hindari ruangan gelap
```

### Posisi Kerja Ergonomis
```
Panduan Posisi:
- Monitor setinggi mata (sedikit ke bawah)
- Jarak: 50-75 cm
- Posisi kepala: netral, tidak membungkuk
- Bahu: rileks, tidak terangkat
- Lengan: 90-110 derajat
- Kaki: flat di lantai/footrest
```

### Istirahat Mata
```
Jadwal Istirahat:
- Setiap 1 jam: 5-10 menit istirahat
- Tutup mata atau lihat kejauhan
- Lakukan latihan mata
- Berjalan-jalan sebentar
```

### Blue Light Protection
```
Cara Mengurangi Blue Light:
- Aktifkan Mode Night/Dark Mode
- Gunakan blue light filter
- Kurangi brightness layar
- Gunakan kacamata anti-blue light
- Hindari penggunaan saat tidur
```

### Tanda-tanda Computer Vision Syndrome (CVS)
```
Gejala Umum:
✗ Mata kering/perih
✗ Pandangan kabur
✗ Sakit kepala tegang
✗ Leher/bahu tegang
✗ Kesulitan fokus

Jika mengalami gejala:
→ Istirahat mata 15 menit
→ Kompres mata dengan air hangat
→ Berkonsultasi dengan dokter mata
```

---

## 🔧 Troubleshooting

### Sensor Tidak Terbaca

**Problem**: Distance menunjukkan 0 atau nilai aneh

**Solutions**:
```
1. Cek koneksi kabel:
   - Trig ke GPIO5
   - Echo ke GPIO4
   - VCC ke 5V
   - GND ke GND

2. Verifikasi voltage divider:
   - Resistor 1kΩ + 2kΩ
   - Hubung dengan benar

3. Periksa sensor fisik:
   - Bersihkan lensa sensor
   - Tidak ada halangan di depan
   - Sensor dalam kondisi baik

4. Reload firmware ESP32
```

### WiFi Disconnect

**Problem**: "WiFi Status: Disconnected"

**Solutions**:
```
1. Periksa SSID & password
2. Reset WiFi di ESP32:
   - Tekan reset button
   - Tunggu 2 detik
   - Cek di Serial Monitor

3. Periksa signal WiFi:
   - Dekatkan router
   - Hindari obstacle
   - Check RSSI value

4. Restart ESP32 dan browser
```

### Database Error

**Problem**: "Failed to save data"

**Solutions**:
```
1. Verifikasi MySQL berjalan:
   - XAMPP Control Panel
   - Start MySQL module

2. Periksa konfigurasi:
   - Edit config.php
   - Verifikasi credentials
   - Check database name

3. Buat ulang database:
   - DROP DATABASE eye_monitoring;
   - CREATE DATABASE eye_monitoring;
   - Import schema ulang

4. Check user permissions:
   - Grant ALL privileges
   - Flush privileges
```

### Chart Tidak Muncul

**Problem**: Area chart kosong/tidak ada data

**Solutions**:
```
1. Tunggu data accumulate:
   - Minimal 5 data points
   - Tunggu 15 detik

2. Reload halaman:
   - Ctrl+F5 (hard refresh)
   - Clear browser cache

3. Check console error:
   - F12 → Console
   - Lihat error message
   - Fix sesuai error

4. Verifikasi Chart.js loaded:
   - Check Network tab
   - Ensure library loaded
```

### Notifikasi Tidak Muncul

**Problem**: Desktop notifications tidak keluar

**Solutions**:
```
1. Grant permission:
   - Browser akan ask untuk permission
   - Klik "Allow"

2. Periksa browser settings:
   - Chrome: Settings → Notifications
   - Firefox: Preferences → Privacy
   - Safari: Preferences → Websites

3. Buka di tab terakhir:
   - Notifikasi hanya muncul jika tab active

4. Periksa setting toggle:
   - Settings modal
   - Enable "Desktop Notification"
   - Klik "Simpan"
```

---

## 📊 Performance Metrics

### Recommended Specs
```
Server:
- CPU: 1+ core
- RAM: 512 MB minimum
- Storage: 10 GB (untuk 1 tahun data)
- Bandwidth: 10 Mbps uplink

Database:
- MySQL 5.7+
- Recommended: SSD storage
- Backup: Daily incremental

Client:
- Browser modern (Chrome 90+, Firefox 88+)
- RAM: 2 GB minimum
- Network: Stable WiFi 5GHz
```

### Data Storage
```
Retention Policy:
- Raw data: 90 days
- Daily stats: 2 years
- Alerts: 30 days (resolved)
- Session logs: 1 year

Estimated Storage:
- 1 measurement/3 sec = 28,800/day
- ~2 MB per hari
- ~60 MB per bulan
- ~730 MB per tahun
```

---

## 🔐 Security Considerations

### Input Validation
- All user input sanitized
- SQL injection prevention via prepared statements
- XSS protection via htmlspecialchars()

### API Security
- CORS headers configured
- Rate limiting recommended
- HTTPS recommended for production

### Data Privacy
- No facial recognition (ultrasonik sensor safe)
- Compliant with UU PDP No.27/2022
- Data encryption recommended
- Local storage for user settings

---

## 📱 Future Enhancements

- [ ] Mobile app (React Native/Flutter)
- [ ] Real-time alerts via push notification
- [ ] Machine learning for posture prediction
- [ ] Wearable integration
- [ ] Cloud sync across devices
- [ ] Team dashboard untuk office
- [ ] Integration dengan SatuSehat
- [ ] Voice command support
- [ ] AR visualization mode
- [ ] Gamification & achievements

---

## 👨‍💼 Support & Contact

**Project Team**:
- Nasywa Defriananta (5049231062)
- Faiz Habiburrahman Az Zayyan (5049231072)
- Dayana Satira Balqis (5049231093)
- Nouval Afif Riza (5049231099)
- Leandro Mora Aril Ezequiel Silalahi (5049231101)
- Lilis Rahmawati (5049231119)

**Advisor**: Alfandino Rasyid, S.Tr.T, M.Tr.T

**Institution**: Institut Teknologi Sepuluh Nopember (ITS) Surabaya
**Department**: Departemen Teknologi Kedokteran
**Faculty**: Fakultas Kedokteran dan Kesehatan

---

## 📄 License

Open Source - Educational Purpose

---

## 🙏 Acknowledgments

- American Optometric Association (AOA)
- Indonesian Health Ministry (Kemenkes RI)
- ITS Medical Technology Department
- Open source communities

---

## 📚 References

1. AOA (2023). Computer Vision Syndrome
2. Hodgson, K. (2025). Viewing Distance Guidelines
3. Sekolah Tinggi Ilmu Kesehatan Kuningan. (2022). CVS Research
4. Kementerian Kesehatan RI. (2022). Rekam Medis Regulation
5. UU PDP No. 27 Tahun 2022. Perlindungan Data Pribadi

---

**Version**: 1.0.0  
**Last Updated**: May 12, 2026  
**Compatibility**: All modern browsers  
**Status**: Production Ready ✓

---

## Quick Start Checklist

- [ ] Install XAMPP dan MySQL
- [ ] Create database dan import schema
- [ ] Configure config.php
- [ ] Upload files ke htdocs
- [ ] Access http://localhost/web-medis/eye-monitoring.html
- [ ] Setup ESP32 dan upload firmware
- [ ] Jalankan kalibrasi sensor
- [ ] Test API endpoints
- [ ] Baca tips kesehatan mata
- [ ] Monitor jarak pandang Anda! 👀

---

**Stay healthy, monitor your distance! 👁️💚**
