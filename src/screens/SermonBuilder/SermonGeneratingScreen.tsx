import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Animated,
  BackHandler, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../theme';
import { generateSermon, saveSermon } from '../../services/sermonService';
import type { SermonAudience } from '../../types/sermon';

const STAGES = [
  { icon: 'book-outline', title: 'Studying Scripture', message: 'Examining your passages in historical context…' },
  { icon: 'globe-outline', title: 'Historical Research', message: 'Exploring the cultural and biblical background…' },
  { icon: 'list-outline', title: 'Sermon Structure', message: 'Designing your outline and main points…' },
  { icon: 'bulb-outline', title: 'Illustrations', message: 'Crafting stories and real-life applications…' },
  { icon: 'heart-outline', title: 'Pastoral Voice', message: 'Writing prayers and invitation moments…' },
  { icon: 'sparkles-outline', title: 'Finalising', message: 'Polishing your complete sermon manuscript…' },
];

const ENCOURAGEMENTS = [
  '"Study to show thyself approved unto God, a workman that needeth not to be ashamed."\n— 2 Timothy 2:15',
  '"Preach the word; be ready in season and out of season; reprove, rebuke, and exhort."\n— 2 Timothy 4:2',
  '"The grass withers, the flower fades, but the word of our God will stand forever."\n— Isaiah 40:8',
];

type RouteParams = {
  audience: SermonAudience;
  audienceLabel: string;
  sermonType: string;
  scriptures: string[];
  topic: string;
  duration: number;
  tone: string;
};

