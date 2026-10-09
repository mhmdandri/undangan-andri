/**
 * Helper utilities for QR Code parsing and audio feedback
 */

/**
 * Extracts 5-digit reservation code from diverse QR code payload formats:
 * - Full invitation URL: https://weddingofandricica.me?code=66882
 * - Preview email URL: http://localhost:8888/api/reservations/preview-email?name=Budi&code=66882
 * - Check-in URL: https://weddingofandricica.me/reservations?code=66882
 * - Query string: ?code=66882
 * - Raw numeric code: 66882
 */
export function extractReservationCode(scannedText?: string | null): string | null {
  if (!scannedText) return null;
  const text = scannedText.trim();

  // 1. Check if it's a URL or contains query parameters
  try {
    if (text.startsWith("http://") || text.startsWith("https://") || text.includes("?")) {
      const url = new URL(text.startsWith("http") ? text : `http://localhost/${text}`);
      const codeParam = url.searchParams.get("code");
      if (codeParam && codeParam.trim()) {
        return codeParam.trim();
      }
    }
  } catch {
    // Ignore URL parse error and fall back to regex
  }

  // 2. Regex matching query parameter ?code=... or &code=...
  const queryMatch = text.match(/[?&]code=([a-zA-Z0-9_-]+)/i);
  if (queryMatch && queryMatch[1]) {
    return queryMatch[1].trim();
  }

  // 3. Regex matching 4 to 8 digit number (standard reservation code is 5 digits)
  const digitsMatch = text.match(/\b\d{4,8}\b/);
  if (digitsMatch) {
    return digitsMatch[0].trim();
  }

  // 4. Short alphanumeric code (3 to 10 chars, no special symbols)
  if (/^[a-zA-Z0-9]{3,10}$/.test(text)) {
    return text;
  }

  return null;
}

// Global shared AudioContext to prevent autoplay suspension
let sharedAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Pre-warms / unlocks browser audio permission on first interaction
 */
export function unlockAudio() {
  if (typeof window === "undefined") return;
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

/**
 * Plays audible feedback chime:
 * 1. Tries HTML5 Audio with pre-generated WAV sound
 * 2. Falls back to synthesized Web Audio oscillator
 */
export function playChime(type: "success" | "warning" | "error" = "success") {
  if (typeof window === "undefined") return;

  // 1. Try HTML5 Audio file playback first
  const soundFileMap: Record<string, string> = {
    success: "/media/checkin-success.wav",
    warning: "/media/checkin-warning.wav",
    error: "/media/checkin-error.wav",
  };

  const audioPath = soundFileMap[type];
  if (audioPath) {
    try {
      const audio = new Audio(audioPath);
      audio.volume = 1.0;
      audio.play().catch(() => {
        // Fall back to Web Audio API synthesis below if audio.play() fails
        synthChime(type);
      });
    } catch {
      synthChime(type);
    }
  } else {
    synthChime(type);
  }

  // Haptic feedback
  try {
    if (navigator.vibrate) {
      if (type === "success") navigator.vibrate([80, 50, 100]);
      else navigator.vibrate([120, 80, 120]);
    }
  } catch {
    // Ignore vibration error
  }
}

/**
 * Synthesizes audible feedback chime using standard Web Audio API
 */
function synthChime(type: "success" | "warning" | "error") {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    if (type === "success") {
      // Clear bright two-tone scanner chime (1318.5Hz -> 1760Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(1318.5, now);
      gain1.gain.setValueAtTime(0.5, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.14);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1760, now + 0.1);
      gain2.gain.setValueAtTime(0.65, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.35);
    } else if (type === "warning") {
      // Alert pulse (784Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(784, now);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Low buzz tone (350Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(350, now);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    }
  } catch (err) {
    console.warn("Audio synthesis error:", err);
  }
}
