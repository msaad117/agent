import { NextResponse } from 'next/server';
import { getAgent } from '@/lib/agentStore';
import { generateAgentReply } from '@/lib/llm';
import { generateSpeech } from '@/lib/voice';
import type { AgentMessage } from '@/types/agent';

interface Params {
  params: { id: string };
}

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: Params) {
  const agent = getAgent(params.id);
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const payload = (await request.json()) as {
    message: string;
    history: AgentMessage[];
  };

  if (!payload.message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const { reply, sources } = await generateAgentReply(agent, payload.history ?? [], payload.message);
  let audioBase64: string | undefined;

  try {
    const audioBuffer = await generateSpeech({ text: reply, voiceId: agent.voiceId });
    const bytes = Buffer.from(audioBuffer);
    audioBase64 = bytes.toString('base64');
  } catch (error) {
    console.warn('Failed to generate ElevenLabs audio', error);
  }

  return NextResponse.json({ reply, audio: audioBase64, sources });
}
