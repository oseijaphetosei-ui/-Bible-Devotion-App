import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme, AppTheme } from '../../theme';
import { ChatMessage, REACTIONS } from '../../types/chat';
import {
  deleteMessage,
  getSavedDisplayName,
  markRead,
  sendMessage,
  setTyping,
  subscribeToMessages,
  subscribeToTyping,
  toggleReaction,
} from '../../services/chatService';
import { getDeviceId } from '../../services/notesService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dayLabel(ts: number): string {
  const today = startOfDay(Date.now());
  const day = startOfDay(ts);
  if (day === today) return 'Today';
  if (day === today - 24 * 60 * 60 * 1000) return 'Yesterday';
  const d = new Date(ts);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

function timeLabel(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ─── List item model ─────────────────────────────────────────────────────────

type ListItem =
  | { kind: 'msg'; key: string; msg: ChatMessage }
  | { kind: 'sep'; key: string; label: string };

/**
 * Build list data for a non-inverted FlatList (oldest → newest, top → bottom).
 * messages must be sorted ascending (oldest first).
 * A day separator is inserted before the first message of each new day.
 */
function buildList(messages: ChatMessage[]): ListItem[] {
  const out: ListItem[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const prev = messages[i - 1];
    const isNewDay = !prev || startOfDay(prev.createdAt) !== startOfDay(m.createdAt);
    if (isNewDay) {
      out.push({ kind: 'sep', key: `sep_${startOfDay(m.createdAt)}`, label: dayLabel(m.createdAt) });
    }
    out.push({ kind: 'msg', key: m.id, msg: m });
  }
  return out;
}

// ─── Typing dots ─────────────────────────────────────────────────────────────

const TypingDots = React.memo(function TypingDots({ color }: { color: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const dots = [0, 1, 2].map(i => {
    const opacity = anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: i === 0 ? [1, 0.3, 1] : i === 1 ? [0.3, 1, 0.3] : [0.6, 0.3, 1],
    });
    return (
      <Animated.View
        key={i}
        style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          marginLeft: 3,
          backgroundColor: color,
          opacity,
        }}
      />
    );
  });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ color, fontSize: 12 }}>typing</Text>
      {dots}
    </View>
  );
});

// ─── Message bubble ──────────────────────────────────────────────────────────

const OUTGOING_TEXT = '#08071A';
const READ_TICK_BLUE = '#34B7F1';
const SENT_TICK_COLOR = 'rgba(8,7,26,0.55)';

type BubbleProps = {
  msg: ChatMessage;
  mine: boolean;
  t: AppTheme;
  onLongPress: (msg: ChatMessage) => void;
};

