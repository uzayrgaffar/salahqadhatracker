import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const calculateQibla = (lat, lng) => {
  const phiK = (21.4225 * Math.PI) / 180;
  const lambdaK = (39.8262 * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  const lambda = (lng * Math.PI) / 180;
  const psi = Math.atan2(
    Math.sin(lambdaK - lambda),
    Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda)
  );
  let result = (psi * 180) / Math.PI;
  return result < 0 ? result + 360 : result;
};

const QiblahCompass = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  
  const [qiblaDir, setQiblaDir] = useState(0);
  const [accuracy, setAccuracy] = useState(3);
  const [isAligned, setIsAligned] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);

  const isAlignedRef = useRef(false);
  const qiblaDirRef = useRef(0);
  const rotation = useSharedValue(0);

  const checkPermissions = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    setHasPermission(status === 'granted');
    return status === 'granted';
  };

  useEffect(() => {
    let headingSub;
    let locationSub;

    (async () => {
      const granted = await checkPermissions();
      if (!granted) return;

      locationSub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 5000, 
        },
        (location) => {
          const newQibla = calculateQibla(
            location.coords.latitude,
            location.coords.longitude
          );
          setQiblaDir(newQibla);
          qiblaDirRef.current = newQibla; 
        }
      );

      headingSub = await Location.watchHeadingAsync((data) => {
        if (qiblaDirRef.current === 0) return;

        const heading = data.trueHeading !== -1 ? data.trueHeading : data.magHeading;
        setAccuracy(data.accuracy);

        let diff = heading - (rotation.value % 360);
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;

        rotation.value = withSpring(rotation.value + diff, {
          damping: 12,
          stiffness: 150,
          mass: 0.5,
        });

        const angleDiff = Math.abs(qiblaDirRef.current - heading);
        const normalizedDiff = angleDiff > 180 ? 360 - angleDiff : angleDiff;

        if (normalizedDiff < 3) {
          if (!isAlignedRef.current) {
            isAlignedRef.current = true;
            setIsAligned(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        } else if (normalizedDiff > 6) {
          if (isAlignedRef.current) {
            isAlignedRef.current = false;
            setIsAligned(false);
          }
        }
      });
    })();

    return () => {
      headingSub?.remove();
      locationSub?.remove();
    };
  }, []);

  const animatedCompassStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-rotation.value}deg` }],
  }));

  const animatedKaabaStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${qiblaDir}deg` }], 
  }));

  if (hasPermission === false) {
    return (
      <View style={[styles.container, styles.center]}>
        <View style={styles.permissionBox}>
            <Icon name="location-outline" size={64} color="#5CB390" />
            <Text style={styles.permissionTitle}>Location Required</Text>
            <Text style={styles.permissionText}>
                We need your location to calculate the Qiblah direction from where you are.
            </Text>
            <TouchableOpacity 
                style={styles.permissionButton} 
                onPress={() => Platform.OS === 'ios' ? Linking.openURL('app-settings:') : Linking.openSettings()}
            >
                <Text style={styles.permissionButtonText}>Enable in Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                <Text style={{ color: '#6B7280' }}>Go Back</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconLeft}>
          <Icon name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Qiblah Finder</Text>
        <View style={styles.headerIconRight} />
      </View>

      <View style={styles.content}>
        {accuracy < 3 && (
          <View style={styles.warningBox}>
            <Icon name="warning-outline" size={16} color="#B45309" />
            <Text style={styles.warningText}>
              Calibrate: Move phone in a ∞ pattern
            </Text>
          </View>
        )}

        <View style={styles.compassWrapper}>
          <View style={styles.fixedArrowContainer}>
            <Icon name="caret-up" size={36} color={isAligned ? '#10B981' : '#6B7280'} />
          </View>

          <Animated.View style={[styles.rotatingWorld, animatedCompassStyle]}>
            <View style={styles.compassRing}>
              <Text style={[styles.cardinal, styles.north]}>N</Text>
              <Text style={[styles.cardinal, styles.east]}>E</Text>
              <Text style={[styles.cardinal, styles.south]}>S</Text>
              <Text style={[styles.cardinal, styles.west]}>W</Text>

              {[...Array(72)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.tick,
                    {
                      transform: [{ rotate: `${i * 5}deg` }],
                      height: i % 6 === 0 ? 12 : 6,
                      opacity: i % 6 === 0 ? 0.7 : 0.3,
                    },
                  ]}
                />
              ))}
            </View>

            <Animated.View
                style={[styles.kaabaPositioner, animatedKaabaStyle]}
                pointerEvents="none"
            >
                <View style={styles.kaabaIndicator}>
                <Icon name="location" size={28} color="#E11D48" />
                <Text style={styles.kaabaLabel}>MAKKAH</Text>
                </View>
            </Animated.View>

          </Animated.View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Rotate your device until the{' '}
            <Text style={styles.bold}>Green Arrow</Text> meets{' '}
            <Text style={styles.boldRed}>Makkah</Text>
          </Text>
          {isAligned && (
            <Text style={styles.successText}>✓ Facing Qiblah</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#5CB390',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    flex: 1,
  },
  headerIconLeft: {
    width: 40,
  },
  headerIconRight: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 30,
    position: 'absolute',
    top: 30,
    alignItems: 'center',
    zIndex: 50,
  },
  warningText: {
    color: '#B45309',
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  compassWrapper: {
    width: width * 0.88,
    height: width * 0.88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedArrowContainer: {
    position: 'absolute',
    top: -35,
    zIndex: 10,
  },
  rotatingWorld: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassRing: {
    width: '100%',
    height: '100%',
    borderRadius: width,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  alignedRing: {
    borderColor: '#10B981',
    borderWidth: 2.5,
  },
  cardinal: {
    position: 'absolute',
    fontWeight: '900',
    fontSize: 20,
    color: '#1F2937',
  },
  north: { top: 20, color: '#E11D48' },
  east: { right: 20 },
  south: { bottom: 20 },
  west: { left: 20 },
  tick: {
    position: 'absolute',
    top: 0,
    width: 1.5,
    backgroundColor: '#1F2937',
  },
  kaabaPositioner: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  kaabaIndicator: {
    marginTop: -4,
    alignItems: 'center',
  },
  kaabaLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#E11D48',
    marginTop: -2,
  },
  footer: {
    marginTop: 80,
    paddingHorizontal: 50,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  bold: {
    color: '#5CB390',
    fontWeight: '700',
  },
  boldRed: {
    color: '#E11D48',
    fontWeight: '700',
  },
  successText: {
    color: '#10B981',
    fontWeight: 'bold',
    marginTop: 12,
    fontSize: 18,
    letterSpacing: 0.5,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionBox: {
    width: '80%',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFF',
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
  },
  permissionText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 10,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: '#5CB390',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginTop: 25,
    width: '100%',
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default QiblahCompass;