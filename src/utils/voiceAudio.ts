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
  let context: AudioContext | undefined;
  try {
    context = new AudioContext();
    await context.resume();
    if (context.state !== 'running') throw new Error('Audio processing unavailable');
    const input = context.createMediaStreamSource(raw);
    const gain = context.createGain();
    gain.gain.value = 1.2;
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.knee.value = 12;
    limiter.ratio.value = 4;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.15;
    const output = context.createMediaStreamDestination();
    input.connect(gain).connect(limiter).connect(output);
    const track = output.stream.getAudioTracks()[0];
    const stop = track.stop.bind(track);
    track.stop = () => {
      stop();
      raw.getTracks().forEach(sourceTrack => sourceTrack.stop());
      void context?.close().catch(() => undefined);
    };
    raw.getAudioTracks()[0].addEventListener('ended', () => track.stop(), { once: true });
    return output.stream;
  } catch {
    void context?.close().catch(() => undefined);
    return raw;
  }
}
