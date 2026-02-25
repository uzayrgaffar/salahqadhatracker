import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, AppState, Alert } from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolateColor } from 'react-native-reanimated';
import KaabaSvg from '../assets/kaaba.svg';

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


const StarDivider = ({ color = '#5cb390' }) => (
  <View style={decor.row}>
    <View style={[decor.line, { backgroundColor: color }]} />
    <Text style={[decor.star, { color: color }]}>✦</Text>
    <View style={[decor.line, { backgroundColor: color }]} />
  </View>
);

const decor = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', width: '60%', marginVertical: 2 },
  line: { flex: 1, height: 1, backgroundColor: '#5cb390', opacity: 0.5 },
  star: { color: '#5cb390', fontSize: 10, marginHorizontal: 8 },
});

const QiblahCompass = ({ navigation }) => {
  const [accuracy, setAccuracy] = useState(3);
  const [isAligned, setIsAligned] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [degreesToQibla, setDegreesToQibla] = useState(null);

  const isAlignedRef    = useRef(false);
  const qiblaDirRef     = useRef(0);
  const headingRef      = useRef(0);
  const targetRotationRef = useRef(0);
  const animIntervalRef = useRef(null);
  const activeSubsRef   = useRef({ heading: null, location: null });

  const rotation     = useSharedValue(0);
  const qiblaShared  = useSharedValue(0);
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

        let diff = heading - (targetRotationRef.current % 360);
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        targetRotationRef.current += diff;

        headingRef.current = heading;

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
    const init = async () => { if (isMounted) await startServices(); };
    init();

    const appStateSub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') startServices();
      else if (nextAppState === 'background' || nextAppState === 'inactive') stopServices();
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
    borderColor: interpolateColor(alignmentAnim.value, [0, 1], ['#B8DDD0', '#5cb390']),
    borderWidth: withTiming(isAligned ? 3 : 1.5, { duration: 300 }),
    shadowOpacity: withTiming(isAligned ? 0.6 : 0.15, { duration: 300 }),
    transform: [{ scale: withSpring(isAligned ? 1.02 : 1) }],
  }));

  const Header = () => (
    <View style={[styles.header]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconLeft}>
        <Icon name="chevron-back" size={26} color='#FFFFFF' />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Qiblah Compass</Text>
      </View>
      <View style={styles.headerIconRight} />
    </View>
  );

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <KaabaSvg height={100} width={100} />
          <StarDivider />
          <Text style={styles.loadingText}>Location Denied</Text>
        </View>
      </View>
    );
  }

  if (hasPermission === null || isLoading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.content}>
          <KaabaSvg height={100} width={100} />
          <StarDivider />
          <Text style={styles.loadingText}>Locating your position…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.content}>
        {accuracy < 3 && (
          <View style={styles.warningBox}>
            <Icon name="sync" size={13} color='#5cb390' />
            <Text style={styles.warningText}>Calibrating sensors…</Text>
          </View>
        )}

        <View style={styles.compassWrapper}>

          <View style={styles.pointerContainer}>
            <View style={[styles.pointerArrow, isAligned && styles.pointerArrowAligned]} />
          </View>

          <Animated.View style={[styles.rotatingWorld, animatedCompassStyle]}>
            <Animated.View style={[styles.compassRing, animatedRingStyle]}>

              <Text style={[styles.cardinal, styles.cN]}>N</Text>
              <Text style={[styles.cardinal, styles.cE]}>E</Text>
              <Text style={[styles.cardinal, styles.cS]}>S</Text>
              <Text style={[styles.cardinal, styles.cW]}>W</Text>

              <View style={styles.innerCircle} />
            </Animated.View>

            <Animated.View style={[styles.kaabaPositioner, animatedKaabaStyle]} pointerEvents="none">
              <View style={styles.kaabaIndicator}>
                <KaabaSvg height={48} width={48} />
              </View>
            </Animated.View>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <StarDivider />

          <View style={[styles.statusBadge, isAligned && styles.statusBadgeActive]}>
            {isAligned && <Text style={styles.statusIcon}>✦  </Text>}
            <Text style={[styles.statusText, isAligned && styles.statusTextActive]}>
              <Text style={[styles.statusText, isAligned && styles.statusTextActive]}>
                {isAligned ? 'FACING QIBLAH' : degreesToQibla === null ? 'ROTATE TO ALIGN' : degreesToQibla > 0 ? 'TURN RIGHT →' : '← TURN LEFT'}
              </Text>
            </Text>
            {isAligned && <Text style={styles.statusIcon}>  ✦</Text>}
          </View>

          <Text style={styles.footerInstruction}>
            Align the arrow with the{' '}
            <Text style={styles.footerHighlight}>Kaaba</Text> icon
          </Text>

          <StarDivider />
        </View>
      </View>
    </View>
  );
};

const COMPASS_SIZE = width * 0.85;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5cb390',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#5cb390',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerIconLeft:  { 
    width: 64,
    paddingVertical: 5,
  },
  headerIconRight: { 
    width: 64 
  },
  loadingText: {
    fontSize: 14,
    color: '#5cb390',
    fontWeight: '500',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    position: 'absolute',
    top: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5cb390',
  },
  warningText: {
    color: '#5cb390',
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  compassWrapper: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointerContainer: {
    position: 'absolute',
    top: -28,
    zIndex: 10,
    alignItems: 'center',
  },
  pointerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 22,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#5cb390',
  },
  pointerArrowAligned: {
    borderBottomColor: '#5cb390',
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
    borderRadius: COMPASS_SIZE / 2,
    backgroundColor: '#F0F7F4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5cb390',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 12,
  },
  innerCircle: {
    position: 'absolute',
    width: COMPASS_SIZE * 0.62,
    height: COMPASS_SIZE * 0.62,
    borderRadius: COMPASS_SIZE,
    borderWidth: 1,
    borderColor: '#B8DDD0',
    backgroundColor: '#F0F7F4',
  },
  cardinal: {
    position: 'absolute',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 1,
  },
  cN: { top: 22,    color: '#5cb390' },
  cE: { right: 22,  color: '#5cb390' },
  cS: { bottom: 22, color: '#5cb390' },
  cW: { left: 22,   color: '#5cb390' },
  kaabaPositioner: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  kaabaIndicator: {
    marginTop: 9,
    alignItems: 'center',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF4EF',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#B8DDD0',
  },
  statusBadgeActive: {
    backgroundColor: '#5cb390',
    borderColor: '#3D8A6B',
  },
  statusIcon: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  statusText: {
    color: '#5cb390',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 2,
  },
  statusTextActive: {
    color: '#FFFFFF',
  },
  readoutBox: {
    alignItems: 'center',
  },
  readoutText: {
    fontSize: 14,
    color: '#C9A84C',
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  footerInstruction: {
    textAlign: 'center',
    fontSize: 13,
    color: '#6B9E87',
    width: '65%',
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  footerHighlight: {
    color: '#C9A84C',
    fontWeight: '700',
  },
});

export default QiblahCompass;