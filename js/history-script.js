// Konfigurasi Firebase sudah ada di firebase-integration.js

const SAFE_THRESHOLD = 62; // Batas aman klinis (cm)

let historyChart = null; // Variabel penampung grafik
let rawDataStore = []; // Penampung data mentah untuk log

// 1. Fungsi Mengambil Data dari Cloud
function fetchHistoryData() {
    if (!window.currentUserId) {
        // If auth hasn't resolved yet, wait a bit
        setTimeout(fetchHistoryData, 500);
        return;
    }
    // Ambil 50 data terakhir berdasarkan waktu
    const historyRef = database.ref('users/' + window.currentUserId + '/history').orderByChild('timestamp').limitToLast(50);
    
    // Dengarkan perubahan data sekali (once) saat halaman dimuat
    historyRef.once('value', (snapshot) => {
        const data = [];
        snapshot.forEach((childSnapshot) => {
            const item = childSnapshot.val();
            
            // Konversi format waktu ms ke Jam:Menit:Detik
            const date = new Date(item.timestamp);
            const timeString = date.getHours().toString().padStart(2, '0') + ':' + 
                               date.getMinutes().toString().padStart(2, '0') + ':' +
                               date.getSeconds().toString().padStart(2, '0');
            
            data.push({ time: timeString, distance: item.distance, timestamp: item.timestamp });
        });

        rawDataStore = data;

        if (data.length > 0) {
            calculateAndRenderMetrics(data);
            renderChart(data);
        } else {
            document.getElementById('chartPlaceholder').textContent = "No history recorded yet. Connect the IoT device first.";
        }
    });
}

// 2. Fungsi Hitung MVD & SVI
function calculateAndRenderMetrics(data) {
    let totalDistance = 0;
    let violationCount = 0;

    data.forEach(item => {
        totalDistance += item.distance;
        if (item.distance < SAFE_THRESHOLD) {
            violationCount++;
        }
    });

    const mvd = totalDistance / data.length;
    const svi = (violationCount / data.length) * 100;

    document.getElementById("mvdValue").textContent = mvd.toFixed(1);
    document.getElementById("sviValue").textContent = Math.round(svi);
    const complianceElem = document.getElementById("complianceValue");
    if (complianceElem) {
        complianceElem.textContent = "1/4"; // Dummy kepatuhan sesi
    }
}

// 3. Fungsi Menggambar Grafik
function renderChart(data) {
    // Sembunyikan teks placeholder, tampilkan kanvas
    document.getElementById('chartPlaceholder').style.display = 'none';
    const ctx = document.getElementById('historyChart');
    ctx.style.display = 'block';

    const labels = data.map(item => item.time);
    const distances = data.map(item => item.distance);
    
    let thresholdWarning = 45;
    let thresholdDanger = 35;
    try {
        const saved = JSON.parse(localStorage.getItem("eye-monitoring-core"));
        if (saved) {
            if (saved.thresholdWarning) thresholdWarning = saved.thresholdWarning;
            if (saved.thresholdDanger) thresholdDanger = saved.thresholdDanger;
        }
    } catch(e) {}

    const pointColors = data.map(item => {
        if (item.distance < thresholdDanger) return '#EF4444';
        if (item.distance < thresholdWarning) return '#F59E0B';
        return '#22C55E';
    });

    // Hapus grafik lama jika halaman di-refresh tanpa reload
    if (historyChart) historyChart.destroy(); 

    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Eye Distance (cm)',
                data: distances,
                borderColor: '#6C5DD3', // Warna ungu dari UI kita
                backgroundColor: 'rgba(108, 93, 211, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: pointColors,
                pointBorderColor: pointColors,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4 // Membuat garisnya melengkung halus (spline)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 120, // Batas maksimal sumbu Y
                    grid: { color: '#F1F1F5' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
    
    // Tambahkan tombol Log jika belum ada
    if (!document.getElementById("viewLogBtn")) {
        const subtitle = document.getElementById("chartSubtitle");
        if (subtitle) {
            const btn = document.createElement("button");
            btn.id = "viewLogBtn";
            btn.className = "action-btn";
            btn.style.cssText = "padding: 6px 12px; font-size: 13px; margin-top: 8px; background-color: var(--primary);";
            btn.textContent = "View RAW Log Data";
            btn.onclick = showLogModal;
            subtitle.parentNode.appendChild(btn);

            const btnExport = document.createElement("button");
            btnExport.id = "exportCsvBtn";
            btnExport.className = "action-btn";
            btnExport.style.cssText = "padding: 6px 12px; font-size: 13px; margin-top: 8px; margin-left: 8px; background-color: var(--success-bg); color: var(--success-text);";
            btnExport.textContent = "Export CSV";
            btnExport.onclick = exportToCSV;
            subtitle.parentNode.appendChild(btnExport);
        }
    }
}

function createLogModal() {
    const modal = document.createElement('div');
    modal.id = 'logModal';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.5); z-index:9999; display:none; justify-content:center; align-items:center; padding: 20px;';
    
    const content = document.createElement('div');
    content.style.cssText = 'background:var(--bg-card); padding:24px; border-radius:16px; width:100%; max-width:600px; max-height:80vh; display:flex; flex-direction:column; box-shadow: var(--shadow-card);';
    
    const header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border-light); padding-bottom:12px;';
    header.innerHTML = '<h3 style="margin:0; color:var(--text-main);">Raw Data Log</h3><div style="display:flex; gap:12px; align-items:center;"><button id="modalExportCsvBtn" class="action-btn" style="margin-top:0; padding:6px 12px; font-size:13px; background-color: var(--success-bg); color: var(--success-text);">Export CSV</button><button id="closeLogBtn" style="background:none;border:none;font-size:28px;cursor:pointer;color:var(--text-main);">&times;</button></div>';
    
    const tableContainer = document.createElement('div');
    tableContainer.style.cssText = 'overflow-y:auto; flex-grow:1;';
    tableContainer.innerHTML = `
        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:14px;">
            <thead>
                <tr style="border-bottom:2px solid var(--border-light); color:var(--text-muted);">
                    <th style="padding:12px 8px;">Time</th>
                    <th style="padding:12px 8px;">Distance (cm)</th>
                    <th style="padding:12px 8px;">Status</th>
                </tr>
            </thead>
            <tbody id="logTableBody"></tbody>
        </table>
    `;
    
    content.appendChild(header);
    content.appendChild(tableContainer);
    modal.appendChild(content);
    document.body.appendChild(modal);

    document.getElementById('closeLogBtn').onclick = () => modal.style.display = 'none';
    document.getElementById('modalExportCsvBtn').onclick = exportToCSV;
    modal.onclick = (e) => { if(e.target === modal) modal.style.display = 'none'; };
}

