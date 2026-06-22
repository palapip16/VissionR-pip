// utils.js – Auth guard, language toggle (i18n), and logout

// ===== Translation Dictionary =====
const TRANSLATIONS = {
  en: {
    // Dashboard
    welcome: 'Welcome back! 👋',
    subtitle: 'Web-Based Eye Viewing Distance Monitoring System',
    statusIdle: 'Waiting For Connection...',
    logout: 'Logout',
    liveTracking: 'Live Distance Tracking',
    distanceHint: 'Real-time ergonomic monitor distance detection via ESP32.',
    connectSensor: 'Connect to Sensor',
    myActivity: 'My Activity',
    myActivityDesc: 'Monitor history charts (Distance History), MVD, and screen-time violation index of the last 24 hours.',
    viewReport: 'View Report →',
    eyeCareTips: 'Eye Care Tips',
    eyeCareTipsDesc: 'Guidelines for preventing Computer Vision Syndrome (CVS) and the 20-20-20 ergonomics rule.',
    readTips: 'Read Tips →',
    systemSettings: 'System Settings',
    systemSettingsDesc: 'Ultrasonic sensor (HC-SR04) calibration, alarm adjustments, and HiveMQ server configuration.',
    configure: 'Configure →',
    // History
    historyTitle: 'My Activity',
    historyDesc: 'Analysis of viewing distance trends and clinical metrics.',
    backToDashboard: '← Back to Dashboard',
    // Education
    educationTitle: 'Eye Care Tips 👁️',
    educationDesc: 'Guidelines for prevention and education of Computer Vision Syndrome (CVS).',
    // Settings
    settingsTitle: 'System Settings ⚙️',
    settingsDesc: 'Device configuration, alarm preferences, and sensor calibration.',
    startCalibration: 'Start Sensor Calibration'
  },
  id: {
    // Dashboard
    welcome: 'Selamat datang kembali! 👋',
    subtitle: 'Sistem Pemantauan Jarak Pandang Mata Berbasis Web',
    statusIdle: 'Menunggu Koneksi...',
    logout: 'Keluar',
    liveTracking: 'Pelacakan Jarak Langsung',
    distanceHint: 'Deteksi jarak monitor ergonomis secara real-time via ESP32.',
    connectSensor: 'Hubungkan Sensor',
    myActivity: 'Aktivitas Saya',
    myActivityDesc: 'Pantau grafik riwayat (Riwayat Jarak), MVD, dan indeks pelanggaran screen-time 24 jam terakhir.',
    viewReport: 'Lihat Laporan →',
    eyeCareTips: 'Tips Kesehatan Mata',
    eyeCareTipsDesc: 'Panduan pencegahan Computer Vision Syndrome (CVS) dan aturan ergonomi 20-20-20.',
    readTips: 'Baca Tips →',
    systemSettings: 'Pengaturan Sistem',
    systemSettingsDesc: 'Kalibrasi sensor ultrasonik (HC-SR04), pengaturan alarm, dan konfigurasi server HiveMQ.',
    configure: 'Konfigurasi →',
    // History
    historyTitle: 'Aktivitas Saya',
    historyDesc: 'Analisis tren jarak pandang dan metrik klinis.',
    backToDashboard: '← Kembali ke Dashboard',
    // Education
    educationTitle: 'Tips Kesehatan Mata 👁️',
    educationDesc: 'Panduan pencegahan dan edukasi Computer Vision Syndrome (CVS).',
    // Settings
    settingsTitle: 'Pengaturan Sistem ⚙️',
    settingsDesc: 'Konfigurasi perangkat, preferensi alarm, dan kalibrasi sensor.',
    startCalibration: 'Mulai Kalibrasi Sensor'
  }
};

// ===== Auth Guard =====
function ensureAuth() {
  document.body.style.visibility = 'hidden';
  if (location.pathname.includes('login.html')) {
    document.body.style.visibility = 'visible';
    return;
  }
  if (!window.firebase || !firebase.auth) {
    setTimeout(ensureAuth, 200);
    return;
  }
  firebase.auth().onAuthStateChanged(user => {
    if (user) { document.body.style.visibility = 'visible'; return; }
    location.href = 'login.html';
  });
}

// ===== Language Toggle =====
function getCurrentLang() {
  return localStorage.getItem('visionr-lang') || 'en';
}

function applyLanguage() {
  const lang = getCurrentLang();
  const dict = TRANSLATIONS[lang];
  if (!dict) return;

  // Update button label to show opposite language
  const btn = document.getElementById('langToggleBtn');
  if (btn) btn.textContent = lang === 'en' ? 'ID 🇮🇩' : 'EN 🇬🇧';

  // Apply all data-i18n attributes on the page
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (!dict[key]) return;
    el.textContent = dict[key];
  });
}

function toggleLanguage() {
  const next = getCurrentLang() === 'en' ? 'id' : 'en';
  localStorage.setItem('visionr-lang', next);
  applyLanguage();
}

// ===== Logout =====
function logout() {
  if (!window.firebase || !firebase.auth) return;
  firebase.auth().signOut()
    .then(() => { location.href = 'login.html'; })
    .catch(err => { console.error('Logout error', err); });
}

// ===== Sensor Calibration Placeholder =====
function startCalibration() {
  if (!window.eyeMonitoring) return console.warn('Calibration: eyeMonitoring not loaded');
  console.log('Calibration started – collecting 10 samples');
}

// ===== Init on DOM ready =====
document.addEventListener('DOMContentLoaded', () => {
  ensureAuth();
  applyLanguage();

  const langBtn = document.getElementById('langToggleBtn');
  if (langBtn) langBtn.onclick = toggleLanguage;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.onclick = logout;

  const calibBtn = document.getElementById('btnStartCalibration');
  if (calibBtn) calibBtn.onclick = startCalibration;
});
