import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  ScrollView, Animated, Alert, Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import PhotoViewer, { type PhotoViewerOrigin } from '../../components/PhotoViewer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import {
  getJoinDate, formatJoinDate, getStats, getFavoriteVerse, clearLocalProfile,
} from '../../services/profileService';
import { getSavedDisplayName } from '../../services/chatService';
import { getNotes } from '../../services/notesService';
import type { Stats, FavoriteVerse } from '../../types/profile';
import { ProfileStackParamList } from '../../types/navigation';
import { useProfilePicture } from '../../context/ProfileContext';

type NavProp = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

// ── Stat item ─────────────────────────────────────────────────────────────────

const StatItem = memo(function StatItem({ value, label, text, textMuted }: {
  value: number | string; label: string; text: string; textMuted: string;
}) {
  return (
    <View style={sc.item}>
      <Text style={[sc.value, { color: text }]}>{value}</Text>
      <Text style={[sc.label, { color: textMuted }]}>{label}</Text>
    </View>
  );
});

const sc = StyleSheet.create({
  item: { alignItems: 'center', flex: 1 },
  value: { fontSize: 26, fontWeight: '800', letterSpacing: -0.8, marginBottom: 3 },
  label: { fontSize: 10, fontWeight: '600', textAlign: 'center', letterSpacing: 0.3 },
});

// ── Setting row ───────────────────────────────────────────────────────────────

function SettingRow({
  icon, label, value, onPress, text, textMuted, divider, isLast = false,
}: {
  icon: string; label: string; value?: string;
  onPress: () => void;
  text: string; textMuted: string; divider: string; isLast?: boolean;
}) {
  return (
    <>
      <TouchableOpacity style={sr.row} onPress={onPress} activeOpacity={0.75}>
        <Text style={sr.icon}>{icon}</Text>
        <Text style={[sr.label, { color: text }]}>{label}</Text>
        <View style={sr.right}>
          {value ? <Text style={[sr.value, { color: textMuted }]}>{value}</Text> : null}
          <Ionicons name="chevron-forward" size={16} color={textMuted} />
        </View>
      </TouchableOpacity>
      {!isLast && <View style={[sr.divider, { backgroundColor: divider }]} />}
    </>
  );
}

const sr = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  icon:    { fontSize: 18, width: 24, textAlign: 'center' },
  label:   { flex: 1, fontSize: 15, fontWeight: '500' },
  right:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  value:   { fontSize: 13 },
  divider: { height: 1, marginHorizontal: 16 },
});


