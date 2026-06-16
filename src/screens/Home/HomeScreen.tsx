import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  Easing,
  ImageBackground,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

const SCREEN_H = Dimensions.get('window').height;

type FadeInCardProps = {
  children: React.ReactNode;
  onRegister: (fn: () => void) => void;
  scrollY: React.RefObject<number>;
};

function FadeInCard({ children, onRegister, scrollY }: FadeInCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(32)).current;
  const triggered = useRef(false);
  const cardY = useRef<number | null>(null);

  const tryAnimate = useCallback(() => {
    if (triggered.current || cardY.current === null) return;
    if ((scrollY.current ?? 0) + SCREEN_H > cardY.current + 60) {
      triggered.current = true;
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, []);

  useEffect(() => {
    onRegister(tryAnimate);
  }, []);

  return (
    <Animated.View
      onLayout={(e) => {
        cardY.current = e.nativeEvent.layout.y;
        tryAnimate();
      }}
      style={{ opacity, transform: [{ translateY }] }}
    >
      {children}
    </Animated.View>
  );
}
import { SafeAreaView } from 'react-native-safe-area-context';

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
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// Placeholder data — replace with real API/Firebase calls later
const todayVerse = {
  reference: 'Psalm 46:10',
  text: 'Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.',
  devotionTitle: "Finding Peace in God's Presence",
};

const readingPlan = {
  name: '90-Day Bible Plan',
  today: 'Genesis 45–47',
  day: 23,
  total: 90,
};


const goals = [
  { title: 'Read Bible daily', streak: 7, target: 30 },
  { title: 'Morning prayer', streak: 3, target: 14 },
];

function VerseCard() {
  return (
    <ImageBackground
      source={require('../../assets/open-bible-on-table-in-dusk.jpg')}
      style={styles.verseCard}
      imageStyle={styles.verseCardImage}
    >
      <View style={styles.verseCardOverlay}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>TODAY'S VERSE</Text>
        </View>
        <Text style={styles.verseRef}>{todayVerse.reference}</Text>
        <Text style={styles.verseText}>"{todayVerse.text}"</Text>
        <View style={styles.divider} />
        <Text style={styles.devotionTitle}>{todayVerse.devotionTitle}</Text>
        <TouchableOpacity style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Read Devotion</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

function ReadingPlanCard() {
  const progress = readingPlan.day / readingPlan.total;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>READING PLAN</Text>
        <Text style={styles.cardSub}>Day {readingPlan.day} of {readingPlan.total}</Text>
      </View>
      <Text style={styles.cardTitle}>{readingPlan.name}</Text>
      <Text style={styles.cardMeta}>Today · {readingPlan.today}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
      </View>
      <TouchableOpacity style={styles.outlineBtn}>
        <Text style={styles.outlineBtnText}>Continue Reading</Text>
      </TouchableOpacity>
    </View>
  );
}

function QuickNavSection() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <>
      <Text style={styles.sectionLabel}>EXPLORE</Text>
      <View style={styles.quickNavRow}>
        <TouchableOpacity style={styles.quickNavItem} onPress={() => navigation.navigate('Bible')}>
          <Image
            source={require('../../assets/holy-bible-card-icon.jpg')}
            style={styles.quickNavImage}
          />
          <Text style={styles.quickNavLabel}>Bible</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickNavItem}>
          <Image
            source={require('../../assets/group-story-by-fire.jpg')}
            style={styles.quickNavImage}
          />
          <Text style={styles.quickNavLabel}>Stories</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.quickNavItemWide}>
        <View style={styles.quickNavIconWrap}>
          <Text style={styles.quickNavIcon}>✦</Text>
        </View>
        <Text style={styles.quickNavLabel}>Assistant</Text>
      </TouchableOpacity>
    </>
  );
}

function GoalsCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>SPIRITUAL GOALS</Text>
      </View>
      {goals.map((goal, i) => {
        const pct = goal.streak / goal.target;
        return (
          <View key={goal.title} style={[styles.goalRow, i < goals.length - 1 && styles.goalRowBorder]}>
            <View style={styles.goalInfo}>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <Text style={styles.goalStreak}>{goal.streak}-day streak</Text>
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

export default function HomeScreen() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const scrollY = useRef<number>(0);
  const animators = useRef<Array<() => void>>([]);

  const register = useCallback((fn: () => void) => {
    animators.current.push(fn);
  }, []);

  const handleScroll = useCallback((e: any) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
    animators.current.forEach(fn => fn());
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.date}>{today}</Text>
          </View>
          <TouchableOpacity style={styles.avatar}>
            <Text style={styles.avatarText}>J</Text>
          </TouchableOpacity>
        </View>

        <FadeInCard onRegister={register} scrollY={scrollY}>
          <VerseCard />
        </FadeInCard>
        <FadeInCard onRegister={register} scrollY={scrollY}>
          <ReadingPlanCard />
        </FadeInCard>
        <FadeInCard onRegister={register} scrollY={scrollY}>
          <QuickNavSection />
        </FadeInCard>
        <FadeInCard onRegister={register} scrollY={scrollY}>
          <GoalsCard />
        </FadeInCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

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

  // Verse card
  verseCard: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: 'hidden',
  },
  verseCardImage: {
    borderRadius: 16,
  },
  verseCardOverlay: {
    padding: 22,
    backgroundColor: 'rgba(10, 8, 20, 0.72)',
  },
  tag: {
    backgroundColor: C.goldDim,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  tagText: { color: C.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  verseRef: { color: C.gold, fontSize: 13, fontWeight: '600', marginBottom: 10 },
  verseText: {
    color: C.text,
    fontSize: 16,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  divider: { height: 1, backgroundColor: C.cardBorder, marginVertical: 18 },
  devotionTitle: { color: C.text, fontSize: 15, fontWeight: '600', marginBottom: 16 },
  primaryBtn: {
    backgroundColor: C.gold,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#0D0F1A', fontWeight: '700', fontSize: 14 },

  // Generic card
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardLabel: { fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 1.2 },
  cardSub: { fontSize: 12, color: C.textSub },
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 4 },
  cardMeta: { fontSize: 13, color: C.textSub, marginBottom: 14 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: C.gold,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 6,
  },
  outlineBtnText: { color: C.gold, fontWeight: '600', fontSize: 14 },

  // Progress bar
  progressTrack: {
    height: 4,
    backgroundColor: C.progressBg,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: 4,
    backgroundColor: C.gold,
    borderRadius: 2,
  },

  // Quick nav
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  quickNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickNavItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    overflow: 'hidden',
    paddingBottom: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  quickNavImage: {
    width: '100%',
    height: 90,
    marginBottom: 10,
  },
  quickNavItemWide: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginHorizontal: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  quickNavIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.progressBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  quickNavIcon: { fontSize: 20 },
  quickNavLabel: { fontSize: 13, color: C.text, fontWeight: '600' },

  // Goals
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  goalRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  goalInfo: { flex: 1.2 },
  goalTitle: { fontSize: 14, color: C.text, fontWeight: '500', marginBottom: 2 },
  goalStreak: { fontSize: 12, color: C.gold },
  goalRight: { flex: 1, marginLeft: 12 },
  goalTarget: { fontSize: 11, color: C.textMuted, textAlign: 'right' },
});
