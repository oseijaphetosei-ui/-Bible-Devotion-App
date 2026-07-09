import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  ScrollView, Animated, Alert, Pressable, Dimensions, Platform,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PhotoViewer, { type PhotoViewerOrigin } from '../../components/PhotoViewer';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import {
  getJoinDate, formatJoinDate, getStats, getFavoriteVerse, clearLocalProfile,
  getAbout, getUsername,
} from '../../services/profileService';
import { getSavedDisplayName } from '../../services/chatService';
import { getNotes, type Note } from '../../services/notesService';
import type { Stats, FavoriteVerse } from '../../types/profile';
import { ProfileStackParamList } from '../../types/navigation';
import { useProfilePicture } from '../../context/ProfileContext';

type NavProp = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

const SCREEN_W    = Dimensions.get('window').width;
const AVATAR_SIZE = 120;
const GOLD        = '#C9A96B';
const SERIF       = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const LIGHT_GLASS = {
  backgroundColor: 'rgba(255,255,255,0.62)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.80)',
  shadowColor: 'rgba(47,42,36,0.12)',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 1 as number,
  shadowRadius: 12,
  elevation: 3,
} as const;

const DARK_GLASS = {
  backgroundColor: 'rgba(255,255,255,0.06)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.10)',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.28 as number,
  shadowRadius: 14,
  elevation: 5,
} as const;

// ─── Cinematic Hero ───────────────────────────────────────────────────────────

interface HeroProps {
  displayName: string;
  username: string;
  joinDate: string;
  initial: string;
  picture: ReturnType<typeof useProfilePicture>['picture'];
  stats: Stats;
  insets: ReturnType<typeof useSafeAreaInsets>;
  avatarScale: Animated.Value;
  avatarRef: React.RefObject<View>;
  isDark: boolean;
  onBack: () => void;
  onEdit: () => void;
  onAvatarPress: () => void;
}

