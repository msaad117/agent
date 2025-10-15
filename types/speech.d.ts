interface SpeechRecognitionResult {
  readonly transcript: string;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList extends ArrayLike<SpeechRecognitionResult[]> {}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResult[][];
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

declare class SpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onaudioend: (() => void) | null;
  onaudiostart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
}

declare class webkitSpeechRecognition extends SpeechRecognition {}

declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof webkitSpeechRecognition;
  }
}
export {};
