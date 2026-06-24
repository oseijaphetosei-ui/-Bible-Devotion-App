export type ContextType = 'verse' | 'chapter' | 'devotion';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

export type ScriptureChat = {
  id: string;
  userId: string;
  reference: string;
  contextType: ContextType;
  context: string;
  createdAt: string;
  messages: ChatMessage[];
};

export type ScriptureChatNavParams = {
  reference: string;
  contextType: ContextType;
  context: string;
  chatId?: string;
  mode?: 'chat' | 'insights';
};

export type ScriptureInsightsNavParams = {
  reference: string;
  contextType: ContextType;
  context: string;
};

export const SUGGESTED_QUESTIONS = [
  'What does this passage mean?',
  'How can I apply this today?',
  'What does this teach about God?',
  'What does this teach about faith?',
  'Give me a prayer based on this.',
  'Show me related scriptures.',
  'Explain this in simple language.',
  'What is the historical context?',
];
