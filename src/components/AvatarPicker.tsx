import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Animated,
  FlatList, Image, Dimensions, Platform, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { AVATARS, AVATAR_CATEGORIES, type AvatarDef } from '../data/avatars';
import type { ProfilePicture } from '../context/ProfileContext';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = Math.min(SCREEN_H * 0.72, 560);
const AVATAR_SIZE = 64;
const NUM_COLS = 4;

// ── Avatar tile ───────────────────────────────────────────────────────────────

const AvatarTile = memo(function AvatarTile({
  avatar, selected, onPress,
}: { avatar: AvatarDef; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.tile} onPress={onPress} activeOpacity={0.78}>
      <View style={[
        s.tileCircle,
        { backgroundColor: avatar.bg },
        selected && s.tileSelected,
      ]}>
        <Text style={s.tileEmoji}>{avatar.emoji}</Text>
      </View>
      {selected && (
        <View style={s.tileCheck}>
          <Ionicons name="checkmark-circle" size={20} color="#C9A96B" />
        </View>
      )}
    </TouchableOpacity>
  );
});

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  current: ProfilePicture;
  onSelect: (p: ProfilePicture) => void;
  onClose: () => void;
};

export default function AvatarPicker({ visible, current, onSelect, onClose }: Props) {
  const t = useTheme();

  const [activeCategory, setActiveCategory] = useState<AvatarDef['category']>('faith');
  const [preview, setPreview] = useState<ProfilePicture>(current);

  const sheetAnim  = useRef(new Animated.Value(SHEET_H)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setPreview(current);
      Animated.parallel([
        Animated.spring(sheetAnim,  { toValue: 0,   tension: 80, friction: 18, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sheetAnim,    { toValue: SHEET_H, duration: 280, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0,       duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(sheetAnim,    { toValue: SHEET_H, duration: 280, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0,       duration: 220, useNativeDriver: true }),
    ]).start(() => onClose());
  }, [onClose]);

  const confirm = useCallback(() => {
    onSelect(preview);
    close();
  }, [preview, onSelect, close]);

  const pickPhoto = useCallback(async (source: 'camera' | 'library') => {
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (perm.status !== 'granted') {
      Alert.alert(
        'Permission Required',
        `Please allow ${source === 'camera' ? 'camera' : 'photo library'} access in Settings.`,
      );
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true, aspect: [1, 1], quality: 0.85,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85,
          });

    if (!result.canceled && result.assets[0]) {
      // The picker returns a URI in a temp cache the OS can purge at any time.
      // Copy into the app's document directory so the avatar survives restarts.
      // Timestamped name: a fresh URI also busts RN's image cache for the old photo.
      let uri = result.assets[0].uri;
      try {
        const dir = FileSystem.documentDirectory!;
        const old = await FileSystem.readDirectoryAsync(dir);
        await Promise.all(
          old.filter(f => f.startsWith('profile-photo-'))
             .map(f => FileSystem.deleteAsync(dir + f, { idempotent: true })),
        );
        const ext  = uri.includes('.') ? uri.slice(uri.lastIndexOf('.')) : '.jpg';
        const dest = `${dir}profile-photo-${Date.now()}${ext}`;
        await FileSystem.copyAsync({ from: uri, to: dest });
        uri = dest;
      } catch { /* fall back to the picker URI */ }

      const pic: ProfilePicture = { type: 'photo', uri };
      setPreview(pic);
      onSelect(pic);
      close();
    }
  }, [onSelect, close]);

  const selectedAvatarId =
    preview?.type === 'avatar' ? preview.avatar.id : null;

  const filteredAvatars = AVATARS.filter(a => a.category === activeCategory);

  const currentPreviewUri =
    preview?.type === 'photo' ? preview.uri :
    preview?.type === 'avatar' ? null : null;

  const previewEmoji =
    preview?.type === 'avatar' ? preview.avatar.emoji : null;
  const previewBg =
    preview?.type === 'avatar' ? preview.avatar.bg : t.filterInactiveBg;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
    >
      {/* Backdrop */}
      <Animated.View
        style={[s.backdrop, { opacity: backdropAnim }]}
        // @ts-ignore — pointerEvents on Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={close} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          s.sheet,
          { backgroundColor: t.bg, transform: [{ translateY: sheetAnim }] },
        ]}
      >
        {/* Handle */}
        <View style={s.handleRow}>
          <View style={[s.handle, { backgroundColor: t.cardBorder }]} />
        </View>

        {/* Header row: preview + title + Done */}
        <View style={s.sheetHeader}>
          {/* Live preview */}
          <View style={[s.previewCircle, { backgroundColor: previewBg }]}>
            {currentPreviewUri ? (
              <Image source={{ uri: currentPreviewUri }} style={s.previewPhoto} />
            ) : previewEmoji ? (
              <Text style={s.previewEmoji}>{previewEmoji}</Text>
            ) : (
              <Ionicons name="person" size={24} color="rgba(255,255,255,0.5)" />
            )}
          </View>
          <Text style={[s.sheetTitle, { color: t.text }]}>Profile Picture</Text>
          <TouchableOpacity onPress={confirm} style={s.doneBtn} activeOpacity={0.8}>
            <Text style={[s.doneBtnText, { color: t.gold }]}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Photo action buttons */}
        <View style={s.photoActions}>
          <TouchableOpacity
            style={[s.photoBtn, { backgroundColor: t.card, borderColor: t.cardBorder }]}
            onPress={() => pickPhoto('camera')}
            activeOpacity={0.78}
          >
            <Ionicons name="camera" size={22} color={t.text} />
            <Text style={[s.photoBtnText, { color: t.text }]}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.photoBtn, { backgroundColor: t.card, borderColor: t.cardBorder }]}
            onPress={() => pickPhoto('library')}
            activeOpacity={0.78}
          >
            <Ionicons name="images" size={22} color={t.text} />
            <Text style={[s.photoBtnText, { color: t.text }]}>Library</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.photoBtn, { backgroundColor: t.card, borderColor: t.cardBorder }]}
            onPress={() => { setPreview(null); onSelect(null); close(); }}
            activeOpacity={0.78}
          >
            <Ionicons name="trash-outline" size={22} color="#C87B7B" />
            <Text style={[s.photoBtnText, { color: '#C87B7B' }]}>Remove</Text>
          </TouchableOpacity>
        </View>

        {/* Divider with label */}
        <View style={s.orRow}>
          <View style={[s.orLine, { backgroundColor: t.divider }]} />
          <Text style={[s.orText, { color: t.textMuted }]}>CHOOSE AN AVATAR</Text>
          <View style={[s.orLine, { backgroundColor: t.divider }]} />
        </View>

        {/* Category tabs */}
        <View style={s.catRow}>
          {AVATAR_CATEGORIES.map(cat => {
            const active = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setActiveCategory(cat.key)}
                style={[
                  s.catTab,
                  { backgroundColor: t.filterInactiveBg, borderColor: t.filterInactiveBorder },
                  active && { backgroundColor: t.goldBg, borderColor: t.goldBorder },
                ]}
                activeOpacity={0.75}
              >
                <Text style={[s.catTabText, { color: active ? t.gold : t.textMuted }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Avatar grid */}
        <FlatList
          data={filteredAvatars}
          keyExtractor={a => a.id}
          numColumns={NUM_COLS}
          contentContainerStyle={s.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <AvatarTile
              avatar={item}
              selected={selectedAvatarId === item.id}
              onPress={() => setPreview({ type: 'avatar', avatar: item })}
            />
          )}
        />
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },

  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: SHEET_H,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18, shadowRadius: 20, elevation: 20,
    overflow: 'hidden',
  },

  handleRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle:    { width: 36, height: 4, borderRadius: 2 },

  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 10,
    gap: 12,
  },
  previewCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  previewPhoto: { width: 44, height: 44, borderRadius: 22 },
  previewEmoji: { fontSize: 22 },
  sheetTitle:   { flex: 1, fontSize: 17, fontWeight: '700' },
  doneBtn:      { paddingHorizontal: 4 },
  doneBtnText:  { fontSize: 16, fontWeight: '700' },

  photoActions: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 18, marginBottom: 16,
  },
  photoBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderRadius: 14, paddingVertical: 12,
  },
  photoBtnText: { fontSize: 12, fontWeight: '600' },

  orRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, marginBottom: 12, gap: 10 },
  orLine: { flex: 1, height: 1 },
  orText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  catRow: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: 18, marginBottom: 14, flexWrap: 'wrap',
  },
  catTab: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1,
  },
  catTabText: { fontSize: 11, fontWeight: '600' },

  grid: { paddingHorizontal: 14, paddingBottom: 40 },

  tile: {
    width: `${100 / NUM_COLS}%` as any,
    alignItems: 'center', paddingVertical: 8,
  },
  tileCircle: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  tileSelected: {
    borderWidth: 3, borderColor: '#C9A96B',
  },
  tileEmoji: { fontSize: 28 },
  tileCheck: {
    position: 'absolute', bottom: 6, right: '50%',
    marginRight: -26, // center under circle
    backgroundColor: '#FAF6EE', borderRadius: 10,
  },
});
