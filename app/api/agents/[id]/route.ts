import { NextResponse } from 'next/server';
import { deleteAgent, getAgent, indexKnowledge, upsertAgent } from '@/lib/agentStore';
import type { AgentProfile } from '@/types/agent';

interface Params {
  params: { id: string };
}

export async function GET(_request: Request, { params }: Params) {
  const agent = getAgent(params.id);
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }
  return NextResponse.json({ agent });
}

export async function PUT(request: Request, { params }: Params) {
  const payload = (await request.json()) as Partial<AgentProfile>;
  if (!payload.name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const agent = upsertAgent({
    id: params.id,
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

export async function DELETE(_request: Request, { params }: Params) {
  const success = deleteAgent(params.id);
  return NextResponse.json({ success });
}
