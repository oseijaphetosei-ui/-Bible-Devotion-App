import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, Switch, StyleSheet, StatusBar, ScrollView,
  TouchableOpacity, Modal, FlatList, Animated, Platform,
  Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../theme';
import {
  loadPrefs, savePrefs, formatTime,
  type NotificationPrefs, type NotifTime,
} from '../../services/notificationPreferences';
import {
  checkPermissionStatus, requestPermission, rescheduleAll,
} from '../../services/notificationService';

// ─── Time Picker Modal ────────────────────────────────────────────────────────

const HOURS   = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const ITEM_H  = 48;

function TimePicker({
  visible, value, onClose, onConfirm, t,
}: {
  visible: boolean;
  value: NotifTime;
  onClose: () => void;
  onConfirm: (t: NotifTime) => void;
  t: ReturnType<typeof useTheme>;
}) {
  const [hour,   setHour]   = useState(value.hour);
  const [minute, setMinute] = useState(value.minute);

  const hourRef   = useRef<FlatList>(null);
  const minuteRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!visible) return;
    setHour(value.hour);
    setMinute(value.minute);
    setTimeout(() => {
      hourRef.current?.scrollToIndex({ index: value.hour, animated: false });
      const mIdx = MINUTES.indexOf(value.minute);
      minuteRef.current?.scrollToIndex({ index: mIdx >= 0 ? mIdx : 0, animated: false });
    }, 80);
  }, [visible]);

  const selectedBg = t.goldBg;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={tp.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1}>
          <View style={[tp.sheet, { backgroundColor: t.card }]}>
            <Text style={[tp.heading, { color: t.text }]}>Set Time</Text>

            <View style={tp.pickers}>
              {/* Hour column */}
              <View style={tp.column}>
                <Text style={[tp.colLabel, { color: t.textMuted }]}>HOUR</Text>
                <View style={[tp.wheel, { borderColor: t.divider }]}>
                  <View style={[tp.selector, { backgroundColor: selectedBg }]} pointerEvents="none" />
                  <FlatList
                    ref={hourRef}
                    data={HOURS}
                    keyExtractor={(h) => String(h)}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_H}
                    decelerationRate="fast"
                    contentContainerStyle={{ paddingVertical: ITEM_H }}
                    onMomentumScrollEnd={(e) => {
                      const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
                      setHour(HOURS[Math.max(0, Math.min(idx, HOURS.length - 1))]);
                    }}
                    renderItem={({ item }) => {
                      const h12 = item % 12 === 0 ? 12 : item % 12;
                      const apm = item < 12 ? 'AM' : 'PM';
                      return (
                        <View style={[tp.item, { height: ITEM_H }]}>
                          <Text style={[tp.itemText, { color: item === hour ? t.gold : t.textMuted }]}>
                            {String(h12).padStart(2, '0')} {apm}
                          </Text>
                        </View>
                      );
                    }}
                    getItemLayout={(_, i) => ({ length: ITEM_H, offset: ITEM_H * i, index: i })}
                  />
                </View>
              </View>

              <Text style={[tp.colon, { color: t.textMuted }]}>:</Text>

              {/* Minute column */}
              <View style={tp.column}>
                <Text style={[tp.colLabel, { color: t.textMuted }]}>MIN</Text>
                <View style={[tp.wheel, { borderColor: t.divider }]}>
                  <View style={[tp.selector, { backgroundColor: selectedBg }]} pointerEvents="none" />
                  <FlatList
                    ref={minuteRef}
                    data={MINUTES}
                    keyExtractor={(m) => String(m)}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_H}
                    decelerationRate="fast"
                    contentContainerStyle={{ paddingVertical: ITEM_H }}
                    onMomentumScrollEnd={(e) => {
                      const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
                      setMinute(MINUTES[Math.max(0, Math.min(idx, MINUTES.length - 1))]);
                    }}
                    renderItem={({ item }) => (
                      <View style={[tp.item, { height: ITEM_H }]}>
                        <Text style={[tp.itemText, { color: item === minute ? t.gold : t.textMuted }]}>
                          {String(item).padStart(2, '0')}
                        </Text>
                      </View>
                    )}
                    getItemLayout={(_, i) => ({ length: ITEM_H, offset: ITEM_H * i, index: i })}
                  />
                </View>
              </View>
            </View>

            <View style={tp.actions}>
              <TouchableOpacity style={[tp.btn, { borderColor: t.divider }]} onPress={onClose} activeOpacity={0.7}>
                <Text style={[tp.btnLabel, { color: t.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[tp.btn, tp.btnPrimary, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}
                onPress={() => onConfirm({ hour, minute })}
                activeOpacity={0.8}
              >
                <Text style={[tp.btnLabel, { color: t.gold }]}>Set Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const tp = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  sheet:   { width: 320, borderRadius: 24, padding: 24 },
  heading: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 24 },
  pickers: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  column:  { flex: 1, alignItems: 'center' },
  colLabel:{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  wheel:   { width: '100%', height: ITEM_H * 3, borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  selector:{
    position: 'absolute', top: ITEM_H, left: 0, right: 0, height: ITEM_H,
    borderRadius: 10, zIndex: 0,
  },
  item:    { justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  itemText:{ fontSize: 18, fontWeight: '600' },
  colon:   { fontSize: 22, fontWeight: '600', paddingBottom: ITEM_H + 6 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btn:     { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  btnPrimary: {},
  btnLabel:{ fontSize: 15, fontWeight: '600' },
});

// ─── Section header ───────────────────────────────────────────────────────────

function SectionLabel({ label, t }: { label: string; t: ReturnType<typeof useTheme> }) {
  return (
    <Text style={[s.sectionLabel, { color: t.textMuted }]}>{label}</Text>
  );
}

// ─── Setting row variants ─────────────────────────────────────────────────────

function ToggleRow({
  icon, label, description, value, onChange, last, t,
}: {
  icon: string; label: string; description?: string;
  value: boolean; onChange: (v: boolean) => void;
  last?: boolean; t: ReturnType<typeof useTheme>;
}) {
  return (
    <>
      <View style={s.row}>
        <View style={[s.iconWrap, { backgroundColor: t.goldBg }]}>
          <Ionicons name={icon as any} size={17} color={t.gold} />
        </View>
        <View style={s.rowBody}>
          <Text style={[s.rowLabel, { color: t.text }]}>{label}</Text>
          {description ? <Text style={[s.rowDesc, { color: t.textMuted }]}>{description}</Text> : null}
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: t.filterInactiveBg, true: '#C9A96B' }}
          thumbColor="#fff"
          ios_backgroundColor={t.filterInactiveBg}
        />
      </View>
      {!last && <View style={[s.divider, { backgroundColor: t.divider }]} />}
    </>
  );
}

function TimeRow({
  icon, label, time, onPress, disabled, last, t,
}: {
  icon: string; label: string; time: NotifTime;
  onPress: () => void; disabled?: boolean;
  last?: boolean; t: ReturnType<typeof useTheme>;
}) {
  return (
    <>
      <TouchableOpacity
        style={[s.row, disabled && { opacity: 0.38 }]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={[s.iconWrap, { backgroundColor: t.goldBg }]}>
          <Ionicons name={icon as any} size={17} color={t.gold} />
        </View>
        <View style={s.rowBody}>
          <Text style={[s.rowLabel, { color: t.text }]}>{label}</Text>
        </View>
        <Text style={[s.timeLabel, { color: t.gold }]}>{formatTime(time)}</Text>
        <Ionicons name="chevron-forward" size={14} color={t.textMuted} style={{ marginLeft: 4 }} />
      </TouchableOpacity>
      {!last && <View style={[s.divider, { backgroundColor: t.divider }]} />}
    </>
  );
}

// ─── Permission banner ────────────────────────────────────────────────────────

function PermissionBanner({ t, onPress }: { t: ReturnType<typeof useTheme>; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[s.banner, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons name="notifications-outline" size={20} color={t.gold} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[s.bannerTitle, { color: t.text }]}>Enable Notifications</Text>
        <Text style={[s.bannerDesc, { color: t.textMuted }]}>
          Tap to open Settings and allow notifications for Daily Devotion.
        </Text>
      </View>
      <Ionicons name="arrow-forward" size={16} color={t.gold} />
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type TimePickerTarget = 'verse' | 'reading' | 'streak' | 'prayer' | 'quietStart' | 'quietEnd';

export default function NotificationsScreen() {
  const t   = useTheme();
  const nav = useNavigation();

  const [prefs,  setPrefs]  = useState<NotificationPrefs | null>(null);
  const [status, setStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [pickerTarget, setPickerTarget] = useState<TimePickerTarget | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const reload = useCallback(async () => {
    const [p, st] = await Promise.all([
      loadPrefs(),
      checkPermissionStatus(),
    ]);
    setPrefs(p);
    setStatus(st);
    Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const update = useCallback(async (patch: Partial<NotificationPrefs>) => {
    if (!prefs) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    await savePrefs(next);
    await rescheduleAll(next);
  }, [prefs]);

  const handleMasterToggle = useCallback(async (val: boolean) => {
    if (val && status !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        setStatus('denied');
        return;
      }
      setStatus('granted');
    }
    await update({ masterEnabled: val });
  }, [status, update]);

  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const getPickerTime = (): NotifTime => {
    if (!prefs) return { hour: 7, minute: 0 };
    switch (pickerTarget) {
      case 'verse':       return prefs.dailyVerse.time;
      case 'reading':     return prefs.readingPlan.time;
      case 'streak':      return prefs.streak.time;
      case 'prayer':      return prefs.prayer.time;
      case 'quietStart':  return prefs.quietHours.start;
      case 'quietEnd':    return prefs.quietHours.end;
      default:            return { hour: 7, minute: 0 };
    }
  };

  const handleTimeConfirm = useCallback(async (time: NotifTime) => {
    setPickerTarget(null);
    if (!prefs || !pickerTarget) return;
    switch (pickerTarget) {
      case 'verse':      await update({ dailyVerse:  { ...prefs.dailyVerse,  time } }); break;
      case 'reading':    await update({ readingPlan: { ...prefs.readingPlan, time } }); break;
      case 'streak':     await update({ streak:      { ...prefs.streak,      time } }); break;
      case 'prayer':     await update({ prayer:      { ...prefs.prayer,      time } }); break;
      case 'quietStart': await update({ quietHours: { ...prefs.quietHours, start: time } }); break;
      case 'quietEnd':   await update({ quietHours: { ...prefs.quietHours, end:   time } }); break;
    }
  }, [prefs, pickerTarget, update]);

  if (!prefs) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />
          <View style={[s.header, { borderBottomColor: t.divider }]}>
            <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color={t.text} />
            </TouchableOpacity>
            <Text style={[s.headerTitle, { color: t.text }]}>Notifications</Text>
            <View style={{ width: 32 }} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const masterOn = prefs.masterEnabled && status === 'granted';

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        {/* Header */}
        <View style={[s.header, { borderBottomColor: t.divider }]}>
          <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={t.text} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: t.text }]}>Notifications</Text>
          <View style={{ width: 32 }} />
        </View>

        <Animated.ScrollView
          style={{ opacity: fadeAnim }}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Permission denied banner */}
          {status === 'denied' && (
            <PermissionBanner t={t} onPress={openSettings} />
          )}

          {/* ── Master Switch ── */}
          <SectionLabel label="NOTIFICATIONS" t={t} />
          <View style={[s.card, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            <ToggleRow
              icon="notifications-outline"
              label="Allow Notifications"
              description="Receive gentle reminders for Scripture and prayer"
              value={prefs.masterEnabled}
              onChange={handleMasterToggle}
              last
              t={t}
            />
          </View>

          {/* ── Daily Verse ── */}
          <SectionLabel label="DAILY VERSE" t={t} />
          <View style={[s.card, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            <ToggleRow
              icon="book-outline"
              label="Daily Verse"
              description="A reminder to read today's Scripture"
              value={prefs.dailyVerse.enabled}
              onChange={(v) => update({ dailyVerse: { ...prefs.dailyVerse, enabled: v } })}
              t={t}
            />
            <View style={[s.divider, { backgroundColor: t.divider }]} />
            <TimeRow
              icon="time-outline"
              label="Reminder Time"
              time={prefs.dailyVerse.time}
              onPress={() => setPickerTarget('verse')}
              disabled={!masterOn || !prefs.dailyVerse.enabled}
              last
              t={t}
            />
          </View>

          {/* ── Reading Plan ── */}
          <SectionLabel label="READING PLAN" t={t} />
          <View style={[s.card, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            <ToggleRow
              icon="journal-outline"
              label="Reading Reminder"
              description="Sent only when today's reading isn't complete yet"
              value={prefs.readingPlan.enabled}
              onChange={(v) => update({ readingPlan: { ...prefs.readingPlan, enabled: v } })}
              t={t}
            />
            <View style={[s.divider, { backgroundColor: t.divider }]} />
            <TimeRow
              icon="time-outline"
              label="Reminder Time"
              time={prefs.readingPlan.time}
              onPress={() => setPickerTarget('reading')}
              disabled={!masterOn || !prefs.readingPlan.enabled}
              last
              t={t}
            />
          </View>

          {/* ── Streak ── */}
          <SectionLabel label="STREAK PROTECTION" t={t} />
          <View style={[s.card, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            <ToggleRow
              icon="flame-outline"
              label="Streak Reminder"
              description="Encourages you to maintain your daily habit"
              value={prefs.streak.enabled}
              onChange={(v) => update({ streak: { ...prefs.streak, enabled: v } })}
              t={t}
            />
            <View style={[s.divider, { backgroundColor: t.divider }]} />
            <TimeRow
              icon="time-outline"
              label="Evening Reminder"
              time={prefs.streak.time}
              onPress={() => setPickerTarget('streak')}
              disabled={!masterOn || !prefs.streak.enabled}
              last
              t={t}
            />
          </View>

          {/* ── Prayer ── */}
          <SectionLabel label="PRAYER" t={t} />
          <View style={[s.card, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            <ToggleRow
              icon="heart-outline"
              label="Prayer Reminder"
              description="A peaceful nudge to spend time in prayer"
              value={prefs.prayer.enabled}
              onChange={(v) => update({ prayer: { ...prefs.prayer, enabled: v } })}
              t={t}
            />
            <View style={[s.divider, { backgroundColor: t.divider }]} />
            <TimeRow
              icon="time-outline"
              label="Reminder Time"
              time={prefs.prayer.time}
              onPress={() => setPickerTarget('prayer')}
              disabled={!masterOn || !prefs.prayer.enabled}
              last
              t={t}
            />
          </View>

          {/* ── Options ── */}
          <SectionLabel label="OPTIONS" t={t} />
          <View style={[s.card, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            <ToggleRow
              icon="volume-medium-outline"
              label="Sound"
              value={prefs.sound}
              onChange={(v) => update({ sound: v })}
              t={t}
            />
            <View style={[s.divider, { backgroundColor: t.divider }]} />
            <ToggleRow
              icon="sunny-outline"
              label="Weekend Notifications"
              description="Include Saturdays and Sundays"
              value={prefs.weekends}
              onChange={(v) => update({ weekends: v })}
              last
              t={t}
            />
          </View>

          {/* ── Quiet Hours ── */}
          <SectionLabel label="QUIET HOURS" t={t} />
          <View style={[s.card, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            <ToggleRow
              icon="moon-outline"
              label="Quiet Hours"
              description="Silence all notifications during this window"
              value={prefs.quietHours.enabled}
              onChange={(v) => update({ quietHours: { ...prefs.quietHours, enabled: v } })}
              t={t}
            />
            <View style={[s.divider, { backgroundColor: t.divider }]} />
            <TimeRow
              icon="arrow-down-circle-outline"
              label="Start"
              time={prefs.quietHours.start}
              onPress={() => setPickerTarget('quietStart')}
              disabled={!prefs.quietHours.enabled}
              t={t}
            />
            <View style={[s.divider, { backgroundColor: t.divider }]} />
            <TimeRow
              icon="arrow-up-circle-outline"
              label="End"
              time={prefs.quietHours.end}
              onPress={() => setPickerTarget('quietEnd')}
              disabled={!prefs.quietHours.enabled}
              last
              t={t}
            />
          </View>

          <Text style={[s.footer, { color: t.textMuted }]}>
            Notifications are a gentle invitation, never a demand.{'\n'}
            You can turn these off anytime.
          </Text>
        </Animated.ScrollView>
      </SafeAreaView>

      {/* Time Picker Modal */}
      <TimePicker
        visible={pickerTarget !== null}
        value={getPickerTime()}
        onClose={() => setPickerTarget(null)}
        onConfirm={handleTimeConfirm}
        t={t}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn:     { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', textAlign: 'center' },

  scroll: { padding: 20, paddingBottom: 60 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.4,
    marginBottom: 10, marginTop: 28, marginLeft: 4,
  },

  card: {
    borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },

  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowBody:  { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowDesc:  { fontSize: 12, marginTop: 2, lineHeight: 17 },
  timeLabel:{ fontSize: 15, fontWeight: '600' },
  divider:  { height: 1, marginHorizontal: 16 },

  banner: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 16,
    padding: 16, marginBottom: 8, gap: 4,
  },
  bannerTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  bannerDesc:  { fontSize: 12, lineHeight: 17 },

  footer: {
    fontSize: 12, textAlign: 'center', lineHeight: 18,
    marginTop: 36, paddingHorizontal: 24,
  },
});
