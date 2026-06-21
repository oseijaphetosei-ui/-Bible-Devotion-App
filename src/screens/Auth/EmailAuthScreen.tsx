import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types/navigation';
import { signInWithEmail, signUpWithEmail } from '../../services/authService';

type Props = NativeStackScreenProps<AuthStackParamList, 'EmailAuth'>;
type Mode = 'signin' | 'signup';

const GOLD = '#C9A96B';
const CREAM = '#F3EDE3';

export default function EmailAuthScreen({ navigation, route }: Props) {
  const initialMode: Mode = route.params?.mode ?? 'signup';
  const [mode, setMode]               = useState<Mode>(initialMode);
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPw, setConfirmPw]     = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const emailRef   = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef  = useRef<TextInput>(null);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setPassword('');
    setConfirmPw('');
  };

  const friendlyError = (code: string, rawMessage?: string): string => {
    const map: Record<string, string> = {
      'auth/email-already-in-use':   'An account with this email already exists. Sign in instead.',
      'auth/invalid-email':          'Please enter a valid email address.',
      'auth/weak-password':          'Password must be at least 6 characters.',
      'auth/user-not-found':         'No account found with this email.',
      'auth/wrong-password':         'Incorrect password. Please try again.',
      'auth/invalid-credential':     'Incorrect email or password.',
      'auth/too-many-requests':      'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Check your connection and try again.',
      'auth/operation-not-allowed':  'Email sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.',
      'auth/user-disabled':          'This account has been disabled.',
      'auth/missing-password':       'Please enter your password.',
    };
    // Use mapped message, then raw Firebase message, then generic fallback
    return map[code] ?? rawMessage ?? 'Something went wrong. Please try again.';
  };

  const handleSubmit = async () => {
    setError('');
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName  = name.trim();

    if (!trimmedEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (mode === 'signup') {
      if (!trimmedName) { setError('Please enter your name.'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
      if (password !== confirmPw) { setError('Passwords do not match.'); return; }
    }

    try {
      setLoading(true);
      if (mode === 'signup') {
        await signUpWithEmail(trimmedEmail, password, trimmedName);
      } else {
        await signInWithEmail(trimmedEmail, password);
      }
      // AuthContext swaps navigators automatically on auth state change
    } catch (e: any) {
      setError(friendlyError(e.code ?? '', e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <Image
        source={require('../../assets/intro-background.jpg')}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['rgba(8,7,18,0.55)', 'rgba(8,7,18,0.20)', 'rgba(8,7,18,0.75)', 'rgba(8,7,18,0.98)']}
        locations={[0, 0.25, 0.60, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.75)" />
        </TouchableOpacity>

        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Mode toggle */}
            <View style={styles.toggleWrap}>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'signin' && styles.toggleActive]}
                onPress={() => switchMode('signin')}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, mode === 'signin' && styles.toggleTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'signup' && styles.toggleActive]}
                onPress={() => switchMode('signup')}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form card */}
            <BlurView intensity={30} tint="dark" style={styles.card}>
              <View style={styles.warmTint} pointerEvents="none" />
              <View style={styles.topHighlight} pointerEvents="none" />

              <Text style={styles.cardTitle}>
                {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </Text>
              <Text style={styles.cardSub}>
                {mode === 'signin'
                  ? 'Sign in to your Daily Devotion account'
                  : 'Join to start your spiritual journey'}
              </Text>

              {/* Error banner */}
              {!!error && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={16} color="#FF6B6B" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Name field — sign up only */}
              {mode === 'signup' && (
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Full Name</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="person-outline" size={18} color={GOLD} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Your name"
                      placeholderTextColor="rgba(255,255,255,0.30)"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      returnKeyType="next"
                      onSubmitEditing={() => emailRef.current?.focus()}
                    />
                  </View>
                </View>
              )}

              {/* Email */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Email</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="mail-outline" size={18} color={GOLD} style={styles.inputIcon} />
                  <TextInput
                    ref={emailRef}
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor="rgba(255,255,255,0.30)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={18} color={GOLD} style={styles.inputIcon} />
                  <TextInput
                    ref={passwordRef}
                    style={[styles.input, styles.inputFlex]}
                    placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Your password'}
                    placeholderTextColor="rgba(255,255,255,0.30)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPw}
                    autoCapitalize="none"
                    returnKeyType={mode === 'signup' ? 'next' : 'done'}
                    onSubmitEditing={() => {
                      if (mode === 'signup') confirmRef.current?.focus();
                      else handleSubmit();
                    }}
                  />
                  <TouchableOpacity onPress={() => setShowPw((v) => !v)} style={styles.eyeBtn}>
                    <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password — sign up only */}
              {mode === 'signup' && (
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Confirm Password</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="lock-closed-outline" size={18} color={GOLD} style={styles.inputIcon} />
                    <TextInput
                      ref={confirmRef}
                      style={[styles.input, styles.inputFlex]}
                      placeholder="Confirm your password"
                      placeholderTextColor="rgba(255,255,255,0.30)"
                      value={confirmPw}
                      onChangeText={setConfirmPw}
                      secureTextEntry={!showConfirm}
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                    />
                    <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={styles.eyeBtn}>
                      <Ionicons
                        name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color="rgba(255,255,255,0.4)"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Forgot Password — sign in only */}
              {mode === 'signin' && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                  style={styles.forgotBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#1C1A11" size="small" />
                ) : (
                  <Text style={styles.submitText}>
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>
            </BlurView>

            {/* Bottom link */}
            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
              activeOpacity={0.7}
            >
              <Text style={styles.switchPrompt}>
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              </Text>
              <Text style={styles.switchLink}>
                {mode === 'signin' ? 'Create one' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#08071A' },
  safe: { flex: 1 },
  kav:  { flex: 1 },

  backBtn: {
    position: 'absolute',
    top: 56,
    left: 16,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 24,
    gap: 16,
  },

  // ── Toggle ────────────────────────────────────────────────────────────────
  toggleWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: GOLD,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
  },
  toggleTextActive: {
    color: '#1C1A11',
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    gap: 14,
  },
  warmTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(201,169,107,0.05)',
  },
  topHighlight: {
    position: 'absolute',
    top: 0, left: 28, right: 28,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: CREAM,
  },
  cardSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    marginTop: -6,
    marginBottom: 2,
  },

  // ── Error ─────────────────────────────────────────────────────────────────
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,107,107,0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.25)',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#FF9898',
    lineHeight: 18,
  },

  // ── Fields ────────────────────────────────────────────────────────────────
  fieldWrap: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.50)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    color: CREAM,
    paddingVertical: 0,
  },
  inputFlex: { flex: 1 },
  eyeBtn: { padding: 4 },

  // ── Forgot ────────────────────────────────────────────────────────────────
  forgotBtn: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: {
    fontSize: 13,
    color: GOLD,
    fontWeight: '600',
  },

  // ── Submit ────────────────────────────────────────────────────────────────
  submitBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.65 },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1A11',
  },

  // ── Bottom link ───────────────────────────────────────────────────────────
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  switchPrompt: { fontSize: 13, color: 'rgba(255,255,255,0.42)' },
  switchLink:   { fontSize: 13, fontWeight: '700', color: GOLD },
});
