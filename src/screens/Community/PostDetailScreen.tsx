import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../theme';
import {
  subscribeToPost, subscribeToComments, addComment,
  reactToPost, prayForPost,
} from '../../services/communityService';
import { REACTIONS, REACTION_META, POST_TYPE_META } from '../../types/community';
import type { Post, Comment, ReactionType } from '../../types/community';
import { CommunityStackParamList } from '../../types/navigation';

type RoutePropType = RouteProp<CommunityStackParamList, 'PostDetail'>;

const GOLD = '#C9A96B';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function relativeTime(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function PostDetailScreen() {
  const t          = useTheme();
  const navigation = useNavigation();
  const route      = useRoute<RoutePropType>();
  const insets     = useSafeAreaInsets();
  const { postId } = route.params;

  const isDark = t.statusBar === 'light-content';
  const rootBg = isDark ? '#060810' : '#DDD5C4';

  const textColor    = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const subColor     = isDark ? 'rgba(255,255,255,0.62)' : 'rgba(24,18,8,0.62)';
  const mutedColor   = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(24,18,8,0.07)';

  const glass = isDark
    ? { backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }
    : { backgroundColor: 'rgba(255,255,255,0.68)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)' };

  const [post,          setPost]          = useState<Post | null>(null);
  const [comments,      setComments]      = useState<Comment[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [reply,         setReply]         = useState('');
  const [sending,       setSending]       = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const inputRef    = useRef<TextInput>(null);
  const postUnsubRef = useRef<(() => void) | null>(null);
  const unsubRef    = useRef<(() => void) | null>(null);

  useEffect(() => {
    postUnsubRef.current = subscribeToPost(postId, setPost);
    unsubRef.current = subscribeToComments(postId, (data) => {
      setComments(data);
      setLoading(false);
    });
    return () => {
      postUnsubRef.current?.();
      unsubRef.current?.();
    };
  }, [postId]);

  const handleReact = useCallback(async (reaction: ReactionType) => {
    if (!post) return;
    await reactToPost(postId, reaction);
    setPost(prev => {
      if (!prev) return prev;
      const prev2 = prev.userReaction;
      const newReactions = { ...prev.reactions };
      if (prev2 === reaction) {
        newReactions[prev2] = Math.max(0, newReactions[prev2] - 1);
        return { ...prev, reactions: newReactions, userReaction: undefined };
      }
      if (prev2) newReactions[prev2] = Math.max(0, newReactions[prev2] - 1);
      newReactions[reaction] = (newReactions[reaction] ?? 0) + 1;
      return { ...prev, reactions: newReactions, userReaction: reaction };
    });
    setShowReactions(false);
  }, [post, postId]);

  const handlePray = useCallback(async () => {
    if (!post) return;
    const wasNew = await prayForPost(postId);
    if (wasNew) setPost(prev => prev ? { ...prev, prayerCount: prev.prayerCount + 1, userPraying: true } : prev);
  }, [post, postId]);

  const handleSend = useCallback(async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    const text = reply.trim();
    setReply('');
    inputRef.current?.blur();
    try {
      await addComment(postId, text);
      setPost(prev => prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev);
    } catch {
      setReply(text);
    } finally {
      setSending(false);
    }
  }, [reply, sending, postId]);

  const totalReactions = post ? Object.values(post.reactions).reduce((a, b) => a + b, 0) : 0;

  const renderComment = useCallback(({ item }: { item: Comment }) => (
    <View style={[cm.bubble, glass, { marginBottom: 10 }]}>
      <View style={cm.row}>
        <View style={[cm.avatar, { backgroundColor: item.authorColor + '33', borderColor: item.authorColor + '55' }]}>
          <Text style={[cm.avatarLetter, { color: item.authorColor }]}>{item.authorName.charAt(0)}</Text>
        </View>
        <View style={cm.info}>
          <Text style={[cm.name, { color: textColor }]}>{item.authorName}</Text>
          <Text style={[cm.time, { color: mutedColor }]}>{relativeTime(item.createdAt)}</Text>
        </View>
      </View>
      <Text style={[cm.content, { color: subColor }]}>{item.content}</Text>
    </View>
  ), [glass, textColor, subColor, mutedColor]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: rootBg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

      {/* Nav header */}
      <View style={[s.navHeader, { paddingTop: insets.top + 6, borderBottomColor: dividerColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <View style={[s.backCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <Ionicons name="arrow-back" size={20} color={isDark ? 'rgba(255,255,255,0.85)' : 'rgba(24,18,8,0.85)'} />
          </View>
        </TouchableOpacity>
        <Text style={[s.navTitle, { color: textColor, fontFamily: SERIF }]}>Post</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={comments}
        keyExtractor={c => c.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={post ? (
          <View>
            {/* Post body */}
            <View style={[s.postCard, glass, { shadowColor: isDark ? '#000' : 'rgba(47,42,36,0.12)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.28 : 1, shadowRadius: 14, elevation: 5 }]}>
              {/* Author */}
              <View style={s.authorRow}>
                <View style={[s.avatar, { backgroundColor: post.authorColor + '33', borderColor: post.authorColor + '55' }]}>
                  <Text style={[s.avatarLetter, { color: post.authorColor }]}>{post.authorName.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.authorName, { color: textColor }]}>{post.authorName}</Text>
                  <Text style={[s.timeText, { color: mutedColor }]}>{relativeTime(post.createdAt)}</Text>
                </View>
                {POST_TYPE_META[post.type].label ? (
                  <View style={[s.typeBadge, {
                    backgroundColor: POST_TYPE_META[post.type].color + '20',
                    borderColor:     POST_TYPE_META[post.type].color + '50',
                  }]}>
                    <Text style={{ fontSize: 11 }}>{POST_TYPE_META[post.type].icon}</Text>
                    <Text style={[s.typeBadgeText, { color: POST_TYPE_META[post.type].color }]}>
                      {POST_TYPE_META[post.type].label}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Scripture ref */}
              {post.scriptureRef ? (
                <View style={[s.scriptureRef, { backgroundColor: 'rgba(201,169,107,0.10)', borderColor: 'rgba(201,169,107,0.28)' }]}>
                  <Ionicons name="book-outline" size={14} color={GOLD} />
                  <Text style={[s.scriptureText, { color: GOLD, fontFamily: SERIF }]}>{post.scriptureRef}</Text>
                </View>
              ) : null}

              {/* Content */}
              <Text style={[s.content, {
                color: subColor,
                fontFamily: post.type === 'scripture' ? SERIF : undefined,
                fontSize: post.type === 'scripture' ? 16 : 15,
                lineHeight: post.type === 'scripture' ? 28 : 24,
              }]}>
                {post.content}
              </Text>

              {/* Answered */}
              {post.answered && (
                <View style={[s.answeredBadge, { backgroundColor: '#7BA87B1E', borderColor: '#7BA87B50' }]}>
                  <Ionicons name="checkmark-circle" size={14} color="#7BA87B" />
                  <Text style={{ color: '#7BA87B', fontWeight: '700', fontSize: 12 }}>Prayer Answered!</Text>
                </View>
              )}

              {/* Reaction summary */}
              {totalReactions > 0 && (
                <View style={[s.reactionSummary, { borderTopColor: dividerColor }]}>
                  {Object.entries(post.reactions)
                    .filter(([, v]) => v > 0)
                    .map(([k, v]) => (
                      <View key={k} style={s.reactionCount}>
                        <Text style={{ fontSize: 14 }}>{REACTION_META[k as ReactionType].emoji}</Text>
                        <Text style={[s.reactionCountText, { color: mutedColor }]}>{v}</Text>
                      </View>
                    ))}
                </View>
              )}

              {/* Action row */}
              <View style={[s.actionRow, { borderTopColor: dividerColor }]}>
                <TouchableOpacity
                  style={[s.actionBtn, post.userReaction && { backgroundColor: 'rgba(201,169,107,0.10)' }]}
                  onPress={() => setShowReactions(v => !v)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 16 }}>
                    {post.userReaction ? REACTION_META[post.userReaction].emoji : '❤️'}
                  </Text>
                  <Text style={[s.actionLabel, { color: post.userReaction ? GOLD : mutedColor }]}>
                    {post.userReaction ? 'Liked' : 'React'}
                  </Text>
                </TouchableOpacity>

                {post.type === 'prayer' && (
                  <TouchableOpacity
                    style={[s.actionBtn, post.userPraying && { backgroundColor: '#7BA8C818' }]}
                    onPress={handlePray}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="hand-right-outline" size={17} color={post.userPraying ? '#7BA8C8' : mutedColor} />
                    <Text style={[s.actionLabel, { color: post.userPraying ? '#7BA8C8' : mutedColor }]}>
                      {post.userPraying ? 'Praying' : `Pray (${post.prayerCount})`}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={s.actionBtn}
                  onPress={() => inputRef.current?.focus()}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chatbubble-outline" size={17} color={mutedColor} />
                  <Text style={[s.actionLabel, { color: mutedColor }]}>
                    {post.commentCount} Comments
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Reaction picker */}
              {showReactions && (
                <View style={[s.reactionPicker, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)', borderColor: dividerColor }]}>
                  {REACTIONS.map(([key, r]) => (
                    <TouchableOpacity
                      key={key}
                      style={[s.reactionPickerBtn, post.userReaction === key && { backgroundColor: 'rgba(201,169,107,0.16)' }]}
                      onPress={() => handleReact(key)}
                    >
                      <Text style={{ fontSize: 22 }}>{r.emoji}</Text>
                      <Text style={[s.reactionPickerLabel, { color: mutedColor }]}>{r.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Comments header */}
            <Text style={[s.commentsHeader, { color: mutedColor }]}>
              {loading ? 'Loading comments…' : `${comments.length} Comment${comments.length !== 1 ? 's' : ''}`}
            </Text>
            {loading && <ActivityIndicator color={GOLD} style={{ marginBottom: 16 }} />}
          </View>
        ) : undefined}
        ListEmptyComponent={!loading ? (
          <View style={s.emptyComments}>
            <Text style={[s.emptyText, { color: mutedColor }]}>Be the first to comment 💬</Text>
          </View>
        ) : null}
        renderItem={renderComment}
      />

      {/* Reply input */}
      <View style={[s.replyBar, { backgroundColor: rootBg, borderTopColor: dividerColor, paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TextInput
          ref={inputRef}
          style={[s.replyInput, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)',
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.80)',
            color: textColor,
          }]}
          placeholder="Add a comment…"
          placeholderTextColor={mutedColor}
          value={reply}
          onChangeText={setReply}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[s.sendBtn, { backgroundColor: reply.trim() ? GOLD : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}
          onPress={handleSend}
          disabled={!reply.trim() || sending}
          activeOpacity={0.8}
        >
          {sending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Ionicons name="send" size={18} color={reply.trim() ? '#08071A' : mutedColor} />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const cm = StyleSheet.create({
  bubble:       { borderRadius: 16, padding: 14 },
  row:          { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar:       { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 13, fontWeight: '700' },
  info:         { flex: 1 },
  name:         { fontSize: 13, fontWeight: '700' },
  time:         { fontSize: 11, marginTop: 1 },
  content:      { fontSize: 14, lineHeight: 21 },
});

const s = StyleSheet.create({
  navHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn:    { padding: 0 },
  backCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  navTitle:   { flex: 1, fontSize: 20, fontWeight: '400', textAlign: 'center' },

  list: { paddingHorizontal: 18, paddingBottom: 20, paddingTop: 16 },

  postCard: { borderRadius: 20, padding: 18, marginBottom: 20 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  avatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 18, fontWeight: '700' },
  authorName:   { fontSize: 15, fontWeight: '700' },
  timeText:     { fontSize: 12, marginTop: 2 },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  scriptureRef: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
    marginBottom: 12, alignSelf: 'flex-start',
  },
  scriptureText:  { fontSize: 13, fontWeight: '700' },
  content:        { letterSpacing: 0.1 },
  answeredBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start',
  },
  reactionSummary: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    borderTopWidth: 1, paddingTop: 12, marginTop: 12,
  },
  reactionCount:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reactionCountText:  { fontSize: 13 },
  actionRow: {
    flexDirection: 'row', gap: 4,
    borderTopWidth: 1, paddingTop: 12, marginTop: 12,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, borderRadius: 10,
  },
  actionLabel: { fontSize: 12, fontWeight: '600' },
  reactionPicker: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    borderWidth: 1, borderRadius: 16,
    padding: 8, marginTop: 8,
  },
  reactionPickerBtn:   { alignItems: 'center', padding: 8, borderRadius: 12, gap: 2 },
  reactionPickerLabel: { fontSize: 10 },

  commentsHeader: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 12 },
  emptyComments:  { paddingVertical: 32, alignItems: 'center' },
  emptyText:      { fontSize: 14 },

  replyBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  replyInput: {
    flex: 1, borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
});
