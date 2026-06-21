import React, { useRef, useEffect, useCallback } from 'react';
import {
  Modal, View, Image, TouchableOpacity, Animated, Text,
  Dimensions, StyleSheet, PanResponder, StatusBar, Platform,
  Share, Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: W, height: H } = Dimensions.get('window');

const OPEN_DURATION  = 260;
const CLOSE_DURATION = 280;
const OPEN_EASE      = Easing.out(Easing.cubic);
const CLOSE_EASE_OP  = Easing.in(Easing.cubic);
const CLOSE_EASE_MOV = Easing.bezier(0.4, 0, 1, 1);

// Dismiss thresholds
const THRESH_X   = W  * 0.28;   // horizontal distance
const THRESH_Y   = H  * 0.25;   // vertical distance
const THRESH_VEL = 0.75;        // flick velocity (px/ms)

// Exit overshoot distances — image flies off screen
const EXIT_X = W  * 1.4;
const EXIT_Y = H  * 1.1;

// PhotoViewerOrigin kept for API compat — origin-based animation was removed
// because animating back to the avatar caused the closing lag.
export type PhotoViewerOrigin = {
  x: number; y: number; width: number; height: number;
};

type GestureSnap = { dx: number; dy: number; vx: number; vy: number };

type Props = {
  uri: string;
  visible: boolean;
  onClose: () => void;
  onEdit?: () => void;
  origin?: PhotoViewerOrigin | null;
};

