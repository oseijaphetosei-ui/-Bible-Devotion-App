import React, { useRef, useState, useCallback, useEffect } from 'react';
import * as Speech from 'expo-speech';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  ImageBackground,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTodayVerseEntry } from '../../services/verseService';
import { loadGoals, calcStreak, isCompletedToday } from '../../services/goalsService';
import { Goal } from '../../types/goal';
import { useFocusEffect } from '@react-navigation/native';

const SCREEN_W = Dimensions.get('window').width;

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

const C = {
  bg: '#0D0F1A',
  card: '#151828',
  cardBorder: '#1F2240',
  gold: '#D4AF37',
  goldDim: '#3A2E10',
  text: '#F0EFE9',
  textSub: '#8B8FA8',
  textMuted: '#555870',
  progressBg: '#1F2240',
  accent: '#2A3060',
};

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
    thumbnail: require('../../assets/water-way.jpg'),
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

function VerseContent() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const verse = getTodayVerseEntry();
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  const handleReadAloud = () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    const text = `${sanitizeForSpeech(verse.label)}. ${sanitizeForSpeech(verse.fallbackText)}`;
    setSpeaking(true);
    Speech.speak(text, {
      language: 'en',
      pitch: 1.0,
      rate: 0.9,
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
        {verse.tags.map(t => (
          <View key={t} style={styles.tag}>
            <Text style={styles.tagText}>{t}</Text>
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
    </View>
  );
}

function DevotionContent() {
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
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>✦  Read Devotion</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


function GoalsContent() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [goals, setGoals] = React.useState<Goal[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadGoals().then(setGoals);
    }, [])
  );

  const preview = goals.slice(0, 2);
  const completedCount = goals.filter(isCompletedToday).length;

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
          <Text style={styles.goalStreak}>
            {completedCount}/{goals.length} completed today
          </Text>
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
}

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

function AccordionItem({ section, isOpen, onToggle }: AccordionItemProps) {
  const progress = useRef(new Animated.Value(isOpen ? 1 : 0)).current;
  const [contentHeight, setContentHeight] = useState(0);
  const mounted = useRef(false);

  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    Animated.spring(progress, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: false,
      tension: 58,
      friction: 10,
    }).start();
  }, [isOpen]);

  const chevronRotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const contentAnimHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight],
  });

  return (
    <View style={styles.accordionWrap}>
      <ImageBackground
        source={section.thumbnail}
        style={styles.accordionCardBg}
      >
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
            <Animated.Text style={[styles.chevron, { transform: [{ rotate: chevronRotate }] }]}>
              ›
            </Animated.Text>
          </TouchableOpacity>

          <Animated.View style={{ height: contentAnimHeight, overflow: 'hidden' }}>
            <View onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}>
              {renderContent(section.id)}
            </View>
          </Animated.View>
        </View>
      </ImageBackground>
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [openId, setOpenId] = useState<SectionId | null>('verse');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const weekDays = getWeekDays();

  const toggle = useCallback((id: SectionId) => {
    setOpenId(prev => (prev === id ? null : id));
  }, []);

  return (
    <LinearGradient colors={['#5C3A10', '#080604']} style={{ flex: 1 }}>
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Fixed greeting header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <TouchableOpacity style={styles.avatar}>
          <Text style={styles.avatarText}>J</Text>
        </TouchableOpacity>
      </View>

      {/* Fixed streak banner */}
      <View style={styles.streakBanner}>
        <View style={styles.streakTopRow}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.streakTitle}>7-Day Streak</Text>
            <Text style={styles.streakSub}>Keep it going — open today's content below</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakBadgeText}>7</Text>
          </View>
        </View>

        <View style={styles.weekRow}>
          {weekDays.map((d, i) => (
            <View key={i} style={styles.weekDayCol}>
              <Text style={styles.weekDayLabel}>{d.label}</Text>
              <View style={[styles.weekDayCircle, d.isToday && styles.weekDayCircleActive]}>
                <Text style={[styles.weekDayNum, d.isToday && styles.weekDayNumActive]}>{d.date}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Progress today</Text>
          <Text style={styles.progressPctGold}>0%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '0%' }]} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Section label */}
        <Text style={styles.sectionLabel}>TODAY'S CONTENT</Text>

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
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>EXPLORE</Text>
        <View style={styles.quickNavRow}>
          <TouchableOpacity style={styles.quickNavItem} onPress={() => navigation.navigate('Bible')}>
            <Image source={require('../../assets/holy-bible-card-icon.jpg')} style={styles.quickNavImage} />
            <Text style={styles.quickNavLabel}>Bible</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickNavItem} onPress={() => navigation.navigate('Stories')}>
            <Image source={require('../../assets/group-story-by-fire.jpg')} style={styles.quickNavImage} />
            <Text style={styles.quickNavLabel}>Stories</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 48 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: C.text },
  date: { fontSize: 13, color: C.textSub, marginTop: 2 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: C.gold, fontWeight: '700', fontSize: 16 },

  streakBanner: {
    backgroundColor: 'rgba(8, 5, 2, 0.5)',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.22)',
    gap: 12,
  },
  streakTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakEmoji: { fontSize: 22 },
  streakTitle: { color: C.gold, fontWeight: '700', fontSize: 14 },
  streakSub: { color: C.textSub, fontSize: 12, marginTop: 1 },
  streakBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakBadgeText: { color: '#0D0F1A', fontWeight: '800', fontSize: 15 },

  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  weekDayCol: { alignItems: 'center', gap: 4 },
  weekDayLabel: { fontSize: 10, color: C.textMuted, fontWeight: '600', letterSpacing: 0.5 },
  weekDayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayCircleActive: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: C.gold,
  },
  weekDayNum: { fontSize: 13, color: C.textSub, fontWeight: '500' },
  weekDayNumActive: { color: C.gold, fontWeight: '700' },

  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: { fontSize: 12, color: C.textSub, fontWeight: '500' },
  progressPctGold: { fontSize: 12, color: C.gold, fontWeight: '700' },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1.4,
    marginBottom: 10,
  },

  // Accordion
  accordionWrap: {
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  accordionCardBg: {
    width: '100%',
  },
  cardOverlay: {
    backgroundColor: 'rgba(8, 6, 18, 0.55)',
  },
  accordionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 22,
    paddingHorizontal: 14,
  },
  barLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  barIcon: { fontSize: 20 },
  barTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  barMeta: { fontSize: 11, color: C.textSub, marginTop: 1 },
  barRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  chevron: {
    fontSize: 22,
    color: C.textSub,
    lineHeight: 26,
    transform: [{ rotate: '90deg' }],
  },

  // Expanded image content
  expandedImage: {
    width: '100%',
    minHeight: 200,
  },
  expandedOverlay: {
    padding: 20,
    minHeight: 200,
    justifyContent: 'flex-end',
  },
  expandedTitle: {
    color: C.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  expandedVerseText: {
    color: C.text,
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 14,
  },
  expandedSubtitle: {
    color: C.textSub,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.35)',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  tagText: { color: C.gold, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  expandedActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: C.gold,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnText: { color: '#0D0F1A', fontWeight: '700', fontSize: 13 },
  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: C.gold,
  },
  actionBtnOutlineText: { color: C.gold },

  // Expanded plain content
  expandedPlain: {
    padding: 18,
  },
  plainLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  plainTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 4 },
  plainMeta: { fontSize: 13, color: C.textSub, marginBottom: 14 },
  progressTrack: {
    height: 4,
    backgroundColor: C.progressBg,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: { height: 4, backgroundColor: C.gold, borderRadius: 2 },
  progressPct: { fontSize: 11, color: C.textSub, marginBottom: 16, textAlign: 'right' },
  primaryBtn: {
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryBtnText: { color: C.text, fontWeight: '700', fontSize: 14 },

  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  goalRowBorder: { borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  goalInfo: { flex: 1.2 },
  goalTitle: { fontSize: 14, color: C.text, fontWeight: '500', marginBottom: 2 },
  goalStreak: { fontSize: 12, color: C.gold },
  goalRight: { flex: 1, marginLeft: 12 },
  goalTarget: { fontSize: 11, color: C.textMuted, textAlign: 'right', marginTop: 4 },

  // Quick nav
  quickNavRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  quickNavItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    overflow: 'hidden',
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  quickNavImage: { width: '100%', height: 90, marginBottom: 10 },
  quickNavLabel: { fontSize: 13, color: C.text, fontWeight: '600' },
});