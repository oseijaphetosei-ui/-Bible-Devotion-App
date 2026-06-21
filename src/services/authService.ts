import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordReset,
  updateProfile,
  signOut as firebaseSignOut,
  OAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
  User,
} from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as ExpoCrypto from 'expo-crypto';

// ─── SHA-256 via expo-crypto ──────────────────────────────────────────────────
// globalThis.crypto.subtle is not available in Expo Go; expo-crypto is
// the cross-platform alternative that works in Expo Go, dev builds, and production.
async function sha256(message: string): Promise<string> {
  return ExpoCrypto.digestStringAsync(
    ExpoCrypto.CryptoDigestAlgorithm.SHA256,
    message,
  );
}

function generateNonce(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ─── Email auth ───────────────────────────────────────────────────────────────
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName: displayName.trim() });
  return user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

// ─── Google Sign-In (credential step only) ────────────────────────────────────
// The OAuth browser flow is handled in WelcomeScreen via expo-auth-session.
// This function receives the id_token from that flow and signs in with Firebase.
export async function signInWithGoogleCredential(idToken: string): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const { user } = await signInWithCredential(auth, credential);
  return user;
}

// ─── Apple Sign-In ────────────────────────────────────────────────────────────
export async function signInWithApple(): Promise<User> {
  const rawNonce = generateNonce();
  const hashedNonce = await sha256(rawNonce);

  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!appleCredential.identityToken) {
    throw new Error('Apple Sign-In failed: no identity token received.');
  }

  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: appleCredential.identityToken,
    rawNonce,
  });

  const { user } = await signInWithCredential(auth, credential);

  // Apple only sends the full name on the very first sign-in
  if (appleCredential.fullName?.givenName && !user.displayName) {
    const fullName = [appleCredential.fullName.givenName, appleCredential.fullName.familyName]
      .filter(Boolean)
      .join(' ');
    await updateProfile(user, { displayName: fullName });
  }

  return user;
}

// ─── Password reset ───────────────────────────────────────────────────────────
export async function sendPasswordReset(email: string): Promise<void> {
  await firebaseSendPasswordReset(auth, email);
}

// ─── Sign out ─────────────────────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}
