(() => {
  const STORAGE_KEY = "eye-monitoring-core";

  // Dynamic error logger to show errors on screen
  window.addEventListener('error', (event) => {
    showDebugMessage(`Error: ${event.message} at ${event.filename}:${event.lineno}`);
  });
  window.addEventListener('unhandledrejection', (event) => {
    showDebugMessage(`Promise Rejected: ${event.reason}`);
  });

  function showDebugMessage(msg) {
    console.error(msg);
    let box = document.getElementById('debug-log-box');
    if (!box) {
      box = document.createElement('div');
      box.id = 'debug-log-box';
      box.style.position = 'fixed';
      box.style.bottom = '10px';
      box.style.right = '10px';
      box.style.background = 'rgba(239, 68, 68, 0.95)';
      box.style.color = '#ffffff';
      box.style.padding = '12px 18px';
      box.style.borderRadius = '12px';
      box.style.fontSize = '13px';
      box.style.zIndex = '9999';
      box.style.maxWidth = '350px';
      box.style.wordBreak = 'break-all';
      box.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)';
      box.style.fontFamily = 'monospace';
      
      const closeBtn = document.createElement('span');
      closeBtn.textContent = ' ✕';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.float = 'right';
      closeBtn.style.fontWeight = 'bold';
      closeBtn.style.marginLeft = '10px';
      closeBtn.onclick = () => box.remove();
      box.appendChild(closeBtn);
      
      const title = document.createElement('strong');
      title.textContent = 'Sistem Debug Logger:';
      title.style.display = 'block';
      title.style.marginBottom = '6px';
      box.appendChild(title);

      const content = document.createElement('div');
      content.id = 'debug-log-content';
      box.appendChild(content);

      document.body.appendChild(box);
    }
    const content = document.getElementById('debug-log-content');
    if (content) {
      content.innerHTML += `<div style="margin-top:4px;border-top:1px solid rgba(255,255,255,0.2);padding-top:4px;">${msg}</div>`;
    }
  }

  const DEFAULTS = {
    thresholdSafe: 60,
    thresholdWarning: 45,
    thresholdDanger: 35,
    alarmSound: true,
    desktopNotif: true,
    vibration: false,
    alarmSensitivity: 3,
    darkMode: false,
    mqttHost: "21a2feb71b754d4f858933c81b2dc8ea.s1.eu.hivemq.cloud",
    mqttPort: 8884,
    mqttUser: "palapip",
    mqttPass: "Aa123456"
  };

  const state = {
    settings: { ...DEFAULTS },
    currentDistance: null,
    alertAt: 0,
    mqttClient: null,
    mqttConnected: false,
    isCalibrating: false,
    calibSamples: [],
    alarmDismissed: false
  };

  const ui = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved && typeof saved === "object") {
        state.settings = { ...DEFAULTS, ...saved };
      }
    } catch (error) {
      state.settings = { ...DEFAULTS };
    }
    // Always force standard thresholds (60cm ergonomics rules)
    state.settings.thresholdSafe = DEFAULTS.thresholdSafe;
    state.settings.thresholdWarning = DEFAULTS.thresholdWarning;
    state.settings.thresholdDanger = DEFAULTS.thresholdDanger;

    // Use defaults if MQTT credentials are empty in local storage
    if (!state.settings.mqttUser || state.settings.mqttUser.trim() === "") {
      state.settings.mqttUser = DEFAULTS.mqttUser;
    }
    if (!state.settings.mqttPass || state.settings.mqttPass.trim() === "") {
      state.settings.mqttPass = DEFAULTS.mqttPass;
    }
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function setStatus(kind, text) {
    ui.statusBadge.className = `status status-${kind}`;
    ui.statusBadge.textContent = text;
  }

  function syncForm() {
    ui.alarmSound.checked = Boolean(state.settings.alarmSound);
    ui.desktopNotif.checked = Boolean(state.settings.desktopNotif);
    ui.vibration.checked = Boolean(state.settings.vibration);
    ui.alarmSensitivity.value = String(state.settings.alarmSensitivity);
    ui.themeToggle.checked = Boolean(state.settings.darkMode);

    if (ui.mqttHost) ui.mqttHost.value = state.settings.mqttHost || "";
    if (ui.mqttPort) ui.mqttPort.value = String(state.settings.mqttPort || 8884);
    if (ui.mqttUser) ui.mqttUser.value = state.settings.mqttUser || "";
    if (ui.mqttPass) ui.mqttPass.value = state.settings.mqttPass || "";

    if (state.settings.darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }

  function beep(level) {
    if (!state.settings.alarmSound) return;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;

    const ctx = new Context();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.value = level === "danger" ? 920 : 720;

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }

  function notify(level, distance) {
    const now = Date.now();
    const cooldownMs = 12000 - (Number(state.settings.alarmSensitivity) - 1) * 1800;
    if (now - state.alertAt < cooldownMs) return;

    state.alertAt = now;
    beep(level);

    if (state.settings.vibration && navigator.vibrate) {
      navigator.vibrate(level === "danger" ? [160, 90, 160] : 130);
    }

    if (
      state.settings.desktopNotif &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification(
        level === "danger" ? "Jarak terlalu dekat" : "Jarak mulai dekat",
        { body: `Perkiraan jarak ${Math.round(distance)} cm` }
      );
    }
  }

  function updateDistance(distance) {
    if (!Number.isFinite(distance)) {
      ui.distanceValue.textContent = "--";
      ui.distanceHint.textContent = state.mqttConnected ? "Waiting for sensor data..." : "Disconnected";
      ui.confidenceValue.textContent = "0%";
      ui.faceStatus.textContent = "Sensor Inactive";
      ui.modeStatus.textContent = "Ready";
      setStatus("idle", "Waiting for IoT");
      return;
    }

    const rounded = Math.max(0, Math.round(distance));
    ui.distanceValue.textContent = String(rounded);
    ui.confidenceValue.textContent = "100%";
    ui.faceStatus.textContent = "Sensor Active";

    let statusText = "Safe";

    if (rounded >= state.settings.thresholdSafe) {
      setStatus("safe", "Safe");
      ui.distanceHint.textContent = "Safe distance";
      ui.modeStatus.textContent = "Safe";
      ui.distanceValue.style.color = "var(--success-text)"; // Perubahan warna angka
      statusText = "Safe";
    } else if (rounded >= state.settings.thresholdWarning) {
      setStatus("warn", "Warning");
      ui.distanceHint.textContent = "Getting close";
      ui.modeStatus.textContent = "Warning";
      ui.distanceValue.style.color = "var(--warn-text)";
      statusText = "Warning";
      notify("warning", rounded);
    } else {
      setStatus("danger", "Danger");
      ui.distanceHint.textContent = "Too close";
      ui.modeStatus.textContent = "Danger";
      ui.distanceValue.style.color = "var(--danger-text)";
      statusText = "Danger";
      notify("danger", rounded);
      if (ui.alarmOverlay && !state.alarmDismissed) ui.alarmOverlay.classList.remove("hidden");
    }

    if (rounded >= state.settings.thresholdWarning) {
      if (ui.alarmOverlay) ui.alarmOverlay.classList.add("hidden");
      state.alarmDismissed = false; // Reset dismiss flag when safe/warning
    }

    state.currentDistance = rounded;
    updatePip();

    // Calibration Logic
    if (state.isCalibrating && rounded > 0) {
      state.calibSamples.push(rounded);
      if (ui.btnStartCalibration) {
        ui.btnStartCalibration.textContent = `Taking Samples... (${state.calibSamples.length}/10)`;
      }
      if (state.calibSamples.length >= 10) {
        const avg = state.calibSamples.reduce((a, b) => a + b, 0) / 10;
        state.settings.thresholdSafe = Math.round(avg);
        state.settings.thresholdWarning = Math.round(avg * 0.75);
        state.settings.thresholdDanger = Math.round(avg * 0.58);
        saveSettings();
        state.isCalibrating = false;
        if (ui.btnStartCalibration) {
          ui.btnStartCalibration.textContent = "Calibration Successful";
          setTimeout(() => ui.btnStartCalibration.textContent = "Start Sensor Calibration", 3000);
        }
        alert(`Calibration Complete!\nIdeal Distance (Safe): >= ${state.settings.thresholdSafe} cm\nWarning: < ${state.settings.thresholdSafe} cm\nDanger: < ${state.settings.thresholdDanger} cm`);
      }
    }

    // --- LOGIKA PENGIRIMAN KE FIREBASE (THROTTLE 5 DETIK) ---
    const now = Date.now();
    // Inisialisasi variabel lastSync jika belum ada
    if (!state.lastFirebaseSync) state.lastFirebaseSync = 0; 
    
    // Cek apakah sudah lewat 5000ms (5 detik) sejak pengiriman terakhir
    if (now - state.lastFirebaseSync >= 5000) {
      if (typeof window.logDataToCloud === "function") {
        window.logDataToCloud(rounded, statusText);
        state.lastFirebaseSync = now; // Update waktu sinkronisasi terakhir
      }
    }
  }

  function connectMQTT() {
    if (state.mqttConnected || state.mqttClient) {
      console.log("MQTT already connected or connecting.");
      return;
    }

    const host = state.settings.mqttHost;
    const port = Number(state.settings.mqttPort) || 8884;
    const username = state.settings.mqttUser;
    const password = state.settings.mqttPass;

    if (!host) {
      setStatus("idle", "Config error");
      ui.distanceHint.textContent = "Fill Broker Host in Settings!";
      showDebugMessage("MQTT configuration incomplete. Connect host in Settings menu.");
      return;
    }

    setStatus("idle", "Connecting...");
    ui.mqttStatus.textContent = "Connecting...";
    ui.distanceHint.textContent = "Connecting to HiveMQ broker...";
    console.log(`Connecting to MQTT broker: wss://${host}:${port}/mqtt`);

    const clientId = "WebEyeMonitor_" + Math.random().toString(16).substring(2, 10);
    
    try {
      state.mqttClient = new Paho.MQTT.Client(host, port, "/mqtt", clientId);

      state.mqttClient.onConnectionLost = (responseObject) => {
        state.mqttConnected = false;
        state.mqttClient = null;
        console.warn("MQTT Connection Lost:", responseObject.errorMessage);
        showDebugMessage("MQTT Connection Lost: " + responseObject.errorMessage);
        setStatus("idle", "Disconnected");
        ui.mqttStatus.textContent = "Disconnected";
        ui.distanceHint.textContent = "Connection lost. Reconnect.";
        if (ui.connectMqttBtn) {
          ui.connectMqttBtn.textContent = "Connect to Sensor";
          ui.connectMqttBtn.style.backgroundColor = "";
        }
        updateDistance(null);
      };

      state.mqttClient.onMessageArrived = (message) => {
        const topic = message.destinationName;
        const payload = message.payloadString;
        console.log(`MQTT Received: [${topic}] ${payload}`);

        if (topic === "eye/distance") {
          const val = parseFloat(payload);
          if (!isNaN(val) && val >= 0) {
            updateDistance(val);
          }
        } else if (topic === "eye/status") {
          ui.modeStatus.textContent = payload;
        }
      };

      const options = {
        useSSL: true,
        timeout: 5,
        onSuccess: () => {
          state.mqttConnected = true;
          console.log("MQTT connected successfully.");
          setStatus("safe", "Connected IoT");
          ui.mqttStatus.textContent = "Connected";
          ui.distanceHint.textContent = "Receiving data from IoT ESP32...";
          if (ui.connectMqttBtn) {
            ui.connectMqttBtn.textContent = "Disconnect";
            ui.connectMqttBtn.style.backgroundColor = "var(--text-muted)";
          }
          
          state.mqttClient.subscribe("eye/distance");
          state.mqttClient.subscribe("eye/status");
        },
        onFailure: (err) => {
          state.mqttConnected = false;
          state.mqttClient = null;
          console.error("MQTT connection failed:", err);
          showDebugMessage("Failed to connect to HiveMQ: " + err.errorMessage);
          setStatus("danger", "Failed to connect");
          ui.mqttStatus.textContent = "Failed to connect";
          ui.distanceHint.textContent = "Failed to connect to broker.";
          if (ui.connectMqttBtn) {
            ui.connectMqttBtn.textContent = "Connect to Sensor";
            ui.connectMqttBtn.style.backgroundColor = "";
          }
          updateDistance(null);
        }
      };

      if (username && username.trim() !== "") {
        options.userName = username;
      }
      if (password && password.trim() !== "") {
        options.password = password;
      }

      state.mqttClient.connect(options);
    } catch (err) {
      console.error("Error creating MQTT client:", err);
      showDebugMessage("MQTT Client Error: " + err.message);
      setStatus("danger", "Error");
      ui.mqttStatus.textContent = "Error";
      state.mqttClient = null;
      updateDistance(null);
    }
  }

  function disconnectMQTT() {
    if (state.mqttClient) {
      try {
        if (state.mqttConnected) {
          state.mqttClient.disconnect();
        }
      } catch (err) {
        console.error("MQTT disconnect error:", err);
      }
      state.mqttClient = null;
      state.mqttConnected = false;
    }
    console.log("MQTT disconnected.");
    setStatus("idle", "Disconnected");
    ui.mqttStatus.textContent = "Disconnected";
    ui.distanceHint.textContent = "IoT connection disconnected.";
    if (ui.connectMqttBtn) {
      ui.connectMqttBtn.textContent = "Connect to Sensor";
      ui.connectMqttBtn.style.backgroundColor = "";
    }
    updateDistance(null);
  }

  function bindUi() {
    ui.openSettingsBtn = byId("openSettingsBtn");
    ui.closeConfigBtn = byId("closeConfigBtn");

    ui.statusBadge = byId("statusBadge");
    ui.distanceValue = byId("distanceValue");
    ui.distanceHint = byId("distanceHint");
    ui.confidenceValue = byId("confidenceValue");
    ui.faceStatus = byId("faceStatus");
    ui.modeStatus = byId("modeStatus");

    ui.mqttStatus = byId("mqttStatus");
    ui.browserStatus = byId("browserStatus");

    ui.configModal = byId("configModal");
    ui.settingsMessage = byId("settingsMessage");

    ui.themeToggle = byId("themeToggle");
    ui.alarmSound = byId("alarmSound");
    ui.desktopNotif = byId("desktopNotif");
    ui.vibration = byId("vibration");
    ui.alarmSensitivity = byId("alarmSensitivity");

    ui.resetSettings = byId("resetSettings");
    ui.saveSettings = byId("saveSettings");

    // MQTT & IoT elements
    ui.mqttHost = byId("mqttHost");
    ui.mqttPort = byId("mqttPort");
    ui.mqttUser = byId("mqttUser");
    ui.mqttPass = byId("mqttPass");
    ui.connectMqttBtn = byId("connectMqttBtn");
    ui.btnStartCalibration = byId("btnStartCalibration");

    // Dynamic Alarm Overlay (Floating Banner)
    ui.alarmOverlay = document.createElement("div");
    ui.alarmOverlay.className = "alarm-overlay hidden";
    ui.alarmOverlay.innerHTML = `
      <div style="background: var(--danger-text); padding: 16px 24px; border-radius: 12px; display: flex; align-items: center; gap: 16px; color: white; box-shadow: 0 10px 30px rgba(239, 68, 68, 0.5); border: 2px solid white; width: 100%; max-width: 500px;">
        <div style="font-size: 32px; animation: blink 1s infinite;">⚠️</div>
        <div style="text-align: left; flex-grow: 1;">
            <h3 style="margin: 0; font-size: 18px;">DANGER! Distance Too Close</h3>
            <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.9;">Please sit back and adjust your posture.</p>
        </div>
        <button id="closeAlarmBtn" style="background: none; border: none; color: white; font-size: 28px; cursor: pointer; padding: 0 8px; margin-left: auto; line-height: 1;">&times;</button>
      </div>
    `;
    document.body.appendChild(ui.alarmOverlay);

    const closeBtn = ui.alarmOverlay.querySelector("#closeAlarmBtn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        ui.alarmOverlay.classList.add("hidden");
        state.alarmDismissed = true;
      });
    }
  }

  function bindEvents() {
    ui.openSettingsBtn.addEventListener("click", () => {
      ui.configModal.classList.remove("hidden");
    });

    ui.closeConfigBtn.addEventListener("click", () => {
      ui.configModal.classList.add("hidden");
    });

    ui.saveSettings.addEventListener("click", () => {
      state.settings.alarmSound = ui.alarmSound.checked;
      state.settings.desktopNotif = ui.desktopNotif.checked;
      state.settings.vibration = ui.vibration.checked;
      state.settings.alarmSensitivity = clamp(Number(ui.alarmSensitivity.value) || 3, 1, 5);
      state.settings.darkMode = ui.themeToggle.checked;

      // Save MQTT Credentials
      if (ui.mqttHost) state.settings.mqttHost = ui.mqttHost.value;
      if (ui.mqttPort) state.settings.mqttPort = Number(ui.mqttPort.value) || 8884;
      if (ui.mqttUser) state.settings.mqttUser = ui.mqttUser.value;
      if (ui.mqttPass) state.settings.mqttPass = ui.mqttPass.value;

      saveSettings();
      syncForm();
      ui.settingsMessage.textContent = "Settings saved in browser";
      ui.configModal.classList.add("hidden");

      disconnectMQTT();
      connectMQTT();
    });

    ui.resetSettings.addEventListener("click", () => {
      state.settings = { ...DEFAULTS };
      saveSettings();
      syncForm();
      ui.settingsMessage.textContent = "Settings reset to default";
      
      disconnectMQTT();
      connectMQTT();
    });

    ui.themeToggle.addEventListener("change", () => {
      state.settings.darkMode = ui.themeToggle.checked;
      if (state.settings.darkMode) {
        document.body.classList.add("dark-mode");
      } else {
        document.body.classList.remove("dark-mode");
      }
    });

    ui.alarmSound.addEventListener("change", () => {
      state.settings.alarmSound = ui.alarmSound.checked;
    });
    ui.desktopNotif.addEventListener("change", () => {
      state.settings.desktopNotif = ui.desktopNotif.checked;
    });
    ui.vibration.addEventListener("change", () => {
      state.settings.vibration = ui.vibration.checked;
    });
    ui.alarmSensitivity.addEventListener("change", () => {
      state.settings.alarmSensitivity = clamp(Number(ui.alarmSensitivity.value) || 3, 1, 5);
    });

    if (ui.connectMqttBtn) {
      ui.connectMqttBtn.addEventListener("click", () => {
        if (state.mqttConnected) {
          disconnectMQTT();
          if (state.pipWindow) state.pipWindow.close();
        } else {
          ui.connectMqttBtn.textContent = "Connecting...";
          openPip(); // Call openPip FIRST to guarantee user gesture isn't consumed
          connectMQTT();
        }
      });
    }

    window.addEventListener("click", (event) => {
      if (event.target === ui.configModal) {
        ui.configModal.classList.add("hidden");
      }
    });

    if (ui.btnStartCalibration) {
      ui.btnStartCalibration.addEventListener("click", () => {
        if (!state.mqttConnected) {
          alert("Calibration failed: Sensor is not connected!");
          return;
        }
        state.isCalibrating = true;
        state.calibSamples = [];
        ui.btnStartCalibration.textContent = "Starting Calibration...";
      });
    }
  }

  function initBrowserStatus() {
    ui.browserStatus.textContent = "Ready (MQTT)";
  }

  async function openPip() {
    if (!('documentPictureInPicture' in window)) {
      alert("Your browser does not support the Document Picture-in-Picture API (Use Chrome/Edge Desktop 111+).");
      return;
    }
    try {
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 300,
        height: 200
      });
      pipWindow.document.body.innerHTML = `
        <div id="pipContainer" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; background: #fff; text-align: center; padding: 20px; transition: background 0.3s, color 0.3s;">
          <h3 style="margin: 0;">VisionR</h3>
          <h1 id="pipDistance" style="font-size: 48px; margin: 10px 0;">--</h1>
          <p id="pipStatus" style="font-weight: bold; font-size: 20px;">Waiting...</p>
        </div>
      `;
      state.pipWindow = pipWindow;
      pipWindow.addEventListener("pagehide", () => {
        state.pipWindow = null;
      });
      updatePip();
    } catch (err) {
      console.error(err);
      alert("Failed to open Mini Mode. Make sure no extension is blocking it.");
    }
  }

  function updatePip() {
    if (!state.pipWindow) return;
    const doc = state.pipWindow.document;
    const container = doc.getElementById("pipContainer");
    const distEl = doc.getElementById("pipDistance");
    const statEl = doc.getElementById("pipStatus");
    if (!container) return;

    distEl.textContent = state.currentDistance !== null ? state.currentDistance + " cm" : "--";
    
    if (state.currentDistance === null) {
       container.style.background = "#fff";
       container.style.color = "#000";
       statEl.textContent = "Waiting...";
    } else if (state.currentDistance < state.settings.thresholdDanger) {
       container.style.background = "#EF4444";
       container.style.color = "#fff";
       statEl.textContent = "DANGER!";
    } else if (state.currentDistance < state.settings.thresholdWarning) {
       container.style.background = "#F59E0B";
       container.style.color = "#fff";
       statEl.textContent = "WARNING";
    } else {
       container.style.background = "#22C55E";
       container.style.color = "#fff";
       statEl.textContent = "SAFE";
    }
  }

  function init() {
    bindUi();
    loadSettings();
    syncForm();
    bindEvents();
    initBrowserStatus();
    updateDistance(null);
  }

  document.addEventListener("DOMContentLoaded", () => {
    init();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('Service Worker Registered for Background Support'))
        .catch(err => console.error('Service Worker Registration Failed:', err));
    }
  });
})();
