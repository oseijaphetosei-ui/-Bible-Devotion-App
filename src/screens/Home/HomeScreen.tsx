import React, { useRef, useState, useCallback } from 'react';
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

const SCREEN_W = Dimensions.get('window').width;

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
    thumbnail: require('../../assets/open-bible-on-table-in-dusk.jpg'),
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
  const tags = ['PSALM 46', 'STILLNESS', 'PEACE'];
  return (
    <View style={styles.expandedOverlay}>
      <Text style={styles.expandedTitle}>Psalm 46:10</Text>
      <Text style={styles.expandedVerseText}>
        "Be still, and know that I am God."
      </Text>
      <View style={styles.tagRow}>
        {tags.map(t => (
          <View key={t} style={styles.tag}>
            <Text style={styles.tagText}>{t}</Text>
          </View>
        ))}
      </View>
      <View style={styles.expandedActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Verse')}>
          <Text style={styles.actionBtnText}>📖  Read</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]}>
          <Text style={[styles.actionBtnText, styles.actionBtnOutlineText]}>🔖  Save</Text>
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
  const goals = [
    { title: 'Read Bible daily', streak: 7, target: 30 },
    { title: 'Morning prayer', streak: 3, target: 14 },
  ];
  return (
    <View style={styles.expandedPlain}>
      {goals.map((goal, i) => {
        const pct = goal.streak / goal.target;
        return (
          <View key={goal.title} style={[styles.goalRow, i < goals.length - 1 && styles.goalRowBorder]}>
            <View style={styles.goalInfo}>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <Text style={styles.goalStreak}>{goal.streak}-day streak 🔥</Text>
            </View>
            <View style={styles.goalRight}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${pct * 100}%` as any }]} />
              </View>
              <Text style={styles.goalTarget}>{goal.streak}/{goal.target}d</Text>
            </View>
          </View>
        );
      })}
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
  const anim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isOpen]);

  const chevronRotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.accordionWrap}>
      <ImageBackground
        source={section.thumbnail}
        style={styles.accordionCardBg}
      >
        <TouchableOpacity
          style={[styles.accordionBar, isOpen && styles.accordionBarOpen]}
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

        {isOpen && (
          <Animated.View style={{ opacity: anim }}>
            {renderContent(section.id)}
          </Animated.View>
        )}
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.date}>{today}</Text>
          </View>
          <TouchableOpacity style={styles.avatar}>
            <Text style={styles.avatarText}>J</Text>
          </TouchableOpacity>
        </View>

        {/* Streak banner */}
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
    paddingVertical: 20,
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
    backgroundColor: C.goldDim,
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#5A4020',
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
  accordionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(8, 6, 18, 0.52)',
    paddingVertical: 22,
    paddingHorizontal: 14,
  },
  accordionBarOpen: {
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
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
    backgroundColor: 'rgba(8, 6, 18, 0.75)',
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
    backgroundColor: C.card,
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
    backgroundColor: C.gold,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#0D0F1A', fontWeight: '700', fontSize: 14 },

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