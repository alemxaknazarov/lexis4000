// Speech synthesis and recognition - Pure Single-Word Pronunciation

let activeSpeakId = 0;
let currentAudioElement: HTMLAudioElement | null = null;

// Immediately stop any speech or audio playback in progress
export const stopAudio = () => {
  activeSpeakId++; // Invalidate any ongoing or queued callbacks
  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
      currentAudioElement.onended = null;
      currentAudioElement.onerror = null;
    } catch (_) {}
    currentAudioElement = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
  }
};

const audioCache = new Map<string, HTMLAudioElement>();

// Preload audio files for instant playback without network delays
export const preloadWordAudios = (urls: (string | undefined)[]) => {
  if (typeof window === 'undefined') return;
  urls.forEach((url) => {
    if (url && !audioCache.has(url)) {
      try {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = url;
        audioCache.set(url, audio);
      } catch (_) {}
    }
  });
};

export const getSpeechRate = (): number => {
  if (typeof window === 'undefined') return 1.0;
  const rate = localStorage.getItem('lexis_speech_rate');
  if (rate) {
    const parsed = parseFloat(rate);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 1.0;
};

export const isAutoSpeakEnabled = (): boolean => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('lexis_auto_speak') !== 'false';
};

// Pronounce target word: guaranteed exactly ONCE per call (no duplicates or echoes)
export const speakWord = (word: string, audioUrl?: string): Promise<void> => {
  stopAudio();
  const thisId = activeSpeakId;
  const userRate = getSpeechRate();

  return new Promise((resolve) => {
    let hasCompleted = false;

    const finish = () => {
      if (hasCompleted) return;
      hasCompleted = true;
      resolve();
    };

    const speakWithSynthesis = () => {
      if (hasCompleted || thisId !== activeSpeakId) return;
      hasCompleted = true;

      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        finish();
        return;
      }

      try {
        window.speechSynthesis.cancel();
      } catch (_) {}

      const cleanWord = word.trim().replace(/[^\w\s-]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanWord);
      utterance.lang = 'en-US';
      utterance.rate = Math.max(0.6, Math.min(1.6, 0.9 * userRate));
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Google') ||
              v.name.includes('Samantha') ||
              v.name.includes('Daniel') ||
              v.name.includes('Natural') ||
              v.name.includes('Karen') ||
              v.name.includes('Victoria'))
        ) || voices.find((v) => v.lang === 'en-US' || v.lang === 'en-GB');

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => finish();
      utterance.onerror = () => finish();

      window.speechSynthesis.speak(utterance);
    };

    // If audioUrl is provided, attempt audio element ONCE
    if (audioUrl) {
      try {
        let audio = audioCache.get(audioUrl);
        if (!audio) {
          audio = new Audio(audioUrl);
          audio.preload = 'auto';
          audioCache.set(audioUrl, audio);
        }

        currentAudioElement = audio;
        audio.currentTime = 0;
        audio.playbackRate = userRate;

        audio.onended = () => {
          if (thisId === activeSpeakId) {
            currentAudioElement = null;
            finish();
          }
        };

        const handleAudioFail = () => {
          if (thisId !== activeSpeakId || hasCompleted) return;
          if (currentAudioElement === audio) {
            currentAudioElement = null;
          }
          speakWithSynthesis();
        };

        audio.onerror = handleAudioFail;

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            handleAudioFail();
          });
        }
      } catch (_) {
        speakWithSynthesis();
      }
    } else {
      speakWithSynthesis();
    }
  });
};

// Speech Recognition Wrapper (Web Speech API) for Phase 4
export interface SpeechRecognitionResultState {
  transcript: string;
  isCorrect: boolean;
}

export interface SpeechController {
  stop: () => void;
}

interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
  SpeechGrammarList?: any;
  webkitSpeechGrammarList?: any;
}

export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as IWindow;
  return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
};

export const startListening = (
  targetWord: string,
  onInterim: (interimText: string) => void,
  onResult: (result: SpeechRecognitionResultState) => void,
  onError: (err: string) => void,
  onEnd: () => void
): SpeechController | null => {
  stopAudio();
  const win = window as unknown as IWindow;
  const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    onError("Brauzeringizda ovozni tanish (Web Speech API) qo'llab-quvvatlanmaydi.");
    onEnd();
    return null;
  }

  try {
    const recognition = new SpeechRecognitionClass();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // Optional SpeechGrammarList to optimize recognition for the target word
    const SpeechGrammarList = win.SpeechGrammarList || win.webkitSpeechGrammarList;
    if (SpeechGrammarList) {
      try {
        const speechRecognitionList = new SpeechGrammarList();
        const cleanWord = targetWord.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        if (cleanWord) {
          speechRecognitionList.addFromString(`#JSGF V1.0; grammar word; public <word> = ${cleanWord} ;`, 1);
          recognition.grammars = speechRecognitionList;
        }
      } catch (_) {}
    }

    let accumulatedTranscript = '';
    let finalTranscript = '';
    let hasDeliveredResult = false;

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const text = item[0]?.transcript || '';
        if (item.isFinal) {
          finalTranscript += text + ' ';
        } else {
          interimTranscript += text;
        }
      }

      const combined = (finalTranscript + interimTranscript).trim();
      if (combined) {
        accumulatedTranscript = combined;
        onInterim(accumulatedTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        return;
      }
      onError(
        event.error === 'not-allowed'
          ? "Mikrofonga ruxsat berilmadi."
          : `Ovoz xatosi: ${event.error}`
      );
    };

    const finish = () => {
      if (hasDeliveredResult) return;
      hasDeliveredResult = true;

      const spoken = accumulatedTranscript.trim();
      
      // Clean target word
      const targetClean = targetWord.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
      
      // Tokenize what was actually spoken
      const spokenClean = spoken.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
      const spokenTokens = spokenClean.split(' ').filter(Boolean);

      // Strict Exact Match:
      // The spoken speech must explicitly contain the exact target word token.
      // Substring hallucinations (e.g. "cal" matching "local") are strictly rejected!
      let isMatch = false;
      if (targetClean && spokenTokens.length > 0) {
        if (targetClean.includes(' ')) {
          isMatch = spokenClean === targetClean || spokenClean.includes(targetClean);
        } else {
          isMatch = spokenTokens.includes(targetClean);
        }
      }

      onResult({
        transcript: spoken,
        isCorrect: isMatch
      });

      onEnd();
    };

    recognition.onend = () => {
      finish();
    };

    recognition.start();

    return {
      stop: () => {
        try {
          recognition.stop();
        } catch (_) {
          finish();
        }
      }
    };
  } catch (err: any) {
    onError(err.message || "Mikrofonni ishga tushirishda xatolik.");
    onEnd();
    return null;
  }
};
