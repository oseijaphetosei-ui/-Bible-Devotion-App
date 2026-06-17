import { NavigatorScreenParams } from '@react-navigation/native';

export type HomeStackParamList = {
  Home: undefined;
  Bible: { bookIndex?: number; chapter?: number } | undefined;
  Stories: undefined;
  StoryReader: { storyId: string };
  Verse: undefined;
  Goals: undefined;
};

export type BibleStackParamList = {
  Bible: { bookIndex?: number; chapter?: number } | undefined;
};

export type RootTabParamList = {
  ChatTab: undefined;
  CommunityTab: undefined;
  HomeTab: NavigatorScreenParams<HomeStackParamList> | undefined;
  BibleTab: NavigatorScreenParams<BibleStackParamList> | undefined;
  NotesTab: undefined;
};

// Alias used by all existing screen components — points to the home stack
export type RootStackParamList = HomeStackParamList;
