export type ChatUser = {
  id: string;          // device ID
  displayName: string;
  initials: string;
  avatarColor: string;
  lastSeen: number;    // epoch ms
  isOnline: boolean;
};

export type MessageType = 'text' | 'scripture' | 'devotion' | 'system';

export type ScripturePayload = {
  reference: string;
  text: string;
  bookIndex: number;
  chapter: number;
  verse: number;
};

export type Reaction = {
  emoji: string;
  userIds: string[];
};

export type ChatMessage = {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  type: MessageType;
  text: string;
  scripture?: ScripturePayload;
  reactions: Reaction[];
  readBy: string[];
  replyToId?: string;
  replyToText?: string;
  createdAt: number;   // epoch ms
  deletedAt?: number;
};

export type LastMessage = {
  text: string;
  senderId: string;
  senderName: string;
  createdAt: number;
};

export type Chat = {
  id: string;
  type: 'dm' | 'group';
  // DM
  participantIds: string[];
  participantNames: Record<string, string>;
  // Group
  name?: string;
  description?: string;
  createdBy?: string;
  memberIds?: string[];
  adminIds?: string[];
  // Shared
  lastMessage?: LastMessage;
  unreadCounts: Record<string, number>;
  typingUserIds: string[];
  createdAt: number;
  updatedAt: number;
};

export const REACTIONS = ['🙏', '❤️', '🔥', '✨', '👍'] as const;
export type ReactionEmoji = typeof REACTIONS[number];

export const AVATAR_COLORS = [
  '#C9A96B', '#5DBF8A', '#5B9BD5', '#E07070',
  '#A78BFA', '#F59E0B', '#10B981', '#EC4899',
];
