'use client';

import { useState } from 'react';
import type { AgentProfile } from '@/types/agent';

type Props = {
  onChange?: () => void;
};

const initialForm = {
  id: '',
  name: '',
  description: '',
  systemPrompt: 'You are a helpful assistant that only answers with the supplied knowledge.',
  knowledgeBase: '',
  voiceId: '',
  voiceSampleUrl: ''
};

export default function AgentForm({ onChange }: Props) {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const method = form.id ? 'PUT' : 'POST';
    const url = form.id ? `/api/agents/${form.id}` : '/api/agents';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        throw new Error('Failed to save agent');
      }

      const payload = (await response.json()) as { agent: AgentProfile };
      setForm((current) => ({ ...current, id: payload.agent.id }));
      setStatus('Saved successfully');
      onChange?.();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setStatus(null);
  };

  return (
    <form onSubmit={handleSubmit} className="agent-form">
      <div className="field-grid">
        <label>
          <span>Name</span>
          <input name="name" value={form.name} onChange={handleChange} required placeholder="Product Coach" />
        </label>
        <label>
          <span>Voice ID</span>
          <input
            name="voiceId"
            value={form.voiceId}
            onChange={handleChange}
            placeholder="ElevenLabs voice id"
          />
        </label>
        <label>
          <span>Voice sample URL</span>
          <input
            name="voiceSampleUrl"
            value={form.voiceSampleUrl}
            onChange={handleChange}
            placeholder="https://..."
          />
        </label>
      </div>
      <label>
        <span>Description</span>
        <input
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Used internally to identify the agent"
        />
      </label>
      <label>
        <span>System prompt</span>
        <textarea
          name="systemPrompt"
          value={form.systemPrompt}
          onChange={handleChange}
          rows={4}
        />
      </label>
      <label>
        <span>Knowledge base content</span>
        <textarea
          name="knowledgeBase"
          value={form.knowledgeBase}
          onChange={handleChange}
          rows={8}
          placeholder="Paste the information your agent should use when answering questions."
        />
      </label>
      <div className="form-actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : form.id ? 'Update agent' : 'Create agent'}
        </button>
        <button type="button" onClick={handleReset} className="secondary">
          Reset
        </button>
      </div>
      {status && <p className="status">{status}</p>}
      <style jsx>{`
        .agent-form {
          margin-top: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        label {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        span {
          font-weight: 600;
        }
        input,
        textarea {
          background: rgba(15, 23, 42, 0.9);
          border-radius: 12px;
          border: 1px solid var(--border);
          padding: 0.75rem 1rem;
          color: var(--foreground);
        }
        input:focus,
        textarea:focus {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .field-grid {
          display: grid;
          gap: 1rem;
        }
        @media (min-width: 720px) {
          .field-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        .form-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        button {
          background: var(--accent);
          color: #0f172a;
          font-weight: 600;
          padding: 0.75rem 1.25rem;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 24px rgba(34, 211, 238, 0.25);
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .secondary {
          background: transparent;
          color: var(--foreground);
          border: 1px solid var(--border);
        }
        .status {
          font-size: 0.875rem;
          opacity: 0.8;
        }
      `}</style>
    </form>
  );
}
