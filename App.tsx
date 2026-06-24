import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  PanResponder,
  AccessibilityInfo,
  useColorScheme,
} from 'react-native';
import { AppearanceProvider, useAppearance } from './src/context/AppearanceContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { AuthProvider } from './src/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import HomeScreen from './src/screens/Home/HomeScreen';
import BibleScreen from './src/screens/Bible/BibleScreen';
import BibleSplashScreen from './src/screens/Bible/BibleSplashScreen';
import BibleLibraryScreen from './src/screens/Bible/BibleLibraryScreen';
import StoriesScreen from './src/screens/Stories/StoriesScreen';
import StoryReaderScreen from './src/screens/Stories/StoryReaderScreen';
import VerseScreen from './src/screens/Verse/VerseScreen';
import GoalsScreen from './src/screens/Goals/GoalsScreen';
import ChatListScreen from './src/screens/Chat/ChatListScreen';
import DirectMessageScreen from './src/screens/Chat/DirectMessageScreen';
import GroupChatScreen from './src/screens/Chat/GroupChatScreen';
import NewChatScreen from './src/screens/Chat/NewChatScreen';
import CommunityScreen from './src/screens/Community/CommunityScreen';
import CreatePostScreen from './src/screens/Community/CreatePostScreen';
import PostDetailScreen from './src/screens/Community/PostDetailScreen';
import ProfileScreen from './src/screens/Profile/ProfileScreen';
import EditProfileScreen from './src/screens/Profile/EditProfileScreen';
import AppearanceScreen from './src/screens/Profile/AppearanceScreen';
import NotificationsScreen from './src/screens/Profile/NotificationsScreen';
import PrivacyScreen from './src/screens/Profile/PrivacyScreen';
import NotesScreen from './src/screens/Notes/NotesScreen';
import NoteEditorScreen from './src/screens/Notes/NoteEditorScreen';
import DevotionScreen from './src/screens/Devotion/DevotionScreen';
import ScriptureChatScreen from './src/screens/ScriptureChat/ScriptureChatScreen';
import ScriptureInsightsScreen from './src/screens/ScriptureInsights/ScriptureInsightsScreen';

import {
  HomeStackParamList,
  BibleStackParamList,
  NotesStackParamList,
  ChatStackParamList,
  CommunityStackParamList,
  ProfileStackParamList,
  AppRootParamList,
  RootTabParamList,
} from './src/types/navigation';

const HomeStack      = createNativeStackNavigator<HomeStackParamList>();
const BibleStack     = createNativeStackNavigator<BibleStackParamList>();
const ChatStack      = createNativeStackNavigator<ChatStackParamList>();
const NotesStack     = createNativeStackNavigator<NotesStackParamList>();
const CommunityStack = createNativeStackNavigator<CommunityStackParamList>();
const ProfileStack   = createNativeStackNavigator<ProfileStackParamList>();
const AppRoot        = createNativeStackNavigator<AppRootParamList>();
const Tab            = createBottomTabNavigator<RootTabParamList>();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator id="home" screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Bible" component={BibleScreen} />
      <HomeStack.Screen name="Stories" component={StoriesScreen} />
      <HomeStack.Screen name="StoryReader" component={StoryReaderScreen} />
      <HomeStack.Screen name="Verse" component={VerseScreen} />
      <HomeStack.Screen name="Goals" component={GoalsScreen} />
      <HomeStack.Screen name="Devotion" component={DevotionScreen} />
      <HomeStack.Screen name="ScriptureChat" component={ScriptureChatScreen} />
      <HomeStack.Screen name="ScriptureInsights" component={ScriptureInsightsScreen} />
    </HomeStack.Navigator>
  );
}

function BibleStackScreen() {
  return (
    <BibleStack.Navigator id="bible" screenOptions={{ headerShown: false }}>
      <BibleStack.Screen name="BibleSplash" component={BibleSplashScreen} />
      <BibleStack.Screen name="BibleLibrary" component={BibleLibraryScreen} />
      <BibleStack.Screen name="Bible" component={BibleScreen} />
      <BibleStack.Screen name="ScriptureChat" component={ScriptureChatScreen} />
    </BibleStack.Navigator>
  );
}

