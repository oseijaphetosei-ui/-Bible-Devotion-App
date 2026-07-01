import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Animated, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { markAnswered, invalidateCache } from '../../services/prayerService';
import type { HomeStackParamList } from '../../types/navigation';

type Nav   = NativeStackNavigationProp<HomeStackParamList>;
type Route = RouteProp<HomeStackParamList, 'PrayerAnswered'>;

function ReflectionField({ label, placeholder, value, onChange, multiline = false }: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={rf.field}>
      <Text style={[rf.label, { color: t.textMuted }]}>{label}</Text>
      <TextInput
        style={[rf.input, { color: t.text, borderColor: t.inputBorder, minHeight: multiline ? 90 : 48 }]}
        placeholder={placeholder}
        placeholderTextColor={t.textMuted}
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
  field: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
  },
});

export default function PrayerAnsweredScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const t          = useTheme();
  const { prayerId } = route.params;

  const [howAnswered,   setHowAnswered]   = useState('');
  const [whenHappened,  setWhenHappened]  = useState('');
  const [whatLearned,   setWhatLearned]   = useState('');
  const [saving,        setSaving]        = useState(false);

  // Staggered entrance animations
  const iconAnim   = useRef(new Animated.Value(0)).current;
  const titleAnim  = useRef(new Animated.Value(0)).current;
  const bodyAnim   = useRef(new Animated.Value(0)).current;
  const fieldsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.spring(iconAnim,  { toValue: 1, tension: 55, friction: 9, useNativeDriver: true }),
      Animated.timing(titleAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(bodyAnim,  { toValue: 1, duration: 340, useNativeDriver: true }),
      Animated.timing(fieldsAnim,{ toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  }, []);

  const makeEntrance = (anim: Animated.Value, dy = 16) => ({
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
      // Pop back to detail (which will reload) then the detail pops or stays
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
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <StatusBar barStyle={t.statusBar} />

        {/* Close button */}
        <View style={pa.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={14} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={t.text} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={pa.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Icon */}
            <Animated.View style={[pa.iconWrap, { backgroundColor: t.goldBg }, makeEntrance(iconAnim, 0)]}>
              <Text style={pa.iconEmoji}>✨</Text>
            </Animated.View>

            {/* Headline */}
            <Animated.Text style={[pa.headline, { color: t.text }, makeEntrance(titleAnim)]}>
              Prayer Answered
            </Animated.Text>

            {/* Prompt */}
            <Animated.Text style={[pa.prompt, { color: t.textMuted }, makeEntrance(bodyAnim)]}>
              "Take a moment to reflect on God's faithfulness."{'\n\n'}
              Recorded testimonies become a treasure — a reminder of how God has moved in your life.
            </Animated.Text>

            {/* Divider */}
            <Animated.View style={[pa.divider, { backgroundColor: t.divider }, makeEntrance(fieldsAnim)]} />

            {/* Reflection fields */}
            <Animated.View style={makeEntrance(fieldsAnim)}>
              <ReflectionField
                label="HOW WAS THIS PRAYER ANSWERED?"
                placeholder="Describe how God answered this prayer…"
                value={howAnswered}
                onChange={setHowAnswered}
                multiline
              />
              <ReflectionField
                label="WHEN DID IT HAPPEN?"
                placeholder="e.g. Last Tuesday, this morning…"
                value={whenHappened}
                onChange={setWhenHappened}
              />
              <ReflectionField
                label="WHAT DID YOU LEARN?"
                placeholder="What did this teach you about God's faithfulness?…"
                value={whatLearned}
                onChange={setWhatLearned}
                multiline
              />
            </Animated.View>

            {/* CTA */}
            <TouchableOpacity
              style={[pa.primaryBtn, { backgroundColor: t.gold }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.82}
            >
              <Text style={pa.primaryBtnLabel}>{saving ? 'Saving…' : 'Record This Testimony'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={pa.ghostBtn}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={[pa.ghostBtnLabel, { color: t.textMuted }]}>Skip reflection for now</Text>
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const pa = StyleSheet.create({
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 8,
    alignItems: 'center',
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconEmoji: { fontSize: 38 },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  prompt: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 28,
    fontStyle: 'italic',
  },
  divider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    marginBottom: 28,
  },
  primaryBtn: {
    width: '100%',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  ghostBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostBtnLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
});
