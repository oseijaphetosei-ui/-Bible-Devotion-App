import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/Home/HomeScreen';
import BibleScreen from './src/screens/Bible/BibleScreen';
import StoriesScreen from './src/screens/Stories/StoriesScreen';
import StoryReaderScreen from './src/screens/Stories/StoryReaderScreen';
import VerseScreen from './src/screens/Verse/VerseScreen';
import GoalsScreen from './src/screens/Goals/GoalsScreen';
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator id="root" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Bible" component={BibleScreen} />
          <Stack.Screen name="Stories" component={StoriesScreen} />
          <Stack.Screen name="StoryReader" component={StoryReaderScreen} />
          <Stack.Screen name="Verse" component={VerseScreen} />
          <Stack.Screen name="Goals" component={GoalsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
