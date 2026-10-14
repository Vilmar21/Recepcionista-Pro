/**
 * Generador de sonido de alarma y alertas mediante Web Audio API nativo.
 * Produce beeps y timbres de aviso nítidos, agradables y sutiles sin requerir archivos de audio externos.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Reproduce un sonido de alerta sutil (beep de dos tonos) mediante Web Audio API.
 * Especial para avisar cuando una cita está a 10 minutos o menos.
 */
export function playAlertBeep(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Beep sutil y elegante de dos pulsos (880Hz -> 1046.50Hz)
    const beeps = [
      { freq: 880, start: 0, duration: 0.12 },
      { freq: 1046.5, start: 0.16, duration: 0.20 },
    ];

    beeps.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.28, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration + 0.04);
    });
  } catch (err) {
    console.warn('AudioContext beep warning:', err);
  }
}

/**
 * Reproduce la melodía de alarma extendida para recordatorios o avisos importantes.
 */
export function playAlarmChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Secuencia de frecuencias: Re5 (587.33Hz) -> Sol5 (783.99Hz) -> Do6 (1046.50Hz)
    const notes = [
      { freq: 587.33, start: 0, duration: 0.16 },
      { freq: 783.99, start: 0.19, duration: 0.18 },
      { freq: 1046.50, start: 0.40, duration: 0.35 },
      { freq: 783.99, start: 0.85, duration: 0.16 },
      { freq: 1046.50, start: 1.05, duration: 0.40 },
    ];

    notes.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.32, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration + 0.05);
    });
  } catch (err) {
    console.warn('AudioContext playback warning:', err);
  }
}
