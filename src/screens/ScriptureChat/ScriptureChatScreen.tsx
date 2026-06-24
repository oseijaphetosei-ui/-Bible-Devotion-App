import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StatusBar,
  Share,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createNote } from '../../services/notesService';
import {
  createChat,
  getChat,
  saveMessages,
  askScripture,
} from '../../services/scriptureChatService';
import { getScriptureInsights } from '../../services/appApi';
import { useTheme } from '../../theme';
import type { AppTheme } from '../../theme';
import type { ChatMessage, ScriptureChatNavParams } from '../../types/scriptureChat';
import { SUGGESTED_QUESTIONS } from '../../types/scriptureChat';

type ScriptureInsights = Awaited<ReturnType<typeof getScriptureInsights>>;

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator({ t }: { t: AppTheme }) {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, { toValue: 0.3, duration: 0, delay, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 350, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 360, useNativeDriver: true }),
        ])
      ).start();

    anim(dot1, 0);
    anim(dot2, 240);
    anim(dot3, 480);
  }, []);

  return (
    <View style={ms.assistantRow}>
      <View style={[ms.avatarDot, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}>
        <Ionicons name="book" size={10} color={t.gold} />
      </View>
      <View style={[ms.aiBubble, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
        <View style={ms.dotsRow}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View
              key={i}
              style={[ms.dot, { backgroundColor: t.textMuted, opacity: dot }]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Rich text renderer (handles **bold** and section structure) ──────────────

function InlineBold({ text, baseStyle, boldStyle }: { text: string; baseStyle: any; boldStyle: any }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return <Text style={baseStyle}>{text}</Text>;
  return (
    <Text style={baseStyle}>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <Text key={i} style={boldStyle}>{p.slice(2, -2)}</Text>
          : <Text key={i}>{p}</Text>
      )}
    </Text>
  );
}

function AIMessageContent({ text, t }: { text: string; t: AppTheme }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    if (!line.trim()) {
      elements.push(<View key={i} style={{ height: 6 }} />);
      return;
    }

    const headerM = line.match(/^\*\*(.+?)\*\*\s*$/);
    if (headerM) {
      elements.push(
        <Text key={i} style={[ms.sectionHeader, { color: t.gold }]}>
          {headerM[1].toUpperCase()}
        </Text>
      );
      return;
    }

    const listM = line.match(/^[-•]\s+(.+)/);
    if (listM) {
      elements.push(
        <View key={i} style={ms.listItem}>
          <Text style={[ms.listBullet, { color: t.gold }]}>·</Text>
          <InlineBold
            text={listM[1]}
            baseStyle={[ms.aiText, { color: t.text }]}
            boldStyle={{ fontWeight: '700', color: t.text }}
          />
        </View>
      );
      return;
    }

    elements.push(
      <InlineBold
        key={i}
        text={line}
        baseStyle={[ms.aiText, { color: t.text }]}
        boldStyle={{ fontWeight: '700', color: t.text }}
      />
    );
  });

  return <View style={{ gap: 4 }}>{elements}</View>;
}

// ─── Message bubble ───────────────────────────────────────────────────────────

type MessageItem =
  | (ChatMessage & { _type: 'message' })
  | { _type: 'typing'; id: string }
  | { _type: 'streaming'; id: string; content: string };

function MessageBubble({
  item,
  t,
  reference,
  onSave,
  onShare,
}: {
  item: MessageItem;
  t: AppTheme;
  reference: string;
  onSave: (content: string) => void;
  onShare: (content: string) => void;
}) {
  if (item._type === 'typing') return <TypingIndicator t={t} />;

  const content = item._type === 'streaming' ? item.content : (item as ChatMessage).content;
  const isUser = item._type === 'message' && (item as ChatMessage).role === 'user';

  if (isUser) {
    return (
      <View style={ms.userRow}>
        <View style={[ms.userBubble, { backgroundColor: t.gold }]}>
          <Text style={[ms.userText, { color: '#FFFFFF' }]}>{content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={ms.assistantRow}>
      <View style={[ms.avatarDot, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}>
        <Ionicons name="book" size={10} color={t.gold} />
      </View>
      <View style={ms.aiBubbleWrap}>
        <View style={[ms.aiBubble, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
          <AIMessageContent text={content} t={t} />
        </View>
        {item._type === 'message' && (
          <View style={ms.actionRow}>
            <TouchableOpacity
              onPress={() => onSave(content)}
              style={[ms.actionBtn, { borderColor: t.cardBorder }]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="bookmark-outline" size={13} color={t.textMuted} />
              <Text style={[ms.actionLabel, { color: t.textMuted }]}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onShare(content)}
              style={[ms.actionBtn, { borderColor: t.cardBorder }]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="share-outline" size={13} color={t.textMuted} />
              <Text style={[ms.actionLabel, { color: t.textMuted }]}>Share</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  reference,
  contextType,
  t,
  onSuggest,
}: {
  reference: string;
  contextType: string;
  t: AppTheme;
  onSuggest: (q: string) => void;
}) {
  return (
    <View style={es.wrap}>
      <View style={[es.iconWrap, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}>
        <Ionicons name="chatbubbles-outline" size={28} color={t.gold} />
      </View>
      <Text style={[es.title, { color: t.text }]}>Talk to the Scripture</Text>
      <Text style={[es.sub, { color: t.textMuted }]}>
        Ask anything about{' '}
        <Text style={{ color: t.gold, fontWeight: '600' }}>{reference}</Text>
      </Text>
      <View style={es.chips}>
        {SUGGESTED_QUESTIONS.map((q) => (
          <TouchableOpacity
            key={q}
            onPress={() => onSuggest(q)}
            style={[es.chip, { backgroundColor: t.card, borderColor: t.cardBorder }]}
            activeOpacity={0.7}
          >
            <Text style={[es.chipText, { color: t.textSub }]}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Insights section card ────────────────────────────────────────────────────

function InsightSection({
  icon,
  label,
  t,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  t: AppTheme;
  children: React.ReactNode;
}) {
  return (
    <View style={[is.section, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
      <View style={is.sectionHeader}>
        <Ionicons name={icon} size={13} color={t.gold} />
        <Text style={[is.sectionLabel, { color: t.gold }]}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

// ─── Insights view ────────────────────────────────────────────────────────────

function InsightsView({
  insights,
  loading,
  error,
  t,
  bottomPad,
}: {
  insights: ScriptureInsights | null;
  loading: boolean;
  error: string | null;
  t: AppTheme;
  bottomPad: number;
}) {
  if (loading) {
    return (
      <View style={is.center}>
        <ActivityIndicator size="large" color={t.gold} />
        <Text style={[is.loadingText, { color: t.textMuted }]}>Analyzing scripture…</Text>
      </View>
    );
  }

  if (error || !insights) {
    return (
      <View style={is.center}>
        <Ionicons name="alert-circle-outline" size={36} color={t.textMuted} />
        <Text style={[is.errorText, { color: t.textMuted }]}>{error ?? 'Something went wrong.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[is.scroll, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <InsightSection icon="document-text-outline" label="SUMMARY" t={t}>
        <Text style={[is.bodyText, { color: t.text }]}>{insights.summary}</Text>
      </InsightSection>

      <InsightSection icon="pricetags-outline" label="KEY THEMES" t={t}>
        <View style={is.themeRow}>
          {insights.keyThemes.map((theme) => (
            <View key={theme} style={[is.themeChip, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}>
              <Text style={[is.themeText, { color: t.gold }]}>{theme}</Text>
            </View>
          ))}
        </View>
      </InsightSection>

      <InsightSection icon="time-outline" label="HISTORICAL CONTEXT" t={t}>
        <Text style={[is.bodyText, { color: t.text }]}>{insights.historicalContext}</Text>
      </InsightSection>

      <InsightSection icon="sparkles-outline" label="THEOLOGICAL INSIGHT" t={t}>
        <Text style={[is.bodyText, { color: t.text }]}>{insights.theologicalInsight}</Text>
      </InsightSection>

      <InsightSection icon="git-network-outline" label="CROSS REFERENCES" t={t}>
        <View style={{ gap: 10 }}>
          {insights.crossReferences.map((ref) => (
            <View key={ref.reference} style={[is.crossRefRow, { borderLeftColor: t.goldBorder }]}>
              <Text style={[is.crossRefRef, { color: t.gold }]}>{ref.reference}</Text>
              <Text style={[is.crossRefText, { color: t.textSub }]}>{ref.connection}</Text>
            </View>
          ))}
        </View>
      </InsightSection>

      <InsightSection icon="sunny-outline" label="APPLICATION TODAY" t={t}>
        <Text style={[is.bodyText, { color: t.text }]}>{insights.applicationToday}</Text>
      </InsightSection>

      <InsightSection icon="heart-outline" label="PRAYER FOCUS" t={t}>
        <View style={[is.prayerBox, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}>
          <Ionicons name="heart" size={12} color={t.gold} style={{ marginBottom: 6 }} />
          <Text style={[is.prayerText, { color: t.text }]}>{insights.prayerFocus}</Text>
        </View>
      </InsightSection>
    </ScrollView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ScriptureChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params ?? {}) as ScriptureChatNavParams;
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const isInsights = params.mode === 'insights';

  // ── Chat state ──
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatId, setChatId] = useState<string | null>(params.chatId ?? null);
  const [savedMsgId, setSavedMsgId] = useState<string | null>(null);
  const [kbHeight, setKbHeight] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);

  // ── Insights state ──
  const [insights, setInsights] = useState<ScriptureInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(isInsights);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch insights on mount when in insights mode
  useEffect(() => {
    if (!isInsights) return;
    setInsightsLoading(true);
    getScriptureInsights({
      reference: params.reference,
      text: params.context,
      type: params.contextType === 'chapter' ? 'chapter' : 'verse',
    })
      .then((data) => {
        setInsights(data);
        setInsightsLoading(false);
      })
      .catch(() => {
        setInsightsError('Unable to load insights. Please check your connection and try again.');
        setInsightsLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load existing chat if chatId provided
  useEffect(() => {
    if (params.chatId) {
      getChat(params.chatId).then((chat) => {
        if (chat) setMessages(chat.messages);
      });
    }
  }, [params.chatId]);

  // Scroll to end on new content
  useEffect(() => {
    if (messages.length > 0 || isTyping || isStreaming) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 120);
    }
  }, [messages.length, isTyping, isStreaming, streamingContent]);

  // Track keyboard height
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, e => setKbHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setKbHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const streamResponse = useCallback((fullText: string, onDone: () => void) => {
    const words = fullText.split(/(\s+)/);
    let i = 0;
    setStreamingContent('');
    setIsStreaming(true);

    streamIntervalRef.current = setInterval(() => {
      i += 2;
      if (i >= words.length) {
        clearInterval(streamIntervalRef.current!);
        setStreamingContent(fullText);
        setTimeout(() => {
          setIsStreaming(false);
          onDone();
        }, 80);
      } else {
        setStreamingContent(words.slice(0, i).join(''));
      }
    }, 22);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping || isStreaming) return;

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
      };

      const updatedMsgs = [...messages, userMsg];
      setMessages(updatedMsgs);
      setInputText('');
      setIsTyping(true);

      let cid = chatId;
      try {
        if (!cid) {
          cid = await createChat(params);
          setChatId(cid);
        }

        const responseText = await askScripture(
          params.reference,
          params.context,
          updatedMsgs,
        );

        setIsTyping(false);

        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseText,
          timestamp: new Date().toISOString(),
        };

        streamResponse(responseText, () => {
          const finalMsgs = [...updatedMsgs, aiMsg];
          setMessages(finalMsgs);
          saveMessages(cid!, finalMsgs).catch(() => {});
        });
      } catch (e: any) {
        setIsTyping(false);
        const errMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: e?.message?.includes('network') || e?.message?.includes('fetch')
            ? 'Talk to the Scripture requires an internet connection. Please check your connection and try again.'
            : 'Something went wrong. Please try again.',
          timestamp: new Date().toISOString(),
        };
        setMessages([...updatedMsgs, errMsg]);
      }
    },
    [messages, isTyping, isStreaming, chatId, params, streamResponse],
  );

  const handleSaveToNotes = useCallback(
    async (content: string) => {
      try {
        await createNote({
          title: `Reflection on ${params.reference}`,
          content,
          bibleReference: params.reference,
          tags: ['scripture-chat'],
          devotionId: undefined,
        });
        const msgId = Date.now().toString();
        setSavedMsgId(msgId);
        setTimeout(() => setSavedMsgId(null), 2000);
      } catch {}
    },
    [params.reference],
  );

  const handleShare = useCallback(
    async (content: string) => {
      try {
        await Share.share({
          message: `${params.reference}\n\n${content}`,
          title: `Scripture Insight — ${params.reference}`,
        });
      } catch {}
    },
    [params.reference],
  );

  const displayItems: MessageItem[] = [
    ...messages.map((m) => ({ ...m, _type: 'message' as const })),
    ...(isTyping ? [{ _type: 'typing' as const, id: 'typing' }] : []),
    ...(isStreaming
      ? [{ _type: 'streaming' as const, id: 'streaming', content: streamingContent }]
      : []),
  ];

  const contextLabel = isInsights
    ? 'AI Insights'
    : params.contextType === 'devotion'
    ? 'Daily Devotion'
    : params.contextType === 'chapter'
    ? 'Chapter'
    : 'Verse';

  const canSend = inputText.trim().length > 0 && !isTyping && !isStreaming;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>

          {/* ── Header ── */}
          <View style={[s.header, { borderBottomColor: t.divider }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={22} color={t.text} />
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <Text style={[s.headerRef, { color: t.text }]} numberOfLines={1}>
                {params.reference}
              </Text>
              <View style={[s.headerBadge, { backgroundColor: t.goldBg }]}>
                <Text style={[s.headerBadgeText, { color: t.gold }]}>{contextLabel}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => handleShare(
                isInsights && insights
                  ? `${params.reference}\n\n${insights.summary}\n\n${insights.prayerFocus}`
                  : messages.map((m) => m.content).join('\n\n')
              )}
              style={s.headerBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={20} color={t.textSub} />
            </TouchableOpacity>
          </View>

          {/* ── Saved confirmation toast ── */}
          {savedMsgId && (
            <View style={[s.toast, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}>
              <Ionicons name="checkmark-circle" size={14} color={t.gold} />
              <Text style={[s.toastText, { color: t.gold }]}>Saved to Notes</Text>
            </View>
          )}

          {/* ── Insights view OR chat list ── */}
          {isInsights ? (
            <InsightsView
              insights={insights}
              loading={insightsLoading}
              error={insightsError}
              t={t}
              bottomPad={insets.bottom + 24}
            />
          ) : displayItems.length === 0 ? (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <EmptyState
                reference={params.reference}
                contextType={params.contextType}
                t={t}
                onSuggest={sendMessage}
              />
            </ScrollView>
          ) : (
            <FlatList
              ref={flatListRef}
              data={displayItems}
              keyExtractor={(item) => item.id}
              contentContainerStyle={s.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: false })
              }
              renderItem={({ item }) => (
                <MessageBubble
                  item={item}
                  t={t}
                  reference={params.reference}
                  onSave={handleSaveToNotes}
                  onShare={handleShare}
                />
              )}
            />
          )}

          {/* ── Suggestion chips — chat mode only ── */}
          {!isInsights && displayItems.length > 0 && !isTyping && !isStreaming && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.suggestionsScroll}
              contentContainerStyle={s.suggestionsRow}
              keyboardShouldPersistTaps="handled"
            >
              {SUGGESTED_QUESTIONS.slice(0, 6).map((q) => (
                <TouchableOpacity
                  key={q}
                  onPress={() => sendMessage(q)}
                  style={[s.suggestionChip, { backgroundColor: t.card, borderColor: t.cardBorder }]}
                  activeOpacity={0.7}
                >
                  <Text style={[s.suggestionText, { color: t.textSub }]} numberOfLines={1}>
                    {q}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* ── Input bar — chat mode only ── */}
          {!isInsights && (
            <>
              <View style={[s.inputBar, {
                backgroundColor: t.card,
                borderColor: 'transparent',
              }]}>
                <TextInput
                  style={[s.textInput, { color: t.text }]}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ask about this passage…"
                  placeholderTextColor={t.textMuted}
                  multiline
                  maxLength={400}
                  returnKeyType="send"
                  onSubmitEditing={() => sendMessage(inputText)}
                  blurOnSubmit={false}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                />
                <TouchableOpacity
                  onPress={() => sendMessage(inputText)}
                  disabled={!canSend}
                  activeOpacity={0.75}
                  style={[s.sendBtn, { backgroundColor: canSend ? t.gold : t.goldBg }]}
                >
                  <Ionicons name="arrow-up" size={18} color={canSend ? '#fff' : t.gold} />
                </TouchableOpacity>
              </View>
              <View style={{ height: kbHeight > 0 ? 0 : insets.bottom + 52 }} />
            </>
          )}

        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', gap: 4 },
  headerRef: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  headerBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  headerBadgeText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },

  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 2,
  },
  toastText: { fontSize: 12, fontWeight: '600' },

  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },

  suggestionsScroll: { maxHeight: 44 },
  suggestionsRow: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 200,
  },
  suggestionText: { fontSize: 12, fontWeight: '500' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 8,
    marginTop: 6,
    borderRadius: 26,
    borderWidth: 1.5,
    paddingLeft: 18,
    paddingRight: 8,
    paddingVertical: 3,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  textInput: { flex: 1, fontSize: 15, maxHeight: 120, paddingVertical: 4, lineHeight: 21, textAlignVertical: 'center' },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Message styles
const ms = StyleSheet.create({
  userRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 14 },
  userBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  userText: { fontSize: 15, lineHeight: 22 },

  assistantRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 10 },
  avatarDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  aiBubbleWrap: { flex: 1 },
  aiBubble: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  aiText: { fontSize: 15, lineHeight: 23 },
  sectionHeader: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 8, marginBottom: 2 },
  listItem: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  listBullet: { fontSize: 18, lineHeight: 23, fontWeight: '700' },

  actionRow: { flexDirection: 'row', gap: 6, marginTop: 6, paddingLeft: 2 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionLabel: { fontSize: 11, fontWeight: '500' },

  dotsRow: { flexDirection: 'row', gap: 5, paddingVertical: 4, paddingHorizontal: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});

// Empty state styles
const es = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', paddingTop: 48, paddingHorizontal: 20, paddingBottom: 24 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  sub: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '500' },
});

// Insights styles
const is = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  loadingText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
  errorText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },

  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },

  bodyText: { fontSize: 15, lineHeight: 23 },

  themeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  themeChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  themeText: { fontSize: 12, fontWeight: '600' },

  crossRefRow: {
    paddingLeft: 12,
    borderLeftWidth: 2,
    gap: 3,
  },
  crossRefRef: { fontSize: 13, fontWeight: '700' },
  crossRefText: { fontSize: 14, lineHeight: 20 },

  prayerBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  prayerText: { fontSize: 15, lineHeight: 23, fontStyle: 'italic' },
});
