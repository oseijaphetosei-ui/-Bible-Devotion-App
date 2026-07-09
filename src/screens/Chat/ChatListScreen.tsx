import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, Animated, TextInput, Pressable, ScrollView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme';
import type { Chat, ChatUser } from '../../types/chat';
import {
  getOrCreateProfile, saveProfile, getSavedDisplayName,
  subscribeToChats, markRead, updatePresence,
} from '../../services/chatService';
import { getDeviceId } from '../../services/notesService';
import PremiumSearchBar from '../../components/PremiumSearchBar';
import ProfileAvatar from '../../components/ProfileAvatar';

type Filter = 'all' | 'unread' | 'favorites' | 'groups';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'unread',    label: 'Unread'    },
  { key: 'favorites', label: 'Favorites' },
  { key: 'groups',    label: 'Groups'    },
];

const GOLD         = '#C9A96B';
const FAVORITES_KEY = '@chat_favorites';
const HEADER_H      = 58;
const SERIF         = Platform.OS === 'ios' ? 'Georgia' : 'serif';

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
  const isDark = t.statusBar === 'light-content';
  const [name,   setName]   = useState('');
  const [saving, setSaving] = useState(false);

  const textColor  = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const subColor   = isDark ? 'rgba(255,255,255,0.60)' : 'rgba(24,18,8,0.60)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';

  const submit = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try { onDone(await saveProfile(name.trim())); }
    finally { setSaving(false); }
  };

  return (
    <View style={[StyleSheet.absoluteFillObject, ps.backdrop]}>
      <View style={[ps.card, {
        backgroundColor: isDark ? 'rgba(19,22,38,0.96)' : 'rgba(237,231,217,0.96)',
        borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.80)',
      }]}>
        <View style={[ps.iconWrap, { backgroundColor: 'rgba(201,169,107,0.14)' }]}>
          <Ionicons name="chatbubbles-outline" size={32} color={GOLD} />
        </View>
        <Text style={[ps.title, { color: textColor, fontFamily: SERIF }]}>Set Your Display Name</Text>
        <Text style={[ps.sub, { color: subColor }]}>This is how others will see you in chat.</Text>
        <TextInput
          style={[ps.input, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)',
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.80)',
            color: textColor,
          }]}
          placeholder="Your name…"
          placeholderTextColor={mutedColor}
          value={name}
          onChangeText={setName}
          autoFocus
          onSubmitEditing={submit}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[ps.btn, { backgroundColor: GOLD, opacity: name.trim() ? 1 : 0.4 }]}
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

function ChatAvatar({ name, size = 46, isDark }: { name: string; size?: number; isDark: boolean }) {
  const letters = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const bgColor   = `hsla(${hue}, 42%, 52%, 0.22)`;
  const textColor = `hsla(${hue}, 55%, 68%, 1)`;
  const border    = `hsla(${hue}, 42%, 52%, 0.40)`;
  return (
    <View style={[av.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor, borderColor: border }]}>
      <Text style={[av.text, { color: textColor, fontSize: size * 0.34 }]}>{letters || '?'}</Text>
    </View>
  );
}

// ── Chat row ───────────────────────────────────────────────────────────────────