const Bubble = React.memo(function Bubble({ msg, mine, t, onLongPress }: BubbleProps) {
  const deleted = !!msg.deletedAt;
  const pending = msg.id.startsWith('pending_');
  const readByOthers = (msg.readBy?.length ?? 0) > 1;

  const activeReactions = (msg.reactions ?? []).filter(r => r.userIds.length > 0);

  const metaColor = mine ? 'rgba(8,7,26,0.50)' : t.textMuted;
  const tickChar  = pending ? '○' : readByOthers ? '✓✓' : '✓';
  const tickColor = readByOthers ? READ_TICK_BLUE : SENT_TICK_COLOR;

  return (
    <View style={[styles.bubbleRow, mine ? styles.rowRight : styles.rowLeft]}>
      <Pressable
        onLongPress={() => { if (!deleted) onLongPress(msg); }}
        delayLongPress={300}
        style={[
          styles.bubble,
          mine
            ? { backgroundColor: t.gold, borderBottomRightRadius: 4 }
            : {
                backgroundColor: t.card,
                borderBottomLeftRadius: 4,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: t.divider,
              },
        ]}
      >
        {!deleted && !!msg.replyToText && (
          <View
            style={[
              styles.replyQuote,
              {
                backgroundColor: mine ? 'rgba(8,7,26,0.10)' : t.goldBg,
                borderLeftColor: mine ? OUTGOING_TEXT : t.gold,
              },
            ]}
          >
            <Text numberOfLines={2} style={{ fontSize: 12, color: mine ? 'rgba(8,7,26,0.75)' : t.textSub }}>
              {msg.replyToText}
            </Text>
          </View>
        )}

        {/*
          Nested inline Text: timestamp + ticks sit at the end of the last word.
          Short message → all on one line.
          Long message  → timestamp wraps naturally onto its own line at the right.
          Two non-breaking spaces before the meta create a visual gap without a
          separate View, so React Native's text layout handles everything.
        */}
        {deleted ? (
          <Text style={{ fontStyle: 'italic', fontSize: 14, color: mine ? 'rgba(8,7,26,0.55)' : t.textMuted }}>
            {'This message was deleted  '}
            <Text style={{ fontStyle: 'normal', fontSize: 11, color: metaColor }}>
              {timeLabel(msg.createdAt)}
            </Text>
          </Text>
        ) : (
          <Text style={{ fontSize: 15, lineHeight: 22, color: mine ? OUTGOING_TEXT : t.text }}>
            {msg.text}
            {'  '}
            <Text style={{ fontSize: 11, color: metaColor }}>
              {timeLabel(msg.createdAt)}
              {mine ? ' ' : ''}
            </Text>
            {mine && (
              <Text style={{ fontSize: 12, color: tickColor }}>{tickChar}</Text>
            )}
          </Text>
        )}
      </Pressable>

      {!deleted && activeReactions.length > 0 && (
        <View
          style={[
            styles.reactionsPill,
            {
              backgroundColor: t.card,
              borderColor: t.divider,
              alignSelf: mine ? 'flex-end' : 'flex-start',
            },
          ]}
        >
          {activeReactions.map(r => (
            <Text key={r.emoji} style={{ fontSize: 12 }}>
              {r.emoji}
              {r.userIds.length > 1 ? ` ${r.userIds.length}` : ''}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
});

// ─── Emoji panel data ────────────────────────────────────────────────────────

const EMOJI_PANEL = [
  '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍',
  '🥰','😘','😗','😋','😛','😝','😜','🤩','🥳','😏','😒','😞','😔','😢','😭',
  '😤','😠','😡','🤯','😳','😱','😨','😰','🤔','🤗','🤭','🤫','🙄','😶','😬',
  '🥱','😴','🤢','🤮','🤧','😷','🥴','😵',
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','💕','💞','💓','💗','💖','💘',
  '👍','👎','👌','✌️','🤞','🤟','🤘','🤙','👏','🙌','🙏','👋','✋','💪','🤝',
  '🎉','🎊','🎈','🎁','🎂','🏆','🥇','🎯','🔥','✨','⭐','🌟','💫','💥','🌈',
  '☀️','🌙','⚡','❄️','🌊','🌸','🍀','🦋','🐶','🐱','🐻','🦁','🐸','🐧','🦊',
  '🍕','🍔','🍟','🌮','🍜','🍣','🍩','🍪','🎂','🍫','☕','🧃','🍺','🥂','🍾',
  '💯','✅','❌','❓','❗','💬','🔔','📱','💻','🎵','🎶','📚','💡','🔑','🎮',
];

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function DirectMessageScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const chatId: string = route.params?.chatId ?? '';
  const otherName: string = route.params?.otherName ?? route.params?.groupName ?? 'Chat';
  const otherUserId: string = route.params?.otherUserId ?? '';

  // messages stored in ascending order (oldest first = top of screen)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [myId, setMyId] = useState('');
  const [myName, setMyName] = useState('Someone');
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; text: string } | null>(null);
  const [actionMsg, setActionMsg] = useState<ChatMessage | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);

  const listRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const searchInputRef = useRef<TextInput>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track whether the user is scrolled near the bottom so we only auto-scroll
  // when they're already at the bottom (don't yank them away from history).
  const isNearBottom = useRef(true);

  // Identity.
  useEffect(() => {
    let alive = true;
    getDeviceId().then(id => { if (alive) setMyId(id); }).catch(() => {});
    getSavedDisplayName().then(name => { if (alive && name) setMyName(name); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // Open search mode if navigated here with openSearch: true.
  useEffect(() => {
    if (route.params?.openSearch) {
      setIsSearching(true);
      setTimeout(() => searchInputRef.current?.focus(), 300);
    }
  }, []);

  const openSearch = useCallback(() => {
    setIsSearching(true);
    setSearchQuery('');
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearching(false);
    setSearchQuery('');
  }, []);

  const toggleEmojiPanel = useCallback(() => {
    setShowEmojiPanel(prev => {
      if (!prev) inputRef.current?.blur();
      else setTimeout(() => inputRef.current?.focus(), 50);
      return !prev;
    });
  }, []);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setInput(prev => prev + emoji);
  }, []);

  // Messages subscription — store ascending (oldest first) for natural top→bottom display.
  useEffect(() => {
    if (!chatId) { setLoading(false); return; }
    const unsub = subscribeToMessages(chatId, incomingDesc => {
      // incomingDesc is newest-first; reverse to ascending for display
      const incomingAsc = [...incomingDesc].reverse();
      setMessages(prev => {
        const latestServerTs = incomingDesc[0]?.createdAt ?? 0;
        // Keep any optimistic messages that are newer than the latest server snapshot
        const stillPending = prev.filter(
          m => m.id.startsWith('pending_') && m.createdAt > latestServerTs,
        );
        return [...incomingAsc, ...stillPending];
      });
      setLoading(false);
      markRead(chatId).catch(() => {});
    });
    return unsub;
  }, [chatId]);

  // Typing subscription (needs myId to exclude self).
  useEffect(() => {
    if (!chatId || !myId) return;
    return subscribeToTyping(chatId, myId, setIsTyping);
  }, [chatId, myId]);

  // Clear my typing flag on unmount.
  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (chatId) setTyping(chatId, false).catch(() => {});
    };
  }, [chatId]);

  // Auto-scroll to bottom on initial load and when new messages arrive (if near bottom).
  const scrollToBottom = useCallback((animated: boolean) => {
    listRef.current?.scrollToEnd({ animated });
  }, []);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      isNearBottom.current =
        contentOffset.y >= contentSize.height - layoutMeasurement.height - 120;
    },
    [],
  );

  const handleContentSizeChange = useCallback(() => {
    if (isNearBottom.current) scrollToBottom(true);
  }, [scrollToBottom]);

  const handleLayout = useCallback(() => {
    scrollToBottom(false);
  }, [scrollToBottom]);

  const handleChangeText = useCallback(
    (text: string) => {
      setInput(text);
      if (!chatId) return;
      setTyping(chatId, true).catch(() => {});
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        setTyping(chatId, false).catch(() => {});
      }, 3000);
    },
    [chatId],
  );

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !chatId) return;

    if (typingTimer.current) { clearTimeout(typingTimer.current); typingTimer.current = null; }
    setTyping(chatId, false).catch(() => {});

    const reply = replyTo;
    const tempId = `pending_${Date.now()}`;
    const temp: ChatMessage = {
      id: tempId, chatId,
      senderId: myId, senderName: myName,
      type: 'text', text,
      reactions: [], readBy: myId ? [myId] : [],
      replyToId: reply?.id, replyToText: reply?.text,
      createdAt: Date.now(),
    };

    // Append to end (ascending order — newest at bottom)
    setMessages(prev => [...prev, temp]);
    setInput('');
    setReplyTo(null);
    isNearBottom.current = true; // ensure auto-scroll after send

    sendMessage(chatId, text, myName, reply ?? undefined).catch(() => {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      Alert.alert('Not sent', 'Your message could not be sent. Please try again.');
    });
  }, [input, chatId, myId, myName, replyTo]);

  const handleLongPress = useCallback((msg: ChatMessage) => setActionMsg(msg), []);

  const handleReact = useCallback(
    (emoji: string) => {
      const msg = actionMsg;
      setActionMsg(null);
      if (!msg || msg.id.startsWith('pending_')) return;
      toggleReaction(chatId, msg.id, emoji).catch(() => {});
    },
    [actionMsg, chatId],
  );

  const handleReply = useCallback(() => {
    const msg = actionMsg;
    setActionMsg(null);
    if (!msg) return;
    setReplyTo({ id: msg.id, text: msg.text });
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [actionMsg]);

  const handleDelete = useCallback(() => {
    const msg = actionMsg;
    setActionMsg(null);
    if (!msg || msg.id.startsWith('pending_')) return;
    Alert.alert('Delete message?', 'This will be removed for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMessage(chatId, msg.id).catch(() => {}),
      },
    ]);
  }, [actionMsg, chatId]);

  const listData = useMemo(() => buildList(messages), [messages]);

  const filteredData = useMemo<ListItem[]>(() => {
    if (!isSearching || !searchQuery.trim()) return isSearching ? [] : listData;
    const q = searchQuery.trim().toLowerCase();
    return messages
      .filter(m => !m.deletedAt && m.text?.toLowerCase().includes(q))
      .map(m => ({ kind: 'msg' as const, key: m.id, msg: m }));
  }, [isSearching, searchQuery, listData, messages]);

  const keyExtractor = useCallback((item: ListItem) => item.key, []);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.kind === 'sep') {
        return (
          <View style={styles.sepWrap}>
            <View style={[styles.sepPill, { backgroundColor: t.filterInactiveBg }]}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: t.textSub }}>
                {item.label}
              </Text>
            </View>
          </View>
        );
      }
      return (
        <Bubble
          msg={item.msg}
          mine={!!myId && item.msg.senderId === myId}
          t={t}
          onLongPress={handleLongPress}
        />
      );
    },
    [t, myId, handleLongPress],
  );

  const canSend = input.trim().length > 0;
  const initials = getInitials(otherName);

  const goToProfile = useCallback(() => {
    navigation.navigate('ContactProfile', { chatId, otherName, otherUserId: otherUserId || undefined });
  }, [navigation, chatId, otherName, otherUserId]);

  const handleVideoCall = useCallback(() => {
    Alert.alert('Video Call', 'Video calls are not available yet.');
  }, []);

  const handleVoiceCall = useCallback(() => {
    Alert.alert('Voice Call', 'Voice calls are not available yet.');
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar barStyle={t.statusBar} />

      {/* ── Header (outside the KAV so it never moves with the keyboard) ── */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: t.bg }}>
        <View style={[styles.header, { borderBottomColor: t.divider }]}>
          <TouchableOpacity
            onPress={isSearching ? closeSearch : () => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.headerBtn}
          >
            <Ionicons name="chevron-back" size={26} color={t.text} />
          </TouchableOpacity>

          {isSearching ? (
            /* Search mode: inline TextInput replaces the avatar+name */
            <View style={[styles.headerCenter, styles.searchBar, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
              <Ionicons name="search-outline" size={16} color={t.textMuted} style={{ marginRight: 6 }} />
              <TextInput
                ref={searchInputRef}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search messages…"
                placeholderTextColor={t.textMuted}
                style={[styles.searchInput, { color: t.text }]}
                returnKeyType="search"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={16} color={t.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* Normal mode: avatar + name → contact profile */
            <TouchableOpacity
              style={styles.headerCenter}
              onPress={goToProfile}
              activeOpacity={0.75}
            >
              <View style={[styles.avatar, { backgroundColor: t.filterInactiveBg, borderColor: t.filterInactiveBorder }]}>
                <Text style={{ color: t.textSub, fontWeight: '700', fontSize: 15 }}>{initials}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text numberOfLines={1} style={{ color: t.text, fontSize: 17, fontWeight: '700' }}>
                  {otherName}
                </Text>
                {isTyping && <TypingDots color={t.textSub} />}
              </View>
            </TouchableOpacity>
          )}

          {/* Video + Voice call buttons — hidden while searching */}
          {!isSearching && (
            <View style={[styles.callPill, { backgroundColor: t.card }]}>
              <TouchableOpacity onPress={handleVideoCall} activeOpacity={0.7} style={styles.callPillBtn}>
                <Ionicons name="videocam-outline" size={20} color={t.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleVoiceCall} activeOpacity={0.7} style={styles.callPillBtn}>
                <Ionicons name="call-outline" size={20} color={t.text} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* ── Everything below the header lives inside the KAV ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={t.gold} />
          </View>
        ) : !isSearching && messages.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="chatbubbles-outline" size={44} color={t.textMuted} />
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '600', marginTop: 12 }}>
              No messages yet
            </Text>
            <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 4 }}>
              Say hello to {otherName}!
            </Text>
          </View>
        ) : isSearching && !searchQuery.trim() ? (
          <View style={styles.center}>
            <Ionicons name="search-outline" size={44} color={t.textMuted} />
            <Text style={{ color: t.textMuted, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
              Type to search messages
            </Text>
          </View>
        ) : isSearching && filteredData.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="search-outline" size={44} color={t.textMuted} />
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '600', marginTop: 12 }}>
              No results
            </Text>
            <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
              No messages match "{searchQuery}"
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={isSearching ? filteredData : listData}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={100}
            onContentSizeChange={handleContentSizeChange}
            onLayout={handleLayout}
          />
        )}

        {/* Emoji panel */}
        {showEmojiPanel && (
          <View style={[styles.emojiPanel, { backgroundColor: t.card, borderTopColor: t.divider }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              contentContainerStyle={styles.emojiGrid}
            >
              {EMOJI_PANEL.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => handleEmojiSelect(emoji)}
                  style={styles.emojiBtn}
                  activeOpacity={0.6}
                >
                  <Text style={styles.emojiChar}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Reply bar */}
        {replyTo && (
          <View style={[styles.replyBar, { backgroundColor: t.card, borderTopColor: t.divider }]}>
            <View style={[styles.replyBarAccent, { backgroundColor: t.gold }]} />
            <View style={{ flex: 1, marginHorizontal: 10 }}>
              <Text style={{ color: t.gold, fontSize: 12, fontWeight: '600' }}>Replying to</Text>
              <Text numberOfLines={1} style={{ color: t.textSub, fontSize: 13, marginTop: 1 }}>
                {replyTo.text}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setReplyTo(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={t.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Composer */}
        <View
          style={[
            styles.composer,
            {
              backgroundColor: t.bg,
              borderTopColor: t.divider,
              paddingBottom: Math.max(insets.bottom, 8),
            },
          ]}
        >
          <TouchableOpacity style={styles.composerIconBtn}>
            <Ionicons name="add-circle-outline" size={26} color={t.textSub} />
          </TouchableOpacity>

          <View style={[styles.inputPill, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
            <TouchableOpacity onPress={toggleEmojiPanel} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} style={{ marginRight: 6 }}>
              <Ionicons
                name={showEmojiPanel ? 'happy' : 'happy-outline'}
                size={20}
                color={showEmojiPanel ? t.gold : t.textMuted}
              />
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              value={input}
              onChangeText={handleChangeText}
              onFocus={() => setShowEmojiPanel(false)}
              placeholder="Message"
              placeholderTextColor={t.textMuted}
              multiline
              style={[styles.textInput, { color: t.text }]}
            />
          </View>

          <TouchableOpacity
            onPress={canSend ? handleSend : undefined}
            activeOpacity={canSend ? 0.7 : 1}
            style={[styles.sendBtn, { backgroundColor: canSend ? t.gold : t.filterInactiveBg }]}
          >
            <Ionicons
              name={canSend ? 'send' : 'mic-outline'}
              size={18}
              color={canSend ? OUTGOING_TEXT : t.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Long-press action sheet ── */}
      {actionMsg && (
        <Pressable style={styles.sheetBackdrop} onPress={() => setActionMsg(null)}>
          <View
            style={[styles.sheet, { backgroundColor: t.card, paddingBottom: Math.max(insets.bottom, 16) }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.sheetHandleWrap}>
              <View style={[styles.sheetHandle, { backgroundColor: t.textMuted }]} />
            </View>

            <View style={styles.reactionRow}>
              {REACTIONS.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => handleReact(emoji)}
                  style={[styles.reactionBtn, { backgroundColor: t.filterInactiveBg }]}
                >
                  <Text style={{ fontSize: 24 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.sheetDivider, { backgroundColor: t.divider }]} />

            <TouchableOpacity style={styles.sheetAction} onPress={handleReply}>
              <Ionicons name="arrow-undo-outline" size={20} color={t.text} />
              <Text style={[styles.sheetActionText, { color: t.text }]}>Reply</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetAction} onPress={() => setActionMsg(null)}>
              <Ionicons name="copy-outline" size={20} color={t.text} />
              <Text style={[styles.sheetActionText, { color: t.text }]}>Copy</Text>
            </TouchableOpacity>

            {!!myId && actionMsg.senderId === myId && (
              <TouchableOpacity style={styles.sheetAction} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={20} color="#E07070" />
                <Text style={[styles.sheetActionText, { color: '#E07070' }]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { padding: 6 },
  callPill: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 26, height: 44, marginRight: 4,
    overflow: 'hidden',
  },
  callPillBtn: {
    paddingHorizontal: 11, height: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 2,
  },
  searchBar: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 7 : 3,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingTop: 0,
    paddingBottom: 0,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  // Bubbles — leaner, more elongated shape
  bubbleRow: {
    marginVertical: 2,
    maxWidth: '78%',
  },
  rowRight: { alignSelf: 'flex-end' },
  rowLeft: { alignSelf: 'flex-start' },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 5,
  },
  replyQuote: {
    borderLeftWidth: 3,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 5,
  },
  reactionsPill: {
    flexDirection: 'row',
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 3,
  },

  // Date separators
  sepWrap: { alignItems: 'center', marginVertical: 10 },
  sepPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },

  // Reply bar
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  replyBarAccent: { width: 3, alignSelf: 'stretch', borderRadius: 2 },

  // Composer
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  composerIconBtn: { padding: 6, marginBottom: 4 },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 2,
    marginHorizontal: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    maxHeight: 120,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    marginLeft: 2,
  },

  // Action sheet
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 2000,
    elevation: 2000,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
  },
  sheetHandleWrap: { alignItems: 'center', paddingVertical: 10 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, opacity: 0.4 },
  reactionRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
  reactionBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  sheetDivider: { height: StyleSheet.hairlineWidth, marginVertical: 8 },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 4,
  },
  sheetActionText: { fontSize: 16, fontWeight: '500' },

  emojiPanel: {
    height: 260,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  emojiBtn: {
    width: '12.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiChar: { fontSize: 26 },
});
