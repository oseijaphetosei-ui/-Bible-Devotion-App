import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, Pressable,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

const GOLD  = '#C9A96B';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

// ─── Category Chip ────────────────────────────────────────────────────────────

function CategoryChip({ id, selected, onPress, isDark }: {
  id: PrayerCategory; selected: boolean; onPress: () => void; isDark: boolean;
}) {
  const meta = CATEGORY_META[id];
  return (
    <Pressable
      onPress={onPress}
      style={[
        cc.chip,
        selected
          ? { backgroundColor: meta.color + '1E', borderColor: meta.color + '66' }
          : { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)' },
      ]}
    >
      <Ionicons name={meta.icon as any} size={13} color={selected ? meta.color : isDark ? 'rgba(255,255,255,0.40)' : 'rgba(24,18,8,0.40)'} />
      <Text style={[cc.label, { color: selected ? meta.color : isDark ? 'rgba(255,255,255,0.55)' : 'rgba(24,18,8,0.55)' }]}>
        {meta.label}
      </Text>
    </Pressable>
  );
}

const cc = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  label: { fontSize: 12, fontWeight: '500' },
});

// ─── Status Option ────────────────────────────────────────────────────────────

function StatusOption({ id, selected, onPress, isDark }: {
  id: PrayerStatus; selected: boolean; onPress: () => void; isDark: boolean;
}) {
  const meta = STATUS_META[id];
  return (
    <Pressable
      onPress={onPress}
      style={[
        so.option,
        selected
          ? { backgroundColor: meta.color + '18', borderColor: meta.color + '60' }
          : { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)' },
      ]}
    >
      <Text style={so.emoji}>{meta.emoji}</Text>
      <Text style={[so.label, { color: selected ? meta.color : isDark ? 'rgba(255,255,255,0.50)' : 'rgba(24,18,8,0.50)' }]}>
        {meta.label}
      </Text>
    </Pressable>
  );
}

const so = StyleSheet.create({
  option: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, borderRadius: 14, borderWidth: 1, gap: 4,
  },
  emoji: { fontSize: 16 },
  label: { fontSize: 11, fontWeight: '600' },
});

// ─── Bible Ref Row ────────────────────────────────────────────────────────────

