import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Share, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { useTheme } from '../../theme';
import { getHymnById } from '../../services/hymnService';
import { resolveHymnAudio, type ResolvedAudio } from '../../services/hymnAudioResolver';
import { useFavorites } from '../../hooks/useFavorites';
import { RootStackParamList } from '../../types/navigation';

type ReaderRoute = RouteProp<RootStackParamList, 'HymnReader'>;
type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'buffering' | 'error';

const THUMB_SIZE = 12;

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function HymnReaderScreen() {
  const t          = useTheme();
  const navigation = useNavigation();
  const route      = useRoute<ReaderRoute>();
  const { hymnId } = route.params;

  const hymn = getHymnById(hymnId);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(hymnId);

  // ── Audio resolution ──────────────────────────────────────────────────────
  const [resolved,  setResolved]  = useState<ResolvedAudio | null>(null);
  const [resolving, setResolving] = useState(true);

  // ── Playback state ────────────────────────────────────────────────────────
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [positionMs,  setPositionMs]  = useState(0);
  const [durationMs,  setDurationMs]  = useState(0);
  const [repeat,      setRepeat]      = useState(false);
  const [trackWidth,  setTrackWidth]  = useState(0);

  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let alive = true;
    setResolving(true);
    setResolved(null);
    setPlayerState('idle');
    setPositionMs(0);
    setDurationMs(0);
    soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;

    resolveHymnAudio(hymnId).then(r => {
      if (alive) { setResolved(r); setResolving(false); }
    });
    return () => {
      alive = false;
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    };
  }, [hymnId]);

  const onPlaybackStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if ((status as any).error) setPlayerState('error');
      return;
    }
    setPositionMs(status.positionMillis);
    setDurationMs(status.durationMillis ?? 0);
    if (status.isBuffering && !status.isPlaying) {
      setPlayerState('buffering');
    } else if (status.isPlaying) {
      setPlayerState('playing');
    }
    if (status.didJustFinish) {
      if (repeat) {
        soundRef.current?.replayAsync().catch(() => {});
      } else {
        setPlayerState('idle');
        setPositionMs(0);
        soundRef.current?.setPositionAsync(0).catch(() => {});
      }
    }
  }, [repeat]);

  useEffect(() => {
    soundRef.current?.setOnPlaybackStatusUpdate(onPlaybackStatus);
  }, [onPlaybackStatus]);

  const handlePlay = useCallback(async () => {
    if (!resolved || resolved.type === 'none') return;
    try {
      if (playerState === 'paused' && soundRef.current) {
        await soundRef.current.playAsync();
        return;
      }
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setPlayerState('loading');
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
      const { sound } = await Audio.Sound.createAsync(
        resolved.source,
        { shouldPlay: true },
        onPlaybackStatus,
      );
      soundRef.current = sound;
    } catch (err) {
      if (__DEV__) console.error('[HymnPlayer]', err);
      setPlayerState('error');
    }
  }, [resolved, playerState, onPlaybackStatus]);

  const handlePause = useCallback(async () => {
    await soundRef.current?.pauseAsync().catch(() => {});
    setPlayerState('paused');
  }, []);

  const handleStop = useCallback(async () => {
    if (!soundRef.current) return;
    await soundRef.current.stopAsync().catch(() => {});
    await soundRef.current.setPositionAsync(0).catch(() => {});
    setPlayerState('idle');
    setPositionMs(0);
  }, []);

  const handleRetry = useCallback(() => {
    setResolving(true);
    setResolved(null);
    resolveHymnAudio(hymnId).then(r => { setResolved(r); setResolving(false); });
  }, [hymnId]);

  const handleSeekTouch = useCallback((e: any) => {
    if (!durationMs || !trackWidth) return;
    const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / trackWidth));
    const ms = ratio * durationMs;
    setPositionMs(ms);
    soundRef.current?.setPositionAsync(ms).catch(() => {});
  }, [durationMs, trackWidth]);

  const handleShare = useCallback(async () => {
    if (!hymn) return;
    const lines = [
      hymn.title,
      `— ${hymn.author}, ${hymn.year}`,
      '',
      ...hymn.verses.flatMap((v, i) => [`Verse ${i + 1}`, ...v.lines, '']),
      ...(hymn.chorus ? ['Chorus', ...hymn.chorus.lines] : []),
    ].join('\n');
    Share.share({ message: lines });
  }, [hymn]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const progress  = durationMs > 0 ? positionMs / durationMs : 0;
  const fillWidth = trackWidth > 0 ? progress * trackWidth : 0;
  const thumbLeft = trackWidth > 0
    ? Math.max(0, Math.min(trackWidth - THUMB_SIZE, progress * trackWidth - THUMB_SIZE / 2))
    : 0;
  const hasAudio  = !resolving && resolved !== null && resolved.type !== 'none';
  const isPlaying = playerState === 'playing' || playerState === 'buffering';
  const isLoading = playerState === 'loading' || playerState === 'buffering';
  const showBar   = resolving || hasAudio ||
    (resolved?.type === 'none' && resolved.reason === 'network-error');

  if (!hymn) {
    return (
      <View style={[s.root, { backgroundColor: t.bg }]}>
        <SafeAreaView style={s.centered} edges={['top']}>
          <Text style={{ color: t.textMuted }}>Hymn not found.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: t.gold, marginTop: 12 }}>Go back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* ── Nav row ──────────────────────────────────────────────────────── */}
        <View style={s.navRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={26} color={t.text} />
          </TouchableOpacity>
          <View style={s.navRight}>
            <TouchableOpacity
              onPress={() => toggleFavorite(hymnId)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={favorited ? 'heart' : 'heart-outline'}
                size={22}
                color={favorited ? '#E05C5C' : t.text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={22} color={t.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Player bar (top) ─────────────────────────────────────────────── */}
        {showBar && (
          <View style={[s.playerBar, { backgroundColor: t.card, borderColor: t.divider }]}>

            {/* Resolving */}
            {resolving && (
              <View style={s.barCenter}>
                <ActivityIndicator size="small" color={t.gold} />
                <Text style={[s.barStatusText, { color: t.textMuted }]}>Loading…</Text>
              </View>
            )}

            {/* Network error */}
            {!resolving && !hasAudio && (
              <View style={s.barCenter}>
                <Ionicons name="musical-notes-outline" size={14} color={t.textMuted} />
                <Text style={[s.barStatusText, { color: t.textMuted }]}>
                  Could not load audio.
                </Text>
                <TouchableOpacity onPress={handleRetry} activeOpacity={0.7}>
                  <Text style={[s.barStatusText, { color: t.gold, fontWeight: '600' }]}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Full player */}
            {!resolving && hasAudio && (
              <>
                {/* Repeat */}
                <TouchableOpacity
                  onPress={() => setRepeat(r => !r)}
                  style={s.barBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="repeat" size={17} color={repeat ? t.gold : t.textMuted} />
                  {repeat && <View style={[s.repeatDot, { backgroundColor: t.gold }]} />}
                </TouchableOpacity>

                {/* Stop */}
                <TouchableOpacity
                  onPress={handleStop}
                  disabled={playerState === 'idle'}
                  style={[s.barBtn, { opacity: playerState === 'idle' ? 0.25 : 1 }]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="stop" size={17} color={t.text} />
                </TouchableOpacity>

                {/* Time — seek bar — time */}
                <Text style={[s.barTime, { color: t.textMuted }]}>{formatMs(positionMs)}</Text>
                <View
                  style={[s.barTrack, { backgroundColor: t.divider }]}
                  onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
                  onStartShouldSetResponder={() => durationMs > 0}
                  onMoveShouldSetResponder={() => durationMs > 0}
                  onResponderGrant={handleSeekTouch}
                  onResponderMove={handleSeekTouch}
                >
                  <View style={[s.barFill, { backgroundColor: t.gold, width: fillWidth }]} />
                  {trackWidth > 0 && (
                    <View style={[s.barThumb, { backgroundColor: t.gold, left: thumbLeft }]} />
                  )}
                </View>
                <Text style={[s.barTime, { color: t.textMuted, textAlign: 'right' }]}>
                  {durationMs > 0 ? formatMs(durationMs) : '--:--'}
                </Text>

                {/* Play / Pause — bare icon, no circle (matches Bible page) */}
                <TouchableOpacity
                  onPress={isPlaying ? handlePause : (playerState === 'error' ? () => setPlayerState('idle') : handlePlay)}
                  disabled={isLoading}
                  style={s.barBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={t.gold} />
                  ) : playerState === 'error' ? (
                    <Ionicons name="refresh" size={18} color="#C87B7B" />
                  ) : isPlaying ? (
                    <Ionicons name="pause" size={18} color={t.text} />
                  ) : (
                    <Ionicons name="play" size={18} color={t.text} />
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* ── Lyrics ───────────────────────────────────────────────────────── */}
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.hymnHeader}>
            <View style={[s.numberBadge, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}>
              <Text style={[s.numberText, { color: t.gold }]}>#{hymn.number}</Text>
            </View>
            <Text style={[s.title, { color: t.text }]}>{hymn.title}</Text>
            <Text style={[s.meta, { color: t.textSub }]}>{hymn.author} · {hymn.year}</Text>

            <View style={s.tagRow}>
              <View style={[s.catTag, { backgroundColor: t.accentBg, borderColor: t.accentBorder }]}>
                <Text style={[s.catTagText, { color: t.accent }]}>{hymn.category}</Text>
              </View>
              {hymn.tags.map(tag => (
                <View key={tag} style={[s.tag, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
                  <Text style={[s.tagText, { color: t.textMuted }]}>{tag}</Text>
                </View>
              ))}
            </View>

            <View style={[s.rule, { backgroundColor: t.divider }]} />
          </View>

          <View style={s.lyrics}>
            {hymn.verses.map((verse, vi) => (
              <View key={vi} style={s.verseBlock}>
                <Text style={[s.verseLabel, { color: t.textMuted }]}>
                  {hymn.verses.length > 1 ? `Verse ${vi + 1}` : 'Verse'}
                </Text>
                {verse.lines.map((line, li) => (
                  <Text key={li} style={[s.verseLine, { color: t.text, fontFamily: t.fontSerif }]}>
                    {line}
                  </Text>
                ))}
                {hymn.chorus && vi < hymn.verses.length - 1 && (
                  <View style={[s.chorusBlock, { borderLeftColor: t.gold }]}>
                    <Text style={[s.chorusLabel, { color: t.gold }]}>Chorus</Text>
                    {hymn.chorus.lines.map((line, li) => (
                      <Text key={li} style={[s.chorusLine, { color: t.textSub, fontFamily: t.fontSerif }]}>
                        {line}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}

            {hymn.chorus && (
              <View style={[s.chorusBlock, { borderLeftColor: t.gold }]}>
                <Text style={[s.chorusLabel, { color: t.gold }]}>Chorus</Text>
                {hymn.chorus.lines.map((line, li) => (
                  <Text key={li} style={[s.chorusLine, { color: t.textSub, fontFamily: t.fontSerif }]}>
                    {line}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4,
  },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },

  // ── Player bar ────────────────────────────────────────────────────────────
  playerBar: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderBottomWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10,
    gap: 6,
  },
  barCenter: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  barStatusText: { fontSize: 12 },
  barBtn: {
    paddingHorizontal: 8, paddingVertical: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  barTime: { fontSize: 11, fontVariant: ['tabular-nums'], minWidth: 32 },
  barTrack: {
    flex: 1, height: 3, borderRadius: 2, overflow: 'visible',
  },
  barFill:  { height: '100%', borderRadius: 2 },
  barThumb: {
    position: 'absolute',
    width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: THUMB_SIZE / 2,
    top: -(THUMB_SIZE / 2 - 1.5),
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
  repeatDot: {
    width: 4, height: 4, borderRadius: 2,
    position: 'absolute', bottom: 2,
  },

  // ── Lyrics ────────────────────────────────────────────────────────────────
  scroll: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 60 },

  hymnHeader:  { marginBottom: 24 },
  numberBadge: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12,
  },
  numberText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  title:      { fontSize: 28, fontWeight: '800', letterSpacing: -0.4, lineHeight: 34, marginBottom: 6 },
  meta:       { fontSize: 13, marginBottom: 14 },

  tagRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catTag:     { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  catTagText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  tag:        { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tagText:    { fontSize: 10, fontWeight: '600', letterSpacing: 0.6 },

  rule:   { height: 1 },
  lyrics: { gap: 28 },

  verseBlock: { gap: 4 },
  verseLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 6 },
  verseLine:  { fontSize: 17, lineHeight: 30, letterSpacing: 0.1 },

  chorusBlock: { borderLeftWidth: 3, paddingLeft: 14, marginTop: 14, gap: 4 },
  chorusLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 4 },
  chorusLine:  { fontSize: 16, lineHeight: 28, fontStyle: 'italic', letterSpacing: 0.1 },
});
