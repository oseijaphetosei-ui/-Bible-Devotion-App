export type BibleTranslation = 'NIV' | 'ESV' | 'KJV' | 'NASB';

export type Devotion = {
  title: string;
  scriptureReference: string;
  scriptureText: string;
  keyTheme: string;
  devotionalBody: string[];
  lifeApplication: string;
  reflectionQuestion: string;
  guidedPrayer: string;
  shareableQuote: string;
};

export type DevotionRequest = {
  topic: string;
  translation: BibleTranslation;
};

export type FontSize = 'sm' | 'md' | 'lg' | 'xl';

export const FONT_SIZE_MAP: Record<FontSize, number> = {
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
};

export const QUICK_TAGS = ['Hope', 'Peace', 'Faith', 'Grace', 'Wisdom', 'Anxiety', 'Strength', 'Forgiveness'];
export const TRANSLATIONS: BibleTranslation[] = ['NIV', 'ESV', 'KJV', 'NASB'];
