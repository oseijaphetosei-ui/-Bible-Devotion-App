export type PostType = 'post' | 'testimony' | 'prayer' | 'question' | 'scripture';
export type ReactionType = 'love' | 'praying' | 'inspired' | 'amen' | 'helpful';
export type FeedFilter = 'all' | 'trending' | 'recent' | 'prayer' | 'bible' | 'testimony' | 'question' | 'groups';

// ── Post type display metadata ────────────────────────────────────────────────

export const POST_TYPE_META: Record<PostType, { icon: string; label: string; color: string }> = {
  post:       { icon: '',   label: '',                     color: '' },
  testimony:  { icon: '✨', label: 'Testimony',            color: '#C9A96B' },
  prayer:     { icon: '🙏', label: 'Prayer Request',       color: '#7BA8C8' },
  question:   { icon: '❓', label: 'Question',             color: '#A87BA8' },
  scripture:  { icon: '📖', label: 'Scripture Discussion', color: '#7BA87B' },
};

export const REACTION_META: Record<ReactionType, { emoji: string; label: string }> = {
  love:     { emoji: '❤️', label: 'Love'    },
  praying:  { emoji: '🙏', label: 'Praying' },
  inspired: { emoji: '✨', label: 'Inspired' },
  amen:     { emoji: '🔥', label: 'Amen'    },
  helpful:  { emoji: '👍', label: 'Helpful' },
};

export const REACTIONS = Object.entries(REACTION_META) as [ReactionType, { emoji: string; label: string }][];

// ── Categories ────────────────────────────────────────────────────────────────

export const COMMUNITY_CATEGORIES = [
  { id: 'prayer',        icon: '🙏', label: 'Prayer Requests',    color: '#7BA8C8' },
  { id: 'bible',         icon: '📖', label: 'Bible Discussions',  color: '#C9A96B' },
  { id: 'testimonies',   icon: '✨', label: 'Testimonies',        color: '#D4B060' },
  { id: 'encouragement', icon: '❤️', label: 'Encouragement',     color: '#C87B7B' },
  { id: 'questions',     icon: '❓', label: 'Q & A',              color: '#A87BA8' },
  { id: 'challenges',    icon: '🎯', label: 'Daily Challenges',   color: '#7BA87B' },
  { id: 'groups',        icon: '👥', label: 'Discover Groups',    color: '#7B8EA8' },
] as const;

export type CategoryId = typeof COMMUNITY_CATEGORIES[number]['id'];

export const FEED_FILTERS: { key: FeedFilter; label: string }[] = [
  { key: 'all',      label: 'All'      },
  { key: 'trending', label: 'Trending' },
  { key: 'recent',   label: 'Recent'   },
  { key: 'prayer',   label: 'Prayer'   },
  { key: 'bible',    label: 'Bible'    },
  { key: 'groups',   label: 'Groups'   },
];

// ── Core types ────────────────────────────────────────────────────────────────

export type Post = {
  id: string;
  authorId: string;
  authorName: string;
  authorColor: string;
  type: PostType;
  content: string;
  scriptureRef?: string;
  category?: string;
  reactions: Record<ReactionType, number>;
  userReaction?: ReactionType;
  commentCount: number;
  prayerCount: number;
  userPraying?: boolean;
  createdAt: number;
  answered?: boolean;
};

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorColor: string;
  content: string;
  createdAt: number;
  parentId?: string;
  replyCount: number;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  icon: string;
  memberCount: number;
  category: string;
  joined?: boolean;
  chatId?: string;
};

