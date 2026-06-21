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

// --- CONSTANTS ---
const DOCK_PADDING = 12;
const ITEM_GAP     = 4;
const TAB_COUNT    = 5;
const BAR_WIDTH    = width - DOCK_PADDING * 2;
const TAB_WIDTH    = (BAR_WIDTH - ITEM_GAP * (TAB_COUNT - 1)) / TAB_COUNT;

// WhatsApp-feel spring — all with useNativeDriver:false so we can also animate width
const SPRING = { tension: 100, friction: 14, useNativeDriver: false } as const;

// --- TAB DATA — order must match Tab.Navigator screen order in App.tsx ---
// 'chat-bubble-outline' is MaterialIcons only; 'message-outline' is the MCI equivalent
const TABS = [
  { id: 0, name: 'Chat',        icon: 'message-outline' as const       },
  { id: 1, name: 'Communities', icon: 'account-group-outline' as const, badge: 2   },
  { id: 2, name: 'Home',        icon: 'home-outline' as const          },
  { id: 3, name: 'Bible',       icon: 'book-open-variant' as const,     badge: 138 },
  { id: 4, name: 'Notes',       icon: 'note-edit-outline' as const     },
];

// --- PILL LAYOUT ---
// Pill is position:absolute INSIDE the dock, so X is dock-relative.
// DOCK_PADDING is already the wrapper's `left:` margin — do NOT add it here.
const getTabLayout = (index: number) => {
  const baseX      = index * TAB_WIDTH + index * ITEM_GAP;
  const textLength = TABS[index].name.length;
  let dynamicWidth = TAB_WIDTH;
  if (textLength > 8) dynamicWidth = TAB_WIDTH + 20;       // Communities
  else if (textLength < 5) dynamicWidth = TAB_WIDTH - 10;  // short names
  return { x: baseX, width: dynamicWidth };
};

// --- COMPONENT ---
export default function CustomBottomBar({ state, navigation }: BottomTabBarProps) {
  const activeTabIndex = state.index;

  const init       = getTabLayout(activeTabIndex);
  const pillX      = useRef(new Animated.Value(init.x)).current;
  const pillW      = useRef(new Animated.Value(init.width)).current;
  const pillScaleY = useRef(new Animated.Value(1)).current;

  // Keep pill in sync when navigation changes externally (back gesture, deep link)
  useEffect(() => {
    const layout = getTabLayout(state.index);
    Animated.parallel([
      Animated.spring(pillX, { toValue: layout.x,     ...SPRING }),
      Animated.spring(pillW, { toValue: layout.width, ...SPRING }),
    ]).start();
  }, [state.index]);

  const handleTabPress = (index: number) => {
    if (index === activeTabIndex) return;
    const layout = getTabLayout(index);

    // Slide pill to new position
    Animated.parallel([
      Animated.spring(pillX, { toValue: layout.x,     ...SPRING }),
      Animated.spring(pillW, { toValue: layout.width, ...SPRING }),
    ]).start();

    // Squish → pop (tactile feedback)
    Animated.sequence([
      Animated.timing(pillScaleY, { toValue: 0.88, duration: 80,  useNativeDriver: false }),
      Animated.spring(pillScaleY, { toValue: 1,    tension: 80, friction: 8, useNativeDriver: false }),
    ]).start();

    navigation.navigate(state.routes[index].name as any);
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={45} tint="dark" style={styles.dock}>

        {/* Pill first — tabs render on top of it in z-order */}
        <Animated.View
          style={[
            styles.pill,
            {
              width: pillW,
              transform: [{ translateX: pillX }, { scaleY: pillScaleY }],
            },
          ]}
        />

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
                    name={tab.icon}
                    size={26}
                    color={isActive ? 'white' : 'rgba(255,255,255,0.55)'}
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

      </BlurView>
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: DOCK_PADDING,
    right: DOCK_PADDING,
    height: 80,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  dock: {
    flex: 1,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: 'rgba(40,40,40,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  // left:0 anchors the pill; translateX (from Animated.Value) drives its position
  pill: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 1,
  },
  label: {
    color: 'rgba(255,255,255,0.6)',
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
