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

// Biến toàn cục lưu dữ liệu
let currentMode = 0; // Auto mặc định
let sensorData = null;
let pcData = null;
let thresholds = {};

// Cập nhật trạng thái thiết bị 
function updateDeviceSwitches() {
  if (!sensorData || !thresholds) return;

  const deviceIds = ['togglePump', 'toggleSpray', 'toggleLight', 'toggleFan'];

  deviceIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    if (currentMode === 1) {
      // Manual: trạng thái lấy từ pcData
      if (pcData) {
        const statusMap = {
          'togglePump': pcData.bom,
          'toggleSpray': pcData.phunsuong,
          'toggleLight': pcData.den,
          'toggleFan': pcData.quat
        };
        el.checked = statusMap[id] === 1;
      }
      el.disabled = false;
    } else {
      // Auto: trạng thái dựa trên ngưỡng cảm biến
      let shouldBeOn = false;
      switch(id) {
        case 'togglePump':
          // Bật khi độ ẩm đất thấp hơn ngưỡng
          shouldBeOn = sensorData.doamdat < thresholds.soilMoisture;
          break;
        case 'toggleSpray':
          // Bật khi độ ẩm không khí thấp hơn ngưỡng (humidity)
          shouldBeOn = sensorData.doam < thresholds.humidity;
          break;
        case 'toggleLight':
          // Bật khi ánh sáng thấp hơn ngưỡng
          shouldBeOn = sensorData.anhsang < thresholds.lightIntensity;
          break;
        case 'toggleFan':
          // Bật khi nhiệt độ cao hơn ngưỡng
          shouldBeOn = sensorData.nhietdo > thresholds.temperature;
          break;
      }
      el.checked = shouldBeOn;
      el.disabled = true; // Auto thì disable nút gạt
    }
  });
}

// Cập nhật giao diện dữ liệu cảm biến, ngưỡng và trạng thái thiết bị
function updateSensorData() {
  const espRef = ref(database, 'esp_guilen');
  const pcRef = ref(database, 'pc_guilen');

  onValue(espRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    sensorData = data;
    currentMode = data.mode || 0;
    
    // Cập nhật hiển thị cảm biến
    document.getElementById('temperature').innerText = `${data.nhietdo} °C`;
    document.getElementById('humidity').innerText = `${data.doam} %`;
    document.getElementById('soilMoisture').innerText = `${data.doamdat} %`;
    document.getElementById('lightIntensity').innerText = `${data.anhsang} lux`;

    // Cập nhật switch chế độ
    const modeSwitch = document.getElementById('modeSwitch');
    if (modeSwitch && !modeSwitch.hasAttribute('data-user-changing')) {
      modeSwitch.checked = currentMode === 1;
    }

    updateDeviceSwitches();
  });

  onValue(pcRef, (snapshot) => {
    pcData = snapshot.val();
    updateDeviceSwitches();
  });
}

// Lấy dữ liệu thresholds cập nhật lên web
function updateThresholds() {
  const keys = ['temperature', 'humidity', 'soilMoisture', 'lightIntensity'];
  keys.forEach(key => {
    onValue(ref(database, `thresholds/${key}`), (snapshot) => {
      const value = snapshot.val();
      if (value !== null) {
        thresholds[key] = value;

        // Cập nhật hiển thị giá trị cài đặt
        const labelMap = {
          temperature: 'temperatureThreshold',
          humidity: 'humidityThreshold',
          soilMoisture: 'soilMoistureThreshold',
          lightIntensity: 'lightIntensityThreshold'
        };
        const inputMap = {
          temperature: 'setTemperature',
          humidity: 'setHumidity',
          soilMoisture: 'setSoilMoisture',
          lightIntensity: 'setLightIntensity'
        };
        if (document.getElementById(labelMap[key])) {
          let unit = '';
          if (key === 'temperature') unit = ' °C';
          if (key === 'humidity' || key === 'soilMoisture') unit = ' %';
          if (key === 'lightIntensity') unit = ' lux';

          document.getElementById(labelMap[key]).innerText = value + unit;
        }
        if (document.getElementById(inputMap[key])) {
          document.getElementById(inputMap[key]).value = value;
        }

        // Cập nhật lại trạng thái nút gạt khi thresholds thay đổi
        updateDeviceSwitches();
      }
    });
  });
}
// Điều khiển thiết bị
function setupDeviceControl() {
  document.getElementById('togglePump').addEventListener('change', function () {
    set(ref(database, 'pc_guilen/bom'), this.checked ? 1 : 0);
  });
  document.getElementById('toggleLight').addEventListener('change', function () {
    set(ref(database, 'pc_guilen/den'), this.checked ? 1 : 0);
  });
  document.getElementById('toggleSpray').addEventListener('change', function () {
    set(ref(database, 'pc_guilen/phunsuong'), this.checked ? 1 : 0);
  });
  document.getElementById('toggleFan').addEventListener('change', function () {
    set(ref(database, 'pc_guilen/quat'), this.checked ? 1 : 0);
  });
}
// Cài đặt giá trị ngưỡng cảm biến
function setupThresholdInputs() {
  document.getElementById('setTemperature').addEventListener('change', function () {
    const value = parseFloat(this.value);
    set(ref(database, 'thresholds/temperature'), value);
  });

  document.getElementById('setHumidity').addEventListener('change', function () {
    const value = parseFloat(this.value);
    set(ref(database, 'thresholds/humidity'), value);
  });

  document.getElementById('setSoilMoisture').addEventListener('change', function () {
    const value = parseFloat(this.value);
    set(ref(database, 'thresholds/soilMoisture'), value);
  });

  document.getElementById('setLightIntensity').addEventListener('change', function () {
    const value = parseFloat(this.value);
    set(ref(database, 'thresholds/lightIntensity'), value);
  });
}
// Cài đặt chuyển chế độ Manual / Auto
function setupModeSwitch() {
  const switchElem = document.getElementById('modeSwitch');
  if (!switchElem) return;

  switchElem.addEventListener('change', function () {
    switchElem.setAttribute('data-user-changing', 'true');
    const mode = this.checked ? 1 : 0; // 1: Manual, 0: Auto
    console.log("Người dùng chuyển chế độ sang:", mode === 1 ? 'Manual' : 'Auto');

    set(ref(database, 'esp_guilen/mode'), mode)
      .catch((err) => {
        console.error('Lỗi khi cập nhật chế độ:', err);
      })
      .finally(() => {
        switchElem.removeAttribute('data-user-changing');
      });
  });
}
// Hàm chạy khi tải trang
window.onload = function () {
  updateSensorData();
  setupDeviceControl();
  setupThresholdInputs();
  updateThresholds();
  setupModeSwitch();
};
