import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View, Text, FlatList, Modal, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, Alert, KeyboardAvoidingView,
  Platform, ScrollView, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Goal, GOAL_TEMPLATES } from '../../types/goal';
import {
  loadGoals, addGoal, toggleTodayComplete, updateGoal,
  deleteGoal, calcStreak, isCompletedToday,
} from '../../services/goalsService';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = Math.round(SCREEN_W * 0.68);
const GOLD   = '#C9A96B';
const GREEN  = '#6DBF8A';
const SERIF  = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function glassStyle(isDark: boolean) {
  return isDark
    ? { backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }
    : { backgroundColor: 'rgba(255,255,255,0.68)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)' };
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

type CardProps = {
  item:     Goal;
  isDark:   boolean;
  onEdit:   (g: Goal) => void;
  onDelete: (g: Goal) => void;
  onToggle: (id: string) => void;
};

const GoalCard = memo(function GoalCard({ item, isDark, onEdit, onDelete, onToggle }: CardProps) {
  const streak = calcStreak(item.completedDates);
  const done   = isCompletedToday(item);
  const pct    = item.target > 0 ? Math.min(1, streak / item.target) : 0;

  const textColor  = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(24,18,8,0.38)';
  const glass      = glassStyle(isDark);

  return (
    <View style={[gc.card, glass, {
      shadowColor: isDark ? '#000' : 'rgba(47,42,36,0.10)',
      shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.24 : 1, shadowRadius: 14, elevation: 5,
    }]}>
      {/* Title + streak row + action icons */}
      <View style={gc.topRow}>
        <View style={gc.titleBlock}>
          <Text style={[gc.title, { color: textColor }]} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={gc.streakRow}>
            {streak > 0 ? (
              <>
                <Ionicons name="flame" size={12} color={done ? GREEN : GOLD} />
                <Text style={[gc.streakText, { color: done ? GREEN : GOLD }]}>
                  {streak}-day streak
                </Text>
              </>
            ) : (
              <Text style={[gc.streakText, { color: mutedColor }]}>Start your streak today</Text>
            )}
          </View>
        </View>

        <View style={gc.actions}>
          <TouchableOpacity
            onPress={() => onEdit(item)}
            style={[gc.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil-outline" size={13} color={mutedColor} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(item)}
            style={[gc.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={13} color={mutedColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress bar */}
      <View style={gc.progressRow}>
        <View style={[gc.track, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
          <View style={[gc.fill, { width: `${pct * 100}%` as any, backgroundColor: done ? GREEN : GOLD }]} />
        </View>
        <Text style={[gc.progressLabel, { color: mutedColor }]}>{streak}/{item.target}d</Text>
      </View>

      {/* Mark done button */}
      <TouchableOpacity
        style={[
          gc.checkBtn,
          { borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.09)' },
          done && { borderColor: 'rgba(109,191,138,0.35)', backgroundColor: 'rgba(109,191,138,0.10)' },
        ]}
        onPress={() => onToggle(item.id)}
        activeOpacity={0.75}
      >
        <Ionicons
          name={done ? 'checkmark-circle' : 'ellipse-outline'}
          size={16}
          color={done ? GREEN : mutedColor}
        />
        <Text style={[gc.checkBtnText, { color: done ? GREEN : mutedColor }]}>
          {done ? 'Completed today' : 'Mark done today'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const gc = StyleSheet.create({
  card:          { marginHorizontal: 20, borderRadius: 18, padding: 18, gap: 14 },
  topRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  titleBlock:    { flex: 1, gap: 4 },
  title:         { fontSize: 16, fontWeight: '600', lineHeight: 22, letterSpacing: -0.1 },
  streakRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakText:    { fontSize: 12, fontWeight: '500' },
  actions:       { flexDirection: 'row', gap: 6, paddingTop: 2 },
  iconBtn:       { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  progressRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track:         { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
  fill:          { height: 3, borderRadius: 2 },
  progressLabel: { fontSize: 11, fontWeight: '500', minWidth: 38, textAlign: 'right' },
  checkBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, borderRadius: 10, borderWidth: 1, paddingVertical: 11,
  },
  checkBtnText: { fontSize: 14, fontWeight: '600' },
});

// ─── Hero Section ─────────────────────────────────────────────────────────────

type HeroProps = {
  goals:          Goal[];
  completedCount: number;
  isDark:         boolean;
  topInset:       number;
  onBack:         () => void;
  onAdd:          () => void;
};

const HeroSection = memo(function HeroSection({
  goals, completedCount, isDark, topInset, onBack, onAdd,
}: HeroProps) {
  const pct = goals.length > 0 ? completedCount / goals.length : 0;
  const textColor  = 'rgba(255,255,255,0.92)';
  const subColor   = 'rgba(255,255,255,0.62)';
  const mutedColor = 'rgba(255,255,255,0.42)';

  return (
    <View style={{ height: HERO_H, overflow: 'hidden', marginBottom: 24 }}>
      <ExpoImage
        source={require('../../assets/stones.jpg')}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.60)', 'rgba(0,0,0,0)']}
        locations={[0, 0.28]}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.84)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Nav row */}
      <View style={[hs.navRow, { top: topInset + 10 }]}>
        <TouchableOpacity
          style={hs.navBtn}
          onPress={onBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.90)" />
        </TouchableOpacity>
        <TouchableOpacity
          style={hs.navBtn}
          onPress={onAdd}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={22} color="rgba(255,255,255,0.90)" />
        </TouchableOpacity>
      </View>

      {/* Hero content */}
      <View style={hs.content}>
        <View style={hs.eyebrowRow}>
          <Ionicons name="flag-outline" size={11} color={GOLD} />
          <Text style={hs.eyebrow}>SPIRITUAL GOALS</Text>
        </View>

        <Text style={[hs.heading, { fontFamily: SERIF }]}>
          Your Growth{'\n'}in Faith
        </Text>

        <Text style={[hs.quote, { color: subColor }]}>
          "I can do all things through Christ who strengthens me."
        </Text>
        <Text style={[hs.quoteRef, { color: mutedColor }]}>— Philippians 4:13</Text>

        {/* Stats strip */}
        {goals.length > 0 && (
          <View style={hs.statsRow}>
            <View style={hs.statItem}>
              <Text style={[hs.statValue, { color: textColor }]}>{completedCount}</Text>
              <Text style={[hs.statLabel, { color: mutedColor }]}>Done today</Text>
            </View>
            <View style={hs.statDivider} />
            <View style={hs.statItem}>
              <Text style={[hs.statValue, { color: textColor }]}>{goals.length}</Text>
              <Text style={[hs.statLabel, { color: mutedColor }]}>Active goals</Text>
            </View>
            <View style={hs.statDivider} />
            <View style={[hs.statItem, { flex: 2, alignItems: 'flex-start' }]}>
              <View style={hs.miniTrack}>
                <View style={[hs.miniFill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: GOLD }]} />
              </View>
              <Text style={[hs.statLabel, { color: mutedColor }]}>Today's progress</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
});

const hs = StyleSheet.create({
  navRow: {
    position: 'absolute', left: 18, right: 18,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.30)',
    alignItems: 'center', justifyContent: 'center',
  },
  content: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 22, paddingBottom: 20,
  },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: GOLD },
  heading: {
    fontSize: 28, fontWeight: '400', lineHeight: 36, letterSpacing: -0.3,
    color: 'rgba(255,255,255,0.95)', marginBottom: 10,
  },
  quote:    { fontSize: 13, fontStyle: 'italic', lineHeight: 19, color: 'rgba(255,255,255,0.62)', marginBottom: 2 },
  quoteRef: { fontSize: 11, marginBottom: 18 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)',
    paddingTop: 14,
  },
  statItem:   { flex: 1, alignItems: 'center', gap: 4 },
  statValue:  { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  statLabel:  { fontSize: 10, fontWeight: '500', letterSpacing: 0.4 },
  statDivider:{ width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.14)', marginHorizontal: 4 },
  miniTrack:  { width: '100%', height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.14)', marginBottom: 4 },
  miniFill:   { height: 4, borderRadius: 2 },
});

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ isDark, onAdd }: { isDark: boolean; onAdd: () => void }) {
  const textColor  = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const subColor   = isDark ? 'rgba(255,255,255,0.60)' : 'rgba(24,18,8,0.60)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';

  return (
    <View style={es.container}>
      <View style={[es.iconWrap, { backgroundColor: isDark ? 'rgba(201,169,107,0.10)' : 'rgba(201,169,107,0.12)', borderWidth: 1, borderColor: 'rgba(201,169,107,0.25)' }]}>
        <Ionicons name="trophy-outline" size={38} color={mutedColor} />
      </View>
      <Text style={[es.title, { color: textColor, fontFamily: SERIF }]}>No goals yet</Text>
      <Text style={[es.body, { color: subColor }]}>
        Set spiritual goals to build consistent{'\n'}habits and track your growth in faith.
      </Text>
      <TouchableOpacity onPress={onAdd} activeOpacity={0.85}>
        <LinearGradient
          colors={[GOLD, '#B8904A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={es.btn}
        >
          <Text style={es.btnText}>Create your first goal</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const es = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 32, paddingBottom: 40, gap: 14 },
  iconWrap:  { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title:     { fontSize: 20, fontWeight: '400', letterSpacing: -0.2 },
  body:      { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  btn:       { borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14, marginTop: 4 },
  btnText:   { fontSize: 15, fontWeight: '700', color: '#08071A' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GoalsScreen() {
  const navigation = useNavigation();
  const t          = useTheme();
  const insets     = useSafeAreaInsets();

  const isDark     = t.statusBar === 'light-content';
  const rootBg     = isDark ? '#060810' : '#DDD5C4';
  const textColor  = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const subColor   = isDark ? 'rgba(255,255,255,0.60)' : 'rgba(24,18,8,0.60)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';
  const divColor   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const sheetBg    = isDark ? '#0E1022' : '#EAE4D6';
  const inputBg    = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)';
  const inputBorder= isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.80)';

  const [goals,         setGoals]         = useState<Goal[]>([]);
  const [modalMode,     setModalMode]     = useState<'add' | 'edit' | null>(null);
  const [editTarget,    setEditTarget]    = useState<Goal | null>(null);
  const [inputTitle,    setInputTitle]    = useState('');
  const [inputTarget,   setInputTarget]   = useState('30');
  const [showTemplates, setShowTemplates] = useState(true);

  const refresh = useCallback(async () => {
    setGoals(await loadGoals());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const openAdd = useCallback(() => {
    setInputTitle('');
    setInputTarget('30');
    setShowTemplates(true);
    setEditTarget(null);
    setModalMode('add');
  }, []);

  const openEdit = useCallback((goal: Goal) => {
    setInputTitle(goal.title);
    setInputTarget(String(goal.target));
    setEditTarget(goal);
    setModalMode('edit');
  }, []);

  const closeModal = useCallback(() => {
    setModalMode(null);
    setEditTarget(null);
  }, []);

  const handleAdd = useCallback(async () => {
    const title = inputTitle.trim();
    if (!title) return;
    const target = Math.max(1, parseInt(inputTarget) || 30);
    await addGoal(title, target);
    await refresh();
    closeModal();
  }, [inputTitle, inputTarget, refresh, closeModal]);

  const handlePickTemplate = useCallback(async (tmplTitle: string, tmplTarget: number) => {
    await addGoal(tmplTitle, tmplTarget);
    await refresh();
    closeModal();
  }, [refresh, closeModal]);

  const handleEdit = useCallback(async () => {
    if (!editTarget) return;
    const title = inputTitle.trim();
    if (!title) return;
    const target = Math.max(1, parseInt(inputTarget) || 30);
    setGoals(await updateGoal(editTarget.id, title, target));
    closeModal();
  }, [editTarget, inputTitle, inputTarget, closeModal]);

  const handleDelete = useCallback((goal: Goal) => {
    Alert.alert('Delete Goal', `Remove "${goal.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => setGoals(await deleteGoal(goal.id)),
      },
    ]);
  }, []);

  const handleToggle = useCallback(async (id: string) => {
    setGoals(await toggleTodayComplete(id));
  }, []);

  const completedCount = useMemo(
    () => goals.filter(isCompletedToday).length,
    [goals],
  );

  const renderGoal = useCallback(({ item }: { item: Goal }) => (
    <GoalCard
      item={item}
      isDark={isDark}
      onEdit={openEdit}
      onDelete={handleDelete}
      onToggle={handleToggle}
    />
  ), [isDark, openEdit, handleDelete, handleToggle]);

  const ListHeader = useCallback(() => (
    <HeroSection
      goals={goals}
      completedCount={completedCount}
      isDark={isDark}
      topInset={insets.top}
      onBack={goBack}
      onAdd={openAdd}
    />
  ), [goals, completedCount, isDark, insets.top, goBack, openAdd]);

  const ListEmpty = useCallback(() => (
    <EmptyState isDark={isDark} onAdd={openAdd} />
  ), [isDark, openAdd]);

  return (
    <View style={{ flex: 1, backgroundColor: rootBg }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <FlatList
        data={goals}
        keyExtractor={g => g.id}
        renderItem={renderGoal}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={[
          { paddingBottom: Math.max(insets.bottom, 16) + 100 },
          goals.length === 0 && { flexGrow: 1 },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        windowSize={11}
        maxToRenderPerBatch={8}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
      />

      {/* Add / Edit Bottom Sheet */}
      <Modal
        visible={modalMode !== null}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={base.modalOverlay}
        >
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeModal} />

          <View style={[sh.sheet, { backgroundColor: sheetBg, paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
            <View style={[sh.handle, { backgroundColor: divColor }]} />

            <Text style={[sh.title, { color: textColor, fontFamily: SERIF }]}>
              {modalMode === 'edit' ? 'Edit Goal' : 'New Goal'}
            </Text>

            {/* Templates (add mode only) */}
            {modalMode === 'add' && showTemplates && (
              <>
                <Text style={[sh.sectionLabel, { color: mutedColor }]}>CHOOSE A TEMPLATE</Text>
                <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
                  {GOAL_TEMPLATES.map(tmpl => (
                    <TouchableOpacity
                      key={tmpl.title}
                      style={[sh.templateRow, { borderBottomColor: divColor }]}
                      onPress={() => handlePickTemplate(tmpl.title, tmpl.target)}
                      activeOpacity={0.7}
                    >
                      <Text style={sh.templateEmoji}>{tmpl.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[sh.templateTitle, { color: textColor }]}>{tmpl.title}</Text>
                        <Text style={[sh.templateMeta, { color: mutedColor }]}>{tmpl.target}-day target</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={mutedColor} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity onPress={() => setShowTemplates(false)} style={sh.switchLink}>
                  <Text style={[sh.switchLinkText, { color: GOLD }]}>Create a custom goal →</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Custom form */}
            {(modalMode === 'edit' || !showTemplates) && (
              <>
                {modalMode === 'add' && (
                  <TouchableOpacity onPress={() => setShowTemplates(true)} style={sh.switchLink}>
                    <Text style={[sh.switchLinkText, { color: GOLD }]}>← Back to templates</Text>
                  </TouchableOpacity>
                )}

                <Text style={[sh.inputLabel, { color: mutedColor }]}>GOAL NAME</Text>
                <TextInput
                  style={[sh.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                  value={inputTitle}
                  onChangeText={setInputTitle}
                  placeholder="e.g. Read Bible daily"
                  placeholderTextColor={mutedColor}
                  autoFocus
                  returnKeyType="next"
                  textAlignVertical="center"
                />

                <Text style={[sh.inputLabel, { color: mutedColor }]}>TARGET (DAYS)</Text>
                <TextInput
                  style={[sh.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                  value={inputTarget}
                  onChangeText={setInputTarget}
                  keyboardType="number-pad"
                  placeholder="30"
                  placeholderTextColor={mutedColor}
                  returnKeyType="done"
                  textAlignVertical="center"
                />

                <TouchableOpacity
                  onPress={modalMode === 'edit' ? handleEdit : handleAdd}
                  disabled={!inputTitle.trim()}
                  activeOpacity={0.85}
                  style={[!inputTitle.trim() && { opacity: 0.4 }]}
                >
                  <LinearGradient
                    colors={[GOLD, '#B8904A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={sh.saveBtn}
                  >
                    <Text style={sh.saveBtnText}>
                      {modalMode === 'edit' ? 'Save Changes' : 'Create Goal'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity onPress={closeModal} style={sh.cancelBtn}>
              <Text style={[sh.cancelBtnText, { color: subColor }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const base = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
});

const sh = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1, borderTopColor: 'rgba(201,169,107,0.18)',
    padding: 24, gap: 14,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  title:  { fontSize: 20, fontWeight: '400', letterSpacing: -0.3 },

  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: -4 },

  templateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  templateEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  templateTitle: { fontSize: 15, fontWeight: '500' },
  templateMeta:  { fontSize: 12, marginTop: 1 },

  switchLink:     { paddingVertical: 2 },
  switchLinkText: { fontSize: 13, fontWeight: '600' },

  inputLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: -6 },
  input: {
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15,
    includeFontPadding: false,
  } as any,

  saveBtn:     { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#08071A' },

  cancelBtn:     { alignItems: 'center', paddingVertical: 4 },
  cancelBtnText: { fontSize: 14 },
});
