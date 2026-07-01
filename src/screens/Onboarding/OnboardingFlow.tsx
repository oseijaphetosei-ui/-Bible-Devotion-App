import React, {
  useState, useRef, useCallback, useEffect, memo,
} from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable,
  StyleSheet, Animated, StatusBar, Platform, UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { useTheme, AppTheme } from '../../theme';
import { AppRootParamList } from '../../types/navigation';
import { completeOnboarding, PrimaryGoal } from '../../services/onboardingService';
import { loadPrefs, savePrefs } from '../../services/notificationPreferences';
import { requestPermission, rescheduleAll } from '../../services/notificationService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Constants ────────────────────────────────────────────────────────────────

type GoalOption = { id: PrimaryGoal; emoji: string; title: string; description: string };

const GOALS: GoalOption[] = [
  { id: 'devotion', emoji: '📖', title: 'Daily Devotion',  description: 'A short daily time with God.' },
  { id: 'study',    emoji: '📚', title: 'Bible Study',     description: 'Understand Scripture more deeply.' },
  { id: 'prayer',   emoji: '🙏', title: 'Prayer',          description: 'Grow my prayer life.' },
  { id: 'reading',  emoji: '📅', title: 'Reading Plan',    description: 'Build a consistent reading habit.' },
];

type TranslationOption = { id: string; name: string; description: string; recommended: boolean };

const TRANSLATIONS: TranslationOption[] = [
  { id: 'KJV',         name: 'KJV',         description: 'The classic 1611 King James Version', recommended: true  },
  { id: 'ASANTE_TWI',  name: 'Asante Twi',  description: 'Bible in the Asante Twi dialect',    recommended: false },
  { id: 'AKUAPEM_TWI', name: 'Akuapem Twi', description: 'Bible in the Akuapem Twi dialect',   recommended: false },
];

const HOURS   = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const AMPM: ('AM' | 'PM')[] = ['AM', 'PM'];

const STEP_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'compass-outline',
  'notifications-outline',
  'book-outline',
];

// ─── Full-screen background gradient ─────────────────────────────────────────

function ScreenGradient({ t, children }: { t: AppTheme; children: React.ReactNode }) {
  const isDark = t.statusBar === 'light-content';
  return (
    <LinearGradient
      colors={isDark
        ? ['#0D0F1A', '#09080F', '#0D0F1A']
        : ['#FAF8F4', '#F2EDE3', '#FAF8F4']}
      locations={[0, 0.5, 1]}
      style={{ flex: 1 }}
    >
      {children}
    </LinearGradient>
  );
}

// ─── Step header ──────────────────────────────────────────────────────────────

function StepHeader({ step, t }: { step: number; t: AppTheme }) {
  if (step >= 3) return null;
  const icon = STEP_ICONS[step];
  return (
    <View style={sh.container}>
      <View style={sh.identRow}>
        <Ionicons name={icon} size={11} color={t.accent} />
        <Text style={[sh.identLabel, { color: t.accent }]}>
          {`YOUR JOURNEY · STEP ${step + 1} OF 3`}
        </Text>
      </View>
      <View style={[sh.track, { backgroundColor: t.progressTrack }]}>
        <View
          style={[sh.fill, {
            backgroundColor: t.accent,
            width: `${((step + 1) / 3) * 100}%` as any,
          }]}
        />
      </View>
    </View>
  );
}

