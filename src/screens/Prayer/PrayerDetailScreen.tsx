import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable,
  StyleSheet, Alert, Animated, StatusBar, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { getPrayerById, toggleFavorite, deletePrayer, updatePrayer, invalidateCache } from '../../services/prayerService';
import type { Prayer, PrayerStatus } from '../../types/prayer';
import type { HomeStackParamList } from '../../types/navigation';
import { CATEGORY_META, STATUS_META, PRAYER_STATUSES, formatFullDate, daysBetween } from './prayerConfig';

type Nav   = NativeStackNavigationProp<HomeStackParamList>;
type Route = RouteProp<HomeStackParamList, 'PrayerDetail'>;

const GOLD  = '#C9A96B';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function glassStyle(isDark: boolean) {
  return isDark
    ? { backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }
    : { backgroundColor: 'rgba(255,255,255,0.68)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)' };
}

// ─── Status Selector Sheet ────────────────────────────────────────────────────

function StatusSheet({ current, onSelect, onClose, isDark }: {
  current: PrayerStatus;
  onSelect: (s: PrayerStatus) => void;
  onClose: () => void;
  isDark: boolean;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const textColor = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const glass = glassStyle(isDark);

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, tension: 70, friction: 12, useNativeDriver: true }).start();
  }, []);

  const close = () => {
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(onClose);
  };

  return (
    <Animated.View style={[ss.overlay, { opacity: anim }]}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={close} />
      <Animated.View
        style={[
          ss.sheet,
          glass,
          {
            shadowColor: isDark ? '#000' : 'rgba(47,42,36,0.18)',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: isDark ? 0.45 : 1,
            shadowRadius: 20,
            elevation: 10,
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [200, 0] }) }],
          },
        ]}
      >
        <View style={[ss.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)' }]} />
        <Text style={[ss.title, { color: textColor, fontFamily: SERIF }]}>Update Status</Text>
        {PRAYER_STATUSES.map(s => {
          const meta = STATUS_META[s];
          const isActive = current === s;
          return (
            <Pressable
              key={s}
              style={[
                ss.option,
                { borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                  backgroundColor: isActive ? meta.color + '14' : 'transparent' },
              ]}
              onPress={() => { onSelect(s); close(); }}
            >
              <Ionicons name={meta.icon as any} size={20} color={isActive ? meta.color : isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.30)'} />
              <View style={{ flex: 1 }}>
                <Text style={[ss.optionLabel, { color: isActive ? meta.color : textColor }]}>{meta.label}</Text>
              </View>
              {isActive && <Ionicons name="checkmark" size={16} color={meta.color} />}
            </Pressable>
          );
        })}
      </Animated.View>
    </Animated.View>
  );
}

const ss = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.50)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 48,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title:  { fontSize: 18, fontWeight: '400', marginBottom: 16 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLabel: { fontSize: 15, fontWeight: '500' },
});

// ─── Answer Reflection Card ───────────────────────────────────────────────────

