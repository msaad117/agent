'use client';

import { useEffect, useState } from 'react';
import AgentForm from '@/components/AdminAgentForm';
import type { AgentProfile } from '@/types/agent';

export default function AdminPage() {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/agents');
      if (!response.ok) {
        throw new Error('Failed to load agents');
      }
      const payload = (await response.json()) as { agents: AgentProfile[] };
      setAgents(payload.agents);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <main>
      <div className="container card">
        <h1>Agent Admin Panel</h1>
        <p>
          Upload your voice sample, craft prompts, and paste content to keep the agent grounded. Every
          update is available instantly in the floating widget preview.
        </p>
        <AgentForm onChange={refresh} />
        <section style={{ marginTop: '2rem' }}>
          <h2>Existing agents</h2>
          {isLoading && <p>Loading agents…</p>}
          {error && <p style={{ color: '#f87171' }}>{error}</p>}
          {!isLoading && !agents.length && <p>No agents yet. Create one above.</p>}
          <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0' }}>
            {agents.map((agent) => (
              <li
                key={agent.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}
              >
                <strong>{agent.name}</strong>
                <p style={{ margin: '0.5rem 0' }}>{agent.description}</p>
                <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                  Updated {new Date(agent.updatedAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