function BibleRefField({ value, onChange, isDark }: {
  value: BibleRef | undefined;
  onChange: (ref: BibleRef | undefined) => void;
  isDark: boolean;
}) {
  const textColor  = isDark ? 'rgba(255,255,255,0.90)' : 'rgba(24,18,8,0.90)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';
  const glassInput = {
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.85)',
  };

  const [expanded, setExpanded] = useState(!!value);
  const [label, setLabel] = useState(value?.label ?? '');
  const [text, setText] = useState(value?.text ?? '');

  const commit = useCallback(() => {
    if (label.trim()) onChange({ label: label.trim(), text: text.trim() });
    else onChange(undefined);
  }, [label, text, onChange]);

  return (
    <View style={[brf.container, { borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)' }]}>
      <Pressable style={brf.header} onPress={() => setExpanded(e => !e)}>
        <View style={[brf.iconWrap, { backgroundColor: 'rgba(201,169,107,0.10)' }]}>
          <Ionicons name="book-outline" size={14} color={GOLD} />
        </View>
        <Text style={[brf.headerLabel, { color: value ? GOLD : textColor }]}>
          {value ? value.label : 'Attach a Bible verse'}
        </Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={mutedColor} />
      </Pressable>
      {expanded && (
        <View style={brf.fields}>
          <TextInput
            style={[brf.input, glassInput, { color: textColor }]}
            placeholder="Reference (e.g. John 3:16)"
            placeholderTextColor={mutedColor}
            value={label}
            onChangeText={setLabel}
            onBlur={commit}
            returnKeyType="next"
          />
          <TextInput
            style={[brf.textarea, glassInput, { color: textColor, fontFamily: SERIF, fontStyle: 'italic' }]}
            placeholder="Verse text (optional)"
            placeholderTextColor={mutedColor}
            value={text}
            onChangeText={setText}
            onBlur={commit}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          {value && (
            <Pressable onPress={() => { onChange(undefined); setLabel(''); setText(''); setExpanded(false); }}>
              <Text style={[brf.remove, { color: mutedColor }]}>Remove reference</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const brf = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  iconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  headerLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  fields: { paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
  input:  { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  textarea: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, lineHeight: 21, minHeight: 70 },
  remove: { fontSize: 12, textDecorationLine: 'underline', marginTop: 4 },
});

// ─── Tags Input ───────────────────────────────────────────────────────────────

function TagsField({ tags, onChange, isDark }: { tags: string[]; onChange: (t: string[]) => void; isDark: boolean }) {
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';
  const textColor  = isDark ? 'rgba(255,255,255,0.90)' : 'rgba(24,18,8,0.90)';
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
            style={[tf.tag, {
              backgroundColor: 'rgba(201,169,107,0.10)',
              borderColor: 'rgba(201,169,107,0.28)',
            }]}
            onPress={() => onChange(tags.filter(t => t !== tag))}
          >
            <Text style={tf.tagText}>#{tag}</Text>
            <Ionicons name="close" size={10} color={GOLD} />
          </Pressable>
        ))}
      </View>
      <TextInput
        style={[tf.input, {
          color: textColor,
          borderTopColor: tags.length ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)') : 'transparent',
        }]}
        placeholder="Add a tag…"
        placeholderTextColor={mutedColor}
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
  tagText: { fontSize: 12, fontWeight: '500', color: GOLD },
  input:   { fontSize: 14, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
});

// ─── Field Label ──────────────────────────────────────────────────────────────

function FieldLabel({ children, isDark }: { children: string; isDark: boolean }) {
  return (
    <Text style={[ed.fieldLabel, { color: isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)' }]}>
      {children}
    </Text>
  );
}

// ─── Editor Screen ────────────────────────────────────────────────────────────

export default function PrayerEditorScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const t          = useTheme();
  const insets     = useSafeAreaInsets();

  const isDark     = t.statusBar === 'light-content';
  const rootBg     = isDark ? '#060810' : '#DDD5C4';
  const textColor  = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';

  const params    = route.params;
  const prayerId  = params?.prayerId;
  const isEditing = !!prayerId;

  const glassInput = {
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    color: textColor,
  };

  const [title,    setTitle]    = useState('');
  const [content,  setContent]  = useState(params?.prefillContent ?? '');
  const [category, setCategory] = useState<PrayerCategory>('family');
  const [status,   setStatus]   = useState<PrayerStatus>('active');
  const [bibleRef, setBibleRef] = useState<BibleRef | undefined>(
    params?.prefillVerse ? { label: params.prefillVerse.label, text: params.prefillVerse.text } : undefined,
  );
  const [tags,   setTags]   = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

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

  const canSave = title.trim().length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: rootBg }}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={[ed.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity
          style={[ed.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}
          onPress={handleDiscard}
          hitSlop={10}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={20} color={isDark ? 'rgba(255,255,255,0.85)' : 'rgba(24,18,8,0.85)'} />
        </TouchableOpacity>

        <Text style={[ed.headerTitle, { color: textColor, fontFamily: SERIF }]}>
          {isEditing ? 'Edit Prayer' : 'New Prayer'}
        </Text>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !canSave}
          activeOpacity={0.8}
          style={[ed.saveBtn, !canSave && { opacity: 0.4 }]}
        >
          <LinearGradient
            colors={[GOLD, '#B8904A']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={ed.saveBtnGradient}
          >
            <Text style={ed.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[ed.scroll, { paddingBottom: Math.max(insets.bottom, 16) + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Prayer title */}
          <TextInput
            style={[ed.titleInput, { color: textColor, fontFamily: SERIF }]}
            placeholder="Prayer title…"
            placeholderTextColor={mutedColor}
            value={title}
            onChangeText={setTitle}
            multiline
            maxLength={120}
            returnKeyType="next"
            autoFocus={!isEditing}
          />

          {/* Category */}
          <FieldLabel isDark={isDark}>CATEGORY</FieldLabel>
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
                isDark={isDark}
              />
            ))}
          </ScrollView>

          {/* Status */}
          <FieldLabel isDark={isDark}>STATUS</FieldLabel>
          <View style={ed.statusRow}>
            {PRAYER_STATUSES.map(id => (
              <StatusOption
                key={id}
                id={id}
                selected={status === id}
                onPress={() => setStatus(id)}
                isDark={isDark}
              />
            ))}
          </View>

          {/* Prayer content */}
          <FieldLabel isDark={isDark}>YOUR PRAYER</FieldLabel>
          <TextInput
            style={[ed.contentInput, glassInput]}
            placeholder="Write your prayer here. Pour out your heart honestly before God…"
            placeholderTextColor={mutedColor}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
          />

          {/* Bible reference */}
          <FieldLabel isDark={isDark}>BIBLE REFERENCE (OPTIONAL)</FieldLabel>
          <BibleRefField value={bibleRef} onChange={setBibleRef} isDark={isDark} />

          {/* Tags */}
          <FieldLabel isDark={isDark}>TAGS (OPTIONAL)</FieldLabel>
          <View style={[ed.tagsContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.68)', borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.85)' }]}>
            <TagsField tags={tags} onChange={setTags} isDark={isDark} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const ed = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12, gap: 0,
  },
  closeBtn: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '400', textAlign: 'center', letterSpacing: -0.2 },
  saveBtn: { borderRadius: 12, overflow: 'hidden' },
  saveBtnGradient: { paddingHorizontal: 18, paddingVertical: 9 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#08071A' },

  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  titleInput: {
    fontSize: 26, fontWeight: '700', letterSpacing: -0.4, lineHeight: 34,
    paddingVertical: 16, minHeight: 70,
  },
  fieldLabel: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginTop: 24, marginBottom: 10,
  },
  chipRow:   { gap: 8, paddingBottom: 4 },
  statusRow: { flexDirection: 'row', gap: 8 },
  contentInput: { fontSize: 16, lineHeight: 26, minHeight: 160, padding: 14 },
  tagsContainer: { borderWidth: 1, borderRadius: 16, padding: 12 },
});
