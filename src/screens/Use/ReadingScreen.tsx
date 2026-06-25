import React, {
  useEffect, useState, useCallback, useRef, useMemo,
} from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Animated, Dimensions, ActivityIndicator,
  Vibration, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { getPlanById, getTodayReading } from '../../services/readingPlanService';
import { getActivePlan } from '../../services/readingPlanService';
import { fetchChapterOffline } from '../../services/offlineBibleService';
import { speakText } from '../../services/ttsService';
import type { PassageRef } from '../../types/readingPlan';
import type { HomeStackParamList } from '../../types/navigation';
import { Audio } from 'expo-av';

type Nav   = NativeStackNavigationProp<HomeStackParamList>;
type Route = RouteProp<HomeStackParamList, 'Reading'>;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type LoadedPassage = {
  ref: PassageRef;
  verses: { verse: number; text: string }[];
};

type SelectedVerse = {
  passageKey: string;
  verse: number;
  text: string;
};

export default function ReadingScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const t          = useTheme();

  const { planId, day } = route.params;

  const [passages,  setPassages]  = useState<LoadedPassage[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [readPct,   setReadPct]   = useState(0);
  const [selected,  setSelected]  = useState<SelectedVerse | null>(null);
  const [speaking,  setSpeaking]  = useState(false);

  const scrollRef   = useRef<ScrollView>(null);
  const scrollH     = useRef(0);
  const contentH    = useRef(0);
  const soundRef    = useRef<Audio.Sound | null>(null);
  const toolbarAnim = useRef(new Animated.Value(0)).current;
  const headerAnim  = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);

  // Load all chapters for this day
  useEffect(() => {
    (async () => {
      const plan    = getPlanById(planId);
      const active  = await getActivePlan();
      if (!plan || !active) return;

      const reading = plan.readings.find((r) => r.day === day);
      if (!reading) return;

      const loaded: LoadedPassage[] = reading.passages.map((p) => ({
        ref: p,
        verses: fetchChapterOffline('kjv', p.bookIndex, p.chapter),
      }));

      setPassages(loaded);
      setLoading(false);
    })();

    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, [planId, day]);

  // Show/hide toolbar on verse select
  useEffect(() => {
    Animated.spring(toolbarAnim, {
      toValue: selected ? 1 : 0,
      tension: 220,
      friction: 18,
      useNativeDriver: true,
    }).start();
  }, [selected]);

  const handleScroll = useCallback((e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const total = contentH.current - scrollH.current;
    if (total > 0) setReadPct(Math.min(1, y / total));

    // Hide header when scrolling down, show when scrolling up
    const delta = y - lastScrollY.current;
    lastScrollY.current = y;
    if (delta > 4 && y > 60) {
      Animated.timing(headerAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    } else if (delta < -4) {
      Animated.timing(headerAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, []);

  const handleVerseLongPress = useCallback((
    passageKey: string,
    verse: number,
    text: string,
  ) => {
    if (Platform.OS !== 'web') Vibration.vibrate(30);
    setSelected((prev) =>
      prev?.passageKey === passageKey && prev.verse === verse ? null : { passageKey, verse, text }
    );
  }, []);

  const handleListen = useCallback(async () => {
    if (speaking) {
      await soundRef.current?.stopAsync().catch(() => {});
      await soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
      setSpeaking(false);
      return;
    }
    if (!selected) return;
    setSpeaking(true);
    try {
      const snd = await speakText(selected.text);
      soundRef.current = snd;
      snd.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setSpeaking(false);
          soundRef.current = null;
        }
      });
    } catch {
      setSpeaking(false);
    }
  }, [speaking, selected]);

  const handleAskAI = useCallback(() => {
    if (!selected) return;
    const plan = getPlanById(planId);
    const reading = plan?.readings.find((r) => r.day === day);
    navigation.navigate('ScriptureChat', {
      reference: `${selected.passageKey} v.${selected.verse}`,
      contextType: 'verse',
      context: `"${selected.text}" — ${selected.passageKey} verse ${selected.verse}`,
    });
    setSelected(null);
  }, [selected, planId, day, navigation]);

  const handleComplete = useCallback(() => {
    navigation.navigate('Reflection', { planId, day });
  }, [planId, day, navigation]);

  const plan    = useMemo(() => getPlanById(planId), [planId]);
  const reading = useMemo(() => plan?.readings.find((r) => r.day === day), [plan, day]);

  // Toolbar animation interpolations
  const toolbarY  = toolbarAnim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });
  const toolbarOp = toolbarAnim;
  const headerOp  = headerAnim;

  if (loading) {
    return (
      <View style={[s.loading, { backgroundColor: '#0A0806' }]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ActivityIndicator size="small" color="#C9A96B" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#0A0806' }]} />

      {/* Floating header — hides on scroll-down */}
      <Animated.View style={[s.header, { opacity: headerOp }]}>
        <SafeAreaView edges={['top']} style={s.headerInner}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={22} color="rgba(240,237,230,0.6)" />
          </TouchableOpacity>
          <Text style={s.headerRef} numberOfLines={1}>
            {reading?.passages.map((p) => `${p.book} ${p.chapter}`).join(' · ')}
          </Text>
          <View style={{ width: 22 }} />
        </SafeAreaView>

        {/* Thin reading-progress line at the very top */}
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${Math.round(readPct * 100)}%` }]} />
        </View>
      </Animated.View>

      {/* Scripture scroll */}
      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onLayout={(e) => { scrollH.current = e.nativeEvent.layout.height; }}
        onContentSizeChange={(_w, h) => { contentH.current = h; }}
      >
        {/* Top inset for header */}
        <View style={{ height: 90 }} />

        {passages.map((p, pi) => {
          const key = `${p.ref.book} ${p.ref.chapter}`;
          return (
            <View key={key} style={[s.passageBlock, pi > 0 && s.passageGap]}>

              {/* Chapter heading */}
              <Text style={s.chapterRef}>{p.ref.book}</Text>
              <Text style={s.chapterNumber}>Chapter {p.ref.chapter}</Text>
              <View style={s.chapterRule} />

              {/* Verses */}
              {p.verses.map(({ verse, text }) => {
                const isSelected =
                  selected?.passageKey === key && selected.verse === verse;
                return (
                  <TouchableOpacity
                    key={verse}
                    onLongPress={() => handleVerseLongPress(key, verse, text)}
                    onPress={() => {
                      if (selected?.passageKey === key && selected.verse === verse) {
                        setSelected(null);
                      }
                    }}
                    activeOpacity={0.85}
                    style={[
                      s.verseRow,
                      isSelected && s.verseRowSelected,
                    ]}
                  >
                    <Text style={[s.verseNum, isSelected && s.verseNumSelected]}>
                      {verse}
                    </Text>
                    <Text style={[s.verseText, isSelected && s.verseTextSelected]}>
                      {text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        {/* Complete button — lives at the end of the scroll */}
        <View style={s.completeSection}>
          <View style={s.completeRule} />
          <Text style={s.completePrompt}>You've reached the end of today's reading</Text>
          <TouchableOpacity
            style={s.completeBtn}
            onPress={handleComplete}
            activeOpacity={0.84}
          >
            <Text style={s.completeBtnText}>Reflect on Today's Reading</Text>
            <Ionicons name="arrow-forward" size={17} color="#1A1005" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Verse action toolbar — slides up when a verse is selected */}
      <Animated.View
        style={[
          s.toolbar,
          {
            opacity: toolbarOp,
            transform: [{ translateY: toolbarY }],
          },
        ]}
        pointerEvents={selected ? 'auto' : 'none'}
      >
        <SafeAreaView edges={['bottom']} style={s.toolbarInner}>
          <View style={s.toolbarContent}>

            <TouchableOpacity style={s.toolbarBtn} onPress={handleListen} activeOpacity={0.75}>
              <Ionicons
                name={speaking ? 'stop-circle-outline' : 'headset-outline'}
                size={22}
                color={speaking ? '#C9A96B' : 'rgba(240,237,230,0.65)'}
              />
              <Text style={s.toolbarLabel}>{speaking ? 'Stop' : 'Listen'}</Text>
            </TouchableOpacity>

            <View style={s.toolbarDivider} />

            <TouchableOpacity style={s.toolbarBtn} onPress={handleAskAI} activeOpacity={0.75}>
              <Ionicons name="sparkles-outline" size={22} color="rgba(240,237,230,0.65)" />
              <Text style={s.toolbarLabel}>Ask AI</Text>
            </TouchableOpacity>

            <View style={s.toolbarDivider} />

            <TouchableOpacity
              style={s.toolbarBtn}
              onPress={() => setSelected(null)}
              activeOpacity={0.75}
            >
              <Ionicons name="close-outline" size={22} color="rgba(240,237,230,0.45)" />
              <Text style={[s.toolbarLabel, { color: 'rgba(240,237,230,0.35)' }]}>Clear</Text>
            </TouchableOpacity>

          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const GOLD  = '#C9A96B';
const WHITE = '#F0EDE6';

const s = StyleSheet.create({
  root:    { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:  { flex: 1 },
  scrollContent: { paddingHorizontal: 28, paddingBottom: 40 },

  // ── Floating header ──────────────────────────────────────────────────────

  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(10,8,6,0.92)',
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerRef: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(240,237,230,0.55)',
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'center',
  },

  progressTrack: { height: 2, backgroundColor: 'rgba(240,237,230,0.06)' },
  progressFill:  { height: 2, backgroundColor: GOLD },

  // ── Passage ──────────────────────────────────────────────────────────────

  passageBlock: {},
  passageGap:   { marginTop: 48 },

  chapterRef: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: 'rgba(201,169,107,0.55)',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  chapterNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  chapterRule: {
    width: 32,
    height: 1,
    backgroundColor: 'rgba(201,169,107,0.28)',
    marginBottom: 24,
  },

  // ── Verses ───────────────────────────────────────────────────────────────

  verseRow: {
    flexDirection: 'row',
    marginBottom: 14,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verseRowSelected: {
    backgroundColor: 'rgba(201,169,107,0.10)',
    borderLeftWidth: 2,
    borderLeftColor: GOLD,
    paddingLeft: 10,
  },

  verseNum: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(201,169,107,0.35)',
    lineHeight: 30,
    marginRight: 10,
    minWidth: 20,
    marginTop: 2,
  },
  verseNumSelected: { color: GOLD },

  verseText: {
    flex: 1,
    fontSize: 19,
    lineHeight: 32,
    color: 'rgba(240,237,230,0.85)',
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  verseTextSelected: { color: WHITE },

  // ── Complete section ─────────────────────────────────────────────────────

  completeSection: { marginTop: 60, alignItems: 'center' },
  completeRule: {
    width: 48,
    height: 1,
    backgroundColor: 'rgba(201,169,107,0.25)',
    marginBottom: 20,
  },
  completePrompt: {
    fontSize: 13,
    color: 'rgba(240,237,230,0.35)',
    marginBottom: 24,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  completeBtn: {
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 17,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  completeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1005',
    letterSpacing: 0.2,
  },

  // ── Verse toolbar ────────────────────────────────────────────────────────

  toolbar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(20,16,10,0.96)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(201,169,107,0.18)',
  },
  toolbarInner:   {},
  toolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 0,
  },
  toolbarBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 5,
  },
  toolbarLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(240,237,230,0.50)',
    letterSpacing: 0.3,
  },
  toolbarDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: 'rgba(240,237,230,0.10)',
  },
});
