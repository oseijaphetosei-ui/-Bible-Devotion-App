import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import HomeScreen from './src/screens/Home/HomeScreen';
import BibleScreen from './src/screens/Bible/BibleScreen';
import StoriesScreen from './src/screens/Stories/StoriesScreen';
import StoryReaderScreen from './src/screens/Stories/StoryReaderScreen';
import VerseScreen from './src/screens/Verse/VerseScreen';
import GoalsScreen from './src/screens/Goals/GoalsScreen';
import ChatScreen from './src/screens/Chat/ChatScreen';
import CommunityScreen from './src/screens/Community/CommunityScreen';
import NotesScreen from './src/screens/Notes/NotesScreen';

import {
  HomeStackParamList,
  BibleStackParamList,
  RootTabParamList,
} from './src/types/navigation';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const BibleStack = createNativeStackNavigator<BibleStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator id="home" screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Bible" component={BibleScreen} />
      <HomeStack.Screen name="Stories" component={StoriesScreen} />
      <HomeStack.Screen name="StoryReader" component={StoryReaderScreen} />
      <HomeStack.Screen name="Verse" component={VerseScreen} />
      <HomeStack.Screen name="Goals" component={GoalsScreen} />
    </HomeStack.Navigator>
  );
}

function BibleStackScreen() {
  return (
    <BibleStack.Navigator id="bible" screenOptions={{ headerShown: false }}>
      <BibleStack.Screen name="Bible" component={BibleScreen} />
    </BibleStack.Navigator>
  );
}

type TabConfig = {
  key: keyof RootTabParamList;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const TABS: TabConfig[] = [
  { key: 'ChatTab',      label: 'Chat',      icon: 'chatbubble-outline',  iconActive: 'chatbubble' },
  { key: 'CommunityTab', label: 'Community', icon: 'people-outline',      iconActive: 'people'     },
  { key: 'HomeTab',      label: 'Home',      icon: 'heart-outline',       iconActive: 'heart'      },
  { key: 'BibleTab',     label: 'Bible',     icon: 'book-outline',        iconActive: 'book'       },
  { key: 'NotesTab',     label: 'Notes',     icon: 'pencil-outline',      iconActive: 'pencil'     },
];

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();

  // Zero-height spacer: React Navigation sees 0px tab bar height → screens fill
  // 100% of the display, so content scrolls all the way behind the floating glass.
  return (
    <View style={styles.spacer}>
      <View style={[styles.tabBarOuter, { paddingBottom: Math.max(bottom - 20, 2) }]}>
        {/* Shadow halo — no overflow:hidden so the glow bleeds outward */}
        <View style={styles.pillShadow}>
          {/* BlurView clips to pill shape; blurs live content behind it */}
          <BlurView intensity={85} tint="dark" style={styles.glass}>
            {/* Warm amber tint — picks up the page's brown gradient */}
            <View style={styles.warmTint} pointerEvents="none" />
            {/* 1 px top-edge highlight simulating light refracting off glass */}
            <View style={styles.topHighlight} pointerEvents="none" />
            {/* Soft reflection streak near the top-centre */}
            <View style={styles.reflectionStreak} pointerEvents="none" />

            {/* Tab row */}
            <View style={styles.tabRow}>
              {TABS.map((tab, index) => {
                const isFocused = state.index === index;
                const onPress = () => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: state.routes[index].key,
                    canPreventDefault: true,
                  });
                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(tab.key);
                  }
                };

                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={onPress}
                    activeOpacity={0.75}
                    style={styles.tabItem}
                  >
                    {isFocused && <View style={styles.activeHighlight} />}
                    <Ionicons
                      name={isFocused ? tab.iconActive : tab.icon}
                      size={22}
                      color={isFocused ? '#D4AF37' : 'rgba(255,255,255,0.42)'}
                    />
                    <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </BlurView>
        </View>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          id="tabs"
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{ headerShown: false }}
          initialRouteName="HomeTab"
        >
          <Tab.Screen name="ChatTab"      component={ChatScreen} />
          <Tab.Screen name="CommunityTab" component={CommunityScreen} />
          <Tab.Screen name="HomeTab"      component={HomeStackScreen} />
          <Tab.Screen name="BibleTab"     component={BibleStackScreen} />
          <Tab.Screen name="NotesTab"     component={NotesScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const RADIUS = 32;

const styles = StyleSheet.create({
  // Zero-height spacer so React Navigation gives screens full 100% height
  spacer: {
    height: 0,
    overflow: 'visible',
  },

  // Absolutely positioned container anchored to the bottom of the spacer
  tabBarOuter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingTop: 6,
  },

  pillShadow: {
    borderRadius: RADIUS,
    shadowColor: '#3A1F00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.75,
    shadowRadius: 28,
    elevation: 20,
  },

  glass: {
    borderRadius: RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
  },

  warmTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(72, 38, 8, 0.28)',
  },

  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderRadius: 1,
  },

  reflectionStreak: {
    position: 'absolute',
    top: 0,
    left: '28%',
    width: '36%',
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },

  tabRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 6,
    alignItems: 'center',
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 4,
  },

  activeHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.11)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.38)',
    letterSpacing: 0.15,
  },

  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
