import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Animated,
  Easing,
  Keyboard,
  Platform,
  useColorScheme,
  Share,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getScriptureInsights } from '../../services/appApi';
import { askScripture } from '../../services/scriptureChatService';
import { useTheme } from '../../theme';
import type { AppTheme } from '../../theme';
import type { ScriptureInsightsNavParams } from '../../types/scriptureChat';

type ScriptureInsights = Awaited<ReturnType<typeof getScriptureInsights>>;
type InsightSectionKey = 'reflection' | 'themes' | 'application' | 'prayer' | 'study';
type Message = { id: string; role: 'user' | 'assistant'; content: string; timestamp: string };

function cleanText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function wordCount(text: string) {
  return cleanText(text).split(' ').filter(Boolean).length;
}

function estimateReadingTime(insights: ScriptureInsights | null) {
  if (!insights) return '1 min read';
  const words = [
    insights.summary,
    insights.theologicalInsight,
    insights.historicalContext,
    insights.applicationToday,
    insights.prayerFocus,
    ...insights.keyThemes,
  ].map(wordCount).reduce((sum, n) => sum + n, 0);
  const minutes = Math.max(1, Math.round(words / 155));
  return `${minutes} min read`;
}

function InsightChip({
  text,
  active,
  onPress,
  palette,
}: {
  text: string;
  active?: boolean;
  onPress: () => void;
  palette: ReturnType<typeof createPalette>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.chip,
        {
          backgroundColor: active ? palette.glassStrong : palette.glass,
          borderColor: active ? palette.goldBorder : palette.border,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? palette.gold : palette.textSub }]}>{text}</Text>
    </TouchableOpacity>
  );
}

function createPalette(scheme: 'light' | 'dark', theme: AppTheme) {
  if (scheme === 'dark') {
    return {
      bg: '#060810',
      bgAlt: '#0D0F1A',
      mist: '#12304B',
      glow: 'rgba(112, 153, 207, 0.22)',
      glowSoft: 'rgba(201, 169, 107, 0.10)',
      text: '#F5F2EA',
      textSub: 'rgba(245,242,234,0.72)',
      textMuted: 'rgba(245,242,234,0.48)',
      gold: '#D8B36C',
      goldBorder: 'rgba(216,179,108,0.26)',
      border: 'rgba(255,255,255,0.08)',
      glass: 'rgba(255,255,255,0.045)',
      glassStrong: 'rgba(255,255,255,0.075)',
      shadow: 'rgba(0,0,0,0.22)',
      divider: 'rgba(255,255,255,0.08)',
      inputBg: 'rgba(255,255,255,0.06)',
      inputBorder: 'rgba(255,255,255,0.10)',
      pillBg: 'rgba(216,179,108,0.10)',
      pillBorder: 'rgba(216,179,108,0.18)',
      subtleGold: 'rgba(216,179,108,0.30)',
      statusBar: 'light-content' as const,
      goldText: theme.gold,
    };
  }

  return {
    bg: '#F5EFE6',
    bgAlt: '#FBF7F1',
    mist: '#E8DDCF',
    glow: 'rgba(230, 192, 122, 0.22)',
    glowSoft: 'rgba(198, 166, 101, 0.10)',
    text: '#2E251C',
    textSub: 'rgba(46,37,28,0.70)',
    textMuted: 'rgba(46,37,28,0.44)',
    gold: '#C8A15A',
    goldBorder: 'rgba(200,161,90,0.24)',
    border: 'rgba(46,37,28,0.08)',
    glass: 'rgba(255,255,255,0.55)',
    glassStrong: 'rgba(255,255,255,0.76)',
    shadow: 'rgba(120,96,58,0.12)',
    divider: 'rgba(46,37,28,0.08)',
    inputBg: 'rgba(255,255,255,0.68)',
    inputBorder: 'rgba(46,37,28,0.09)',
    pillBg: 'rgba(200,161,90,0.10)',
    pillBorder: 'rgba(200,161,90,0.18)',
    subtleGold: 'rgba(200,161,90,0.25)',
    statusBar: 'dark-content' as const,
    goldText: theme.gold,
  };
}

