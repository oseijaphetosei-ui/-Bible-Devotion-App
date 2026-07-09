import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar,
  Animated, ActivityIndicator, Pressable, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import ProfileAvatar from '../../components/ProfileAvatar';
import PremiumSearchBar from '../../components/PremiumSearchBar';
import {
  subscribeToPosts, reactToPost, prayForPost,
  getGroups, joinGroup, searchPosts,
} from '../../services/communityService';
import type { Post, Group, FeedFilter } from '../../types/community';
import {
  COMMUNITY_CATEGORIES, FEED_FILTERS, REACTIONS, POST_TYPE_META, REACTION_META,
} from '../../types/community';
import { CommunityStackParamList } from '../../types/navigation';

type NavProp = NativeStackNavigationProp<CommunityStackParamList, 'Community'>;

const GOLD     = '#C9A96B';
const HEADER_H = 62;

const SECTION_TITLES: Record<FeedFilter, string> = {
  all:       'COMMUNITY FEED',
  trending:  'TRENDING',
  recent:    'RECENT',
  prayer:    'PRAYER REQUESTS',
  bible:     'BIBLE DISCUSSIONS',
  testimony: 'TESTIMONIES',
  question:  'QUESTIONS & ANSWERS',
  groups:    'COMMUNITY FEED',
};

const CATEGORY_FILTER_MAP: Record<string, FeedFilter> = {
  prayer:        'prayer',
  bible:         'bible',
  testimonies:   'testimony',
  encouragement: 'all',
  questions:     'question',
  challenges:    'all',
  groups:        'groups',
};

