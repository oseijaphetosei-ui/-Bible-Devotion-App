import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, Pressable,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import {
  addPrayer, updatePrayer, getPrayerById, invalidateCache,
} from '../../services/prayerService';
import type { PrayerCategory, PrayerStatus, BibleRef } from '../../types/prayer';
import type { HomeStackParamList } from '../../types/navigation';
import {
  CATEGORY_META, STATUS_META, PRAYER_CATEGORIES, PRAYER_STATUSES,
} from './prayerConfig';

type Nav   = NativeStackNavigationProp<HomeStackParamList>;
type Route = RouteProp<HomeStackParamList, 'PrayerEditor'>;

// ─── Category Chip ────────────────────────────────────────────────────────────

function CategoryChip({ id, selected, onPress }: {
  id: PrayerCategory; selected: boolean; onPress: () => void;
}) {
  const t = useTheme();
  const meta = CATEGORY_META[id];
  return (
    <Pressable
      onPress={onPress}
      style={[
        cc.chip,
        {
          backgroundColor: selected ? meta.color + '22' : t.inputBg,
          borderColor: selected ? meta.color + '66' : t.inputBorder,
        },
      ]}
    >
      <Ionicons name={meta.icon as any} size={13} color={selected ? meta.color : t.textMuted} />
      <Text style={[cc.label, { color: selected ? meta.color : t.textMuted }]}>{meta.label}</Text>
    </Pressable>
  );
}

const cc = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: { fontSize: 12, fontWeight: '500' },
});

// ─── Status Option ────────────────────────────────────────────────────────────

function StatusOption({ id, selected, onPress }: {
  id: PrayerStatus; selected: boolean; onPress: () => void;
}) {
  const t = useTheme();
  const meta = STATUS_META[id];
  return (
    <Pressable
      onPress={onPress}
      style={[
        so.option,
        {
          backgroundColor: selected ? meta.color + '20' : t.inputBg,
          borderColor: selected ? meta.color + '60' : t.inputBorder,
        },
      ]}
    >
      <Text style={so.emoji}>{meta.emoji}</Text>
      <Text style={[so.label, { color: selected ? meta.color : t.textMuted }]}>{meta.label}</Text>
    </Pressable>
  );
}

const so = StyleSheet.create({
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
  },
  emoji: { fontSize: 16 },
  label: { fontSize: 11, fontWeight: '600' },
});

// ─── Bible Ref Row ────────────────────────────────────────────────────────────