// ── Main screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const t   = useTheme();
  const nav = useNavigation<NavProp>();
  const rootNav = useNavigation<any>();
  const { picture } = useProfilePicture();

  const [displayName,   setDisplayName]   = useState('Believer');
  const [joinDate,      setJoinDate]      = useState('');
  const [initial,       setInitial]       = useState('J');
  const [stats,         setStats]         = useState<Stats>({ streak: 0, chaptersRead: 0, notesCreated: 0, scriptureChats: 0, prayersCompleted: 0 });
  const [favoriteVerse, setFavoriteVerseState] = useState<FavoriteVerse | null>(null);

  const [viewerOpen,   setViewerOpen]   = useState(false);
  const [viewerOrigin, setViewerOrigin] = useState<PhotoViewerOrigin | null>(null);

  const avatarViewRef = useRef<View>(null);
  const avatarAnim    = useRef(new Animated.Value(0.7)).current;
  const contentAnim   = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    const [name, joinIso, fav] = await Promise.all([
      getSavedDisplayName(),
      getJoinDate(),
      getFavoriteVerse(),
    ]);

    let notesCount = 0;
    try { const notes = await getNotes(); notesCount = notes.length; } catch { /* offline */ }

    const s = await getStats(notesCount);

    if (name?.trim()) {
      setDisplayName(name.trim());
      setInitial(name.trim()[0].toUpperCase());
    }
    setJoinDate(formatJoinDate(joinIso));
    setStats(s);
    setFavoriteVerseState(fav);
  }, []);

  useEffect(() => {
    load();
    Animated.parallel([
      Animated.spring(avatarAnim, { toValue: 1, tension: 60, friction: 9, useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 350, delay: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your data will remain on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out', style: 'destructive',
          onPress: async () => {
            try {
              await clearLocalProfile();
              rootNav.navigate('MainTabs');
            } catch {
              Alert.alert('Error', 'Could not sign out. Please try again.');
            }
          },
        },
      ],
    );
  }, [rootNav]);

  const navigateToTab = useCallback((tabName: string) => {
    rootNav.navigate('MainTabs', { screen: tabName });
  }, [rootNav]);

  const handleAvatarPress = useCallback(() => {
    if (picture?.type !== 'photo') {
      nav.navigate('EditProfile');
      return;
    }
    avatarViewRef.current?.measure((_fx, _fy, w, h, px, py) => {
      setViewerOrigin({ x: px, y: py, width: w, height: h });
      setViewerOpen(true);
    });
  }, [picture, nav]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        {/* Header */}
        <View style={s.header}>
          {/* Glass back button */}
          <TouchableOpacity
            onPress={() => rootNav.goBack()}
            style={[s.glassCircle, { borderColor: t.cardBorder }]}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <BlurView intensity={18} tint="default" style={StyleSheet.absoluteFillObject} />
            <Ionicons name="chevron-back" size={22} color={t.text} />
          </TouchableOpacity>

          {/* Title — centered in the flex row */}
          <Text style={[s.headerTitle, { color: t.text }]}>Profile</Text>

          {/* Glass edit pill */}
          <TouchableOpacity
            onPress={() => nav.navigate('EditProfile')}
            style={[s.glassPill, { borderColor: t.cardBorder }]}
            activeOpacity={0.75}
          >
            <BlurView intensity={18} tint="default" style={StyleSheet.absoluteFillObject} />
            <Text style={[s.editBtnText, { color: t.gold }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Hero: avatar + name + join date */}
          <View style={s.hero}>
            <Animated.View style={[s.avatarWrap, { transform: [{ scale: avatarAnim }] }]}>
              <TouchableOpacity
                onPress={handleAvatarPress}
                activeOpacity={picture?.type === 'photo' ? 0.92 : 0.78}
              >
                <View
                  ref={avatarViewRef}
                  collapsable={false}
                  style={[
                    s.avatarCircle,
                    { backgroundColor: picture?.type === 'avatar' ? picture.avatar.bg : t.filterInactiveBg },
                  ]}
                >
                  {picture?.type === 'photo' ? (
                    <Image source={{ uri: picture.uri }} style={{ width: 120, height: 120, borderRadius: 60 }} />
                  ) : picture?.type === 'avatar' ? (
                    <Text style={{ fontSize: 56 }}>{picture.avatar.emoji}</Text>
                  ) : (
                    <Text style={[s.avatarLetter, { color: t.gold }]}>{initial}</Text>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
            <Animated.View style={{ opacity: contentAnim }}>
              <Text style={[s.displayName, { color: t.text }]}>{displayName}</Text>
              {joinDate ? (
                <Text style={[s.joinDate, { color: t.textMuted }]}>Member since {joinDate}</Text>
              ) : null}
            </Animated.View>
          </View>

          <Animated.View style={{ opacity: contentAnim }}>

            {/* ── Stats row ── */}
            <View style={[s.statsRow, { borderTopColor: t.divider, borderBottomColor: t.divider }]}>
              <StatItem value={stats.streak} label="Day Streak" text={t.text} textMuted={t.textMuted} />
              <View style={[s.statDivider, { backgroundColor: t.divider }]} />
              <StatItem value={stats.chaptersRead} label="Chapters Read" text={t.text} textMuted={t.textMuted} />
              <View style={[s.statDivider, { backgroundColor: t.divider }]} />
              <StatItem value={stats.notesCreated} label="Notes" text={t.text} textMuted={t.textMuted} />
            </View>

            {/* ── Favorite Verse ── */}
            {favoriteVerse && (
              <>
                <Text style={[s.sectionTitle, { color: t.textMuted }]}>FAVORITE VERSE</Text>
                <TouchableOpacity
                  style={s.verseRow}
                  onPress={() => nav.navigate('EditProfile')}
                  activeOpacity={0.78}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.verseRef, { color: t.gold }]}>{favoriteVerse.ref}</Text>
                    {favoriteVerse.text ? (
                      <Text style={[s.verseText, { color: t.textSub }]} numberOfLines={3}>
                        {favoriteVerse.text}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={t.textMuted} />
                </TouchableOpacity>
              </>
            )}

            {/* ── Quick Access ── */}
            <Text style={[s.sectionTitle, { color: t.textMuted }]}>QUICK ACCESS</Text>
            <View style={[s.settingsCard, { borderColor: t.divider }]}>
              <SettingRow
                icon="📝" label="My Notes"
                onPress={() => navigateToTab('NotesTab')}
                text={t.text} textMuted={t.textMuted} divider={t.divider}
              />
              <SettingRow
                icon="💬" label="Scripture Chat"
                onPress={() => navigateToTab('HomeTab')}
                text={t.text} textMuted={t.textMuted} divider={t.divider}
                isLast
              />
            </View>

            {/* ── Account ── */}
            <Text style={[s.sectionTitle, { color: t.textMuted }]}>ACCOUNT</Text>
            <View style={[s.settingsCard, { borderColor: t.divider }]}>
              <SettingRow
                icon="✏️" label="Edit Profile"
                onPress={() => nav.navigate('EditProfile')}
                text={t.text} textMuted={t.textMuted} divider={t.divider}
              />
              <SettingRow
                icon="🎨" label="Appearance"
                onPress={() => nav.navigate('Appearance')}
                text={t.text} textMuted={t.textMuted} divider={t.divider}
              />
              <SettingRow
                icon="🔔" label="Notifications"
                onPress={() => nav.navigate('Notifications')}
                text={t.text} textMuted={t.textMuted} divider={t.divider}
              />
              <SettingRow
                icon="🔒" label="Privacy"
                onPress={() => nav.navigate('Privacy')}
                text={t.text} textMuted={t.textMuted} divider={t.divider}
                isLast
              />
            </View>

            {/* ── Sign Out ── */}
            <TouchableOpacity
              style={s.signOutBtn}
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={16} color="#C87B7B" />
              <Text style={s.signOutText}>Sign Out</Text>
            </TouchableOpacity>

            <Text style={[s.versionText, { color: t.textMuted }]}>Daily Devotion v1.0</Text>

          </Animated.View>
        </ScrollView>

        {/* Full-screen photo viewer */}
        {picture?.type === 'photo' && (
          <PhotoViewer
            uri={picture.uri}
            visible={viewerOpen}
            origin={viewerOrigin}
            onClose={() => setViewerOpen(false)}
            onEdit={() => nav.navigate('EditProfile')}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center' },

  glassCircle: {
    width: 40, height: 40, borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  glassPill: {
    height: 36, borderRadius: 18,
    paddingHorizontal: 16,
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  editBtnText: { fontSize: 14, fontWeight: '600' },

  scroll: { paddingBottom: 60 },

  hero: { alignItems: 'center', paddingVertical: 28, paddingBottom: 24 },
  avatarWrap: { marginBottom: 16 },
  avatarCircle: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 42, fontWeight: '700', letterSpacing: 1 },
  displayName:  { fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: -0.4, marginBottom: 4 },
  joinDate:     { fontSize: 12, textAlign: 'center' },

  sectionTitle: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.6,
    paddingHorizontal: 20, marginBottom: 4, marginTop: 24,
  },

  statsRow: {
    flexDirection: 'row',
    paddingVertical: 24,
    marginHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  statDivider: { width: StyleSheet.hairlineWidth, height: '100%' },

  verseRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingVertical: 16,
    gap: 12, marginBottom: 8,
  },
  verseRef:  { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  verseText: { fontSize: 13, lineHeight: 20, fontStyle: 'italic' },

  settingsCard: {
    marginHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20, paddingVertical: 16,
    marginTop: 16, marginBottom: 8,
  },
  signOutText: { color: '#C87B7B', fontSize: 15, fontWeight: '600' },
  versionText: { fontSize: 11, textAlign: 'center', marginBottom: 24, marginTop: 4 },
});