function ChatStackScreen() {
  return (
    <ChatStack.Navigator id="chat" screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatList"        component={ChatListScreen} />
      <ChatStack.Screen name="DirectMessage"   component={DirectMessageScreen} />
      <ChatStack.Screen name="GroupChat"       component={GroupChatScreen} />
      <ChatStack.Screen name="NewChat"         component={NewChatScreen} />
    </ChatStack.Navigator>
  );
}

function NotesStackScreen() {
  return (
    <NotesStack.Navigator id="notes" screenOptions={{ headerShown: false }}>
      <NotesStack.Screen name="Notes" component={NotesScreen} />
      <NotesStack.Screen name="NoteEditor" component={NoteEditorScreen} />
    </NotesStack.Navigator>
  );
}

function CommunityStackScreen() {
  return (
    <CommunityStack.Navigator id="community" screenOptions={{ headerShown: false }}>
      <CommunityStack.Screen name="Community"  component={CommunityScreen}  />
      <CommunityStack.Screen name="CreatePost" component={CreatePostScreen} />
      <CommunityStack.Screen name="PostDetail" component={PostDetailScreen} />
    </CommunityStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator id="profile" screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile"       component={ProfileScreen}       />
      <ProfileStack.Screen name="EditProfile"   component={EditProfileScreen}   />
      <ProfileStack.Screen name="Appearance"    component={AppearanceScreen}    />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
      <ProfileStack.Screen name="Privacy"       component={PrivacyScreen}       />
    </ProfileStack.Navigator>
  );
}

function RootNavigator() {
  return (
    <AppRoot.Navigator id="approot" screenOptions={{ headerShown: false }}>
      <AppRoot.Screen name="MainTabs" component={TabNavigatorComponent} />
      <AppRoot.Screen
        name="ProfileModal"
        component={ProfileStackScreen}
        options={{ presentation: 'modal' }}
      />
    </AppRoot.Navigator>
  );
}

function TabNavigatorComponent() {
  return (
    <Tab.Navigator
      id="tabs"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="HomeTab"
    >
      <Tab.Screen name="ChatTab"      component={ChatStackScreen}      />
      <Tab.Screen name="CommunityTab" component={CommunityStackScreen} />
      <Tab.Screen name="HomeTab"      component={HomeStackScreen}      />
      <Tab.Screen name="BibleTab"     component={BibleStackScreen}     />
      <Tab.Screen name="NotesTab"     component={NotesStackScreen}     />
    </Tab.Navigator>
  );
}

// ─── App-level launch splash ──────────────────────────────────────────────────

const GOLD        = '#C9A96B';
const LENS_W      = 72;   // fixed width throughout
const LENS_H_REST = 44;   // capsule resting in bar
const LENS_H_LIFT = 54;   // slight bulge when pressed/gliding
const LENS_H_MAX  = 82;   // maximum height — only on strong upward pull
const LENS_R_REST = 22;   // resting capsule corners
const LENS_R_LIFT = 27;   // slightly rounder when lifted
const LENS_R_DRAG = 32;   // hybrid capsule-circle during horizontal travel
const LENS_R_MAX  = 41;   // full circle — only when user pulls up
const LIFT_Y      = 5;    // pixels above center when lens is lifted

async function playChime() {
  // Uncomment when src/assets/chime.mp3 is available:
  // import { Audio } from 'expo-av';
  // try {
  //   await Audio.setAudioModeAsync({ playsInSilentModeIOS: false });
  //   const { sound } = await Audio.Sound.createAsync(require('./src/assets/chime.mp3'), { volume: 0.45 });
  //   await sound.playAsync();
  //   sound.setOnPlaybackStatusUpdate((s) => { if (s.isLoaded && s.didJustFinish) sound.unloadAsync(); });
  // } catch {}
}

