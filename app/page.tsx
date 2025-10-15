import Link from 'next/link';
import VoiceAgentWidget from '@/components/VoiceAgentWidget';

export default function HomePage() {
  return (
    <main>
      <div className="container grid">
        <section className="card">
          <h1>Launch Your Own Voice Agent</h1>
          <p>
            Create ElevenLabs-quality voice experiences that you can drop into any product as a widget.
            Train the agent on your own content, customize the voice, and embed it anywhere with a single
            script tag.
          </p>
          <p>
            Head to the <Link href="/admin">admin panel</Link> to craft your personalized assistant, then
            come back here to test it live in the floating widget.
          </p>
        </section>
        <section className="card">
          <h2>Live widget preview</h2>
          <p>The widget resets its chat history whenever it closes or you reload the page.</p>
          <VoiceAgentWidget />
        </section>
      </div>
    </main>
  );
}