function BackgroundWash({ palette }: { palette: ReturnType<typeof createPalette> }) {
  const driftA = useRef(new Animated.Value(0)).current;
  const driftB = useRef(new Animated.Value(0)).current;
  const driftC = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (value: Animated.Value, duration: number, offset: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(offset),
          Animated.timing(value, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };

    loop(driftA, 18000, 0);
    loop(driftB, 22000, 400);
    loop(driftC, 26000, 800);
  }, [driftA, driftB, driftC]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <LinearGradient
        colors={[palette.bg, palette.bgAlt, palette.bg]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.View
        style={[
          bw.wash,
          {
            opacity: driftA.interpolate({ inputRange: [0, 1], outputRange: [0.38, 0.56] }),
            transform: [
              {
                translateY: driftA.interpolate({ inputRange: [0, 1], outputRange: [-8, 18] }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[palette.glow, 'rgba(0,0,0,0)']}
          locations={[0, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      <Animated.View
        style={[
          bw.lowerWash,
          {
            opacity: driftB.interpolate({ inputRange: [0, 1], outputRange: [0.24, 0.38] }),
            transform: [
              {
                translateY: driftB.interpolate({ inputRange: [0, 1], outputRange: [16, -12] }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0)', palette.glowSoft]}
          locations={[0, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      <BlurView intensity={18} tint={palette.statusBar === 'dark-content' ? 'light' : 'dark'} style={StyleSheet.absoluteFillObject} />
      <Animated.View
        style={[
          bw.mist,
          {
            opacity: driftC.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.2] }),
            transform: [
              {
                translateX: driftC.interpolate({ inputRange: [0, 1], outputRange: [-10, 14] }),
              },
              {
                translateY: driftC.interpolate({ inputRange: [0, 1], outputRange: [8, -8] }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[palette.mist, 'rgba(0,0,0,0)']}
          locations={[0, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      {[0, 1, 2].map((idx) => (
        <Animated.View
          key={idx}
          style={[
            bw.mote,
            bw[`mote${idx + 1}` as const],
            {
              opacity: driftA.interpolate({
                inputRange: [0, 1],
                outputRange: [0.08 + idx * 0.01, 0.14 + idx * 0.01],
              }),
              transform: [
                {
                  translateY: (idx === 0 ? driftA : idx === 1 ? driftB : driftC).interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, idx % 2 === 0 ? -16 : 16],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

function ExpandableSection({
  title,
  icon,
  active,
  onPress,
  palette,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  active: boolean;
  onPress: () => void;
  palette: ReturnType<typeof createPalette>;
  children: React.ReactNode;
}) {
  const fade = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: active ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [active, fade]);

  return (
      <View style={[styles.section, { borderBottomColor: palette.divider }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderLeft}>
          <Ionicons name={icon} size={14} color={palette.gold} />
          <Text style={[styles.sectionTitle, { color: palette.text }]}>{title}</Text>
        </View>
        <Ionicons
          name={active ? 'chevron-up' : 'chevron-down'}
          size={15}
          color={palette.textMuted}
        />
      </TouchableOpacity>
      {active && (
        <Animated.View style={{ opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
          <View style={styles.sectionBody}>{children}</View>
        </Animated.View>
      )}
    </View>
  );
}

export default function ScriptureInsightsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as ScriptureInsightsNavParams;
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'dark';
  const theme = useTheme();
  const palette = useMemo(() => createPalette(scheme, theme), [scheme, theme]);

  const [insights, setInsights] = useState<ScriptureInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<InsightSectionKey>('reflection');
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Dock hide/show on scroll
  const dockSlide       = useRef(new Animated.Value(0)).current;
  const lastScrollY     = useRef(0);
  const isDockVisible   = useRef(true);
  const keyboardOpenRef = useRef(false);

  // Glass → solid transition on focus
  const focusAnim = useRef(new Animated.Value(0)).current;

  const dockBgColors = useMemo(
    () => scheme === 'dark'
      ? ['rgba(0,0,0,0)', 'rgba(7,17,31,1)']
      : ['rgba(0,0,0,0)', 'rgba(245,239,230,1)'],
    [scheme],
  );
  const inputBgColors = useMemo(
    () => scheme === 'dark'
      ? ['rgba(255,255,255,0.06)', 'rgba(20,24,42,1)']
      : ['rgba(255,255,255,0.68)', 'rgba(255,255,255,1)'],
    [scheme],
  );

  const animDockBg  = useMemo(
    () => focusAnim.interpolate({ inputRange: [0, 1], outputRange: dockBgColors }),
    [focusAnim, dockBgColors],
  );
  const animInputBg = useMemo(
    () => focusAnim.interpolate({ inputRange: [0, 1], outputRange: inputBgColors }),
    [focusAnim, inputBgColors],
  );

  const handleFocus = useCallback(() => {
    Animated.timing(focusAnim, {
      toValue: 1, duration: 220,
      easing: Easing.out(Easing.quad), useNativeDriver: false,
    }).start();
  }, [focusAnim]);

  const handleBlur = useCallback(() => {
    Animated.timing(focusAnim, {
      toValue: 0, duration: 200,
      easing: Easing.out(Easing.quad), useNativeDriver: false,
    }).start();
  }, [focusAnim]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      keyboardOpenRef.current = true;
      // always show dock when keyboard opens
      if (!isDockVisible.current) {
        isDockVisible.current = true;
        Animated.timing(dockSlide, { toValue: 0, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      }
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      keyboardOpenRef.current = false;
    });
    return () => { show.remove(); hide.remove(); };
  }, [dockSlide]);

  const handleScroll = useCallback((e: any) => {
    if (keyboardOpenRef.current) return;
    const y: number = e.nativeEvent.contentOffset.y;
    const dy = y - lastScrollY.current;
    lastScrollY.current = y;

    if (dy > 5 && isDockVisible.current) {
      isDockVisible.current = false;
      Animated.timing(dockSlide, {
        toValue: 150,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (dy < -5 && !isDockVisible.current) {
      isDockVisible.current = true;
      Animated.timing(dockSlide, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [dockSlide]);

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    getScriptureInsights({
      reference: params.reference,
      text: params.context,
      type: params.contextType === 'chapter' ? 'chapter' : 'verse',
    })
      .then((data) => {
        if (cancelled) return;
        setInsights(data);
        setActiveSection('reflection');
      })
      .catch(() => {
        if (cancelled) return;
        setError('Unable to prepare the reflection right now.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params.context, params.contextType, params.reference]);

  const primaryReflection = useMemo(() => {
    if (!insights) return '';
    return cleanText(insights.theologicalInsight || insights.summary);
  }, [insights]);

  const readingTime = useMemo(() => estimateReadingTime(insights), [insights]);
  const relatedVerses = insights?.crossReferences ?? [];

  const sendPrompt = useCallback(async (raw: string) => {
    const prompt = raw.trim();
    if (!prompt || sending) return;

    const userMsg: Message = {
      id: `${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString(),
    };

    const nextConversation = [...conversation, userMsg];
    setConversation(nextConversation);
    setInputText('');
    setSending(true);

    try {
      const assistantText = await askScripture(
        params.reference,
        [
          `Passage context: ${params.context}`,
          insights ? `Primary reflection: ${primaryReflection}` : '',
          insights ? `Summary: ${insights.summary}` : '',
        ].filter(Boolean).join('\n\n'),
        nextConversation,
      );

      setConversation((current) => [
        ...current,
        {
          id: `${Date.now() + 1}`,
          role: 'assistant',
          content: assistantText,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      setConversation((current) => [
        ...current,
        {
          id: `${Date.now() + 1}`,
          role: 'assistant',
          content: 'I could not reach the reflection service just now. Please try again in a moment.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [conversation, insights, params.context, params.reference, primaryReflection, sending]);

  const sections: Array<{
    key: InsightSectionKey;
    title: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    body: React.ReactNode;
  }> = useMemo(() => {
    if (!insights) return [];

    return [
      {
        key: 'reflection',
        title: 'Reflection',
        icon: 'sparkles-outline',
        body: (
          <Text style={[styles.bodyText, { color: palette.text }]}>
            {insights.summary}
          </Text>
        ),
      },
      {
        key: 'themes',
        title: 'Themes',
        icon: 'pricetags-outline',
        body: (
          <View style={styles.themeWrap}>
            {insights.keyThemes.map((item) => (
              <View key={item} style={[styles.themePill, { backgroundColor: palette.pillBg, borderColor: palette.pillBorder }]}>
                <Text style={[styles.themePillText, { color: palette.gold }]}>{item}</Text>
              </View>
            ))}
          </View>
        ),
      },
      {
        key: 'application',
        title: 'Personal Application',
        icon: 'leaf-outline',
        body: (
          <Text style={[styles.bodyText, { color: palette.text }]}>
            {insights.applicationToday}
          </Text>
        ),
      },
      {
        key: 'prayer',
        title: 'Prayer',
        icon: 'heart-outline',
        body: (
          <View style={[styles.prayerShell, { backgroundColor: palette.glass, borderColor: palette.border }]}>
            <Ionicons name="moon-outline" size={12} color={palette.gold} />
            <Text style={[styles.prayerText, { color: palette.text }]}>
              {insights.prayerFocus}
            </Text>
          </View>
        ),
      },
      {
        key: 'study',
        title: 'Study Deeper',
        icon: 'book-outline',
        body: (
          <View style={{ gap: 14 }}>
            <Text style={[styles.bodyText, { color: palette.text }]}>
              {insights.historicalContext}
            </Text>
            <View style={{ gap: 10 }}>
              {insights.crossReferences.map((item) => (
                <View key={item.reference} style={[styles.crossRow, { borderLeftColor: palette.goldBorder }]}>
                  <Text style={[styles.crossRef, { color: palette.gold }]}>{item.reference}</Text>
                  <Text style={[styles.crossText, { color: palette.textSub }]}>{item.connection}</Text>
                </View>
              ))}
            </View>
          </View>
        ),
      },
    ];
  }, [insights, palette.gold, palette.goldBorder, palette.glass, palette.border, palette.gold, palette.text, palette.textSub, palette.pillBg, palette.pillBorder]);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <StatusBar barStyle={palette.statusBar} backgroundColor="transparent" translucent />
      <BackgroundWash palette={palette} />

      <View style={{ flex: 1 }}>
          <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} activeOpacity={0.75}>
              <Ionicons name="chevron-back" size={22} color={palette.text} />
            </TouchableOpacity>
            <View style={styles.topBarCenter}>
              <Text style={[styles.topLabel, { color: palette.textMuted }]}>AI INSIGHTS</Text>
              <Text style={[styles.topRef, { color: palette.text }]} numberOfLines={1}>
                {params.reference}
              </Text>
            </View>
            <TouchableOpacity
            onPress={() => {
              const text = insights
                ? `${params.reference}\n\n${primaryReflection}\n\n${insights.applicationToday}`
                : params.context;
              void Share.share({ message: text });
            }}
            style={styles.iconBtn}
            activeOpacity={0.75}
            >
              <Ionicons name="share-outline" size={20} color={palette.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: 300 + insets.bottom, paddingTop: 24 },
            ]}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <View style={styles.hero}>
              {loading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator color={palette.gold} />
                  <Text style={[styles.loadingText, { color: palette.textSub }]}>Preparing the reflection…</Text>
                </View>
              ) : error ? (
                <View style={styles.loadingWrap}>
                  <Ionicons name="cloud-offline-outline" size={22} color={palette.textMuted} />
                  <Text style={[styles.loadingText, { color: palette.textSub }]}>{error}</Text>
                </View>
              ) : (
                <>
                  <Text style={[styles.heroQuote, { color: palette.text }]}>{`"${primaryReflection}"`}</Text>
                  <View style={styles.metaRow}>
                    <View style={[styles.aiDot, { backgroundColor: palette.gold }]} />
                    <Text style={[styles.metaText, { color: palette.textSub }]}>{readingTime}</Text>
                    <Text style={[styles.metaSep, { color: palette.textMuted }]}>•</Text>
                    <Text style={[styles.metaText, { color: palette.textSub }]}>AI reflection</Text>
                  </View>
                </>
              )}
            </View>

            {!loading && !error && sections.length > 0 && (
              <View style={{ marginTop: 24 }}>
                {sections.map((section) => (
                  <ExpandableSection
                    key={section.key}
                    title={section.title}
                    icon={section.icon}
                    active={activeSection === section.key}
                    onPress={() => setActiveSection((current) => (current === section.key ? 'reflection' : section.key))}
                    palette={palette}
                  >
                    {section.body}
                  </ExpandableSection>
                ))}
              </View>
            )}

            {!loading && !error && relatedVerses.length > 0 && (
              <View style={styles.relatedWrap}>
                <Text style={[styles.relatedTitle, { color: palette.textMuted }]}>RELATED VERSES</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedRow}>
                  {relatedVerses.map((item) => (
                    <TouchableOpacity
                      key={item.reference}
                      style={[styles.relatedPill, { backgroundColor: palette.glass, borderColor: palette.border }]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setInputText(`Explain ${item.reference} in the context of ${params.reference}.`);
                        focusInput();
                      }}
                    >
                      <Text style={[styles.relatedRef, { color: palette.gold }]}>{item.reference}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {!loading && !error && conversation.length > 0 && (
              <View style={styles.threadWrap}>
                <Text style={[styles.relatedTitle, { color: palette.textMuted }]}>CONVERSATION</Text>
                <View style={{ gap: 10 }}>
                  {conversation.slice(-4).map((msg) => (
                    <View
                      key={msg.id}
                      style={[
                        styles.threadRow,
                        {
                          alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                          backgroundColor: msg.role === 'user' ? palette.pillBg : palette.glass,
                          borderColor: msg.role === 'user' ? palette.pillBorder : palette.border,
                        },
                      ]}
                    >
                      <Text style={[styles.threadRole, { color: msg.role === 'user' ? palette.gold : palette.textMuted }]}>
                        {msg.role === 'user' ? 'You' : 'AI'}
                      </Text>
                      <Text style={[styles.threadText, { color: palette.text }]}>{msg.content}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </View>

      <Animated.View style={[
        styles.bottomDock,
        {
          bottom: keyboardHeight,
          paddingBottom: keyboardHeight > 0 ? 0 : Math.max(insets.bottom, 10) + 34,
          transform: [{ translateY: dockSlide }],
        },
      ]}>
        <Animated.View style={[styles.dockGlass, { borderColor: palette.border, backgroundColor: animDockBg }]}>
          <Animated.View style={[styles.inputRow, { backgroundColor: animInputBg, borderColor: palette.inputBorder }]}>
            <TextInput
              ref={inputRef}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask the reflection..."
              placeholderTextColor={palette.textMuted}
              style={[styles.input, { color: palette.text }]}
              returnKeyType="send"
              onFocus={handleFocus}
              onBlur={handleBlur}
              onSubmitEditing={() => void sendPrompt(inputText)}
            />
            <TouchableOpacity
              onPress={() => void sendPrompt(inputText)}
              disabled={!inputText.trim() || sending}
              activeOpacity={0.75}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: inputText.trim() && !sending
                    ? palette.gold
                    : (palette.statusBar === 'dark-content' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'),
                },
              ]}
            >
              <Ionicons
                name={sending ? 'ellipsis-horizontal' : 'arrow-up'}
                size={15}
                color={inputText.trim() && !sending ? '#08071A' : palette.textMuted}
              />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 8,
    gap: 10,
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  topLabel: {
    fontSize: 10,
    letterSpacing: 2.4,
    fontWeight: '700',
  },
  topRef: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(128,128,128,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
  },
  hero: {
    paddingTop: 18,
    paddingBottom: 12,
    minHeight: 240,
    justifyContent: 'center',
  },
  heroQuote: {
    fontSize: 22,
    fontFamily: 'Georgia',
    lineHeight: 35,
    letterSpacing: 0.05,
    fontWeight: '400',
    maxWidth: 620,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    flexShrink: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
  },
  aiDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaSep: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingWrap: {
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    lineHeight: 22,
  },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  sectionHeaderRow: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  sectionBody: {
    paddingBottom: 16,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  themeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themePill: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  themePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  prayerShell: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  prayerText: {
    fontSize: 14,
    lineHeight: 24,
  },
  crossRow: {
    borderLeftWidth: 2,
    paddingLeft: 12,
    gap: 4,
  },
  crossRef: {
    fontSize: 13,
    fontWeight: '700',
  },
  crossText: {
    fontSize: 13,
    lineHeight: 20,
  },
  relatedWrap: {
    marginTop: 24,
    gap: 12,
  },
  relatedTitle: {
    fontSize: 10,
    letterSpacing: 2.6,
    fontWeight: '700',
  },
  relatedRow: {
    gap: 12,
    paddingVertical: 2,
  },
  relatedPill: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  relatedRef: {
    fontSize: 12,
    fontWeight: '600',
  },
  threadWrap: {
    marginTop: 20,
    gap: 12,
  },
  threadRow: {
    maxWidth: '88%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  threadRole: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  threadText: {
    fontSize: 14,
    lineHeight: 22,
  },
  bottomDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 14,
  },
  dockGlass: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderRadius: 26,
    padding: 10,
    overflow: 'hidden',
  },
  inputRow: {
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    paddingLeft: 16,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 12,
  },
});

const bw = StyleSheet.create({
  wash: {
    position: 'absolute',
    top: -40,
    left: -60,
    right: -20,
    height: '38%',
  },
  lowerWash: {
    position: 'absolute',
    bottom: -30,
    left: -40,
    right: -10,
    height: '34%',
  },
  mist: {
    position: 'absolute',
    top: '26%',
    left: '-10%',
    right: '-10%',
    height: '36%',
  },
  mote: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  mote1: { top: '18%', left: '18%' },
  mote2: { top: '26%', right: '16%' },
  mote3: { top: '72%', left: '64%' },
});
