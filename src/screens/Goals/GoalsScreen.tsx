import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigation } from '@react-navigation/native';
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

const C = {
  bg: '#0D0F1A',
  card: '#151828',
  cardBorder: '#1F2240',
  gold: '#D4AF37',
  goldDim: '#3A2E10',
  goldBorder: 'rgba(212,175,55,0.35)',
  text: '#F0EFE9',
  textSub: '#8B8FA8',
  textMuted: '#555870',
  green: '#4CAF50',
  greenDim: 'rgba(76,175,80,0.15)',
};

export default function GoalsScreen() {
  const navigation = useNavigation();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<Goal | null>(null);
  const [inputTitle, setInputTitle] = useState('');
  const [inputTarget, setInputTarget] = useState('30');
  const [showTemplates, setShowTemplates] = useState(true);

  const refresh = useCallback(async () => {
    setGoals(await loadGoals());
  }, []);

  useEffect(() => { refresh(); }, []);

  const openAdd = () => {
    setInputTitle('');
    setInputTarget('30');
    setShowTemplates(true);
    setEditTarget(null);
    setModalMode('add');
  };

  const openEdit = (goal: Goal) => {
    setInputTitle(goal.title);
    setInputTarget(String(goal.target));
    setEditTarget(goal);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditTarget(null);
  };

  const handleAdd = async () => {
    const title = inputTitle.trim();
    if (!title) return;
    const target = Math.max(1, parseInt(inputTarget) || 30);
    await addGoal(title, target);
    await refresh();
    closeModal();
  };

  const handlePickTemplate = async (templateTitle: string, templateTarget: number) => {
    await addGoal(templateTitle, templateTarget);
    await refresh();
    closeModal();
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    const title = inputTitle.trim();
    if (!title) return;
    const target = Math.max(1, parseInt(inputTarget) || 30);
    setGoals(await updateGoal(editTarget.id, title, target));
    closeModal();
  };

  const handleDelete = (goal: Goal) => {
    Alert.alert('Delete Goal', `Remove "${goal.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => setGoals(await deleteGoal(goal.id)),
      },
    ]);
  };

  const handleToggle = async (id: string) => {
    setGoals(await toggleTodayComplete(id));
  };

  const completedCount = goals.filter(isCompletedToday).length;

  const renderGoal = ({ item }: { item: Goal }) => {
    const streak = calcStreak(item.completedDates);
    const done = isCompletedToday(item);
    const pct = Math.min(1, streak / item.target);

    return (
      <View style={[s.goalCard, done && s.goalCardDone]}>
        <View style={s.goalTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.goalTitle}>{item.title}</Text>
            <Text style={[s.goalStreak, done && s.goalStreakDone]}>
              {streak > 0 ? `${streak}-day streak 🔥` : 'No streak yet'}
            </Text>
          </View>
          <View style={s.goalActions}>
            <TouchableOpacity onPress={() => openEdit(item)} style={s.iconBtn}>
              <Text style={s.iconBtnText}>✎</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)} style={s.iconBtn}>
              <Text style={[s.iconBtnText, { color: '#E57373' }]}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.progressRow}>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${pct * 100}%` as any }, done && s.progressFillDone]} />
          </View>
          <Text style={s.progressLabel}>{streak}/{item.target}d</Text>
        </View>

        <TouchableOpacity
          style={[s.checkBtn, done && s.checkBtnDone]}
          onPress={() => handleToggle(item.id)}
          activeOpacity={0.75}
        >
          <Text style={[s.checkBtnText, done && s.checkBtnTextDone]}>
            {done ? '✓  Done today' : 'Mark done today'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#5C3A10', '#080604']} style={{ flex: 1 }}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>SPIRITUAL GOALS</Text>
          <TouchableOpacity onPress={openAdd} style={s.addBtn}>
            <Text style={s.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Summary bar */}
        {goals.length > 0 && (
          <View style={s.summaryBar}>
            <Text style={s.summaryText}>
              {completedCount}/{goals.length} completed today
            </Text>
            <View style={s.summaryTrack}>
              <View style={[s.summaryFill, { width: `${(completedCount / goals.length) * 100}%` as any }]} />
            </View>
          </View>
        )}

        {goals.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🎯</Text>
            <Text style={s.emptyTitle}>No goals yet</Text>
            <Text style={s.emptyText}>Set spiritual goals to build consistent habits and track your growth.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={openAdd}>
              <Text style={s.emptyBtnText}>Create your first goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={goals}
            keyExtractor={g => g.id}
            contentContainerStyle={s.list}
            renderItem={renderGoal}
          />
        )}

        {/* Add / Edit Modal */}
        <Modal visible={modalMode !== null} animationType="slide" transparent onRequestClose={closeModal}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalOverlay}>
            <View style={s.sheet}>
              <View style={s.sheetHandle} />
              <Text style={s.sheetTitle}>
                {modalMode === 'edit' ? 'Edit Goal' : 'New Goal'}
              </Text>

              {/* Templates (add mode only) */}
              {modalMode === 'add' && showTemplates && (
                <>
                  <Text style={s.sectionLabel}>CHOOSE A TEMPLATE</Text>
                  <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
                    {GOAL_TEMPLATES.map(t => (
                      <TouchableOpacity
                        key={t.title}
                        style={s.templateRow}
                        onPress={() => handlePickTemplate(t.title, t.target)}
                      >
                        <Text style={s.templateIcon}>{t.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={s.templateTitle}>{t.title}</Text>
                          <Text style={s.templateMeta}>{t.target}-day target</Text>
                        </View>
                        <Text style={s.templateChevron}>›</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity onPress={() => setShowTemplates(false)} style={s.switchLink}>
                    <Text style={s.switchLinkText}>Or create a custom goal →</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Custom form */}
              {(modalMode === 'edit' || !showTemplates) && (
                <>
                  {modalMode === 'add' && (
                    <TouchableOpacity onPress={() => setShowTemplates(true)} style={s.switchLink}>
                      <Text style={s.switchLinkText}>← Back to templates</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={s.inputLabel}>Goal name</Text>
                  <TextInput
                    style={s.input}
                    value={inputTitle}
                    onChangeText={setInputTitle}
                    placeholder="e.g. Read Bible daily"
                    placeholderTextColor={C.textMuted}
                    autoFocus
                    returnKeyType="next"
                  />
                  <Text style={s.inputLabel}>Target (days)</Text>
                  <TextInput
                    style={s.input}
                    value={inputTarget}
                    onChangeText={setInputTarget}
                    keyboardType="number-pad"
                    placeholder="30"
                    placeholderTextColor={C.textMuted}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={[s.saveBtn, !inputTitle.trim() && s.saveBtnDisabled]}
                    onPress={modalMode === 'edit' ? handleEdit : handleAdd}
                    disabled={!inputTitle.trim()}
                  >
                    <Text style={s.saveBtnText}>
                      {modalMode === 'edit' ? 'Save Changes' : 'Create Goal'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity onPress={closeModal} style={s.cancelBtn}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  backBtn: { width: 44, alignItems: 'flex-start' },
  backIcon: { fontSize: 30, color: C.gold, lineHeight: 34 },
  headerTitle: { fontSize: 12, fontWeight: '700', color: C.textMuted, letterSpacing: 1.5 },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.goldDim,
    borderWidth: 1,
    borderColor: C.goldBorder,
  },
  addBtnText: { color: C.gold, fontWeight: '700', fontSize: 13 },

  summaryBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
    gap: 8,
  },
  summaryText: { color: C.textSub, fontSize: 13 },
  summaryTrack: { height: 4, backgroundColor: C.cardBorder, borderRadius: 2, overflow: 'hidden' },
  summaryFill: { height: 4, backgroundColor: C.gold, borderRadius: 2 },

  list: { padding: 16, gap: 12 },

  goalCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 16,
    gap: 12,
  },
  goalCardDone: { borderColor: 'rgba(76,175,80,0.4)', backgroundColor: 'rgba(76,175,80,0.05)' },
  goalTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  goalTitle: { fontSize: 16, fontWeight: '600', color: C.text, marginBottom: 3 },
  goalStreak: { fontSize: 12, color: C.textMuted },
  goalStreakDone: { color: C.green },
  goalActions: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { fontSize: 14, color: C.textSub },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressTrack: { flex: 1, height: 4, backgroundColor: C.cardBorder, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: C.gold, borderRadius: 2 },
  progressFillDone: { backgroundColor: C.green },
  progressLabel: { fontSize: 11, color: C.textMuted, minWidth: 40, textAlign: 'right' },

  checkBtn: {
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.goldBorder,
  },
  checkBtnDone: { backgroundColor: C.greenDim, borderColor: 'rgba(76,175,80,0.4)' },
  checkBtnText: { color: C.gold, fontWeight: '600', fontSize: 14 },
  checkBtnTextDone: { color: C.green },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.text },
  emptyText: { fontSize: 14, color: C.textSub, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: C.gold,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  emptyBtnText: { color: '#0D0F1A', fontWeight: '700', fontSize: 15 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: '#1A1C2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.cardBorder,
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 4 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: C.textMuted,
    letterSpacing: 1.2, marginBottom: 4,
  },

  templateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: C.cardBorder,
  },
  templateIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  templateTitle: { fontSize: 15, color: C.text, fontWeight: '500' },
  templateMeta: { fontSize: 12, color: C.textMuted, marginTop: 1 },
  templateChevron: { fontSize: 20, color: C.textMuted },

  switchLink: { paddingVertical: 4 },
  switchLinkText: { color: C.gold, fontSize: 13, fontWeight: '600' },

  inputLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, marginBottom: -4 },
  input: {
    backgroundColor: C.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
    color: C.text,
    fontSize: 15,
    padding: 13,
  },

  saveBtn: {
    backgroundColor: C.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#0D0F1A', fontWeight: '700', fontSize: 15 },

  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelBtnText: { color: C.textSub, fontSize: 14 },
});
