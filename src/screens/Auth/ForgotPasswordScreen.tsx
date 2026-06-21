import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types/navigation';
import { sendPasswordReset } from '../../services/authService';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const GOLD = '#C9A96B';
const CREAM = '#F3EDE3';

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const handleSend = async () => {
    setError('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      await sendPasswordReset(trimmed);
      setSent(true);
    } catch (e: any) {
      const code = e.code ?? '';
      if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (code === 'auth/user-not-found') {
        // Don't reveal if email exists — just show success (security best practice)
        setSent(true);
      } else {
        setError('Something went wrong. Please try again.');
      }
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
        colors={['rgba(8,7,18,0.55)', 'rgba(8,7,18,0.20)', 'rgba(8,7,18,0.80)', 'rgba(8,7,18,0.98)']}
        locations={[0, 0.25, 0.60, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.75)" />
        </TouchableOpacity>

        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <BlurView intensity={30} tint="dark" style={styles.card}>
              <View style={styles.warmTint} pointerEvents="none" />
              <View style={styles.topHighlight} pointerEvents="none" />

              {sent ? (
                /* ── Success state ────────────────────────────────────────── */
                <View style={styles.successContent}>
                  <View style={styles.successIconWrap}>
                    <Ionicons name="checkmark-circle" size={48} color={GOLD} />
                  </View>
                  <Text style={styles.successTitle}>Check Your Email</Text>
                  <Text style={styles.successBody}>
                    If an account exists for {email.trim()}, you'll receive a password reset link shortly.
                    Check your inbox and spam folder.
                  </Text>
                  <TouchableOpacity
                    style={styles.backToSignIn}
                    onPress={() => navigation.navigate('EmailAuth', { mode: 'signin' })}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.backToSignInText}>Back to Sign In</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* ── Form state ───────────────────────────────────────────── */
                <>
                  <View style={styles.lockIconWrap}>
                    <Ionicons name="key-outline" size={28} color={GOLD} />
                  </View>

                  <Text style={styles.cardTitle}>Reset Password</Text>
                  <Text style={styles.cardSub}>
                    Enter your email and we'll send you a link to reset your password.
                  </Text>

                  {!!error && (
                    <View style={styles.errorBanner}>
                      <Ionicons name="alert-circle-outline" size={16} color="#FF6B6B" />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>Email Address</Text>
                    <View style={styles.inputRow}>
                      <Ionicons name="mail-outline" size={18} color={GOLD} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="your@email.com"
                        placeholderTextColor="rgba(255,255,255,0.30)"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="send"
                        onSubmitEditing={handleSend}
                        autoFocus
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                    onPress={handleSend}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#1C1A11" size="small" />
                    ) : (
                      <Text style={styles.submitText}>Send Reset Link</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelRow}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </BlurView>
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
    justifyContent: 'center',
    paddingVertical: 100,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 26,
    gap: 16,
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

  lockIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(201,169,107,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201,169,107,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: CREAM,
    marginTop: -4,
  },
  cardSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.48)',
    lineHeight: 20,
    marginTop: -6,
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

  // ── Field ─────────────────────────────────────────────────────────────────
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

  // ── Submit ────────────────────────────────────────────────────────────────
  submitBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.65 },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1A11',
  },
  cancelRow: { alignItems: 'center' },
  cancelText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.40)',
    fontWeight: '500',
  },

  // ── Success ───────────────────────────────────────────────────────────────
  successContent: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(201,169,107,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201,169,107,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: CREAM,
    textAlign: 'center',
  },
  successBody: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 22,
  },
  backToSignIn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginTop: 8,
  },
  backToSignInText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1A11',
  },
});
