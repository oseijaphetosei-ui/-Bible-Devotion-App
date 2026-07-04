import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');

const DOCK_PADDING = 12;
const ITEM_GAP     = 4;
const TAB_COUNT    = 5;
const BAR_HEIGHT   = 80;
const BAR_BOTTOM   = 30;   // resting distance from screen bottom
const PILL_INSET   = 8;
const BAR_WIDTH    = width - DOCK_PADDING * 2;
const TAB_WIDTH    = (BAR_WIDTH - ITEM_GAP * (TAB_COUNT - 1)) / TAB_COUNT;

// The pill animates layout props (width) alongside transforms, so every
// animation on it must use the JS driver.
const SPRING_LAYOUT = { tension: 100, friction: 14, useNativeDriver: false } as const;

// How far the pill over-stretches. The pill is (BAR_HEIGHT - 2 * PILL_INSET)
// tall and vertically centered, so a scaleY of 1.3 pushes both ends past the
// bar's top and bottom edges; the BlurView's overflow:'hidden' clips them
// flush at the edges — the pill visibly fills the bar in both directions.
const STRETCH_SCALE = 1.3;

const TABS = [
  { id: 0, name: 'Chat',        icon: 'message-outline' as const,       activeIcon: 'message' as const                 },
  { id: 1, name: 'Communities', icon: 'account-group-outline' as const, activeIcon: 'account-group' as const, badge: 2 },
  { id: 2, name: 'Home',        icon: 'home-outline' as const,          activeIcon: 'home' as const                    },
  { id: 3, name: 'Bible',       icon: 'book-open-variant' as const,     activeIcon: 'book-open-variant' as const, badge: 138 },
  { id: 4, name: 'Notes',       icon: 'note-edit-outline' as const,     activeIcon: 'note-edit' as const               },
];

const getTabLayout = (index: number) => {
  const baseX      = index * TAB_WIDTH + index * ITEM_GAP;
  const textLength = TABS[index].name.length;
  let dynamicWidth = TAB_WIDTH;
  if (textLength > 8) dynamicWidth = TAB_WIDTH + 20;
  else if (textLength < 5) dynamicWidth = TAB_WIDTH - 10;
  return { x: baseX, width: dynamicWidth };
};

export default function CustomBottomBar({ state, navigation }: BottomTabBarProps) {
  const activeTabIndex = state.index;

  const init       = getTabLayout(activeTabIndex);
  const pillX      = useRef(new Animated.Value(init.x)).current;
  const pillW      = useRef(new Animated.Value(init.width)).current;
  // scaleY stretches the pill symmetrically from its center (which sits
  // exactly at the bar's vertical midpoint), so it grows up AND down at once.
  const pillScaleY = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const layout = getTabLayout(state.index);
    Animated.parallel([
      Animated.spring(pillX, { toValue: layout.x,     ...SPRING_LAYOUT }),
      Animated.spring(pillW, { toValue: layout.width, ...SPRING_LAYOUT }),
    ]).start();
  }, [state.index]);

  const handleTabPress = (index: number) => {
    if (index === activeTabIndex) return;
    const layout = getTabLayout(index);

    Animated.parallel([
      Animated.spring(pillX, { toValue: layout.x,     ...SPRING_LAYOUT }),
      Animated.spring(pillW, { toValue: layout.width, ...SPRING_LAYOUT }),
    ]).start();

    // Stretch the pill symmetrically: it is vertically centered in the bar,
    // so scaleY pushes its top and bottom toward the bar's edges at the same
    // time. The BlurView clips it flush at both edges (the "full fill" look),
    // then it springs back to its resting pill shape.
    pillScaleY.setValue(1);
    Animated.sequence([
      Animated.timing(pillScaleY, {
        toValue: STRETCH_SCALE,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.spring(pillScaleY, {
        toValue: 1,
        tension: 90,
        friction: 9,
        useNativeDriver: false,
      }),
    ]).start();

    navigation.navigate(state.routes[index].name as any);
  };

  return (
    <View style={styles.container}>

      {/*
        Layer 1 — blurred dock background. overflow:'hidden' + borderRadius
        clip everything inside (including the stretching pill) to the bar
        shape, so the scaleY overstretch reads as the pill filling the bar
        top-to-bottom in both directions simultaneously.
      */}
      <BlurView intensity={45} tint="dark" style={styles.dockBlur}>
        {/* Layer 2 — sliding highlight pill, INSIDE the clipping BlurView */}
        <Animated.View
          style={[
            styles.pill,
            {
              width: pillW,
              transform: [{ translateX: pillX }, { scaleY: pillScaleY }],
            },
          ]}
        />
      </BlurView>

      {/* Layer 3 — tab buttons, always on top */}
      <View style={styles.tabsRow}>
        {TABS.map((tab, index) => {
          const isActive = activeTabIndex === index;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.8}
              onPress={() => handleTabPress(index)}
              style={styles.tabButton}
            >
              <View style={styles.tabContent}>
                <MaterialCommunityIcons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={26}
                  color={isActive ? 'white' : 'rgba(255,255,255,0.50)'}
                  style={{ marginBottom: 2 }}
                />
                <Text style={[styles.label, isActive && styles.labelActive]}>
                  {tab.name}
                </Text>
                {tab.badge != null && tab.badge > 0 && (
                  <View style={[styles.badgeContainer, isActive && styles.badgeActive]}>
                    <Text style={styles.badgeText}>
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: DOCK_PADDING,
    right: DOCK_PADDING,
    bottom: BAR_BOTTOM,
    height: BAR_HEIGHT,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },

  // The blur background — clips its children (the pill) to the rounded shape
  dockBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: 'rgba(40,40,40,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  // Pill — vertically centered in the bar:
  // top PILL_INSET (8) + height (80 - 16 = 64) / 2 = 40 = BAR_HEIGHT / 2.
  // scaleY therefore expands it equally toward both bar edges.
  pill: {
    position: 'absolute',
    top: PILL_INSET,
    bottom: PILL_INSET,
    left: 0,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },

  // Tab row overlays everything
  tabsRow: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -14,
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
    zIndex: 20,
  },
  badgeActive: {
    borderColor: 'rgba(255,255,255,0.2)',
    top: -2,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
});
