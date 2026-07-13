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
  Journey: undefined;
  StudyLibrary: undefined;
  StudyDetail: { studyId: string };
  LessonReader: { studyId: string; day: number };
  StudyComplete: { studyId: string };
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
  Explore: undefined;
  Hymns: undefined;
  HymnReader: { hymnId: string };
  SermonBuilder: undefined;
  SermonWizard: undefined;
  SermonGenerating: {
    audience: string;
    audienceLabel: string;
    sermonType: string;
    scriptures: string[];
    topic: string;
    duration: number;
    tone: string;
  };
  SermonResult: { sermonId: string };
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
};

export type CommunityStackParamList = {
  Community:  undefined;
  CreatePost: { type?: PostType };
  PostDetail: { postId: string };
};

export type ProfileStackParamList = {
  Profile:         undefined;
  EditProfile:     undefined;
  Appearance:      undefined;
  Notifications:   undefined;
  Privacy:         undefined;
  PrivacyPolicy:   undefined;
  TermsOfService:  undefined;
};

export type RootTabParamList = {
  ChatTab:      NavigatorScreenParams<ChatStackParamList> | undefined;
  CommunityTab: NavigatorScreenParams<CommunityStackParamList> | undefined;
  HomeTab:      NavigatorScreenParams<HomeStackParamList> | undefined;
  BibleTab:     NavigatorScreenParams<BibleStackParamList> | undefined;
  NotesTab:     NavigatorScreenParams<NotesStackParamList> | undefined;
};

export type AppRootParamList = {
  Onboarding:     undefined;
  MainTabs:       NavigatorScreenParams<RootTabParamList> | undefined;
  ProfileModal:   NavigatorScreenParams<ProfileStackParamList> | undefined;
  DirectMessage:  { chatId: string; otherUserId: string; otherName: string };
  GroupChat:      { chatId: string; groupName: string };
  NewChat:        undefined;
  ContactProfile: { chatId: string; otherName: string; otherUserId?: string };
};

// Alias used by all existing screen components — points to the home stack
export type RootStackParamList = HomeStackParamList;
