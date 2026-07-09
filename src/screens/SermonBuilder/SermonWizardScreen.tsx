import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, Animated,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../theme';

const GOLD = '#C9A96B';
import {
  AUDIENCE_OPTIONS, DURATION_OPTIONS, TONE_OPTIONS,
} from '../../types/sermon';
import type { SermonAudience } from '../../types/sermon';

const TAB_BAR_CLEARANCE = 110;

const TOTAL_STEPS = 5;
const STEP_TITLES = [
  'Who are you preaching to?',
  'What type of sermon?',
  'Scripture & Topic',
  'Length & Tone',
  'Review & Generate',
];
const STEP_SUBTITLES = [
  'The AI tailors every word, illustration, and application to your audience.',
  'Choose the sermon format that fits your ministry context.',
  'Enter Bible passages, a topic, or both — the AI does the rest.',
  'How long will you preach? What tone should the sermon carry?',
  'Review your selections before the AI builds your sermon.',
];

// Grouped sermon types for better navigation
const SERMON_TYPE_CATEGORIES = [
  {
    name: 'Preaching Styles',
    types: ['Expository', 'Topical', 'Textual', 'Discipleship', 'Teaching'],
  },
  {
    name: 'Evangelistic',
    types: ['Evangelistic', 'Revival', 'Missions', 'Invitation'],
  },
  {
    name: 'Spiritual Life',
    types: ['Faith', 'Healing', 'Hope', 'Holy Spirit', 'Spiritual Warfare', 'Prayer', 'Worship'],
  },
  {
    name: 'Life & Relationships',
    types: ['Family', 'Marriage', 'Parenting', 'Christian Living', 'Leadership'],
  },
  {
    name: 'Special Services',
    types: ['Communion', 'Baptism', 'Thanksgiving', 'Encouragement'],
  },
  {
    name: 'Calendar & Events',
    types: ['Christmas', 'Easter', 'New Year', "Mother's Day", "Father's Day"],
  },
  {
    name: 'Ministry Format',
    types: ['Bible Study', 'Midweek Teaching', 'Youth Conference', "Children's Ministry", 'Devotional'],
  },
];

const POINT_COUNT: Record<number, number> = { 10: 2, 20: 2, 30: 3, 45: 3, 60: 4 };

