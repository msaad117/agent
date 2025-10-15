import { AgentProfile, AgentMessage } from '@/types/agent';
import { retrieveKnowledge, summariseHistory } from './agentStore';

interface LlmConfig {
  endpoint: string;
  apiKey?: string;
  model?: string;
}

function getConfig(): LlmConfig | undefined {
  if (!process.env.LLM_API_URL) {
    return undefined;
  }
  return {
    endpoint: process.env.LLM_API_URL,
    apiKey: process.env.LLM_API_KEY,
    model: process.env.LLM_MODEL_ID
  };
}

export async function generateAgentReply(
  agent: AgentProfile,
  history: AgentMessage[],
  message: string
): Promise<{ reply: string; sources: string[] }> {
  const retrieval = retrieveKnowledge(agent.id, message);
  const config = getConfig();

  if (!config) {
    const fallback = buildPrompt(agent, history, message, retrieval.map((r) => r.chunk));
    return { reply: fallback, sources: retrieval.map((r) => r.chunk) };
  }

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {})
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: agent.systemPrompt },
        { role: 'system', content: 'Use the provided context snippets to answer accurately.' },
        { role: 'system', content: `Context:\n${retrieval.map((r) => r.chunk).join('\n---\n')}` },
        ...history.map((msg) => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: message }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`LLM request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
    output?: string;
  };

  const reply =
    payload.choices?.[0]?.message?.content ?? payload.output ?? 'I could not generate a response.';

  return {
    reply,
    sources: retrieval.map((r) => r.chunk)
  };
}

function buildPrompt(
  agent: AgentProfile,
  history: AgentMessage[],
  message: string,
  context: string[]
): string {
  const summary = summariseHistory(history);
  return [
    agent.systemPrompt,
    context.length ? `Context:\n${context.join('\n---\n')}` : '',
    summary ? `Recent conversation:\n${summary}` : '',
    `User message: ${message}`
  ]
    .filter(Boolean)
    .join('\n\n');
}
