import VoiceAgentWidget from '@/components/VoiceAgentWidget';

export default function WidgetPage() {
  return (
    <div
      style={{
        background: 'transparent',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <VoiceAgentWidget />
    </div>
  );
}
