#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

// Konfigurasi Wi-Fi dan MQTT Broker (HiveMQ Cloud)
const char* ssid = "Palapip";
const char* password = "Apip1234";
const char* mqtt_server = "21a2feb71b754d4f858933c81b2dc8ea.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "palapip";
const char* mqtt_password = "Aa123456";

WiFiClientSecure espClient;
PubSubClient client(espClient);

// Pin Hardware
const int TRIG_PIN = 5;
const int ECHO_PIN = 18;
const int BUZZER_PIN = 19;

// Filter Moving Average (10 Sampel) 
const int FILTER_SAMPLES = 10;
float distanceSamples[FILTER_SAMPLES] = {0};
int sampleIndex = 0;

// Variabel Timer untuk Logika Keputusan 
unsigned long closeDistanceStartTime = 0; 
bool isTrackingTime = false;

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  espClient.setInsecure(); // Mengabaikan verifikasi sertifikat SSL untuk HiveMQ Cloud
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
}

void setup_wifi() {
  delay(10);
  Serial.println("Menghubungkan ke WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Terhubung");
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Mencoba koneksi MQTT...");
    if (client.connect("ESP32_EyeMonitor", mqtt_user, mqtt_password)) {
      Serial.println("Terhubung ke Broker");
    } else {
      Serial.print("Gagal, rc=");
      Serial.print(client.state());
      Serial.println(" Coba lagi dalam 5 detik");
      delay(5000);
    }
  }
}

float getFilteredDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH);
  float rawDist = duration * 0.034 / 2;
  
  // Rule-Based Filtering untuk menyaring noise ekstrim [cite: 200]
  if (rawDist <= 2.0 || rawDist > 100.0) {
    return -1; // Data tidak valid, abaikan jika lompatan terlalu jauh
  }
  
  // Masukkan ke array moving average 
  distanceSamples[sampleIndex] = rawDist;
  sampleIndex = (sampleIndex + 1) % FILTER_SAMPLES;
  
  float sum = 0;
  for (int i = 0; i < FILTER_SAMPLES; i++) {
    sum += distanceSamples[i];
  }
  return sum / FILTER_SAMPLES;
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  float distance = getFilteredDistance();
  if (distance == -1) return; // Lewati loop jika data terindikasi noise [cite: 200]

  Serial.print("Jarak Terfilter: ");
  Serial.println(distance);

  unsigned long currentMillis = millis();

  // Logika Keputusan Berdasarkan Tabel 3.5.3.3 
  if (distance < 62.0) {
    if (!isTrackingTime) {
      closeDistanceStartTime = currentMillis;
      isTrackingTime = true;
    }
    
    unsigned long durationClose = currentMillis - closeDistanceStartTime;

    // Kondisi Bahaya: Jarak < 35 cm kapan pun 
    if (distance < 35.0) {
      digitalWrite(BUZZER_PIN, HIGH);
      client.publish("eye/status", "BAHAYA");
      Serial.println("Status: BAHAYA (Buzzer Aktif)");
    } 
    // Kondisi Peringatan: Jarak < 62 cm selama >= 10 detik 
    else if (durationClose >= 10000) {
      digitalWrite(BUZZER_PIN, LOW); 
      client.publish("eye/status", "PERINGATAN");
      Serial.println("Status: PERINGATAN (Pop-up Browser)");
    } 
    // Kondisi Waspada: Jarak < 62 cm selama >= 3 detik 
    else if (durationClose >= 3000) {
      digitalWrite(BUZZER_PIN, LOW);
      client.publish("eye/status", "WASPADA");
      Serial.println("Status: WASPADA (Notifikasi Dashboard)");
    }
  } else {
    // Jarak aman (> 62 cm), reset timer dan matikan buzzer 
    isTrackingTime = false;
    digitalWrite(BUZZER_PIN, LOW);
    client.publish("eye/status", "AMAN");
  }

  // Kirim data numerik jarak secara berkala ke MQTT untuk grafik riwayat 
  static unsigned long lastPayloadTime = 0;
  if (currentMillis - lastPayloadTime > 300) { // Kirim setiap .....detik
    char distanceStr[8];
    dtostrf(distance, 4, 2, distanceStr);
    client.publish("eye/distance", distanceStr);
    lastPayloadTime = currentMillis;
  }

  delay(100); // Sampling rate dasar 100ms
}
