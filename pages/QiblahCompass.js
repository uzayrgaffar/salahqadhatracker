import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, StatusBar, AppState, Alert } from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Rect, Polygon, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolateColor } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const C = {
  bg: '#F0F7F4',
  surface: '#FFFFFF',
  border: '#B8DDD0',
  gold: '#C9A84C',
  goldDim: '#7A6230',
  green: '#5cb390',
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
  let result = (psi * 180) / Math.PI;
  return result < 0 ? result + 360 : result;
};

// ── Kaaba SVG ──────────────────────────────────────────────────────────────
// A clean flat illustration: black cube body, gold kiswa band, gold door
const KaabaIcon = ({ size = 48 }) => {
  const s = size;
  const bodyW = s * 0.72;
  const bodyH = s * 0.60;
  const bodyX = (s - bodyW) / 2;
  const bodyY = s * 0.22;

  // Side face (right trapezoid gives 3D feel)
  const sideW = s * 0.14;
  const sidePoints = [
    `${bodyX + bodyW},${bodyY}`,
    `${bodyX + bodyW + sideW},${bodyY + s * 0.07}`,
    `${bodyX + bodyW + sideW},${bodyY + bodyH + s * 0.07}`,
    `${bodyX + bodyW},${bodyY + bodyH}`,
  ].join(' ');

  // Top face
  const topPoints = [
    `${bodyX},${bodyY}`,
    `${bodyX + bodyW},${bodyY}`,
    `${bodyX + bodyW + sideW},${bodyY - s * 0.07 + s * 0.07}`,
    `${bodyX + sideW},${bodyY - s * 0.07}`,
  ].join(' ');

  // Kiswa band (gold stripe across body)
  const bandY = bodyY + bodyH * 0.30;
  const bandH = bodyH * 0.18;

  // Door dimensions
  const doorW = bodyW * 0.26;
  const doorH = bodyH * 0.38;
  const doorX = bodyX + (bodyW - doorW) / 2;
  const doorY = bodyY + bodyH - doorH;
  const doorRx = doorW * 0.22;

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Defs>
        <LinearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1a1a1a" />
          <Stop offset="1" stopColor="#050505" />
        </LinearGradient>
        <LinearGradient id="sideGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#2a2a2a" />
          <Stop offset="1" stopColor="#111111" />
        </LinearGradient>
        <LinearGradient id="topGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#333333" />
          <Stop offset="1" stopColor="#1a1a1a" />
        </LinearGradient>
        <LinearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E8C96A" />
          <Stop offset="1" stopColor={C.gold} />
        </LinearGradient>
      </Defs>

      {/* Top face */}
      {/* <Polygon points={topPoints} fill="url(#topGrad)" /> */}

      {/* Side face */}
      <Polygon points={sidePoints} fill="url(#sideGrad)" />

      {/* Main body */}
      <Rect x={bodyX} y={bodyY} width={bodyW} height={bodyH} fill="url(#bodyGrad)" />

      {/* Gold kiswa band */}
      <Rect x={bodyX} y={bandY} width={bodyW} height={bandH} fill="url(#goldGrad)" opacity={0.95} />

      {/* Band continues on side face (slightly darker) */}
      <Polygon
        points={[
          `${bodyX + bodyW},${bandY}`,
          `${bodyX + bodyW + sideW},${bandY + s * 0.07}`,
          `${bodyX + bodyW + sideW},${bandY + bandH + s * 0.07}`,
          `${bodyX + bodyW},${bandY + bandH}`,
        ].join(' ')}
        fill={C.gold}
        opacity={0.7}
      />

      {/* Bottom face */}
      <Polygon
        points={[
          `${bodyX},${bodyY + bodyH}`,
          `${bodyX + bodyW},${bodyY + bodyH}`,
          `${bodyX + bodyW + sideW},${bodyY + bodyH + s * 0.07}`,
          `${bodyX + sideW},${bodyY + bodyH + s * 0.07}`,
        ].join(' ')}
        fill="#0a0a0a"
      />

      {/* Gold door */}
      <Rect
        x={doorX}
        y={doorY}
        width={doorW}
        height={doorH}
        rx={doorRx}
        fill="url(#goldGrad)"
      />
      {/* Door inner recess */}
      <Rect
        x={doorX + doorW * 0.15}
        y={doorY + doorH * 0.12}
        width={doorW * 0.70}
        height={doorH * 0.76}
        rx={doorRx * 0.5}
        fill="#1a1100"
        opacity={0.5}
      />

      {/* Outline strokes for crispness */}
      <Rect x={bodyX} y={bodyY} width={bodyW} height={bodyH} fill="none" stroke={C.goldDim} strokeWidth={0.8} />
      <Polygon points={sidePoints} fill="none" stroke={C.goldDim} strokeWidth={0.6} />
      {/* <Polygon points={topPoints} fill="none" stroke={C.goldDim} strokeWidth={0.6} /> */}
    </Svg>
  );
};

