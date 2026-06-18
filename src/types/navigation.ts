import { NavigatorScreenParams } from '@react-navigation/native';

export type HomeStackParamList = {
  Home: undefined;
  Bible: { bookIndex?: number; chapter?: number } | undefined;
  Stories: undefined;
  StoryReader: { storyId: string };
  Verse: undefined;
  Goals: undefined;
  Devotion: { topic?: string } | undefined;
};

export type BibleStackParamList = {
  Bible: { bookIndex?: number; chapter?: number } | undefined;
};

export type NotesStackParamList = {
  Notes: undefined;
  NoteEditor: { noteId?: string } | undefined;
};

export type RootTabParamList = {
  ChatTab: undefined;
  CommunityTab: undefined;
  HomeTab: NavigatorScreenParams<HomeStackParamList> | undefined;
  BibleTab: NavigatorScreenParams<BibleStackParamList> | undefined;
  NotesTab: NavigatorScreenParams<NotesStackParamList> | undefined;
};

// Alias used by all existing screen components — points to the home stack
export type RootStackParamList = HomeStackParamList;