const CinematicHero = memo(function CinematicHero({
  displayName, username, joinDate, initial, picture, stats,
  insets, avatarScale, avatarRef, isDark, onBack, onEdit, onAvatarPress,
}: HeroProps) {
  const textColor   = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.88)';
  const subColor    = isDark ? 'rgba(255,255,255,0.50)' : 'rgba(24,18,8,0.46)';
  const btnBg       = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.62)';
  const btnBorder   = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.88)';
  const statsBg     = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.52)';
  const statsBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.78)';
  const statSepClr  = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)';
  const avatarBg    = picture?.type === 'avatar'
    ? picture.avatar.bg
    : (isDark ? 'rgba(201,169,107,0.12)' : 'rgba(201,169,107,0.08)');
  const avatarBorder = isDark ? 'rgba(201,169,107,0.42)' : 'rgba(201,169,107,0.30)';

  return (
    <View style={{ overflow: 'hidden', paddingBottom: 28 }}>
      {/* Base gradient — main depth */}
      <LinearGradient
        colors={isDark
          ? ['#07091C', '#0C1028', '#080D1E', '#060810'] as const
          : ['#EAE3D5', '#F0E8DA', '#E5DCCA', '#DDD5C4'] as const}
        locations={[0, 0.25, 0.65, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Lateral vignette — draws eye to center */}
      <LinearGradient
        colors={isDark
          ? ['rgba(15,22,52,0.50)', 'rgba(8,10,22,0)', 'rgba(12,18,46,0.40)'] as const
          : ['rgba(210,200,185,0.45)', 'rgba(245,240,230,0)', 'rgba(205,195,178,0.38)'] as const}
        start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Gold top accent fade */}
      <LinearGradient
        colors={['rgba(201,169,107,0.20)', 'rgba(201,169,107,0)'] as const}
        locations={[0, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 90 }}
      />

      {/* Nav row */}
      <View style={[hero.navRow, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.75}
          style={[hero.navBtn, { backgroundColor: btnBg, borderColor: btnBorder }]}
        >
          <Ionicons name="chevron-back" size={20} color={textColor} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onEdit}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.75}
          style={[hero.navBtn, { backgroundColor: btnBg, borderColor: btnBorder }]}
        >
          <Ionicons name="pencil-outline" size={16} color={textColor} />
        </TouchableOpacity>
      </View>

      {/* Center column */}
      <View style={hero.contentBlock}>
        {/* Eyebrow */}
        <View style={hero.eyebrowRow}>
          <Ionicons name="person-outline" size={11} color="rgba(201,169,107,0.85)" />
          <Text style={hero.eyebrow}>MY PROFILE</Text>
        </View>

        {/* Avatar with ambient glow outer ring */}
        <TouchableOpacity
          onPress={onAvatarPress}
          activeOpacity={picture?.type === 'photo' ? 0.92 : 0.78}
          style={{ alignSelf: 'center', marginBottom: 16 }}
          accessibilityLabel="Profile photo"
        >
          <Animated.View style={{ transform: [{ scale: avatarScale }] }}>
            {/* Outer glow shell */}
            <View style={[hero.avatarGlowShell, {
              shadowColor: GOLD,
              shadowOpacity: isDark ? 0.32 : 0.16,
            }]}>
              <View
                ref={avatarRef}
                collapsable={false}
                style={[hero.avatarWrap, { backgroundColor: avatarBg, borderColor: avatarBorder }]}
              >
                {picture?.type === 'photo' ? (
                  <ExpoImage
                    source={{ uri: picture.uri }}
                    style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                ) : picture?.type === 'avatar' ? (
                  <Text style={{ fontSize: 48 }}>{picture.avatar.emoji}</Text>
                ) : (
                  <Text style={[hero.avatarLetter, { color: isDark ? 'rgba(201,169,107,0.90)' : 'rgba(140,100,44,0.88)' }]}>
                    {initial}
                  </Text>
                )}
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* Name */}
        <Text style={[hero.displayName, { color: textColor, fontFamily: SERIF }]}>{displayName}</Text>

        {/* Username + join date */}
        <View style={hero.metaRow}>
          {username ? <Text style={[hero.metaText, { color: subColor }]}>@{username}</Text> : null}
          {username && joinDate ? <View style={[hero.metaDot, { backgroundColor: subColor }]} /> : null}
          {joinDate ? <Text style={[hero.metaText, { color: subColor }]}>Member since {joinDate}</Text> : null}
        </View>

        {/* Pure-glass stats pill */}
        <View style={[hero.statsPill, { backgroundColor: statsBg, borderColor: statsBorder }]}>
          <View style={hero.statsInner}>
            <HeroStat value={stats.streak}           label="Streak"   icon="flame-outline"  isDark={isDark} />
            <View style={[hero.statSep, { backgroundColor: statSepClr }]} />
            <HeroStat value={stats.chaptersRead}     label="Chapters" icon="book-outline"   isDark={isDark} />
            <View style={[hero.statSep, { backgroundColor: statSepClr }]} />
            <HeroStat value={stats.prayersCompleted} label="Prayers"  icon="heart-outline"  isDark={isDark} />
          </View>
        </View>
      </View>
    </View>
  );
});

function HeroStat({ value, label, icon, isDark }: { value: number; label: string; icon: string; isDark: boolean }) {
  const valColor   = isDark ? 'rgba(255,255,255,0.94)' : 'rgba(24,18,8,0.88)';
  const labelColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(24,18,8,0.42)';
  return (
    <View style={hero.statItem}>
      <Text style={[hero.statValue, { color: valColor }]}>{value}</Text>
      <View style={hero.statLabelRow}>
        <Ionicons name={icon as any} size={10} color={labelColor} />
        <Text style={[hero.statLabel, { color: labelColor }]}>{label}</Text>
      </View>
    </View>
  );
}