export default function PhotoViewer({ uri, visible, onClose, onEdit }: Props) {
  const insets = useSafeAreaInsets();

  // The ONLY values that ever animate. Shape / size / border-radius never change.
  const screenOp = useRef(new Animated.Value(0)).current;
  const screenSc = useRef(new Animated.Value(1.04)).current;
  const screenTX = useRef(new Animated.Value(0)).current;
  const screenTY = useRef(new Animated.Value(0)).current;
  const headerOp = useRef(new Animated.Value(0)).current;

  // ── Open ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    screenOp.setValue(0);
    screenSc.setValue(1.04);
    screenTX.setValue(0);
    screenTY.setValue(0);
    headerOp.setValue(0);

    Animated.parallel([
      Animated.timing(screenOp, { toValue: 1, duration: OPEN_DURATION, easing: OPEN_EASE, useNativeDriver: true }),
      Animated.timing(screenSc, { toValue: 1, duration: OPEN_DURATION, easing: OPEN_EASE, useNativeDriver: true }),
      Animated.timing(headerOp, { toValue: 1, duration: 240, delay: 200, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  // ── Close ─────────────────────────────────────────────────────────────────
  // Accepts optional gesture info to fly the image in the swipe direction.
  // Without gesture info (button tap) it does a simple fade-out + micro-shrink.
  // NOTHING about shape, border-radius, size, or avatar position is animated.
  const animateClose = useCallback(
    (afterClose?: () => void, gesture?: GestureSnap) => {
      headerOp.setValue(0);

      let toX = 0;
      let toY = 20;
      let toSc = 0.96;

      if (gesture) {
        const { dx, dy } = gesture;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (absDx >= absDy) {
          // Horizontal-dominant → fly left or right
          toX  = dx > 0 ?  EXIT_X : -EXIT_X;
          toY  = dy * 1.4;
          toSc = 0.88;
        } else {
          // Vertical-dominant → fly down (or up)
          toY  = dy > 0 ? EXIT_Y : -EXIT_Y;
          toX  = dx * 1.4;
          toSc = 0.88;
        }
      }

      Animated.parallel([
        Animated.timing(screenOp, { toValue: 0,   duration: CLOSE_DURATION, easing: CLOSE_EASE_OP,  useNativeDriver: true }),
        Animated.timing(screenSc, { toValue: toSc, duration: CLOSE_DURATION, easing: CLOSE_EASE_MOV, useNativeDriver: true }),
        Animated.timing(screenTX, { toValue: toX,  duration: CLOSE_DURATION, easing: CLOSE_EASE_MOV, useNativeDriver: true }),
        Animated.timing(screenTY, { toValue: toY,  duration: CLOSE_DURATION, easing: CLOSE_EASE_MOV, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) { onClose(); afterClose?.(); }
      });
    },
    [onClose],
  );

  // Stable ref so PanResponder closure always calls the latest animateClose
  const closeRef = useRef<typeof animateClose>(animateClose);
  useEffect(() => { closeRef.current = animateClose; }, [animateClose]);

  // Shared spring-back animation (used on release below threshold and terminate)
  const springBack = useCallback(() => {
    Animated.parallel([
      Animated.spring(screenTX, { toValue: 0, tension: 130, friction: 15, useNativeDriver: true }),
      Animated.spring(screenTY, { toValue: 0, tension: 130, friction: 15, useNativeDriver: true }),
      Animated.spring(screenSc, { toValue: 1, tension: 130, friction: 15, useNativeDriver: true }),
      Animated.timing(screenOp, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Pan responder: down / left / right dismiss ───────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      // Must return true so this view enters the responder system and receives
      // move events. Child TouchableOpacity buttons still win because RN awards
      // the responder to the deepest claimant in the bubble phase — so button
      // taps are unaffected.
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: () => {}, // acknowledge grant, required alongside onStart

      // On each move we also re-evaluate: reject strongly upward gestures and
      // let tiny taps fall through so button presses feel clean.
      onMoveShouldSetPanResponder: (_, g) => {
        const dist = Math.sqrt(g.dx * g.dx + g.dy * g.dy);
        if (dist < 8) return false;
        if (g.dy < -20 && Math.abs(g.dy) > Math.abs(g.dx) * 2) return false;
        return true;
      },
      onMoveShouldSetPanResponderCapture: () => false,

      onPanResponderMove: (_, g) => {
        // Dead zone — ignore micro-movements from taps so buttons feel clean
        const dist = Math.sqrt(g.dx * g.dx + g.dy * g.dy);
        if (dist < 4) return;

        // 1:1 finger tracking — no damping, no lag
        screenTX.setValue(g.dx);
        screenTY.setValue(g.dy);

        // Fade + shrink proportional to drag distance
        const norm = Math.min(dist / (Math.min(W, H) * 0.5), 1);
        screenOp.setValue(Math.max(0,    1 - norm * 0.85));
        screenSc.setValue(Math.max(0.88, 1 - norm * 0.10));
      },

      onPanResponderRelease: (_, g) => {
        const absDx = Math.abs(g.dx);
        const absDy = Math.abs(g.dy);

        const shouldDismiss =
          absDx > THRESH_X || absDy > THRESH_Y ||
          Math.abs(g.vx) > THRESH_VEL || Math.abs(g.vy) > THRESH_VEL;

        if (shouldDismiss) {
          closeRef.current(undefined, { dx: g.dx, dy: g.dy, vx: g.vx, vy: g.vy });
        } else {
          springBack();
        }
      },

      onPanResponderTerminate: () => springBack(),
    }),
  ).current;

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    try {
      await Share.share(Platform.OS === 'ios' ? { url: uri } : { message: uri });
    } catch { /* cancelled */ }
  }, [uri]);

  const handleEdit = useCallback(
    () => animateClose(onEdit),
    [animateClose, onEdit],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => animateClose()}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Single animated container ─────────────────────────────────────────
          Only opacity / scale / translateX / translateY ever change.
          Image is rectangular, fixed W × H — shape never changes.
          ─────────────────────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: '#000',
            opacity: screenOp,
            transform: [
              { translateX: screenTX },
              { translateY: screenTY },
              { scale: screenSc },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Photo — rectangular, no border-radius, dimensions fixed forever */}
        <Image source={{ uri }} style={s.image} resizeMode="contain" />

        {/* Header lives inside the container so it moves / fades with the image */}
        <Animated.View
          style={[s.header, { top: insets.top + 8 }, { opacity: headerOp }]}
          pointerEvents="box-none"
        >
          {/* Glass circular back button */}
          <TouchableOpacity
            onPress={() => animateClose()}
            activeOpacity={0.72}
            style={s.glassCircle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BlurView intensity={76} tint="dark" style={StyleSheet.absoluteFillObject} />
            <View style={[StyleSheet.absoluteFillObject, s.dimLayer]} />
            <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.90)" />
          </TouchableOpacity>

          {/* Title — absolutely centered on full screen width, not between buttons */}
          <View style={s.titleWrap} pointerEvents="none">
            <Text style={s.titleText} numberOfLines={1}>Profile picture</Text>
          </View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Glass capsule: Share + Edit, no divider */}
          <View style={s.glassCapsule}>
            <BlurView intensity={76} tint="dark" style={StyleSheet.absoluteFillObject} />
            <View style={[StyleSheet.absoluteFillObject, s.dimLayer, { borderRadius: 22 }]} />
            <TouchableOpacity onPress={handleShare} style={s.capsuleBtn} activeOpacity={0.7}>
              <Ionicons name="share-outline" size={20} color="rgba(255,255,255,0.88)" />
            </TouchableOpacity>
            {onEdit ? (
              <TouchableOpacity onPress={handleEdit} style={s.capsuleBtn} activeOpacity={0.7}>
                <Ionicons name="pencil-outline" size={20} color="rgba(255,255,255,0.88)" />
              </TouchableOpacity>
            ) : null}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  // Rectangular, full screen, zero border-radius — never changes
  image: {
    position: 'absolute',
    top: 0, left: 0,
    width: W, height: H,
  },

  // Header row
  header: {
    position: 'absolute',
    left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 54,
  },

  // Title centered on the full screen width (independent of button widths)
  titleWrap: {
    position: 'absolute',
    left: 0, right: 0,
    alignItems: 'center',
  },
  titleText: {
    color: 'rgba(255,255,255,0.93)',
    fontSize: 16, fontWeight: '600', letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },

  // Shared dark layer placed over BlurView inside clipped containers
  dimLayer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.36)',
  },

  // Glass circle (back button)
  glassCircle: {
    width: 40, height: 40, borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.12)',
  },

  // Glass capsule (share + edit)
  glassCapsule: {
    flexDirection: 'row', alignItems: 'center',
    height: 40, borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.12)',
  },
  capsuleBtn: {
    width: 44, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
});
