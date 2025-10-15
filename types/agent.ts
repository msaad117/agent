export interface AgentProfile {
  id: string;
  name: string;
  description?: string;
  voiceId?: string;
  voiceSampleUrl?: string;
  systemPrompt: string;
  knowledgeBase: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AgentChatRequest {
  agentId: string;
  message: string;
  history: AgentMessage[];
}

export interface AgentChatResponse {
  reply: string;
  sources?: string[];
}