const sh = StyleSheet.create({
  container:  { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  identRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  identLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  track:      { height: 2, borderRadius: 1, overflow: 'hidden' },
  fill:       { height: '100%', borderRadius: 1 },
});

// ─── Wheel Column ─────────────────────────────────────────────────────────────

const ITEM_H  = 50;
const VISIBLE = 5;
const WHEEL_H = ITEM_H * VISIBLE;

function WheelColumn<T extends number | string>({ data, selectedValue, onValueChange, renderLabel, t, width }: {
  data: T[];
  selectedValue: T;
  onValueChange: (v: T) => void;
  renderLabel: (v: T) => string;
  t: AppTheme;
  width: number;
}) {
  const scrollRef   = useRef<ScrollView>(null);
  const hasMomentum = useRef(false);

  useEffect(() => {
    const idx = data.indexOf(selectedValue);
    if (idx < 0) return;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: idx * ITEM_H, animated: false });
    });
  }, [selectedValue, data]);

  const snap = useCallback((y: number) => {
    const idx = Math.max(0, Math.min(Math.round(y / ITEM_H), data.length - 1));
    onValueChange(data[idx]);
  }, [data, onValueChange]);

  const centerOff = ITEM_H * Math.floor(VISIBLE / 2);

  return (
    <View style={[wh.column, { width }]}>
      <Animated.View pointerEvents="none" style={[wh.fade, wh.fadeTop,    { backgroundColor: t.card }]} />
      <Animated.View pointerEvents="none" style={[wh.fade, wh.fadeBottom, { backgroundColor: t.card }]} />
      <View
        pointerEvents="none"
        style={[wh.selector, { top: centerOff, borderColor: t.goldBorder, backgroundColor: t.goldBg }]}
      />
      <ScrollView
        ref={scrollRef}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: centerOff }}
        style={{ height: WHEEL_H }}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        onMomentumScrollBegin={() => { hasMomentum.current = true; }}
        onScrollEndDrag={e => { if (!hasMomentum.current) snap(e.nativeEvent.contentOffset.y); }}
        onMomentumScrollEnd={e => { hasMomentum.current = false; snap(e.nativeEvent.contentOffset.y); }}
      >
        {data.map((v, i) => {
          const isSelected = v === selectedValue;
          return (
            <Pressable
              key={i}
              style={wh.item}
              onPress={() => {
                onValueChange(v);
                scrollRef.current?.scrollTo({ y: i * ITEM_H, animated: true });
              }}
            >
              <Text style={[wh.itemText, { color: isSelected ? t.gold : t.textMuted }]}>
                {renderLabel(v)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const wh = StyleSheet.create({
  column:     { alignItems: 'center', overflow: 'hidden', position: 'relative' },
  selector:   { position: 'absolute', left: 0, right: 0, height: ITEM_H, borderTopWidth: 1, borderBottomWidth: 1, borderRadius: 10, zIndex: 0 },
  fade:       { position: 'absolute', left: 0, right: 0, height: ITEM_H * 2, zIndex: 2 },
  fadeTop:    { top: 0, opacity: 0.88 },
  fadeBottom: { bottom: 0, opacity: 0.88 },
  item:       { height: ITEM_H, alignItems: 'center', justifyContent: 'center', zIndex: 3 },
  itemText:   { fontSize: 20, fontWeight: '500', letterSpacing: 0.2 },
});

// ─── Goal Item ────────────────────────────────────────────────────────────────

function GoalItem({ goal, selected, onSelect, t }: {
  goal: GoalOption; selected: boolean; onSelect: () => void; t: AppTheme;
}) {
  const scale     = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 70,  useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 220, friction: 14, useNativeDriver: true }),
    ]).start();
    onSelect();
  }, [scale, onSelect]);

  useEffect(() => {
    Animated.timing(checkAnim, {
      toValue: selected ? 1 : 0, duration: 180, useNativeDriver: true,
    }).start();
  }, [selected, checkAnim]);

  return (
    <Pressable onPress={handlePress} accessibilityRole="radio" accessibilityState={{ checked: selected }}>
      <Animated.View style={[
        gi.item,
        {
          transform:   [{ scale }],
          backgroundColor: selected ? t.goldBg   : t.card,
          borderColor:     selected ? t.goldBorder : t.divider,
          shadowColor:     selected ? t.gold : 'transparent',
          shadowOpacity:   selected ? 0.18 : 0,
          shadowRadius:    selected ? 12 : 0,
          shadowOffset:    { width: 0, height: 3 },
          elevation:       selected ? 4 : 0,
        },
      ]}>
        <View style={[gi.accentBar, { backgroundColor: selected ? t.gold : 'transparent' }]} />
        <Text style={gi.emoji}>{goal.emoji}</Text>
        <View style={gi.textBlock}>
          <Text style={[gi.title, { color: t.text }]}>{goal.title}</Text>
          <Text style={[gi.desc,  { color: t.textMuted }]}>{goal.description}</Text>
        </View>
        <Animated.View style={{ opacity: checkAnim, transform: [{ scale: checkAnim }] }}>
          <Ionicons name="checkmark-circle-sharp" size={22} color={t.gold} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const gi = StyleSheet.create({
  item: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1,
    paddingVertical: 16, paddingRight: 16, overflow: 'hidden',
  },
  accentBar: { width: 3, alignSelf: 'stretch', borderRadius: 2, marginRight: 14 },
  emoji:     { fontSize: 22, marginRight: 14 },
  textBlock: { flex: 1 },
  title:     { fontSize: 15, fontWeight: '600', letterSpacing: 0.1, marginBottom: 2 },
  desc:      { fontSize: 12, lineHeight: 16 },
});

