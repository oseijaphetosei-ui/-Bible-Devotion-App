import React, { useRef, useState, useCallback, useEffect, memo, useMemo } from 'react';
import * as Speech from 'expo-speech';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, Animated, Easing, Dimensions, Platform,
  ImageBackground, Image, Share as RNShare,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTodayVerseEntry } from '../../services/verseService';
import { loadGoals, isCompletedToday } from '../../services/goalsService';
import { Goal } from '../../types/goal';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../theme';
import ProfileAvatar from '../../components/ProfileAvatar';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sanitizeForSpeech(raw: string): string {
  return raw
    .replace(/–/g, ' to ').replace(/—/g, ', ')
    .replace(/\b(\d+):(\d+)\b/g, 'chapter $1 verse $2')
    .replace(/\s*\(([^)]+)\)\s*/g, ', $1, ')
    .replace(/[""]/g, '').replace(/['']/g, "'")
    .replace(/…|\.\.\./g, ', ').replace(/;/g, ',')
    .replace(/(\d+)-(\d+)/g, '$1 to $2')
    .replace(/,\s*,/g, ',').replace(/,\s*([.!?])/g, '$1')
    .replace(/\s+/g, ' ').trim();
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

function getWeekDays() {
  const today = new Date();
  const dow = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return { label: ['S','M','T','W','T','F','S'][i], date: d.getDate(), isToday: i === dow };
  });
}

// ─── Today's Verse Card ───────────────────────────────────────────────────────

const VerseCard = memo(function VerseCard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const verse = getTodayVerseEntry();
  const [speaking, setSpeaking] = useState(false);
  const speakingRef = useRef(false);

  useEffect(() => {
    return () => { Speech.stop(); speakingRef.current = false; };
  }, []);

  const handleListen = useCallback(() => {
    if (speakingRef.current) {
      Speech.stop();
      speakingRef.current = false;
      setSpeaking(false);
      return;
    }
    const text = `${sanitizeForSpeech(verse.label)}. ${sanitizeForSpeech(verse.fallbackText)}`;
    speakingRef.current = true;
    setSpeaking(true);
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.88,
      onDone:    () => { speakingRef.current = false; setSpeaking(false); },
      onStopped: () => { speakingRef.current = false; setSpeaking(false); },
      onError:   () => { speakingRef.current = false; setSpeaking(false); },
    });
  }, [verse]);

  const handleShare = useCallback(async () => {
    try {
      await RNShare.share({ message: `"${verse.fallbackText}"\n— ${verse.label}` });
    } catch { /* cancelled */ }
  }, [verse]);

  const handleChat = useCallback(() => {
    navigation.navigate('ScriptureChat', {
      reference: verse.label,
      contextType: 'verse',
      context: `${verse.label}\n\n"${verse.fallbackText}"`,
    });
  }, [navigation, verse]);

  return (
    <View style={s.verseCard}>
      <ImageBackground
        source={require('../../assets/today-verse.jpg')}
        style={s.verseCardBg}
        resizeMode="cover"
      >
        {/* Base dark veil for contrast */}
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(4,6,18,0.42)' }]} />
        {/* Gradient: light top → heavy bottom so text is always readable */}
        <LinearGradient
          colors={['rgba(0,0,0,0.10)', 'rgba(0,0,0,0.52)', 'rgba(0,0,0,0.86)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={s.verseCardContent}>
          {/* Meta: label + reference */}
          <View style={s.verseMeta}>
            <Text style={s.verseLabel}>Verse of the Day</Text>
            <Text style={s.verseRef}>{verse.label}</Text>
          </View>

          {/* Verse text — large, immersive */}
          <Text style={s.verseText}>{verse.fallbackText.replace(/^[""]+|[""]+$/g, '').trim()}</Text>

          {/* Action bar */}
          <View style={s.verseActions}>
            <TouchableOpacity style={s.verseAction} onPress={() => navigation.navigate('Verse')} activeOpacity={0.72}>
              <Ionicons name="book-outline" size={24} color="rgba(255,255,255,0.88)" />
              <Text style={s.verseActionLabel}>Read</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.verseAction} onPress={handleChat} activeOpacity={0.72}>
              <Ionicons name="sparkles-outline" size={24} color="rgba(255,255,255,0.88)" />
              <Text style={s.verseActionLabel}>AI Insights</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.verseAction} onPress={handleListen} activeOpacity={0.72}>
              <Ionicons
                name={speaking ? 'stop-circle-outline' : 'headset-outline'}
                size={24}
                color={speaking ? '#C9A96B' : 'rgba(255,255,255,0.88)'}
              />
              <Text style={[s.verseActionLabel, speaking && { color: '#C9A96B' }]}>
                {speaking ? 'Stop' : 'Listen'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.verseAction} onPress={handleShare} activeOpacity={0.72}>
              <Ionicons name="share-outline" size={24} color="rgba(255,255,255,0.88)" />
              <Text style={s.verseActionLabel}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
});