function AnswerReflectionCard({ prayer, isDark }: { prayer: Prayer; isDark: boolean }) {
  const glass = glassStyle(isDark);
  const textColor = isDark ? 'rgba(255,255,255,0.90)' : 'rgba(24,18,8,0.90)';
  const subColor  = isDark ? 'rgba(255,255,255,0.62)' : 'rgba(24,18,8,0.62)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';

  const r = prayer.answerReflection;
  const daysWaited = prayer.answeredAt ? daysBetween(prayer.createdAt, prayer.answeredAt) : null;
  const answered = STATUS_META.answered.color;

  return (
    <View style={[ar.card, glass, { borderTopColor: answered, borderTopWidth: 3 }]}>
      <View style={ar.header}>
        <View style={[ar.iconWrap, { backgroundColor: answered + '12' }]}>
          <Ionicons name="checkmark-circle-outline" size={18} color={answered} />
        </View>
        <View>
          <Text style={[ar.headerTitle, { color: answered }]}>Prayer Answered</Text>
          {prayer.answeredAt && (
            <Text style={[ar.headerDate, { color: mutedColor }]}>{formatFullDate(prayer.answeredAt)}</Text>
          )}
        </View>
      </View>

      {daysWaited !== null && (
        <Text style={[ar.waited, { color: mutedColor }]}>
          Waited {daysWaited === 0 ? 'same day' : `${daysWaited} day${daysWaited === 1 ? '' : 's'}`}
        </Text>
      )}

      {r && (
        <View style={ar.fields}>
          {r.howAnswered ? (
            <View style={ar.field}>
              <Text style={[ar.fieldLabel, { color: mutedColor }]}>HOW IT WAS ANSWERED</Text>
              <Text style={[ar.fieldValue, { color: subColor, fontFamily: SERIF }]}>{r.howAnswered}</Text>
            </View>
          ) : null}
          {r.whenHappened ? (
            <View style={ar.field}>
              <Text style={[ar.fieldLabel, { color: mutedColor }]}>WHEN IT HAPPENED</Text>
              <Text style={[ar.fieldValue, { color: subColor }]}>{r.whenHappened}</Text>
            </View>
          ) : null}
          {r.whatLearned ? (
            <View style={ar.field}>
              <Text style={[ar.fieldLabel, { color: mutedColor }]}>WHAT I LEARNED</Text>
              <Text style={[ar.fieldValue, { color: subColor, fontFamily: SERIF, fontStyle: 'italic' }]}>{r.whatLearned}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const ar = StyleSheet.create({
  card: { borderRadius: 18, overflow: 'hidden', padding: 18, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 14, fontWeight: '700' },
  headerDate:  { fontSize: 11, marginTop: 2 },
  waited:      { fontSize: 12, marginBottom: 12 },
  fields:      { gap: 14 },
  field:       {},
  fieldLabel:  { fontSize: 9, fontWeight: '800', letterSpacing: 1.4, marginBottom: 5 },
  fieldValue:  { fontSize: 14, lineHeight: 22 },
});

// ─── Detail Screen ────────────────────────────────────────────────────────────

export default function PrayerDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { prayerId } = route.params;

  const isDark = t.statusBar === 'light-content';
  const rootBg = isDark ? '#060810' : '#DDD5C4';
  const textColor  = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const subColor   = isDark ? 'rgba(255,255,255,0.68)' : 'rgba(24,18,8,0.68)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';

  const [prayer, setPrayer] = useState<Prayer | null>(null);
  const [showStatusSheet, setShowStatusSheet] = useState(false);

  const load = useCallback(async () => {
    const p = await getPrayerById(prayerId);
    setPrayer(p);
  }, [prayerId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleFavorite = useCallback(async () => {
    if (!prayer) return;
    const updated = await toggleFavorite(prayer.id);
    if (updated) setPrayer(updated);
  }, [prayer]);

  const handleStatusChange = useCallback(async (status: PrayerStatus) => {
    if (!prayer) return;
    if (status === 'answered' && prayer.status !== 'answered') {
      navigation.navigate('PrayerAnswered', { prayerId: prayer.id });
      return;
    }
    const updated = await updatePrayer(prayer.id, { status });
    if (updated) { invalidateCache(); setPrayer(updated); }
  }, [prayer, navigation]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Prayer?',
      'This prayer will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            await deletePrayer(prayerId);
            invalidateCache();
            navigation.goBack();
          },
        },
      ],
    );
  }, [prayerId, navigation]);

  if (!prayer) return null;

  const status   = STATUS_META[prayer.status];
  const category = CATEGORY_META[prayer.category];
  const glass    = glassStyle(isDark);
  const glassCard = {
    ...glass,
    borderRadius: 18,
    shadowColor: isDark ? '#000' : 'rgba(47,42,36,0.10)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.24 : 1,
    shadowRadius: 14,
    elevation: 5,
  };

  return (
    <View style={{ flex: 1, backgroundColor: rootBg }}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={[dt.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity
          style={[dt.headerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}
          onPress={() => navigation.goBack()}
          hitSlop={10}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={isDark ? 'rgba(255,255,255,0.88)' : 'rgba(24,18,8,0.88)'} />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={[dt.headerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}
          onPress={handleFavorite}
          hitSlop={10}
          activeOpacity={0.7}
        >
          <Ionicons
            name={prayer.isFavorite ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={prayer.isFavorite ? GOLD : mutedColor}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[dt.headerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', marginLeft: 8 }]}
          onPress={() => navigation.navigate('PrayerEditor', { prayerId: prayer.id })}
          hitSlop={10}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil-outline" size={17} color={mutedColor} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[dt.headerBtn, { backgroundColor: isDark ? 'rgba(220,38,38,0.10)' : 'rgba(220,38,38,0.07)', marginLeft: 8 }]}
          onPress={handleDelete}
          hitSlop={10}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={17} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[dt.scroll, { paddingBottom: Math.max(insets.bottom, 16) + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status badge — tappable */}
        <TouchableOpacity
          style={[dt.statusBadge, { backgroundColor: status.color + '1A', borderColor: status.color + '55' }]}
          onPress={() => setShowStatusSheet(true)}
          activeOpacity={0.82}
        >
          <Ionicons name={status.icon as any} size={14} color={status.color} />
          <Text style={[dt.statusLabel, { color: status.color }]}>{status.label}</Text>
          <Ionicons name="chevron-down" size={12} color={status.color} />
        </TouchableOpacity>

        {/* Title */}
        <Text style={[dt.title, { color: textColor, fontFamily: SERIF }]}>{prayer.title}</Text>

        {/* Meta */}
        <View style={dt.metaRow}>
          <Text style={[dt.metaDate, { color: mutedColor }]}>{formatFullDate(prayer.createdAt)}</Text>
          <View style={[dt.metaDot, { backgroundColor: mutedColor }]} />
          <View style={[dt.catBadge, { backgroundColor: category.color + '18' }]}>
            <Ionicons name={category.icon as any} size={11} color={category.color} />
            <Text style={[dt.catLabel, { color: category.color }]}>{category.label}</Text>
          </View>
        </View>

        {/* Prayer content — glass card with left status bar */}
        <View style={[glassCard, dt.contentCard]}>
          <View style={[dt.contentAccent, { backgroundColor: status.color }]} />
          <Text style={[dt.content, { color: subColor, fontFamily: SERIF }]}>
            {prayer.content || '(No content yet)'}
          </Text>
        </View>

        {/* Bible reference */}
        {prayer.bibleRef && (
          <View style={[glassCard, dt.bibleCard]}>
            <View style={dt.bibleTop}>
              <View style={[dt.bibleIconWrap, { backgroundColor: 'rgba(201,169,107,0.12)' }]}>
                <Ionicons name="book-outline" size={14} color={GOLD} />
              </View>
              <Text style={dt.bibleRef}>{prayer.bibleRef.label}</Text>
            </View>
            {prayer.bibleRef.text ? (
              <Text style={[dt.bibleText, { color: subColor, fontFamily: SERIF }]}>
                "{prayer.bibleRef.text}"
              </Text>
            ) : null}
          </View>
        )}

        {/* Tags */}
        {prayer.tags.length > 0 && (
          <View style={dt.tagsRow}>
            {prayer.tags.map(tag => (
              <View
                key={tag}
                style={[dt.tag, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)' }]}
              >
                <Text style={[dt.tagLabel, { color: mutedColor }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Answer reflection */}
        {prayer.status === 'answered' && (
          <AnswerReflectionCard prayer={prayer} isDark={isDark} />
        )}

        {/* Mark answered CTA */}
        {prayer.status !== 'answered' && (
          <TouchableOpacity
            style={[dt.markAnsweredBtn, { borderColor: STATUS_META.answered.color + '44', backgroundColor: STATUS_META.answered.color + '0A' }]}
            onPress={() => navigation.navigate('PrayerAnswered', { prayerId: prayer.id })}
            activeOpacity={0.82}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color={STATUS_META.answered.color} />
            <Text style={[dt.markAnsweredLabel, { color: STATUS_META.answered.color }]}>
              Mark as Answered
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {showStatusSheet && (
        <StatusSheet
          current={prayer.status}
          onSelect={handleStatusChange}
          onClose={() => setShowStatusSheet(false)}
          isDark={isDark}
        />
      )}
    </View>
  );
}

const dt = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingBottom: 10, gap: 0,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll:    { paddingHorizontal: 20, paddingTop: 16 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: 6, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, marginBottom: 16,
  },
  statusLabel: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '400', letterSpacing: -0.4, lineHeight: 38, marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  metaDate: { fontSize: 12 },
  metaDot:  { width: 3, height: 3, borderRadius: 1.5, opacity: 0.4 },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  catLabel: { fontSize: 11, fontWeight: '600' },

  contentCard:   { flexDirection: 'row', marginBottom: 16, overflow: 'hidden' },
  contentAccent: { width: 3, alignSelf: 'stretch', borderRadius: 0 },
  content:       { flex: 1, fontSize: 17, lineHeight: 28, letterSpacing: 0.2, padding: 16 },

  bibleCard: { padding: 16, marginBottom: 16, gap: 10 },
  bibleTop:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bibleIconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  bibleRef:  { fontSize: 13, fontWeight: '700', color: GOLD, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontStyle: 'italic' },
  bibleText: { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  tag:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  tagLabel: { fontSize: 11, fontWeight: '500' },

  markAnsweredBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16,
  },
  markAnsweredLabel: { fontSize: 15, fontWeight: '600' },
});
