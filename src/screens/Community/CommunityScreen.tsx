import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar,
  Animated, ActivityIndicator, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

const HEADER_H = 60;

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

// ── Time formatting ────────────────────────────────────────────────────────────

function relativeTime(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// ── Category card ──────────────────────────────────────────────────────────────

const CategoryCard = memo(function CategoryCard({
  cat, cardBg, cardBorder, text, active, onPress,
}: {
  cat: typeof COMMUNITY_CATEGORIES[number];
  cardBg: string; cardBorder: string; text: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        cc.card,
        { backgroundColor: cardBg, borderColor: active ? cat.color + 'BB' : cardBorder },
      ]}
      activeOpacity={0.72}
      onPress={onPress}
    >
      <View style={[cc.iconCircle, { backgroundColor: cat.color + '22', borderColor: cat.color + '44' }]}>
        <Text style={cc.icon}>{cat.icon}</Text>
      </View>
      <Text style={[cc.label, { color: active ? cat.color : text }]} numberOfLines={2}>
        {cat.label}
      </Text>
    </TouchableOpacity>
  );
});

const cc = StyleSheet.create({
  card: {
    width: 90, borderRadius: 14, borderWidth: 1,
    padding: 10, alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  iconCircle: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  icon:  { fontSize: 20 },
  label: { fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 14 },
});

// ── Post card ──────────────────────────────────────────────────────────────────

const PostCard = memo(function PostCard({
  post, onPress, onReact, onPray,
  cardBg, cardBorder, text, textSub, textMuted, gold, goldBg, goldBorder, divider,
}: {
  post: Post;
  onPress: () => void;
  onReact: (reaction: string) => void;
  onPray: () => void;
  cardBg: string; cardBorder: string; text: string; textSub: string;
  textMuted: string; gold: string; goldBg: string; goldBorder: string; divider: string;
}) {
  const [showReactions, setShowReactions] = useState(false);
  const meta = POST_TYPE_META[post.type];
  const totalReactions = Object.values(post.reactions).reduce((a, b) => a + b, 0);

  return (
    <TouchableOpacity
      style={[pc.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Author row */}
      <View style={pc.authorRow}>
        <View style={[pc.avatar, { backgroundColor: post.authorColor + '33', borderColor: post.authorColor + '66' }]}>
          <Text style={[pc.avatarLetter, { color: post.authorColor }]}>
            {post.authorName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={pc.authorInfo}>
          <Text style={[pc.authorName, { color: text }]}>{post.authorName}</Text>
          <Text style={[pc.timeText, { color: textMuted }]}>{relativeTime(post.createdAt)}</Text>
        </View>
        {meta.label ? (
          <View style={[pc.typeBadge, { backgroundColor: meta.color + '22', borderColor: meta.color + '55' }]}>
            <Text style={pc.typeBadgeIcon}>{meta.icon}</Text>
            <Text style={[pc.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        ) : null}
      </View>

      {/* Scripture ref */}
      {post.scriptureRef ? (
        <View style={[pc.scriptureRef, { backgroundColor: goldBg, borderColor: goldBorder }]}>
          <Text style={pc.scriptureIcon}>📖</Text>
          <Text style={[pc.scriptureText, { color: gold }]}>{post.scriptureRef}</Text>
        </View>
      ) : null}

      {/* Content */}
      <Text style={[pc.content, { color: textSub }]} numberOfLines={4}>{post.content}</Text>

      {/* Prayer answered */}
      {post.answered ? (
        <View style={[pc.answeredBadge, { backgroundColor: '#7BA87B22', borderColor: '#7BA87B55' }]}>
          <Text style={{ color: '#7BA87B', fontSize: 12, fontWeight: '700' }}>✓ Prayer Answered!</Text>
        </View>
      ) : null}

      <View style={[pc.divider, { backgroundColor: divider }]} />

      {/* Action bar */}
      <View style={pc.actions}>
        <TouchableOpacity
          style={[pc.actionBtn, post.userReaction && { backgroundColor: goldBg }]}
          onPress={() => setShowReactions(v => !v)}
          activeOpacity={0.7}
        >
          <Text style={pc.actionEmoji}>
            {post.userReaction ? REACTION_META[post.userReaction].emoji : '❤️'}
          </Text>
          {totalReactions > 0 && (
            <Text style={[pc.actionCount, { color: post.userReaction ? gold : textMuted }]}>
              {totalReactions}
            </Text>
          )}
        </TouchableOpacity>

        {post.type === 'prayer' && (
          <TouchableOpacity
            style={[pc.actionBtn, post.userPraying && { backgroundColor: '#7BA8C822' }]}
            onPress={onPray}
            activeOpacity={0.7}
          >
            <Text style={pc.actionEmoji}>🙏</Text>
            {post.prayerCount > 0 && (
              <Text style={[pc.actionCount, { color: post.userPraying ? '#7BA8C8' : textMuted }]}>
                {post.prayerCount}
              </Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={pc.actionBtn} onPress={onPress} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={16} color={textMuted} />
          {post.commentCount > 0 && (
            <Text style={[pc.actionCount, { color: textMuted }]}>{post.commentCount}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Reaction picker */}
      {showReactions && (
        <View style={[pc.reactionRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {REACTIONS.map(([key, r]) => (
            <TouchableOpacity
              key={key}
              style={[pc.reactionBtn, post.userReaction === key && { backgroundColor: goldBg }]}
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
  card: {
    borderRadius: 16, borderWidth: 1,
    padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 15, fontWeight: '700' },
  authorInfo:  { flex: 1 },
  authorName:  { fontSize: 14, fontWeight: '700' },
  timeText:    { fontSize: 11, marginTop: 1 },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  typeBadgeIcon: { fontSize: 11 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  scriptureRef: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10,
  },
  scriptureIcon: { fontSize: 12 },
  scriptureText: { fontSize: 12, fontWeight: '700' },
  content:      { fontSize: 14, lineHeight: 22 },
  answeredBadge: {
    marginTop: 8, borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start',
  },
  divider:     { height: 1, marginVertical: 12 },
  actions:     { flexDirection: 'row', gap: 6 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  actionEmoji:  { fontSize: 15 },
  actionCount:  { fontSize: 12, fontWeight: '600' },
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
  group, onJoin, cardBg, cardBorder, text, textSub, textMuted, gold, goldBg, goldBorder,
}: {
  group: Group; onJoin: () => void;
  cardBg: string; cardBorder: string; text: string; textSub: string;
  textMuted: string; gold: string; goldBg: string; goldBorder: string;
}) {
  return (
    <View style={[gc.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={[gc.iconWrap, { backgroundColor: gold + '18' }]}>
        <Text style={gc.icon}>{group.icon}</Text>
      </View>
      <View style={gc.info}>
        <Text style={[gc.name, { color: text }]}>{group.name}</Text>
        <Text style={[gc.desc, { color: textSub }]} numberOfLines={1}>{group.description}</Text>
        <Text style={[gc.count, { color: textMuted }]}>{group.memberCount.toLocaleString()} members</Text>
      </View>
      <TouchableOpacity
        style={[
          gc.joinBtn,
          group.joined
            ? { backgroundColor: 'transparent', borderColor: cardBorder }
            : { backgroundColor: goldBg, borderColor: goldBorder },
        ]}
        onPress={onJoin}
        activeOpacity={group.joined ? 1 : 0.78}
        disabled={group.joined}
      >
        <Text style={[gc.joinText, { color: group.joined ? textMuted : gold }]}>
          {group.joined ? 'Joined ✓' : 'Join'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const gc = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1,
    padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  icon:  { fontSize: 22 },
  info:  { flex: 1 },
  name:  { fontSize: 14, fontWeight: '700' },
  desc:  { fontSize: 12, marginTop: 2 },
  count: { fontSize: 11, marginTop: 2 },
  joinBtn: {
    borderWidth: 1, borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  joinText: { fontSize: 12, fontWeight: '700' },
});

// ── Compose options ────────────────────────────────────────────────────────────

const POST_OPTIONS: { key: string; label: string; icon: string }[] = [
  { key: 'post',      label: 'Share a Thought',     icon: '💬' },
  { key: 'testimony', label: 'Share Testimony',      icon: '✨' },
  { key: 'prayer',    label: 'Prayer Request',       icon: '🙏' },
  { key: 'question',  label: 'Ask a Question',       icon: '❓' },
  { key: 'scripture', label: 'Scripture Discussion', icon: '📖' },
];

// ── Main screen ───────────────────────────────────────────────────────────────

export default function CommunityScreen() {
  const t          = useTheme();
  const navigation = useNavigation<NavProp>();

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
    const icons: Partial<Record<FeedFilter, string>> = {
      prayer: '🙏', testimony: '✨', question: '❓', bible: '📖',
    };
    const emoji = isSearching ? '🔍' : (icons[filter] ?? '🌿');
    const title = isSearching ? 'No results found' : 'Be the first to share';
    const sub   = isSearching
      ? `Nothing matched "${query}". Try different words.`
      : 'Share a prayer, testimony, or thought with the community.';
    return (
      <View style={s.emptyState}>
        <View style={[s.emptyIconWrap, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}>
          <Text style={s.emptyEmoji}>{emoji}</Text>
        </View>
        <Text style={[s.emptyTitle, { color: t.text }]}>{title}</Text>
        <Text style={[s.emptySub, { color: t.textSub }]}>{sub}</Text>
        {!isSearching && (
          <Text style={[s.emptyHint, { color: t.textMuted }]}>Tap + to start a conversation</Text>
        )}
      </View>
    );
  }, [t, filter, isSearching, query, toggleCompose]);

  const GroupEmptyState = useCallback(() => (
    <View style={s.emptyState}>
      <View style={[s.emptyIconWrap, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}>
        <Text style={s.emptyEmoji}>👥</Text>
      </View>
      <Text style={[s.emptyTitle, { color: t.text }]}>No groups yet</Text>
      <Text style={[s.emptySub, { color: t.textSub }]}>
        Groups are coming soon. Check back to find communities to join.
      </Text>
    </View>
  ), [t]);

  // ── List header (category grid + section title) ────────────────────────────

  const ListHeader = useCallback(() => (
    <View>
      <Text style={[s.sectionTitle, { color: t.textMuted }]}>EXPLORE TOPICS</Text>
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
              cardBg={t.card}
              cardBorder={t.cardBorder}
              text={t.text}
              active={active}
              onPress={() => handleCategoryPress(item.id)}
            />
          );
        }}
      />
      <Text style={[s.sectionTitle, { color: t.textMuted, marginTop: 20 }]}>
        {SECTION_TITLES[filter]}
      </Text>
    </View>
  ), [t, filter, handleCategoryPress]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        {/* Header */}
        <Animated.View
          style={{
            height: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, HEADER_H] }),
            opacity: headerAnim,
            overflow: 'hidden',
          }}
        >
          <View style={s.header}>
            <ProfileAvatar />
            <Text style={[s.headerTitle, { color: t.text }]}>COMMUNITY</Text>
            <TouchableOpacity
              style={[s.composeBtn, { backgroundColor: t.filterInactiveBg, borderColor: t.filterInactiveBorder }]}
              onPress={toggleCompose}
              activeOpacity={0.8}
            >
              <Ionicons name={showCompose ? 'close' : 'add'} size={22} color={t.gold} />
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
                      { backgroundColor: t.filterInactiveBg, borderColor: t.filterInactiveBorder },
                      active && { backgroundColor: t.goldBg, borderColor: t.goldBorder },
                    ]}
                    onPress={() => setFilter(f.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.chipText, { color: t.textMuted }, active && { color: t.gold }]}>
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
            <ActivityIndicator color={t.gold} size="large" />
          </View>
        ) : filter === 'groups' ? (
          <FlatList
            data={groups}
            keyExtractor={g => g.id}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={() => (
              <Text style={[s.sectionTitle, { color: t.textMuted }]}>DISCOVER GROUPS</Text>
            )}
            ListEmptyComponent={<GroupEmptyState />}
            renderItem={({ item }) => (
              <GroupCard
                group={item}
                onJoin={() => handleJoinGroup(item.id)}
                cardBg={t.card}
                cardBorder={t.cardBorder}
                text={t.text}
                textSub={t.textSub}
                textMuted={t.textMuted}
                gold={t.gold}
                goldBg={t.goldBg}
                goldBorder={t.goldBorder}
              />
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
                cardBg={t.card}
                cardBorder={t.cardBorder}
                text={t.text}
                textSub={t.textSub}
                textMuted={t.textMuted}
                gold={t.gold}
                goldBg={t.goldBg}
                goldBorder={t.goldBorder}
                divider={t.divider}
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
                { backgroundColor: t.card, borderColor: t.cardBorder },
                {
                  opacity: composeAnim,
                  transform: [{
                    translateY: composeAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }),
                  }],
                },
              ]}
            >
              {POST_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={s.dropItem}
                  onPress={() => {
                    closeCompose();
                    navigation.navigate('CreatePost', { type: opt.key as any });
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={s.dropIcon}>{opt.icon}</Text>
                  <Text style={[s.dropLabel, { color: t.text }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </Pressable>
        )}
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 10, gap: 14,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3, flex: 1 },
  composeBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },

  filterScroll: { marginBottom: 8 },
  filterList:   { paddingHorizontal: 18, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '600' },

  list:         { paddingHorizontal: 18, paddingBottom: 120 },
  sectionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, paddingHorizontal: 2, marginBottom: 12 },
  catList:      { paddingBottom: 4, gap: 10 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },

  // ── Empty states ──────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center', paddingTop: 56,
    paddingHorizontal: 36, paddingBottom: 40,
  },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyEmoji:   { fontSize: 30 },
  emptyTitle:   { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  emptySub:  { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 8 },
  emptyHint: { fontSize: 13, textAlign: 'center' },

  // ── Compose dropdown ──────────────────────────────────────────────────────
  dropBackdrop: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  dropdown: {
    position: 'absolute', top: HEADER_H - 8, right: 20,
    borderRadius: 14, borderWidth: 1, paddingVertical: 6, minWidth: 200,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 10, zIndex: 101,
  },
  dropItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  dropIcon:  { fontSize: 18 },
  dropLabel: { fontSize: 14, fontWeight: '600' },
});
