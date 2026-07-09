import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator,
  Share, Clipboard, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../theme';
import { getSermon, toggleSermonFavorite } from '../../services/sermonService';
import type { SermonDraft, SermonPoint } from '../../types/sermon';

const TAB_BAR_CLEARANCE = 110;

const SECTION_NAV = [
  { id: 'prayer-open',   label: 'Prayer',       icon: 'heart-outline' },
  { id: 'intro',         label: 'Intro',         icon: 'megaphone-outline' },
  { id: 'history',       label: 'History',       icon: 'library-outline' },
  { id: 'points',        label: 'Main Points',   icon: 'list-outline' },
  { id: 'applications',  label: 'Apply',         icon: 'checkmark-circle-outline' },
  { id: 'reflection',    label: 'Reflect',       icon: 'chatbubble-ellipses-outline' },
  { id: 'memory',        label: 'Memory Verse',  icon: 'star-outline' },
  { id: 'invitation',    label: 'Invitation',    icon: 'hand-left-outline' },
  { id: 'prayer-close',  label: 'Close',         icon: 'moon-outline' },
];

// ─── Accordion — controlled from parent ──────────────────────────────────────

function AccordionSection({
  title, icon, children, isOpen, onToggle,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const t = useTheme();
  return (
    <View style={[ac.wrap, { backgroundColor: t.card }]}>
      <TouchableOpacity
        style={ac.header}
        onPress={onToggle}
        activeOpacity={0.78}
        hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }}
      >
        <View style={[ac.iconWrap, { backgroundColor: t.goldBg }]}>
          <Ionicons name={icon as any} size={15} color={t.gold} />
        </View>
        <Text style={[ac.title, { color: t.text }]}>{title}</Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={15}
          color={t.textMuted}
        />
      </TouchableOpacity>
      {isOpen && (
        <View style={[ac.body, { borderTopColor: t.divider }]}>
          {children}
        </View>
      )}
    </View>
  );
}

const ac = StyleSheet.create({
  wrap:   { borderRadius: 18, overflow: 'hidden' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 16, minHeight: 56,
  },
  iconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title:    { flex: 1, fontSize: 15, fontWeight: '700' },
  body:     { borderTopWidth: StyleSheet.hairlineWidth, padding: 18 },
});

// ─── Body text ────────────────────────────────────────────────────────────────

function BodyText({ text, style }: { text: string; style?: object }) {
  const t = useTheme();
  return <Text style={[{ color: t.textSub, fontSize: 14, lineHeight: 24 }, style]}>{text}</Text>;
}

