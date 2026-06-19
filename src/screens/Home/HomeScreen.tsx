import React, { useRef, useState, useCallback, useEffect, useMemo, memo } from 'react';
import * as Speech from 'expo-speech';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  LayoutChangeEvent,
  Dimensions,
  ImageBackground,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTodayVerseEntry } from '../../services/verseService';
import { loadGoals, calcStreak, isCompletedToday } from '../../services/goalsService';
import { Goal } from '../../types/goal';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../theme';
import ProfileAvatar from '../../components/ProfileAvatar';

function sanitizeForSpeech(raw: string): string {
  return raw
    .replace(/–/g, ' to ')
    .replace(/—/g, ', ')
    .replace(/\b(\d+):(\d+)\b/g, 'chapter $1 verse $2')
    .replace(/\s*\(([^)]+)\)\s*/g, ', $1, ')
    .replace(/[""]/g, '')
    .replace(/['']/g, "'")
    .replace(/…|\.\.\./g, ', ')
    .replace(/;/g, ',')
    .replace(/(\d+)-(\d+)/g, '$1 to $2')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*([.!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

function getWeekDays() {
  const today = new Date();
  const dow = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return { label: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][i], date: d.getDate(), isToday: i === dow };
  });
}

type SectionId = 'verse' | 'devotion' | 'goals';

type AccordionSection = {
  id: SectionId;
  icon: string;
  title: string;
  meta: string;
  thumbnail: any;
};

const SECTIONS: AccordionSection[] = [
  {
    id: 'verse',
    icon: '📖',
    title: "Today's Verse",
    meta: '2 MIN',
    thumbnail: require('../../assets/today-verse.jpg'),
  },
  {
    id: 'devotion',
    icon: '✦',
    title: 'Daily Devotion',
    meta: '5 MIN',
    thumbnail: require('../../assets/man-clouds.jpg'),
  },
  {
    id: 'goals',
    icon: '🎯',
    title: 'Spiritual Goals',
    meta: '7-day streak',
    thumbnail: require('../../assets/dove.jpg'),
  },
];

const VerseContent = memo(function VerseContent() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const verse = getTodayVerseEntry();
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => { return () => { Speech.stop(); }; }, []);

  const handleReadAloud = () => {
    if (speaking) { Speech.stop(); setSpeaking(false); return; }
    const text = `${sanitizeForSpeech(verse.label)}. ${sanitizeForSpeech(verse.fallbackText)}`;
    setSpeaking(true);
    Speech.speak(text, {
      language: 'en', pitch: 1.0, rate: 0.9,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  return (
    <View style={styles.expandedOverlay}>
      <Text style={styles.expandedTitle}>{verse.label}</Text>
      <Text style={styles.expandedVerseText}>{verse.fallbackText}</Text>
      <View style={styles.tagRow}>
        {verse.tags.map(tag => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
      <View style={styles.expandedActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Verse')}>
          <Text style={styles.actionBtnText}>📖  Read</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]} onPress={handleReadAloud}>
          <Text style={[styles.actionBtnText, styles.actionBtnOutlineText]}>
            {speaking ? '⏹  Stop' : '🔊  Read aloud'}
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.talkBtn}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('ScriptureChat', {
          reference: verse.label,
          contextType: 'verse',
          context: `${verse.label}\n\n"${verse.fallbackText}"`,
        })}
      >
        <Ionicons name="chatbubbles-outline" size={16} color="#fff" />
        <Text style={styles.talkBtnText}>Talk to the Scripture</Text>
      </TouchableOpacity>
    </View>
  );
});