// ── Decorative star/crescent divider ──────────────────────────────────────
const StarDivider = ({ color = C.green }) => (
  <View style={decor.row}>
    <View style={[decor.line, { backgroundColor: color }]} />
    <Text style={[decor.star, { color: color }]}>✦</Text>
    <View style={[decor.line, { backgroundColor: color }]} />
  </View>
);

const decor = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', width: '60%', marginVertical: 2 },
  line: { flex: 1, height: 1, backgroundColor: C.green, opacity: 0.5 },
  star: { color: C.green, fontSize: 10, marginHorizontal: 8 },
});

// ── Main component ─────────────────────────────────────────────────────────
const QiblahCompass = ({ navigation }) => {
  const insets = useSafeAreaInsets();
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
    borderColor: interpolateColor(alignmentAnim.value, [0, 1], [C.border, C.green]),
    borderWidth: withTiming(isAligned ? 3 : 1.5, { duration: 300 }),
    shadowOpacity: withTiming(isAligned ? 0.6 : 0.15, { duration: 300 }),
    transform: [{ scale: withSpring(isAligned ? 1.02 : 1) }],
  }));

  const Header = () => (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconLeft}>
        <Icon name="chevron-back" size={26} color={C.surface} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Qiblah Compass</Text>
        <Text style={styles.headerArabic}>القبلة</Text>
      </View>
      <View style={styles.headerIconRight} />
    </View>
  );

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <Header />
      </View>
    );
  }

  if (hasPermission === null || isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <Header />
        <View style={styles.content}>
          <KaabaIcon size={64} />
          <StarDivider />
          <Text style={styles.loadingText}>Locating your position…</Text>
        </View>
      </View>
    );
  }

  const renderReadout = () => {
    if (degreesToQibla === null || isAligned) return null;
    const dir = degreesToQibla > 0 ? 'Turn Right  →' : '←  Turn Left';
    return (
      <View style={styles.readoutBox}>
        <Text style={styles.readoutText}>{dir}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <Header />

      <View style={styles.content}>
        {accuracy < 3 && (
          <View style={styles.warningBox}>
            <Icon name="sync" size={13} color={C.green} />
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
                <View style={styles.kaabaGlow} />
                <KaabaIcon size={52} />
                <Text style={styles.kaabaLabel}>مكة المكرمة</Text>
              </View>
            </Animated.View>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <StarDivider />

          <View style={[styles.statusBadge, isAligned && styles.statusBadgeActive]}>
            {isAligned && <Text style={styles.statusIcon}>✦  </Text>}
            <Text style={[styles.statusText, isAligned && styles.statusTextActive]}>
              {isAligned ? 'FACING THE QIBLAH' : 'ROTATE TO ALIGN'}
            </Text>
            {isAligned && <Text style={styles.statusIcon}>  ✦</Text>}
          </View>

          {renderReadout()}

          <Text style={styles.footerInstruction}>
            Align the top of your phone with the{' '}
            <Text style={styles.footerHighlight}>Kaaba</Text> icon
          </Text>

          <StarDivider />
        </View>
      </View>
    </View>
  );
};

const COMPASS_SIZE = width * 0.84;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.green,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: C.green,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerArabic: {
    fontSize: 18,
    color: C.surface,
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.surface,
    letterSpacing: 2,
  },
  headerIconLeft:  { 
    width: 36 
  },
  headerIconRight: { 
    width: 36 
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  loadingText: {
    fontSize: 14,
    color: C.green,
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
    backgroundColor: C.surface,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    position: 'absolute',
    top: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.green,
  },
  warningText: {
    color: C.green,
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
    borderBottomColor: C.green,
  },
  pointerArrowAligned: {
    borderBottomColor: C.green,
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
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.green,
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
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  cardinal: {
    position: 'absolute',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 1,
  },
  cN: { top: 22,    color: C.green },
  cE: { right: 22,  color: C.green },
  cS: { bottom: 22, color: C.green },
  cW: { left: 22,   color: C.green },
  kaabaPositioner: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  kaabaIndicator: {
    marginTop: -10,
    alignItems: 'center',
  },
  kaabaGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#C9A84C',
    opacity: 0.08,
    top: -4,
  },
  kaabaLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: C.gold,
    marginTop: 3,
    letterSpacing: 1,
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
    borderColor: C.border,
  },
  statusBadgeActive: {
    backgroundColor: C.green,
    borderColor: '#3D8A6B',
  },
  statusIcon: {
    color: C.surface,
    fontSize: 10,
  },
  statusText: {
    color: C.green,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 2,
  },
  statusTextActive: {
    color: C.surface,
  },
  readoutBox: {
    alignItems: 'center',
  },
  readoutText: {
    fontSize: 14,
    color: C.gold,
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
    color: C.gold,
    fontWeight: '700',
  },
});

export default QiblahCompass;