// ─── Content card (Devotion, Goals, Prayer…) ─────────────────────────────────
// Matches the "Guided Scripture" card from the reference screenshot.

type ContentCardProps = {
  metaIcon: string;
  metaValue: string;
  category: string;
  title: string;
  subtitle: string;
  image: any;
  onPress: () => void;
};

const ContentCard = memo(function ContentCard({
  metaIcon, metaValue, category, title, subtitle, image, onPress,
}: ContentCardProps) {
  const t = useTheme();
  return (
    <TouchableOpacity
      style={[s.contentCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}
      onPress={onPress}
      activeOpacity={0.86}
    >
      <View style={s.contentLeft}>
        <View style={s.contentTopRow}>
          <Text style={s.contentMetaIcon}>{metaIcon}</Text>
          <Text style={[s.contentMetaValue, { color: t.textMuted }]}>{metaValue}</Text>
        </View>
        <Text style={[s.contentCategory, { color: t.textMuted }]}>{category}</Text>
        <Text style={[s.contentTitle, { color: t.text }]} numberOfLines={2}>{title}</Text>
        <View style={s.contentSubRow}>
          <Ionicons name="play" size={9} color={t.textMuted} />
          <Text style={[s.contentSubText, { color: t.textMuted }]}>{subtitle}</Text>
        </View>
      </View>
      <Image source={image} style={s.contentImage} resizeMode="cover" />
    </TouchableOpacity>
  );
});

// ─── Spiritual Goals Card ─────────────────────────────────────────────────────
// Pulls live goal data; same visual shell as ContentCard.

const GoalsCard = memo(function GoalsCard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useTheme();
  const [goals, setGoals] = useState<Goal[]>([]);

  useFocusEffect(useCallback(() => { loadGoals().then(setGoals); }, []));

  const completed = goals.filter(isCompletedToday).length;
  const firstGoal = goals[0];

  return (
    <TouchableOpacity
      style={[s.contentCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}
      onPress={() => navigation.navigate('Goals')}
      activeOpacity={0.86}
    >
      <View style={s.contentLeft}>
        <View style={s.contentTopRow}>
          <Text style={s.contentMetaIcon}>🎯</Text>
          <Text style={[s.contentMetaValue, { color: t.textMuted }]}>
            {goals.length > 0 ? `${completed}/${goals.length}` : '0'}
          </Text>
        </View>
        <Text style={[s.contentCategory, { color: t.textMuted }]}>Spiritual Goals</Text>
        <Text style={[s.contentTitle, { color: t.text }]} numberOfLines={2}>
          {firstGoal ? firstGoal.title : 'Set your daily goals'}
        </Text>
        {goals.length > 0 ? (
          <>
            <View style={[s.goalsProgressTrack, { backgroundColor: t.progressTrack }]}>
              <View style={[
                s.goalsProgressFill,
                {
                  backgroundColor: t.gold,
                  width: `${goals.length > 0 ? (completed / goals.length) * 100 : 0}%` as any,
                },
              ]} />
            </View>
            <Text style={[s.contentSubText, { color: t.textMuted, marginTop: 4 }]}>
              {completed} completed today
            </Text>
          </>
        ) : (
          <View style={s.contentSubRow}>
            <Ionicons name="add-circle-outline" size={9} color={t.textMuted} />
            <Text style={[s.contentSubText, { color: t.textMuted }]}>Get started</Text>
          </View>
        )}
      </View>
      <Image source={require('../../assets/dove.jpg')} style={s.contentImage} resizeMode="cover" />
    </TouchableOpacity>
  );
});

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useTheme();

  // These are pure functions of the current time — stable for the life of this mount.
  const greeting = useMemo(() => getGreeting(), []);
  const today    = useMemo(() => new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  }), []);
  const weekDays = useMemo(() => getWeekDays(), []);

  // Entrance animation for quick-nav cards (still scroll-triggered)
  const cardOpacity    = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(32)).current;
  const hasAnimated    = useRef(false);
  const cardSectionRef = useRef<View>(null);

  const triggerCardAnim = useCallback(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    Animated.parallel([
      Animated.timing(cardOpacity,    { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(cardTranslateY, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const checkVisibility = useCallback(() => {
    if (hasAnimated.current || !cardSectionRef.current) return;
    const screenH = Dimensions.get('window').height;
    cardSectionRef.current.measure((_x, _y, _w, height, _px, pageY) => {
      if (height <= 0) return;
      const visible = Math.max(0, Math.min(pageY + height, screenH) - Math.max(pageY, 0));
      if (visible / height >= 0.35) triggerCardAnim();
    });
  }, [triggerCardAnim]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        {/* ── Header ── */}
        <View style={s.header}>
          <ProfileAvatar />
          <View style={s.greetingBlock}>
            <Text style={[s.greeting, { color: t.text }]}>{greeting}</Text>
            <Text style={[s.date, { color: t.textSub }]}>{today}</Text>
          </View>
        </View>

        {/* ── Streak banner ── */}
        <View style={s.streakCard}>
          <View style={s.streakInner}>
            <View style={s.streakTopRow}>
              <Text style={s.streakEmoji}>🔥</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.streakTitle, { color: t.text }]}>7-Day Streak</Text>
                <Text style={[s.streakSub, { color: t.textSub }]}>Keep it going — read today's content below</Text>
              </View>
              <View style={[s.streakBadge, { backgroundColor: t.gold }]}>
                <Text style={[s.streakBadgeText, { color: t.bg }]}>7</Text>
              </View>
            </View>

            <View style={s.weekRow}>
              {weekDays.map((d, i) => (
                <View key={i} style={s.weekDayCol}>
                  <Text style={[s.weekDayLabel, { color: t.textMuted }]}>{d.label}</Text>
                  <View style={[
                    s.weekDayCircle,
                    { backgroundColor: t.weekCircleBg, borderColor: t.weekCircleBorder },
                    d.isToday && { backgroundColor: t.weekCircleActiveBg, borderColor: t.goldBorder },
                  ]}>
                    <Text style={[
                      s.weekDayNum, { color: t.textMuted },
                      d.isToday && { color: t.gold, fontWeight: '700' },
                    ]}>
                      {d.date}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={s.progressRow}>
              <Text style={[s.progressLabel, { color: t.textSub }]}>Progress today</Text>
              <Text style={[s.progressPct, { color: t.gold }]}>0%</Text>
            </View>
            <View style={[s.progressTrack, { backgroundColor: t.progressTrack }]}>
              <View style={[s.progressFill, { width: '0%', backgroundColor: t.gold }]} />
            </View>
          </View>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          onScroll={checkVisibility}
          scrollEventThrottle={16}
        >
          {/* ── Today's Verse — large immersive card ── */}
          <VerseCard />

          {/* ── Daily Devotion ── */}
          <ContentCard
            metaIcon="🔥"
            metaValue="0"
            category="Daily Devotion"
            title="Finding Peace in God's Presence"
            subtitle="2–5 min"
            image={require('../../assets/man-clouds.jpg')}
            onPress={() => navigation.navigate('Devotion', undefined)}
          />

          {/* ── Spiritual Goals ── */}
          <GoalsCard />

          {/* ── Explore section ── */}
          <Text style={[s.sectionLabel, { color: t.textMuted, marginTop: 6 }]}>EXPLORE</Text>

          <View ref={cardSectionRef} onLayout={checkVisibility}>
            <Animated.View
              style={[
                s.quickNavRow,
                { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] },
              ]}
            >
              <TouchableOpacity
                style={[s.quickNavItem, { backgroundColor: t.card, borderColor: t.cardBorder }]}
                onPress={() => navigation.navigate('Stories')}
              >
                <Image source={require('../../assets/group-story-by-fire.jpg')} style={s.quickNavImage} />
                <Text style={[s.quickNavLabel, { color: t.cardLabel }]}>Stories</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.quickNavItem, { backgroundColor: t.card, borderColor: t.cardBorder }]}
                onPress={() => {
                  const v = getTodayVerseEntry();
                  navigation.navigate('ScriptureChat', {
                    reference: v.label,
                    contextType: 'verse',
                    context: `${v.label}\n\n"${v.fallbackText}"`,
                  });
                }}
              >
                <Image
                  source={require('../../assets/talk-to-scripture.jpg')}
                  style={s.quickNavImage}
                  resizeMode="cover"
                />
                <Text style={[s.quickNavLabel, { color: t.cardLabel }]}>Talk to Scripture</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:    { flex: 1 },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 120 },

  // Header
  header:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  greetingBlock: { flex: 1 },
  greeting:      { fontSize: 22, fontWeight: '700' },
  date:          { fontSize: 13, marginTop: 2 },

  // Streak
  streakCard:      { marginHorizontal: 16, marginBottom: 14 },
  streakInner:     { padding: 16, paddingTop: 14, gap: 12 },
  streakTopRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakEmoji:     { fontSize: 22 },
  streakTitle:     { fontWeight: '700', fontSize: 14 },
  streakSub:       { fontSize: 12, marginTop: 1 },
  streakBadge:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  streakBadgeText: { fontWeight: '800', fontSize: 15 },

  weekRow:      { flexDirection: 'row', justifyContent: 'space-between' },
  weekDayCol:   { alignItems: 'center', gap: 4 },
  weekDayLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  weekDayCircle: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  weekDayNum: { fontSize: 13, fontWeight: '500' },

  progressRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progressLabel: { fontSize: 12, fontWeight: '500' },
  progressPct:  { fontSize: 12, fontWeight: '700' },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  progressFill:  { height: 4, borderRadius: 2 },

  // Section label
  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.4,
    marginBottom: 10, marginTop: 4,
  },

  // ── Today's Verse card ──
  verseCard: {
    borderRadius: 20, overflow: 'hidden', marginBottom: 14,
    // Shadow
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28, shadowRadius: 14, elevation: 8,
  },
  verseCardBg: { width: '100%', minHeight: 380 },
  verseCardContent: {
    flex: 1, padding: 22, paddingTop: 26, paddingBottom: 18,
    justifyContent: 'space-between',
    minHeight: 380,
  },
  verseMeta: { gap: 6, marginBottom: 8 },
  verseLabel: {
    fontSize: 12, color: 'rgba(255,255,255,0.60)',
    letterSpacing: 0.4,
  },
  verseRef: {
    fontSize: 20, fontWeight: '800', color: '#fff',
    letterSpacing: 0.3,
  },
  verseText: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 24, lineHeight: 38,
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 0.15,
    paddingVertical: 16,
  },
  verseActions: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingTop: 16, marginTop: 4,
  },
verseAction:      { alignItems: 'center', gap: 5 },
  verseActionLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.70)',
    fontWeight: '500', letterSpacing: 0.2,
  },

  // ── Content card (Devotion, Goals) ──
  contentCard: {
    flexDirection: 'row', borderRadius: 16, borderWidth: 1,
    padding: 16, gap: 14, marginBottom: 10,
    alignItems: 'center',
    // Shadow
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  contentLeft:     { flex: 1, gap: 3 },
  contentTopRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  contentMetaIcon: { fontSize: 16 },
  contentMetaValue: { fontSize: 13, fontWeight: '600' },
  contentCategory: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase' },
  contentTitle:    { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  contentSubRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  contentSubText:  { fontSize: 11 },
  contentImage: {
    width: 88, height: 88, borderRadius: 12,
  },

  // Goals progress bar (inside content card left)
  goalsProgressTrack: { height: 3, borderRadius: 2, marginTop: 6, marginBottom: 0 },
  goalsProgressFill:  { height: 3, borderRadius: 2 },

  // ── Quick nav ──
  quickNavRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  quickNavItem: {
    flex: 1, alignItems: 'center', borderRadius: 16,
    overflow: 'hidden', paddingBottom: 12, borderWidth: 1,
  },
  quickNavImage: { width: '100%', height: 90, marginBottom: 10 },
  quickNavLabel: { fontSize: 13, fontWeight: '600' },
});
