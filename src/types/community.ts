export type PostType = 'post' | 'testimony' | 'prayer' | 'question' | 'scripture';
export type ReactionType = 'love' | 'praying' | 'inspired' | 'amen' | 'helpful';
export type FeedFilter = 'all' | 'trending' | 'recent' | 'prayer' | 'bible' | 'groups';

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

// ── Sample / seed data ────────────────────────────────────────────────────────

const now = Date.now();
const h = (n: number) => now - n * 3_600_000;

export const SAMPLE_POSTS: Post[] = [
  {
    id: 'sp1', authorId: 'u1', authorName: 'Sarah Johnson', authorColor: '#C9A96B',
    type: 'testimony', content: 'God answered my prayer after months of waiting. I was unemployed for almost a year, feeling hopeless. Then out of nowhere I got a job offer that matched everything I had been praying for. He is faithful! 🙌',
    reactions: { love: 42, praying: 17, inspired: 31, amen: 28, helpful: 5 },
    commentCount: 23, prayerCount: 0, createdAt: h(2),
  },
  {
    id: 'sp2', authorId: 'u2', authorName: 'Michael Owusu', authorColor: '#7BA8C8',
    type: 'prayer', content: 'Please pray for my final exams tomorrow. I have been struggling with anxiety and fear. Trusting God for peace that surpasses all understanding. 🙏',
    reactions: { love: 18, praying: 64, inspired: 4, amen: 12, helpful: 2 },
    commentCount: 14, prayerCount: 128, createdAt: h(5),
  },
  {
    id: 'sp3', authorId: 'u3', authorName: 'Grace Amankwah', authorColor: '#7BA87B',
    type: 'scripture', scriptureRef: 'John 15:5',
    content: '"I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit; apart from me you can do nothing." What stands out to you from this verse today?',
    reactions: { love: 29, praying: 8, inspired: 44, amen: 37, helpful: 11 },
    commentCount: 38, prayerCount: 0, createdAt: h(8),
  },
  {
    id: 'sp4', authorId: 'u4', authorName: 'Emmanuel Kofi', authorColor: '#A87BA8',
    type: 'question',
    content: 'What does Romans 8:28 mean "in all things God works for the good of those who love him"? How do you apply this during really dark seasons?',
    reactions: { love: 15, praying: 6, inspired: 9, amen: 22, helpful: 34 },
    commentCount: 47, prayerCount: 0, createdAt: h(12),
  },
  {
    id: 'sp5', authorId: 'u5', authorName: 'Rebecca Asante', authorColor: '#C87B7B',
    type: 'post',
    content: 'Feeling so blessed and grateful today. Woke up early, spent time in the Word and in prayer, and I feel God\'s peace like never before. "This is the day the Lord has made — let us rejoice and be glad in it." Psalm 118:24 ❤️',
    reactions: { love: 67, praying: 12, inspired: 53, amen: 41, helpful: 8 },
    commentCount: 19, prayerCount: 0, createdAt: h(18),
  },
  {
    id: 'sp6', authorId: 'u6', authorName: 'Daniel Mensah', authorColor: '#D4B060',
    type: 'testimony',
    content: 'After three years of a broken marriage, my wife and I reconciled last night. We prayed together for the first time in years. God restores what the enemy destroys. Never stop praying. ✨',
    reactions: { love: 89, praying: 34, inspired: 76, amen: 92, helpful: 7 },
    commentCount: 61, prayerCount: 0, createdAt: h(24),
  },
  {
    id: 'sp7', authorId: 'u7', authorName: 'Abena Fosuaa', authorColor: '#7B8EA8',
    type: 'prayer',
    content: 'Requesting prayer for my father who was diagnosed with stage 3 cancer this week. Our family is devastated but we believe in a God who heals. Standing on Isaiah 53:5. 🙏',
    reactions: { love: 103, praying: 218, inspired: 14, amen: 87, helpful: 6 },
    commentCount: 72, prayerCount: 341, createdAt: h(30),
  },
  {
    id: 'sp8', authorId: 'u8', authorName: 'Joshua Acheampong', authorColor: '#7BA8C8',
    type: 'post',
    content: 'Reminder for anyone who needs this today: God\'s timing is perfect. The waiting is not wasted. He is working behind the scenes. Trust the process. 🌟',
    reactions: { love: 156, praying: 29, inspired: 134, amen: 118, helpful: 45 },
    commentCount: 33, prayerCount: 0, createdAt: h(36),
  },
];

export const SAMPLE_GROUPS: Group[] = [
  { id: 'g1', name: 'Young Adults Bible Study',  description: 'Weekly study for ages 18–30',           icon: '📖', memberCount: 147, category: 'bible'        },
  { id: 'g2', name: 'Prayer Warriors',            description: 'Daily intercessory prayer',             icon: '🙏', memberCount: 289, category: 'prayer'       },
  { id: 'g3', name: 'College Christians',          description: 'Faith and campus life',                 icon: '🎓', memberCount: 93,  category: 'encouragement' },
  { id: 'g4', name: 'Marriage & Family',           description: 'Strengthening Christian homes',         icon: '❤️', memberCount: 204, category: 'encouragement'},
  { id: 'g5', name: "Men's Fellowship",            description: 'Brotherhood and accountability',        icon: '🤝', memberCount: 118, category: 'encouragement' },
  { id: 'g6', name: "Women's Fellowship",          description: 'Women growing in grace',                icon: '🌸', memberCount: 176, category: 'encouragement' },
  { id: 'g7', name: 'Missions & Outreach',         description: 'Sharing the gospel worldwide',          icon: '🌍', memberCount: 62,  category: 'bible'        },
];

export const SAMPLE_COMMENTS: Comment[] = [
  { id: 'c1', postId: 'sp1', authorId: 'ua', authorName: 'Priscilla Osei', authorColor: '#C9A96B', content: 'This is so encouraging! God is faithful indeed. 🙏 Congratulations!', createdAt: Date.now() - 3_600_000, replyCount: 2 },
  { id: 'c2', postId: 'sp1', authorId: 'ub', authorName: 'Kwame Addo', authorColor: '#7BA8C8', content: 'He is worthy of all praise! Thank you for sharing this testimony.', createdAt: Date.now() - 7_200_000, replyCount: 0 },
  { id: 'c3', postId: 'sp1', authorId: 'uc', authorName: 'Nana Adjoa', authorColor: '#7BA87B', content: 'Romans 8:28 is so real! God truly does work all things for good. ❤️', createdAt: Date.now() - 10_800_000, replyCount: 1 },
];
