import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const QiblahCompass = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [subscription, setSubscription] = useState(null);
  const [magnetometer, setMagnetometer] = useState(0);
  const [qibladir, setQibladir] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      // 1. Request Permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required for Qiblah direction.');
        return;
      }

      // 2. Get User Location & Calculate Qiblah
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const calculatedDir = calculateQibla(latitude, longitude);
      setQibladir(calculatedDir);

      // 3. Start Magnetometer
      _subscribe();
    })();

    return () => _unsubscribe();
  }, []);

  const _subscribe = () => {
    setSubscription(
      Magnetometer.addListener((data) => {
        let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
        if (angle < 0) angle += 360;
        setMagnetometer(angle);
      })
    );
  };

  const _unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  const calculateQibla = (lat, lng) => {
    const phiK = (21.4225 * Math.PI) / 180;
    const lambdaK = (39.8262 * Math.PI) / 180;
    const phi = (lat * Math.PI) / 180;
    const lambda = (lng * Math.PI) / 180;
    const psi = Math.atan2(
      Math.sin(lambdaK - lambda),
      Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda)
    );
    return (psi * 180) / Math.PI;
  };

  // The rotation of the compass needle
  // We subtract magnetometer (current heading) from the target qibla direction
  const rotation = qibladir - magnetometer;

  return (
    <View style={styles.container}>
      {/* Dynamic Header matching your Daily Chart */}
      <View style={[styles.header, { paddingTop: insets.top + 10, height: 70 + insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconLeft}>
          <Icon name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Qiblah Finder</Text>
        <View style={styles.headerIconRight} /> 
      </View>

      <View style={styles.content}>
        <Text style={styles.instruction}>Hold your phone flat for best accuracy</Text>
        
        <View style={styles.compassContainer}>
          {/* Main Compass Ring */}
          <View style={[styles.compassRing, { transform: [{ rotate: `${360 - magnetometer}deg` }] }]}>
             <Text style={[styles.cardinal, styles.north]}>N</Text>
             <Text style={[styles.cardinal, styles.east]}>E</Text>
             <Text style={[styles.cardinal, styles.south]}>S</Text>
             <Text style={[styles.cardinal, styles.west]}>W</Text>
          </View>

          {/* Qiblah Needle */}
          <View style={[styles.needleContainer, { transform: [{ rotate: `${rotation}deg` }] }]}>
            <Icon name="navigate" size={width * 0.4} color="#5CB390" />
            <Icon name="location" size={30} color="#E11D48" style={styles.kaabaIcon} />
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.qiblaText}>
            Qiblah is <Text style={styles.bold}>{Math.round(qibladir)}°</Text> from North
          </Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: '#5CB390',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', textAlign: 'center', flex: 1 },
  headerIconLeft: { width: 40, alignItems: 'flex-start' },
  headerIconRight: { width: 40 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  instruction: { fontSize: 14, color: '#6B7280', marginBottom: 40 },
  compassContainer: {
    width: width * 0.8,
    height: width * 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: width * 0.4,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardinal: { position: 'absolute', fontWeight: 'bold', color: '#9CA3AF' },
  north: { top: 10, color: '#E11D48' },
  east: { right: 10 },
  south: { bottom: 10 },
  west: { left: 10 },
  needleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  kaabaIcon: { position: 'absolute', top: -10 },
  infoCard: {
    marginTop: 60,
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  qiblaText: { fontSize: 16, color: '#374151' },
  bold: { fontWeight: 'bold', color: '#5CB390' },
  errorText: { color: '#E11D48', marginTop: 10, fontSize: 12 }
});

export default QiblahCompass;