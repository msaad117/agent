import { randomUUID } from 'crypto';
import { AgentProfile, AgentMessage } from '@/types/agent';

type AgentRecord = AgentProfile & {
  vectorStore?: string[];
};

const agents = new Map<string, AgentRecord>();

export function listAgents(): AgentProfile[] {
  return Array.from(agents.values()).map(({ vectorStore, ...agent }) => agent);
}

export function getAgent(id: string): AgentProfile | undefined {
  const agent = agents.get(id);
  if (!agent) return undefined;
  const { vectorStore, ...rest } = agent;
  return rest;
}

export function upsertAgent(input: Partial<AgentProfile> & { name: string }): AgentProfile {
  const now = new Date().toISOString();
  const id = input.id ?? randomUUID();
  const previous = agents.get(id);
  const agent: AgentRecord = {
    id,
    name: input.name,
    description: input.description ?? previous?.description ?? '',
    voiceId: input.voiceId ?? previous?.voiceId,
    voiceSampleUrl: input.voiceSampleUrl ?? previous?.voiceSampleUrl,
    systemPrompt: input.systemPrompt ?? previous?.systemPrompt ?? 'You are a helpful voice assistant.',
    knowledgeBase: input.knowledgeBase ?? previous?.knowledgeBase ?? '',
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
    vectorStore: previous?.vectorStore ?? []
  };
  agents.set(id, agent);
  return getAgent(id)!;
}

export function deleteAgent(id: string): boolean {
  return agents.delete(id);
}

export interface RetrievalChunk {
  chunk: string;
  score: number;
}

export function indexKnowledge(agentId: string, content: string): void {
  const record = agents.get(agentId);
  if (!record) return;
  const normalized = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  record.vectorStore = normalized;
  record.updatedAt = new Date().toISOString();
  agents.set(agentId, record);
}

export function retrieveKnowledge(agentId: string, query: string, limit = 3): RetrievalChunk[] {
  const record = agents.get(agentId);
  if (!record?.vectorStore?.length) {
    return [];
  }
  return record.vectorStore
    .map((chunk) => ({
      chunk,
      score: similarity(query, chunk)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function similarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const intersection = new Set([...wordsA].filter((word) => wordsB.has(word)));
  const union = new Set([...wordsA, ...wordsB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

export function summariseHistory(history: AgentMessage[]): string {
  return history
    .slice(-5)
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join('\n');
}
