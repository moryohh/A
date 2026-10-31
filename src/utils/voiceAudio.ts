// Voice playback deliberately bypasses gameAudio and its music/effects mute.
export const microphoneConstraints: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1,
};

const PLAYER_VOICE_GAIN = 1.3;
let voiceContext: AudioContext | null = null;
const boostedVoices = new WeakMap<HTMLAudioElement, GainNode>();

function boostPlayerVoice(audio: HTMLAudioElement) {
  if (typeof window === 'undefined') return null;
  const existing = boostedVoices.get(audio);
  if (existing) return existing;
  try {
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    voiceContext ||= new AudioCtx();
    const source = voiceContext.createMediaElementSource(audio);
    const gain = voiceContext.createGain();
    const compressor = voiceContext.createDynamicsCompressor();
    gain.gain.value = PLAYER_VOICE_GAIN;
    compressor.threshold.value = -8;
    compressor.knee.value = 12;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.2;
    source.connect(gain).connect(compressor).connect(voiceContext.destination);
    boostedVoices.set(audio, gain);
    return gain;
  } catch {
    return null;
  }
}

export function playVoice(audio: HTMLAudioElement) {
  audio.volume = 1;
  const gain = boostPlayerVoice(audio);
  if (gain) gain.gain.value = PLAYER_VOICE_GAIN;
  if (voiceContext?.state === 'suspended') void voiceContext.resume().catch(() => undefined);
  void audio.play().catch(() => {
    // unlockVoices retries on the next gesture (mobile autoplay policy).
  });
}

export function unlockVoices(audios: Map<string, HTMLAudioElement>) {
  const retry = () => audios.forEach(audio => {
    if (audio.srcObject && !audio.muted && audio.paused) playVoice(audio);
  });
  document.addEventListener('pointerdown', retry, { passive: true });
  document.addEventListener('keydown', retry);
  return () => {
    document.removeEventListener('pointerdown', retry);
    document.removeEventListener('keydown', retry);
  };
}

/** Boost quiet microphones before sending, with compression to limit peaks. */
export async function captureVoice(): Promise<MediaStream> {
  const raw = await navigator.mediaDevices.getUserMedia({ audio: microphoneConstraints });
  // Send the captured track directly: extra compression stages add latency and
  // can lower quiet speech after the browser's own gain and echo cancellation.
  return raw;
}
