import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  ScrollView, Animated, Alert, Image, Pressable,
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
  getAbout, getUsername,
} from '../../services/profileService';
import { getSavedDisplayName } from '../../services/chatService';
import { getNotes } from '../../services/notesService';
import type { Stats, FavoriteVerse } from '../../types/profile';
import { ProfileStackParamList } from '../../types/navigation';
import { useProfilePicture } from '../../context/ProfileContext';

type NavProp = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

const AVATAR_SIZE = 144;

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
  item:  { alignItems: 'center', flex: 1 },
  value: { fontSize: 26, fontWeight: '800', letterSpacing: -0.8, marginBottom: 3 },
  label: { fontSize: 10, fontWeight: '600', textAlign: 'center', letterSpacing: 0.3 },
});

// ── Setting row ───────────────────────────────────────────────────────────────

const SettingRow = memo(function SettingRow({
  ionIcon, iconBg, iconColor,
  label, value, onPress,
  text, textMuted, divider, isLast = false,
}: {
  ionIcon: string; iconBg: string; iconColor: string;
  label: string; value?: string;
  onPress: () => void;
  text: string; textMuted: string; divider: string; isLast?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 14 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 14 }).start();

  return (
    <>
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} accessibilityRole="button">
        <Animated.View style={[sr.row, { transform: [{ scale }] }]}>
          <View style={[sr.iconBox, { backgroundColor: iconBg }]}>
            <Ionicons name={ionIcon as any} size={16} color={iconColor} />
          </View>
          <Text style={[sr.label, { color: text }]}>{label}</Text>
          <View style={sr.right}>
            {value ? <Text style={[sr.value, { color: textMuted }]}>{value}</Text> : null}
            <Ionicons name="chevron-forward" size={15} color={textMuted} />
          </View>
        </Animated.View>
      </Pressable>
      {!isLast && <View style={[sr.divider, { backgroundColor: divider }]} />}
    </>
  );
});

