export type RootStackParamList = {
  Home: undefined;
  Bible: { bookIndex?: number; chapter?: number } | undefined;
  Stories: undefined;
  StoryReader: { storyId: string };
  Verse: undefined;
  Goals: undefined;
};