const hero = StyleSheet.create({
  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  contentBlock: {
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  eyebrowRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20, marginTop: 8,
  },
  eyebrow: {
    fontSize: 11, fontWeight: '700', letterSpacing: 2.2,
    color: 'rgba(201,169,107,0.85)',
  },
  avatarGlowShell: {
    borderRadius: (AVATAR_SIZE / 2) + 6,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 32,
    elevation: 0,
  },
  avatarWrap: {
    width: AVATAR_SIZE, height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10,
  },
  avatarLetter: {
    fontSize: 42, fontWeight: '400',
  },
  displayName: {
    fontSize: 28, fontWeight: '400', letterSpacing: -0.4, marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20,
  },
  metaText: { fontSize: 13, fontWeight: '500' },
  metaDot:  { width: 3, height: 3, borderRadius: 1.5 },
  statsPill: {
    width: '100%', borderRadius: 18, borderWidth: 1,
  },
  statsInner: { flexDirection: 'row', paddingVertical: 14 },
  statItem:   { flex: 1, alignItems: 'center', gap: 4 },
  statSep:    { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
  statValue:  { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statLabel:  { fontSize: 11, fontWeight: '500' },
});

// ─── Notes Activity Card ──────────────────────────────────────────────────────

const NOTE_COLOR = '#6E8B74';

function formatNoteDate(iso: string): string {
  const d    = new Date(iso);
  const now  = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (diff === 0) return `Today · ${time}`;
  if (diff === 1) return `Yesterday · ${time}`;
  const mon  = d.toLocaleString('en-US', { month: 'short' });
  return `${mon} ${d.getDate()} · ${time}`;
}

const NotesActivityCard = memo(function NotesActivityCard({
  count, latestNote, isDark, onPress,
}: {
  count: number;
  latestNote: Note | null;
  isDark: boolean;
  onPress: () => void;
}) {
  const glassStyle  = isDark ? DARK_GLASS : LIGHT_GLASS;
  const textColor   = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.90)';
  const subColor    = isDark ? 'rgba(255,255,255,0.52)' : 'rgba(24,18,8,0.48)';
  const mutedColor  = isDark ? 'rgba(255,255,255,0.32)' : 'rgba(24,18,8,0.30)';
  const divColor    = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const pressIn     = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 14 }).start();
  const pressOut    = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 14 }).start();

  return (
    <Animated.View style={[na.card, glassStyle, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable onPressIn={pressIn} onPressOut={pressOut} onPress={onPress} style={na.inner}>

        {/* ── Left: metric ── */}
        <View style={na.leftCol}>
          <View style={[na.accentBar, { backgroundColor: NOTE_COLOR }]} />
          <View style={[na.iconWrap, { backgroundColor: NOTE_COLOR + '22' }]}>
            <Ionicons name="create-outline" size={20} color={NOTE_COLOR} />
          </View>
          <Text style={[na.count, { color: textColor }]}>{count}</Text>
          <Text style={[na.countLabel, { color: mutedColor }]}>Notes{'\n'}Created</Text>
        </View>

        {/* ── Divider ── */}
        <View style={[na.divider, { backgroundColor: divColor }]} />

        {/* ── Right: latest note preview ── */}
        <View style={na.rightCol}>
          {latestNote ? (
            <>
              {/* Latest label */}
              <Text style={[na.latestLabel, { color: mutedColor }]}>LATEST NOTE</Text>

              {/* Title */}
              <Text style={[na.noteTitle, { color: textColor, fontFamily: SERIF }]} numberOfLines={2}>
                {latestNote.title || 'Untitled'}
              </Text>

              {/* Bible verse (conditional) */}
              {latestNote.bibleReference ? (
                <View style={na.verseRow}>
                  <Ionicons name="book-outline" size={10} color={GOLD} />
                  <Text style={[na.verseText, { color: GOLD }]} numberOfLines={1}>
                    {latestNote.bibleReference}
                  </Text>
                </View>
              ) : null}

              {/* Date */}
              <Text style={[na.dateText, { color: mutedColor }]}>
                {formatNoteDate(latestNote.updatedAt)}
              </Text>
            </>
          ) : (
            /* Empty state */
            <View style={na.emptyWrap}>
              <View style={[na.emptyIcon, { backgroundColor: NOTE_COLOR + '18' }]}>
                <Ionicons name="pencil-outline" size={16} color={NOTE_COLOR} />
              </View>
              <Text style={[na.emptyTitle, { color: subColor }]}>
                Your next reflection{'\n'}will appear here.
              </Text>
              <Text style={[na.emptyHint, { color: mutedColor }]}>Tap to start</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
});

const na = StyleSheet.create({
  card:        { borderRadius: 20, overflow: 'hidden' },
  inner:       { flexDirection: 'row', padding: 16, paddingBottom: 18, alignItems: 'stretch' },
  leftCol:     { width: 72 },
  accentBar:   { height: 3, width: 28, borderRadius: 2, marginBottom: 14 },
  iconWrap:    { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  count:       { fontSize: 26, fontWeight: '800', letterSpacing: -0.8, marginBottom: 2 },
  countLabel:  { fontSize: 10, fontWeight: '600', letterSpacing: 0.2, lineHeight: 14 },
  divider:     { width: StyleSheet.hairlineWidth, marginHorizontal: 14, alignSelf: 'stretch' },
  rightCol:    { flex: 1, justifyContent: 'center', gap: 5 },
  latestLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.4, marginBottom: 2 },
  noteTitle:   { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  verseRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verseText:   { fontSize: 11, fontWeight: '600' },
  dateText:    { fontSize: 11, fontWeight: '500', marginTop: 1 },
  emptyWrap:   { gap: 8 },
  emptyIcon:   { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:  { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  emptyHint:   { fontSize: 11 },
});

// ─── Favorite Verse Card ──────────────────────────────────────────────────────

const FavoriteVerseCard = memo(function FavoriteVerseCard({
  verse, isDark, onPress,
}: { verse: FavoriteVerse; isDark: boolean; onPress: () => void }) {
  const t = useTheme();
  const glassStyle = isDark ? DARK_GLASS : LIGHT_GLASS;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [fv.card, glassStyle, { borderRadius: 20, overflow: 'hidden', opacity: pressed ? 0.82 : 1 }]}>
      {/* Gold accent left bar */}
      <View style={[fv.leftBar, { backgroundColor: t.gold }]} />
      <View style={fv.body}>
        <View style={fv.topRow}>
          <Ionicons name="book-outline" size={13} color={t.gold} />
          <Text style={[fv.ref, { color: t.gold }]}>{verse.ref}</Text>
        </View>
        {verse.text ? (
          <Text style={[fv.text, { color: t.text }]} numberOfLines={4}>
            "{verse.text}"
          </Text>
        ) : null}
        <View style={fv.editHint}>
          <Text style={[fv.editLabel, { color: t.textMuted }]}>Tap to edit</Text>
          <Ionicons name="chevron-forward" size={11} color={t.textMuted} />
        </View>
      </View>
    </Pressable>
  );
});

const fv = StyleSheet.create({
  card: { flexDirection: 'row' },
  leftBar: { width: 3, alignSelf: 'stretch', borderRadius: 0 },
  body: { flex: 1, padding: 18 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  ref: { fontSize: 13, fontWeight: '700' },
  text: { fontSize: 15, fontFamily: 'Georgia', fontStyle: 'italic', lineHeight: 24, marginBottom: 12 },
  editHint: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  editLabel: { fontSize: 11, fontWeight: '500' },
});


// ─── Settings Row ─────────────────────────────────────────────────────────────

const SettingRow = memo(function SettingRow({
  ionIcon, iconBg, iconColor,
  label, value, onPress, isLast = false,
}: {
  ionIcon: string; iconBg: string; iconColor: string;
  label: string; value?: string;
  onPress: () => void; isLast?: boolean;
}) {
  const t = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 14 }).start();
  const pressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 14 }).start();

  return (
    <>
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} accessibilityRole="button">
        <Animated.View style={[sr.row, { transform: [{ scale: scaleAnim }] }]}>
          <View style={[sr.iconBox, { backgroundColor: iconBg }]}>
            <Ionicons name={ionIcon as any} size={16} color={iconColor} />
          </View>
          <Text style={[sr.label, { color: t.text }]}>{label}</Text>
          <View style={sr.right}>
            {value ? <Text style={[sr.value, { color: t.textMuted }]}>{value}</Text> : null}
            <Ionicons name="chevron-forward" size={15} color={t.textMuted} />
          </View>
        </Animated.View>
      </Pressable>
      {!isLast && <View style={[sr.divider, { backgroundColor: t.divider }]} />}
    </>
  );
});