const sr = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 14 },
  iconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label:   { flex: 1, fontSize: 15, fontWeight: '500' },
  right:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  value:   { fontSize: 13 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 62 },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const t       = useTheme();
  const nav     = useNavigation<NavProp>();
  const rootNav = useNavigation<any>();
  const { picture } = useProfilePicture();

  const [displayName,   setDisplayName]        = useState('Believer');
  const [username,      setUsernameState]       = useState('');
  const [about,         setAboutState]          = useState('');
  const [joinDate,      setJoinDate]            = useState('');
  const [initial,       setInitial]             = useState('J');
  const [stats,         setStats]               = useState<Stats>({
    streak: 0, chaptersRead: 0, notesCreated: 0, scriptureChats: 0, prayersCompleted: 0,
  });
  const [favoriteVerse, setFavoriteVerseState]  = useState<FavoriteVerse | null>(null);

  const [viewerOpen,   setViewerOpen]   = useState(false);
  const [viewerOrigin, setViewerOrigin] = useState<PhotoViewerOrigin | null>(null);

  const avatarViewRef = useRef<View>(null);
  const avatarAnim    = useRef(new Animated.Value(0.85)).current;
  const contentAnim   = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    const [name, joinIso, fav, uname, bio] = await Promise.all([
      getSavedDisplayName(),
      getJoinDate(),
      getFavoriteVerse(),
      getUsername(),
      getAbout(),
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
    if (uname?.trim()) setUsernameState(uname.trim());
    if (bio?.trim())   setAboutState(bio.trim());
  }, []);

  useEffect(() => {
    load();
    Animated.parallel([
      Animated.spring(avatarAnim, { toValue: 1, tension: 55, friction: 9,  useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 380, delay: 130, useNativeDriver: true }),
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

  // Navigate to a specific HomeStack screen (must have valid params at the call site).
  const goHome = useCallback((screen: string) => {
    rootNav.navigate('MainTabs', { screen: 'HomeTab', params: { screen } });
  }, [rootNav]);

  // Navigate to the Home tab root — used when the target screen requires params
  // that the caller cannot supply (e.g. ScriptureChat). Drop the nested `screen`
  // so React Navigation resets to the tab's initial route rather than trying to
  // mount a screen with missing props. When a parameter-free ScriptureChat entry
  // point exists, swap this for a goHome('ScriptureChatLanding') call.
  const goHomeTab = useCallback(() => {
    rootNav.navigate('MainTabs', { screen: 'HomeTab' });
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

        {/* Header — no title; back + pencil */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => rootNav.goBack()}
            style={[s.glassCircle, { borderColor: t.cardBorder }]}
            activeOpacity={0.75}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Go back"
          >
            <BlurView intensity={18} tint="default" style={StyleSheet.absoluteFillObject} />
            <Ionicons name="chevron-back" size={22} color={t.text} />
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            onPress={() => nav.navigate('EditProfile')}
            style={[s.glassCircle, { borderColor: t.cardBorder }]}
            activeOpacity={0.75}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Edit profile"
          >
            <BlurView intensity={18} tint="default" style={StyleSheet.absoluteFillObject} />
            <Ionicons name="pencil-outline" size={17} color={t.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Hero ── */}
          <View style={s.hero}>
            <Animated.View style={{ transform: [{ scale: avatarAnim }], marginBottom: 20 }}>
              <TouchableOpacity
                onPress={handleAvatarPress}
                activeOpacity={picture?.type === 'photo' ? 0.92 : 0.78}
                accessibilityLabel="Profile photo"
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
                    <Image
                      source={{ uri: picture.uri }}
                      style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }}
                    />
                  ) : picture?.type === 'avatar' ? (
                    <Text style={{ fontSize: 66 }}>{picture.avatar.emoji}</Text>
                  ) : (
                    <Text style={[s.avatarLetter, { color: t.gold }]}>{initial}</Text>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[s.heroText, { opacity: contentAnim }]}>
              <Text style={[s.displayName, { color: t.text }]}>{displayName}</Text>
              {username ? (
                <Text style={[s.usernameLabel, { color: t.textMuted }]}>@{username}</Text>
              ) : null}
              {about ? (
                <Text style={[s.aboutLabel, { color: t.textSub }]}>{about}</Text>
              ) : null}
              {joinDate ? (
                <Text style={[s.joinDate, { color: t.textMuted }]}>Member since {joinDate}</Text>
              ) : null}
            </Animated.View>
          </View>

          <Animated.View style={{ opacity: contentAnim }}>

            {/* ── Stats ── */}
            <View style={[s.statsRow, { borderTopColor: t.divider, borderBottomColor: t.divider }]}>
              <StatItem value={stats.streak}      label="Day Streak"    text={t.text} textMuted={t.textMuted} />
              <View style={[s.statDivider, { backgroundColor: t.divider }]} />
              <StatItem value={stats.chaptersRead} label="Chapters Read" text={t.text} textMuted={t.textMuted} />
              <View style={[s.statDivider, { backgroundColor: t.divider }]} />
              <StatItem value={stats.notesCreated} label="Notes"         text={t.text} textMuted={t.textMuted} />
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
                ionIcon="document-text-outline" iconBg="#5B6EAE22" iconColor="#5B6EAE"
                label="My Notes"
                onPress={() => rootNav.navigate('MainTabs', { screen: 'NotesTab' })}
                text={t.text} textMuted={t.textMuted} divider={t.divider}
              />
              <SettingRow
                ionIcon="chatbubble-ellipses-outline" iconBg="#6C8AB022" iconColor="#6C8AB0"
                label="Scripture Chat"
                onPress={goHomeTab}
                text={t.text} textMuted={t.textMuted} divider={t.divider}
              />
              <SettingRow
                ionIcon="heart-outline" iconBg="#C47B8A22" iconColor="#C47B8A"
                label="Prayer Journal"
                onPress={() => goHome('PrayerJournal')}
                text={t.text} textMuted={t.textMuted} divider={t.divider}
              />
              <SettingRow
                ionIcon="flame-outline" iconBg="#C9A96B22" iconColor="#C9A96B"
                label="Daily Devotion"
                onPress={() => goHome('Devotion')}
                text={t.text} textMuted={t.textMuted} divider={t.divider}
              />
              <SettingRow
                ionIcon="trophy-outline" iconBg="#6E8B7422" iconColor="#6E8B74"
                label="Spiritual Goals"
                onPress={() => goHome('Goals')}
                text={t.text} textMuted={t.textMuted} divider={t.divider}
                isLast
              />
            </View>

            {/* ── Account ── */}
            <Text style={[s.sectionTitle, { color: t.textMuted }]}>ACCOUNT</Text>
            <View style={[s.settingsCard, { borderColor: t.divider }]}>
              <SettingRow
                ionIcon="color-palette-outline" iconBg="#8A7AB022" iconColor="#8A7AB0"
                label="Appearance"
                onPress={() => nav.navigate('Appearance')}
                text={t.text} textMuted={t.textMuted} divider={t.divider}
              />
              <SettingRow
                ionIcon="notifications-outline" iconBg="#C47B7B22" iconColor="#C47B7B"
                label="Notifications"
                onPress={() => nav.navigate('Notifications')}
                text={t.text} textMuted={t.textMuted} divider={t.divider}
              />
              <SettingRow
                ionIcon="lock-closed-outline" iconBg="#6B8B8A22" iconColor="#6B8B8A"
                label="Privacy"
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
              accessibilityLabel="Sign out"
            >
              <Ionicons name="log-out-outline" size={16} color="#C87B7B" />
              <Text style={s.signOutText}>Sign Out</Text>
            </TouchableOpacity>

            <Text style={[s.versionText, { color: t.textMuted }]}>Daily Devotion v1.0</Text>

          </Animated.View>
        </ScrollView>

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

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  glassCircle: {
    width: 40, height: 40, borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },

  scroll: { paddingBottom: 60 },

  // Hero
  hero: { alignItems: 'center', paddingTop: 20, paddingBottom: 28 },
  avatarCircle: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 8,
  },
  avatarLetter:  { fontSize: 56, fontWeight: '700', letterSpacing: 1 },
  heroText:      { alignItems: 'center', paddingHorizontal: 32, gap: 4 },
  displayName:   { fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  usernameLabel: { fontSize: 13, textAlign: 'center' },
  aboutLabel:    { fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 2 },
  joinDate:      { fontSize: 11, textAlign: 'center', marginTop: 4 },

  sectionTitle: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.6,
    paddingHorizontal: 20, marginBottom: 4, marginTop: 28,
  },

  statsRow: {
    flexDirection: 'row',
    paddingVertical: 26,
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
    marginHorizontal: 20, paddingVertical: 18,
    marginTop: 20, marginBottom: 8,
  },
  signOutText: { color: '#C87B7B', fontSize: 15, fontWeight: '600' },
  versionText: { fontSize: 11, textAlign: 'center', marginBottom: 24, marginTop: 4 },
});
