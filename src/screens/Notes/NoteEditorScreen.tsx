import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NotesStackParamList } from '../../types/navigation';
import {
  Note, createNote, updateNote, deleteNote, getNotes, toggleFavorite,
} from '../../services/notesService';
import { useTheme } from '../../theme';

type NavProp = NativeStackNavigationProp<NotesStackParamList>;
type RouteP = RouteProp<NotesStackParamList, 'NoteEditor'>;

export default function NoteEditorScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteP>();
  const t = useTheme();
  const noteId = route.params?.noteId;
  const isNew = !noteId;

  const [note, setNote] = useState<Note | null>(null);
  const [reference, setReference] = useState('');
  const [content, setContent] = useState('');
  const [editing, setEditing] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [favorite, setFavorite] = useState(false);

  const contentRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!noteId) return;
    (async () => {
      try {
        const all = await getNotes();
        const found = all.find(n => n.id === noteId) ?? null;
        if (found) {
          setNote(found);
          setReference(found.bibleReference ?? '');
          setContent(found.content);
          setFavorite(found.favorite);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [noteId]);

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Empty note', 'Please write something before saving.');
      return;
    }
    setSaving(true);
    try {
      const autoTitle = reference.trim() || content.trim().slice(0, 48);
      if (isNew) {
        await createNote({
          title: autoTitle,
          content: content.trim(),
          bibleReference: reference.trim() || undefined,
          devotionId: undefined,
          tags: [],
        });
      } else if (noteId) {
        await updateNote(noteId, {
          title: autoTitle,
          content: content.trim(),
          bibleReference: reference.trim() || undefined,
        });
      }
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          if (noteId) await deleteNote(noteId);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleToggleFavorite = async () => {
    if (!note) return;
    setFavorite(f => !f);
    await toggleFavorite(note);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={[s.header, { borderBottomColor: t.divider }]}>
            <TouchableOpacity
              style={[s.headerBtn, { backgroundColor: t.inputBg, borderColor: t.cardBorder }]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={22} color={t.gold} />
            </TouchableOpacity>

            <View style={s.headerActions}>
              {!isNew && (
                <TouchableOpacity
                  style={[s.headerBtn, { backgroundColor: t.inputBg, borderColor: t.cardBorder }]}
                  onPress={handleToggleFavorite}
                >
                  <Ionicons
                    name={favorite ? 'star' : 'star-outline'}
                    size={20}
                    color={favorite ? t.gold : t.textSub}
                  />
                </TouchableOpacity>
              )}
              {!isNew && !editing && (
                <TouchableOpacity
                  style={[s.headerBtn, { backgroundColor: t.inputBg, borderColor: t.cardBorder }]}
                  onPress={() => setEditing(true)}
                >
                  <Ionicons name="pencil-outline" size={20} color={t.textSub} />
                </TouchableOpacity>
              )}
              {!isNew && editing && (
                <TouchableOpacity
                  style={[s.headerBtn, { backgroundColor: 'rgba(220,38,38,0.08)', borderColor: 'rgba(220,38,38,0.2)' }]}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                </TouchableOpacity>
              )}
              {editing && (
                <TouchableOpacity
                  style={[s.saveBtn, { backgroundColor: t.gold }]}
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  {saving
                    ? <ActivityIndicator color={t.bg} size="small" />
                    : <Text style={[s.saveBtnText, { color: t.bg }]}>Save</Text>
                  }
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Bible Reference card */}
            <View style={[s.refCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
              <View style={s.refCardInner}>
                {editing ? (
                  <TextInput
                    style={[s.refInput, { color: t.gold }]}
                    value={reference}
                    onChangeText={setReference}
                    placeholder="Bible reference (e.g. John 3:16)"
                    placeholderTextColor={t.textMuted}
                    returnKeyType="next"
                    onSubmitEditing={() => contentRef.current?.focus()}
                  />
                ) : (
                  <Text style={[s.refDisplay, { color: reference ? t.gold : t.textMuted }]}>
                    {reference || 'No verse reference'}
                  </Text>
                )}

                {reference.trim() ? (
                  <View style={[s.categoryTag, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}>
                    <Text style={s.categoryTagIcon}>📖</Text>
                    <Text style={[s.categoryTagText, { color: t.gold }]}>Verse</Text>
                  </View>
                ) : (
                  <View style={[s.categoryTag, { backgroundColor: t.inputBg, borderColor: t.cardBorder }]}>
                    <Text style={s.categoryTagIcon}>📝</Text>
                    <Text style={[s.categoryTagText, { color: t.textSub }]}>Note</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Note body card */}
            <View style={[s.noteCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
              <View style={s.noteCardInner}>
                <View style={s.noteLabel}>
                  <Text style={s.noteLabelIcon}>📝</Text>
                  <Text style={[s.noteLabelText, { color: t.textMuted }]}>MY NOTE</Text>
                </View>

                <View style={[s.divider, { backgroundColor: t.divider }]} />

                {editing ? (
                  <TextInput
                    ref={contentRef}
                    style={[s.contentInput, { color: t.text }]}
                    value={content}
                    onChangeText={setContent}
                    placeholder="Write your reflection here…"
                    placeholderTextColor={t.textMuted}
                    multiline
                    textAlignVertical="top"
                    autoFocus={isNew}
                  />
                ) : (
                  <Text style={[s.contentDisplay, { color: content ? t.text : t.textMuted }]}>
                    {content || 'No content yet.'}
                  </Text>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 120, gap: 14 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  saveBtn: {
    paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 20, alignItems: 'center',
    justifyContent: 'center', minWidth: 64,
  },
  saveBtnText: { fontWeight: '700', fontSize: 14 },

  refCard: {
    borderRadius: 16, borderWidth: 1, marginTop: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  refCardInner: { padding: 20, gap: 10 },
  refInput: { fontSize: 22, fontWeight: '700' },
  refDisplay: { fontSize: 22, fontWeight: '700' },
  categoryTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  categoryTagIcon: { fontSize: 13 },
  categoryTagText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  noteCard: {
    borderRadius: 16, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  noteCardInner: { padding: 20 },
  noteLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  noteLabelIcon: { fontSize: 15 },
  noteLabelText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
  divider: { height: 1, marginBottom: 16 },
  contentInput: { fontSize: 15, lineHeight: 24, minHeight: 200 },
  contentDisplay: { fontSize: 15, lineHeight: 24, minHeight: 120 },
});
