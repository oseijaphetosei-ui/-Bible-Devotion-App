import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Dimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { maybePromptPermission } from '../../services/notificationService';
import { READING_PLANS, getActivePlan, setActivePlan } from '../../services/readingPlanService';
import type { ReadingPlan, ActivePlan } from '../../types/readingPlan';
import type { HomeStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<HomeStackParamList>;
const { width: SCREEN_W } = Dimensions.get('window');

const PLAN_META: Record<string, string> = {
  biblical: 'BIBLICAL',
  topical: 'TOPICAL',
};

export default function PlanLibraryScreen() {
  const navigation = useNavigation<Nav>();
  const t = useTheme();
  const [activePlan, setActivePlanState] = useState<ActivePlan | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    getActivePlan().then(setActivePlanState);
  }, []));

  const handleStart = useCallback(async (plan: ReadingPlan) => {
    if (starting) return;
    setStarting(plan.id);
    try {
      const active = await setActivePlan(plan.id);
      setActivePlanState(active);
      maybePromptPermission().catch(() => {});
      navigation.replace('TodayJourney');
    } finally {
      setStarting(null);
    }
  }, [starting, navigation]);

  const handleContinue = useCallback(() => {
    navigation.replace('TodayJourney');
  }, [navigation]);

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={t.statusBar} translucent backgroundColor="transparent" />
      <SafeAreaView style={s.safe} edges={['top']}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="chevron-back" size={24} color={t.text} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: t.text }]}>Reading Plans</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
        >
          <Text style={[s.intro, { color: t.textSub }]}>
            Choose a plan and let Scripture shape your daily rhythm.
          </Text>

          {READING_PLANS.map((plan, i) => {
            const isActive = activePlan?.planId === plan.id;
            return (
              <View key={plan.id} style={[s.planBlock, i < READING_PLANS.length - 1 && { marginBottom: 20 }]}>

                {/* Gradient banner */}
                <LinearGradient
                  colors={plan.gradient as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.planBanner}
                >
                  <View style={s.planBannerInner}>
                    <View style={s.planBannerTop}>
                      <Text style={s.planCategory}>{PLAN_META[plan.category]}</Text>
                      {isActive && (
                        <View style={s.activePill}>
                          <Text style={s.activePillText}>ACTIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.planIcon}>{plan.icon}</Text>
                    <Text style={s.planTitle}>{plan.title}</Text>
                    <Text style={s.planSubtitle}>{plan.subtitle}</Text>
                  </View>
                </LinearGradient>

                {/* Plan body */}
                <View style={[s.planBody, { backgroundColor: t.bgAlt, borderColor: t.divider }]}>
                  <Text style={[s.planDescription, { color: t.textSub }]}>{plan.description}</Text>

                  <View style={[s.planMeta, { borderTopColor: t.divider }]}>
                    <View style={s.planMetaItem}>
                      <Ionicons name="calendar-outline" size={13} color={t.textMuted} />
                      <Text style={[s.planMetaText, { color: t.textMuted }]}>{plan.totalDays} days</Text>
                    </View>
                    <View style={[s.planMetaDot, { backgroundColor: t.divider }]} />
                    <View style={s.planMetaItem}>
                      <Ionicons name="time-outline" size={13} color={t.textMuted} />
                      <Text style={[s.planMetaText, { color: t.textMuted }]}>{plan.dailyMinutes} min / day</Text>
                    </View>
                    <View style={[s.planMetaDot, { backgroundColor: t.divider }]} />
                    <View style={s.planMetaItem}>
                      <Ionicons name="book-outline" size={13} color={t.textMuted} />
                      <Text style={[s.planMetaText, { color: t.textMuted }]}>{plan.category}</Text>
                    </View>
                  </View>

                  {isActive ? (
                    <TouchableOpacity
                      style={[s.cta, { backgroundColor: t.gold }]}
                      onPress={handleContinue}
                      activeOpacity={0.82}
                    >
                      <Text style={s.ctaText}>Continue Reading</Text>
                      <Ionicons name="arrow-forward" size={16} color="#1A1005" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[s.cta, { backgroundColor: 'transparent', borderWidth: 1, borderColor: t.gold }]}
                      onPress={() => handleStart(plan)}
                      activeOpacity={0.82}
                      disabled={starting === plan.id}
                    >
                      {starting === plan.id ? (
                        <ActivityIndicator size="small" color={t.gold} />
                      ) : (
                        <Text style={[s.ctaText, { color: t.gold }]}>Start This Plan</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

              </View>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },

  scroll: { paddingHorizontal: 20, paddingTop: 4 },

  intro: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 28,
    letterSpacing: 0.1,
  },

  planBlock: { overflow: 'hidden', borderRadius: 18 },

  planBanner: {
    width: '100%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  planBannerInner: { padding: 24, paddingBottom: 20 },
  planBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planCategory: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.45)',
  },
  activePill: {
    backgroundColor: '#C9A96B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  activePillText: { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: '#1A1005' },

  planIcon: { fontSize: 28, marginBottom: 10 },
  planTitle: { fontSize: 22, fontWeight: '700', color: '#F0EDE6', letterSpacing: 0.2, lineHeight: 28 },
  planSubtitle: { fontSize: 13, color: 'rgba(240,237,230,0.55)', marginTop: 4, letterSpacing: 0.1 },

  planBody: {
    borderWidth: 1,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    padding: 20,
  } as any,

  planDescription: { fontSize: 14, lineHeight: 22, letterSpacing: 0.1 },

  planMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: 18,
  },
  planMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  planMetaText: { fontSize: 12, fontWeight: '500' },
  planMetaDot: { width: 3, height: 3, borderRadius: 1.5, marginHorizontal: 10 },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 6,
  },
  ctaText: { fontSize: 15, fontWeight: '700', color: '#1A1005', letterSpacing: 0.2 },
});
