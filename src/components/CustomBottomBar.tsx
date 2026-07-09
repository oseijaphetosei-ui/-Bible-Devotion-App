/**
 * CustomBottomBar — iOS 26 Liquid Glass Navigation
 *
 * Architecture:
 *   Layer 1 (bottom): Outer drop shadow on container View
 *   Layer 2:          Glass capsule — BlurView (adaptive tint) + specular dome gradient + top-edge highlight
 *   Layer 3:          Active glass lens — slides via native-driver translateX spring
 *                     Nested BlurView for depth + specular gradient + edge highlight
 *   Layer 4 (top):    Tab buttons (absolute fill)
 *
 * All animations use useNativeDriver: true (translateX + scale + opacity only).
 * Lens width is fixed (1/5 of bar width), so no layout-affecting animations exist.
 *
 * Scroll awareness: import { tabBarScrollSignal } from this file and call
 *   tabBarScrollSignal.setValue(scrollY) from any screen's onScroll handler.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  Vibration,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme';

// ─── Exported scroll signal ───────────────────────────────────────────────────
// Screens can drive this to trigger scroll-aware bar dimming:
//   import { tabBarScrollSignal } from '../components/CustomBottomBar';
//   tabBarScrollSignal.setValue(scrollYValue);
export const tabBarScrollSignal = new Animated.Value(0);

// ─── Layout ───────────────────────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');

const H_PAD      = 16;              // horizontal gap from screen edges
const BAR_H      = 66;              // capsule height
const BAR_R      = 33;              // outer border-radius (BAR_H / 2 = capsule)
const BAR_W      = SCREEN_W - H_PAD * 2;
const TAB_COUNT  = 5;
const TAB_W      = BAR_W / TAB_COUNT;

// Apple HIG concentric radius rule: LENS_R + LENS_V_PAD = BAR_R
const LENS_V_PAD = 5;               // vertical inset of lens inside capsule
const LENS_H_PAD = 3;               // horizontal inset per side (within tab slot)
const LENS_W     = TAB_W - LENS_H_PAD * 2;
const LENS_H     = BAR_H - LENS_V_PAD * 2;   // 56pt
const LENS_R     = Math.ceil(LENS_H / 2);     // 28pt  (28 + 5 = 33 ✓ concentric)

// ─── Spring configs (tuned to UIKit feel) ─────────────────────────────────────
const LENS_SPRING = {
  mass: 1, stiffness: 280, damping: 28,
  useNativeDriver: true,
} as const;

const ICON_SPRING_DOWN = {
  tension: 420, friction: 9,
  useNativeDriver: true,
} as const;

const ICON_SPRING_UP = {
  tension: 200, friction: 11,
  useNativeDriver: true,
} as const;

// ─── Tab definitions ──────────────────────────────────────────────────────────
// Icons: Ionicons — filled SF-Symbol-style active, outlined inactive
// Route names match the navigator definitions in App.tsx
type TabDef = {
  id:         number;
  label:      string;
  icon:       string;  // inactive (outline)
  activeIcon: string;  // active (filled)
  badge?:     number;
};

const TABS: TabDef[] = [
  { id: 0, label: 'Chat',      icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
  { id: 1, label: 'Community', icon: 'people-outline',     activeIcon: 'people',      badge: 2   },
  { id: 2, label: 'Home',      icon: 'home-outline',       activeIcon: 'home'                    },
  { id: 3, label: 'Bible',     icon: 'book-outline',       activeIcon: 'book',        badge: 138 },
  { id: 4, label: 'Notes',     icon: 'create-outline',     activeIcon: 'create'                  },
];

// ─── Haptic helper ────────────────────────────────────────────────────────────
// Uses Vibration (expo-haptics not installed). On iOS, a very short
// Vibration.vibrate() triggers the Taptic Engine (light impact).
const hapticLight = () => {
  if (Platform.OS === 'ios') Vibration.vibrate(10);
};

// ─── Glass material tokens ────────────────────────────────────────────────────
// Separate token sets for dark (midnight navy) and light (warm ivory) themes.
// Designed to replicate iOS 26 Liquid Glass layering in React Native.
type GlassTokens = {
  blurTint:       'dark' | 'light' | 'default';
  // Glass capsule layers
  capsuleBg:      string;   // tinted overlay behind blur
  specularTop:    string;   // dome gradient top (glass curvature)
  specularMid:    string;   // dome gradient midpoint
  specularBot:    string;   // dome gradient bottom (transparent)
  borderEdge:     string;   // all-edge thin border
  topEdge:        string;   // extra-bright top edge line (refraction)
  // Active lens layers
  lensBg:         string;   // lens fill tint
  lensBlurTint:   'dark' | 'light' | 'default';
  lensSpecTop:    string;   // lens dome highlight top
  lensSpecBot:    string;   // lens dome highlight bottom
  lensEdge:       string;   // lens border
  lensTopEdge:    string;   // lens top-edge specular line
  lensGlow:       string;   // subtle golden accent glow
  // Icons & text
  iconActive:     string;
  iconInactive:   string;
  labelActive:    string;
  labelInactive:  string;
  // Badge
  badgeBorder:    string;
  // Shadow
  shadowColor:    string;
  shadowOpacity:  number;
};

const DARK_GLASS: GlassTokens = {
  blurTint:       'dark',
  capsuleBg:      'rgba(14,16,28,0.68)',
  specularTop:    'rgba(255,255,255,0.13)',
  specularMid:    'rgba(255,255,255,0.04)',
  specularBot:    'rgba(255,255,255,0)',
  borderEdge:     'rgba(255,255,255,0.11)',
  topEdge:        'rgba(255,255,255,0.24)',
  lensBg:         'rgba(255,255,255,0.09)',
  lensBlurTint:   'dark',
  lensSpecTop:    'rgba(255,255,255,0.36)',
  lensSpecBot:    'rgba(255,255,255,0.04)',
  lensEdge:       'rgba(255,255,255,0.20)',
  lensTopEdge:    'rgba(255,255,255,0.42)',
  lensGlow:       'rgba(201,169,107,0.18)',
  iconActive:     'rgba(255,255,255,0.96)',
  iconInactive:   'rgba(232,226,216,0.40)',
  labelActive:    'rgba(255,255,255,0.94)',
  labelInactive:  'rgba(232,226,216,0.35)',
  badgeBorder:    'rgba(14,16,28,0.90)',
  shadowColor:    '#000000',
  shadowOpacity:  0.38,
};

const LIGHT_GLASS: GlassTokens = {
  blurTint:       'light',
  capsuleBg:      'rgba(245,240,232,0.55)',
  specularTop:    'rgba(255,255,255,0.62)',
  specularMid:    'rgba(255,255,255,0.22)',
  specularBot:    'rgba(255,255,255,0)',
  borderEdge:     'rgba(255,255,255,0.65)',
  topEdge:        'rgba(255,255,255,0.88)',
  lensBg:         'rgba(255,255,255,0.52)',
  lensBlurTint:   'light',
  lensSpecTop:    'rgba(255,255,255,0.92)',
  lensSpecBot:    'rgba(255,255,255,0.20)',
  lensEdge:       'rgba(255,255,255,0.80)',
  lensTopEdge:    'rgba(255,255,255,0.96)',
  lensGlow:       'rgba(201,169,107,0.14)',
  iconActive:     'rgba(47,42,36,0.94)',
  iconInactive:   'rgba(47,42,36,0.36)',
  labelActive:    'rgba(47,42,36,0.90)',
  labelInactive:  'rgba(47,42,36,0.33)',
  badgeBorder:    'rgba(245,240,232,0.90)',
  shadowColor:    '#2F2A24',
  shadowOpacity:  0.14,
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function CustomBottomBar({ state, navigation }: BottomTabBarProps) {
  const t       = useTheme();
  const insets  = useSafeAreaInsets();
  const isDark  = t.statusBar === 'light-content';
  const g       = isDark ? DARK_GLASS : LIGHT_GLASS;
  const active  = state.index;

  // Bottom position: always above the gesture bar
  // +8pt breathing room between bar and safe area edge
  const barBottom = Math.max(insets.bottom, 6) + 8;

  // ── Lens position (native-driver translateX) ────────────────────────────
  const lensX = useRef(
    new Animated.Value(active * TAB_W + LENS_H_PAD),
  ).current;

  // Sync lens when navigation changes active tab externally (deep link, etc.)
  useEffect(() => {
    Animated.spring(lensX, {
      toValue: active * TAB_W + LENS_H_PAD,
      ...LENS_SPRING,
    }).start();
  }, [active]);

  // ── Per-tab icon press scale ────────────────────────────────────────────
  const iconScales = useRef(TABS.map(() => new Animated.Value(1))).current;

  // ── Scroll awareness (JS driver, but no React re-renders via setValue) ──
  const barOpacity = tabBarScrollSignal.interpolate({
    inputRange:  [0, 60, 140],
    outputRange: [1, 0.94, 0.78],
    extrapolate: 'clamp',
  });
  const barScale = tabBarScrollSignal.interpolate({
    inputRange:  [0, 140],
    outputRange: [1, 0.97],
    extrapolate: 'clamp',
  });

  // ── Tab press handler ───────────────────────────────────────────────────
  const handlePress = useCallback((index: number) => {
    hapticLight();

    // Icon press spring: squeeze down, then spring back
    Animated.sequence([
      Animated.spring(iconScales[index], { toValue: 0.76, ...ICON_SPRING_DOWN }),
      Animated.spring(iconScales[index], { toValue: 1,    ...ICON_SPRING_UP  }),
    ]).start();

    if (index === active) {
      // Re-tap: emit tabPress so navigator handles scroll-to-top / stack reset
      const route = state.routes[index];
      const event = navigation.emit({
        type:               'tabPress',
        target:             route.key,
        canPreventDefault:  true,
      });
      if (!event.defaultPrevented) {
        navigation.navigate({ name: route.name as any, merge: true } as any);
      }
      return;
    }

    // Slide lens to new position immediately (optimistic — smooth & instant)
    Animated.spring(lensX, {
      toValue: index * TAB_W + LENS_H_PAD,
      ...LENS_SPRING,
    }).start();

    navigation.navigate(state.routes[index].name as any);
  }, [active, lensX, iconScales, navigation, state.routes]);

  return (
    <Animated.View
      style={[
        s.container,
        {
          bottom:         barBottom,
          shadowColor:    g.shadowColor,
          shadowOpacity:  g.shadowOpacity,
          opacity:        barOpacity,
          transform:      [{ scale: barScale }],
        },
      ]}
      pointerEvents="box-none"
    >
      {/*
        ──────────────────────────────────────────────────────────
        Layer 2: Glass capsule
        BlurView clips its children (lens + specular) to BAR_R.
        The outer shadow on the container shows through since
        shadow is rendered on the container's layer, not the clip.
        ──────────────────────────────────────────────────────────
      */}
      <BlurView
        intensity={22}
        tint={g.blurTint}
        style={[
          s.glassBlur,
          {
            backgroundColor: g.capsuleBg,
            borderColor:      g.borderEdge,
          },
        ]}
      >
        {/*
          Specular dome gradient — simulates convex glass curvature.
          Covers the top 50% of the capsule, fading to transparent.
        */}
        <LinearGradient
          colors={[g.specularTop, g.specularMid, g.specularBot] as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={s.specularDome}
          pointerEvents="none"
        />

        {/* Top-edge refraction line — 1pt, brighter than the border */}
        <View
          style={[s.topEdgeLine, { backgroundColor: g.topEdge }]}
          pointerEvents="none"
        />

        {/*
          ──────────────────────────────────────────
          Layer 3: Active glass lens
          Positioned absolutely. Native-driver translateX spring.
          ──────────────────────────────────────────
        */}
        <Animated.View
          style={[
            s.lens,
            {
              borderColor:     g.lensEdge,
              shadowColor:     g.lensGlow,
              transform:       [{ translateX: lensX }],
            },
          ]}
        >
          {/* Lens base blur — additional depth beyond the capsule blur */}
          <BlurView
            intensity={44}
            tint={g.lensBlurTint}
            style={[s.lensFill, { backgroundColor: g.lensBg }]}
          />

          {/* Lens specular dome (same concept as capsule, but more intense) */}
          <LinearGradient
            colors={[g.lensSpecTop, g.lensSpecBot] as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={s.lensSpecular}
            pointerEvents="none"
          />

          {/* Lens top-edge highlight — sharper than dome gradient */}
          <View
            style={[s.lensTopEdge, { backgroundColor: g.lensTopEdge }]}
            pointerEvents="none"
          />
        </Animated.View>
      </BlurView>

      {/*
        ──────────────────────────────────────────────────────────
        Layer 4: Tab buttons
        Absolute fill, above all glass layers.
        ──────────────────────────────────────────────────────────
      */}
      <View style={s.tabRow} pointerEvents="box-none">
        {TABS.map((tab, index) => {
          const isActive = active === index;

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => handlePress(index)}
              style={s.tabBtn}
              activeOpacity={1}
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityHint={
                tab.badge && tab.badge > 0
                  ? `${tab.badge > 99 ? 'More than 99' : tab.badge} notification${tab.badge !== 1 ? 's' : ''}`
                  : undefined
              }
            >
              <Animated.View
                style={[
                  s.tabContent,
                  { transform: [{ scale: iconScales[index] }] },
                ]}
              >
                {/* Icon — filled (active) vs outlined (inactive) */}
                <Ionicons
                  name={(isActive ? tab.activeIcon : tab.icon) as any}
                  size={23}
                  color={isActive ? g.iconActive : g.iconInactive}
                />

                {/* Label */}
                <Text
                  style={[
                    s.label,
                    {
                      color:      isActive ? g.labelActive : g.labelInactive,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                  numberOfLines={1}
                  allowFontScaling={false}
                >
                  {tab.label}
                </Text>

                {/* Badge — iOS system red (#FF3B30) */}
                {tab.badge != null && tab.badge > 0 && (
                  <View
                    style={[s.badge, { borderColor: g.badgeBorder }]}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  >
                    <Text style={s.badgeText}>
                      {tab.badge > 99 ? '99+' : String(tab.badge)}
                    </Text>
                  </View>
                )}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Floating container — carries the outer drop shadow.
  // Shadow is rendered on this layer and shows outside the BlurView's clip.
  container: {
    position:       'absolute',
    left:           H_PAD,
    right:          H_PAD,
    height:         BAR_H,
    zIndex:         1000,
    // Drop shadow (iOS only; elevation on Android is separate)
    shadowOffset:   { width: 0, height: 8 },
    shadowRadius:   24,
    elevation:      14,  // Android
  },

  // Glass capsule — clips specular + lens to the pill shape.
  glassBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius:   BAR_R,
    overflow:       'hidden',
    borderWidth:    StyleSheet.hairlineWidth,
  },

  // Specular dome — top 55% height, glass-curvature illusion
  specularDome: {
    position:   'absolute',
    top:        0,
    left:       0,
    right:      0,
    height:     Math.round(BAR_H * 0.55),
    borderRadius: BAR_R,
    zIndex:     1,
  },

  // 1pt top-edge refraction line (sits above specular)
  topEdgeLine: {
    position:   'absolute',
    top:        0,
    left:       8,
    right:      8,
    height:     1,
    borderRadius: 1,
    zIndex:     2,
  },

  // Active glass lens (floats inside the capsule)
  lens: {
    position:     'absolute',
    top:          LENS_V_PAD,
    left:         0,          // translateX handles horizontal position
    width:        LENS_W,
    height:       LENS_H,
    borderRadius: LENS_R,
    overflow:     'hidden',
    borderWidth:  StyleSheet.hairlineWidth,
    zIndex:       3,
    // Soft glow — simulates ambient light under the active lens
    shadowOffset:   { width: 0, height: 2 },
    shadowRadius:   8,
    shadowOpacity:  0.4,
    elevation:      4,
  },

  // Lens fill — inner BlurView for depth
  lensFill: {
    ...StyleSheet.absoluteFillObject,
  },

  // Lens specular dome — covers top 60% of lens height
  lensSpecular: {
    position:     'absolute',
    top:          0,
    left:         0,
    right:        0,
    height:       Math.round(LENS_H * 0.60),
    zIndex:       1,
  },

  // Lens top-edge line — 1pt, sharp specular highlight
  lensTopEdge: {
    position:     'absolute',
    top:          0,
    left:         6,
    right:        6,
    height:       1,
    borderRadius: 1,
    zIndex:       2,
  },

  // Tab button row — overlay on top of all glass layers
  tabRow: {
    position:       'absolute',
    top:            0,
    bottom:         0,
    left:           0,
    right:          0,
    flexDirection:  'row',
    zIndex:         10,
  },

  // Each tab button — full height for 44pt+ touch target (BAR_H = 66pt ✓)
  tabBtn: {
    flex:           1,
    height:         '100%',
    justifyContent: 'center',
    alignItems:     'center',
  },

  // Icon + label container (animated scale applied here)
  tabContent: {
    alignItems:  'center',
    justifyContent: 'center',
    gap:         3,
  },

  // Tab label — 10pt Caption 1 (Apple HIG tab bar standard)
  label: {
    fontSize:      10,
    letterSpacing: 0.1,
    marginTop:     1,
    includeFontPadding: false,
  },

  // Badge — iOS system red, white text
  badge: {
    position:         'absolute',
    top:              -5,
    right:            -10,
    backgroundColor:  '#FF3B30',  // iOS system red (HIG exact value)
    borderRadius:     10,
    minWidth:         18,
    height:           18,
    paddingHorizontal: 5,
    alignItems:       'center',
    justifyContent:   'center',
    borderWidth:      1.5,
    zIndex:           20,
  },

  badgeText: {
    color:      '#FFFFFF',
    fontSize:   10,
    fontWeight: '800',
    textAlign:  'center',
    includeFontPadding: false,
  },
});
