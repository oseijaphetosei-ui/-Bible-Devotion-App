import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Animated, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { markAnswered, invalidateCache } from '../../services/prayerService';
import type { HomeStackParamList } from '../../types/navigation';

type Nav   = NativeStackNavigationProp<HomeStackParamList>;
type Route = RouteProp<HomeStackParamList, 'PrayerAnswered'>;

const GOLD  = '#C9A96B';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function ReflectionField({ label, placeholder, value, onChange, multiline = false, isDark }: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  isDark: boolean;
}) {
  const textColor  = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';

  return (
    <View style={rf.field}>
      <Text style={[rf.label, { color: mutedColor }]}>{label}</Text>
      <TextInput
        style={[
          rf.input,
          {
            color: textColor,
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.68)',
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.85)',
            minHeight: multiline ? 96 : 50,
            fontFamily: multiline ? SERIF : undefined,
            fontStyle: multiline ? 'italic' : 'normal',
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={mutedColor}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        scrollEnabled={false}
      />
    </View>
  );
}

const rf = StyleSheet.create({
  field: { marginBottom: 18 },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginBottom: 9 },
  input: {
    borderWidth: 1, borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, lineHeight: 22,
  },
});

export default function PrayerAnsweredScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const t          = useTheme();
  const insets     = useSafeAreaInsets();
  const { prayerId } = route.params;

  const isDark     = t.statusBar === 'light-content';
  const rootBg     = isDark ? '#060810' : '#DDD5C4';
  const textColor  = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const subColor   = isDark ? 'rgba(255,255,255,0.58)' : 'rgba(24,18,8,0.58)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';

  const [howAnswered,  setHowAnswered]  = useState('');
  const [whenHappened, setWhenHappened] = useState('');
  const [whatLearned,  setWhatLearned]  = useState('');
  const [saving,       setSaving]       = useState(false);

  const iconAnim   = useRef(new Animated.Value(0)).current;
  const titleAnim  = useRef(new Animated.Value(0)).current;
  const bodyAnim   = useRef(new Animated.Value(0)).current;
  const fieldsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.spring(iconAnim,   { toValue: 1, tension: 55, friction: 9, useNativeDriver: true }),
      Animated.timing(titleAnim,  { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(bodyAnim,   { toValue: 1, duration: 340, useNativeDriver: true }),
      Animated.timing(fieldsAnim, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  }, []);

  const entrance = (anim: Animated.Value, dy = 18) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [dy, 0] }) }],
  });

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await markAnswered(prayerId, {
        howAnswered:  howAnswered.trim(),
        whenHappened: whenHappened.trim(),
        whatLearned:  whatLearned.trim(),
      });
      invalidateCache();
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }, [prayerId, howAnswered, whenHappened, whatLearned, navigation]);

  const handleSkip = useCallback(async () => {
    await markAnswered(prayerId);
    invalidateCache();
    navigation.goBack();
  }, [prayerId, navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: rootBg }}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

      {/* Close button */}
      <View style={[pa.topBar, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity
          style={[pa.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}
          onPress={() => navigation.goBack()}
          hitSlop={14}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={20} color={isDark ? 'rgba(255,255,255,0.85)' : 'rgba(24,18,8,0.85)'} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[pa.scroll, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icon — double ring */}
          <Animated.View style={[pa.iconArea, entrance(iconAnim, 0)]}>
            <View style={[pa.iconRingOuter, { borderColor: 'rgba(201,169,107,0.25)' }]} />
            <View style={[pa.iconRingInner, {
              backgroundColor: 'rgba(201,169,107,0.10)',
              borderColor: 'rgba(201,169,107,0.35)',
            }]}>
              <Ionicons name="checkmark-circle-outline" size={34} color={GOLD} />
            </View>
          </Animated.View>

          {/* Headline */}
          <Animated.Text style={[pa.headline, { color: textColor, fontFamily: SERIF }, entrance(titleAnim)]}>
            Prayer Answered
          </Animated.Text>

          {/* Prompt */}
          <Animated.Text style={[pa.prompt, { color: subColor, fontFamily: SERIF }, entrance(bodyAnim)]}>
            "Take a moment to reflect on God's faithfulness."{'\n\n'}
            Recorded testimonies become a treasure — a reminder of how God has moved in your life.
          </Animated.Text>

          {/* Divider */}
          <Animated.View
            style={[pa.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }, entrance(fieldsAnim)]}
          />

          {/* Reflection fields */}
          <Animated.View style={entrance(fieldsAnim)}>
            <ReflectionField
              label="HOW WAS THIS PRAYER ANSWERED?"
              placeholder="Describe how God answered this prayer…"
              value={howAnswered}
              onChange={setHowAnswered}
              multiline
              isDark={isDark}
            />
            <ReflectionField
              label="WHEN DID IT HAPPEN?"
              placeholder="e.g. Last Tuesday, this morning…"
              value={whenHappened}
              onChange={setWhenHappened}
              isDark={isDark}
            />
            <ReflectionField
              label="WHAT DID YOU LEARN?"
              placeholder="What did this teach you about God's faithfulness?…"
              value={whatLearned}
              onChange={setWhatLearned}
              multiline
              isDark={isDark}
            />
          </Animated.View>

          {/* Record CTA */}
          <TouchableOpacity
            style={[pa.primaryBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[GOLD, '#B8904A']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={pa.primaryBtnGradient}
            >
              <Ionicons name="heart-circle-outline" size={18} color="#08071A" />
              <Text style={pa.primaryBtnLabel}>{saving ? 'Saving…' : 'Record This Testimony'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={pa.ghostBtn} onPress={handleSkip} activeOpacity={0.7}>
            <Text style={[pa.ghostBtnLabel, { color: mutedColor }]}>Skip reflection for now</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const pa = StyleSheet.create({
  topBar:  { paddingHorizontal: 16, paddingBottom: 8, alignItems: 'flex-start' },
  closeBtn: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },

  scroll: { paddingHorizontal: 24, paddingTop: 8, alignItems: 'center' },

  iconArea: {
    width: 108, height: 108,
    alignItems: 'center', justifyContent: 'center', marginBottom: 28,
  },
  iconRingOuter: {
    position: 'absolute', width: 108, height: 108,
    borderRadius: 54, borderWidth: 1, opacity: 0.45,
  },
  iconRingInner: {
    width: 78, height: 78, borderRadius: 39, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  headline: {
    fontSize: 34, fontWeight: '400', letterSpacing: -0.5,
    marginBottom: 16, textAlign: 'center',
  },
  prompt: {
    fontSize: 15, lineHeight: 26, textAlign: 'center',
    marginBottom: 28, fontStyle: 'italic',
  },
  divider: { width: '100%', height: StyleSheet.hairlineWidth, marginBottom: 28 },

  primaryBtn:          { width: '100%', borderRadius: 30, overflow: 'hidden', marginBottom: 12 },
  primaryBtnGradient:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16,
  },
  primaryBtnLabel: { fontSize: 16, fontWeight: '700', color: '#08071A', letterSpacing: 0.2 },

  ghostBtn:      { paddingVertical: 12, alignItems: 'center' },
  ghostBtnLabel: { fontSize: 14, fontWeight: '500' },
});
