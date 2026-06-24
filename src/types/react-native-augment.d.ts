import 'react-native';

// StyleSheet.absoluteFillObject exists at runtime in React Native but was removed
// from the bundled type definitions in RN 0.86. This augmentation restores the type.
declare module 'react-native' {
  namespace StyleSheet {
    const absoluteFillObject: {
      readonly position: 'absolute';
      readonly left: 0;
      readonly top: 0;
      readonly right: 0;
      readonly bottom: 0;
    };
  }
}
