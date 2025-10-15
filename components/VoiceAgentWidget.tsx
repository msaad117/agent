'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import useSWR from 'swr';
import type { AgentMessage, AgentProfile } from '@/types/agent';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type WidgetState = 'idle' | 'listening' | 'processing';

type ChatMessage = AgentMessage & { id: string };

export default function VoiceAgentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [state, setState] = useState<WidgetState>('idle');
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const { data, mutate } = useSWR<{ agents: AgentProfile[] }>('/api/agents', fetcher, {
    revalidateOnFocus: false
  });

  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setActiveAgentId(null);
      stopRecognition();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser.');
    }
  }, []);

  const startRecognition = () => {
    if (state === 'processing') {
      return;
    }
    const SpeechRecognitionCtor =
      (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition ||
      (window as typeof window & { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setError('Speech recognition is not supported.');
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleUserInput(transcript);
    };
    recognition.onerror = (event) => {
      setError(event.error || 'Speech recognition error');
      setState('idle');
    };
    recognition.onend = () => {
      setState((current) => (current === 'listening' ? 'idle' : current));
    };
    recognition.start();
    recognitionRef.current = recognition;
    setState('listening');
  };

  const stopRecognition = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setState('idle');
  };

  const playAudio = (audioBuffer: ArrayBuffer) => {
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = audioRef.current ?? new Audio();
    audio.src = url;
    audio.play().catch((err) => {
      console.error(err);
      setError('Failed to play audio response.');
    });
    audioRef.current = audio;
  };

  const sendMessage = async (text: string, nextHistory: ChatMessage[]) => {
    const agentId = activeAgentId ?? data?.agents?.[0]?.id;
    if (!agentId) {
      setError('Create an agent in the admin panel first.');
      return;
    }
    setActiveAgentId(agentId);
    setState('processing');
    setError(null);

    try {
      const response = await fetch(`/api/agents/${agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: nextHistory.map(({ role, content, timestamp }) => ({ role, content, timestamp }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const payload = (await response.json()) as {
        reply: string;
        audio?: string;
        sources?: string[];
      };

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: payload.reply,
        timestamp: new Date().toISOString()
      };

      setMessages((current) => [...current, assistantMessage]);

      if (payload.audio) {
        const audioBuffer = Uint8Array.from(atob(payload.audio), (char) => char.charCodeAt(0)).buffer;
        playAudio(audioBuffer);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setState('idle');
    }
  };

  const handleToggle = () => {
    setIsOpen((current) => !current);
  };

  const handleRefreshAgents = () => {
    void mutate();
  };

  const handleUserInput = (rawText: string) => {
    const text = rawText.trim();
    if (!text || state === 'processing') {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    void sendMessage(text, nextHistory);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = inputValue.trim();
    if (!text) {
      return;
    }

    setInputValue('');
    handleUserInput(text);
  };

  return (
    <div className={`voice-widget ${isOpen ? 'open' : ''}`}>
      <button className="toggle" onClick={handleToggle} aria-expanded={isOpen}>
        {isOpen ? '×' : 'Talk'}
      </button>
      {isOpen && (
        <div className="panel">
          <header>
            <div>
              <h3>Voice Agent</h3>
              <p>{state === 'listening' ? 'Listening…' : state === 'processing' ? 'Thinking…' : 'Idle'}</p>
            </div>
            <button onClick={handleRefreshAgents} className="secondary">
              Refresh agents
            </button>
          </header>
          <section className="messages" aria-live="polite">
            {messages.map((message) => (
              <article key={message.id} className={message.role}>
                <span>{message.role === 'user' ? 'You' : 'Agent'}</span>
                <p>{message.content}</p>
              </article>
            ))}
            {!messages.length && <p className="empty">Ask something to get started.</p>}
          </section>
          {error && <p className="error">{error}</p>}
          <footer>
            <form className="input-row" onSubmit={handleSubmit}>
              <label htmlFor="voice-widget-input" className="sr-only">
                Type your message
              </label>
              <input
                id="voice-widget-input"
                type="text"
                placeholder="Type a message"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                disabled={state === 'processing'}
              />
              <button type="submit" disabled={state === 'processing' || !inputValue.trim()}>
                Send
              </button>
            </form>
            <div className="control-row">
              <button
                type="button"
                onClick={state === 'listening' ? stopRecognition : startRecognition}
                disabled={state === 'processing'}
              >
                {state === 'listening' ? 'Stop listening' : 'Talk'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  stopRecognition();
                }}
                className="secondary"
              >
                Reset chat
              </button>
            </div>
          </footer>
      </div>
    )}
      <style jsx>{`
        .voice-widget {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: var(--widget-width);
          z-index: 40;
        }
        .toggle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: none;
          background: var(--accent);
          color: #0f172a;
          font-weight: 700;
          font-size: 1.25rem;
          box-shadow: 0 18px 32px rgba(34, 211, 238, 0.3);
          cursor: pointer;
        }
        .panel {
          margin-top: 1rem;
          background: rgba(15, 23, 42, 0.95);
          border-radius: 24px;
          border: 1px solid var(--border);
          padding: 1.25rem;
          box-shadow: 0 24px 48px rgba(15, 23, 42, 0.6);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: min(540px, 80vh);
        }
        header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }
        header p {
          margin: 0.25rem 0 0;
          font-size: 0.875rem;
          opacity: 0.7;
        }
        .messages {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding-right: 0.5rem;
        }
        article {
          padding: 0.75rem 1rem;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.25);
          background: rgba(30, 41, 59, 0.75);
        }
        article.user {
          align-self: flex-end;
          background: rgba(34, 211, 238, 0.15);
        }
        article span {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          opacity: 0.6;
        }
        article p {
          margin: 0.5rem 0 0;
        }
        .empty {
          text-align: center;
          opacity: 0.6;
        }
        .error {
          color: #fda4af;
          font-size: 0.875rem;
        }
        footer {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .input-row {
          display: flex;
          gap: 0.5rem;
        }
        .input-row input {
          flex: 1;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: rgba(15, 23, 42, 0.6);
          color: var(--foreground);
          padding: 0.75rem 1rem;
        }
        footer button {
          border-radius: 999px;
          border: none;
          padding: 0.75rem 1rem;
          font-weight: 600;
          cursor: pointer;
          background: var(--accent);
          color: #0f172a;
          transition: opacity 0.2s ease;
        }
        footer button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .input-row button {
          flex: 0 0 auto;
        }
        .control-row {
          display: flex;
          gap: 0.75rem;
        }
        .control-row button {
          flex: 1;
        }
        footer button.secondary,
        header .secondary {
          background: transparent;
          color: var(--foreground);
          border: 1px solid var(--border);
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        @media (max-width: 640px) {
          .voice-widget {
            right: 1rem;
            left: 1rem;
            width: auto;
          }
        }
      `}</style>
    </div>
  );
}
