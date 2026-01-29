
export type AIModel = 'gemini-3-flash-preview' | 'gemini-3-pro-preview' | 'gemini-flash-lite-latest';
export type Language = 'pt-BR' | 'en-US';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Story {
  id: string;
  title: string;
  universe: string;
  messages: Message[];
  updatedAt: number;
  author?: string;
  authorId?: string;
  preferredModel?: AIModel;
  isPublished?: boolean;
}

export type View = 'chat' | 'ideas' | 'community' | 'settings' | 'auth';

export interface IdeaPrompt {
  id: string;
  title: string;
  category: string;
  prompt: string;
}
