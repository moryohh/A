type AppSfxName = 'navigation' | 'tap' | 'toggle' | 'notification' | 'success' | 'attention';

const SOURCES: Record<AppSfxName, string> = {
  navigation: `${import.meta.env.BASE_URL}audio/ui/navigation.mp3`,
  tap: `${import.meta.env.BASE_URL}audio/ui/tap.mp3`,
  toggle: `${import.meta.env.BASE_URL}audio/ui/toggle.mp3`,
  notification: `${import.meta.env.BASE_URL}audio/ui/notification.mp3`,
  success: `${import.meta.env.BASE_URL}audio/ui/success.mp3`,
  attention: `${import.meta.env.BASE_URL}audio/ui/attention.mp3`,
};

const VOLUMES: Record<AppSfxName, number> = {
  navigation: 0.32,
  tap: 0.22,
  toggle: 0.24,
  notification: 0.3,
  success: 0.34,
  attention: 0.28,
};

class AppSfxEngine {
  private players = new Map<AppSfxName, HTMLAudioElement>();
  private lastPlayedAt = new Map<AppSfxName, number>();

  private getPlayer(name: AppSfxName) {
    let player = this.players.get(name);
    if (!player) {
      player = new Audio(SOURCES[name]);
      player.preload = 'auto';
      player.volume = VOLUMES[name];
      this.players.set(name, player);
    }
    return player;
  }

  play(name: AppSfxName, minimumGapMs = 90) {
    const now = performance.now();
    if (now - (this.lastPlayedAt.get(name) ?? 0) < minimumGapMs) return;
    this.lastPlayedAt.set(name, now);

    const player = this.getPlayer(name);
    player.pause();
    player.currentTime = 0;
    void player.play().catch(() => undefined);
  }

  navigation() { this.play('navigation', 180); }
  tap() { this.play('tap'); }
  toggle() { this.play('toggle', 120); }
  notification() { this.play('notification', 350); }
  success() { this.play('success', 350); }
  attention() { this.play('attention', 350); }
}

export const appSfx = new AppSfxEngine();