const DevotionContent = memo(function DevotionContent() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tags = ['FAITH', 'TRUST', 'DAILY WALK'];
  return (
    <View style={styles.expandedOverlay}>
      <Text style={styles.expandedTitle}>Finding Peace in God's Presence</Text>
      <Text style={styles.expandedSubtitle}>
        Today's devotion explores what it means to fully surrender and trust in God's plan.
      </Text>
      <View style={styles.tagRow}>
        {tags.map(t => (
          <View key={t} style={styles.tag}>
            <Text style={styles.tagText}>{t}</Text>
          </View>
        ))}
      </View>
      <View style={styles.expandedActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Devotion', undefined)}>
          <Text style={styles.actionBtnText}>✦  Read Devotion</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const GoalsContent = memo(function GoalsContent() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [goals, setGoals] = React.useState<Goal[]>([]);

  useFocusEffect(
    useCallback(() => { loadGoals().then(setGoals); }, [])
  );

  const preview = goals.slice(0, 2);
  const completedCount = useMemo(() => goals.filter(isCompletedToday).length, [goals]);

  return (
    <View style={styles.expandedPlain}>
      {goals.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 12, gap: 10 }}>
          <Text style={styles.goalStreak}>No goals set yet.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Goals')}>
            <Text style={styles.primaryBtnText}>Set Goals</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.goalStreak}>{completedCount}/{goals.length} completed today</Text>
          {preview.map((goal, i) => {
            const streak = calcStreak(goal.completedDates);
            const pct = Math.min(1, streak / goal.target);
            return (
              <View key={goal.id} style={[styles.goalRow, i < preview.length - 1 && styles.goalRowBorder]}>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalStreak}>{streak > 0 ? `${streak}-day streak 🔥` : 'No streak yet'}</Text>
                </View>
                <View style={styles.goalRight}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${pct * 100}%` as any }]} />
                  </View>
                  <Text style={styles.goalTarget}>{streak}/{goal.target}d</Text>
                </View>
              </View>
            );
          })}
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Goals')}>
            <Text style={styles.primaryBtnText}>View All Goals</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
});

function renderContent(id: SectionId) {
  switch (id) {
    case 'verse': return <VerseContent />;
    case 'devotion': return <DevotionContent />;
    case 'goals': return <GoalsContent />;
  }
}

type AccordionItemProps = {
  section: AccordionSection;
  isOpen: boolean;
  onToggle: () => void;
};

const EASE = Easing.bezier(0.4, 0.0, 0.2, 1.0);
const DURATION = 300;

const AccordionItem = memo(function AccordionItem({ section, isOpen, onToggle }: AccordionItemProps) {
  const t = useTheme();

  const animHeight  = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;
  const animChevron = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  const bodyHeight = useRef(0);
  const isOpenRef  = useRef(isOpen);
  const [measured, setMeasured] = useState(false);

  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  // Ghost view is absolutely positioned + invisible so it measures content
  // height without being inside the height:0 clip container (where onLayout
  // would not fire). Removed from the tree once we have the measurement.
  const onGhostLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h <= 0) return;
    bodyHeight.current = h;
    // Snap animated values to correct initial state — no visible flash
    animHeight.setValue(isOpenRef.current ? h : 0);
    animOpacity.setValue(isOpenRef.current ? 1 : 0);
    setMeasured(true);
  }, []);

  useEffect(() => {
    if (!measured || bodyHeight.current === 0) return;

    // JS thread: height clip
    Animated.timing(animHeight, {
      toValue: isOpen ? bodyHeight.current : 0,
      duration: DURATION,
      easing: EASE,
      useNativeDriver: false,
    }).start();
    // native thread: opacity + chevron rotation
    Animated.parallel([
      Animated.timing(animOpacity, {
        toValue: isOpen ? 1 : 0,
        duration: isOpen ? DURATION - 40 : DURATION - 100,
        delay: isOpen ? 40 : 0,
        easing: EASE,
        useNativeDriver: true,
      }),
      Animated.timing(animChevron, {
        toValue: isOpen ? 1 : 0,
        duration: DURATION,
        easing: EASE,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen, measured]);

  const chevronRotate = animChevron.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <View
      style={[
        styles.accordionWrap,
        { borderColor: isOpen ? 'rgba(201,169,107,0.50)' : t.cardBorder },
      ]}
    >
      <ImageBackground source={section.thumbnail} style={styles.accordionCardBg}>
        <View style={styles.cardOverlay}>
          <TouchableOpacity
            style={styles.accordionBar}
            onPress={onToggle}
            activeOpacity={0.8}
          >
            <View style={styles.barLeft}>
              <Text style={styles.barIcon}>{section.icon}</Text>
              <View>
                <Text style={styles.barTitle}>{section.title}</Text>
                <Text style={styles.barMeta}>{section.meta}</Text>
              </View>
            </View>
            <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
              <Text style={styles.chevron}>›</Text>
            </Animated.View>
          </TouchableOpacity>

          {/* Ghost measurement view: absolutely positioned + invisible so it
              lays out at natural content height regardless of the clip container */}
          {!measured && (
            <View style={styles.measureGhost} onLayout={onGhostLayout} pointerEvents="none">
              {renderContent(section.id)}
            </View>
          )}

          {/* Animated clip container */}
          <Animated.View style={{ height: animHeight, overflow: 'hidden' }}>
            <Animated.View style={{ opacity: animOpacity }}>
              {renderContent(section.id)}
            </Animated.View>
          </Animated.View>
        </View>
      </ImageBackground>
    </View>
  );
});

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useTheme();
  const [openId, setOpenId] = useState<SectionId | null>('verse');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const weekDays = getWeekDays();

  const toggle = useCallback((id: SectionId) => {
    setOpenId(prev => (prev === id ? null : id));
  }, []);

  // ── Card entrance animation ───────────────────────────────────────────────
  const cardOpacity    = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(40)).current;
  const cardScale      = useRef(new Animated.Value(0.94)).current;
  const hasAnimated    = useRef(false);
  const cardSectionRef = useRef<View>(null);

  const triggerCardAnim = useCallback(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    console.log('[Cards] Animation triggered');
    Animated.parallel([
      Animated.timing(cardOpacity,    { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(cardTranslateY, { toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(cardScale,      { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const checkVisibility = useCallback(() => {
    if (hasAnimated.current || !cardSectionRef.current) return;
    const screenH = Dimensions.get('window').height;
    cardSectionRef.current.measure((_x, _y, _w, height, _px, pageY) => {
      if (height <= 0) return;
      const visibleTop    = Math.max(pageY, 0);
      const visibleBottom = Math.min(pageY + height, screenH);
      const visiblePx     = Math.max(0, visibleBottom - visibleTop);
      const visibleFraction = visiblePx / height;
      console.log(`[Cards] Visibility: ${Math.round(visibleFraction * 100)}%`);
      if (visibleFraction >= 0.4) triggerCardAnim();
    });
  }, [triggerCardAnim]);

  const onCardsLayout = useCallback(() => {
    console.log('[Cards] Section mounted');
    checkVisibility();
  }, [checkVisibility]);

  const onScroll = useCallback(() => {
    checkVisibility();
  }, [checkVisibility]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        {/* Header */}
        <View style={styles.header}>
          <ProfileAvatar />
          <View style={styles.greetingBlock}>
            <Text style={[styles.greeting, { color: t.text }]}>{getGreeting()}</Text>
            <Text style={[styles.date, { color: t.textSub }]}>{today}</Text>
          </View>
        </View>

        {/* Streak banner — no card, content sits directly on background */}
        <View style={styles.streakCard}>
          <View style={styles.streakInner}>
            <View style={styles.streakTopRow}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.streakTitle, { color: t.text }]}>7-Day Streak</Text>
                <Text style={[styles.streakSub, { color: t.textSub }]}>Keep it going — open today's content below</Text>
              </View>
              <View style={[styles.streakBadge, { backgroundColor: t.gold }]}>
                <Text style={[styles.streakBadgeText, { color: t.bg }]}>7</Text>
              </View>
            </View>

            <View style={styles.weekRow}>
              {weekDays.map((d, i) => (
                <View key={i} style={styles.weekDayCol}>
                  <Text style={[styles.weekDayLabel, { color: t.textMuted }]}>{d.label}</Text>
                  <View style={[
                    styles.weekDayCircle,
                    { backgroundColor: t.weekCircleBg, borderColor: t.weekCircleBorder },
                    d.isToday && { backgroundColor: t.weekCircleActiveBg, borderColor: t.goldBorder },
                  ]}>
                    <Text style={[
                      styles.weekDayNum,
                      { color: t.textMuted },
                      d.isToday && { color: t.gold, fontWeight: '700' },
                    ]}>
                      {d.date}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.progressRow}>
              <Text style={[styles.progressLabel, { color: t.textSub }]}>Progress today</Text>
              <Text style={[styles.progressPctGold, { color: t.gold }]}>0%</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: t.progressTrack }]}>
              <View style={[styles.progressFill, { width: '0%', backgroundColor: t.gold }]} />
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {/* Accordion sections */}
          {SECTIONS.map(section => (
            <AccordionItem
              key={section.id}
              section={section}
              isOpen={openId === section.id}
              onToggle={() => toggle(section.id)}
            />
          ))}

          {/* Quick nav */}
          <Text style={[styles.sectionLabel, { color: t.textMuted, marginTop: 8 }]}>EXPLORE THESE PREMIUM FEATURES</Text>
          <View ref={cardSectionRef} onLayout={onCardsLayout}>
            <Animated.View
              style={[
                styles.quickNavRow,
                {
                  opacity: cardOpacity,
                  transform: [{ translateY: cardTranslateY }, { scale: cardScale }],
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.quickNavItem, { backgroundColor: t.card, borderColor: t.cardBorder }]}
                onPress={() => navigation.navigate('Stories')}
              >
                <Image source={require('../../assets/group-story-by-fire.jpg')} style={styles.quickNavImage} />
                <Text style={[styles.quickNavLabel, { color: t.cardLabel }]}>Stories</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickNavItem, { backgroundColor: t.card, borderColor: t.cardBorder }]}
                onPress={() => {
                  const verse = getTodayVerseEntry();
                  navigation.navigate('ScriptureChat', {
                    reference: verse.label,
                    contextType: 'verse',
                    context: `${verse.label}\n\n"${verse.fallbackText}"`,
                  });
                }}
              >
                <Image
                  source={require('../../assets/talk-to-scripture.jpg')}
                  style={styles.quickNavImage}
                  resizeMode="cover"
                />
                <Text style={[styles.quickNavLabel, { color: t.cardLabel }]}>Talk to Scripture</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Accordion text always sits over a photo background — keep those colours fixed white.
const OVERLAY_TEXT = '#F0EFE9';
const OVERLAY_SUB  = 'rgba(255,255,255,0.72)';
const GOLD         = '#D4AF37';

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 116 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 18, gap: 14,
  },
  greetingBlock: { flex: 1 },
  greeting: { fontSize: 22, fontWeight: '700' },
  date: { fontSize: 13, marginTop: 2 },

  // Streak card — solid
  streakCard: {
    marginHorizontal: 18, marginBottom: 12,
  },
  streakInner: { padding: 16, paddingTop: 14, gap: 12 },
  streakTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakEmoji: { fontSize: 22 },
  streakTitle: { fontWeight: '700', fontSize: 14 },
  streakSub: { fontSize: 12, marginTop: 1 },
  streakBadge: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  streakBadgeText: { fontWeight: '800', fontSize: 15 },

  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDayCol: { alignItems: 'center', gap: 4 },
  weekDayLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  weekDayCircle: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  weekDayNum: { fontSize: 13, fontWeight: '500' },

  progressRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  progressLabel: { fontSize: 12, fontWeight: '500' },
  progressPctGold: { fontSize: 12, fontWeight: '700' },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: 4, borderRadius: 2 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 10,
  },

  measureGhost: {
    position: 'absolute',
    opacity: 0,
    top: 0,
    left: 0,
    right: 0,
  },

  // Accordion — image background with fixed dark scrim for readability
  accordionWrap: {
    marginBottom: 8, borderRadius: 16, overflow: 'hidden', borderWidth: 1,
  },
  accordionCardBg: { width: '100%' },
  cardOverlay: {
    backgroundColor: 'rgba(6,5,14,0.52)',
  },
  accordionBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 22, paddingHorizontal: 14,
  },
  barLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  barIcon: { fontSize: 20 },
  barTitle: { fontSize: 14, fontWeight: '600', color: OVERLAY_TEXT },
  barMeta: { fontSize: 11, color: OVERLAY_SUB, marginTop: 1 },
  chevron: { fontSize: 22, color: OVERLAY_SUB, lineHeight: 26 },

  // Expanded overlay content — fixed colours over photo
  expandedOverlay: { padding: 20, minHeight: 200, justifyContent: 'flex-end' },
  expandedTitle: { color: OVERLAY_TEXT, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  expandedVerseText: { color: OVERLAY_TEXT, fontSize: 15, fontStyle: 'italic', lineHeight: 22, marginBottom: 14 },
  expandedSubtitle: { color: OVERLAY_SUB, fontSize: 13, lineHeight: 20, marginBottom: 14 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tag: {
    backgroundColor: 'rgba(212,175,55,0.18)', borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)', borderRadius: 20,
    paddingHorizontal: 11, paddingVertical: 4,
  },
  tagText: { color: GOLD, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  expandedActions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, backgroundColor: GOLD, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  actionBtnText: { color: '#0D0F1A', fontWeight: '700', fontSize: 13 },
  actionBtnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: GOLD },
  actionBtnOutlineText: { color: GOLD },

  // Goals expanded — also over photo so fixed colours
  expandedPlain: { padding: 18 },
  goalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  goalRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  goalInfo: { flex: 1.2 },
  goalTitle: { fontSize: 14, color: OVERLAY_TEXT, fontWeight: '500', marginBottom: 2 },
  goalStreak: { fontSize: 12, color: GOLD },
  goalRight: { flex: 1, marginLeft: 12 },
  goalTarget: { fontSize: 11, color: OVERLAY_SUB, textAlign: 'right', marginTop: 4 },
  primaryBtn: { paddingVertical: 13, alignItems: 'center' },
  primaryBtnText: { color: OVERLAY_TEXT, fontWeight: '700', fontSize: 14 },

  // Quick nav
  quickNavRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  quickNavItem: {
    flex: 1, alignItems: 'center', borderRadius: 14,
    overflow: 'hidden', paddingBottom: 12, borderWidth: 1,
  },
  quickNavImage: { width: '100%', height: 90, marginBottom: 10 },
  quickNavLabel: { fontSize: 13, fontWeight: '600' },
  quickNavIconWrap: {
    width: '100%', height: 90, alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },

  talkBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 12, paddingVertical: 13, borderRadius: 14,
    backgroundColor: 'rgba(212,175,55,0.85)',
  },
  talkBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
});
