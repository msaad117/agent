(function () {
  if (window.voiceAgentWidgetLoaded) return;
  window.voiceAgentWidgetLoaded = true;

  function createIframe(options) {
    const iframe = document.createElement('iframe');
    iframe.src = options?.src ?? '/widget';
    iframe.title = options?.title ?? 'Voice Agent Widget';
    iframe.style.position = 'fixed';
    iframe.style.bottom = '24px';
    iframe.style.right = '24px';
    iframe.style.width = options?.width ?? '360px';
    iframe.style.height = options?.height ?? '600px';
    iframe.style.border = '0';
    iframe.style.borderRadius = '24px';
    iframe.style.boxShadow = '0 24px 48px rgba(15, 23, 42, 0.35)';
    iframe.style.zIndex = '9999';
    iframe.style.background = 'transparent';
    iframe.allow = 'microphone; autoplay';
    iframe.id = options?.id ?? 'voice-agent-widget';
    return iframe;
  }

  window.mountVoiceAgentWidget = function mountVoiceAgentWidget(options) {
    const iframe = createIframe(options);
    document.body.appendChild(iframe);
    return iframe;
  };
})();
