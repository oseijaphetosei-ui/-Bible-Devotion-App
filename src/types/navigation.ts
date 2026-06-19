import { NavigatorScreenParams } from '@react-navigation/native';
import type { ScriptureChatNavParams } from './scriptureChat';

export type HomeStackParamList = {
  Home: undefined;
  Bible: { bookIndex?: number; chapter?: number } | undefined;
  Stories: undefined;
  StoryReader: { storyId: string };
  Verse: undefined;
  Goals: undefined;
  Devotion: { topic?: string } | undefined;
  ScriptureChat: ScriptureChatNavParams;
};

export type BibleStackParamList = {
  BibleSplash: undefined;
  BibleLibrary: undefined;
  Bible: { bookIndex?: number; chapter?: number; verseToScroll?: number } | undefined;
  ScriptureChat: ScriptureChatNavParams;
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
