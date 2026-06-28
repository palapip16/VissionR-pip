# VisionR

Sistem Pemantauan Jarak Pandang Mata Berbasis Web dan IoT (Internet of Things).
Proyek ini menggunakan sensor jarak ultrasonik (HC-SR04) yang dihubungkan ke ESP32 untuk mendeteksi jarak pengguna ke layar, lalu mengirimkannya secara real-time via MQTT ke web dashboard. Sistem ini juga mencatat riwayat pemantauan menggunakan Firebase dan memberikan alarm/notifikasi jika jarak terlalu dekat.

## Komposisi Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **PWA:** Service Worker (`sw.js`) & `manifest.json`
- **Backend / BaaS:** Firebase (Authentication, Realtime Database)
- **IoT Firmware:** C/C++ (Arduino) untuk ESP32
- **Hardware:** ESP32, Sensor Ultrasonik HC-SR04, Buzzer
- **Protokol & Middleware:** MQTT (Broker: HiveMQ Cloud), Eclipse Paho MQTT (Web Client), PubSubClient (Arduino Client)
