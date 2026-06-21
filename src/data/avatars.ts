export type AvatarDef = {
  id: string;
  emoji: string;
  bg: string;           // solid background color
  category: 'faith' | 'nature' | 'joy' | 'peace';
};

export const AVATAR_CATEGORIES: { key: AvatarDef['category']; label: string }[] = [
  { key: 'faith',  label: '✝️ Faith'   },
  { key: 'nature', label: '🌿 Nature'  },
  { key: 'joy',    label: '✨ Joy'     },
  { key: 'peace',  label: '🕊️ Peace'  },
];

export const AVATARS: AvatarDef[] = [
  // ── Faith ─────────────────────────────────────────────────────────────────
  { id: 'f1', emoji: '✝️',  bg: '#3D2B1F', category: 'faith' },
  { id: 'f2', emoji: '🕊️',  bg: '#1E3A5C', category: 'faith' },
  { id: 'f3', emoji: '📖',  bg: '#2D4A38', category: 'faith' },
  { id: 'f4', emoji: '🙏',  bg: '#5C3D1E', category: 'faith' },
  { id: 'f5', emoji: '⭐',  bg: '#1A2C5B', category: 'faith' },
  { id: 'f6', emoji: '🌟',  bg: '#4A2B72', category: 'faith' },
  { id: 'f7', emoji: '☀️',  bg: '#7A4E1A', category: 'faith' },
  { id: 'f8', emoji: '🔥',  bg: '#7A2B1A', category: 'faith' },

  // ── Nature ────────────────────────────────────────────────────────────────
  { id: 'n1', emoji: '🌿',  bg: '#1E4A2D', category: 'nature' },
  { id: 'n2', emoji: '🌸',  bg: '#5C2240', category: 'nature' },
  { id: 'n3', emoji: '🌊',  bg: '#1A3D5C', category: 'nature' },
  { id: 'n4', emoji: '🌻',  bg: '#6B3D10', category: 'nature' },
  { id: 'n5', emoji: '🦋',  bg: '#3D1E6B', category: 'nature' },
  { id: 'n6', emoji: '🌲',  bg: '#1E3D2D', category: 'nature' },
  { id: 'n7', emoji: '🌺',  bg: '#6B1E3D', category: 'nature' },
  { id: 'n8', emoji: '🍃',  bg: '#2D4A1E', category: 'nature' },

  // ── Joy ───────────────────────────────────────────────────────────────────
  { id: 'j1', emoji: '😇',  bg: '#2B3D6B', category: 'joy' },
  { id: 'j2', emoji: '🥰',  bg: '#6B1E2B', category: 'joy' },
  { id: 'j3', emoji: '✨',  bg: '#1E2B6B', category: 'joy' },
  { id: 'j4', emoji: '🎉',  bg: '#4A2B1E', category: 'joy' },
  { id: 'j5', emoji: '💫',  bg: '#1E3D6B', category: 'joy' },
  { id: 'j6', emoji: '🌈',  bg: '#3D1E5C', category: 'joy' },
  { id: 'j7', emoji: '🎵',  bg: '#1E4A4A', category: 'joy' },
  { id: 'j8', emoji: '🌙',  bg: '#1A1E5C', category: 'joy' },

  // ── Peace ─────────────────────────────────────────────────────────────────
  { id: 'p1', emoji: '🦅',  bg: '#2B1E10', category: 'peace' },
  { id: 'p2', emoji: '🦁',  bg: '#5C3010', category: 'peace' },
  { id: 'p3', emoji: '🐑',  bg: '#1E3D3D', category: 'peace' },
  { id: 'p4', emoji: '🐦',  bg: '#10305C', category: 'peace' },
  { id: 'p5', emoji: '🦢',  bg: '#2D3D5C', category: 'peace' },
  { id: 'p6', emoji: '🌾',  bg: '#5C4010', category: 'peace' },
  { id: 'p7', emoji: '🏔️',  bg: '#1E2D4A', category: 'peace' },
  { id: 'p8', emoji: '🕯️',  bg: '#4A2B10', category: 'peace' },
];
