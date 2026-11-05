type LegacyGameSfxName = 'gameSelect' | 'gameSwitch';
type Tonely = typeof import('tonely')['tonely'];

// The interactive-game entry sounds deliberately remain on the original
// recorded assets. Tonely is only used for the surrounding platform UI.
const LEGACY_GAME_SOURCES: Record<LegacyGameSfxName, string> = {
  gameSelect: `${import.meta.env.BASE_URL}audio/ui/success.mp3`,
  gameSwitch: `${import.meta.env.BASE_URL}audio/ui/toggle.mp3`,
};

const LEGACY_GAME_VOLUMES: Record<LegacyGameSfxName, number> = {
  gameSelect: 0.17,
  gameSwitch: 0.12,
};

class AppSfxEngine {
  private legacyGamePlayers = new Map<LegacyGameSfxName, HTMLAudioElement>();
  private lastPlayedAt = new Map<string, number>();
  private tonelyPromise: Promise<Tonely> | null = null;

  private getTonely() {
    if (!this.tonelyPromise) {
      // Keep the procedural engine in its own tiny on-demand chunk so the PWA
      // shell and its service-worker precache stay below Cloudflare's limit.
      this.tonelyPromise = import('tonely').then(({ tonely }) => {
        tonely.setTheme('playful');
        tonely.setVolume(0.55);
        return tonely;
      });
    }
    return this.tonelyPromise;
  }

  private playTonely(callback: (engine: Tonely) => Promise<boolean>) {
    void this.getTonely().then(callback).catch(() => undefined);
  }

  private canPlay(name: string, minimumGapMs: number) {
    const now = performance.now();
    if (now - (this.lastPlayedAt.get(name) ?? 0) < minimumGapMs) return false;
    this.lastPlayedAt.set(name, now);
    return true;
  }

  private playLegacyGame(name: LegacyGameSfxName, minimumGapMs: number) {
    if (!this.canPlay(name, minimumGapMs)) return;
    let player = this.legacyGamePlayers.get(name);
    if (!player) {
      player = new Audio(LEGACY_GAME_SOURCES[name]);
      player.preload = 'auto';
      player.volume = LEGACY_GAME_VOLUMES[name];
      this.legacyGamePlayers.set(name, player);
    }
    player.pause();
    player.currentTime = 0;
    void player.play().catch(() => undefined);
  }

  navigation() {
    if (this.canPlay('navigation', 180)) this.playTonely((engine) => engine.click({ theme: 'minimal', volume: 0.26, pitch: 0.76 }));
  }

  tap() {
    if (this.canPlay('tap', 90)) this.playTonely((engine) => engine.click({ theme: 'minimal', volume: 0.22 }));
  }

  toggle(active = true) {
    if (this.canPlay('toggle', 120)) this.playTonely((engine) => engine.toggle(active, { theme: 'minimal', volume: 0.28 }));
  }

  notification() {
    if (this.canPlay('notification', 350)) this.playTonely((engine) => engine.info({ theme: 'glass', volume: 0.3 }));
  }

  success() {
    if (this.canPlay('success', 350)) this.playTonely((engine) => engine.success({ theme: 'playful', volume: 0.32 }));
  }

  attention() {
    if (this.canPlay('attention', 350)) this.playTonely((engine) => engine.warning({ theme: 'modern', volume: 0.3 }));
  }

  panelOpen() {
    if (this.canPlay('panelOpen', 220)) this.playTonely((engine) => engine.pop({ theme: 'playful', volume: 0.28 }));
  }

  panelClose() {
    if (this.canPlay('panelClose', 220)) this.playTonely((engine) => engine.pop({ theme: 'minimal', volume: 0.24, pitch: 0.72 }));
  }

  subjectSelect() {
    if (this.canPlay('subjectSelect', 180)) this.playTonely((engine) => engine.bubble({ theme: 'playful', volume: 0.3, pitch: 0.92 }));
  }

  chapterSelect() {
    if (this.canPlay('chapterSelect', 180)) this.playTonely((engine) => engine.pop({ theme: 'playful', volume: 0.28, pitch: 1.02 }));
  }

  lessonSelect() {
    if (this.canPlay('lessonSelect', 220)) this.playTonely((engine) => engine.glass({ theme: 'glass', volume: 0.24, pitch: 0.9 }));
  }

  // Preserve the original entry cues around the interactive-game menu.
  gameSelect() { this.playLegacyGame('gameSelect', 220); }
  gameSwitch() { this.playLegacyGame('gameSwitch', 140); }

  boardSelect() {
    if (this.canPlay('boardSelect', 180)) this.playTonely((engine) => engine.click({ theme: 'modern', volume: 0.26, pitch: 0.88 }));
  }

  bookletSelect() {
    if (this.canPlay('bookletSelect', 180)) this.playTonely((engine) => engine.bubble({ theme: 'minimal', volume: 0.26, pitch: 0.82 }));
  }

  swipeUp() {
    if (this.canPlay('swipeUp', 420)) this.playTonely((engine) => engine.pop({ theme: 'minimal', volume: 0.2, pitch: 1.2, playbackRate: 1.2 }));
  }

  swipeDown() {
    if (this.canPlay('swipeDown', 420)) this.playTonely((engine) => engine.pop({ theme: 'minimal', volume: 0.2, pitch: 0.68, playbackRate: 0.9 }));
  }
}

export const appSfx = new AppSfxEngine();