function ChatRow({ chat, userId, isDark, onPress }: { chat: Chat; userId: string; isDark: boolean; onPress: () => void }) {
  const isGroup  = chat.type === 'group';
  const otherId  = chat.participantIds.find(id => id !== userId) ?? '';
  const name     = isGroup ? (chat.name ?? 'Group') : (chat.participantNames[otherId] ?? 'Unknown');
  const unread   = chat.unreadCounts[userId] ?? 0;
  const lastText = chat.lastMessage?.text ?? 'Tap to start chatting';
  const isTyping = chat.typingUserIds.some(id => id !== userId);

  const textColor  = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const subColor   = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(24,18,8,0.55)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.32)' : 'rgba(24,18,8,0.32)';
  const divider   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(24,18,8,0.06)';

  return (
    <TouchableOpacity style={[s.row, { borderBottomColor: divider }]} onPress={onPress} activeOpacity={0.72}>
      <View style={s.avatarWrap}>
        <ChatAvatar name={name} isDark={isDark} />
        {isGroup && (
          <View style={[s.groupBadge, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)',
            borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.10)',
          }]}>
            <Ionicons name="people" size={9} color={isDark ? 'rgba(255,255,255,0.60)' : 'rgba(24,18,8,0.60)'} />
          </View>
        )}
      </View>

      <View style={s.rowBody}>
        <View style={s.rowTop}>
          <Text
            style={[s.rowName, { color: textColor, fontWeight: unread > 0 ? '700' : '500' }]}
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text style={[s.rowTime, { color: mutedColor }]}>
            {chat.lastMessage ? timeAgo(chat.lastMessage.createdAt) : ''}
          </Text>
        </View>
        <View style={s.rowBottom}>
          {isTyping
            ? <Text style={[s.rowPreview, { color: GOLD, fontStyle: 'italic' }]}>typing…</Text>
            : <Text
                style={[s.rowPreview, { color: unread > 0 ? subColor : mutedColor, fontWeight: unread > 0 ? '500' : '400' }]}
                numberOfLines={1}
              >
                {lastText}
              </Text>
          }
          {unread > 0 && (
            <View style={[s.badge, { backgroundColor: GOLD }]}>
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
  const navigation = useNavigation<any>();
  const t          = useTheme();
  const insets     = useSafeAreaInsets();
  const isDark     = t.statusBar === 'light-content';
  const rootBg     = isDark ? '#060810' : '#DDD5C4';

  const textColor  = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';

  const [me,           setMe]           = useState<ChatUser | null>(null);
  const [needsSetup,   setNeedsSetup]   = useState(false);
  const [chats,        setChats]        = useState<Chat[]>([]);
  const [userId,       setUserId]       = useState('');
  const [query,        setQuery]        = useState('');
  const [filter,       setFilter]       = useState<Filter>('all');
  const [favorites,    setFavorites]    = useState<Set<string>>(new Set());
  const [showDropdown, setShowDropdown] = useState(false);

  const headerAnim   = useRef(new Animated.Value(1)).current;
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const composeScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const id = await getDeviceId();
      setUserId(id);
      const saved = await getSavedDisplayName();
      if (!saved) { setNeedsSetup(true); return; }
      const profile = await getOrCreateProfile();
      setMe(profile);
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

  const onSearchActiveChange = useCallback((active: boolean) => {
    Animated.timing(headerAnim, { toValue: active ? 0 : 1, duration: 220, useNativeDriver: false }).start();
  }, [headerAnim]);

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

  const displayed = chats.filter(c => {
    if (query.trim()) {
      const isGroup = c.type === 'group';
      const name = isGroup
        ? (c.name ?? '')
        : (c.participantNames[c.participantIds.find(id => id !== userId) ?? ''] ?? '');
      if (!name.toLowerCase().includes(query.toLowerCase())) return false;
    }
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

  const headerHeight  = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, HEADER_H] });
  const headerOpacity = headerAnim;

  const chipActiveColor   = isDark ? 'rgba(201,169,107,0.14)' : 'rgba(201,169,107,0.16)';
  const chipInactiveColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(24,18,8,0.06)';
  const chipActiveBorder  = 'rgba(201,169,107,0.38)';
  const chipInactiveBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(24,18,8,0.10)';

  return (
    <View style={{ flex: 1, backgroundColor: rootBg, paddingTop: insets.top }}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

      {/* Header */}
      <Animated.View style={{ height: headerHeight, opacity: headerOpacity, overflow: 'hidden' }}>
        <View style={s.header}>
          <ProfileAvatar size={36} />
          <Text style={[s.headerTitle, { color: textColor, fontFamily: SERIF }]}>Chats</Text>

          <Animated.View style={{ transform: [{ scale: composeScale }] }}>
            <TouchableOpacity
              style={[s.composeBtn, {
                backgroundColor: isDark ? 'rgba(201,169,107,0.14)' : 'rgba(201,169,107,0.16)',
                borderColor: 'rgba(201,169,107,0.35)',
              }]}
              onPress={openDropdown}
              activeOpacity={1}
            >
              <Ionicons name="add" size={22} color={GOLD} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Search */}
      <PremiumSearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search chats, people, groups…"
        onActiveChange={onSearchActiveChange}
        style={{ marginBottom: 2 }}
      />

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={s.filtersRow}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
      >
        {FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[
                s.chip,
                active
                  ? { backgroundColor: chipActiveColor, borderColor: chipActiveBorder }
                  : { backgroundColor: chipInactiveColor, borderColor: chipInactiveBorder },
              ]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.72}
            >
              <Text style={[s.chipText, { color: active ? GOLD : isDark ? 'rgba(255,255,255,0.55)' : 'rgba(24,18,8,0.55)' }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Chat list */}
      <FlatList
        data={displayed}
        keyExtractor={c => c.id}
        renderItem={({ item }) => (
          <ChatRow chat={item} userId={userId} isDark={isDark} onPress={() => openChat(item)} />
        )}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustContentInsets={false}
        automaticallyAdjustKeyboardInsets={false}
        contentInsetAdjustmentBehavior="never"
        contentInset={{ top: 0, left: 0, bottom: 0, right: 0 }}
        scrollIndicatorInsets={{ top: 0, left: 0, bottom: 0, right: 0 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={[s.emptyIconWrap, { backgroundColor: 'rgba(201,169,107,0.10)', borderColor: 'rgba(201,169,107,0.25)' }]}>
              <Text style={s.emptyIcon}>
                {filter === 'unread' ? '✓' : filter === 'favorites' ? '⭐' : filter === 'groups' ? '👥' : '💬'}
              </Text>
            </View>
            <Text style={[s.emptyTitle, { color: textColor, fontFamily: SERIF }]}>
              {filter === 'unread'    ? 'All caught up'
               : filter === 'favorites' ? 'No favorites yet'
               : filter === 'groups'    ? 'No groups yet'
               : 'No conversations yet'}
            </Text>
            <Text style={[s.emptySub, { color: mutedColor }]}>
              {filter === 'all' ? 'Tap + to start a new message or group.' : ''}
            </Text>
          </View>
        }
      />

      {/* Compose dropdown */}
      {showDropdown && (
        <Pressable style={StyleSheet.absoluteFillObject} onPress={closeDropdown}>
          <Animated.View
            style={[
              dd.menu,
              isDark
                ? { backgroundColor: 'rgba(19,22,38,0.96)', borderColor: 'rgba(255,255,255,0.10)' }
                : { backgroundColor: 'rgba(237,231,217,0.96)', borderColor: 'rgba(255,255,255,0.80)' },
              {
                opacity: dropdownAnim,
                transform: [{
                  scale: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0.90, 1] }),
                }],
                shadowColor: isDark ? '#000' : 'rgba(47,42,36,0.14)',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: isDark ? 0.30 : 1,
                shadowRadius: 20,
                elevation: 12,
              },
            ]}
          >
            <TouchableOpacity style={dd.item} onPress={goNewMessage} activeOpacity={0.75}>
              <View style={[dd.iconWrap, { backgroundColor: 'rgba(201,169,107,0.14)' }]}>
                <Ionicons name="chatbubble-outline" size={15} color={GOLD} />
              </View>
              <Text style={[dd.label, { color: textColor }]}>New Message</Text>
            </TouchableOpacity>
            <View style={[dd.sep, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }]} />
            <TouchableOpacity style={dd.item} onPress={goNewMessage} activeOpacity={0.75}>
              <View style={[dd.iconWrap, { backgroundColor: 'rgba(201,169,107,0.14)' }]}>
                <Ionicons name="people-outline" size={15} color={GOLD} />
              </View>
              <Text style={[dd.label, { color: textColor }]}>Create Group</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      )}

      {/* Profile setup */}
      {needsSetup && <ProfileSetupModal onDone={u => { setMe(u); setNeedsSetup(false); setUserId(u.id); }} />}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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

  filtersRow: { paddingHorizontal: 16, paddingVertical: 6, gap: 8 },
  chip: {
    height: 34, paddingHorizontal: 16,
    borderRadius: 17, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  chipText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.1 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarWrap: { marginRight: 13 },
  groupBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  rowBody:   { flex: 1, gap: 4 },
  rowTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowName:   { fontSize: 15, flex: 1, marginRight: 8 },
  rowTime:   { fontSize: 11 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowPreview: { fontSize: 13, flex: 1, marginRight: 8 },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#08071A' },

  empty: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40, paddingTop: 80 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyIcon:  { fontSize: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '400' },
  emptySub:   { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

const dd = StyleSheet.create({
  menu: {
    position: 'absolute', top: HEADER_H + 2, right: 16,
    borderRadius: 18, borderWidth: 1,
    minWidth: 210, paddingVertical: 6,
  },
  item:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  iconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label:   { fontSize: 15, fontWeight: '500' },
  sep:     { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
});

const av = StyleSheet.create({
  wrap: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '700' },
});

const ps = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(6,8,16,0.82)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  card: {
    width: '86%', borderRadius: 22, borderWidth: 1,
    padding: 28, alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.20, shadowRadius: 24, elevation: 16,
  },
  iconWrap: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '400', textAlign: 'center', letterSpacing: -0.3 },
  sub:   { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  input: {
    width: '100%', borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, marginTop: 4,
  },
  btn:     { width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#08071A' },
});
