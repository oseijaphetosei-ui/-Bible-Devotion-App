import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet,
  StatusBar, Animated, KeyboardAvoidingView, Platform, Modal,
  Pressable, Keyboard, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { ChatStackParamList } from '../../types/navigation';
import type { ChatMessage, ScripturePayload } from '../../types/chat';
import { REACTIONS } from '../../types/chat';
import {
  subscribeToMessages, sendMessage, sendScripture,
  markRead, setTyping, toggleReaction, deleteMessage,
  getOrCreateProfile, getSavedDisplayName,
} from '../../services/chatService';
import { getDeviceId } from '../../services/notesService';
import { getTodayVerseEntry } from '../../services/verseService';

type RouteT = RouteProp<ChatStackParamList, 'DirectMessage'>;

// ── Typing dots animation ─────────────────────────────────────────────────────

function TypingIndicator() {
  const t = useTheme();
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anim = Animated.loop(
      Animated.stagger(160, dots.map(d =>
        Animated.sequence([
          Animated.timing(d, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ))
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={[ty.wrap, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
      {dots.map((d, i) => (
        <Animated.View key={i} style={[ty.dot, { backgroundColor: t.textMuted, opacity: d, transform: [{ translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]} />
      ))}
    </View>
  );
}

// ── Scripture picker modal ────────────────────────────────────────────────────

function ScripturePicker({ visible, onClose, onSelect }: {
  visible: boolean;
  onClose: () => void;
  onSelect: (s: ScripturePayload) => void;
}) {
  const t = useTheme();
  const verse = getTodayVerseEntry();

  const quick: ScripturePayload[] = [
    { reference: verse.label, text: verse.fallbackText, bookIndex: 0, chapter: 0, verse: 0 },
    { reference: 'John 3:16', text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.', bookIndex: 42, chapter: 3, verse: 16 },
    { reference: 'Romans 8:28', text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', bookIndex: 44, chapter: 8, verse: 28 },
    { reference: 'Psalm 23:1', text: 'The Lord is my shepherd, I lack nothing.', bookIndex: 18, chapter: 23, verse: 1 },
    { reference: 'Philippians 4:13', text: 'I can do all this through him who gives me strength.', bookIndex: 49, chapter: 4, verse: 13 },
    { reference: 'Isaiah 40:31', text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles.', bookIndex: 22, chapter: 40, verse: 31 },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={sp.backdrop} onPress={onClose} />
      <View style={[sp.sheet, { backgroundColor: t.bg, borderColor: t.cardBorder }]}>
        <View style={[sp.handle, { backgroundColor: t.textMuted }]} />
        <Text style={[sp.title, { color: t.text }]}>Share Scripture</Text>
        <Text style={[sp.sub, { color: t.textSub }]}>Today's verse &amp; popular passages</Text>
        {quick.map((s, i) => (
          <TouchableOpacity
            key={i}
            style={[sp.item, { borderColor: t.cardBorder, backgroundColor: i === 0 ? t.goldBg : t.card }]}
            onPress={() => { onSelect(s); onClose(); }}
            activeOpacity={0.78}
          >
            <View style={sp.itemTop}>
              <Text style={[sp.itemRef, { color: t.gold }]}>{s.reference}</Text>
              {i === 0 && (
                <View style={[sp.todayBadge, { backgroundColor: t.gold }]}>
                  <Text style={sp.todayText}>TODAY</Text>
                </View>
              )}
            </View>
            <Text style={[sp.itemText, { color: t.textSub }]} numberOfLines={2}>{s.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
}

// ── Scripture card (inside message) ──────────────────────────────────────────

const ScriptureCard = memo(function ScriptureCard({ scripture, isOutgoing, t }: {
  scripture: ScripturePayload; isOutgoing: boolean; t: any;
}) {
  return (
    <View style={[sc.card, { borderColor: t.goldBorder, backgroundColor: isOutgoing ? 'rgba(201,169,107,0.18)' : t.cardAlt }]}>
      <Text style={[sc.ref, { color: t.gold }]}>📖 {scripture.reference}</Text>
      <Text style={[sc.text, { color: t.text }]} numberOfLines={4}>{scripture.text}</Text>
      <View style={[sc.divider, { backgroundColor: t.goldBorder }]} />
      <Text style={[sc.cta, { color: t.gold }]}>Open verse →</Text>
    </View>
  );
});

// ── Reaction bar ──────────────────────────────────────────────────────────────

function ReactionBar({ messageId, chatId, onDismiss }: { messageId: string; chatId: string; onDismiss: () => void }) {
  const t = useTheme();
  return (
    <View style={[rb.wrap, { backgroundColor: t.card, borderColor: t.cardBorder, shadowColor: '#000' }]}>
      {REACTIONS.map(emoji => (
        <TouchableOpacity
          key={emoji}
          style={rb.btn}
          onPress={() => { toggleReaction(chatId, messageId, emoji); onDismiss(); }}
          activeOpacity={0.7}
        >
          <Text style={rb.emoji}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Single message bubble ─────────────────────────────────────────────────────

const MessageBubble = memo(function MessageBubble({
  msg, isOutgoing, chatId, userId, onLongPress, showName,
}: {
  msg: ChatMessage; isOutgoing: boolean; chatId: string;
  userId: string; onLongPress: () => void; showName: boolean;
}) {
  const t = useTheme();
  const enterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(enterAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  const isDeleted = !!msg.deletedAt;
  const isSystem = msg.type === 'system' || isDeleted;

  if (isSystem) {
    return (
      <Animated.View style={[mb.systemWrap, { opacity: enterAnim }]}>
        <Text style={[mb.systemText, { color: t.textMuted }]}>{msg.text}</Text>
      </Animated.View>
    );
  }

  const bubbleStyle = isOutgoing
    ? [mb.bubble, mb.outBubble, { backgroundColor: t.gold + 'EE' }]
    : [mb.bubble, mb.inBubble, { backgroundColor: t.card, borderColor: t.cardBorder }];

  const textColor = isOutgoing ? '#08071A' : t.text;

  return (
    <Animated.View style={[
      mb.row,
      isOutgoing ? mb.rowOut : mb.rowIn,
      { opacity: enterAnim, transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] },
    ]}>
      <TouchableOpacity onLongPress={onLongPress} activeOpacity={0.85} delayLongPress={350}>
        <View>
          {showName && !isOutgoing && (
            <Text style={[mb.senderName, { color: t.gold }]}>{msg.senderName}</Text>
          )}
          {msg.replyToText && (
            <View style={[mb.replyBar, { borderColor: isOutgoing ? 'rgba(8,7,26,0.3)' : t.goldBorder, backgroundColor: isOutgoing ? 'rgba(8,7,26,0.15)' : t.goldBg }]}>
              <Text style={[mb.replyText, { color: isOutgoing ? '#08071A' : t.textSub }]} numberOfLines={1}>{msg.replyToText}</Text>
            </View>
          )}
          <View style={bubbleStyle}>
            {msg.type === 'scripture' && msg.scripture ? (
              <ScriptureCard scripture={msg.scripture} isOutgoing={isOutgoing} t={t} />
            ) : (
              <Text style={[mb.msgText, { color: textColor }]}>{msg.text}</Text>
            )}
            <Text style={[mb.time, { color: isOutgoing ? 'rgba(8,7,26,0.5)' : t.textMuted }]}>
              {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              {isOutgoing && (
                <Text> {msg.readBy.length > 1 ? '✓✓' : '✓'}</Text>
              )}
            </Text>
          </View>
          {msg.reactions.length > 0 && (
            <View style={mb.reactionsRow}>
              {msg.reactions.map(r => (
                <TouchableOpacity
                  key={r.emoji}
                  style={[mb.reactionPill, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}
                  onPress={() => toggleReaction(chatId, msg.id, r.emoji)}
                  activeOpacity={0.75}
                >
                  <Text style={mb.reactionEmoji}>{r.emoji}</Text>
                  {r.userIds.length > 1 && <Text style={[mb.reactionCount, { color: t.gold }]}>{r.userIds.length}</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ── Main screen ────────────────────────────────────────────────────────────────

export default function DirectMessageScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteT>();
  const { chatId, otherUserId, otherName } = route.params;
  const t = useTheme();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [userId, setUserId] = useState('');
  const [myName, setMyName] = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [showScripturePicker, setShowScripturePicker] = useState(false);
  const [activeMsg, setActiveMsg] = useState<ChatMessage | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; text: string } | null>(null);

  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    (async () => {
      const id = await getDeviceId();
      setUserId(id);
      const name = await getSavedDisplayName();
      setMyName(name ?? 'Me');
    })();
  }, []);

  useEffect(() => {
    if (!userId) return;
    markRead(chatId);
    const unsub = subscribeToMessages(chatId, msgs => {
      setMessages(msgs);
      markRead(chatId);
    });
    return () => unsub();
  }, [chatId, userId]);

  const handleTextChange = (val: string) => {
    setText(val);
    setTyping(chatId, val.length > 0);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(chatId, false), 3000);
  };

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || !userId) return;
    setText('');
    setReplyTo(null);
    setTyping(chatId, false);
    await sendMessage(chatId, trimmed, myName, replyTo ?? undefined);
  }, [text, userId, chatId, myName, replyTo]);

  const handleSendScripture = async (scripture: ScripturePayload) => {
    await sendScripture(chatId, myName, scripture);
  };

  const handleLongPress = (msg: ChatMessage) => {
    setActiveMsg(msg);
  };

  const handleDelete = () => {
    if (!activeMsg) return;
    Alert.alert('Delete Message', 'Remove this message for everyone?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteMessage(chatId, activeMsg.id); setActiveMsg(null); } },
    ]);
  };

  const handleReply = () => {
    if (!activeMsg) return;
    setReplyTo({ id: activeMsg.id, text: activeMsg.text });
    setActiveMsg(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        {/* Header */}
        <View style={[dm.header, { borderBottomColor: t.divider }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={dm.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={24} color={t.gold} />
          </TouchableOpacity>
          <View style={[dm.avatar, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}>
            <Text style={[dm.avatarText, { color: t.gold }]}>
              {otherName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={dm.headerInfo}>
            <Text style={[dm.headerName, { color: t.text }]}>{otherName}</Text>
          </View>
          <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="ellipsis-horizontal" size={20} color={t.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={m => m.id}
            inverted
            renderItem={({ item, index }) => {
              const isOut = item.senderId === userId;
              const prev = messages[index - 1];
              const showName = !isOut && (!prev || prev.senderId !== item.senderId);
              return (
                <MessageBubble
                  msg={item}
                  isOutgoing={isOut}
                  chatId={chatId}
                  userId={userId}
                  showName={showName}
                  onLongPress={() => handleLongPress(item)}
                />
              );
            }}
            contentContainerStyle={dm.listContent}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={isOtherTyping ? <TypingIndicator /> : null}
          />

          {/* Reply bar */}
          {replyTo && (
            <View style={[dm.replyBar, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}>
              <Ionicons name="return-down-forward" size={14} color={t.gold} />
              <Text style={[dm.replyPreview, { color: t.textSub }]} numberOfLines={1}>{replyTo.text}</Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Ionicons name="close" size={16} color={t.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          {/* Input */}
          <View style={[dm.inputRow, { backgroundColor: t.bg, borderTopColor: t.divider }]}>
            <TouchableOpacity style={dm.iconBtn} onPress={() => setShowScripturePicker(true)}>
              <Ionicons name="book-outline" size={20} color={t.gold} />
            </TouchableOpacity>
            <View style={[dm.inputWrap, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
              <TextInput
                style={[dm.input, { color: t.text }]}
                placeholder="Message…"
                placeholderTextColor={t.textMuted}
                value={text}
                onChangeText={handleTextChange}
                multiline
                maxLength={2000}
                returnKeyType="default"
              />
            </View>
            <TouchableOpacity
              style={[dm.sendBtn, { backgroundColor: text.trim() ? t.gold : t.card, borderColor: t.cardBorder }]}
              onPress={handleSend}
              disabled={!text.trim()}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={16} color={text.trim() ? '#08071A' : t.textMuted} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Scripture picker */}
        <ScripturePicker
          visible={showScripturePicker}
          onClose={() => setShowScripturePicker(false)}
          onSelect={handleSendScripture}
        />

        {/* Long-press action sheet */}
        {activeMsg && (
          <Pressable style={act.backdrop} onPress={() => setActiveMsg(null)}>
            <View style={[act.sheet, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
              {/* Reactions */}
              <View style={act.reactRow}>
                {REACTIONS.map(emoji => (
                  <TouchableOpacity
                    key={emoji}
                    style={act.reactBtn}
                    onPress={() => { toggleReaction(chatId, activeMsg.id, emoji); setActiveMsg(null); }}
                  >
                    <Text style={act.reactEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={[act.divider, { backgroundColor: t.divider }]} />
              {/* Actions */}
              {[
                { icon: 'return-down-forward-outline', label: 'Reply', action: handleReply },
                { icon: 'copy-outline', label: 'Copy', action: () => { setActiveMsg(null); } },
                ...(activeMsg.senderId === userId ? [{ icon: 'trash-outline', label: 'Delete', action: handleDelete }] : []),
              ].map(item => (
                <TouchableOpacity key={item.label} style={act.actionRow} onPress={item.action} activeOpacity={0.75}>
                  <Ionicons name={item.icon as any} size={18} color={item.label === 'Delete' ? '#E07070' : t.text} />
                  <Text style={[act.actionLabel, { color: item.label === 'Delete' ? '#E07070' : t.text }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        )}
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const dm = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
    paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10,
  },
  backBtn: { padding: 4 },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700' },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700' },

  listContent: { paddingHorizontal: 12, paddingVertical: 12, flexGrow: 1 },

  replyBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    borderTopWidth: 1, borderLeftWidth: 3,
  },
  replyPreview: { flex: 1, fontSize: 13 },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { padding: 8, marginBottom: 2 },
  inputWrap: { flex: 1, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, maxHeight: 120 },
  input: { fontSize: 15, paddingVertical: 0, lineHeight: 20 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
});

const mb = StyleSheet.create({
  row: { marginVertical: 2, maxWidth: '80%' },
  rowIn: { alignSelf: 'flex-start' },
  rowOut: { alignSelf: 'flex-end' },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1 },
  inBubble: { borderBottomLeftRadius: 4 },
  outBubble: { borderBottomRightRadius: 4, borderColor: 'transparent' },
  senderName: { fontSize: 11, fontWeight: '700', marginBottom: 2, marginLeft: 4 },
  msgText: { fontSize: 15, lineHeight: 21 },
  time: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  replyBar: { borderLeftWidth: 3, paddingLeft: 8, paddingVertical: 4, marginBottom: 4, borderRadius: 4 },
  replyText: { fontSize: 12 },
  reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4, marginLeft: 4 },
  reactionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1,
  },
  reactionEmoji: { fontSize: 13 },
  reactionCount: { fontSize: 11, fontWeight: '600' },
  systemWrap: { alignItems: 'center', marginVertical: 8 },
  systemText: { fontSize: 12, fontStyle: 'italic' },
});

const ty = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18, borderWidth: 1, borderBottomLeftRadius: 4, marginVertical: 4,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
});

const sc = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6, minWidth: 200, maxWidth: 260 },
  ref: { fontSize: 13, fontWeight: '700' },
  text: { fontSize: 14, lineHeight: 20, fontStyle: 'italic' },
  divider: { height: 1, opacity: 0.4 },
  cta: { fontSize: 12, fontWeight: '600' },
});

const sp = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    padding: 20, gap: 10, maxHeight: '75%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '700' },
  sub: { fontSize: 13, marginBottom: 4 },
  item: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  itemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemRef: { fontSize: 14, fontWeight: '700' },
  itemText: { fontSize: 13, lineHeight: 18 },
  todayBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  todayText: { fontSize: 9, fontWeight: '800', color: '#08071A', letterSpacing: 0.5 },
});

const act = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 99 },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, padding: 16, gap: 2 },
  reactRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12 },
  reactBtn: { padding: 8 },
  reactEmoji: { fontSize: 26 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 8 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 4 },
  actionLabel: { fontSize: 16 },
});

const rb = StyleSheet.create({
  wrap: {
    flexDirection: 'row', gap: 4,
    borderRadius: 28, borderWidth: 1, padding: 8,
    shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  btn: { padding: 6 },
  emoji: { fontSize: 24 },
});