function showLogModal() {
    if (!document.getElementById('logModal')) {
        createLogModal();
    }
    const tbody = document.getElementById('logTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    let thresholdWarning = 45;
    let thresholdDanger = 35;
    try {
        const saved = JSON.parse(localStorage.getItem("eye-monitoring-core"));
        if (saved) {
            if (saved.thresholdWarning) thresholdWarning = saved.thresholdWarning;
            if (saved.thresholdDanger) thresholdDanger = saved.thresholdDanger;
        }
    } catch(e) {}

    // Urutkan dari yang terbaru (reverse)
    [...rawDataStore].reverse().forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--border-light)';
        
        let status = "Safe";
        let color = "var(--success-text)";
        if (item.distance < thresholdDanger) { status = "Danger"; color = "var(--danger-text)"; }
        else if (item.distance < thresholdWarning) { status = "Warning"; color = "var(--warn-text)"; }

        tr.innerHTML = `
            <td style="padding:12px 8px; color:var(--text-main);">${item.time}</td>
            <td style="padding:12px 8px; font-weight:bold; color:var(--text-main);">${item.distance}</td>
            <td style="padding:12px 8px; color:${color}; font-weight:bold;">${status}</td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('logModal').style.display = 'flex';
}

function getThresholds() {
    const defaultThresholds = { warning: 45, danger: 35 };
    const savedString = localStorage.getItem("eye-monitoring-core");
    if (!savedString) {
        return defaultThresholds;
    }
    try {
        const saved = JSON.parse(savedString);
        return {
            warning: saved.thresholdWarning || defaultThresholds.warning,
            danger: saved.thresholdDanger || defaultThresholds.danger
        };
    } catch (e) {
        return defaultThresholds;
    }
}

function formatCSVRow(item, index, warning, danger) {
    const date = item.timestamp ? new Date(item.timestamp) : new Date();
    const fullDateString = formatFullDate(date);
    const status = getStatusString(item.distance, warning, danger);
    return `${index + 1},"${fullDateString}",${item.distance},"${status}"`;
}

function formatFullDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getStatusString(distance, warning, danger) {
    if (distance < danger) {
        return "Danger";
    }
    if (distance < warning) {
        return "Warning";
    }
    return "Safe";
}

function downloadCSV(csvRows) {
    const csvContent = "\ufeff" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `visionr_log_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportToCSV() {
    if (rawDataStore.length === 0) {
        alert("No data to export!");
        return;
    }
    
    let csvRows = [];
    csvRows.push("No,Date & Time,Distance (cm),Status");
    
    const thresholds = getThresholds();
    const thresholdWarning = thresholds.warning;
    const thresholdDanger = thresholds.danger;
    
    rawDataStore.forEach((item, index) => {
        const row = formatCSVRow(item, index, thresholdWarning, thresholdDanger);
        csvRows.push(row);
    });
    
    downloadCSV(csvRows);
}

// Eksekusi fungsi saat halaman dimuat
document.addEventListener("DOMContentLoaded", fetchHistoryData);