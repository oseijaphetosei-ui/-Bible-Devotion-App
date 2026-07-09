import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NotesStackParamList } from '../../types/navigation';
import {
  Note, createNote, updateNote, deleteNote, getNote, toggleFavorite,
} from '../../services/notesService';
import { useTheme } from '../../theme';

type NavProp = NativeStackNavigationProp<NotesStackParamList>;
type RouteP = RouteProp<NotesStackParamList, 'NoteEditor'>;

const GOLD  = '#C9A96B';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function NoteEditorScreen() {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RouteP>();
  const t          = useTheme();
  const insets     = useSafeAreaInsets();

  const noteId       = route.params?.noteId;
  const prefillRef   = route.params?.prefillReference ?? '';
  const prefillQuote = route.params?.prefillQuote ?? '';
  const isNew        = !noteId;

  const isDark     = t.statusBar === 'light-content';
  const rootBg     = isDark ? '#060810' : '#DDD5C4';
  const textColor  = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const subColor   = isDark ? 'rgba(255,255,255,0.62)' : 'rgba(24,18,8,0.62)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';
  const divColor   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const glass      = isDark
    ? { backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }
    : { backgroundColor: 'rgba(255,255,255,0.68)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)' };

  const [note,      setNote]      = useState<Note | null>(null);
  const [reference, setReference] = useState(prefillRef);
  const [content,   setContent]   = useState('');
  const [editing,   setEditing]   = useState(isNew);
  const [saving,    setSaving]    = useState(false);
  const [loading,   setLoading]   = useState(!isNew);
  const [favorite,  setFavorite]  = useState(false);

  const contentRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!noteId) return;
    (async () => {
      try {
        const found = await getNote(noteId);
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
      <View style={{ flex: 1, backgroundColor: rootBg, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />
        <ActivityIndicator color={GOLD} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: rootBg }}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[s.header, { paddingTop: insets.top + 8, borderBottomColor: divColor }]}>
          <TouchableOpacity
            style={[s.headerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={textColor} />
          </TouchableOpacity>

          <View style={s.headerActions}>
            {!isNew && (
              <TouchableOpacity
                style={[s.headerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}
                onPress={handleToggleFavorite}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={favorite ? 'star' : 'star-outline'}
                  size={18}
                  color={favorite ? GOLD : mutedColor}
                />
              </TouchableOpacity>
            )}
            {!isNew && !editing && (
              <TouchableOpacity
                style={[s.headerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}
                onPress={() => setEditing(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={18} color={mutedColor} />
              </TouchableOpacity>
            )}
            {!isNew && editing && (
              <TouchableOpacity
                style={[s.headerBtn, { backgroundColor: 'rgba(220,38,38,0.08)', borderWidth: 1, borderColor: 'rgba(220,38,38,0.18)' }]}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color="#DC2626" />
              </TouchableOpacity>
            )}
            {editing && (
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[GOLD, '#B8904A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.saveBtn}
                >
                  {saving
                    ? <ActivityIndicator color="#08071A" size="small" />
                    : <Text style={s.saveBtnText}>Save</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 80 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Bible Reference card */}
          <View style={[
            s.refCard,
            glass,
            {
              shadowColor: isDark ? '#000' : 'rgba(47,42,36,0.10)',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.24 : 1,
              shadowRadius: 14,
              elevation: 5,
            },
          ]}>
            <View style={s.refCardInner}>
              {editing ? (
                <TextInput
                  style={[s.refInput, { color: GOLD, fontFamily: SERIF }]}
                  value={reference}
                  onChangeText={setReference}
                  placeholder="Bible reference (e.g. John 3:16)"
                  placeholderTextColor={mutedColor}
                  returnKeyType="next"
                  onSubmitEditing={() => contentRef.current?.focus()}
                />
              ) : (
                <Text style={[s.refDisplay, { color: reference ? GOLD : mutedColor, fontFamily: SERIF }]}>
                  {reference || 'No verse reference'}
                </Text>
              )}

              {reference.trim() ? (
                <View style={[s.categoryTag, { backgroundColor: 'rgba(201,169,107,0.10)', borderColor: 'rgba(201,169,107,0.28)' }]}>
                  <Ionicons name="book-outline" size={12} color={GOLD} />
                  <Text style={[s.categoryTagText, { color: GOLD }]}>Verse</Text>
                </View>
              ) : (
                <View style={[s.categoryTag, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.09)' }]}>
                  <Ionicons name="create-outline" size={12} color={mutedColor} />
                  <Text style={[s.categoryTagText, { color: subColor }]}>Note</Text>
                </View>
              )}
            </View>
          </View>

          {/* Quoted verse — only shown when pre-filled from Bible reading */}
          {isNew && prefillQuote.trim() ? (
            <View style={[s.quoteBlock, { backgroundColor: 'rgba(201,169,107,0.10)', borderColor: 'rgba(201,169,107,0.28)' }]}>
              <Text style={[s.quoteText, { color: subColor }]}>
                "{prefillQuote.trim()}"
              </Text>
            </View>
          ) : null}

          {/* Note body card */}
          <View style={[
            s.noteCard,
            glass,
            {
              shadowColor: isDark ? '#000' : 'rgba(47,42,36,0.10)',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.24 : 1,
              shadowRadius: 14,
              elevation: 5,
            },
          ]}>
            <View style={s.noteCardInner}>
              <View style={s.noteLabel}>
                <Ionicons name="create-outline" size={14} color={mutedColor} />
                <Text style={[s.noteLabelText, { color: mutedColor }]}>MY NOTE</Text>
              </View>

              <View style={[s.divider, { backgroundColor: divColor }]} />

              {editing ? (
                <TextInput
                  ref={contentRef}
                  style={[s.contentInput, { color: textColor }]}
                  value={content}
                  onChangeText={setContent}
                  placeholder="Write your reflection here…"
                  placeholderTextColor={mutedColor}
                  multiline
                  textAlignVertical="top"
                  autoFocus={isNew}
                />
              ) : (
                <Text style={[s.contentDisplay, { color: content ? textColor : mutedColor }]}>
                  {content || 'No content yet.'}
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 18, gap: 14, paddingTop: 8 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  saveBtn: {
    paddingHorizontal: 20, paddingVertical: 9,
    borderRadius: 20, alignItems: 'center',
    justifyContent: 'center', minWidth: 64,
  },
  saveBtnText: { fontWeight: '700', fontSize: 14, color: '#08071A' },

  refCard:      { borderRadius: 16, marginTop: 6 },
  refCardInner: { padding: 20, gap: 10 },
  refInput:     { fontSize: 22, fontWeight: '700' },
  refDisplay:   { fontSize: 22, fontWeight: '700' },
  categoryTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  categoryTagText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  quoteBlock: {
    borderRadius: 12, borderWidth: 1, borderLeftWidth: 3,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  quoteText: { fontSize: 15, lineHeight: 24, fontStyle: 'italic', fontFamily: SERIF },

  noteCard:      { borderRadius: 16 },
  noteCardInner: { padding: 20 },
  noteLabel:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  noteLabelText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
  divider:       { height: 1, marginBottom: 16 },
  contentInput:  { fontSize: 15, lineHeight: 24, minHeight: 200 },
  contentDisplay: { fontSize: 15, lineHeight: 24, minHeight: 120 },
});
