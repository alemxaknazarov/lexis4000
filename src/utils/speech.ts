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

// Pronounce target word: guaranteed exactly ONCE per call (no duplicates or echoes)
export const speakWord = (word: string, audioUrl?: string): Promise<void> => {
  stopAudio();
  const thisId = activeSpeakId;

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
      utterance.rate = 0.9;
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
        const audio = new Audio(audioUrl);
        currentAudioElement = audio;

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

        audio.play().catch(() => {
          handleAudioFail();
        });
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
    recognition.maxAlternatives = 5;

    let accumulatedTranscript = '';
    let hasDeliveredResult = false;
    let anyMatch = false;

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = 0; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          final += item[0].transcript + ' ';
          for (let j = 0; j < item.length; j++) {
            const altText = item[j].transcript.toLowerCase().trim().replace(/[^\w\s]/g, '');
            const targetClean = targetWord.toLowerCase().trim().replace(/[^\w\s]/g, '');
            if (altText === targetClean || altText.split(/\s+/).includes(targetClean)) {
              anyMatch = true;
            }
          }
        } else {
          interim += item[0].transcript;
        }
      }

      const current = (final || interim).trim();
      if (current) {
        accumulatedTranscript = current;
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
      const targetClean = targetWord.toLowerCase().trim().replace(/[^\w\s]/g, '');
      const spokenClean = spoken.toLowerCase().trim().replace(/[^\w\s]/g, '');

      const isMatch = Boolean(
        anyMatch ||
        (spokenClean && (
          spokenClean === targetClean ||
          spokenClean.split(/\s+/).includes(targetClean)
        ))
      );

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
