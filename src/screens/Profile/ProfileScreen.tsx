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
  getJoinDate, formatJoinDate, getStats, getFavoriteVerse,
  checkAndUpdateStreak, clearLocalProfile,
} from '../../services/profileService';
import { getSavedDisplayName } from '../../services/chatService';
import { getNotes } from '../../services/notesService';
import { computeAchievements } from '../../types/profile';
import type { Stats, Achievement, FavoriteVerse } from '../../types/profile';
import { ProfileStackParamList } from '../../types/navigation';
import { useProfilePicture } from '../../context/ProfileContext';

type NavProp = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

// ── Stat card ─────────────────────────────────────────────────────────────────

const StatCard = memo(function StatCard({
  icon, value, label, cardBg, cardBorder, text, textMuted,
}: {
  icon: string; value: number | string; label: string;
  cardBg: string; cardBorder: string; text: string; textMuted: string;
}) {
  return (
    <View style={[sc.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <Text style={sc.icon}>{icon}</Text>
      <Text style={[sc.value, { color: text }]}>{value}</Text>
      <Text style={[sc.label, { color: textMuted }]}>{label}</Text>
    </View>
  );
});

const sc = StyleSheet.create({
  card: {
    flex: 1, alignItems: 'center', borderRadius: 14, borderWidth: 1,
    paddingVertical: 14, paddingHorizontal: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  icon:  { fontSize: 22, marginBottom: 6 },
  value: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5, marginBottom: 2 },
  label: { fontSize: 10, fontWeight: '600', textAlign: 'center', lineHeight: 13 },
});

// ── Achievement badge ─────────────────────────────────────────────────────────

const AchievementBadge = memo(function AchievementBadge({
  badge, cardBg, cardBorder, text, textMuted, gold, goldBg, goldBorder,
}: {
  badge: Achievement;
  cardBg: string; cardBorder: string; text: string; textMuted: string;
  gold: string; goldBg: string; goldBorder: string;
}) {
  return (
    <View style={[
      ab.card,
      badge.unlocked
        ? { backgroundColor: goldBg, borderColor: goldBorder }
        : { backgroundColor: cardBg, borderColor: cardBorder, opacity: 0.5 },
    ]}>
      <Text style={[ab.icon, { opacity: badge.unlocked ? 1 : 0.4 }]}>{badge.icon}</Text>
      <Text style={[ab.title, { color: badge.unlocked ? gold : text }]} numberOfLines={2}>
        {badge.title}
      </Text>
      <Text style={[ab.desc, { color: textMuted }]} numberOfLines={2}>{badge.description}</Text>
    </View>
  );
});

const ab = StyleSheet.create({
  card: {
    width: 96, alignItems: 'center', borderRadius: 14, borderWidth: 1,
    paddingVertical: 12, paddingHorizontal: 8,
  },
  icon:  { fontSize: 28, marginBottom: 6 },
  title: { fontSize: 11, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  desc:  { fontSize: 9, textAlign: 'center', lineHeight: 12 },
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

// ── Quick action card ─────────────────────────────────────────────────────────

const QuickActionCard = memo(function QuickActionCard({
  icon, label, onPress, cardBg, cardBorder, text,
}: {
  icon: string; label: string; onPress: () => void;
  cardBg: string; cardBorder: string; text: string;
}) {
  return (
    <TouchableOpacity
      style={[qa.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
      onPress={onPress}
      activeOpacity={0.78}
    >
      <Text style={qa.icon}>{icon}</Text>
      <Text style={[qa.label, { color: text }]} numberOfLines={2}>{label}</Text>
      <Ionicons name="chevron-forward" size={14} color="rgba(150,140,130,0.6)" />
    </TouchableOpacity>
  );
});

const qa = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  icon:  { fontSize: 20, width: 28, textAlign: 'center' },
  label: { flex: 1, fontSize: 14, fontWeight: '600' },
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
  const [achievements,  setAchievements]  = useState<Achievement[]>([]);
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

    await checkAndUpdateStreak();

    let notesCount = 0;
    try { const notes = await getNotes(); notesCount = notes.length; } catch { /* offline */ }

    const s = await getStats(notesCount);

    if (name?.trim()) {
      setDisplayName(name.trim());
      setInitial(name.trim()[0].toUpperCase());
    }
    setJoinDate(formatJoinDate(joinIso));
    setStats(s);
    setAchievements(computeAchievements(s));
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
    rootNav.goBack();
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

  const unlocked = achievements.filter(a => a.unlocked).length;

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

            {/* ── Stats ── */}
            <Text style={[s.sectionTitle, { color: t.textMuted }]}>SPIRITUAL PROGRESS</Text>
            <View style={s.statsGrid}>
              <View style={s.statsRow}>
                <StatCard
                  icon="🔥" value={stats.streak}
                  label="Day Streak"
                  cardBg={t.card} cardBorder={t.cardBorder} text={t.text} textMuted={t.textMuted}
                />
                <StatCard
                  icon="📖" value={stats.chaptersRead}
                  label="Chapters Read"
                  cardBg={t.card} cardBorder={t.cardBorder} text={t.text} textMuted={t.textMuted}
                />
              </View>
            </View>

            {/* ── Quick Actions ── */}
            <Text style={[s.sectionTitle, { color: t.textMuted }]}>QUICK ACCESS</Text>
            <View style={s.quickActions}>
              <QuickActionCard
                icon="📝" label="My Notes"
                onPress={() => navigateToTab('NotesTab')}
                cardBg={t.card} cardBorder={t.cardBorder} text={t.text}
              />
              <QuickActionCard
                icon="📖" label="Reading History"
                onPress={() => Alert.alert('Coming Soon', 'Reading History is coming in the next update!')}
                cardBg={t.card} cardBorder={t.cardBorder} text={t.text}
              />
              <QuickActionCard
                icon="❤️" label="Saved Favorites"
                onPress={() => Alert.alert('Coming Soon', 'Favorites is coming in the next update!')}
                cardBg={t.card} cardBorder={t.cardBorder} text={t.text}
              />
              <QuickActionCard
                icon="💬" label="Scripture Conversations"
                onPress={() => navigateToTab('HomeTab')}
                cardBg={t.card} cardBorder={t.cardBorder} text={t.text}
              />
              <QuickActionCard
                icon="🙏" label="Prayer Journal"
                onPress={() => Alert.alert('Coming Soon', 'Prayer Journal is coming in the next update!')}
                cardBg={t.card} cardBorder={t.cardBorder} text={t.text}
              />
            </View>

            {/* ── Achievements ── */}
            <View style={s.achievementsHeader}>
              <Text style={[s.sectionTitle, { color: t.textMuted, marginBottom: 0 }]}>ACHIEVEMENTS</Text>
              <Text style={[s.achievementCount, { color: t.textMuted }]}>
                {unlocked} / {achievements.length}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.badgeList}
              style={s.badgeScroll}
            >
              {achievements.map(badge => (
                <AchievementBadge
                  key={badge.id}
                  badge={badge}
                  cardBg={t.card} cardBorder={t.cardBorder}
                  text={t.text} textMuted={t.textMuted}
                  gold={t.gold} goldBg={t.goldBg} goldBorder={t.goldBorder}
                />
              ))}
            </ScrollView>

            {/* ── Favorite Verse ── */}
            <Text style={[s.sectionTitle, { color: t.textMuted }]}>FAVORITE VERSE</Text>
            <TouchableOpacity
              style={[s.verseCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}
              onPress={() => nav.navigate('EditProfile')}
              activeOpacity={0.8}
            >
              <Text style={s.verseEmoji}>📖</Text>
              <View style={{ flex: 1 }}>
                {favoriteVerse ? (
                  <>
                    <Text style={[s.verseRef, { color: t.gold }]}>{favoriteVerse.ref}</Text>
                    {favoriteVerse.text ? (
                      <Text style={[s.verseText, { color: t.textSub }]} numberOfLines={3}>
                        {favoriteVerse.text}
                      </Text>
                    ) : null}
                  </>
                ) : (
                  <Text style={[s.versePlaceholder, { color: t.textMuted }]}>
                    Tap to set your favorite verse
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => nav.navigate('EditProfile')} activeOpacity={0.7}>
                <Text style={[s.editText, { color: t.gold }]}>Edit</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            {/* ── Account ── */}
            <Text style={[s.sectionTitle, { color: t.textMuted }]}>ACCOUNT</Text>
            <View style={[s.settingsCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
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
              style={[s.signOutBtn, { backgroundColor: 'rgba(200,123,123,0.10)', borderColor: 'rgba(200,123,123,0.25)' }]}
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={18} color="#C87B7B" />
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
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', textAlign: 'center' },

  // Glass circular back button
  glassCircle: {
    width: 40, height: 40, borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },

  // Glass pill edit button
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
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatarCircle: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
  },
avatarLetter: { fontSize: 46, fontWeight: '700', letterSpacing: 1 },
  displayName:  { fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3, marginBottom: 4 },
  joinDate:     { fontSize: 13, textAlign: 'center' },

  sectionTitle: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1.2,
    paddingHorizontal: 20, marginBottom: 12, marginTop: 8,
  },

  statsGrid: { paddingHorizontal: 18, gap: 10, marginBottom: 24 },
  statsRow:  { flexDirection: 'row', gap: 10 },

  quickActions: { paddingHorizontal: 18, gap: 8, marginBottom: 24 },

  achievementsHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 12, marginTop: 8,
  },
  achievementCount: { fontSize: 12, fontWeight: '600' },
  badgeScroll:  { marginBottom: 24 },
  badgeList:    { paddingHorizontal: 18, gap: 10 },

  verseCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    marginHorizontal: 18, borderRadius: 16, borderWidth: 1,
    padding: 16, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  verseEmoji:       { fontSize: 22, marginTop: 2 },
  verseRef:         { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  verseText:        { fontSize: 13, lineHeight: 19, fontStyle: 'italic' },
  versePlaceholder: { fontSize: 14, fontStyle: 'italic' },
  editText:         { fontSize: 13, fontWeight: '600', marginTop: 2 },

  settingsCard: {
    marginHorizontal: 18, borderRadius: 16, borderWidth: 1,
    overflow: 'hidden', marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1, borderRadius: 14,
    marginHorizontal: 18, paddingVertical: 15,
    marginBottom: 16,
  },
  signOutText: { color: '#C87B7B', fontSize: 15, fontWeight: '700' },
  versionText: { fontSize: 11, textAlign: 'center', marginBottom: 20 },
});
