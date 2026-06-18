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
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NotesStackParamList } from '../../types/navigation';
import {
  Note,
  createNote,
  updateNote,
  deleteNote,
  getNotes,
  toggleFavorite,
} from '../../services/notesService';

type NavProp = NativeStackNavigationProp<NotesStackParamList>;
type RouteP = RouteProp<NotesStackParamList, 'NoteEditor'>;

const C = {
  gold: '#D4AF37',
  text: '#F0EFE9',
  textSub: '#8B8FA8',
  textMuted: '#555870',
};

export default function NoteEditorScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteP>();
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

  // Load existing note
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
        text: 'Delete',
        style: 'destructive',
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
      <LinearGradient colors={['#5C3A10', '#080604']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.gold} size="large" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#5C3A10', '#080604']} style={{ flex: 1 }}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color={C.gold} />
            </TouchableOpacity>

            <View style={s.headerActions}>
              {!isNew && (
                <TouchableOpacity style={s.headerBtn} onPress={handleToggleFavorite}>
                  <Ionicons
                    name={favorite ? 'star' : 'star-outline'}
                    size={20}
                    color={favorite ? C.gold : C.textSub}
                  />
                </TouchableOpacity>
              )}
              {!isNew && !editing && (
                <TouchableOpacity style={s.headerBtn} onPress={() => setEditing(true)}>
                  <Ionicons name="pencil-outline" size={20} color={C.textSub} />
                </TouchableOpacity>
              )}
              {!isNew && editing && (
                <TouchableOpacity style={s.headerBtn} onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={20} color="#E05555" />
                </TouchableOpacity>
              )}
              {editing && (
                <TouchableOpacity
                  style={s.saveBtn}
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  {saving
                    ? <ActivityIndicator color="#0D0F1A" size="small" />
                    : <Text style={s.saveBtnText}>Save</Text>
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
            {/* Bible Reference — glass card */}
            <BlurView intensity={50} tint="dark" style={s.refCard}>
              <View style={s.refCardTint} pointerEvents="none" />
              <View style={s.refCardHighlight} pointerEvents="none" />

              <View style={s.refCardInner}>
                {editing ? (
                  <TextInput
                    style={s.refInput}
                    value={reference}
                    onChangeText={setReference}
                    placeholder="Bible reference (e.g. John 3:16)"
                    placeholderTextColor={C.textMuted}
                    returnKeyType="next"
                    onSubmitEditing={() => contentRef.current?.focus()}
                  />
                ) : (
                  <Text style={[s.refDisplay, !reference && s.refDisplayEmpty]}>
                    {reference || 'No verse reference'}
                  </Text>
                )}

                {reference.trim() ? (
                  <View style={s.categoryTag}>
                    <Text style={s.categoryTagIcon}>📖</Text>
                    <Text style={s.categoryTagText}>Verse</Text>
                  </View>
                ) : (
                  <View style={[s.categoryTag, s.categoryTagNote]}>
                    <Text style={s.categoryTagIcon}>📝</Text>
                    <Text style={[s.categoryTagText, { color: C.textSub }]}>Note</Text>
                  </View>
                )}
              </View>
            </BlurView>

            {/* Note body — glass card */}
            <BlurView intensity={45} tint="dark" style={s.noteCard}>
              <View style={s.noteCardTint} pointerEvents="none" />
              <View style={s.noteCardHighlight} pointerEvents="none" />

              <View style={s.noteCardInner}>
                <View style={s.noteLabel}>
                  <Text style={s.noteLabelIcon}>📝</Text>
                  <Text style={s.noteLabelText}>MY NOTE</Text>
                </View>

                <View style={s.divider} />

                {editing ? (
                  <TextInput
                    ref={contentRef}
                    style={s.contentInput}
                    value={content}
                    onChangeText={setContent}
                    placeholder="Write your reflection here…"
                    placeholderTextColor={C.textMuted}
                    multiline
                    textAlignVertical="top"
                    autoFocus={isNew}
                  />
                ) : (
                  <Text style={[s.contentDisplay, !content && { color: C.textMuted }]}>
                    {content || 'No content yet.'}
                  </Text>
                )}
              </View>
            </BlurView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 120, gap: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: C.gold,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  saveBtnText: { color: '#0D0F1A', fontWeight: '700', fontSize: 14 },

  // Reference glass card
  refCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginTop: 6,
  },
  refCardTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(72,38,8,0.3)',
  },
  refCardHighlight: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 1,
  },
  refCardInner: { padding: 20, gap: 10 },
  refInput: {
    fontSize: 22,
    fontWeight: '700',
    color: C.gold,
  },
  refDisplay: {
    fontSize: 22,
    fontWeight: '700',
    color: C.gold,
  },
  refDisplayEmpty: {
    color: C.textMuted,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryTagNote: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryTagIcon: { fontSize: 13 },
  categoryTagText: { fontSize: 12, fontWeight: '700', color: C.gold, letterSpacing: 0.5 },

  // Note body glass card
  noteCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  noteCardTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16,10,30,0.55)',
  },
  noteCardHighlight: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 1,
  },
  noteCardInner: { padding: 20 },
  noteLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  noteLabelIcon: { fontSize: 15 },
  noteLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1.4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginBottom: 16,
  },
  contentInput: {
    fontSize: 15,
    color: C.text,
    lineHeight: 24,
    minHeight: 200,
  },
  contentDisplay: {
    fontSize: 15,
    color: C.text,
    lineHeight: 24,
    minHeight: 120,
  },
});
