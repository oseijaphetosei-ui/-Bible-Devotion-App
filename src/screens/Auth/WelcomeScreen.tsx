import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types/navigation';
import { signInWithApple, signInWithGoogleCredential } from '../../services/authService';

// Required for expo-auth-session to close the browser after OAuth redirect
WebBrowser.maybeCompleteAuthSession();

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const GOLD = '#C9A96B';
const CREAM = '#F3EDE3';

// ─── Google OAuth Client IDs ──────────────────────────────────────────────────
// Find these in: Firebase Console → Project Settings → Your apps
// OR: Google Cloud Console → APIs & Services → Credentials
//
// iOS Client ID:     Project Settings → iOS app → GoogleService-Info.plist → CLIENT_ID
// Android Client ID: Project Settings → Android app → google-services.json → client_id
// Web Client ID:     Authentication → Sign-in method → Google → Web SDK configuration
const IOS_CLIENT_ID     = 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com';
const ANDROID_CLIENT_ID = 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com';
const WEB_CLIENT_ID     = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';

// Redirect URI used after Google OAuth.
// In production (EAS / standalone): com.japhet.dailydevotion:/oauthredirect
// → Register this URI in Google Cloud Console → Credentials → your iOS OAuth client.
// In Expo Go: expo-auth-session falls back to its own scheme, which Google won't
// redirect to — Google Sign-In will only work in a development or production build.
const GOOGLE_REDIRECT_URI = makeRedirectUri({
  native: 'com.japhet.dailydevotion:/oauthredirect',
  scheme: 'dailydevotion',
});

export default function WelcomeScreen({ navigation }: Props) {
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null);

  // ─── Google OAuth (browser-based; works in dev + production builds) ─────────
  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    iosClientId:     IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    webClientId:     WEB_CLIENT_ID,
    redirectUri:     GOOGLE_REDIRECT_URI,
  });

  useEffect(() => {
    if (!googleResponse) return;

    if (googleResponse.type === 'success') {
      // On native, expo-auth-session first returns type:'success' with only a
      // `code` in params, then asynchronously exchanges it for tokens and fires
      // this effect a second time with id_token populated. Skip the first fire.
      const { code } = googleResponse.params ?? {};
      const hasAuthentication = !!googleResponse.authentication;
      if (code && !hasAuthentication) return;

      const idToken =
        googleResponse.params?.id_token ?? googleResponse.authentication?.idToken;
      if (idToken) {
        signInWithGoogleCredential(idToken).catch((e: any) => {
          Alert.alert('Sign In Failed', e.message || 'Google Sign-In failed. Please try again.');
          setLoading(null);
        });
        // loading clears when AuthContext detects the signed-in user
        return;
      }
      // Exchange completed but no id_token — treat as failure
      Alert.alert('Sign In Failed', 'Google Sign-In did not return an ID token. Make sure Google Sign-In is enabled in Firebase Console and you have entered valid OAuth client IDs.');
    } else if (googleResponse.type === 'error') {
      Alert.alert('Sign In Failed', googleResponse.error?.message || 'Google Sign-In failed.');
    }
    // cancel, dismiss, or failure — clear loading
    setLoading(null);
  }, [googleResponse]);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleApple = async () => {
    try {
      setLoading('apple');
      await signInWithApple();
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign In Failed', e.message ?? 'Apple Sign-In failed. Please try again.');
      }
      setLoading(null);
    }
    // On success, loading clears when AuthContext detects the signed-in user
  };

  const handleGoogle = async () => {
    setLoading('google');
    await promptGoogleAsync();
    // response handled in useEffect above
  };

  const isLoading = loading !== null;

  return (
    <View style={styles.root}>
      <Image
        source={require('../../assets/intro-background.jpg')}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      <LinearGradient
        colors={[
          'rgba(8,7,18,0.30)',
          'rgba(8,7,18,0.10)',
          'rgba(8,7,18,0.55)',
          'rgba(8,7,18,0.92)',
          'rgba(8,7,18,0.98)',
        ]}
        locations={[0, 0.22, 0.55, 0.80, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* ── App identity ─────────────────────────────────────────────────── */}
        <View style={styles.identity}>
          <View style={styles.iconWrap}>
            <Ionicons name="book" size={38} color={GOLD} />
          </View>
          <Text style={styles.appName}>Daily Devotion</Text>
          <Text style={styles.tagline}>Scripture · Prayer · Reflection</Text>
        </View>

        {/* ── Sign-in card ─────────────────────────────────────────────────── */}
        <View style={styles.cardOuter}>
          <BlurView intensity={30} tint="dark" style={styles.card}>
            <View style={styles.warmTint} pointerEvents="none" />
            <View style={styles.topHighlight} pointerEvents="none" />

            <Text style={styles.cardTitle}>Begin Your Journey</Text>
            <Text style={styles.cardSub}>Sign in to continue</Text>

            {/* Apple Sign-In — iOS only */}
            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={14}
                style={styles.appleBtn}
                onPress={handleApple}
              />
            )}

            {/* Google Sign-In */}
            <TouchableOpacity
              style={[styles.socialBtn, styles.googleBtn]}
              onPress={handleGoogle}
              disabled={isLoading}
              activeOpacity={0.82}
            >
              {loading === 'google' ? (
                <ActivityIndicator color="#333" size="small" />
              ) : (
                <>
                  <AntDesign name="google" size={18} color="#4285F4" />
                  <Text style={styles.googleText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email */}
            <TouchableOpacity
              style={[styles.socialBtn, styles.emailBtn]}
              onPress={() => navigation.navigate('EmailAuth', { mode: 'signup' })}
              disabled={isLoading}
              activeOpacity={0.82}
            >
              <Ionicons name="mail-outline" size={18} color="#1C1A11" />
              <Text style={styles.emailText}>Continue with Email</Text>
            </TouchableOpacity>

            {/* Sign-in link */}
            <TouchableOpacity
              style={styles.signinRow}
              onPress={() => navigation.navigate('EmailAuth', { mode: 'signin' })}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.signinPrompt}>Already have an account? </Text>
              <Text style={styles.signinLink}>Sign In</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#08071A' },
  safe: { flex: 1 },

  identity: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 20,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: 'rgba(201,169,107,0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(201,169,107,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GOLD,
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  appName: {
    fontSize: 34,
    fontWeight: '700',
    color: CREAM,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.52)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  cardOuter: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  card: {
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    gap: 12,
  },
  warmTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(201,169,107,0.05)',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 28,
    right: 28,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: CREAM,
    textAlign: 'center',
  },
  cardSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.48)',
    textAlign: 'center',
    marginTop: -4,
    marginBottom: 4,
  },

  appleBtn: {
    height: 52,
    width: '100%',
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    gap: 10,
    paddingHorizontal: 20,
  },
  googleBtn: { backgroundColor: '#FFFFFF' },
  googleText: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  emailBtn:   { backgroundColor: GOLD },
  emailText:  { fontSize: 16, fontWeight: '600', color: '#1C1A11' },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  dividerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.38)',
    letterSpacing: 0.5,
  },

  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  signinPrompt: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
  signinLink:   { fontSize: 13, fontWeight: '700', color: GOLD },
});