function BulletList({ items }: { items: string[] }) {
  const t = useTheme();
  return (
    <View style={{ gap: 10 }}>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <View style={[bl.dot, { backgroundColor: t.gold }]} />
          <Text style={{ flex: 1, color: t.textSub, fontSize: 14, lineHeight: 23 }}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const bl = StyleSheet.create({
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 9 },
});

function NumberedList({ items }: { items: string[] }) {
  const t = useTheme();
  return (
    <View style={{ gap: 12 }}>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <View style={[nl.num, { backgroundColor: t.goldBg }]}>
            <Text style={[nl.numText, { color: t.gold }]}>{i + 1}</Text>
          </View>
          <Text style={{ flex: 1, color: t.textSub, fontSize: 14, lineHeight: 23 }}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const nl = StyleSheet.create({
  num:     { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  numText: { fontSize: 11, fontWeight: '800' },
});

// ─── Main Point Card ──────────────────────────────────────────────────────────

function MainPointCard({ point, index }: { point: SermonPoint; index: number }) {
  const t = useTheme();
  return (
    <View style={[mp.card, { backgroundColor: t.bg, borderColor: t.divider }]}>
      <View style={mp.cardHeader}>
        <View style={[mp.numBadge, { backgroundColor: t.gold }]}>
          <Text style={mp.numText}>{index + 1}</Text>
        </View>
        <Text style={[mp.heading, { color: t.text }]} numberOfLines={3}>{point.heading}</Text>
      </View>

      <View style={[mp.ref, { backgroundColor: t.goldBg }]}>
        <Ionicons name="book-outline" size={11} color={t.gold} />
        <Text style={[mp.refText, { color: t.gold }]}>{point.scripture}</Text>
      </View>

      <View style={mp.subSections}>
        <View style={[mp.subSection, { borderLeftColor: t.gold }]}>
          <Text style={[mp.subLabel, { color: t.textMuted }]}>EXPLANATION</Text>
          <Text style={[mp.subBody, { color: t.textSub }]}>{point.explanation}</Text>
        </View>
        <View style={[mp.subSection, { borderLeftColor: t.accent ?? '#7BB0F5' }]}>
          <Text style={[mp.subLabel, { color: t.textMuted }]}>ILLUSTRATION</Text>
          <Text style={[mp.subBody, { color: t.textSub }]}>{point.illustration}</Text>
        </View>
        <View style={[mp.subSection, { borderLeftColor: '#C47B8A' }]}>
          <Text style={[mp.subLabel, { color: t.textMuted }]}>APPLICATION</Text>
          <Text style={[mp.subBody, { color: t.textSub }]}>{point.application}</Text>
        </View>
      </View>

      <View style={[mp.questionBox, { backgroundColor: t.filterInactiveBg }]}>
        <Ionicons name="chatbubble-ellipses-outline" size={14} color={t.textSub} />
        <Text style={[mp.questionText, { color: t.textSub }]}>{point.reflectionQuestion}</Text>
      </View>
    </View>
  );
}

const mp = StyleSheet.create({
  card: {
    borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 18, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  numBadge:   { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  numText:    { color: '#08071A', fontWeight: '800', fontSize: 13 },
  heading:    { flex: 1, fontSize: 17, fontWeight: '800', lineHeight: 24, letterSpacing: -0.2 },
  ref: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  refText:     { fontSize: 12, fontWeight: '700' },
  subSections: { gap: 14 },
  subSection:  { borderLeftWidth: 3, paddingLeft: 14, gap: 5 },
  subLabel:    { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  subBody:     { fontSize: 14, lineHeight: 23 },
  questionBox: {
    borderRadius: 12, padding: 12,
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
  },
  questionText: { flex: 1, fontSize: 13, lineHeight: 21, fontStyle: 'italic' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SermonResultScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isDark = t.statusBar === 'light-content';

  const sermonId: string = route.params?.sermonId ?? '';

  const [sermon, setSermon]       = useState<SermonDraft | null>(null);
  const [loading, setLoading]     = useState(true);
  const [titleIndex, setTitleIndex] = useState(0);
  const [copied, setCopied]       = useState(false);
  const [activeNav, setActiveNav] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(['prayer-open', 'intro', 'points'])
  );

  const scrollRef    = useRef<ScrollView>(null);
  const navScrollRef = useRef<ScrollView>(null);
  const sectionYs    = useRef<Record<string, number>>({});
  const sectionsY    = useRef(0); // y-offset of the sections container in ScrollView
  const heroHeight   = useRef(0);

  useEffect(() => {
    getSermon(sermonId)
      .then(data => { setSermon(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sermonId]);

  const handleFavorite = useCallback(async () => {
    if (!sermon) return;
    await toggleSermonFavorite(sermon);
    setSermon(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : prev);
  }, [sermon]);

  const toggleSection = useCallback((id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const jumpToSection = useCallback((id: string) => {
    setActiveNav(id);
    setOpenSections(prev => new Set([...prev, id]));
    setTimeout(() => {
      const sectionLocalY = sectionYs.current[id];
      if (sectionLocalY !== undefined && scrollRef.current) {
        const absoluteY = sectionsY.current + sectionLocalY;
        scrollRef.current.scrollTo({ y: Math.max(0, absoluteY - 100), animated: true });
      }
    }, 60);
  }, []);

  const buildShareText = useCallback((): string => {
    if (!sermon) return '';
    const g = sermon.generated;
    const title = g.titles?.[titleIndex] ?? sermon.selectedTitle;
    const pts = (g.mainPoints ?? [])
      .map((p, i) => `POINT ${i + 1}: ${p.heading}\n${p.scripture}\n${p.explanation}`)
      .join('\n\n');
    return [
      `📖 ${title}`,
      `Theme: ${g.theme}`,
      `Key Scripture: ${g.keyScripture}`,
      '',
      pts,
      '',
      `Memory Verse: ${g.memoryVerse} — ${g.memoryVerseText}`,
      '',
      '— Generated with Bible Devotion App',
    ].join('\n');
  }, [sermon, titleIndex]);

  const handleShare = useCallback(async () => {
    try { await Share.share({ message: buildShareText() }); } catch { /* cancelled */ }
  }, [buildShareText]);

  const handleCopy = useCallback(() => {
    Clipboard.setString(buildShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [buildShareText]);

  const rootBg    = isDark ? '#060810' : '#DDD5C4';
  const textColor = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';
  const divColor  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const GOLD      = '#C9A96B';

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: rootBg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={GOLD} />
        <Text style={{ color: mutedColor, marginTop: 16, fontSize: 14 }}>Loading sermon…</Text>
      </View>
    );
  }

  if (!sermon) {
    return (
      <View style={{ flex: 1, backgroundColor: rootBg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Ionicons name="alert-circle-outline" size={48} color={mutedColor} />
        <Text style={{ color: textColor, marginTop: 16, fontSize: 17, fontWeight: '700' }}>Sermon not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: GOLD, fontSize: 15, fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const g = sermon.generated;
  const currentTitle = g.titles?.[titleIndex] ?? sermon.selectedTitle;
  const titleCount   = g.titles?.length ?? 1;

  return (
    <View style={{ flex: 1, backgroundColor: rootBg }}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />
        {/* Header */}
        <View style={[rs.header, { borderBottomColor: divColor, paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[rs.headerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', borderRadius: 11 }]}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={textColor} />
          </TouchableOpacity>
          <Text style={[rs.headerTitle, { color: mutedColor }]}>Your Sermon</Text>
          <TouchableOpacity
            onPress={handleFavorite}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[rs.headerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', borderRadius: 11 }]}
            activeOpacity={0.7}
          >
            <Ionicons
              name={sermon.isFavorite ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={sermon.isFavorite ? GOLD : mutedColor}
            />
          </TouchableOpacity>
        </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + TAB_BAR_CLEARANCE + 90 }}
      >
        {/* Hero — Title area */}
        <LinearGradient
          colors={isDark ? ['#14162A', '#0D0F1A'] : ['#EDE7D9', '#E4DBCB']}
          style={rs.hero}
          onLayout={(e) => { heroHeight.current = e.nativeEvent.layout.height; }}
        >
          {/* Meta chips */}
          <View style={rs.heroMeta}>
            <View style={[rs.metaChip, { backgroundColor: t.goldBg }]}>
              <Text style={[rs.metaChipText, { color: t.gold }]}>{sermon.audienceLabel}</Text>
            </View>
            <Text style={[rs.metaDot, { color: t.textMuted }]}>·</Text>
            <Text style={[rs.metaType, { color: t.textMuted }]}>{sermon.sermonType}</Text>
          </View>

          {/* Title tabs (if multiple) */}
          {titleCount > 1 && (
            <View style={rs.titleTabs}>
              {(g.titles ?? []).map((_, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setTitleIndex(i)}
                  style={[
                    rs.titleTab,
                    titleIndex === i
                      ? { backgroundColor: t.gold }
                      : { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
                  ]}
                >
                  <Text style={[
                    rs.titleTabText,
                    { color: titleIndex === i ? '#08071A' : t.textMuted },
                  ]}>Title {i + 1}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Title */}
          <Text style={[rs.title, { color: t.text, fontFamily: t.fontSerif }]} numberOfLines={4}>
            {currentTitle}
          </Text>

          {/* Theme */}
          <Text style={[rs.theme, { color: t.textSub }]}>{g.theme}</Text>

          {/* Info chips */}
          <View style={rs.infoChips}>
            <View style={[rs.infoChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]}>
              <Ionicons name="time-outline" size={11} color={t.textSub} />
              <Text style={[rs.infoChipText, { color: t.textSub }]}>{sermon.duration} min</Text>
            </View>
            <View style={[rs.infoChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]}>
              <Ionicons name="musical-notes-outline" size={11} color={t.textSub} />
              <Text style={[rs.infoChipText, { color: t.textSub }]}>{sermon.tone}</Text>
            </View>
            <View style={[rs.infoChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]}>
              <Ionicons name="book-outline" size={11} color={t.textSub} />
              <Text style={[rs.infoChipText, { color: t.textSub }]}>{g.keyScripture}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Big Idea */}
        <View style={[rs.bigIdea, { backgroundColor: t.goldBg }]}>
          <Text style={[rs.bigIdeaLabel, { color: t.gold }]}>THE BIG IDEA</Text>
          <Text style={[rs.bigIdeaText, { color: t.text, fontFamily: t.fontSerif }]}>{g.bigIdea}</Text>
        </View>

        {/* Section jump nav */}
        <ScrollView
          ref={navScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={rs.navRow}
          style={rs.navScroll}
        >
          {SECTION_NAV.map(sec => {
            const isActive = activeNav === sec.id;
            return (
              <TouchableOpacity
                key={sec.id}
                onPress={() => jumpToSection(sec.id)}
                style={[
                  rs.navPill,
                  {
                    backgroundColor: isActive ? t.goldBg : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                    borderColor: isActive ? t.gold : 'transparent',
                  },
                ]}
                activeOpacity={0.75}
              >
                <Ionicons name={sec.icon as any} size={12} color={isActive ? t.gold : t.textMuted} />
                <Text style={[rs.navPillText, { color: isActive ? t.gold : t.textSub }]}>{sec.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sections */}
        <View
          style={rs.sections}
          onLayout={(e) => { sectionsY.current = e.nativeEvent.layout.y; }}
        >

          {/* Opening Prayer */}
          <View
            onLayout={(e) => { sectionYs.current['prayer-open'] = e.nativeEvent.layout.y + (heroHeight.current || 0); }}
          >
            <AccordionSection
              title="Opening Prayer"
              icon="heart-outline"
              isOpen={openSections.has('prayer-open')}
              onToggle={() => toggleSection('prayer-open')}
            >
              <BodyText text={g.openingPrayer} style={{ fontStyle: 'italic' }} />
            </AccordionSection>
          </View>

          {/* Introduction */}
          <View onLayout={(e) => { sectionYs.current['intro'] = e.nativeEvent.layout.y; }}>
            <AccordionSection
              title="Introduction"
              icon="megaphone-outline"
              isOpen={openSections.has('intro')}
              onToggle={() => toggleSection('intro')}
            >
              <BodyText text={g.introduction} />
            </AccordionSection>
          </View>

          {/* Key Scripture */}
          <AccordionSection
            title="Key Scripture"
            icon="book-outline"
            isOpen={openSections.has('key-scripture')}
            onToggle={() => toggleSection('key-scripture')}
          >
            <View style={[rs.scriptureBox, { backgroundColor: t.goldBg }]}>
              <Text style={[rs.scriptureRef, { color: t.gold }]}>{g.keyScripture}</Text>
            </View>
            {(g.supportingScriptures?.length ?? 0) > 0 && (
              <>
                <Text style={[rs.subLabel, { color: t.textMuted }]}>SUPPORTING PASSAGES</Text>
                <BulletList items={g.supportingScriptures} />
              </>
            )}
          </AccordionSection>

          {/* Historical Background */}
          <View onLayout={(e) => { sectionYs.current['history'] = e.nativeEvent.layout.y; }}>
            <AccordionSection
              title="Historical Background"
              icon="library-outline"
              isOpen={openSections.has('history')}
              onToggle={() => toggleSection('history')}
            >
              <BodyText text={g.historicalBackground} />
            </AccordionSection>
          </View>

          {/* Main Points */}
          <View onLayout={(e) => { sectionYs.current['points'] = e.nativeEvent.layout.y; }}>
            <AccordionSection
              title={`Main Points  (${g.mainPoints?.length ?? 0})`}
              icon="list-outline"
              isOpen={openSections.has('points')}
              onToggle={() => toggleSection('points')}
            >
              <View style={{ gap: 16 }}>
                {(g.mainPoints ?? []).map((point, i) => (
                  <MainPointCard key={i} point={point} index={i} />
                ))}
              </View>
            </AccordionSection>
          </View>

          {/* Practical Applications */}
          <View onLayout={(e) => { sectionYs.current['applications'] = e.nativeEvent.layout.y; }}>
            <AccordionSection
              title="Practical Applications"
              icon="checkmark-circle-outline"
              isOpen={openSections.has('applications')}
              onToggle={() => toggleSection('applications')}
            >
              <NumberedList items={g.practicalApplications ?? []} />
            </AccordionSection>
          </View>

          {/* Reflection Questions */}
          <View onLayout={(e) => { sectionYs.current['reflection'] = e.nativeEvent.layout.y; }}>
            <AccordionSection
              title="Reflection Questions"
              icon="chatbubble-ellipses-outline"
              isOpen={openSections.has('reflection')}
              onToggle={() => toggleSection('reflection')}
            >
              <NumberedList items={g.reflectionQuestions ?? []} />
            </AccordionSection>
          </View>

          {/* Memory Verse */}
          <View onLayout={(e) => { sectionYs.current['memory'] = e.nativeEvent.layout.y; }}>
            <AccordionSection
              title="Memory Verse"
              icon="star-outline"
              isOpen={openSections.has('memory')}
              onToggle={() => toggleSection('memory')}
            >
              <View style={[rs.memoryBox, { backgroundColor: t.goldBg }]}>
                <Text style={[rs.memoryRef, { color: t.gold }]}>{g.memoryVerse}</Text>
                <Text style={[rs.memoryText, { color: t.text, fontFamily: t.fontSerif }]}>
                  "{g.memoryVerseText}"
                </Text>
              </View>
            </AccordionSection>
          </View>

          {/* Invitation */}
          <View onLayout={(e) => { sectionYs.current['invitation'] = e.nativeEvent.layout.y; }}>
            <AccordionSection
              title="Invitation / Response"
              icon="hand-left-outline"
              isOpen={openSections.has('invitation')}
              onToggle={() => toggleSection('invitation')}
            >
              <BodyText text={g.invitation} />
            </AccordionSection>
          </View>

          {/* Closing Prayer */}
          <View onLayout={(e) => { sectionYs.current['prayer-close'] = e.nativeEvent.layout.y; }}>
            <AccordionSection
              title="Closing Prayer"
              icon="moon-outline"
              isOpen={openSections.has('prayer-close')}
              onToggle={() => toggleSection('prayer-close')}
            >
              <BodyText text={g.closingPrayer} style={{ fontStyle: 'italic' }} />
            </AccordionSection>
          </View>

          {/* Worship Song Suggestions */}
          {(g.worshipSuggestions?.length ?? 0) > 0 && (
            <AccordionSection
              title="Worship Song Suggestions"
              icon="musical-notes-outline"
              isOpen={openSections.has('worship')}
              onToggle={() => toggleSection('worship')}
            >
              <BulletList items={g.worshipSuggestions} />
            </AccordionSection>
          )}

          {/* Discussion Guide */}
          {(g.discussionQuestions?.length ?? 0) > 0 && (
            <AccordionSection
              title="Discussion Guide"
              icon="people-outline"
              isOpen={openSections.has('discussion')}
              onToggle={() => toggleSection('discussion')}
            >
              <NumberedList items={g.discussionQuestions} />
            </AccordionSection>
          )}

          {/* Integrity notice */}
          <View style={[rs.integrity, { backgroundColor: t.accentBg ?? t.filterInactiveBg }]}>
            <Ionicons name="shield-checkmark-outline" size={15} color={t.accent ?? t.textMuted} />
            <Text style={[rs.integrityText, { color: t.accent ?? t.textSub }]}>
              AI assists your preparation. God's Spirit and your pastoral heart complete it. Review this sermon prayerfully before preaching.
            </Text>
          </View>

        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={[rs.bottomBar, {
        backgroundColor: rootBg,
        borderTopColor: divColor,
        paddingBottom: insets.bottom + TAB_BAR_CLEARANCE + 8,
      }]}>
        <TouchableOpacity
          style={[rs.actionBtn, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.65)',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.82)',
          }]}
          onPress={handleCopy}
          activeOpacity={0.78}
        >
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={17} color={copied ? GOLD : textColor} />
          <Text style={[rs.actionBtnText, { color: copied ? GOLD : textColor }]}>
            {copied ? 'Copied!' : 'Copy'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[rs.actionBtn, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.65)',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.82)',
          }]}
          onPress={handleShare}
          activeOpacity={0.78}
        >
          <Ionicons name="share-outline" size={17} color={textColor} />
          <Text style={[rs.actionBtnText, { color: textColor }]}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[rs.actionBtn, { backgroundColor: 'rgba(201,169,107,0.12)', borderWidth: 1, borderColor: 'rgba(201,169,107,0.30)', flex: 1.4 }]}
          onPress={() => navigation.navigate('SermonWizard')}
          activeOpacity={0.78}
        >
          <Ionicons name="add-circle-outline" size={17} color={GOLD} />
          <Text style={[rs.actionBtnText, { color: GOLD }]}>New Sermon</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const rs = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 15, fontWeight: '600' },
  headerBtn:   { padding: 6, width: 40, alignItems: 'center' },

  hero:       { marginHorizontal: 16, marginTop: 14, borderRadius: 22, padding: 22, gap: 14 },
  heroMeta:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaChip:   { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  metaChipText: { fontSize: 11, fontWeight: '700' },
  metaDot:    { fontSize: 14 },
  metaType:   { fontSize: 12, fontWeight: '500' },

  titleTabs: { flexDirection: 'row', gap: 6 },
  titleTab:  { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  titleTabText: { fontSize: 12, fontWeight: '700' },

  title: { fontSize: 28, fontWeight: '700', lineHeight: 38, letterSpacing: -0.5 },
  theme: { fontSize: 13, lineHeight: 20, fontStyle: 'italic' },

  infoChips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  infoChip:  {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5,
  },
  infoChipText: { fontSize: 11, fontWeight: '500' },

  bigIdea: {
    marginHorizontal: 16, marginTop: 12, borderRadius: 16,
    padding: 18, gap: 8,
  },
  bigIdeaLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.8 },
  bigIdeaText:  { fontSize: 17, lineHeight: 28, fontWeight: '600' },

  navScroll: { marginTop: 12 },
  navRow:    { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  navPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, borderWidth: 1.5,
    paddingHorizontal: 13, paddingVertical: 8,
  },
  navPillText: { fontSize: 12, fontWeight: '600' },

  sections: { paddingHorizontal: 16, gap: 10, marginTop: 14 },

  scriptureBox: { borderRadius: 12, padding: 14, marginBottom: 12 },
  scriptureRef: { fontSize: 16, fontWeight: '700' },
  subLabel:     { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 10, marginTop: 6 },

  memoryBox: { borderRadius: 16, padding: 18, gap: 10 },
  memoryRef: { fontSize: 13, fontWeight: '700' },
  memoryText: { fontSize: 20, lineHeight: 32, fontWeight: '400' },

  integrity: {
    borderRadius: 14, padding: 14,
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
  },
  integrityText: { flex: 1, fontSize: 12, lineHeight: 19 },

  bottomBar: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 14, paddingVertical: 13,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
});