function BibleRefField({ value, onChange }: {
  value: BibleRef | undefined;
  onChange: (ref: BibleRef | undefined) => void;
}) {
  const t = useTheme();
  const [expanded, setExpanded] = useState(!!value);
  const [label, setLabel] = useState(value?.label ?? '');
  const [text, setText] = useState(value?.text ?? '');

  const commit = useCallback(() => {
    if (label.trim()) onChange({ label: label.trim(), text: text.trim() });
    else onChange(undefined);
  }, [label, text, onChange]);

  return (
    <View style={[brf.container, { borderColor: t.divider }]}>
      <Pressable
        style={brf.header}
        onPress={() => setExpanded(e => !e)}
      >
        <Ionicons name="book-outline" size={15} color={t.accent} />
        <Text style={[brf.headerLabel, { color: t.text }]}>
          {value ? value.label : 'Attach a Bible verse'}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={t.textMuted}
        />
      </Pressable>
      {expanded && (
        <View style={brf.fields}>
          <TextInput
            style={[brf.input, { color: t.text, borderBottomColor: t.divider }]}
            placeholder="Reference (e.g. John 3:16)"
            placeholderTextColor={t.textMuted}
            value={label}
            onChangeText={setLabel}
            onBlur={commit}
            returnKeyType="next"
          />
          <TextInput
            style={[brf.textarea, { color: t.text }]}
            placeholder="Verse text (optional)"
            placeholderTextColor={t.textMuted}
            value={text}
            onChangeText={setText}
            onBlur={commit}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          {value && (
            <Pressable onPress={() => { onChange(undefined); setLabel(''); setText(''); setExpanded(false); }}>
              <Text style={[brf.remove, { color: t.textMuted }]}>Remove reference</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const brf = StyleSheet.create({
  container: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 },
  headerLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  fields: { paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
  input: { fontSize: 14, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  textarea: { fontSize: 14, lineHeight: 21, minHeight: 60 },
  remove: { fontSize: 12, textDecorationLine: 'underline', marginTop: 4 },
});

// ─── Tags Input ───────────────────────────────────────────────────────────────

function TagsField({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const theme = useTheme();
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim().toLowerCase();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  };

  return (
    <View style={tf.container}>
      <View style={tf.row}>
        {tags.map(tag => (
          <Pressable
            key={tag}
            style={[tf.tag, { backgroundColor: theme.accentBg, borderColor: theme.accentBorder }]}
            onPress={() => onChange(tags.filter(t => t !== tag))}
          >
            <Text style={[tf.tagText, { color: theme.accent }]}>#{tag}</Text>
            <Ionicons name="close" size={10} color={theme.accent} />
          </Pressable>
        ))}
      </View>
      <TextInput
        style={[tf.input, { color: theme.text, borderTopColor: tags.length ? theme.divider : 'transparent' }]}
        placeholder="Add a tag…"
        placeholderTextColor={theme.textMuted}
        value={input}
        onChangeText={setInput}
        onSubmitEditing={add}
        onBlur={add}
        autoCapitalize="none"
        returnKeyType="done"
      />
    </View>
  );
}

const tf = StyleSheet.create({
  container: {},
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1,
  },
  tagText: { fontSize: 12, fontWeight: '500' },
  input: { fontSize: 14, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
});

// ─── Field Label ──────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: string }) {
  const t = useTheme();
  return (
    <Text style={[ed.fieldLabel, { color: t.textMuted }]}>{children}</Text>
  );
}

// ─── Editor Screen ────────────────────────────────────────────────────────────

export default function PrayerEditorScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const t          = useTheme();

  const params    = route.params;
  const prayerId  = params?.prayerId;
  const isEditing = !!prayerId;

  const [title,    setTitle]    = useState('');
  const [content,  setContent]  = useState(params?.prefillContent ?? '');
  const [category, setCategory] = useState<PrayerCategory>('family');
  const [status,   setStatus]   = useState<PrayerStatus>('active');
  const [bibleRef, setBibleRef] = useState<BibleRef | undefined>(
    params?.prefillVerse ? { label: params.prefillVerse.label, text: params.prefillVerse.text } : undefined,
  );
  const [tags,     setTags]     = useState<string[]>([]);
  const [saving,   setSaving]   = useState(false);

  // Load existing prayer when editing
  useEffect(() => {
    if (!prayerId) return;
    getPrayerById(prayerId).then(p => {
      if (!p) return;
      setTitle(p.title);
      setContent(p.content);
      setCategory(p.category);
      setStatus(p.status);
      setBibleRef(p.bibleRef);
      setTags(p.tags);
    });
  }, [prayerId]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please add a title for your prayer.');
      return;
    }
    setSaving(true);
    try {
      if (isEditing) {
        await updatePrayer(prayerId!, { title: title.trim(), content, category, status, bibleRef, tags });
      } else {
        await addPrayer({ title: title.trim(), content, category, status, bibleRef, tags, isFavorite: false });
      }
      invalidateCache();
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }, [title, content, category, status, bibleRef, tags, isEditing, prayerId, navigation]);

  const handleDiscard = useCallback(() => {
    if (!title && !content) { navigation.goBack(); return; }
    Alert.alert('Discard changes?', 'Your prayer will not be saved.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  }, [title, content, navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <StatusBar barStyle={t.statusBar} />

        {/* Header */}
        <View style={[ed.header, { borderBottomColor: t.divider }]}>
          <Pressable onPress={handleDiscard} hitSlop={12}>
            <Ionicons name="close" size={22} color={t.text} />
          </Pressable>
          <Text style={[ed.headerTitle, { color: t.text }]}>
            {isEditing ? 'Edit Prayer' : 'New Prayer'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.7}>
            <Text style={[ed.saveBtn, { color: saving ? t.textMuted : t.accent }]}>
              {saving ? 'Saving…' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={ed.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Prayer title — large, no border */}
            <TextInput
              style={[ed.titleInput, { color: t.text }]}
              placeholder="Prayer title…"
              placeholderTextColor={t.textMuted}
              value={title}
              onChangeText={setTitle}
              multiline
              maxLength={120}
              returnKeyType="next"
              autoFocus={!isEditing}
            />

            {/* Category */}
            <FieldLabel>Category</FieldLabel>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={ed.chipRow}
            >
              {PRAYER_CATEGORIES.map(id => (
                <CategoryChip
                  key={id}
                  id={id}
                  selected={category === id}
                  onPress={() => setCategory(id)}
                />
              ))}
            </ScrollView>

            {/* Status */}
            <FieldLabel>Status</FieldLabel>
            <View style={ed.statusRow}>
              {PRAYER_STATUSES.map(id => (
                <StatusOption
                  key={id}
                  id={id}
                  selected={status === id}
                  onPress={() => setStatus(id)}
                />
              ))}
            </View>

            {/* Prayer content */}
            <FieldLabel>Your Prayer</FieldLabel>
            <TextInput
              style={[ed.contentInput, { color: t.text, borderColor: t.inputBorder }]}
              placeholder="Write your prayer here. Pour out your heart honestly before God…"
              placeholderTextColor={t.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              scrollEnabled={false}
            />

            {/* Bible reference */}
            <FieldLabel>Bible Reference (optional)</FieldLabel>
            <BibleRefField value={bibleRef} onChange={setBibleRef} />

            {/* Tags */}
            <FieldLabel>Tags (optional)</FieldLabel>
            <View style={[ed.tagsContainer, { borderColor: t.inputBorder }]}>
              <TagsField tags={tags} onChange={setTags} />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const ed = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  saveBtn: { fontSize: 16, fontWeight: '700' },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  titleInput: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 34,
    paddingVertical: 16,
    minHeight: 70,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 24,
    marginBottom: 10,
  },
  chipRow: { gap: 8, paddingBottom: 4 },
  statusRow: { flexDirection: 'row', gap: 8 },
  contentInput: {
    fontSize: 16,
    lineHeight: 26,
    minHeight: 160,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  tagsContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
});
