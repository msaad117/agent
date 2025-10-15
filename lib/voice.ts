const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

interface GenerateSpeechOptions {
  text: string;
  voiceId?: string;
  modelId?: string;
  voiceSettings?: Record<string, unknown>;
}

export async function generateSpeech(options: GenerateSpeechOptions): Promise<ArrayBuffer> {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY is not configured.');
  }

  const voiceId = options.voiceId ?? process.env.ELEVENLABS_DEFAULT_VOICE_ID;
  if (!voiceId) {
    throw new Error('No voiceId provided for ElevenLabs TTS.');
  }

  const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': process.env.ELEVENLABS_API_KEY
    },
    body: JSON.stringify({
      text: options.text,
      model_id: options.modelId ?? process.env.ELEVENLABS_MODEL_ID ?? 'eleven_monolingual_v1',
      voice_settings: options.voiceSettings
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate speech: ${response.status} ${response.statusText}`);
  }

  return await response.arrayBuffer();
}

export async function uploadVoiceSample(file: File): Promise<string> {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY is not configured.');
  }

  const form = new FormData();
  form.append('file', file);

  const response = await fetch(`${ELEVENLABS_BASE_URL}/voice-lab/create-voice`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY
    },
    body: form as unknown as BodyInit
  });

  if (!response.ok) {
    throw new Error(`Failed to upload voice sample: ${response.status}`);
  }

  const payload = (await response.json()) as { voice_id: string };
  return payload.voice_id;
}