function relativeTime(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// ─── Glass constants ──────────────────────────────────────────────────────────

const DARK_GLASS = {
  backgroundColor: 'rgba(255,255,255,0.055)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.09)',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.24,
  shadowRadius: 14,
  elevation: 5,
} as const;

const LIGHT_GLASS = {
  backgroundColor: 'rgba(255,255,255,0.68)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.85)',
  shadowColor: 'rgba(47,42,36,0.11)' as string,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 1 as number,
  shadowRadius: 12,
  elevation: 3,
} as const;

// ── Category card ──────────────────────────────────────────────────────────────

const CategoryCard = memo(function CategoryCard({
  cat, isDark, active, onPress,
}: {
  cat: typeof COMMUNITY_CATEGORIES[number];
  isDark: boolean;
  active: boolean;
  onPress: () => void;
}) {
  const glass = isDark ? DARK_GLASS : LIGHT_GLASS;
  const textColor = isDark ? 'rgba(255,255,255,0.70)' : 'rgba(30,24,12,0.68)';

  return (
    <TouchableOpacity
      style={[cc.card, glass, active && { borderColor: cat.color + 'AA' }]}
      activeOpacity={0.72}
      onPress={onPress}
    >
      <View style={[cc.iconCircle, { backgroundColor: cat.color + '22', borderColor: cat.color + '44' }]}>
        <Text style={cc.icon}>{cat.icon}</Text>
      </View>
      <Text style={[cc.label, { color: active ? cat.color : textColor }]} numberOfLines={2}>
        {cat.label}
      </Text>
    </TouchableOpacity>
  );
});

const cc = StyleSheet.create({
  card: {
    width: 90, borderRadius: 18,
    padding: 12, alignItems: 'center', gap: 8,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  icon:  { fontSize: 21 },
  label: { fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 14 },
});

// ── Post card ──────────────────────────────────────────────────────────────────

const PostCard = memo(function PostCard({
  post, onPress, onReact, onPray, isDark,
}: {
  post: Post;
  onPress: () => void;
  onReact: (reaction: string) => void;
  onPray: () => void;
  isDark: boolean;
}) {
  const [showReactions, setShowReactions] = useState(false);
  const glass      = isDark ? DARK_GLASS : LIGHT_GLASS;
  const meta       = POST_TYPE_META[post.type];
  const totalReact = Object.values(post.reactions).reduce((a, b) => a + b, 0);

  const textColor    = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const subColor     = isDark ? 'rgba(255,255,255,0.62)' : 'rgba(24,18,8,0.60)';
  const mutedColor   = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(24,18,8,0.07)';
  const isScripture  = post.type === 'scripture';
  const serif        = Platform.OS === 'ios' ? 'Georgia' : 'serif';

  return (
    <TouchableOpacity style={[pc.card, glass]} onPress={onPress} activeOpacity={0.88}>
      {/* Author row */}
      <View style={pc.authorRow}>
        <View style={[pc.avatar, { backgroundColor: post.authorColor + '33', borderColor: post.authorColor + '55' }]}>
          <Text style={[pc.avatarLetter, { color: post.authorColor }]}>
            {post.authorName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={pc.authorInfo}>
          <Text style={[pc.authorName, { color: textColor }]}>{post.authorName}</Text>
          <Text style={[pc.timeText, { color: mutedColor }]}>{relativeTime(post.createdAt)}</Text>
        </View>
        {meta.label ? (
          <View style={[pc.typeBadge, { backgroundColor: meta.color + '20', borderColor: meta.color + '50' }]}>
            <Text style={pc.typeBadgeIcon}>{meta.icon}</Text>
            <Text style={[pc.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        ) : null}
      </View>

      {/* Scripture ref */}
      {post.scriptureRef ? (
        <View style={[pc.scriptureRef, { backgroundColor: 'rgba(201,169,107,0.10)', borderColor: 'rgba(201,169,107,0.28)' }]}>
          <Ionicons name="book-outline" size={12} color={GOLD} />
          <Text style={[pc.scriptureText, { color: GOLD, fontFamily: serif }]}>
            {post.scriptureRef}
          </Text>
        </View>
      ) : null}

      {/* Content */}
      <Text
        style={[pc.content, { color: subColor, fontFamily: isScripture ? serif : undefined }]}
        numberOfLines={4}
      >
        {post.content}
      </Text>

      {/* Prayer answered */}
      {post.answered ? (
        <View style={[pc.answeredBadge, { backgroundColor: '#7BA87B1E', borderColor: '#7BA87B50' }]}>
          <Ionicons name="checkmark-circle" size={14} color="#7BA87B" />
          <Text style={{ color: '#7BA87B', fontSize: 12, fontWeight: '700' }}>Prayer Answered!</Text>
        </View>
      ) : null}

      <View style={[pc.divider, { backgroundColor: dividerColor }]} />

      {/* Action bar */}
      <View style={pc.actions}>
        <TouchableOpacity
          style={[pc.actionBtn, post.userReaction && { backgroundColor: 'rgba(201,169,107,0.10)' }]}
          onPress={() => setShowReactions(v => !v)}
          activeOpacity={0.7}
        >
          <Text style={pc.actionEmoji}>
            {post.userReaction ? REACTION_META[post.userReaction].emoji : '❤️'}
          </Text>
          {totalReact > 0 && (
            <Text style={[pc.actionCount, { color: post.userReaction ? GOLD : mutedColor }]}>
              {totalReact}
            </Text>
          )}
        </TouchableOpacity>

        {post.type === 'prayer' && (
          <TouchableOpacity
            style={[pc.actionBtn, post.userPraying && { backgroundColor: '#7BA8C818' }]}
            onPress={onPray}
            activeOpacity={0.7}
          >
            <Ionicons name="hand-right-outline" size={15} color={post.userPraying ? '#7BA8C8' : mutedColor} />
            {post.prayerCount > 0 && (
              <Text style={[pc.actionCount, { color: post.userPraying ? '#7BA8C8' : mutedColor }]}>
                {post.prayerCount}
              </Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={pc.actionBtn} onPress={onPress} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={16} color={mutedColor} />
          {post.commentCount > 0 && (
            <Text style={[pc.actionCount, { color: mutedColor }]}>{post.commentCount}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Reaction picker */}
      {showReactions && (
        <View style={[pc.reactionRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)', borderColor: dividerColor }]}>
          {REACTIONS.map(([key, r]) => (
            <TouchableOpacity
              key={key}
              style={[pc.reactionBtn, post.userReaction === key && { backgroundColor: 'rgba(201,169,107,0.16)' }]}
              onPress={() => { onReact(key); setShowReactions(false); }}
            >
              <Text style={pc.reactionEmoji}>{r.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
});

const pc = StyleSheet.create({
  card: { borderRadius: 20, padding: 18, marginBottom: 14 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 16, fontWeight: '700' },
  authorInfo:   { flex: 1 },
  authorName:   { fontSize: 14, fontWeight: '700' },
  timeText:     { fontSize: 11, marginTop: 1 },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  typeBadgeIcon: { fontSize: 11 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  scriptureRef: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
    marginBottom: 10, alignSelf: 'flex-start',
  },
  scriptureText: { fontSize: 12, fontWeight: '700' },
  content:      { fontSize: 14, lineHeight: 22 },
  answeredBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 8, borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start',
  },
  divider:     { height: 1, marginVertical: 12 },
  actions:     { flexDirection: 'row', gap: 6 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  actionEmoji:   { fontSize: 15 },
  actionCount:   { fontSize: 12, fontWeight: '600' },
  reactionRow: {
    flexDirection: 'row', gap: 4,
    marginTop: 8, borderWidth: 1,
    borderRadius: 24, padding: 6, alignSelf: 'flex-start',
  },
  reactionBtn:   { padding: 6, borderRadius: 18 },
  reactionEmoji: { fontSize: 20 },
});

// ── Group card ────────────────────────────────────────────────────────────────

const GroupCard = memo(function GroupCard({
  group, onJoin, isDark,
}: {
  group: Group;
  onJoin: () => void;
  isDark: boolean;
}) {
  const glass    = isDark ? DARK_GLASS : LIGHT_GLASS;
  const textColor  = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const subColor   = isDark ? 'rgba(255,255,255,0.60)' : 'rgba(24,18,8,0.58)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';

  return (
    <View style={[gc.card, glass]}>
      <View style={[gc.iconWrap, { backgroundColor: GOLD + '1A' }]}>
        <Text style={gc.icon}>{group.icon}</Text>
      </View>
      <View style={gc.info}>
        <Text style={[gc.name, { color: textColor }]}>{group.name}</Text>
        <Text style={[gc.desc, { color: subColor }]} numberOfLines={1}>{group.description}</Text>
        <Text style={[gc.count, { color: mutedColor }]}>{group.memberCount.toLocaleString()} members</Text>
      </View>
      <TouchableOpacity
        style={[
          gc.joinBtn,
          group.joined
            ? { backgroundColor: 'transparent', borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)' }
            : { backgroundColor: 'rgba(201,169,107,0.12)', borderColor: 'rgba(201,169,107,0.30)' },
        ]}
        onPress={onJoin}
        activeOpacity={group.joined ? 1 : 0.78}
        disabled={group.joined}
      >
        <Text style={[gc.joinText, { color: group.joined ? mutedColor : GOLD }]}>
          {group.joined ? 'Joined ✓' : 'Join'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const gc = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 18, padding: 16, marginBottom: 12,
  },
  iconWrap: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  icon:  { fontSize: 22 },
  info:  { flex: 1 },
  name:  { fontSize: 14, fontWeight: '700' },
  desc:  { fontSize: 12, marginTop: 2 },
  count: { fontSize: 11, marginTop: 2 },
  joinBtn: {
    borderWidth: 1, borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  joinText: { fontSize: 12, fontWeight: '700' },
});

// ── Compose options ────────────────────────────────────────────────────────────

const POST_OPTIONS: { key: string; label: string; icon: string; color: string }[] = [
  { key: 'post',      label: 'Share a Thought',     icon: '💬', color: '#7B9BC8' },
  { key: 'testimony', label: 'Share Testimony',      icon: '✨', color: GOLD },
  { key: 'prayer',    label: 'Prayer Request',       icon: '🙏', color: '#C47B8A' },
  { key: 'question',  label: 'Ask a Question',       icon: '❓', color: '#7BA8C8' },
  { key: 'scripture', label: 'Scripture Discussion', icon: '📖', color: '#7BA87B' },
];

// ── Main screen ───────────────────────────────────────────────────────────────

export default function CommunityScreen() {
  const t          = useTheme();
  const navigation = useNavigation<NavProp>();
  const insets     = useSafeAreaInsets();
  const isDark     = t.statusBar === 'light-content';

  const [posts,         setPosts]         = useState<Post[]>([]);
  const [groups,        setGroups]        = useState<Group[]>([]);
  const [filter,        setFilter]        = useState<FeedFilter>('all');
  const [loading,       setLoading]       = useState(true);
  const [query,         setQuery]         = useState('');
  const [isSearching,   setIsSearching]   = useState(false);
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [showCompose,   setShowCompose]   = useState(false);

  const headerAnim     = useRef(new Animated.Value(1)).current;
  const composeAnim    = useRef(new Animated.Value(0)).current;
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unsubRef       = useRef<(() => void) | null>(null);

  const rootBg = isDark ? '#060810' : '#DDD5C4';

  useEffect(() => {
    if (filter === 'groups') {
      setLoading(true);
      getGroups().then(g => { setGroups(g); setLoading(false); });
      return;
    }
    setLoading(true);
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    unsubRef.current = subscribeToPosts(filter as any, (data) => {
      setPosts(data);
      setLoading(false);
    });
    return () => { if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; } };
  }, [filter]);

  const onSearchActiveChange = useCallback((active: boolean) => {
    Animated.timing(headerAnim, { toValue: active ? 0 : 1, duration: 250, useNativeDriver: false }).start();
    setIsSearching(active);
    if (!active) { setQuery(''); setSearchResults([]); }
  }, [headerAnim]);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!text.trim()) { setSearchResults([]); return; }
    searchTimerRef.current = setTimeout(async () => {
      setSearchResults(await searchPosts(text));
    }, 300);
  }, []);

  const handleReact = useCallback(async (postId: string, reaction: string) => {
    await reactToPost(postId, reaction as any);
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const prev2 = p.userReaction;
      const updated = { ...p.reactions };
      if (prev2 === reaction) { updated[prev2] = Math.max(0, updated[prev2] - 1); return { ...p, reactions: updated, userReaction: undefined }; }
      if (prev2) updated[prev2] = Math.max(0, updated[prev2] - 1);
      updated[reaction as any] = (updated[reaction as any] ?? 0) + 1;
      return { ...p, reactions: updated, userReaction: reaction as any };
    }));
  }, []);

  const handlePray = useCallback(async (postId: string) => {
    const wasNew = await prayForPost(postId);
    if (wasNew) setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, prayerCount: p.prayerCount + 1, userPraying: true }));
  }, []);

  const handleJoinGroup = useCallback(async (groupId: string) => {
    await joinGroup(groupId);
    setGroups(prev => prev.map(g => g.id !== groupId ? g : { ...g, joined: true, memberCount: g.memberCount + (g.joined ? 0 : 1) }));
  }, []);

  const toggleCompose = useCallback(() => {
    const next = !showCompose;
    setShowCompose(next);
    Animated.spring(composeAnim, { toValue: next ? 1 : 0, tension: 200, friction: 20, useNativeDriver: true }).start();
  }, [showCompose, composeAnim]);

  const closeCompose = useCallback(() => {
    setShowCompose(false);
    Animated.spring(composeAnim, { toValue: 0, tension: 200, friction: 20, useNativeDriver: true }).start();
  }, [composeAnim]);

  const handleCategoryPress = useCallback((categoryId: string) => {
    setFilter(CATEGORY_FILTER_MAP[categoryId] ?? 'all');
  }, []);

  const displayedPosts = isSearching && query ? searchResults : posts;

  // ── Empty states ──────────────────────────────────────────────────────────

  const PostEmptyState = useCallback(() => {
    const iconMap: Partial<Record<FeedFilter, any>> = {
      prayer: 'hand-right-outline', testimony: 'sparkles-outline',
      question: 'help-circle-outline', bible: 'book-outline',
    };
    const icon  = isSearching ? 'search-outline' : (iconMap[filter] ?? 'leaf-outline');
    const title = isSearching ? 'No results found' : 'Be the first to share';
    const sub   = isSearching
      ? `Nothing matched "${query}". Try different words.`
      : 'Share a prayer, testimony, or thought with the community.';
    const textCol  = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(24,18,8,0.85)';
    const mutedCol = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(24,18,8,0.45)';
    return (
      <View style={s.emptyState}>
        <View style={[s.emptyIconWrap, { backgroundColor: 'rgba(201,169,107,0.12)', borderColor: 'rgba(201,169,107,0.28)' }]}>
          <Ionicons name={icon} size={30} color={GOLD} />
        </View>
        <Text style={[s.emptyTitle, { color: textCol }]}>{title}</Text>
        <Text style={[s.emptySub, { color: mutedCol }]}>{sub}</Text>
        {!isSearching && (
          <Text style={[s.emptyHint, { color: isDark ? 'rgba(255,255,255,0.30)' : 'rgba(24,18,8,0.30)' }]}>
            Tap + to start a conversation
          </Text>
        )}
      </View>
    );
  }, [isDark, filter, isSearching, query]);

  const GroupEmptyState = useCallback(() => {
    const textCol  = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(24,18,8,0.85)';
    const mutedCol = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(24,18,8,0.45)';
    return (
      <View style={s.emptyState}>
        <View style={[s.emptyIconWrap, { backgroundColor: 'rgba(201,169,107,0.12)', borderColor: 'rgba(201,169,107,0.28)' }]}>
          <Ionicons name="people-outline" size={30} color={GOLD} />
        </View>
        <Text style={[s.emptyTitle, { color: textCol }]}>No groups yet</Text>
        <Text style={[s.emptySub, { color: mutedCol }]}>
          Groups are coming soon. Check back to find communities to join.
        </Text>
      </View>
    );
  }, [isDark]);

  // ── List header ───────────────────────────────────────────────────────────

  const sectionColor = isDark ? 'rgba(255,255,255,0.32)' : 'rgba(24,18,8,0.32)';
  const ListHeader = useCallback(() => (
    <View>
      <Text style={[s.sectionTitle, { color: sectionColor }]}>EXPLORE TOPICS</Text>
      <FlatList
        data={COMMUNITY_CATEGORIES}
        keyExtractor={c => c.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.catList}
        renderItem={({ item }) => {
          const mapped = CATEGORY_FILTER_MAP[item.id] ?? 'all';
          const active = filter === mapped && mapped !== 'all';
          return (
            <CategoryCard
              cat={item}
              isDark={isDark}
              active={active}
              onPress={() => handleCategoryPress(item.id)}
            />
          );
        }}
      />
      <Text style={[s.sectionTitle, { color: sectionColor, marginTop: 20 }]}>
        {SECTION_TITLES[filter]}
      </Text>
    </View>
  ), [isDark, filter, sectionColor, handleCategoryPress]);

  const headerHeight  = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, HEADER_H] });
  const headerOpacity = headerAnim;
  const chipActiveColor   = isDark ? 'rgba(201,169,107,0.14)' : 'rgba(201,169,107,0.16)';
  const chipInactiveColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(24,18,8,0.07)';
  const chipActiveBorder  = 'rgba(201,169,107,0.40)';
  const chipInactiveBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(24,18,8,0.10)';
  const titleColor        = isDark ? 'rgba(255,255,255,0.95)' : 'rgba(24,18,8,0.95)';
  const serif = Platform.OS === 'ios' ? 'Georgia' : 'serif';

  return (
    <View style={{ flex: 1, backgroundColor: rootBg, paddingTop: insets.top }}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

      {/* Header */}
      <Animated.View style={{ height: headerHeight, opacity: headerOpacity, overflow: 'hidden' }}>
        <View style={s.header}>
          <ProfileAvatar size={36} />
          <Text style={[s.headerTitle, { color: titleColor, fontFamily: serif }]}>Community</Text>
          <TouchableOpacity
            style={[s.composeBtn, { backgroundColor: isDark ? 'rgba(201,169,107,0.14)' : 'rgba(201,169,107,0.16)', borderColor: 'rgba(201,169,107,0.35)' }]}
            onPress={toggleCompose}
            activeOpacity={0.8}
          >
            <Ionicons name={showCompose ? 'close' : 'add'} size={22} color={GOLD} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Search */}
      <PremiumSearchBar
        value={query}
        onChangeText={handleSearch}
        placeholder="Search community…"
        onActiveChange={onSearchActiveChange}
        style={{ marginBottom: 4 }}
      />

      {/* Filter chips */}
      {!isSearching && (
        <View style={s.filterScroll}>
          <FlatList
            data={FEED_FILTERS}
            keyExtractor={f => f.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filterList}
            renderItem={({ item: f }) => {
              const active = filter === f.key;
              return (
                <TouchableOpacity
                  style={[
                    s.chip,
                    { backgroundColor: active ? chipActiveColor : chipInactiveColor,
                      borderColor: active ? chipActiveBorder : chipInactiveBorder },
                  ]}
                  onPress={() => setFilter(f.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.chipText, { color: active ? GOLD : isDark ? 'rgba(255,255,255,0.55)' : 'rgba(24,18,8,0.55)' }]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={GOLD} size="large" />
        </View>
      ) : filter === 'groups' ? (
        <FlatList
          data={groups}
          keyExtractor={g => g.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <Text style={[s.sectionTitle, { color: sectionColor }]}>DISCOVER GROUPS</Text>
          )}
          ListEmptyComponent={<GroupEmptyState />}
          renderItem={({ item }) => (
            <GroupCard group={item} onJoin={() => handleJoinGroup(item.id)} isDark={isDark} />
          )}
        />
      ) : (
        <FlatList
          data={displayedPosts}
          keyExtractor={p => p.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={!isSearching ? ListHeader : undefined}
          ListEmptyComponent={<PostEmptyState />}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
              onReact={(r) => handleReact(item.id, r)}
              onPray={() => handlePray(item.id)}
              isDark={isDark}
            />
          )}
        />
      )}

      {/* Compose dropdown */}
      {showCompose && (
        <Pressable style={s.dropBackdrop} onPress={closeCompose}>
          <Animated.View
            style={[
              s.dropdown,
              isDark ? DARK_GLASS : LIGHT_GLASS,
              {
                opacity: composeAnim,
                transform: [{
                  translateY: composeAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }),
                }],
              },
            ]}
          >
            {POST_OPTIONS.map((opt, idx) => (
              <React.Fragment key={opt.key}>
                {idx > 0 && (
                  <View style={[s.dropDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
                )}
                <TouchableOpacity
                  style={s.dropItem}
                  onPress={() => {
                    closeCompose();
                    navigation.navigate('CreatePost', { type: opt.key as any });
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[s.dropIconWrap, { backgroundColor: opt.color + '18' }]}>
                    <Text style={{ fontSize: 16 }}>{opt.icon}</Text>
                  </View>
                  <Text style={[s.dropLabel, { color: isDark ? 'rgba(255,255,255,0.90)' : 'rgba(24,18,8,0.90)' }]}>
                    {opt.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.28)'} />
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </Animated.View>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, height: HEADER_H, gap: 14,
  },
  headerTitle: { fontSize: 26, fontWeight: '400', letterSpacing: -0.3, flex: 1 },
  composeBtn: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },

  filterScroll: { marginBottom: 8 },
  filterList:   { paddingHorizontal: 18, gap: 8 },
  chip: {
    paddingHorizontal: 15, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.1 },

  list:         { paddingHorizontal: 18, paddingBottom: 130 },
  sectionTitle: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1.4,
    paddingHorizontal: 2, marginBottom: 12,
  },
  catList: { paddingBottom: 4, gap: 10 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },

  emptyState:    { alignItems: 'center', paddingTop: 56, paddingHorizontal: 36, paddingBottom: 40 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  emptySub:   { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 8 },
  emptyHint:  { fontSize: 13, textAlign: 'center' },

  dropBackdrop: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  dropdown: {
    position: 'absolute', top: HEADER_H - 4, right: 20,
    borderRadius: 18, paddingVertical: 6, minWidth: 210,
    zIndex: 101,
  },
  dropItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  dropIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  dropLabel:   { flex: 1, fontSize: 14, fontWeight: '600' },
  dropDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
});