const sr = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  iconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label:   { flex: 1, fontSize: 15, fontWeight: '500' },
  right:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  value:   { fontSize: 13 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 64 },
});

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: string }) {
  const t = useTheme();
  return (
    <Text style={[sh.label, { color: t.textMuted }]}>{children}</Text>
  );
}
const sh = StyleSheet.create({
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 2, paddingHorizontal: 4, marginBottom: 10, marginTop: 28 },
});

// ─── Settings Glass Card ──────────────────────────────────────────────────────

function SettingsCard({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  const glassStyle = isDark ? DARK_GLASS : LIGHT_GLASS;
  return (
    <View style={[glassStyle, { borderRadius: 20, overflow: 'hidden' }]}>
      {children}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const t       = useTheme();
  const nav     = useNavigation<NavProp>();
  const rootNav = useNavigation<any>();
  const insets  = useSafeAreaInsets();
  const { picture } = useProfilePicture();
  const isDark  = t.statusBar === 'light-content';

  const [displayName,   setDisplayName]        = useState('Believer');
  const [username,      setUsernameState]       = useState('');
  const [about,         setAboutState]          = useState('');
  const [joinDate,      setJoinDate]            = useState('');
  const [initial,       setInitial]             = useState('J');
  const [stats,         setStats]               = useState<Stats>({
    streak: 0, chaptersRead: 0, notesCreated: 0, scriptureChats: 0, prayersCompleted: 0,
  });
  const [favoriteVerse, setFavoriteVerseState]  = useState<FavoriteVerse | null>(null);
  const [latestNote,    setLatestNote]          = useState<Note | null>(null);

  const [viewerOpen,   setViewerOpen]   = useState(false);
  const [viewerOrigin, setViewerOrigin] = useState<PhotoViewerOrigin | null>(null);

  const avatarRef  = useRef<View>(null);
  const avatarAnim = useRef(new Animated.Value(0.85)).current;

  // Per-section entrance animations
  const fadeAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;
  const slideAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(24))).current;

  const load = useCallback(async () => {
    const [name, joinIso, fav, uname, bio] = await Promise.all([
      getSavedDisplayName(),
      getJoinDate(),
      getFavoriteVerse(),
      getUsername(),
      getAbout(),
    ]);
    let notesCount = 0;
    let firstNote: Note | null = null;
    try {
      const notes = await getNotes();
      notesCount = notes.length;
      firstNote  = notes[0] ?? null;
    } catch { /* offline */ }
    const s = await getStats(notesCount);

    if (name?.trim()) {
      setDisplayName(name.trim());
      setInitial(name.trim()[0].toUpperCase());
    }
    setJoinDate(formatJoinDate(joinIso));
    setStats(s);
    setLatestNote(firstNote);
    setFavoriteVerseState(fav);
    if (uname?.trim()) setUsernameState(uname.trim());
    if (bio?.trim())   setAboutState(bio.trim());
  }, []);

  useEffect(() => {
    load();
    // Avatar spring
    Animated.spring(avatarAnim, { toValue: 1, tension: 55, friction: 9, useNativeDriver: true }).start();
    // Staggered section entrance
    Animated.stagger(80, fadeAnims.map((fade, i) =>
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 420, delay: 180, useNativeDriver: true }),
        Animated.spring(slideAnims[i], { toValue: 0, tension: 160, friction: 22, useNativeDriver: true }),
      ])
    )).start();
  }, []);

  // Lightweight refresh of notes data whenever the screen comes into focus
  // (so the card reflects a note created while navigated away)
  useFocusEffect(useCallback(() => {
    getNotes()
      .then(notes => {
        setLatestNote(notes[0] ?? null);
        setStats(prev => ({ ...prev, notesCreated: notes.length }));
      })
      .catch(() => {});
  }, []));

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

  const goHome = useCallback((screen: string) => {
    rootNav.navigate('MainTabs', { screen: 'HomeTab', params: { screen } });
  }, [rootNav]);

  const goHomeTab = useCallback(() => {
    rootNav.navigate('MainTabs', { screen: 'HomeTab' });
  }, [rootNav]);

  const handleAvatarPress = useCallback(() => {
    if (picture?.type !== 'photo') {
      nav.navigate('EditProfile');
      return;
    }
    avatarRef.current?.measure((_fx, _fy, w, h, px, py) => {
      setViewerOrigin({ x: px, y: py, width: w, height: h });
      setViewerOpen(true);
    });
  }, [picture, nav]);

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#060810' : '#DDD5C4' }}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── Cinematic Hero ── */}
        <CinematicHero
          displayName={displayName}
          username={username}
          joinDate={joinDate}
          initial={initial}
          picture={picture}
          stats={stats}
          insets={insets}
          avatarScale={avatarAnim}
          avatarRef={avatarRef}
          isDark={isDark}
          onBack={() => rootNav.goBack()}
          onEdit={() => nav.navigate('EditProfile')}
          onAvatarPress={handleAvatarPress}
        />

        <View style={{ paddingHorizontal: 18 }}>

          {/* ── About ── */}
          {about ? (
            <Animated.View style={{ opacity: fadeAnims[0], transform: [{ translateY: slideAnims[0] }] }}>
              <View style={{ marginTop: 20, marginBottom: 4 }}>
                <Text style={[sc.about, { color: t.textMuted, fontFamily: 'Georgia', fontStyle: 'italic' }]}>
                  "{about}"
                </Text>
              </View>
            </Animated.View>
          ) : null}

          {/* ── Journey Dashboard ── */}
          <Animated.View style={{ opacity: fadeAnims[0], transform: [{ translateY: slideAnims[0] }] }}>
            <SectionHeader>YOUR JOURNEY</SectionHeader>
            <NotesActivityCard
              count={stats.notesCreated}
              latestNote={latestNote}
              isDark={isDark}
              onPress={() => rootNav.navigate('MainTabs', { screen: 'NotesTab' })}
            />
          </Animated.View>

          {/* ── Favorite Verse ── */}
          {favoriteVerse ? (
            <Animated.View style={{ opacity: fadeAnims[1], transform: [{ translateY: slideAnims[1] }] }}>
              <SectionHeader>FAVORITE VERSE</SectionHeader>
              <FavoriteVerseCard
                verse={favoriteVerse}
                isDark={isDark}
                onPress={() => nav.navigate('EditProfile')}
              />
            </Animated.View>
          ) : null}

          {/* ── Quick Access ── */}
          <Animated.View style={{ opacity: fadeAnims[2], transform: [{ translateY: slideAnims[2] }] }}>
            {/* Monochrome icon treatment for quick-access rows */}
            {(() => {
              const iconBg  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
              const iconClr = isDark ? 'rgba(255,255,255,0.68)' : 'rgba(24,18,8,0.58)';
              const noteBadge = stats.notesCreated > 0 ? `${stats.notesCreated}` : undefined;
              return (
                <>
                  <SectionHeader>BIBLE & STUDY</SectionHeader>
                  <SettingsCard isDark={isDark}>
                    <SettingRow
                      ionIcon="book-outline" iconBg={iconBg} iconColor={iconClr}
                      label="Bible"
                      onPress={() => goHome('Bible')}
                    />
                    <SettingRow
                      ionIcon="sunny-outline" iconBg={iconBg} iconColor={iconClr}
                      label="Daily Devotion"
                      value="Today's Word"
                      onPress={() => goHome('Devotion')}
                    />
                    <SettingRow
                      ionIcon="document-text-outline" iconBg={iconBg} iconColor={iconClr}
                      label="My Notes"
                      value={noteBadge}
                      onPress={() => rootNav.navigate('MainTabs', { screen: 'NotesTab' })}
                    />
                    <SettingRow
                      ionIcon="trophy-outline" iconBg={iconBg} iconColor={iconClr}
                      label="Spiritual Goals"
                      onPress={() => goHome('Goals')}
                      isLast
                    />
                  </SettingsCard>

                  <SectionHeader>SPIRITUAL TOOLS</SectionHeader>
                  <SettingsCard isDark={isDark}>
                    <SettingRow
                      ionIcon="heart-outline" iconBg={iconBg} iconColor={iconClr}
                      label="Prayer Journal"
                      onPress={() => goHome('PrayerJournal')}
                    />
                    <SettingRow
                      ionIcon="sparkles-outline" iconBg={iconBg} iconColor={iconClr}
                      label="Scripture Insights"
                      value="AI"
                      onPress={goHomeTab}
                      isLast
                    />
                  </SettingsCard>
                </>
              );
            })()}
          </Animated.View>

          {/* ── Account Settings ── */}
          <Animated.View style={{ opacity: fadeAnims[3], transform: [{ translateY: slideAnims[3] }] }}>
            {(() => {
              const iconBg  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
              const iconClr = isDark ? 'rgba(255,255,255,0.68)' : 'rgba(24,18,8,0.58)';
              return (
                <>
                  <SectionHeader>ACCOUNT</SectionHeader>
                  <SettingsCard isDark={isDark}>
                    <SettingRow
                      ionIcon="color-palette-outline" iconBg={iconBg} iconColor={iconClr}
                      label="Appearance"
                      onPress={() => nav.navigate('Appearance')}
                    />
                    <SettingRow
                      ionIcon="notifications-outline" iconBg={iconBg} iconColor={iconClr}
                      label="Notifications"
                      onPress={() => nav.navigate('Notifications')}
                    />
                    <SettingRow
                      ionIcon="lock-closed-outline" iconBg={iconBg} iconColor={iconClr}
                      label="Privacy"
                      onPress={() => nav.navigate('Privacy')}
                      isLast
                    />
                  </SettingsCard>

                  <SectionHeader>LEGAL</SectionHeader>
                  <SettingsCard isDark={isDark}>
                    <SettingRow
                      ionIcon="shield-checkmark-outline" iconBg={iconBg} iconColor={iconClr}
                      label="Privacy Policy"
                      onPress={() => nav.navigate('PrivacyPolicy')}
                    />
                    <SettingRow
                      ionIcon="document-text-outline" iconBg={iconBg} iconColor={iconClr}
                      label="Terms of Service"
                      onPress={() => nav.navigate('TermsOfService')}
                      isLast
                    />
                  </SettingsCard>
                </>
              );
            })()}
          </Animated.View>

          {/* ── Sign Out ── */}
          <Animated.View style={{ opacity: fadeAnims[4], transform: [{ translateY: slideAnims[4] }] }}>
            <TouchableOpacity
              onPress={handleSignOut}
              activeOpacity={0.6}
              accessibilityLabel="Sign out"
              style={sc.signOutBtn}
            >
              <Text style={sc.signOutLabel}>Sign Out</Text>
            </TouchableOpacity>

            <Text style={[sc.versionText, { color: t.textMuted }]}>Daily Devotion v1.0</Text>
          </Animated.View>

        </View>
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
    </View>
  );
}

// ─── Screen-level styles ──────────────────────────────────────────────────────

const sc = StyleSheet.create({
  about: {
    fontSize: 15, lineHeight: 24, textAlign: 'center',
    paddingHorizontal: 12, marginBottom: 4,
  },
  signOutBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 28,
  },
  signOutLabel: {
    fontSize: 14, fontWeight: '500', color: '#C87B7B',
  },
  versionText: {
    fontSize: 11, textAlign: 'center',
    marginTop: 16, marginBottom: 8,
  },
});
