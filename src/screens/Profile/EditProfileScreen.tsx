import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme';
import { getFavoriteVerse, setFavoriteVerse } from '../../services/profileService';
import { useProfilePicture, type ProfilePicture } from '../../context/ProfileContext';
import AvatarPicker from '../../components/AvatarPicker';

const DISPLAY_NAME_KEY = '@chat_display_name';

export default function EditProfileScreen() {
  const t   = useTheme();
  const nav = useNavigation();
  const { picture, setPicture } = useProfilePicture();

  const [name,         setName]         = useState('');
  const [verseRef,     setVerseRef]     = useState('');
  const [verseText,    setVerseText]    = useState('');
  const [saving,       setSaving]       = useState(false);
  const [initial,      setInitial]      = useState('J');
  const [pickerOpen,   setPickerOpen]   = useState(false);
  const [pendingPic,   setPendingPic]   = useState<ProfilePicture>(picture);

  const verseRefInput  = useRef<TextInput>(null);
  const verseTextInput = useRef<TextInput>(null);

  useEffect(() => {
    AsyncStorage.getItem(DISPLAY_NAME_KEY).then(n => {
      if (n?.trim()) { setName(n.trim()); setInitial(n.trim()[0].toUpperCase()); }
    });
    getFavoriteVerse().then(v => {
      if (v) { setVerseRef(v.ref); setVerseText(v.text); }
    });
    setPendingPic(picture);
  }, [picture]);

  const handleSave = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) { Alert.alert('Name required', 'Please enter a display name.'); return; }
    setSaving(true);
    try {
      await AsyncStorage.setItem(DISPLAY_NAME_KEY, trimmed);
      await setPicture(pendingPic);
      if (verseRef.trim()) {
        await setFavoriteVerse({ ref: verseRef.trim(), text: verseText.trim() });
      }
      nav.goBack();
    } catch {
      Alert.alert('Error', 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [name, pendingPic, verseRef, verseText, nav, setPicture]);

  // Preview the display in real time
  const previewBg =
    pendingPic?.type === 'avatar' ? pendingPic.avatar.bg : t.filterInactiveBg;
  const previewEmoji =
    pendingPic?.type === 'avatar' ? pendingPic.avatar.emoji : null;
  const previewUri =
    pendingPic?.type === 'photo' ? pendingPic.uri : null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        {/* Header */}
        <View style={[s.header, { borderBottomColor: t.divider }]}>
          <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={t.text} />
          </TouchableOpacity>
          <Text style={[s.title, { color: t.text }]}>Edit Profile</Text>
          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: saving ? t.filterInactiveBg : t.gold }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.saveBtnText}>Save</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* ── Tappable avatar ── */}
          <View style={s.avatarSection}>
            <TouchableOpacity
              onPress={() => setPickerOpen(true)}
              activeOpacity={0.85}
              style={s.avatarBtn}
            >
              {/* Circle */}
              <View style={[s.avatarCircle, { backgroundColor: previewBg }]}>
                {previewUri ? (
                  <Image source={{ uri: previewUri }} style={s.avatarPhoto} />
                ) : previewEmoji ? (
                  <Text style={s.avatarEmoji}>{previewEmoji}</Text>
                ) : (
                  <Text style={[s.avatarInitial, { color: t.gold }]}>
                    {name.trim() ? name.trim()[0].toUpperCase() : initial}
                  </Text>
                )}
              </View>

              {/* Camera badge */}
              <View style={[s.cameraBadge, { backgroundColor: t.gold }]}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </TouchableOpacity>

            <Text style={[s.avatarHint, { color: t.textMuted }]}>
              Tap to change profile picture
            </Text>
          </View>

          {/* ── Display name ── */}
          <Text style={[s.label, { color: t.textMuted }]}>DISPLAY NAME</Text>
          <TextInput
            style={[s.input, { backgroundColor: t.card, borderColor: t.cardBorder, color: t.text }]}
            value={name}
            onChangeText={v => { setName(v); if (v.trim()) setInitial(v.trim()[0].toUpperCase()); }}
            placeholder="Your name"
            placeholderTextColor={t.textMuted}
            returnKeyType="next"
            autoCapitalize="words"
            onSubmitEditing={() => verseRefInput.current?.focus()}
          />

          {/* ── Favorite verse ── */}
          <View style={[s.sectionDivider, { backgroundColor: t.divider }]} />
          <Text style={[s.sectionLabel, { color: t.text }]}>Favorite Verse</Text>
          <Text style={[s.sectionHint, { color: t.textMuted }]}>
            This verse will appear on your profile
          </Text>

          <Text style={[s.label, { color: t.textMuted }]}>REFERENCE</Text>
          <TextInput
            ref={verseRefInput}
            style={[s.input, { backgroundColor: t.card, borderColor: t.cardBorder, color: t.text }]}
            value={verseRef}
            onChangeText={setVerseRef}
            placeholder="e.g. Jeremiah 29:11"
            placeholderTextColor={t.textMuted}
            returnKeyType="next"
            onSubmitEditing={() => verseTextInput.current?.focus()}
          />

          <Text style={[s.label, { color: t.textMuted }]}>VERSE TEXT (optional)</Text>
          <TextInput
            ref={verseTextInput}
            style={[s.textArea, { backgroundColor: t.card, borderColor: t.cardBorder, color: t.text }]}
            value={verseText}
            onChangeText={setVerseText}
            placeholder={'"For I know the plans I have for you…"'}
            placeholderTextColor={t.textMuted}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        {/* Avatar picker sheet */}
        <AvatarPicker
          visible={pickerOpen}
          current={pendingPic}
          onSelect={p => setPendingPic(p)}
          onClose={() => setPickerOpen(false)}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const CIRCLE_SIZE = 100;

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn:     { padding: 4, marginRight: 8 },
  title:       { flex: 1, fontSize: 18, fontWeight: '700' },
  saveBtn:     { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 18, minWidth: 66, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  scroll: { padding: 24, paddingBottom: 80 },

  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarBtn:     { position: 'relative', marginBottom: 10 },
  avatarCircle: {
    width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarPhoto:   { width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2 },
  avatarEmoji:   { fontSize: 46 },
  avatarInitial: { fontSize: 38, fontWeight: '700' },
  cameraBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#FAF6EE',
  },
  avatarHint: { fontSize: 12 },

  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8 },
  input: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, marginBottom: 20,
  },

  sectionDivider: { height: 1, marginBottom: 20 },
  sectionLabel:   { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  sectionHint:    { fontSize: 13, marginBottom: 20, lineHeight: 18 },

  textArea: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, minHeight: 100, marginBottom: 20,
  },
});