// ─── Goal View ────────────────────────────────────────────────────────────────

function GoalView({ selectedGoal, onSelect, onNext }: {
  selectedGoal: PrimaryGoal | null;
  onSelect: (g: PrimaryGoal) => void;
  onNext: () => void;
}) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, paddingHorizontal: 24 }}>
      <View style={ob.screenTitle}>
        <Text style={[ob.titleLg, { color: t.text }]}>What brings you here?</Text>
        <Text style={[ob.subtitle, { color: t.textMuted }]}>
          We'll personalize your daily journey.
        </Text>
      </View>

      <View style={{ gap: 11 }}>
        {GOALS.map(g => (
          <GoalItem
            key={g.id}
            goal={g}
            selected={selectedGoal === g.id}
            onSelect={() => onSelect(g.id)}
            t={t}
          />
        ))}
      </View>

      <View style={{ flex: 1 }} />

      <TouchableOpacity
        style={[ob.primaryBtn, { backgroundColor: selectedGoal ? t.gold : t.progressTrack }]}
        onPress={onNext}
        disabled={!selectedGoal}
        activeOpacity={0.82}
        accessibilityRole="button"
      >
        <Text style={[ob.primaryBtnLabel, { opacity: selectedGoal ? 1 : 0.45 }]}>Continue</Text>
      </TouchableOpacity>
      <View style={{ height: 32 }} />
    </View>
  );
}

// ─── Reminder View ────────────────────────────────────────────────────────────

type ReminderPhase = 'picker' | 'permission';

