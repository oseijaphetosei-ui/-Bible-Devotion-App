import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, Animated, TextInput, Pressable, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme';
import { ChatStackParamList } from '../../types/navigation';
import type { Chat, ChatUser } from '../../types/chat';
import {
  getOrCreateProfile, saveProfile, getSavedDisplayName,
  subscribeToChats, markRead, updatePresence,
} from '../../services/chatService';
import { getDeviceId } from '../../services/notesService';
import PremiumSearchBar from '../../components/PremiumSearchBar';
import ProfileAvatar from '../../components/ProfileAvatar';

type Nav = NativeStackNavigationProp<ChatStackParamList>;
type Filter = 'all' | 'unread' | 'favorites' | 'groups';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'unread',    label: 'Unread'    },
  { key: 'favorites', label: 'Favorites' },
  { key: 'groups',    label: 'Groups'    },
];

const FAVORITES_KEY = '@chat_favorites';
const HEADER_H = 56;

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Profile setup modal ───────────────────────────────────────────────────────

function ProfileSetupModal({ onDone }: { onDone: (user: ChatUser) => void }) {
  const t = useTheme();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try { onDone(await saveProfile(name.trim())); }
    finally { setSaving(false); }
  };

  return (
    <View style={[StyleSheet.absoluteFillObject, ps.backdrop]}>
      <View style={[ps.card, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
        <Text style={ps.icon}>💬</Text>
        <Text style={[ps.title, { color: t.text }]}>Set Your Display Name</Text>
        <Text style={[ps.sub, { color: t.textSub }]}>This is how others will see you in chat.</Text>
        <TextInput
          style={[ps.input, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.text }]}
          placeholder="Your name…"
          placeholderTextColor={t.textMuted}
          value={name}
          onChangeText={setName}
          autoFocus
          onSubmitEditing={submit}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[ps.btn, { backgroundColor: t.gold, opacity: name.trim() ? 1 : 0.4 }]}
          onPress={submit}
          disabled={!name.trim() || saving}
          activeOpacity={0.82}
        >
          <Text style={ps.btnText}>{saving ? 'Saving…' : 'Continue'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Avatar ─────────────────────────────────────────────────────────────────────

function Avatar({ name, color, size = 46 }: { name: string; color: string; size?: number }) {
  const letters = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  return (
    <View style={[av.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '2A', borderColor: color + '55' }]}>
      <Text style={[av.text, { color, fontSize: size * 0.36 }]}>{letters || '?'}</Text>
    </View>
  );
}

// ── Chat row ───────────────────────────────────────────────────────────────────

function ChatRow({ chat, userId, onPress }: { chat: Chat; userId: string; onPress: () => void }) {
  const t = useTheme();
  const isGroup = chat.type === 'group';
  const otherId = chat.participantIds.find(id => id !== userId) ?? '';
  const name = isGroup ? (chat.name ?? 'Group') : (chat.participantNames[otherId] ?? 'Unknown');
  const unread = chat.unreadCounts[userId] ?? 0;
  const lastText = chat.lastMessage?.text ?? 'Tap to start chatting';
  const isTyping = chat.typingUserIds.some(id => id !== userId);

  return (
    <TouchableOpacity style={[s.row, { borderBottomColor: t.divider }]} onPress={onPress} activeOpacity={0.72}>
      <View style={s.avatarWrap}>
        <Avatar name={name} color="#C9A96B" />
        {isGroup && (
          <View style={[s.groupBadge, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}>
            <Ionicons name="people" size={9} color={t.gold} />
          </View>
        )}
      </View>

      <View style={s.rowBody}>
        <View style={s.rowTop}>
          <Text style={[s.rowName, { color: t.text, fontWeight: unread > 0 ? '700' : '500' }]} numberOfLines={1}>{name}</Text>
          <Text style={[s.rowTime, { color: t.textMuted }]}>
            {chat.lastMessage ? timeAgo(chat.lastMessage.createdAt) : ''}
          </Text>
        </View>
        <View style={s.rowBottom}>
          {isTyping
            ? <Text style={[s.rowPreview, { color: t.gold, fontStyle: 'italic' }]}>typing…</Text>
            : <Text style={[s.rowPreview, { color: unread > 0 ? t.textSub : t.textMuted }]} numberOfLines={1}>{lastText}</Text>
          }
          {unread > 0 && (
            <View style={[s.badge, { backgroundColor: t.gold }]}>
              <Text style={s.badgeText}>{unread > 99 ? '99+' : unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function ChatListScreen() {
  const navigation = useNavigation<Nav>();
  const t = useTheme();

  const [me, setMe]                     = useState<ChatUser | null>(null);
  const [needsSetup, setNeedsSetup]     = useState(false);
  const [chats, setChats]               = useState<Chat[]>([]);
  const [userId, setUserId]             = useState('');
  const [query, setQuery]               = useState('');
  const [filter, setFilter]             = useState<Filter>('all');
  const [favorites, setFavorites]       = useState<Set<string>>(new Set());
  const [showDropdown, setShowDropdown] = useState(false);

  const headerAnim   = useRef(new Animated.Value(1)).current; // 1 = shown
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const composeScale = useRef(new Animated.Value(1)).current;

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      const id = await getDeviceId();
      setUserId(id);
      const saved = await getSavedDisplayName();
      if (!saved) { setNeedsSetup(true); return; }
      const profile = await getOrCreateProfile();
      setMe(profile);
      // Load favorites
      const raw = await AsyncStorage.getItem(FAVORITES_KEY);
      if (raw) setFavorites(new Set(JSON.parse(raw)));
    })();
  }, []);

  useFocusEffect(useCallback(() => {
    if (!userId) return;
    updatePresence(true);
    const unsub = subscribeToChats(userId, setChats);
    return () => { unsub(); updatePresence(false); };
  }, [userId]));

  // ── Search ────────────────────────────────────────────────────────────────

  const onSearchActiveChange = useCallback((active: boolean) => {
    Animated.timing(headerAnim, {
      toValue: active ? 0 : 1,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [headerAnim]);

  // ── Compose dropdown ──────────────────────────────────────────────────────

  const openDropdown = () => {
    setShowDropdown(true);
    Animated.sequence([
      Animated.timing(composeScale, { toValue: 0.82, duration: 80, useNativeDriver: true }),
      Animated.spring(composeScale, { toValue: 1, tension: 260, friction: 14, useNativeDriver: true }),
    ]).start();
    Animated.spring(dropdownAnim, { toValue: 1, tension: 260, friction: 18, useNativeDriver: true }).start();
  };

  const closeDropdown = () => {
    Animated.timing(dropdownAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setShowDropdown(false));
  };

  const goNewMessage = () => { closeDropdown(); navigation.navigate('NewChat'); };

  // ── Filtering ─────────────────────────────────────────────────────────────

  const displayed = chats.filter(c => {
    // Text search
    if (query.trim()) {
      const isGroup = c.type === 'group';
      const name = isGroup
        ? (c.name ?? '')
        : (c.participantNames[c.participantIds.find(id => id !== userId) ?? ''] ?? '');
      if (!name.toLowerCase().includes(query.toLowerCase())) return false;
    }
    // Filter tab
    if (filter === 'unread')    return (c.unreadCounts[userId] ?? 0) > 0;
    if (filter === 'favorites') return favorites.has(c.id);
    if (filter === 'groups')    return c.type === 'group';
    return true;
  });

  const openChat = (chat: Chat) => {
    markRead(chat.id);
    if (chat.type === 'group') {
      navigation.navigate('GroupChat', { chatId: chat.id, groupName: chat.name ?? 'Group' });
    } else {
      const otherId = chat.participantIds.find(id => id !== userId) ?? '';
      navigation.navigate('DirectMessage', { chatId: chat.id, otherUserId: otherId, otherName: chat.participantNames[otherId] ?? 'Unknown' });
    }
  };

  // Interpolated header height (collapses when search is active)
  const headerHeight = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, HEADER_H] });
  const headerOpacity = headerAnim;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        {/* ── Header (collapses during search) ── */}
        <Animated.View style={{ height: headerHeight, opacity: headerOpacity, overflow: 'hidden' }}>
          <View style={s.header}>
            <ProfileAvatar />
            <Text style={[s.headerTitle, { color: t.text }]}>CHAT</Text>

            {/* Compose button */}
            <Animated.View style={{ transform: [{ scale: composeScale }] }}>
              <TouchableOpacity
                style={[s.composeBtn, { backgroundColor: t.filterInactiveBg, borderColor: t.filterInactiveBorder }]}
                onPress={openDropdown}
                activeOpacity={1}
              >
                <Ionicons name="add" size={22} color={t.gold} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        {/* ── Search ── */}
        <PremiumSearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search chats, people, groups…"
          onActiveChange={onSearchActiveChange}
          style={{ marginBottom: 2 }}
        />

        {/* ── Filter chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filtersRow}
        >
          {FILTERS.map(f => {
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[
                  s.chip,
                  active
                    ? { backgroundColor: t.gold + '22', borderColor: t.gold + '77' }
                    : { backgroundColor: t.filterInactiveBg, borderColor: t.filterInactiveBorder },
                ]}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.72}
              >
                <Text style={[s.chipText, { color: active ? t.gold : t.text }]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Chat list ── */}
        {displayed.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>
              {filter === 'unread' ? '✓' : filter === 'favorites' ? '⭐' : filter === 'groups' ? '👥' : '💬'}
            </Text>
            <Text style={[s.emptyTitle, { color: t.text }]}>
              {filter === 'unread'    ? 'All caught up'
               : filter === 'favorites' ? 'No favorites yet'
               : filter === 'groups'    ? 'No groups yet'
               : 'No conversations yet'}
            </Text>
            <Text style={[s.emptySub, { color: t.textSub }]}>
              {filter === 'all' ? 'Tap   +   to start a new message or group.' : ''}
            </Text>
          </View>
        ) : (
          <FlatList
            data={displayed}
            keyExtractor={c => c.id}
            renderItem={({ item }) => (
              <ChatRow chat={item} userId={userId} onPress={() => openChat(item)} />
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* ── Compose dropdown ── */}
        {showDropdown && (
          <Pressable style={StyleSheet.absoluteFillObject} onPress={closeDropdown}>
            <Animated.View
              style={[
                dd.menu,
                { backgroundColor: t.card, borderColor: t.cardBorder },
                {
                  opacity: dropdownAnim,
                  transform: [{
                    scale: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }),
                  }],
                },
              ]}
            >
              <TouchableOpacity style={dd.item} onPress={goNewMessage} activeOpacity={0.75}>
                <View style={[dd.iconWrap, { backgroundColor: t.goldBg }]}>
                  <Ionicons name="chatbubble-outline" size={15} color={t.gold} />
                </View>
                <Text style={[dd.label, { color: t.text }]}>New Message</Text>
              </TouchableOpacity>
              <View style={[dd.sep, { backgroundColor: t.divider }]} />
              <TouchableOpacity style={dd.item} onPress={goNewMessage} activeOpacity={0.75}>
                <View style={[dd.iconWrap, { backgroundColor: t.goldBg }]}>
                  <Ionicons name="people-outline" size={15} color={t.gold} />
                </View>
                <Text style={[dd.label, { color: t.text }]}>Create Group</Text>
              </TouchableOpacity>
            </Animated.View>
          </Pressable>
        )}

        {/* ── Profile setup ── */}
        {needsSetup && <ProfileSetupModal onDone={u => { setMe(u); setNeedsSetup(false); setUserId(u.id); }} />}
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, height: HEADER_H, gap: 14,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3, flex: 1 },

  composeBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },

  filtersRow: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  chip: {
    height: 34, paddingHorizontal: 16,
    borderRadius: 17, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  chipText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarWrap: { marginRight: 13 },
  groupBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 4 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowName: { fontSize: 15, flex: 1, marginRight: 8 },
  rowTime: { fontSize: 11 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowPreview: { fontSize: 13, flex: 1, marginRight: 8 },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#08071A' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

const dd = StyleSheet.create({
  menu: {
    position: 'absolute', top: 56, right: 16,
    borderRadius: 16, borderWidth: 1,
    minWidth: 200, paddingVertical: 6,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  iconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, fontWeight: '500' },
  sep: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
});

const av = StyleSheet.create({
  wrap: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '700' },
});

const ps = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(8,7,18,0.80)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  card: { width: '86%', borderRadius: 20, borderWidth: 1, padding: 28, alignItems: 'center', gap: 12 },
  icon: { fontSize: 44 },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  sub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  input: { width: '100%', borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginTop: 4 },
  btn: { width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#08071A' },
});
