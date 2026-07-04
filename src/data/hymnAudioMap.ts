// LOCAL_AUDIO_MAP is intentionally empty — all audio streams from Firebase Storage.
// Upload files at:  Firebase Storage → hymns/{hymnId}.mp3
// The resolver fetches the download URL automatically on first play, then caches it.
//
// To add offline bundled audio for a hymn in the future:
//   1. Drop the .mp3 into src/assets/hymn-audio/
//   2. Add:  'hymn-id': require('../assets/hymn-audio/hymn-id.mp3'),
//   3. Rebuild.

export const LOCAL_AUDIO_MAP: Record<string, number> = {};

// Hymns that have audio uploaded to Firebase Storage.
// Used by the list screen to sort audio-enabled hymns to the top.
export const HYMN_IDS_WITH_AUDIO = new Set([
  'amazing-grace',
  'how-great-thou-art',
  'great-is-thy-faithfulness',
  'blessed-assurance',
  'just-as-i-am',
  'old-rugged-cross',
  'abide-with-me',
  'jesus-paid-it-all',
  'we-gather-together',
  'i-am-thine-o-lord',
  'before-the-throne',
  'in-my-heart',
  'awesome-god',
  'springs-of-living-water',
  'faith-of-our-fathers',
  'sweet-by-and-by',
  'count-your-blessings',
  'just-a-closer-walk',
  'at-the-cross',
  'tis-so-sweet',
  'jesus-saves',
  'only-trust-him',
  'it-is-well-with-my-soul',
  'were-you-there',
]);
