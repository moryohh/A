// Voice playback deliberately bypasses gameAudio and its music/effects mute.
export const microphoneConstraints: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1,
};

export function playVoice(audio: HTMLAudioElement) {
  audio.volume = 1;
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