function ReminderView({ hour, minute, ampm, onHourChange, onMinuteChange, onAmpmChange, onNext }: {
  hour: number; minute: number; ampm: 'AM' | 'PM';
  onHourChange: (h: number) => void;
  onMinuteChange: (m: number) => void;
  onAmpmChange: (a: 'AM' | 'PM') => void;
  onNext: () => void;
}) {
  const t = useTheme();
  const [phase, setPhase]             = useState<ReminderPhase>('picker');
  const [permLoading, setPermLoading] = useState(false);
  const phaseOpacity = useRef(new Animated.Value(1)).current;

  const previewText = `Every day at ${hour}:${String(minute).padStart(2, '0')} ${ampm}`;

  const transitionTo = useCallback((next: ReminderPhase) => {
    Animated.timing(phaseOpacity, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      setPhase(next);
      Animated.timing(phaseOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }, [phaseOpacity]);

  const handleEnableNotifications = useCallback(async () => {
    if (permLoading) return;
    setPermLoading(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        const hour24 = ampm === 'AM' ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
        const prefs  = await loadPrefs();
        await savePrefs({
          ...prefs,
          masterEnabled: true,
          permissionPromptShown: true,
          dailyVerse:  { ...prefs.dailyVerse,  enabled: true, time: { hour: hour24, minute } },
          readingPlan: { ...prefs.readingPlan, enabled: true, time: { hour: hour24, minute: (minute + 30) % 60 } },
          prayer:      { ...prefs.prayer,      enabled: true, time: { hour: 12, minute: 0 } },
        });
        rescheduleAll().catch(() => {});
      }
    } finally {
      setPermLoading(false);
      onNext();
    }
  }, [permLoading, hour, minute, ampm, onNext]);

  return (
    <View style={{ flex: 1, paddingHorizontal: 24 }}>
      <View style={ob.screenTitle}>
        <Text style={[ob.titleLg, { color: t.text }]}>When would you like{'\n'}your reminder?</Text>
        <Text style={[ob.subtitle, { color: t.textMuted }]}>
          We'll gently remind you to spend time with God.
        </Text>
      </View>

      <Animated.View style={{ flex: 1, opacity: phaseOpacity }}>
        {phase === 'picker' ? (
          <View style={{ flex: 1 }}>
            <View style={[rv.wheelCard, { backgroundColor: t.card, borderColor: t.divider }]}>
              <View style={rv.wheelRow}>
                <WheelColumn
                  data={HOURS} selectedValue={hour} onValueChange={onHourChange}
                  renderLabel={v => String(v)} t={t} width={70}
                />
                <Text style={[rv.colon, { color: t.textMuted }]}>:</Text>
                <WheelColumn
                  data={MINUTES} selectedValue={minute} onValueChange={onMinuteChange}
                  renderLabel={v => String(v).padStart(2, '0')} t={t} width={70}
                />
                <Text style={[rv.colon, { color: t.textMuted }]}> </Text>
                <WheelColumn
                  data={AMPM} selectedValue={ampm}
                  onValueChange={onAmpmChange as (v: 'AM' | 'PM') => void}
                  renderLabel={v => String(v)} t={t} width={60}
                />
              </View>
            </View>

            <View style={[rv.preview, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}>
              <Ionicons name="time-outline" size={14} color={t.gold} style={{ marginRight: 7 }} />
              <Text style={[rv.previewLabel, { color: t.textMuted }]}>Daily reminder</Text>
              <View style={[rv.previewDot, { backgroundColor: t.textMuted }]} />
              <Text style={[rv.previewTime, { color: t.gold }]}>{previewText}</Text>
            </View>

            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={[ob.primaryBtn, { backgroundColor: t.gold }]}
              onPress={() => transitionTo('permission')}
              activeOpacity={0.82}
            >
              <Text style={ob.primaryBtnLabel}>Continue</Text>
            </TouchableOpacity>
            <View style={{ height: 32 }} />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}>
              <View style={[perm.iconWrap, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}>
                <Ionicons name="notifications-outline" size={36} color={t.gold} />
              </View>
              <Text style={[perm.heading, { color: t.text }]}>
                Never miss your daily time with God.
              </Text>
              <Text style={[perm.body, { color: t.textMuted }]}>
                We'll only send gentle reminders for your reading, prayer, and daily verse. No spam, ever.
              </Text>
              <View style={[perm.previewPill, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}>
                <Ionicons name="time-outline" size={14} color={t.gold} />
                <Text style={[perm.previewText, { color: t.gold }]}>{previewText}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[ob.primaryBtn, { backgroundColor: t.gold }]}
              onPress={handleEnableNotifications}
              disabled={permLoading}
              activeOpacity={0.82}
            >
              <Text style={ob.primaryBtnLabel}>{permLoading ? 'Enabling…' : 'Enable Notifications'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ob.ghostBtn} onPress={onNext} activeOpacity={0.7}>
              <Text style={[ob.ghostBtnLabel, { color: t.textMuted }]}>Maybe Later</Text>
            </TouchableOpacity>
            <View style={{ height: 28 }} />
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const rv = StyleSheet.create({
  wheelCard: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 8, alignItems: 'center' },
  wheelRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  colon:     { fontSize: 22, fontWeight: '300', marginHorizontal: 4, marginBottom: 2 },
  preview: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 18, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 16,
    borderWidth: 1,
  },
  previewLabel: { fontSize: 13 },
  previewDot:   { width: 3, height: 3, borderRadius: 1.5, marginHorizontal: 7, opacity: 0.4 },
  previewTime:  { fontSize: 13, fontWeight: '600' },
});

const perm = StyleSheet.create({
  iconWrap: {
    width: 80, height: 80, borderRadius: 24, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 28,
  },
  heading: {
    fontSize: 22, fontWeight: '700', letterSpacing: -0.3,
    textAlign: 'center', lineHeight: 30, marginBottom: 14,
  },
  body: { fontSize: 15, lineHeight: 23, textAlign: 'center', marginBottom: 24 },
  previewPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1,
  },
  previewText: { fontSize: 13, fontWeight: '600' },
});

// ─── Translation Item ─────────────────────────────────────────────────────────

function TranslationItem({ item, selected, onSelect, t }: {
  item: TranslationOption; selected: boolean; onSelect: () => void; t: AppTheme;
}) {
  const checkAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(checkAnim, {
      toValue: selected ? 1 : 0, duration: 160, useNativeDriver: true,
    }).start();
  }, [selected, checkAnim]);

  return (
    <Pressable onPress={onSelect} accessibilityRole="radio" accessibilityState={{ checked: selected }}>
      <View style={[tr.row, {
        borderBottomColor: t.divider,
        backgroundColor:   selected ? t.goldBg : 'transparent',
      }]}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Text style={[tr.name, { color: t.text }]}>{item.name}</Text>
            {item.recommended && (
              <View style={[tr.badge, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}>
                <Text style={[tr.badgeLabel, { color: t.gold }]}>Recommended</Text>
              </View>
            )}
          </View>
          <Text style={[tr.desc, { color: t.textMuted }]}>{item.description}</Text>
        </View>
        <Animated.View style={{ opacity: checkAnim, transform: [{ scale: checkAnim }] }}>
          <Ionicons name="checkmark-circle-sharp" size={20} color={t.gold} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

const tr = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  name:       { fontSize: 16, fontWeight: '600', letterSpacing: 0.1 },
  desc:       { fontSize: 12, lineHeight: 17 },
  badge:      { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  badgeLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
});

// ─── Translation View ─────────────────────────────────────────────────────────

function TranslationView({ selected, onSelect, onNext }: {
  selected: string; onSelect: (id: string) => void; onNext: () => void;
}) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, paddingHorizontal: 24 }}>
      <View style={ob.screenTitle}>
        <Text style={[ob.titleLg, { color: t.text }]}>Choose your Bible{'\n'}translation</Text>
        <Text style={[ob.subtitle, { color: t.textMuted }]}>You can change this anytime.</Text>
      </View>

      <View style={[tv.listCard, { backgroundColor: t.card, borderColor: t.divider }]}>
        {TRANSLATIONS.map(item => (
          <TranslationItem
            key={item.id}
            item={item}
            selected={selected === item.id}
            onSelect={() => onSelect(item.id)}
            t={t}
          />
        ))}
      </View>

      <View style={{ flex: 1 }} />

      <TouchableOpacity
        style={[ob.primaryBtn, { backgroundColor: t.gold }]}
        onPress={onNext}
        activeOpacity={0.82}
      >
        <Text style={ob.primaryBtnLabel}>Continue</Text>
      </TouchableOpacity>
      <View style={{ height: 32 }} />
    </View>
  );
}