function AppSplashScreen({ onWillFade, onDone }: { onWillFade: () => void; onDone: () => void }) {
  // All native-driver: opacity + transform only
  const logoOpacity    = useRef(new Animated.Value(0)).current;
  const logoScale      = useRef(new Animated.Value(0.7)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current;
  const bgOpacity      = useRef(new Animated.Value(0)).current;
  const nameOpacity    = useRef(new Animated.Value(0)).current;
  const nameTranslateY = useRef(new Animated.Value(15)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;

    const startFadeOut = () => {
      onWillFade(); // mount NavigationContainer before fade starts
      Animated.timing(overlayOpacity, {
        toValue: 0, duration: 300, useNativeDriver: true,
      }).start(({ finished }) => { if (finished && !cancelled) onDone(); });
    };

    const runSequence = () => {
      // Phase 1 (~0.5s) — logo bulges in: spring 0.7→1.15 + opacity fade
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(logoScale,   { toValue: 1.15, tension: 50, friction: 8, useNativeDriver: true }),
      ]).start(({ finished: f1 }) => {
        if (!f1 || cancelled) return;

        // Phase 2 (~0.65s) — logo settles downward while background fades in
        Animated.parallel([
          Animated.timing(logoScale,      { toValue: 1.0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(logoTranslateY, { toValue: 8,   duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(bgOpacity,      { toValue: 1,   duration: 650, useNativeDriver: true }),
        ]).start(({ finished: f2 }) => {
          if (!f2 || cancelled) return;

          // Phase 3 (~0.6s) — app name slides up and fades in
          Animated.parallel([
            Animated.timing(nameOpacity,    { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(nameTranslateY, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]).start(({ finished: f3 }) => {
            if (!f3 || cancelled) return;
            // Hold 500ms then fade out (300ms) — total ~2.4s vs original 5s
            setTimeout(() => { if (!cancelled) startFadeOut(); }, 500);
          });
        });
      });
    };

    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled) return;
      if (reduced) {
        logoOpacity.setValue(1); logoScale.setValue(1); bgOpacity.setValue(1);
        nameOpacity.setValue(1); nameTranslateY.setValue(0);
        setTimeout(() => { if (!cancelled) { onWillFade(); setTimeout(() => { if (!cancelled) onDone(); }, 150); } }, 500);
        return;
      }
      playChime();
      runSequence();
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <Animated.View style={[sp.overlay, { opacity: overlayOpacity }]}>
      {/* Solid dark base — opaque from frame 0 regardless of image load state */}
      <View style={sp.solidBg} />

      {/* Photo background — fades in during Phase 2 */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: bgOpacity }]}>
        <Image
          source={require('./src/assets/intro-background.jpg')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          fadeDuration={0}
        />
      </Animated.View>

      {/* Dark scrim so text stays readable over the photo */}
      <View style={sp.scrim} />

      {/* Centered content column */}
      <View style={sp.center}>
        {/* Logo — bulges then settles downward */}
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }, { translateY: logoTranslateY }] }}>
          <View style={sp.iconWrap}>
            <Ionicons name="book" size={52} color={GOLD} />
          </View>
        </Animated.View>

        <View style={sp.gap} />

        {/* App name — appears last, slides upward */}
        <Animated.View style={[sp.nameBlock, { opacity: nameOpacity, transform: [{ translateY: nameTranslateY }] }]}>
          <Text style={sp.title}>Daily Devotion</Text>
          <View style={sp.divider} />
          <Text style={sp.sub}>Scripture · Prayer · Reflection</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const sp = StyleSheet.create({
  overlay:  { ...StyleSheet.absoluteFillObject, zIndex: 999, elevation: 999 },
  solidBg:  { ...StyleSheet.absoluteFillObject, backgroundColor: '#08071A' },
  scrim:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,7,18,0.50)' },
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gap:      { height: 32 },
  iconWrap: {
    width: 100, height: 100, borderRadius: 28,
    backgroundColor: 'rgba(201,169,107,0.15)', borderWidth: 1.5,
    borderColor: 'rgba(201,169,107,0.40)', alignItems: 'center', justifyContent: 'center',
    shadowColor: GOLD, shadowOpacity: 0.25, shadowRadius: 26,
    shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
  nameBlock: { alignItems: 'center', gap: 8 },
  title:     { fontSize: 28, fontWeight: '700', letterSpacing: 0.4, color: '#F3EDE3' },
  divider:   { width: 36, height: 1.5, borderRadius: 1, backgroundColor: 'rgba(201,169,107,0.50)' },
  sub:       { fontSize: 13, letterSpacing: 0.9, color: 'rgba(255,255,255,0.58)' },
});

// ─── Tab configuration ────────────────────────────────────────────────────────

type TabConfig = {
  key: keyof RootTabParamList;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const TABS: TabConfig[] = [
  { key: 'ChatTab',      label: 'Chat',      icon: 'chatbubble-outline', iconActive: 'chatbubble' },
  { key: 'CommunityTab', label: 'Community', icon: 'people-outline',     iconActive: 'people'     },
  { key: 'HomeTab',      label: 'Home',      icon: 'heart-outline',      iconActive: 'heart'      },
  { key: 'BibleTab',     label: 'Bible',     icon: 'book-outline',       iconActive: 'book'       },
  { key: 'NotesTab',     label: 'Notes',     icon: 'pencil-outline',     iconActive: 'pencil'     },
];

// ─── Memoized tab item — avoids re-rendering every item on every swipe tick ──

type TabItemProps = {
  tab: TabConfig;
  isFocused: boolean;
  onPress: () => void;
  activeIconColor: string;
  inactiveIconColor: string;
  activeLabelColor: string;
  inactiveLabelColor: string;
};

const TabItem = memo(function TabItem({
  tab, isFocused, onPress,
  activeIconColor, inactiveIconColor, activeLabelColor, inactiveLabelColor,
}: TabItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={styles.tabItem}
    >
      <Ionicons
        name={isFocused ? tab.iconActive : tab.icon}
        size={21}
        color={isFocused ? activeIconColor : inactiveIconColor}
      />
      <Text
        style={[
          styles.tabLabel,
          { color: isFocused ? activeLabelColor : inactiveLabelColor },
          isFocused && styles.tabLabelActive,
        ]}
      >
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
});

// ─── Liquid Glass Tab Bar ─────────────────────────────────────────────────────

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();
  const { pref }   = useAppearance();
  const sysScheme  = useColorScheme();
  const isDark     = pref === 'system' ? sysScheme === 'dark' : pref === 'dark';

  const activeIconColor    = GOLD;
  const inactiveIconColor  = isDark ? 'rgba(243,237,227,0.42)' : 'rgba(47,42,36,0.38)';
  const activeLabelColor   = isDark ? '#F3EDE3' : '#2F2A24';
  const inactiveLabelColor = isDark ? 'rgba(243,237,227,0.40)' : 'rgba(47,42,36,0.35)';
  const blurTint           = isDark ? ('dark' as const) : ('light' as const);
  const warmTintBg         = isDark ? 'rgba(31,28,25,0.36)' : 'rgba(250,246,238,0.42)';
  const glassBorder        = isDark ? 'rgba(201,169,107,0.15)' : 'rgba(201,169,107,0.24)';
  const topHighlightBg     = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(201,169,107,0.20)';
  const pillShadowColor    = isDark ? '#1F1C19' : '#C9A96B';
  const lensGlassBg        = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(201,169,107,0.10)';
  const lensGlassBorder    = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(201,169,107,0.32)';

  const tabCount = TABS.length;

  // ── Animated values — all JS thread (setValue called during gesture) ──────
  const indicatorX    = useRef(new Animated.Value(0)).current;
  const indicatorBase = useRef(0);
  const lensScaleX    = useRef(new Animated.Value(1)).current;
  const lensScaleY    = useRef(new Animated.Value(1)).current;
  const iridescentOp  = useRef(new Animated.Value(0)).current;
  const barActiveAnim = useRef(new Animated.Value(0)).current;
  const lensOffsetX   = useRef(new Animated.Value(0)).current;
  const lensH         = useRef(new Animated.Value(LENS_H_REST)).current;
  const lensR         = useRef(new Animated.Value(LENS_R_REST)).current;
  const lensTopA      = useRef(new Animated.Value(0)).current;
  const lensX = useRef(Animated.add(indicatorX, lensOffsetX)).current;

  // ── Stable refs (safe inside once-created PanResponder closure) ───────────
  const tabWidthRef      = useRef(0);
  const tabRowHeightRef  = useRef(0);
  const stateIdxRef      = useRef(state.index);
  const swipeIdxRef      = useRef<number | null>(null);
  const navRef           = useRef(navigation);
  const animatingToRef   = useRef<number | null>(null);

  // ── Render state ──────────────────────────────────────────────────────────
  const [swipeIndex, setSwipeIndex] = useState<number | null>(null);
  const [tabWidth,   setTabWidth]   = useState(0);

  useEffect(() => { stateIdxRef.current = state.index; }, [state.index]);
  useEffect(() => { navRef.current = navigation; },      [navigation]);

  // When the active route changes (programmatic nav or external deep-link) and
  // no gesture/tap-animation is in flight, spring the lens to the new position.
  useEffect(() => {
    if (swipeIdxRef.current !== null) return;
    if (animatingToRef.current !== null) return;
    const tw = tabWidthRef.current;
    if (tw === 0) return;
    const restTop = (tabRowHeightRef.current - LENS_H_REST) / 2;
    Animated.spring(indicatorX, {
      toValue: state.index * tw,
      tension: 100, friction: 22, useNativeDriver: true,
    }).start();
    // native-thread scale settle
    Animated.parallel([
      Animated.spring(lensScaleX, { toValue: 1, tension: 200, friction: 20, useNativeDriver: true }),
      Animated.spring(lensScaleY, { toValue: 1, tension: 200, friction: 20, useNativeDriver: true }),
    ]).start();
    // JS-thread shape settle
    Animated.parallel([
      Animated.spring(lensH,        { toValue: LENS_H_REST, tension: 120, friction: 18, useNativeDriver: false }),
      Animated.spring(lensR,        { toValue: LENS_R_REST, tension: 120, friction: 18, useNativeDriver: false }),
      Animated.spring(lensTopA,     { toValue: restTop,     tension: 120, friction: 18, useNativeDriver: false }),
      Animated.timing(iridescentOp, { toValue: 0, duration: 300, useNativeDriver: false }),
    ]).start();
  }, [state.index]);

  // ── Measure tab row ───────────────────────────────────────────────────────
  const onTabRowLayout = useCallback((e: any) => {
    const { width, height } = e.nativeEvent.layout;
    const tw = (width - 12) / tabCount; // 12 = paddingHorizontal 6 × 2
    tabWidthRef.current     = tw;
    tabRowHeightRef.current = height;
    setTabWidth(tw);
    indicatorX.setValue(stateIdxRef.current * tw);
    lensOffsetX.setValue(tw / 2 - LENS_W / 2);
    lensTopA.setValue((height - LENS_H_REST) / 2);
  }, [tabCount]);

  // ── PanResponder ──────────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder:  (_, g) =>
        Math.abs(g.dx) > 4 && Math.abs(g.dx) > Math.abs(g.dy),

      onPanResponderGrant: () => {
        animatingToRef.current = null;
        indicatorX.stopAnimation(v => { indicatorBase.current = v; });
        Animated.timing(barActiveAnim, { toValue: 1, duration: 160, useNativeDriver: true }).start();
        // Lift — quick timing so movement tracking starts immediately
        const liftTop = (tabRowHeightRef.current - LENS_H_LIFT) / 2 - LIFT_Y;
        const liftCfg = { duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: false } as const;
        Animated.parallel([
          Animated.timing(lensH,    { toValue: LENS_H_LIFT, ...liftCfg }),
          Animated.timing(lensR,    { toValue: LENS_R_LIFT, ...liftCfg }),
          Animated.timing(lensTopA, { toValue: liftTop,     ...liftCfg }),
        ]).start();
      },

      onPanResponderMove: (_, g) => {
        const tw  = tabWidthRef.current;
        const max = (tabCount - 1) * tw;
        const px  = Math.max(0, Math.min(max, indicatorBase.current + g.dx));
        indicatorX.setValue(px);

        const nearest = Math.max(0, Math.min(tabCount - 1, Math.round(px / tw)));
        if (nearest !== swipeIdxRef.current) {
          swipeIdxRef.current = nearest;
          setSwipeIndex(nearest);
        }

        // How far between tabs (0 = over a tab, 1 = midpoint)
        const frac       = ((px % tw) + tw) % tw;
        const horizPhase = Math.sin((frac / tw) * Math.PI);

        // Upward pull: negative dy → circularise and expand
        const upPull     = Math.max(0, -g.dy);
        const pullFactor = Math.min(1, upPull / 70);

        // Horizontal velocity stretch (scaleX only — keeps height/radius independent)
        const velStretch = Math.min(0.18, Math.abs(g.vx) * 0.07);
        lensScaleX.setValue(1 + velStretch);

        // Slight squish on downward push
        const downPress = Math.max(0, g.dy);
        lensScaleY.setValue(Math.max(0.93, 1 - Math.min(0.07, downPress / 140)));

        // Shape: capsule at rest → hybrid during travel → circle only on upward pull
        const baseR  = LENS_R_LIFT + (LENS_R_DRAG - LENS_R_LIFT) * horizPhase;
        lensR.setValue(baseR + (LENS_R_MAX - baseR) * pullFactor);

        // Height: lifted capsule → grows only on upward pull
        lensH.setValue(LENS_H_LIFT + (LENS_H_MAX - LENS_H_LIFT) * pullFactor);

        // Top: base lift position, rises further with upward pull
        const baseLiftTop  = (tabRowHeightRef.current - LENS_H_LIFT) / 2 - LIFT_Y;
        const additionalUp = pullFactor * (LENS_H_MAX - LENS_H_LIFT) / 2 + upPull * 0.55;
        lensTopA.setValue(baseLiftTop - additionalUp);

        // Rainbow: corners between tabs + brightens on upward pull
        iridescentOp.setValue(Math.max(horizPhase * 0.65, pullFactor * 0.88));
      },

      onPanResponderRelease: (_, g) => {
        const tw       = tabWidthRef.current;
        const max      = (tabCount - 1) * tw;
        const finalPx  = Math.max(0, Math.min(max, indicatorBase.current + g.dx));
        const finalIdx = Math.max(0, Math.min(tabCount - 1, Math.round(finalPx / tw)));

        swipeIdxRef.current = null;
        setSwipeIndex(null);
        Animated.timing(barActiveAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();

        Animated.spring(indicatorX, {
          toValue: finalIdx * tw,
          tension: 80, friction: 26, useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished && finalIdx !== stateIdxRef.current) {
            navRef.current?.navigate(TABS[finalIdx].key as any);
          }
        });

        const restTop = (tabRowHeightRef.current - LENS_H_REST) / 2;
        Animated.parallel([
          Animated.spring(lensScaleX, { toValue: 1, tension: 120, friction: 18, useNativeDriver: true }),
          Animated.spring(lensScaleY, { toValue: 1, tension: 120, friction: 18, useNativeDriver: true }),
        ]).start();
        Animated.parallel([
          Animated.spring(lensH,        { toValue: LENS_H_REST, tension: 120, friction: 18, useNativeDriver: false }),
          Animated.spring(lensR,        { toValue: LENS_R_REST, tension: 120, friction: 18, useNativeDriver: false }),
          Animated.spring(lensTopA,     { toValue: restTop,     tension: 120, friction: 18, useNativeDriver: false }),
          Animated.timing(iridescentOp, { toValue: 0, duration: 450, useNativeDriver: false }),
        ]).start();
      },

      onPanResponderTerminate: () => {
        swipeIdxRef.current    = null;
        animatingToRef.current = null;
        setSwipeIndex(null);
        Animated.timing(barActiveAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
        Animated.spring(indicatorX, {
          toValue: stateIdxRef.current * tabWidthRef.current,
          tension: 80, friction: 26, useNativeDriver: true,
        }).start();
        const restTop = (tabRowHeightRef.current - LENS_H_REST) / 2;
        Animated.parallel([
          Animated.spring(lensScaleX, { toValue: 1, tension: 120, friction: 18, useNativeDriver: true }),
          Animated.spring(lensScaleY, { toValue: 1, tension: 120, friction: 18, useNativeDriver: true }),
        ]).start();
        Animated.parallel([
          Animated.spring(lensH,        { toValue: LENS_H_REST, tension: 120, friction: 18, useNativeDriver: false }),
          Animated.spring(lensR,        { toValue: LENS_R_REST, tension: 120, friction: 18, useNativeDriver: false }),
          Animated.spring(lensTopA,     { toValue: restTop,     tension: 120, friction: 18, useNativeDriver: false }),
          Animated.timing(iridescentOp, { toValue: 0, duration: 300, useNativeDriver: false }),
        ]).start();
      },
    })
  ).current;

  // ── Tap handler — lens glides to tapped tab, then navigates ──────────────
  const onTabPress = useCallback((tabIdx: number) => {
    if (swipeIdxRef.current !== null || animatingToRef.current !== null) return;

    const tw = tabWidthRef.current;
    if (tw === 0) {
      navRef.current?.navigate(TABS[tabIdx].key as any);
      return;
    }

    const event = navRef.current?.emit({
      type: 'tabPress',
      target: state.routes[tabIdx].key,
      canPreventDefault: true,
    });
    if (event?.defaultPrevented) return;
    if (tabIdx === stateIdxRef.current) return;

    animatingToRef.current = tabIdx;
    setSwipeIndex(tabIdx);

    const liftTop = (tabRowHeightRef.current - LENS_H_LIFT) / 2 - LIFT_Y;
    const restTop = (tabRowHeightRef.current - LENS_H_REST) / 2;

    Animated.timing(barActiveAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();

    // Phase 1 — lift: 90 ms timing so glide starts without waiting for spring settle
    const liftCfg = { duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: false } as const;
    Animated.parallel([
      Animated.timing(lensH,        { toValue: LENS_H_LIFT, ...liftCfg }),
      Animated.timing(lensR,        { toValue: LENS_R_DRAG, ...liftCfg }),
      Animated.timing(lensTopA,     { toValue: liftTop,     ...liftCfg }),
      Animated.timing(iridescentOp, { toValue: 0.45, duration: 90, useNativeDriver: false }),
    ]).start(() => {
      // Phase 2 — glide: tighter spring so travel feels crisp
      Animated.spring(indicatorX, {
        toValue: tabIdx * tw,
        tension: 160, friction: 22,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        // Phase 3 — settle: snappy return to resting capsule
        Animated.timing(barActiveAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
        // native-thread scale settle
        Animated.parallel([
          Animated.spring(lensScaleX, { toValue: 1, tension: 200, friction: 20, useNativeDriver: true }),
          Animated.spring(lensScaleY, { toValue: 1, tension: 200, friction: 20, useNativeDriver: true }),
        ]).start();
        // JS-thread shape settle
        Animated.parallel([
          Animated.spring(lensH,        { toValue: LENS_H_REST, tension: 200, friction: 20, useNativeDriver: false }),
          Animated.spring(lensR,        { toValue: LENS_R_REST, tension: 200, friction: 20, useNativeDriver: false }),
          Animated.spring(lensTopA,     { toValue: restTop,     tension: 200, friction: 20, useNativeDriver: false }),
          Animated.timing(iridescentOp, { toValue: 0, duration: 250, useNativeDriver: false }),
        ]).start();
        animatingToRef.current = null;
        setSwipeIndex(null);
        navRef.current?.navigate(TABS[tabIdx].key as any);
      });
    });
  }, [state.routes]);

  const visualIndex = swipeIndex !== null ? swipeIndex : state.index;

  // Bar "comes alive" overlay — white glow that fades in during drag.
  const barLiftOp = barActiveAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, 0.065],
  });


  return (
    <View style={styles.spacer}>
      <View style={[styles.tabBarOuter, { paddingBottom: Math.max(bottom - 22, 2) }]}>
        <View style={[styles.pillShadow, { shadowColor: pillShadowColor }]}>
          <BlurView
            intensity={isDark ? 82 : 68}
            tint={blurTint}
            style={[styles.glass, { borderColor: glassBorder }]}
          >
            <View style={[styles.warmTint, { backgroundColor: warmTintBg }]} pointerEvents="none" />
            <View style={[styles.topHighlight, { backgroundColor: topHighlightBg }]} pointerEvents="none" />
            <View style={styles.reflectionStreak} pointerEvents="none" />

            {/* Tab row — receives all swipe gestures */}
            <View
              style={styles.tabRow}
              onLayout={onTabRowLayout}
              {...panResponder.panHandlers}
            >
              {TABS.map((tab, index) => (
                <TabItem
                  key={tab.key}
                  tab={tab}
                  isFocused={visualIndex === index}
                  onPress={() => onTabPress(index)}
                  activeIconColor={activeIconColor}
                  inactiveIconColor={inactiveIconColor}
                  activeLabelColor={activeLabelColor}
                  inactiveLabelColor={inactiveLabelColor}
                />
              ))}
            </View>

            {/* Subtle white glow during drag — bar "comes alive" */}
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: '#ffffff', opacity: barLiftOp, borderRadius: RADIUS },
              ]}
            />
          </BlurView>

          {/* ── Liquid Glass Lens ─────────────────────────────────────────────── */}
          {tabWidth > 0 && (
            // Layer 1 — native thread: finger-tracking translation only
            <Animated.View
              pointerEvents="none"
              style={[styles.lensTranslation, { transform: [{ translateX: lensX }] }]}
            >
              {/* Layer 2 — JS thread: height + borderRadius only (lift/settle) */}
              <Animated.View style={[styles.lensShape, { top: lensTopA, height: lensH }]}>
                {/* Layer 3 — native thread: velocity scale morphing */}
                <Animated.View
                  style={[StyleSheet.absoluteFillObject, { transform: [{ scaleX: lensScaleX }, { scaleY: lensScaleY }] }]}
                >
                  {/* Rainbow corners */}
                  <Animated.View style={[styles.lensRainbow, { opacity: iridescentOp, borderRadius: lensR }]}>
                    <LinearGradient
                      colors={['rgba(255,100,120,0.72)', 'transparent', 'rgba(100,160,255,0.72)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <LinearGradient
                      colors={['rgba(55,220,140,0.60)', 'transparent', 'rgba(255,190,55,0.60)']}
                      start={{ x: 1, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                  </Animated.View>
                  {/* Frosted glass body */}
                  <Animated.View
                    style={[styles.lensGlass, { backgroundColor: lensGlassBg, borderColor: lensGlassBorder, borderRadius: lensR }]}
                  />
                  {/* Depth shadow */}
                  <View style={styles.lensDepth} />
                </Animated.View>
              </Animated.View>
            </Animated.View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  // navMounted: NavigationContainer is added to the tree only when splash begins fading,
  // so screens never flash before the intro animation completes.
  const [navMounted,    setNavMounted]    = useState(false);
  const [splashRemoved, setSplashRemoved] = useState(false);

  return (
    <AppearanceProvider>
      <AuthProvider>
        <ProfileProvider>
          <SafeAreaProvider>
            {navMounted && (
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            )}
            {!splashRemoved && (
              <AppSplashScreen
                onWillFade={() => setNavMounted(true)}
                onDone={() => setSplashRemoved(true)}
              />
            )}
          </SafeAreaProvider>
        </ProfileProvider>
      </AuthProvider>
    </AppearanceProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const RADIUS = 30;

const styles = StyleSheet.create({
  spacer: { height: 0, overflow: 'visible' },

  tabBarOuter: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  pillShadow: {
    borderRadius: RADIUS,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.48,
    shadowRadius: 20,
    elevation: 18,
  },

  glass: {
    borderRadius: RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
  },

  warmTint: { ...StyleSheet.absoluteFillObject },

  topHighlight: {
    position: 'absolute',
    top: 0, left: 24, right: 24,
    height: 1, borderRadius: 1,
  },

  reflectionStreak: {
    position: 'absolute',
    top: 0, left: '28%',
    width: '36%', height: 28,
    backgroundColor: 'rgba(255,255,255,0.022)',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },

  tabRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 6,
    alignItems: 'center',
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 4,
    gap: 3,
  },

  tabLabel: {
    fontSize: 9.5,
    fontWeight: '500',
    letterSpacing: 0.15,
  },

  tabLabelActive: { fontWeight: '600' },

  // ── Lens ──────────────────────────────────────────────────────────────────

  // Layer 1: native-thread translation (position only, no height/borderRadius)
  lensTranslation: {
    position: 'absolute',
    left: 6,
    top: 0,
    bottom: 0,
    width: LENS_W,
  },

  // Layer 2: JS-thread shape (height + top animated)
  lensShape: {
    position: 'absolute',
    left: 0,
    right: 0,
  },

  lensOuter: {
    position: 'absolute',
    left: 6,
    width: LENS_W,
    // height and top are animated inline
  },

  lensRainbow: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    // borderRadius animated inline
  },

  lensGlass: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    // borderRadius animated inline
  },

  lensDepth: {
    position: 'absolute',
    bottom: 5,
    left: '30%',
    right: '30%',
    height: 3,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
});
