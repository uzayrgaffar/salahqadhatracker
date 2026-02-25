import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, StatusBar, AppState, Alert } from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

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
  const [accuracy, setAccuracy] = useState(3);
  const [isAligned, setIsAligned] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [degreesToQibla, setDegreesToQibla] = useState(null);

  // Refs for values used inside async callbacks
  const isAlignedRef = useRef(false);
  const qiblaDirRef = useRef(0);
  const headingRef = useRef(0);
  // Accumulates rotation on the JS side so we never read rotation.value
  // back from the UI thread — that cross-thread read is what causes jitter
  const targetRotationRef = useRef(0);
  const animIntervalRef = useRef(null);
  const activeSubsRef = useRef({ heading: null, location: null });

  // Shared values for smooth animation
  const rotation = useSharedValue(0);
  const qiblaShared = useSharedValue(0);
  const alignmentAnim = useSharedValue(0);

  useEffect(() => {
    alignmentAnim.value = withTiming(isAligned ? 1 : 0, { duration: 300 });
  }, [isAligned]);

  const stopServices = () => {
    activeSubsRef.current.heading?.remove();
    activeSubsRef.current.location?.remove();
    activeSubsRef.current = { heading: null, location: null };
    clearInterval(animIntervalRef.current);
  };

  const startServices = async () => {
    stopServices();

    const { status } = await Location.getForegroundPermissionsAsync();

    if (status !== 'granted') {
      setHasPermission(false);
      Alert.alert(
        'Location Required',
        'Please enable location on the Profile page to use the Qiblah compass.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }

    setHasPermission(true);

    try {
      const locationSub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 5000 },
        (location) => {
          const newQibla = calculateQibla(location.coords.latitude, location.coords.longitude);
          qiblaDirRef.current = newQibla;
          qiblaShared.value = newQibla;
          setIsLoading(false);
        }
      );

      const headingSub = await Location.watchHeadingAsync((data) => {
        if (qiblaDirRef.current === 0) return;

        const heading = data.trueHeading !== -1 ? data.trueHeading : data.magHeading;
        setAccuracy(data.accuracy);

        // Compute shortest-arc delta from last known target and accumulate.
        // This stays entirely on the JS thread — no reading back from UI thread.
        let diff = heading - (targetRotationRef.current % 360);
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        targetRotationRef.current += diff;

        headingRef.current = heading;

        // Alignment logic
        const angleDiff = qiblaDirRef.current - heading;
        const normalizedDiff = Math.abs(
          angleDiff > 180 ? angleDiff - 360 : angleDiff < -180 ? angleDiff + 360 : angleDiff
        );

        setDegreesToQibla(
          Math.round(
            angleDiff > 180 ? angleDiff - 360 : angleDiff < -180 ? angleDiff + 360 : angleDiff
          )
        );

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

      activeSubsRef.current = { heading: headingSub, location: locationSub };

      // 60fps interval pushes the stable targetRotationRef value to the UI thread.
      // duration: 100 gives a small ease-in window so each frame glides into
      // the next rather than snapping — adjust between 50–150 to taste.
      animIntervalRef.current = setInterval(() => {
        if (qiblaDirRef.current === 0) return;
        rotation.value = withTiming(targetRotationRef.current, { duration: 200 });
      }, 16);

    } catch (err) {
      console.error('Error starting compass services:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (isMounted) await startServices();
    };

    init();

    const appStateSub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        startServices();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        stopServices();
      }
    });

    return () => {
      isMounted = false;
      stopServices();
      appStateSub.remove();
    };
  }, []);

  const animatedCompassStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-rotation.value}deg` }],
  }));

  const animatedKaabaStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${qiblaShared.value}deg` }],
  }));

  const animatedRingStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(alignmentAnim.value, [0, 1], ['#D1D5DB', '#5cb390']),
    borderWidth: withTiming(isAligned ? 4 : 2, { duration: 300 }),
    shadowOpacity: withTiming(isAligned ? 0.3 : 0.1, { duration: 300 }),
    transform: [{ scale: withSpring(isAligned ? 1.02 : 1) }],
  }));

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconLeft}>
            <Icon name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Qiblah Finder</Text>
          <View style={styles.headerIconRight} />
        </View>
      </View>
    );
  }

  if (hasPermission === null || isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconLeft}>
            <Icon name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Qiblah Finder</Text>
          <View style={styles.headerIconRight} />
        </View>
        <View style={styles.loadingContainer}>
          <Icon name="compass-outline" size={48} color="#9CA3AF" />
          <Text style={styles.loadingText}>Getting your location…</Text>
        </View>
      </View>
    );
  }

  const renderReadout = () => {
    if (degreesToQibla === null || isAligned) return null;
    const dir = degreesToQibla > 0 ? 'Turn right' : 'Turn left';
    return (
      <View style={styles.readoutBox}>
        <Text style={styles.readoutSub}>{dir}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconLeft}>
          <Icon name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Qiblah Finder</Text>
        <View style={styles.headerIconRight} />
      </View>

      <View style={styles.content}>
        {accuracy < 3 && (
          <View style={styles.warningBox}>
            <Icon name="sync" size={14} color="#B45309" />
            <Text style={styles.warningText}>Calibrating sensors…</Text>
          </View>
        )}

        <View style={styles.compassWrapper}>
          <View style={styles.fixedArrowContainer}>
            <Icon name="caret-up" size={42} color={isAligned ? '#5cb390' : '#374151'} />
          </View>

          <Animated.View style={[styles.rotatingWorld, animatedCompassStyle]}>
            <Animated.View style={[styles.compassRing, animatedRingStyle]}>
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
                      height: i % 18 === 0 ? 15 : i % 6 === 0 ? 10 : 5,
                      opacity: i % 6 === 0 ? 0.8 : 0.2,
                    },
                  ]}
                />
              ))}
            </Animated.View>

            <Animated.View style={[styles.kaabaPositioner, animatedKaabaStyle]} pointerEvents="none">
              <View style={styles.kaabaIndicator}>
                <View style={styles.kaabaIconBg}>
                  <Icon name="location" size={24} color="#FFF" />
                </View>
                <Text style={styles.kaabaLabel}>MAKKAH</Text>
              </View>
            </Animated.View>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <View style={[styles.statusBadge, isAligned && styles.statusBadgeActive]}>
            <Text style={[styles.statusText, isAligned && styles.statusTextActive]}>
              {isAligned ? 'YOU ARE FACING THE QIBLAH' : 'ROTATE TO ALIGN'}
            </Text>
          </View>

          {renderReadout()}

          <Text style={styles.footerInstruction}>
            Point the top of your phone towards the{' '}
            <Text style={{ color: '#5cb390', fontWeight: '700' }}>Makkah</Text> icon
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    backgroundColor: '#5CB390',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    flex: 1,
    letterSpacing: 0.5,
  },
  headerIconLeft: { width: 40 },
  headerIconRight: { width: 40 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 15, color: '#9CA3AF', fontWeight: '500' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    position: 'absolute',
    top: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningText: { color: '#B45309', marginLeft: 6, fontSize: 13, fontWeight: '600' },
  compassWrapper: {
    width: width * 0.85,
    height: width * 0.85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedArrowContainer: { position: 'absolute', top: -45, zIndex: 10 },
  rotatingWorld: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  compassRing: {
    width: '100%',
    height: '100%',
    borderRadius: width,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  cardinal: { position: 'absolute', fontWeight: '800', fontSize: 18, color: '#9CA3AF' },
  north: { top: 25, color: '#EF4444' },
  east: { right: 25 },
  south: { bottom: 25 },
  west: { left: 25 },
  tick: { position: 'absolute', top: 0, width: 2, backgroundColor: '#374151' },
  kaabaPositioner: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  kaabaIndicator: { marginTop: -15, alignItems: 'center' },
  kaabaIconBg: {
    backgroundColor: '#EF4444',
    padding: 6,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  kaabaLabel: { fontSize: 10, fontWeight: '800', color: '#EF4444', marginTop: 4, letterSpacing: 1 },
  footer: { marginTop: 60, alignItems: 'center', width: '100%', gap: 12 },
  statusBadge: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  statusBadgeActive: { backgroundColor: '#D1FAE5' },
  statusText: { color: '#6B7280', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  statusTextActive: { color: '#5cb390' },
  readoutBox: { alignItems: 'center' },
  readoutSub: { fontSize: 15, color: '#374151', fontWeight: '700', letterSpacing: 0.5 },
  footerInstruction: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
    width: '70%',
    lineHeight: 20,
  },
});

export default QiblahCompass;