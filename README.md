# NextTS Voice Agent Platform

A Next.js (TypeScript) application that lets you create ElevenLabs-powered voice agents, train them on
custom knowledge, and embed the resulting conversational widget inside any website.

## Features

- 🎙️ Two-way voice conversations using browser speech recognition for input and ElevenLabs text-to-speech
  for responses.
- 🧠 Admin panel to create agents, craft system prompts, and paste knowledge so answers stay grounded in
  your data.
- 🗂️ Lightweight retrieval pipeline that chunks your knowledge base and reuses it in prompts.
- 🔁 Chat history resets automatically when the widget closes or the page reloads for privacy.
- 🔌 Copy-paste embeddable widget via a single script that mounts an iframe pointing at `/widget`.

## Getting started

1. Install dependencies (Node.js 18+):

   ```bash
   npm install
   ```

2. Copy the environment template and fill in your API keys:

   ```bash
   cp .env.example .env.local
   ```

   - `ELEVENLABS_API_KEY` – required for TTS and optional voice cloning.
   - `ELEVENLABS_DEFAULT_VOICE_ID` – default voice used when an agent does not specify one.
   - `LLM_API_URL` / `LLM_API_KEY` / `LLM_MODEL_ID` – optional OpenAI-compatible endpoint (e.g. OpenAI,
     Together, local inference proxy). When omitted the API falls back to a deterministic rule-based
     response using the retrieved context.

   > 🛠️ **Speech platform** – All text-to-speech requests in the current APIs are routed to
   > [ElevenLabs](https://elevenlabs.io/). The `lib/voice.ts` helper wraps the ElevenLabs REST
   > interface so you can swap in another provider by replacing that module (or adapting the helper to
   > call a different endpoint) without touching the rest of the application code.

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Visit `http://localhost:3000` for the marketing page with a live widget preview and `http://localhost:3000/admin`
   for the admin panel.

## Embedding the widget

Serve the application and include the script below on any site where you want the assistant to appear.
Call `mountVoiceAgentWidget` after the script loads to inject an iframe that hosts the widget UI.

```html
<script src="https://your-domain.com/widget.js" defer onload="mountVoiceAgentWidget()"></script>
```

You can customize dimensions or override the iframe source:

```html
<script>
  window.addEventListener('DOMContentLoaded', () => {
    const iframe = mountVoiceAgentWidget({ width: '420px', height: '640px', src: 'https://your-domain.com/widget' });
    console.log('Voice widget ready', iframe);
  });
</script>
```

## Voice training workflow

1. Navigate to the admin panel and fill out the agent form.
2. Paste the content you want the agent to rely on into the "Knowledge base" field. Each save re-chunks
   the content so fresh answers reflect your latest updates.
3. Provide an ElevenLabs voice ID or upload a voice sample via the ElevenLabs dashboard, then paste the
   resulting ID here. The chat API will request speech using this ID whenever a reply is generated.
4. (Optional) Host your sample audio somewhere accessible and store the URL for reference in the admin list.

## API surface

- `POST /api/agents` – create a new agent profile.
- `GET /api/agents` – list agents for selection in the widget and admin panel.
- `PUT /api/agents/:id` – update prompts, knowledge, or voice metadata.
- `DELETE /api/agents/:id` – remove an agent.
- `POST /api/agents/:id/chat` – send a chat turn; returns the assistant text, optional audio (base64), and
  the context snippets used.

## Notes

- The in-memory store is intended for prototyping. For production, replace `lib/agentStore.ts` with a
  database-backed implementation and connect a vector database for RAG.
- ElevenLabs voice cloning requires uploading audio via their API or dashboard. The helper in `lib/voice.ts`
  demonstrates how to call the upload endpoint if you collect a `File` on the client first.
- Browser speech recognition availability varies; the widget automatically displays an error if it is not
  supported so users can fall back to typing.