export default function SermonWizardScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [step, setStep]               = useState(1);
  const [audience, setAudience]       = useState<SermonAudience | null>(null);
  const [audienceLabel, setAudienceLabel] = useState('');
  const [sermonType, setSermonType]   = useState('');
  const [scriptureText, setScriptureText] = useState('');
  const [topic, setTopic]             = useState('');
  const [duration, setDuration]       = useState(30);
  const [tone, setTone]               = useState('Inspirational');

  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateStep = useCallback((dir: 1 | -1, next: number) => {
    slideAnim.setValue(dir * 28);
    setStep(next);
    Animated.spring(slideAnim, {
      toValue: 0, tension: 150, friction: 17, useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const canAdvance = useCallback(() => {
    if (step === 1) return !!audience;
    if (step === 2) return !!sermonType;
    if (step === 3) return scriptureText.trim().length > 0 || topic.trim().length > 0;
    return true;
  }, [step, audience, sermonType, scriptureText, topic]);

  const handleNext = useCallback(() => {
    if (!canAdvance() || step >= TOTAL_STEPS) return;
    animateStep(1, step + 1);
  }, [step, canAdvance, animateStep]);

  const handleBack = useCallback(() => {
    if (step > 1) animateStep(-1, step - 1);
    else navigation.goBack();
  }, [step, animateStep, navigation]);

  const handleGenerate = useCallback(() => {
    if (!audience) return;
    const scriptures = scriptureText
      .split(/[,\n]+/)
      .map(s => s.trim())
      .filter(Boolean);

    navigation.navigate('SermonGenerating', {
      audience,
      audienceLabel,
      sermonType,
      scriptures,
      topic: topic.trim(),
      duration,
      tone,
    });
  }, [audience, audienceLabel, sermonType, scriptureText, topic, duration, tone, navigation]);

  const bottomClearance = insets.bottom + TAB_BAR_CLEARANCE;

  const isDark  = t.statusBar === 'light-content';
  const rootBg  = isDark ? '#060810' : '#DDD5C4';
  const textColor = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';
  const divColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  return (
    <View style={{ flex: 1, backgroundColor: rootBg }}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />
        {/* Header */}
        <View style={[ws.header, { borderBottomColor: divColor, paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[ws.headerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', borderRadius: 11 }]}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={textColor} />
          </TouchableOpacity>
          <Text style={[ws.headerTitle, { color: textColor }]}>New Sermon</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Step progress */}
        <View style={ws.stepProgress}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
            const num = i + 1;
            const isDone   = num < step;
            const isActive = num === step;
            return (
              <React.Fragment key={i}>
                <View style={[
                  ws.stepCircle,
                  isDone   && { backgroundColor: GOLD, borderColor: GOLD },
                  isActive && { borderColor: GOLD, backgroundColor: 'transparent' },
                  !isDone && !isActive && { borderColor: mutedColor, backgroundColor: 'transparent' },
                ]}>
                  {isDone ? (
                    <Ionicons name="checkmark" size={11} color="#08071A" />
                  ) : (
                    <Text style={[ws.stepNum, { color: isActive ? GOLD : mutedColor }]}>{num}</Text>
                  )}
                </View>
                {i < TOTAL_STEPS - 1 && (
                  <View style={[ws.stepLine, { backgroundColor: isDone ? GOLD : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)') }]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <Animated.View
          style={[
            { flex: 1 },
            {
              opacity: slideAnim.interpolate({ inputRange: [-28, 0, 28], outputRange: [0, 1, 0] }),
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[ws.stepContent, { paddingBottom: bottomClearance + 80 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={ws.stepHeading}>
              <Text style={[ws.stepCounter, { color: GOLD }]}>Step {step} of {TOTAL_STEPS}</Text>
              <Text style={[ws.stepTitle, { color: textColor }]}>{STEP_TITLES[step - 1]}</Text>
              <Text style={[ws.stepSubtitle, { color: mutedColor }]}>{STEP_SUBTITLES[step - 1]}</Text>
            </View>

            {step === 1 && (
              <Step1Audience
                selected={audience}
                onSelect={(val, label) => { setAudience(val); setAudienceLabel(label); }}
              />
            )}
            {step === 2 && <Step2SermonType selected={sermonType} onSelect={setSermonType} />}
            {step === 3 && (
              <Step3Scripture
                scriptureText={scriptureText}
                onScriptureChange={setScriptureText}
                topic={topic}
                onTopicChange={setTopic}
              />
            )}
            {step === 4 && (
              <Step4DurationTone
                duration={duration} tone={tone}
                onDurationChange={setDuration} onToneChange={setTone}
              />
            )}
            {step === 5 && (
              <Step5Review
                audience={audienceLabel} sermonType={sermonType}
                scriptures={scriptureText} topic={topic}
                duration={duration} tone={tone}
              />
            )}
          </ScrollView>
        </Animated.View>

        {/* Bottom CTA */}
        <View style={[ws.bottomBar, {
          backgroundColor: rootBg,
          borderTopColor: divColor,
          paddingBottom: bottomClearance + 8,
        }]}>
          {step < TOTAL_STEPS ? (
            <TouchableOpacity
              onPress={handleNext}
              activeOpacity={0.85}
              disabled={!canAdvance()}
              style={{ borderRadius: 30, overflow: 'hidden', opacity: canAdvance() ? 1 : 0.4 }}
            >
              <LinearGradient
                colors={[GOLD, '#B8904A']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={ws.cta}
              >
                <Text style={[ws.ctaText, { color: '#08071A' }]}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#08071A" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleGenerate}
              activeOpacity={0.85}
              style={{ borderRadius: 30, overflow: 'hidden' }}
            >
              <LinearGradient
                colors={[GOLD, '#B8904A']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={ws.cta}
              >
                <Ionicons name="sparkles" size={18} color="#08071A" />
                <Text style={[ws.ctaText, { color: '#08071A' }]}>Generate My Sermon</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}


// ── Step 1: Audience ──────────────────────────────────────────────────────────

function Step1Audience({
  selected, onSelect,
}: { selected: SermonAudience | null; onSelect: (v: SermonAudience, label: string) => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: 10 }}>
      {AUDIENCE_OPTIONS.map(opt => {
        const active = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              s1.card,
              {
                backgroundColor: active ? t.goldBg : t.card,
                borderColor: active ? t.gold : 'transparent',
              },
            ]}
            onPress={() => onSelect(opt.value, `${opt.title} (${opt.subtitle})`)}
            activeOpacity={0.78}
          >
            <Text style={s1.emoji}>{opt.emoji}</Text>
            <View style={s1.cardBody}>
              <Text style={[s1.title, { color: t.text }]}>{opt.title}</Text>
              <Text style={[s1.sub, { color: t.textMuted }]}>{opt.subtitle}</Text>
            </View>
            <View style={[
              s1.radio,
              active
                ? { backgroundColor: t.gold, borderColor: t.gold }
                : { backgroundColor: 'transparent', borderColor: t.filterInactiveBg },
            ]}>
              {active && <Ionicons name="checkmark" size={13} color="#08071A" />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s1 = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, borderWidth: 2, padding: 18, gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  emoji:    { fontSize: 32, width: 40, textAlign: 'center' },
  cardBody: { flex: 1, gap: 3 },
  title:    { fontSize: 16, fontWeight: '700' },
  sub:      { fontSize: 13 },
  radio: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
});

// ── Step 2: Sermon Type ───────────────────────────────────────────────────────

function Step2SermonType({
  selected, onSelect,
}: { selected: string; onSelect: (v: string) => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: 20 }}>
      {SERMON_TYPE_CATEGORIES.map(cat => (
        <View key={cat.name} style={{ gap: 10 }}>
          <Text style={[s2.catLabel, { color: t.textMuted }]}>{cat.name.toUpperCase()}</Text>
          <View style={s2.grid}>
            {cat.types.map(type => {
              const active = selected === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    s2.pill,
                    {
                      backgroundColor: active ? t.goldBg : t.card,
                      borderColor: active ? t.gold : 'transparent',
                    },
                  ]}
                  onPress={() => onSelect(type)}
                  activeOpacity={0.75}
                >
                  <Text style={[s2.pillText, { color: active ? t.gold : t.textSub }]}>{type}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const s2 = StyleSheet.create({
  catLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
  grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill:     { borderRadius: 24, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 10 },
  pillText: { fontSize: 13, fontWeight: '600' },
});

// ── Step 3: Scripture & Topic ─────────────────────────────────────────────────

function Step3Scripture({
  scriptureText, onScriptureChange, topic, onTopicChange,
}: {
  scriptureText: string; onScriptureChange: (v: string) => void;
  topic: string; onTopicChange: (v: string) => void;
}) {
  const t = useTheme();
  return (
    <View style={s3.container}>
      <View style={[s3.field, { backgroundColor: t.card }]}>
        <View style={s3.fieldHeader}>
          <View style={[s3.fieldIcon, { backgroundColor: t.goldBg }]}>
            <Ionicons name="book-outline" size={15} color={t.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s3.fieldLabel, { color: t.text }]}>Scripture References</Text>
            <Text style={[s3.fieldHint, { color: t.textMuted }]}>e.g. John 15, Romans 8:1-17, Psalm 23</Text>
          </View>
        </View>
        <TextInput
          value={scriptureText}
          onChangeText={onScriptureChange}
          placeholder="Enter one or more passages…"
          placeholderTextColor={t.textMuted}
          multiline
          style={[s3.input, { color: t.text, backgroundColor: t.inputBg }]}
        />
      </View>

      <View style={s3.orRow}>
        <View style={[s3.orLine, { backgroundColor: t.divider }]} />
        <Text style={[s3.orText, { color: t.textMuted }]}>and / or</Text>
        <View style={[s3.orLine, { backgroundColor: t.divider }]} />
      </View>

      <View style={[s3.field, { backgroundColor: t.card }]}>
        <View style={s3.fieldHeader}>
          <View style={[s3.fieldIcon, { backgroundColor: t.goldBg }]}>
            <Ionicons name="bulb-outline" size={15} color={t.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s3.fieldLabel, { color: t.text }]}>Sermon Topic</Text>
            <Text style={[s3.fieldHint, { color: t.textMuted }]}>Faith, Forgiveness, Hope, Marriage…</Text>
          </View>
        </View>
        <TextInput
          value={topic}
          onChangeText={onTopicChange}
          placeholder="Enter a topic or theme…"
          placeholderTextColor={t.textMuted}
          style={[s3.input, { color: t.text, backgroundColor: t.inputBg, height: 54 }]}
        />
      </View>

      <View style={[s3.tip, { backgroundColor: t.accentBg }]}>
        <Ionicons name="information-circle-outline" size={15} color={t.accent} />
        <Text style={[s3.tipText, { color: t.accent }]}>
          Topic only? The AI selects the best passages. Scripture only? The AI finds the central theme. Both works best.
        </Text>
      </View>
    </View>
  );
}

const s3 = StyleSheet.create({
  container:   { gap: 14 },
  field:       { borderRadius: 18, padding: 18, gap: 12 },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fieldIcon:   { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  fieldLabel:  { fontSize: 14, fontWeight: '700' },
  fieldHint:   { fontSize: 11, marginTop: 2 },
  input: {
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, minHeight: 90, textAlignVertical: 'top',
  },
  orRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth },
  orText: { fontSize: 12, fontWeight: '600' },
  tip:    { borderRadius: 12, padding: 12, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  tipText: { flex: 1, fontSize: 12, lineHeight: 19 },
});

// ── Step 4: Duration & Tone ───────────────────────────────────────────────────

function Step4DurationTone({
  duration, tone, onDurationChange, onToneChange,
}: {
  duration: number; tone: string;
  onDurationChange: (v: number) => void; onToneChange: (v: string) => void;
}) {
  const t = useTheme();
  return (
    <View style={s4.container}>
      <View style={{ gap: 12 }}>
        <Text style={[s4.sectionLabel, { color: t.text }]}>Sermon Length</Text>
        <View style={s4.durationRow}>
          {DURATION_OPTIONS.map(d => {
            const active = duration === d;
            const pts = POINT_COUNT[d] ?? 3;
            return (
              <TouchableOpacity
                key={d}
                style={[
                  s4.durBtn,
                  { backgroundColor: active ? t.goldBg : t.card, borderColor: active ? t.gold : 'transparent' },
                ]}
                onPress={() => onDurationChange(d)}
                activeOpacity={0.78}
              >
                <Text style={[s4.durNum, { color: active ? t.gold : t.text }]}>{d}</Text>
                <Text style={[s4.durMin, { color: active ? t.gold : t.textMuted }]}>min</Text>
                <View style={[s4.durPts, { backgroundColor: active ? t.gold : t.filterInactiveBg }]}>
                  <Text style={[s4.durPtsText, { color: active ? '#08071A' : t.textMuted }]}>
                    {pts} pts
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <Text style={[s4.sectionLabel, { color: t.text }]}>Sermon Tone</Text>
        <View style={s4.toneGrid}>
          {TONE_OPTIONS.map(tn => {
            const active = tone === tn;
            return (
              <TouchableOpacity
                key={tn}
                style={[
                  s4.tonePill,
                  { backgroundColor: active ? t.goldBg : t.card, borderColor: active ? t.gold : 'transparent' },
                ]}
                onPress={() => onToneChange(tn)}
                activeOpacity={0.78}
              >
                <Text style={[s4.toneText, { color: active ? t.gold : t.textSub }]}>{tn}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const s4 = StyleSheet.create({
  container:    { gap: 24 },
  sectionLabel: { fontSize: 16, fontWeight: '700', letterSpacing: -0.1 },
  durationRow:  { flexDirection: 'row', gap: 8 },
  durBtn: {
    flex: 1, borderRadius: 16, borderWidth: 2,
    paddingVertical: 14, paddingHorizontal: 4,
    alignItems: 'center', gap: 2,
  },
  durNum:     { fontSize: 20, fontWeight: '800' },
  durMin:     { fontSize: 10, fontWeight: '600' },
  durPts: {
    marginTop: 6, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  durPtsText: { fontSize: 9, fontWeight: '700' },
  toneGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tonePill:   { borderRadius: 24, borderWidth: 2, paddingHorizontal: 16, paddingVertical: 10 },
  toneText:   { fontSize: 13, fontWeight: '600' },
});

// ── Step 5: Review ────────────────────────────────────────────────────────────

function Step5Review({
  audience, sermonType, scriptures, topic, duration, tone,
}: {
  audience: string; sermonType: string; scriptures: string;
  topic: string; duration: number; tone: string;
}) {
  const t = useTheme();
  const rows = [
    { icon: 'people-outline'         as const, label: 'Audience',     value: audience },
    { icon: 'bookmark-outline'       as const, label: 'Sermon Type',  value: sermonType },
    { icon: 'book-outline'           as const, label: 'Scripture',    value: scriptures || '—' },
    { icon: 'bulb-outline'           as const, label: 'Topic',        value: topic || '—' },
    { icon: 'time-outline'           as const, label: 'Duration',     value: `${duration} min · ${POINT_COUNT[duration] ?? 3} main points` },
    { icon: 'musical-notes-outline'  as const, label: 'Tone',         value: tone },
  ];
  return (
    <View style={s5.container}>
      <View style={[s5.card, { backgroundColor: t.card }]}>
        {rows.map((row, i) => (
          <View key={row.label}>
            <View style={s5.row}>
              <View style={[s5.iconWrap, { backgroundColor: t.goldBg }]}>
                <Ionicons name={row.icon} size={15} color={t.gold} />
              </View>
              <View style={s5.rowBody}>
                <Text style={[s5.rowLabel, { color: t.textMuted }]}>{row.label.toUpperCase()}</Text>
                <Text style={[s5.rowValue, { color: t.text }]} numberOfLines={3}>{row.value}</Text>
              </View>
            </View>
            {i < rows.length - 1 && <View style={[s5.divider, { backgroundColor: t.divider }]} />}
          </View>
        ))}
      </View>

      <View style={[s5.disclaimer, { backgroundColor: t.accentBg }]}>
        <Ionicons name="shield-checkmark-outline" size={17} color={t.accent} />
        <Text style={[s5.disclaimerText, { color: t.accent }]}>
          AI assists your preparation — always review, personalise, and prayerfully refine the sermon before preaching. You are the shepherd of your congregation.
        </Text>
      </View>
    </View>
  );
}

const s5 = StyleSheet.create({
  container:      { gap: 14 },
  card:           { borderRadius: 18, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 14, paddingHorizontal: 18, paddingVertical: 16,
  },
  iconWrap:       { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  rowBody:        { flex: 1, gap: 3 },
  rowLabel:       { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  rowValue:       { fontSize: 14, fontWeight: '600', lineHeight: 21 },
  divider:        { height: StyleSheet.hairlineWidth, marginLeft: 64 },
  disclaimer:     { borderRadius: 14, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  disclaimerText: { flex: 1, fontSize: 12, lineHeight: 19 },
});

// ── Shared wizard styles ──────────────────────────────────────────────────────

const ws = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerBtn:   { padding: 6, width: 40 },

  stepProgress: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 28, paddingVertical: 18,
  },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  stepLine: { flex: 1, height: 2, marginHorizontal: 4 },
  stepNum:  { fontSize: 11, fontWeight: '700' },

  stepContent: { paddingHorizontal: 20, paddingTop: 4, gap: 22 },
  stepHeading: { gap: 6, paddingTop: 2 },
  stepCounter:  { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  stepTitle:    { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, lineHeight: 32 },
  stepSubtitle: { fontSize: 13, lineHeight: 20 },

  bottomBar: {
    paddingHorizontal: 20, paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 30, paddingVertical: 17,
  },
  ctaText: { fontSize: 16, fontWeight: '800' },
});
