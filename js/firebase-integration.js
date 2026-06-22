// js/firebase-integration.js

const firebaseConfig = {
  apiKey: "AIzaSyD2ORim_g-S036ioLYAqXS0HdYjtu0aR1o",
  authDomain: "visionr-iot.firebaseapp.com",
  databaseURL: "https://visionr-iot-default-rtdb.firebaseio.com",
  projectId: "visionr-iot",
  storageBucket: "visionr-iot.firebasestorage.app",
  messagingSenderId: "591491441567",
  appId: "1:591491441567:web:58a88d58f1bf6930b8d3aa"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const database = firebase.database();
const auth = firebase.auth();
window.currentUserId = null; 

// Listener Sesi Login
auth.onAuthStateChanged((user) => {
  if (user) {
    window.currentUserId = user.uid;
    
    // --- LOGIKA NAMA DINAMIS ---
    const welcomeEl = document.getElementById('welcomeText');
    if (welcomeEl) {
        // Gunakan nama profil, kalau kosong gunakan teks sebelum '@' dari email
        const displayName = user.displayName || user.email.split('@')[0];
        welcomeEl.innerHTML = `Welcome back, <strong>${displayName}</strong>! 👋`;
    }

  } else {
    // Fallback for prototype so data still saves even if not logged in
    window.currentUserId = "Dayana_Balqis";
    const welcomeEl = document.getElementById('welcomeText');
    if (welcomeEl && welcomeEl.innerHTML.includes('Welcome back!')) {
        welcomeEl.innerHTML = `Welcome back, <strong>Guest</strong>! 👋`;
    }
  }
});

window.logDataToCloud = function(distance, status) {
  if (!window.currentUserId) return;
  const historyRef = database.ref('users/' + window.currentUserId + '/history');
  historyRef.push({
    distance: distance,
    status: status,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  });
};

window.loginUser = function(email, password) {
  return auth.signInWithEmailAndPassword(email, password);
};

// --- LOGIKA REGISTRASI + NAMA ---
window.registerUser = function(name, email, password) {
  return auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Menyimpan nama ke profil Firebase
      return userCredential.user.updateProfile({
        displayName: name
      });
    });
};

window.logoutUser = function() {
  return auth.signOut();
};