const tv = StyleSheet.create({
  listCard: {
    borderRadius: 16, overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
});

// ─── Completion View ──────────────────────────────────────────────────────────

function CompletionView({ onComplete }: { onComplete: () => void }) {
  const t = useTheme();

  const ringAnim     = useRef(new Animated.Value(0)).current;
  const iconAnim     = useRef(new Animated.Value(0)).current;
  const titleAnim    = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const verseAnim    = useRef(new Animated.Value(0)).current;
  const buttonAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(110, [
      Animated.spring(ringAnim,     { toValue: 1, tension: 48, friction: 8,  useNativeDriver: true }),
      Animated.spring(iconAnim,     { toValue: 1, tension: 55, friction: 9,  useNativeDriver: true }),
      Animated.timing(titleAnim,    { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(subtitleAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(verseAnim,    { toValue: 1, duration: 360, useNativeDriver: true }),
      Animated.timing(buttonAnim,   { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  }, []);

  const slide = (anim: Animated.Value, dy = 18) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [dy, 0] }) }],
  });

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 }}>
      {/* Gold outer ring → inner filled badge */}
      <Animated.View style={{
        opacity: ringAnim,
        transform: [{ scale: ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
        marginBottom: 36,
      }}>
        <View style={[co.ring, { borderColor: t.goldBorder }]}>
          <View style={[co.ringInner, { backgroundColor: t.goldBg }]}>
            <Animated.View style={{ opacity: iconAnim, transform: [{ scale: iconAnim }] }}>
              <Ionicons name="checkmark" size={38} color={t.gold} />
            </Animated.View>
          </View>
        </View>
      </Animated.View>

      <Animated.Text style={[co.headline, { color: t.text }, slide(titleAnim)]}>
        You're all set.
      </Animated.Text>

      <Animated.Text style={[co.subtext, { color: t.textMuted }, slide(subtitleAnim)]}>
        Let's begin today's journey together.
      </Animated.Text>

      {/* Verse with gold left accent bar */}
      <Animated.View style={[co.verseBlock, { borderLeftColor: t.goldBorder }, slide(verseAnim)]}>
        <Text style={[co.verseText, { color: t.textSub }]}>
          "Your word is a lamp to my feet{'\n'}and a light to my path."
        </Text>
        <Text style={[co.verseRef, { color: t.gold }]}>— Psalm 119:105</Text>
      </Animated.View>

      <Animated.View style={[{ alignSelf: 'stretch' }, slide(buttonAnim)]}>
        <TouchableOpacity
          style={[ob.primaryBtn, { backgroundColor: t.gold }]}
          onPress={onComplete}
          activeOpacity={0.82}
          accessibilityRole="button"
        >
          <Text style={ob.primaryBtnLabel}>Begin Today's Journey</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const co = StyleSheet.create({
  ring: {
    width: 108, height: 108, borderRadius: 54,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  ringInner: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  headline: {
    fontSize: 36, fontWeight: '700', letterSpacing: -0.6,
    textAlign: 'center', marginBottom: 10,
  },
  subtext: { fontSize: 17, lineHeight: 25, textAlign: 'center', marginBottom: 36 },
  verseBlock: {
    alignSelf: 'stretch', marginBottom: 48,
    paddingLeft: 16, borderLeftWidth: 2,
  },
  verseText: { fontSize: 15, lineHeight: 24, fontStyle: 'italic', marginBottom: 8 },
  verseRef:  { fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
});

// ─── Shared Styles ────────────────────────────────────────────────────────────

const ob = StyleSheet.create({
  screenTitle: { paddingTop: 24, paddingBottom: 28 },
  titleLg: {
    fontSize: 30, fontWeight: '700', letterSpacing: -0.5, lineHeight: 38, marginBottom: 8,
  },
  subtitle:       { fontSize: 15, lineHeight: 22 },
  primaryBtn:     { borderRadius: 30, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  primaryBtnLabel:{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 },
  ghostBtn:       { paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  ghostBtnLabel:  { fontSize: 15, fontWeight: '500' },
});

// ─── Main Flow ────────────────────────────────────────────────────────────────

type Props = {
  navigation: NativeStackNavigationProp<AppRootParamList, 'Onboarding'>;
};

export default function OnboardingFlow({ navigation }: Props) {
  const t = useTheme();
  const isDark = t.statusBar === 'light-content';

  const [step,        setStep]        = useState(0);
  const [goal,        setGoal]        = useState<PrimaryGoal | null>(null);
  const [hour,        setHour]        = useState(7);
  const [minute,      setMinute]      = useState(30);
  const [ampm,        setAmpm]        = useState<'AM' | 'PM'>('AM');
  const [translation, setTranslation] = useState('KJV');

  const contentOpacity    = useRef(new Animated.Value(1)).current;
  const contentTranslateY = useRef(new Animated.Value(0)).current;

  const advanceTo = useCallback((nextStep: number) => {
    Animated.parallel([
      Animated.timing(contentOpacity,    { toValue: 0,   duration: 160, useNativeDriver: true }),
      Animated.timing(contentTranslateY, { toValue: -20, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      contentTranslateY.setValue(24);
      setStep(nextStep);
      Animated.parallel([
        Animated.timing(contentOpacity,    { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(contentTranslateY, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start();
    });
  }, [contentOpacity, contentTranslateY]);

  const handleComplete = useCallback(async () => {
    const hour24 = ampm === 'AM' ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
    await completeOnboarding({
      primaryGoal: goal,
      preferredBibleTranslation: translation,
      reminderTime: { hour: hour24, minute },
    });
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }),
    );
  }, [navigation, goal, translation, hour, minute, ampm]);

  return (
    <ScreenGradient t={t}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />

        <StepHeader step={step} t={t} />

        <Animated.View
          style={{ flex: 1, opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }}
        >
          {step === 0 && (
            <GoalView
              selectedGoal={goal}
              onSelect={setGoal}
              onNext={() => advanceTo(1)}
            />
          )}
          {step === 1 && (
            <ReminderView
              hour={hour} minute={minute} ampm={ampm}
              onHourChange={setHour}
              onMinuteChange={setMinute}
              onAmpmChange={setAmpm}
              onNext={() => advanceTo(2)}
            />
          )}
          {step === 2 && (
            <TranslationView
              selected={translation}
              onSelect={setTranslation}
              onNext={() => advanceTo(3)}
            />
          )}
          {step === 3 && (
            <CompletionView onComplete={handleComplete} />
          )}
        </Animated.View>
      </SafeAreaView>
    </ScreenGradient>
  );
}
