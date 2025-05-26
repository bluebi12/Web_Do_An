import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';

// Firebase config
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

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const HomeScreen = () => {
  const [sensorData, setSensorData] = useState({
    temperature: 0,
    humidity: 0,
    soilMoisture: 0,
    lightIntensity: 0,
    mode: 0, // Thêm mode vào sensor data
  });
  
  const [deviceState, setDeviceState] = useState({
    pump: false,
    light: false,
    spray: false,
    fan: false,
  });

  const [thresholds, setThresholds] = useState({
    temperature: 0,
    humidity: 0,
    soilMoisture: 0,
    lightIntensity: 0,
  });

  const [thresholdInputs, setThresholdInputs] = useState({
    temperature: '0',
    humidity: '0',
    soilMoisture: '0',
    lightIntensity: '0',
  });

  const [isUserChangingMode, setIsUserChangingMode] = useState(false);

  useEffect(() => {
    const espRef = ref(database, 'esp_guilen');
    const pcRef = ref(database, 'pc_guilen');
    const thresholdsRef = ref(database, 'thresholds');

    onValue(espRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSensorData(prev => ({
          ...prev,
          temperature: data.nhietdo,
          humidity: data.doam,
          soilMoisture: data.doamdat,
          lightIntensity: data.anhsang,
          mode: data.mode || 0, // Lấy mode từ Firebase
        }));
      }
    });

    onValue(pcRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDeviceState({
          pump: data.bom === 1,
          light: data.den === 1,
          spray: data.phunsuong === 1,
          fan: data.quat === 1,
        });
      }
    });

    onValue(thresholdsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setThresholds({
          temperature: data.temperature || 0,
          humidity: data.humidity || 0,
          soilMoisture: data.soilMoisture || 0,
          lightIntensity: data.lightIntensity || 0,
        });
        setThresholdInputs({
          temperature: String(data.temperature ?? 0),
          humidity: String(data.humidity ?? 0),
          soilMoisture: String(data.soilMoisture ?? 0),
          lightIntensity: String(data.lightIntensity ?? 0),
        });
      }
    });
  }, []);

  const handleDeviceToggle = (device: string, value: boolean) => {
    const deviceRef = ref(database, `pc_guilen/${device}`);
    set(deviceRef, value ? 1 : 0);
  };

  const handleThresholdChange = (threshold: string, value: string) => {
    let num = parseFloat(value);
    if (value === '' || isNaN(num)) {
      num = 0;
      setThresholdInputs(inputs => ({ ...inputs, [threshold]: '0' }));
    } else {
      setThresholdInputs(inputs => ({ ...inputs, [threshold]: value }));
    }
    const thresholdRef = ref(database, `thresholds/${threshold}`);
    set(thresholdRef, num);
  };

  // Xử lý chuyển chế độ Auto/Manual
  const handleModeToggle = (value: boolean) => {
    setIsUserChangingMode(true);
    const mode = value ? 1 : 0; // 1: Manual, 0: Auto
    console.log("Người dùng chuyển chế độ sang:", mode === 1 ? 'Manual' : 'Auto');
    
    const modeRef = ref(database, 'esp_guilen/mode');
    set(modeRef, mode)
      .catch((err) => {
        console.error('Lỗi khi cập nhật chế độ:', err);
      })
      .finally(() => {
        setIsUserChangingMode(false);
      });
  };

  const handleLogout = () => {
    router.replace('/screen/LoginScreen');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header + Logo + Title */}
      <View style={styles.headerContainer}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
        <Text style={styles.schoolName}>TRƯỜNG ĐẠI HỌC SƯ PHẠM KỸ THUẬT THÀNH PHỐ HỒ CHÍ MINH</Text>
        <Text style={styles.projectTitle}>ĐỒ ÁN TỐT NGHIỆP</Text>
        <Text style={styles.projectDesc}>SỬ DỤNG NĂNG LƯỢNG MẶT TRỜI KẾT HỢP IOT ĐỂ TƯỚI CÂY</Text>
      </View>

      {/* Nút chuyển chế độ Auto/Manual */}
      <View style={styles.modeContainer}>
        <Text style={styles.modeTitle}>Chế Độ Hoạt Động</Text>
        <View style={styles.modeSwitch}>
          <Text style={[styles.modeLabel, sensorData.mode === 0 && styles.activeModeLabel]}>AUTO</Text>
          <Switch
            value={sensorData.mode === 1}
            onValueChange={handleModeToggle}
            trackColor={{ false: '#4CAF50', true: '#FF9800' }}
            thumbColor={sensorData.mode === 1 ? '#FFF' : '#FFF'}
          />
          <Text style={[styles.modeLabel, sensorData.mode === 1 && styles.activeModeLabel]}>MANUAL</Text>
        </View>
        <Text style={styles.currentMode}>
          Hiện tại: {sensorData.mode === 1 ? 'MANUAL' : 'AUTO'}
        </Text>
      </View>

      {/* 2 khối: Hiển thị giá trị & Cài đặt ngưỡng */}
      <View style={styles.cardRow}>
        {/* Hiển thị giá trị */}
        <View style={styles.cardBlock}>
          <Text style={styles.blockTitle}>Hiển Thị Các Giá Trị</Text>
          <View style={styles.cardGrid}>
            <View style={styles.card}><Text style={styles.cardLabel}>🌡️ Nhiệt độ</Text><Text style={styles.cardValue}>{sensorData.temperature} °C</Text></View>
            <View style={styles.card}><Text style={styles.cardLabel}>💧 Độ ẩm không khí</Text><Text style={styles.cardValue}>{sensorData.humidity} %</Text></View>
            <View style={styles.card}><Text style={styles.cardLabel}>🌱 Độ ẩm đất</Text><Text style={styles.cardValue}>{sensorData.soilMoisture} %</Text></View>
            <View style={styles.card}><Text style={styles.cardLabel}>☀️ Cường độ ánh sáng</Text><Text style={styles.cardValue}>{sensorData.lightIntensity} lux</Text></View>
          </View>
        </View>
        {/* Cài đặt ngưỡng */}
        <View style={styles.cardBlock}>
          <Text style={styles.blockTitle}>Cài Đặt Các Ngưỡng</Text>
          <View style={styles.cardGrid}>
            <View style={styles.cardInput}><Text style={styles.cardLabel}>🌡️ Ngưỡng Nhiệt độ</Text><TextInput style={styles.input} value={thresholdInputs.temperature} keyboardType="numeric" onChangeText={text => handleThresholdChange('temperature', text)} placeholder="Nhập nhiệt độ" /></View>
            <View style={styles.cardInput}><Text style={styles.cardLabel}>💧 Ngưỡng Độ ẩm</Text><TextInput
              style={styles.input}
              value={thresholdInputs.humidity}
              keyboardType="numeric"
              onChangeText={text => handleThresholdChange('humidity', text)}
              placeholder="Nhập độ ẩm"
            /></View>
            <View style={styles.cardInput}><Text style={styles.cardLabel}>🌱 Ngưỡng Độ ẩm đất</Text><TextInput style={styles.input} value={thresholdInputs.soilMoisture} keyboardType="numeric" onChangeText={text => handleThresholdChange('soilMoisture', text)} placeholder="Nhập độ ẩm đất" /></View>
            <View style={styles.cardInput}><Text style={styles.cardLabel}>☀️ Ngưỡng Cường độ ánh sáng</Text><TextInput style={styles.input} value={thresholdInputs.lightIntensity} keyboardType="numeric" onChangeText={text => handleThresholdChange('lightIntensity', text)} placeholder="Nhập cường độ" /></View>
          </View>
        </View>
      </View>

      {/* Điều khiển thiết bị */}
      <Text style={styles.controlTitle}>Điều Khiển Thiết Bị</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: '100%' }}>
        <View style={styles.deviceControlRow}>
          <View style={styles.deviceCard}>
            <MaterialCommunityIcons name="water" size={36} color="#4CAF50" />
            <Text style={styles.deviceLabel}>Bơm Tưới</Text>
            <Switch 
              value={deviceState.pump} 
              onValueChange={value => handleDeviceToggle('bom', value)}
              disabled={sensorData.mode === 0} // Vô hiệu hóa khi ở chế độ Auto
            />
          </View>
          <View style={styles.deviceCard}>
            <MaterialCommunityIcons name="water-pump" size={36} color="#2196F3" />
            <Text style={styles.deviceLabel}>Bơm Phun</Text>
            <Switch 
              value={deviceState.spray} 
              onValueChange={value => handleDeviceToggle('phunsuong', value)}
              disabled={sensorData.mode === 0} // Vô hiệu hóa khi ở chế độ Auto
            />
          </View>
          <View style={styles.deviceCard}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={36} color="#FFEB3B" />
            <Text style={styles.deviceLabel}>Đèn</Text>
            <Switch 
              value={deviceState.light} 
              onValueChange={value => handleDeviceToggle('den', value)}
              disabled={sensorData.mode === 0} // Vô hiệu hóa khi ở chế độ Auto
            />
          </View>
          <View style={styles.deviceCard}>
            <MaterialCommunityIcons name="fan" size={36} color="#F44336" />
            <Text style={styles.deviceLabel}>Quạt</Text>
            <Switch 
              value={deviceState.fan} 
              onValueChange={value => handleDeviceToggle('quat', value)}
              disabled={sensorData.mode === 0} // Vô hiệu hóa khi ở chế độ Auto
            />
          </View>
        </View>
      </ScrollView>

      {/* Logout button */}
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 8,
    resizeMode: 'contain',
  },
  schoolName: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    color: '#003366',
  },
  projectTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#1a7f37',
    marginTop: 2,
    textAlign: 'center',
  },
  projectDesc: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#1a7f37',
    marginBottom: 2,
    textAlign: 'center',
  },
  // Styles cho phần chế độ Auto/Manual
  modeContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  modeTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#1a7f37',
    marginBottom: 12,
    textAlign: 'center',
  },
  modeSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 12,
    color: '#666',
  },
  activeModeLabel: {
    color: '#1a7f37',
  },
  currentMode: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  teacher: {
    fontSize: 13,
    color: '#333',
    marginBottom: 1,
  },
  student: {
    fontSize: 13,
    color: '#333',
    marginBottom: 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  cardBlock: {
    flex: 1,
    backgroundColor: '#e6f7e6',
    borderRadius: 16,
    padding: 10,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  blockTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 8,
    textAlign: 'center',
    color: '#1a7f37',
  },
  cardGrid: {
    flex: 1,
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 10,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  cardInput: {
    width: '100%',
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  cardLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  cardValue: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#1a7f37',
    textAlign: 'center',
    marginTop: 2,
  },
  input: {
    width: '100%',
    height: 44,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 15,
    backgroundColor: '#fff',
    marginTop: 2,
  },
  controlTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginVertical: 10,
    textAlign: 'center',
    color: '#1a7f37',
  },
  deviceControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    width: '100%',
    marginBottom: 10,
  },
  deviceCard: {
    flex: 1,
    minWidth: 90,
    maxWidth: 120,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deviceLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    marginVertical: 6,
    color: '#333',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2f95dc',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
});

export default HomeScreen;