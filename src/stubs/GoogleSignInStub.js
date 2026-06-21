// Stub used in Expo Go / local development (no native binary available).
// Metro redirects '@react-native-google-signin/google-signin' here when EAS_BUILD is unset.
const GoogleSignin = {
  configure: () => {},
  hasPlayServices: async () => true,
  signIn: async () => { throw new Error('Google Sign-In requires a development build.'); },
  signOut: async () => {},
  isSignedIn: () => false,
  getCurrentUser: () => null,
};

module.exports = { GoogleSignin, statusCodes: {} };
