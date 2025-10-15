import { NextResponse } from 'next/server';
import { indexKnowledge, listAgents, upsertAgent } from '@/lib/agentStore';
import type { AgentProfile } from '@/types/agent';

export async function GET() {
  return NextResponse.json({ agents: listAgents() });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<AgentProfile>;
  if (!payload.name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const agent = upsertAgent({
    name: payload.name,
    description: payload.description,
    systemPrompt: payload.systemPrompt,
    knowledgeBase: payload.knowledgeBase,
    voiceId: payload.voiceId,
    voiceSampleUrl: payload.voiceSampleUrl
  });

  if (typeof payload.knowledgeBase === 'string') {
    indexKnowledge(agent.id, payload.knowledgeBase);
  }

  return NextResponse.json({ agent });
}
