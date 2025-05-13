import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getDatabase, ref, onValue, set } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js';

// Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyARDVp4S1gCqthn3VYpKTQJv--Sl_xaqD8",
  authDomain: "fir-project-esp32.firebaseapp.com",
  databaseURL: "https://fir-project-esp32-default-rtdb.firebaseio.com",
  projectId: "fir-project-esp32",
  storageBucket: "fir-project-esp32.firebasestorage.app",
  messagingSenderId: "656047656204",
  appId: "1:656047656204:web:0bde420be3a1f5d8dfcd29",
  measurementId: "G-RZR300WEJ2"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Hàm cập nhật dữ liệu cảm biến lên giao diện
function updateSensorData() {
  const espRef = ref(database, 'esp_guilen');
  onValue(espRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      // Cập nhật dữ liệu cảm biến
      document.getElementById('temperature').innerText = `${data.nhietdo} °C`;
      document.getElementById('humidity').innerText = `${data.doam} %`;
      document.getElementById('soilMoisture').innerText = `${data.doamdat} %`;
      document.getElementById('lightIntensity').innerText = `${data.anhsang} lux`;

      // Cập nhật trạng thái chế độ Auto/Manual
      const modeSwitch = document.getElementById('modeSwitch');
      if (modeSwitch) {
        modeSwitch.checked = data.mode === 1;  // Nếu chế độ là 1 thì bật Manual (Bằng tay)
      }
      const modeLabel = document.getElementById('modeLabel');
      if (modeLabel) {
        modeLabel.innerText = data.mode === 1 ? 'Manual' : 'Auto';  // Cập nhật nhãn chế độ
      }
    }
  });

  const pcRef = ref(database, 'pc_guilen');
  onValue(pcRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      // Cập nhật trạng thái của các thiết bị (bơm, đèn, phun sương, quạt)
      document.getElementById('togglePump').checked = data.bom === 1;
      document.getElementById('toggleLight').checked = data.den === 1;
      document.getElementById('toggleSpray').checked = data.phunsuong === 1;
      document.getElementById('toggleFan').checked = data.quat === 1;
    }
  });
}

// Hàm điều khiển thiết bị (Gửi dữ liệu lên Firebase)
function setupDeviceControl() {
  document.getElementById('togglePump').addEventListener('change', function() {
    set(ref(database, 'pc_guilen/bom'), this.checked ? 1 : 0);
  });
  document.getElementById('toggleLight').addEventListener('change', function() {
    set(ref(database, 'pc_guilen/den'), this.checked ? 1 : 0);
  });
  document.getElementById('toggleSpray').addEventListener('change', function() {
    set(ref(database, 'pc_guilen/phunsuong'), this.checked ? 1 : 0);
  });
  document.getElementById('toggleFan').addEventListener('change', function() { 
    set(ref(database, 'pc_guilen/quat'), this.checked ? 1 : 0);
  });
}

// Hàm cập nhật ngưỡng cài đặt lên Firebase và hiển thị trên giao diện
function setupThresholdInputs() {
  document.getElementById('setTemperature').addEventListener('change', function() {
    const value = this.value;
    set(ref(database, 'thresholds/temperature'), value);
    document.getElementById('temperatureThreshold').innerText = `${value} °C`;
  });

  document.getElementById('setHumidity').addEventListener('change', function() {
    const value = this.value;
    set(ref(database, 'thresholds/humidity'), value);
    document.getElementById('humidityThreshold').innerText = `${value} %`;
  });

  document.getElementById('setSoilMoisture').addEventListener('change', function() {
    const value = this.value;
    set(ref(database, 'thresholds/soilMoisture'), value);
    document.getElementById('soilMoistureThreshold').innerText = `${value} %`;
  });

  document.getElementById('setLightIntensity').addEventListener('change', function() {
    const value = this.value;
    set(ref(database, 'thresholds/lightIntensity'), value);
    document.getElementById('lightIntensityThreshold').innerText = `${value} lux`;
  });
}

// Hàm điều khiển chế độ Auto / Manual
function setupModeSwitch() {
  document.getElementById('modeSwitch').addEventListener('change', function () {
    set(ref(database, 'esp_guilen/mode'), this.checked ? 1 : 0);  // 1 cho Manual, 0 cho Auto
  });
}

// Khởi động các hàm khi tải trang
window.onload = function() {
  updateSensorData();
  setupDeviceControl();
  setupThresholdInputs();
  setupModeSwitch();
};
