import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable,
  StyleSheet, Alert, Animated, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { getPrayerById, toggleFavorite, deletePrayer, updatePrayer, invalidateCache } from '../../services/prayerService';
import type { Prayer, PrayerStatus } from '../../types/prayer';
import type { HomeStackParamList } from '../../types/navigation';
import { CATEGORY_META, STATUS_META, PRAYER_STATUSES, formatFullDate, daysBetween } from './prayerConfig';

type Nav   = NativeStackNavigationProp<HomeStackParamList>;
type Route = RouteProp<HomeStackParamList, 'PrayerDetail'>;

// ─── Status Selector Sheet ────────────────────────────────────────────────────

function StatusSheet({ current, onSelect, onClose }: {
  current: PrayerStatus;
  onSelect: (s: PrayerStatus) => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, tension: 70, friction: 12, useNativeDriver: true }).start();
  }, []);

  const close = () => {
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(onClose);
  };

  return (
    <Animated.View
      style={[
        ss.overlay,
        { opacity: anim },
      ]}
    >
      <Pressable style={StyleSheet.absoluteFillObject} onPress={close} />
      <Animated.View
        style={[
          ss.sheet,
          { backgroundColor: t.card, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [200, 0] }) }] },
        ]}
      >
        <View style={[ss.handle, { backgroundColor: t.divider }]} />
        <Text style={[ss.title, { color: t.text }]}>Update Status</Text>
        {PRAYER_STATUSES.map(s => {
          const meta = STATUS_META[s];
          const isActive = current === s;
          return (
            <Pressable
              key={s}
              style={[
                ss.option,
                { borderColor: t.divider, backgroundColor: isActive ? meta.color + '14' : 'transparent' },
              ]}
              onPress={() => { onSelect(s); close(); }}
            >
              <Text style={ss.emoji}>{meta.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[ss.optionLabel, { color: isActive ? meta.color : t.text }]}>{meta.label}</Text>
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
    backgroundColor: 'rgba(0,0,0,0.38)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  emoji: { fontSize: 20 },
  optionLabel: { fontSize: 15, fontWeight: '500' },
});

// ─── Answer Reflection Card ───────────────────────────────────────────────────

function AnswerReflectionCard({ prayer }: { prayer: Prayer }) {
  const t = useTheme();
  const r = prayer.answerReflection;
  const daysWaited = prayer.answeredAt
    ? daysBetween(prayer.createdAt, prayer.answeredAt)
    : null;

  return (
    <View style={[ar.card, { backgroundColor: t.card, borderColor: STATUS_META.answered.color + '44' }]}>
      <View style={ar.header}>
        <Text style={ar.headerEmoji}>✨</Text>
        <View>
          <Text style={[ar.headerTitle, { color: STATUS_META.answered.color }]}>Prayer Answered</Text>
          {prayer.answeredAt && (
            <Text style={[ar.headerDate, { color: t.textMuted }]}>{formatFullDate(prayer.answeredAt)}</Text>
          )}
        </View>
      </View>
      {daysWaited !== null && (
        <Text style={[ar.waited, { color: t.textMuted }]}>
          Waited {daysWaited === 0 ? 'same day' : `${daysWaited} day${daysWaited === 1 ? '' : 's'}`}
        </Text>
      )}
      {r && (
        <View style={ar.fields}>
          {r.howAnswered ? (
            <View style={ar.field}>
              <Text style={[ar.fieldLabel, { color: t.textMuted }]}>How it was answered</Text>
              <Text style={[ar.fieldValue, { color: t.text }]}>{r.howAnswered}</Text>
            </View>
          ) : null}
          {r.whenHappened ? (
            <View style={ar.field}>
              <Text style={[ar.fieldLabel, { color: t.textMuted }]}>When it happened</Text>
              <Text style={[ar.fieldValue, { color: t.text }]}>{r.whenHappened}</Text>
            </View>
          ) : null}
          {r.whatLearned ? (
            <View style={ar.field}>
              <Text style={[ar.fieldLabel, { color: t.textMuted }]}>What I learned</Text>
              <Text style={[ar.fieldValue, { color: t.text }]}>{r.whatLearned}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const ar = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  headerEmoji: { fontSize: 24 },
  headerTitle: { fontSize: 14, fontWeight: '700' },
  headerDate: { fontSize: 12, marginTop: 2 },
  waited: { fontSize: 12, marginBottom: 12 },
  fields: { gap: 12 },
  field: {},
  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 3 },
  fieldValue: { fontSize: 14, lineHeight: 21 },
});

// ─── Detail Screen ────────────────────────────────────────────────────────────

export default function PrayerDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const t = useTheme();
  const { prayerId } = route.params;

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

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle={t.statusBar} />

        {/* Header */}
        <View style={[dt.header, { borderBottomColor: t.divider }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={t.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={handleFavorite} hitSlop={12} activeOpacity={0.7}>
            <Ionicons
              name={prayer.isFavorite ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={prayer.isFavorite ? t.gold : t.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('PrayerEditor', { prayerId: prayer.id })}
            hitSlop={12}
            activeOpacity={0.7}
            style={{ marginLeft: 16 }}
          >
            <Ionicons name="pencil-outline" size={18} color={t.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} hitSlop={12} activeOpacity={0.7} style={{ marginLeft: 16 }}>
            <Ionicons name="trash-outline" size={18} color={t.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={dt.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Status badge */}
          <TouchableOpacity
            style={[dt.statusBadge, { backgroundColor: status.color + '1A', borderColor: status.color + '55' }]}
            onPress={() => setShowStatusSheet(true)}
            activeOpacity={0.82}
          >
            <Text style={dt.statusEmoji}>{status.emoji}</Text>
            <Text style={[dt.statusLabel, { color: status.color }]}>{status.label}</Text>
            <Ionicons name="chevron-down" size={12} color={status.color} />
          </TouchableOpacity>

          {/* Title */}
          <Text style={[dt.title, { color: t.text }]}>{prayer.title}</Text>

          {/* Meta */}
          <View style={dt.metaRow}>
            <Text style={[dt.metaDate, { color: t.textMuted }]}>{formatFullDate(prayer.createdAt)}</Text>
            <View style={[dt.metaDot, { backgroundColor: t.textMuted }]} />
            <View style={[dt.catBadge, { backgroundColor: category.color + '22' }]}>
              <Ionicons name={category.icon as any} size={11} color={category.color} />
              <Text style={[dt.catLabel, { color: category.color }]}>{category.label}</Text>
            </View>
          </View>

          {/* Prayer content — serif font for reflective feel */}
          <View style={[dt.contentBlock, { borderLeftColor: status.color + '60' }]}>
            <Text style={[dt.content, { color: t.text, fontFamily: t.fontSerif }]}>
              {prayer.content || '(No content yet)'}
            </Text>
          </View>

          {/* Bible reference */}
          {prayer.bibleRef && (
            <View style={[dt.bibleCard, { backgroundColor: t.card, borderColor: t.accentBorder }]}>
              <Ionicons name="book-outline" size={14} color={t.accent} style={{ marginBottom: 4 }} />
              <Text style={[dt.bibleRef, { color: t.accent }]}>{prayer.bibleRef.label}</Text>
              {prayer.bibleRef.text ? (
                <Text style={[dt.bibleText, { color: t.textSub, fontFamily: t.fontSerif }]}>
                  "{prayer.bibleRef.text}"
                </Text>
              ) : null}
            </View>
          )}

          {/* Tags */}
          {prayer.tags.length > 0 && (
            <View style={dt.tagsRow}>
              {prayer.tags.map(tag => (
                <View key={tag} style={[dt.tag, { backgroundColor: t.chipBg, borderColor: t.chipBorder }]}>
                  <Text style={[dt.tagLabel, { color: t.textMuted }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Answer reflection */}
          {prayer.status === 'answered' && (
            <AnswerReflectionCard prayer={prayer} />
          )}

          {/* Mark answered CTA (if not yet answered) */}
          {prayer.status !== 'answered' && (
            <TouchableOpacity
              style={[dt.markAnsweredBtn, { borderColor: STATUS_META.answered.color + '55' }]}
              onPress={() => navigation.navigate('PrayerAnswered', { prayerId: prayer.id })}
              activeOpacity={0.82}
            >
              <Text style={dt.markAnsweredEmoji}>✨</Text>
              <Text style={[dt.markAnsweredLabel, { color: STATUS_META.answered.color }]}>
                Mark as Answered
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>

        {showStatusSheet && (
          <StatusSheet
            current={prayer.status}
            onSelect={handleStatusChange}
            onClose={() => setShowStatusSheet(false)}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const dt = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusEmoji: { fontSize: 13 },
  statusLabel: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.4, lineHeight: 36, marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  metaDate: { fontSize: 12 },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, opacity: 0.4 },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  catLabel: { fontSize: 11, fontWeight: '600' },
  contentBlock: {
    borderLeftWidth: 3,
    borderRadius: 2,
    paddingLeft: 16,
    marginBottom: 24,
  },
  content: { fontSize: 17, lineHeight: 28, letterSpacing: 0.2 },
  bibleCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  bibleRef: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  bibleText: { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 24 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  tagLabel: { fontSize: 11, fontWeight: '500' },
  markAnsweredBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  markAnsweredEmoji: { fontSize: 18 },
  markAnsweredLabel: { fontSize: 15, fontWeight: '600' },
});