export default function SermonGeneratingScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isDark = t.statusBar === 'light-content';

  const params = route.params as RouteParams;

  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [encouragement] = useState(
    () => ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]
  );

  const glowPulse  = useRef(new Animated.Value(0)).current;
  const msgOpacity = useRef(new Animated.Value(1)).current;
  const msgTransY  = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const doneRef   = useRef(false);
  const stageRef  = useRef(0);

  // Block hardware back during generation
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // Breathing glow animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glowPulse]);

  // Fake progress bar — reaches 88% over 26s, final 12% fills on complete
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 0.88,
      duration: 26000,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  const animateToStage = useCallback((idx: number) => {
    Animated.parallel([
      Animated.timing(msgOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(msgTransY, { toValue: -10, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setStageIndex(idx);
      msgTransY.setValue(10);
      Animated.parallel([
        Animated.timing(msgOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(msgTransY, { toValue: 0, tension: 130, friction: 14, useNativeDriver: true }),
      ]).start();
    });
  }, [msgOpacity, msgTransY]);

  // Stage cycling — advances every 4.5s, stops when done
  useEffect(() => {
    const interval = setInterval(() => {
      if (doneRef.current) return;
      const next = Math.min(stageRef.current + 1, STAGES.length - 1);
      if (next !== stageRef.current) {
        stageRef.current = next;
        animateToStage(next);
      }
    }, 4500);
    return () => clearInterval(interval);
  }, [animateToStage]);

  // Actual generation
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const generated = await generateSermon({
          audience: params.audience,
          audienceLabel: params.audienceLabel,
          sermonType: params.sermonType,
          scriptures: params.scriptures,
          topic: params.topic,
          duration: params.duration,
          tone: params.tone,
        });

        if (cancelled) return;

        const selectedTitle = generated.titles?.[0] ?? 'Untitled Sermon';
        const saved = await saveSermon({
          audience: params.audience,
          audienceLabel: params.audienceLabel,
          sermonType: params.sermonType,
          scriptures: params.scriptures,
          topic: params.topic,
          duration: params.duration,
          tone: params.tone,
          selectedTitle,
          generated,
          isFavorite: false,
        });

        if (cancelled) return;

        doneRef.current = true;
        stageRef.current = STAGES.length - 1;
        animateToStage(STAGES.length - 1);

        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }).start(() => {
          if (!cancelled) navigation.replace('SermonResult', { sermonId: saved.id });
        });
      } catch {
        if (!cancelled) {
          setError('Could not generate the sermon. Please check your connection and try again.');
        }
      }
    };

    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orbScale  = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const ring1Opacity = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.55] });
  const ring1Scale   = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const ring2Opacity = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.22] });
  const ring2Scale   = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [1.1, 1.45] });
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const stage = STAGES[stageIndex];

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 36 }}>
        <StatusBar barStyle={t.statusBar} />
        <View style={[gs.errorIcon, { backgroundColor: t.filterInactiveBg }]}>
          <Ionicons name="alert-circle-outline" size={40} color={t.textMuted} />
        </View>
        <Text style={[gs.errorTitle, { color: t.text }]}>Generation Failed</Text>
        <Text style={[gs.errorBody, { color: t.textMuted }]}>{error}</Text>
        <TouchableOpacity
          style={[gs.errorBtn, { backgroundColor: t.gold }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Text style={gs.errorBtnText}>Go Back & Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

      <LinearGradient
        colors={isDark
          ? ['#0C0E1C', '#111427', '#0C0E1C']
          : ['#F8F4EC', '#EDE7D9', '#F8F4EC']}
        style={StyleSheet.absoluteFill}
      />

      {/* Progress bar */}
      <View style={[gs.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
        <Animated.View style={[gs.progressFill, { backgroundColor: t.gold, width: progressWidth }]} />
      </View>

      <View style={[gs.container, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 48 }]}>

        {/* Animated orb */}
        <View style={gs.orbArea}>
          <Animated.View style={[
            gs.ring2,
            { borderColor: t.gold, opacity: ring2Opacity, transform: [{ scale: ring2Scale }] },
          ]} />
          <Animated.View style={[
            gs.ring1,
            { borderColor: t.gold, opacity: ring1Opacity, transform: [{ scale: ring1Scale }] },
          ]} />
          <Animated.View style={[
            gs.orb,
            {
              backgroundColor: isDark ? 'rgba(201,169,107,0.10)' : 'rgba(201,169,107,0.12)',
              transform: [{ scale: orbScale }],
            },
          ]}>
            <View style={[gs.orbInner, { backgroundColor: isDark ? '#1A1D32' : '#FFF8EE' }]}>
              <Ionicons name={stage.icon as any} size={30} color={t.gold} />
            </View>
          </Animated.View>
        </View>

        {/* Label */}
        <Text style={[gs.generating, { color: t.textMuted }]}>PREPARING YOUR SERMON</Text>

        {/* Stage message */}
        <Animated.View style={[gs.stageWrap, { opacity: msgOpacity, transform: [{ translateY: msgTransY }] }]}>
          <Text style={[gs.stageTitle, { color: t.text }]}>{stage.title}</Text>
          <Text style={[gs.stageMessage, { color: t.textMuted }]}>{stage.message}</Text>
        </Animated.View>

        {/* Stage dots */}
        <View style={gs.dotsRow}>
          {STAGES.map((_, i) => (
            <View
              key={i}
              style={[
                gs.dot,
                {
                  width: i === stageIndex ? 22 : 6,
                  backgroundColor: i <= stageIndex ? t.gold : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'),
                  opacity: i === stageIndex ? 1 : 0.7,
                },
              ]}
            />
          ))}
        </View>

        {/* Encouragement */}
        <View style={[gs.encourageWrap, {
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
        }]}>
          <Ionicons name="book-outline" size={14} color={t.textMuted} style={{ marginBottom: 8 }} />
          <Text style={[gs.encourageText, { color: t.textMuted }]}>{encouragement}</Text>
        </View>

      </View>
    </View>
  );
}

const gs = StyleSheet.create({
  progressTrack: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 3, zIndex: 10,
  },
  progressFill: { height: '100%', borderRadius: 2 },

  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 36, gap: 0,
  },

  orbArea: {
    width: 200, height: 200,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 44,
  },
  ring2: {
    position: 'absolute', width: 200, height: 200,
    borderRadius: 100, borderWidth: 1,
  },
  ring1: {
    position: 'absolute', width: 152, height: 152,
    borderRadius: 76, borderWidth: 1.5,
  },
  orb: {
    width: 108, height: 108, borderRadius: 54,
    alignItems: 'center', justifyContent: 'center',
  },
  orbInner: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C9A96B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },

  generating: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2,
    marginBottom: 18,
  },

  stageWrap: { alignItems: 'center', gap: 10, marginBottom: 32 },
  stageTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, textAlign: 'center' },
  stageMessage: { fontSize: 14, lineHeight: 22, textAlign: 'center' },

  dotsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 52,
  },
  dot: { height: 6, borderRadius: 3 },

  encourageWrap: {
    borderRadius: 16, borderWidth: 1,
    paddingHorizontal: 22, paddingVertical: 18,
    alignItems: 'center', gap: 2,
    width: '100%',
  },
  encourageText: {
    fontSize: 13, lineHeight: 22, textAlign: 'center', fontStyle: 'italic',
  },

  errorIcon: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  errorTitle: { fontSize: 20, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  errorBody: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 32 },
  errorBtn: { borderRadius: 28, paddingHorizontal: 32, paddingVertical: 14 },
  errorBtnText: { fontSize: 15, fontWeight: '800', color: '#08071A' },
});
