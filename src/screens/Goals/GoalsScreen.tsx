import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import type { AppTheme } from '../../theme';
import { Goal, GOAL_TEMPLATES } from '../../types/goal';
import {
  loadGoals,
  addGoal,
  toggleTodayComplete,
  updateGoal,
  deleteGoal,
  calcStreak,
  isCompletedToday,
} from '../../services/goalsService';

const GREEN        = '#6DBF8A';
const GREEN_BG     = 'rgba(109,191,138,0.10)';
const GREEN_BORDER = 'rgba(109,191,138,0.32)';

// ─── Goal Card ────────────────────────────────────────────────────────────────

type CardProps = {
  item:     Goal;
  t:        AppTheme;
  onEdit:   (g: Goal) => void;
  onDelete: (g: Goal) => void;
  onToggle: (id: string) => void;
};

const GoalCard = memo(function GoalCard({ item, t, onEdit, onDelete, onToggle }: CardProps) {
  const streak = calcStreak(item.completedDates);
  const done   = isCompletedToday(item);
  const pct    = item.target > 0 ? Math.min(1, streak / item.target) : 0;

  return (
    <View style={[gc.card, { backgroundColor: t.card }]}>

      {/* Title + streak row + action icons */}
      <View style={gc.topRow}>
        <View style={gc.titleBlock}>
          <Text style={[gc.title, { color: t.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={gc.streakRow}>
            {streak > 0 ? (
              <>
                <Ionicons name="flame" size={12} color={done ? GREEN : t.gold} />
                <Text style={[gc.streakText, { color: done ? GREEN : t.gold }]}>
                  {streak}-day streak
                </Text>
              </>
            ) : (
              <Text style={[gc.streakText, { color: t.textMuted }]}>
                Start your streak today
              </Text>
            )}
          </View>
        </View>

        <View style={gc.actions}>
          <TouchableOpacity
            onPress={() => onEdit(item)}
            style={[gc.iconBtn, { backgroundColor: t.filterInactiveBg }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil-outline" size={14} color={t.textSub} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(item)}
            style={[gc.iconBtn, { backgroundColor: t.filterInactiveBg }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={14} color={t.textSub} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress bar */}
      <View style={gc.progressRow}>
        <View style={[gc.track, { backgroundColor: t.progressTrack }]}>
          <View
            style={[
              gc.fill,
              { width: `${pct * 100}%` as any },
              { backgroundColor: done ? GREEN : t.gold },
            ]}
          />
        </View>
        <Text style={[gc.progressLabel, { color: t.textMuted }]}>
          {streak}/{item.target}d
        </Text>
      </View>

      {/* Mark done button — neutral until tapped, then green */}
      <TouchableOpacity
        style={[
          gc.checkBtn,
          { borderColor: t.divider },
          done && { borderColor: GREEN_BORDER, backgroundColor: GREEN_BG },
        ]}
        onPress={() => onToggle(item.id)}
        activeOpacity={0.75}
      >
        <Ionicons
          name={done ? 'checkmark-circle' : 'ellipse-outline'}
          size={16}
          color={done ? GREEN : t.textMuted}
        />
        <Text style={[gc.checkBtnText, { color: done ? GREEN : t.textMuted }]}>
          {done ? 'Completed today' : 'Mark done today'}
        </Text>
      </TouchableOpacity>

    </View>
  );
});

const gc = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  titleBlock: { flex: 1, gap: 4 },
  title:      { fontSize: 16, fontWeight: '600', lineHeight: 22, letterSpacing: -0.1 },
  streakRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakText: { fontSize: 12, fontWeight: '500' },
  actions:    { flexDirection: 'row', gap: 6, paddingTop: 2 },
  iconBtn: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },

  progressRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track:         { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
  fill:          { height: 3, borderRadius: 2 },
  progressLabel: { fontSize: 11, fontWeight: '500', minWidth: 38, textAlign: 'right' },

  checkBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 11,
  },
  checkBtnText: { fontSize: 14, fontWeight: '600' },
});

// ─── Hero Section ─────────────────────────────────────────────────────────────

type HeroProps = {
  goals:          Goal[];
  completedCount: number;
  t:              AppTheme;
  onBack:         () => void;
  onAdd:          () => void;
};

const HeroSection = memo(function HeroSection({
  goals, completedCount, t, onBack, onAdd,
}: HeroProps) {
  const isDark = t.statusBar === 'light-content';
  const pct    = goals.length > 0 ? completedCount / goals.length : 0;

  return (
    <LinearGradient
      colors={isDark
        ? ['rgba(19,22,38,1)', 'rgba(13,15,26,0.92)']
        : ['rgba(237,231,217,1)', 'rgba(237,231,217,0.82)']}
      style={hs.container}
    >
      {/* ── Navigation row ── */}
      <View style={hs.navRow}>
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={26} color={t.text} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onAdd}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={26} color={t.text} />
        </TouchableOpacity>
      </View>

      {/* ── Identity ── */}
      <View style={hs.identRow}>
        <Ionicons name="flag-outline" size={15} color={t.accent} />
        <Text style={[hs.identLabel, { color: t.accent }]}>SPIRITUAL GOALS</Text>
      </View>

      <Text style={[hs.heading, { color: t.text }]}>
        Your Growth{'\n'}in Faith
      </Text>

      <Text style={[hs.quote, { color: t.textMuted }]}>
        {"\"I can do all things through Christ\nwho strengthens me.\"\n— Philippians 4:13"}
      </Text>

      {/* ── Daily summary stats (only when goals exist) ── */}
      {goals.length > 0 && (
        <View style={[hs.statsRow, { borderTopColor: t.divider }]}>
          <View style={hs.statItem}>
            <Text style={[hs.statValue, { color: t.text }]}>{completedCount}</Text>
            <Text style={[hs.statLabel, { color: t.textMuted }]}>Done today</Text>
          </View>
          <View style={[hs.statDivider, { backgroundColor: t.divider }]} />
          <View style={hs.statItem}>
            <Text style={[hs.statValue, { color: t.text }]}>{goals.length}</Text>
            <Text style={[hs.statLabel, { color: t.textMuted }]}>Active goals</Text>
          </View>
          <View style={[hs.statDivider, { backgroundColor: t.divider }]} />
          <View style={[hs.statItem, { flex: 2, alignItems: 'flex-start' }]}>
            <View style={[hs.miniTrack, { backgroundColor: t.progressTrack }]}>
              <View
                style={[
                  hs.miniFill,
                  { width: `${Math.round(pct * 100)}%` as any, backgroundColor: t.gold },
                ]}
              />
            </View>
            <Text style={[hs.statLabel, { color: t.textMuted }]}>Today's progress</Text>
          </View>
        </View>
      )}
    </LinearGradient>
  );
});

const hs = StyleSheet.create({
  container:  { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 0, marginBottom: 20 },
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 26,
  },
  identRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  identLabel:  { fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  heading: {
    fontSize: 28, fontWeight: '700', letterSpacing: -0.4,
    lineHeight: 36, marginBottom: 14,
  },
  quote: {
    fontSize: 13, lineHeight: 20, fontStyle: 'italic', marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 20, paddingBottom: 8,
  },
  statItem:    { flex: 1, alignItems: 'center', gap: 4 },
  statValue:   { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  statLabel:   { fontSize: 10, fontWeight: '500', letterSpacing: 0.5 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 32, marginHorizontal: 4 },
  miniTrack:   { width: '100%', height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  miniFill:    { height: 4, borderRadius: 2 },
});

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ t, onAdd }: { t: AppTheme; onAdd: () => void }) {
  return (
    <View style={es.container}>
      <View style={[es.iconWrap, { backgroundColor: t.filterInactiveBg }]}>
        <Ionicons name="trophy-outline" size={40} color={t.textMuted} />
      </View>
      <Text style={[es.title, { color: t.text }]}>No goals yet</Text>
      <Text style={[es.body, { color: t.textSub }]}>
        Set spiritual goals to build consistent{'\n'}habits and track your growth in faith.
      </Text>
      <TouchableOpacity
        style={[es.btn, { backgroundColor: t.gold }]}
        onPress={onAdd}
        activeOpacity={0.8}
      >
        <Text style={[es.btnText, { color: t.bg }]}>Create your first goal</Text>
      </TouchableOpacity>
    </View>
  );
}

const es = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 32, paddingBottom: 40, gap: 14 },
  iconWrap:  { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title:     { fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },
  body:      { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  btn:       { borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14, marginTop: 4 },
  btnText:   { fontSize: 15, fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GoalsScreen() {
  const navigation = useNavigation();
  const t          = useTheme();

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
      t={t}
      onEdit={openEdit}
      onDelete={handleDelete}
      onToggle={handleToggle}
    />
  ), [t, openEdit, handleDelete, handleToggle]);

  const ListHeader = useCallback(() => (
    <HeroSection
      goals={goals}
      completedCount={completedCount}
      t={t}
      onBack={goBack}
      onAdd={openAdd}
    />
  ), [goals, completedCount, t, goBack, openAdd]);

  const ListEmpty = useCallback(() => (
    <EmptyState t={t} onAdd={openAdd} />
  ), [t, openAdd]);

  return (
    <View style={[base.root, { backgroundColor: t.bg }]}>
      <SafeAreaView style={base.safe} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        <FlatList
          data={goals}
          keyExtractor={g => g.id}
          renderItem={renderGoal}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={[
            base.listContent,
            goals.length === 0 && base.listContentEmpty,
          ]}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          windowSize={11}
          maxToRenderPerBatch={8}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>

      {/* ── Add / Edit Bottom Sheet ─────────────────────────────────────────── */}
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
          {/* Tap outside to dismiss */}
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeModal} />

          <View style={[sh.sheet, { backgroundColor: t.cardAlt }]}>
            <View style={[sh.handle, { backgroundColor: t.divider }]} />

            <Text style={[sh.title, { color: t.text }]}>
              {modalMode === 'edit' ? 'Edit Goal' : 'New Goal'}
            </Text>

            {/* ── Templates (add mode only) ── */}
            {modalMode === 'add' && showTemplates && (
              <>
                <Text style={[sh.sectionLabel, { color: t.textMuted }]}>
                  CHOOSE A TEMPLATE
                </Text>
                <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
                  {GOAL_TEMPLATES.map(tmpl => (
                    <TouchableOpacity
                      key={tmpl.title}
                      style={[sh.templateRow, { borderBottomColor: t.divider }]}
                      onPress={() => handlePickTemplate(tmpl.title, tmpl.target)}
                      activeOpacity={0.7}
                    >
                      <Text style={sh.templateEmoji}>{tmpl.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[sh.templateTitle, { color: t.text }]}>
                          {tmpl.title}
                        </Text>
                        <Text style={[sh.templateMeta, { color: t.textMuted }]}>
                          {tmpl.target}-day target
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={t.textMuted} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  onPress={() => setShowTemplates(false)}
                  style={sh.switchLink}
                >
                  <Text style={[sh.switchLinkText, { color: t.gold }]}>
                    Create a custom goal →
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── Custom form ── */}
            {(modalMode === 'edit' || !showTemplates) && (
              <>
                {modalMode === 'add' && (
                  <TouchableOpacity
                    onPress={() => setShowTemplates(true)}
                    style={sh.switchLink}
                  >
                    <Text style={[sh.switchLinkText, { color: t.gold }]}>
                      ← Back to templates
                    </Text>
                  </TouchableOpacity>
                )}

                <Text style={[sh.inputLabel, { color: t.textMuted }]}>GOAL NAME</Text>
                <TextInput
                  style={[
                    sh.input,
                    {
                      backgroundColor: t.inputBg,
                      borderColor:     t.inputBorder,
                      color:           t.text,
                    },
                  ]}
                  value={inputTitle}
                  onChangeText={setInputTitle}
                  placeholder="e.g. Read Bible daily"
                  placeholderTextColor={t.textMuted}
                  autoFocus
                  returnKeyType="next"
                  textAlignVertical="center"
                />

                <Text style={[sh.inputLabel, { color: t.textMuted }]}>TARGET (DAYS)</Text>
                <TextInput
                  style={[
                    sh.input,
                    {
                      backgroundColor: t.inputBg,
                      borderColor:     t.inputBorder,
                      color:           t.text,
                    },
                  ]}
                  value={inputTarget}
                  onChangeText={setInputTarget}
                  keyboardType="number-pad"
                  placeholder="30"
                  placeholderTextColor={t.textMuted}
                  returnKeyType="done"
                  textAlignVertical="center"
                />

                <TouchableOpacity
                  style={[
                    sh.saveBtn,
                    { backgroundColor: t.gold },
                    !inputTitle.trim() && sh.saveBtnDisabled,
                  ]}
                  onPress={modalMode === 'edit' ? handleEdit : handleAdd}
                  disabled={!inputTitle.trim()}
                  activeOpacity={0.8}
                >
                  <Text style={[sh.saveBtnText, { color: t.bg }]}>
                    {modalMode === 'edit' ? 'Save Changes' : 'Create Goal'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity onPress={closeModal} style={sh.cancelBtn}>
              <Text style={[sh.cancelBtnText, { color: t.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Base Styles ──────────────────────────────────────────────────────────────

const base = StyleSheet.create({
  root:             { flex: 1 },
  safe:             { flex: 1 },
  listContent:      { paddingBottom: 120 },
  listContentEmpty: { flexGrow: 1 },
  modalOverlay:     { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
});

// ─── Sheet Styles ─────────────────────────────────────────────────────────────

const sh = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(201,169,107,0.18)',
    padding: 24,
    paddingBottom: 44,
    gap: 14,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 4,
  },
  title:        { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: -4 },

  templateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  templateEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  templateTitle: { fontSize: 15, fontWeight: '500' },
  templateMeta:  { fontSize: 12, marginTop: 1 },

  switchLink:     { paddingVertical: 2 },
  switchLinkText: { fontSize: 13, fontWeight: '600' },

  inputLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: -6 },
  input: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15,
    includeFontPadding: false,
  } as any,

  saveBtn:         { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText:     { fontSize: 15, fontWeight: '700' },

  cancelBtn:     { alignItems: 'center', paddingVertical: 4 },
  cancelBtnText: { fontSize: 14 },
});
