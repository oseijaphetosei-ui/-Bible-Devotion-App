import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme';
import {
  getFavoriteVerse, setFavoriteVerse,
  getAbout, setAbout,
  getUsername, setUsername as saveUsername,
  getEmail, setEmail as saveEmail,
} from '../../services/profileService';
import { useProfilePicture, type ProfilePicture } from '../../context/ProfileContext';
import AvatarPicker from '../../components/AvatarPicker';

const DISPLAY_NAME_KEY = '@chat_display_name';
const CIRCLE_SIZE = 120;

// ── Field label ───────────────────────────────────────────────────────────────

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  const t = useTheme();
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={[fl.label, { color: t.textMuted }]}>{label}</Text>
      {hint ? <Text style={[fl.hint, { color: t.textMuted }]}>{hint}</Text> : null}
    </View>
  );
}

const fl = StyleSheet.create({
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  hint:  { fontSize: 11, marginTop: 2 },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const t   = useTheme();
  const nav = useNavigation();
  const { picture, setPicture } = useProfilePicture();

  const [name,        setName]        = useState('');
  const [about,       setAboutState]  = useState('');
  const [username,    setUsername]    = useState('');
  const [email,       setEmail]       = useState('');
  const [verseRef,    setVerseRef]    = useState('');
  const [verseText,   setVerseText]   = useState('');
  const [saving,      setSaving]      = useState(false);
  const [initial,     setInitial]     = useState('J');
  const [pickerOpen,  setPickerOpen]  = useState(false);
  const [pendingPic,  setPendingPic]  = useState<ProfilePicture>(picture);
  const [usernameErr, setUsernameErr] = useState('');

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(DISPLAY_NAME_KEY),
      getFavoriteVerse(),
      getAbout(),
      getUsername(),
      getEmail(),
    ]).then(([n, fav, bio, uname, em]) => {
      if (n?.trim()) { setName(n.trim()); setInitial(n.trim()[0].toUpperCase()); }
      if (fav)       { setVerseRef(fav.ref); setVerseText(fav.text); }
      if (bio?.trim())   setAboutState(bio.trim());
      if (uname?.trim()) setUsername(uname.trim());
      if (em?.trim())    setEmail(em.trim());
    });
    setPendingPic(picture);
  }, [picture]);

  const validateUsername = useCallback((val: string): boolean => {
    if (!val) { setUsernameErr(''); return true; }
    if (val.length < 3)          { setUsernameErr('At least 3 characters'); return false; }
    if (val.length > 20)         { setUsernameErr('Max 20 characters'); return false; }
    if (!/^[a-z0-9_]+$/.test(val)) { setUsernameErr('Only lowercase letters, numbers, and _'); return false; }
    setUsernameErr('');
    return true;
  }, []);

  const handleUsernameChange = useCallback((v: string) => {
    const clean = v.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(clean);
    validateUsername(clean);
  }, [validateUsername]);

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) { Alert.alert('Name required', 'Please enter a display name.'); return; }
    if (username && !validateUsername(username)) return;

    setSaving(true);
    try {
      await AsyncStorage.setItem(DISPLAY_NAME_KEY, trimmedName);
      await setPicture(pendingPic);
      await setAbout(about.trim());
      await saveUsername(username.trim());
      await saveEmail(email.trim());
      if (verseRef.trim()) {
        await setFavoriteVerse({ ref: verseRef.trim(), text: verseText.trim() });
      }
      nav.goBack();
    } catch {
      Alert.alert('Error', 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [name, about, username, email, pendingPic, verseRef, verseText, nav, setPicture, validateUsername]);

  const previewBg    = pendingPic?.type === 'avatar' ? pendingPic.avatar.bg : t.filterInactiveBg;
  const previewEmoji = pendingPic?.type === 'avatar' ? pendingPic.avatar.emoji : null;
  const previewUri   = pendingPic?.type === 'photo'  ? pendingPic.uri : null;

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
            <Ionicons name="chevron-back" size={24} color={t.text} />
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

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Avatar ── */}
          <View style={s.avatarSection}>
            <TouchableOpacity onPress={() => setPickerOpen(true)} activeOpacity={0.88}>
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
            </TouchableOpacity>

            {/* Edit Photo — small, elegant pill */}
            <TouchableOpacity
              onPress={() => setPickerOpen(true)}
              style={[s.editPhotoBtn, { borderColor: t.cardBorder, backgroundColor: t.card }]}
              activeOpacity={0.7}
              accessibilityLabel="Change profile photo"
            >
              <Ionicons name="pencil-outline" size={11} color={t.textSub} />
              <Text style={[s.editPhotoText, { color: t.textSub }]}>Edit Photo</Text>
            </TouchableOpacity>
          </View>

          {/* ── Display name ── */}
          <FieldLabel label="DISPLAY NAME" />
          <TextInput
            style={[s.input, { backgroundColor: t.card, borderColor: t.cardBorder, color: t.text }]}
            value={name}
            onChangeText={v => { setName(v); if (v.trim()) setInitial(v.trim()[0].toUpperCase()); }}
            placeholder="Your name"
            placeholderTextColor={t.textMuted}
            autoCapitalize="words"
            returnKeyType="next"
            textAlignVertical="center"
          />

          {/* ── About ── */}
          <FieldLabel label="ABOUT" hint="A short line about your faith journey" />
          <TextInput
            style={[s.textArea, { backgroundColor: t.card, borderColor: t.cardBorder, color: t.text }]}
            value={about}
            onChangeText={setAboutState}
            placeholder="Growing daily in faith…"
            placeholderTextColor={t.textMuted}
            multiline
            textAlignVertical="top"
            maxLength={160}
          />

          {/* ── Username ── */}
          <FieldLabel label="USERNAME" hint="Lowercase letters, numbers, underscores only" />
          <View style={s.usernameRow}>
            <View style={[s.atPill, { backgroundColor: t.filterInactiveBg, borderColor: t.cardBorder }]}>
              <Text style={[s.atSign, { color: t.textMuted }]}>@</Text>
            </View>
            <TextInput
              style={[
                s.usernameInput,
                {
                  backgroundColor: t.card,
                  borderColor: usernameErr ? '#C87B7B' : t.cardBorder,
                  color: t.text,
                },
              ]}
              value={username}
              onChangeText={handleUsernameChange}
              placeholder="yourhandle"
              placeholderTextColor={t.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              textAlignVertical="center"
            />
          </View>
          {usernameErr ? (
            <Text style={s.errorText}>{usernameErr}</Text>
          ) : null}

          {/* ── Email ── */}
          <FieldLabel label="EMAIL" hint="Optional — not required to use the app" />
          <TextInput
            style={[s.input, { backgroundColor: t.card, borderColor: t.cardBorder, color: t.text }]}
            value={email}
            onChangeText={setEmail}
            placeholder="Add email (optional)"
            placeholderTextColor={t.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textAlignVertical="center"
          />

          {/* ── Favorite Verse ── */}
          <View style={[s.sectionDivider, { backgroundColor: t.divider }]} />
          <Text style={[s.sectionLabel, { color: t.text }]}>Favorite Verse</Text>
          <Text style={[s.sectionHint, { color: t.textMuted }]}>
            This verse will appear on your profile
          </Text>

          <FieldLabel label="REFERENCE" />
          <TextInput
            style={[s.input, { backgroundColor: t.card, borderColor: t.cardBorder, color: t.text }]}
            value={verseRef}
            onChangeText={setVerseRef}
            placeholder="e.g. Jeremiah 29:11"
            placeholderTextColor={t.textMuted}
            returnKeyType="next"
            textAlignVertical="center"
          />

          <FieldLabel label="VERSE TEXT (optional)" />
          <TextInput
            style={[s.textArea, { backgroundColor: t.card, borderColor: t.cardBorder, color: t.text }]}
            value={verseText}
            onChangeText={setVerseText}
            placeholder={'"For I know the plans I have for you…"'}
            placeholderTextColor={t.textMuted}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

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

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn:     { padding: 4, marginRight: 4 },
  title:       { flex: 1, fontSize: 17, fontWeight: '700' },
  saveBtn:     { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 18, minWidth: 66, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  scroll: { padding: 24, paddingBottom: 80 },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarCircle: {
    width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarPhoto:   { width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2 },
  avatarEmoji:   { fontSize: 52 },
  avatarInitial: { fontSize: 44, fontWeight: '700' },

  editPhotoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  editPhotoText: { fontSize: 12, fontWeight: '500' },

  // Inputs
  input: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, marginBottom: 20,
    includeFontPadding: false,
  } as any,
  textArea: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, minHeight: 90, marginBottom: 20,
  },

  // Username row
  usernameRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  atPill: {
    width: 46, height: 50, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  atSign: { fontSize: 17, fontWeight: '600' },
  usernameInput: {
    flex: 1, borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15,
    includeFontPadding: false,
  } as any,
  errorText: { color: '#C87B7B', fontSize: 12, marginBottom: 16, marginTop: -2 },

  // Verse section
  sectionDivider: { height: StyleSheet.hairlineWidth, marginBottom: 20 },
  sectionLabel:   { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  sectionHint:    { fontSize: 13, marginBottom: 20, lineHeight: 18 },
});
