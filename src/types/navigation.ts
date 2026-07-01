import { NavigatorScreenParams } from '@react-navigation/native';
import type { ScriptureChatNavParams, ScriptureInsightsNavParams } from './scriptureChat';
import type { PostType } from './community';

export type HomeStackParamList = {
  Home: undefined;
  Bible: { bookIndex?: number; chapter?: number } | undefined;
  Stories: undefined;
  StoryReader: { storyId: string };
  Verse: undefined;
  Goals: undefined;
  Devotion: { topic?: string } | undefined;
  ScriptureChat: ScriptureChatNavParams;
  ScriptureInsights: ScriptureInsightsNavParams;
  TodayJourney: undefined;
  Reading: { planId: string; day: number };
  Reflection: { planId: string; day: number };
  PlanLibrary: undefined;
  PrayerJournal: undefined;
  PrayerEditor: { prayerId?: string; prefillVerse?: { label: string; text: string }; prefillContent?: string } | undefined;
  PrayerDetail: { prayerId: string };
  PrayerAnswered: { prayerId: string };
};

export type BibleStackParamList = {
  BibleSplash: undefined;
  BibleLibrary: undefined;
  Bible: { bookIndex?: number; chapter?: number; verseToScroll?: number } | undefined;
  ScriptureChat: ScriptureChatNavParams;
};

export type NotesStackParamList = {
  Notes: undefined;
  NoteEditor: { noteId?: string; prefillReference?: string; prefillQuote?: string } | undefined;
};

export type ChatStackParamList = {
  ChatList: undefined;
  DirectMessage: { chatId: string; otherUserId: string; otherName: string };
  GroupChat: { chatId: string; groupName: string };
  NewChat: undefined;
};

export type CommunityStackParamList = {
  Community:  undefined;
  CreatePost: { type?: PostType };
  PostDetail: { postId: string };
};

export type ProfileStackParamList = {
  Profile:       undefined;
  EditProfile:   undefined;
  Appearance:    undefined;
  Notifications: undefined;
  Privacy:       undefined;
};

export type RootTabParamList = {
  ChatTab:      NavigatorScreenParams<ChatStackParamList> | undefined;
  CommunityTab: NavigatorScreenParams<CommunityStackParamList> | undefined;
  HomeTab:      NavigatorScreenParams<HomeStackParamList> | undefined;
  BibleTab:     NavigatorScreenParams<BibleStackParamList> | undefined;
  NotesTab:     NavigatorScreenParams<NotesStackParamList> | undefined;
};

export type AppRootParamList = {
  Onboarding:   undefined;
  MainTabs:     NavigatorScreenParams<RootTabParamList> | undefined;
  ProfileModal: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

// Alias used by all existing screen components — points to the home stack
export type RootStackParamList = HomeStackParamList;
