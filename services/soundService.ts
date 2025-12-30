
// A robust sound service using Web Audio API oscillators to generate game sounds.
// This avoids issues with base64 audio decoding and "no supported source" errors.

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Creates and plays a synthesized sound using oscillators.
 * @param frequency The frequency in Hz.
 * @param type Oscillator type ('sine', 'square', 'sawtooth', 'triangle').
 * @param duration Duration in seconds.
 * @param volume Initial volume (0 to 1).
 */
function playTone(frequency: number, type: OscillatorType, duration: number, volume: number = 0.1) {
  const ctx = getAudioContext();
  
  // Browsers require a user gesture to resume the audio context if it's suspended.
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  // Volume envelope: Start at set volume, then quickly ramp down to avoid popping.
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

// High-pitched short ding for buzzing in or triggering events.
export const playDingSound = () => {
  playTone(880, 'sine', 0.2, 0.2); // A5 note
};

// Upward chime sequence for correct answers.
export const playCorrectSound = () => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Play an upward arpeggio
  playTone(523.25, 'sine', 0.3, 0.15); // C5
  setTimeout(() => playTone(659.25, 'sine', 0.3, 0.15), 100); // E5
  setTimeout(() => playTone(783.99, 'sine', 0.4, 0.15), 200); // G5
};

// Low-pitched buzzer for wrong answers or strikes.
export const playWrongSound = () => {
  // Use a sawtooth wave for that "aggressive" buzzer feel.
  playTone(130.81, 'sawtooth', 0.5, 0.08); // C3
};
