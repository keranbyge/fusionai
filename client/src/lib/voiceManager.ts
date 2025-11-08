class VoiceManager {
  private recognition: any = null;
  private isListening = false;
  private currentCallback: ((text: string) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;

      this.recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        if (this.currentCallback) {
          this.currentCallback(transcript);
        }
      };

      this.recognition.onerror = () => {
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    }
  }

  start(callback: (text: string) => void) {
    if (!this.recognition) {
      alert('Speech recognition is not supported in your browser');
      return false;
    }

    this.currentCallback = callback;
    if (!this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
        return true;
      } catch (e) {
        return false;
      }
    }
    return true;
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      this.currentCallback = null;
    }
  }

  getIsListening() {
    return this.isListening;
  }
}

export const voiceManager = new VoiceManager();
