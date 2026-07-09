import React, { useRef, useCallback, useEffect, memo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  Animated, Platform, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { useTheme } from '../../theme';
import { getTodayVerseEntry } from '../../services/verseService';
import { RootStackParamList } from '../../types/navigation';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const HERO_H     = Math.round(SCREEN_W * 0.72);
const CARD_H     = Math.round(SCREEN_W * 0.68);
const CARD_GAP   = 14;
const PARALLAX   = 28;
const GOLD       = '#C9A96B';
const SERIF      = Platform.OS === 'ios' ? 'Georgia' : 'serif';
// Card 0 starts at HERO_H + 16 (marginBottom on hero)
const CARD_ORIGIN = HERO_H + 16;

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// ─── Feature definitions ──────────────────────────────────────────────────────

interface FeatureDef {
  id:          string;
  eyebrow:     string;
  title:       string;
  description: string;
  icon:        string;
  color:       string;
  image:       number;
  navigate:    (nav: NavProp) => void;
}

const FEATURES: FeatureDef[] = [
  {
    id:          'bible',
    eyebrow:     'SCRIPTURE',
    title:       'Bible',
    description: 'Read in KJV, Asante Twi, and Akuapem Twi. A beautifully crafted, distraction-free reader built for deep, unhurried reflection.',
    icon:        'book-outline',
    color:       '#7B9FE8',
    image:       require('../../assets/open-bible-in-the-morning.jpg'),
    navigate:    (nav) => (nav as any).navigate('MainTabs', { screen: 'BibleTab' }),
  },
  {
    id:          'stories',
    eyebrow:     'FAITH STORIES',
    title:       'Stories',
    description: 'Walk alongside Abraham, David, Ruth, and the cloud of witnesses. Illustrated narratives that bring the Word to life.',
    icon:        'images-outline',
    color:       '#D4956A',
    image:       require('../../assets/apostles.jpg'),
    navigate:    (nav) => nav.navigate('Stories'),
  },
  {
    id:          'insights',
    eyebrow:     'AI POWERED',
    title:       'Scripture Insights',
    description: 'Uncover the historical setting, theological depth, and personal application of any verse — illuminated by intelligent analysis.',
    icon:        'sparkles-outline',
    color:       GOLD,
    image:       require('../../assets/today-verse.jpg'),
    navigate:    (nav) => {
      const e = getTodayVerseEntry();
      nav.navigate('ScriptureInsights', { reference: e.label, contextType: 'verse', context: e.fallbackText });
    },
  },
  {
    id:          'sermon',
    eyebrow:     'MESSAGE CRAFTING',
    title:       'Sermon Builder',
    description: 'Craft compelling, scripture-grounded messages with AI guidance. From topic and outline to a full sermon — in minutes.',
    icon:        'mic-outline',
    color:       '#C4A96B',
    image:       require('../../assets/stones.jpg'),
    navigate:    (nav) => nav.navigate('SermonBuilder'),
  },
  {
    id:          'hymns',
    eyebrow:     'WORSHIP',
    title:       'Hymnal',
    description: 'A treasury of timeless hymns of faith. Explore lyrics, discover history, and let the songs of the Church lift your spirit.',
    icon:        'musical-notes-outline',
    color:       '#D4A96A',
    image:       require('../../assets/intro-background.jpg'),
    navigate:    (nav) => nav.navigate('Hymns'),
  },
  {
    id:          'chat',
    eyebrow:     'AI CONVERSATION',
    title:       'Scripture Chat',
    description: 'Ask questions, explore themes, and deepen your understanding through an intelligent, scripture-focused dialogue partner.',
    icon:        'chatbubble-ellipses-outline',
    color:       '#A897CC',
    image:       require('../../assets/hands-cluds.jpg'),
    navigate:    (nav) => {
      const e = getTodayVerseEntry();
      nav.navigate('ScriptureChat', { reference: e.label, contextType: 'verse', context: e.fallbackText || '' });
    },
  },
];

// ─── Feature Card ─────────────────────────────────────────────────────────────

const FeatureCard = memo(function FeatureCard({
  feature, index, scrollY, fadeAnim, slideAnim, onPress,
}: {
  feature:   FeatureDef;
  index:     number;
  scrollY:   Animated.Value;
  fadeAnim:  Animated.Value;
  slideAnim: Animated.Value;
  onPress:   () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressIn  = useCallback(() =>
    Animated.spring(scaleAnim, { toValue: 0.975, useNativeDriver: true, tension: 280, friction: 16 }).start(), []);
  const pressOut = useCallback(() =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 280, friction: 16 }).start(), []);

  // Card's top y-position in the ScrollView content
  const cardTop = CARD_ORIGIN + index * (CARD_H + CARD_GAP);

  // Parallax: as card moves up (scroll increases), image translateY increases
  // (image moves down relative to card = image lags behind = depth effect)
  const imgY = scrollY.interpolate({
    inputRange:  [cardTop - SCREEN_H, cardTop + CARD_H],
    outputRange: [PARALLAX, -PARALLAX],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={{
      opacity:       fadeAnim,
      transform:     [{ translateY: slideAnim }, { scale: scaleAnim }],
      marginBottom:  CARD_GAP,
    }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Open ${feature.title}`}
      >
        <View style={fc.card}>
          {/* Parallax image — extends beyond card so movement doesn't expose bg */}
          <Animated.View style={[
            fc.imgLayer,
            { transform: [{ translateY: imgY }] },
          ]}>
            <ExpoImage
              source={feature.image}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              cachePolicy="memory-disk"
              priority={index < 3 ? 'high' : 'normal'}
              transition={280}
            />
          </Animated.View>

          {/* Top safety scrim */}
          <LinearGradient
            colors={['rgba(0,0,0,0.52)', 'rgba(0,0,0,0)'] as const}
            locations={[0, 0.38]}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Bottom content scrim */}
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.22)', 'rgba(0,0,0,0.88)'] as const}
            locations={[0, 0.32, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Content */}
          <View style={fc.content}>
            <View style={fc.eyebrowRow}>
              <View style={[fc.iconBadge, {
                backgroundColor: feature.color + '26',
                borderColor:     feature.color + '55',
              }]}>
                <Ionicons name={feature.icon as any} size={14} color={feature.color} />
              </View>
              <Text style={fc.eyebrow}>{feature.eyebrow}</Text>
            </View>

            <Text style={[fc.title, { fontFamily: SERIF }]} numberOfLines={1}>
              {feature.title}
            </Text>

            <Text style={fc.description} numberOfLines={3}>
              {feature.description}
            </Text>

            <View style={[fc.pill, {
              borderColor:     feature.color + '65',
              backgroundColor: feature.color + '1A',
            }]}>
              <Text style={[fc.pillText, { color: feature.color }]}>Explore</Text>
              <Ionicons name="arrow-forward" size={11} color={feature.color} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const fc = StyleSheet.create({
  card: {
    height: CARD_H, borderRadius: 22, overflow: 'hidden',
  },
  imgLayer: {
    position: 'absolute',
    top:    -PARALLAX,
    left:   0,
    right:  0,
    bottom: -PARALLAX,
  },
  content: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 22, paddingBottom: 26, gap: 7,
  },
  eyebrowRow: {
    flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 4,
  },
  iconBadge: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  eyebrow: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.8,
    color: 'rgba(255,255,255,0.58)',
  },
  title: {
    fontSize: 34, fontWeight: '400', letterSpacing: -0.6,
    color: 'rgba(255,255,255,0.96)', lineHeight: 42,
  },
  description: {
    fontSize: 13, color: 'rgba(255,255,255,0.58)',
    lineHeight: 21, fontWeight: '400',
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, marginTop: 4,
  },
  pillText: { fontSize: 12, fontWeight: '600' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const t          = useTheme();
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const isDark     = t.statusBar === 'light-content';
  const rootBg     = isDark ? '#060810' : '#0A0C1A';

  const scrollY   = useRef(new Animated.Value(0)).current;

  // Hero parallax — image moves at 28% of scroll speed
  const heroImgY = scrollY.interpolate({
    inputRange:  [0, HERO_H],
    outputRange: [0, -HERO_H * 0.28],
    extrapolate: 'clamp',
  });

  // Staggered card entrance animations
  const fadeAnims  = useRef(FEATURES.map(() => new Animated.Value(0))).current;
  const slideAnims = useRef(FEATURES.map(() => new Animated.Value(36))).current;

  useEffect(() => {
    Animated.stagger(88, FEATURES.map((_, i) =>
      Animated.parallel([
        Animated.timing(fadeAnims[i], {
          toValue: 1, duration: 500, useNativeDriver: true,
        }),
        Animated.spring(slideAnims[i], {
          toValue: 0, tension: 140, friction: 20, useNativeDriver: true,
        }),
      ])
    )).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: rootBg }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: Math.max(insets.bottom, 20) + 120,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* ── Cinematic Hero ── */}
        <View style={{ marginHorizontal: -16, marginBottom: 16 }}>
          <View style={{ height: HERO_H, overflow: 'hidden', backgroundColor: '#04060E' }}>
            {/* Parallax image */}
            <Animated.View style={[
              StyleSheet.absoluteFillObject,
              { bottom: -HERO_H * 0.28, transform: [{ translateY: heroImgY }] },
            ]}>
              <ExpoImage
                source={require('../../assets/dove.jpg')}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                cachePolicy="memory-disk"
                priority="high"
                transition={0}
              />
            </Animated.View>

            {/* Top scrim */}
            <LinearGradient
              colors={['rgba(0,0,0,0.60)', 'rgba(0,0,0,0)'] as const}
              locations={[0, 0.30]}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Bottom scrim */}
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.20)', 'rgba(0,0,0,0.88)'] as const}
              locations={[0.28, 0.60, 1]}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Back button */}
            <TouchableOpacity
              style={[hs.backBtn, { top: insets.top + 10 }]}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.75}
            >
              <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.90)" />
            </TouchableOpacity>

            {/* Hero content */}
            <View style={hs.heroContent}>
              <View style={hs.eyebrowRow}>
                <Ionicons name="compass-outline" size={11} color={GOLD} />
                <Text style={hs.eyebrow}>DISCOVER</Text>
              </View>
              <Text style={[hs.heroTitle, { fontFamily: SERIF }]}>
                Everything{'\n'}in One Place
              </Text>
              <Text style={hs.heroSub}>
                Six powerful tools for your spiritual journey
              </Text>
            </View>
          </View>
        </View>

        {/* ── Feature Cards ── */}
        {FEATURES.map((feature, i) => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            index={i}
            scrollY={scrollY}
            fadeAnim={fadeAnims[i]}
            slideAnim={slideAnims[i]}
            onPress={() => feature.navigate(navigation)}
          />
        ))}
      </Animated.ScrollView>
    </View>
  );
}

const hs = StyleSheet.create({
  backBtn: {
    position: 'absolute', left: 20,
    width: 38, height: 38, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingBottom: 28, gap: 6,
  },
  eyebrowRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  eyebrow:      { fontSize: 10, fontWeight: '700', letterSpacing: 2.0, color: GOLD },
  heroTitle: {
    fontSize: 38, fontWeight: '400', letterSpacing: -0.8,
    color: 'rgba(255,255,255,0.96)', lineHeight: 48,
  },
  heroSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.50)',
    fontWeight: '400', letterSpacing: 0.1,
  },
});
