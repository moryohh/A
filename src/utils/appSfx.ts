type AppSfxName =
  | 'navigation'
  | 'tap'
  | 'toggle'
  | 'notification'
  | 'success'
  | 'attention'
  | 'panelOpen'
  | 'panelClose'
  | 'subjectSelect'
  | 'chapterSelect'
  | 'lessonSelect'
  | 'boardSelect'
  | 'bookletSelect'
  | 'swipeUp'
  | 'swipeDown';

const SOURCES: Record<AppSfxName, string> = {
  navigation: `${import.meta.env.BASE_URL}audio/ui/navigation.mp3`,
  tap: `${import.meta.env.BASE_URL}audio/ui/tap.mp3`,
  toggle: `${import.meta.env.BASE_URL}audio/ui/toggle.mp3`,
  notification: `${import.meta.env.BASE_URL}audio/ui/notification.mp3`,
  success: `${import.meta.env.BASE_URL}audio/ui/success.mp3`,
  attention: `${import.meta.env.BASE_URL}audio/ui/attention.mp3`,
  panelOpen: `${import.meta.env.BASE_URL}audio/ui/panel-open.mp3`,
  panelClose: `${import.meta.env.BASE_URL}audio/ui/panel-close.mp3`,
  subjectSelect: `${import.meta.env.BASE_URL}audio/ui/subject-select.mp3`,
  chapterSelect: `${import.meta.env.BASE_URL}audio/ui/chapter-select.mp3`,
  lessonSelect: `${import.meta.env.BASE_URL}audio/ui/lesson-select.mp3`,
  boardSelect: `${import.meta.env.BASE_URL}audio/ui/board-select.mp3`,
  bookletSelect: `${import.meta.env.BASE_URL}audio/ui/booklet-select.mp3`,
  swipeUp: `${import.meta.env.BASE_URL}audio/ui/swipe-up.mp3`,
  swipeDown: `${import.meta.env.BASE_URL}audio/ui/swipe-down.mp3`,
};

const VOLUMES: Record<AppSfxName, number> = {
  navigation: 0.32,
  tap: 0.22,
  toggle: 0.24,
  notification: 0.3,
  success: 0.34,
  attention: 0.28,
  panelOpen: 0.3,
  panelClose: 0.28,
  subjectSelect: 0.3,
  chapterSelect: 0.3,
  lessonSelect: 0.3,
  boardSelect: 0.28,
  bookletSelect: 0.28,
  swipeUp: 0.2,
  swipeDown: 0.2,
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
  panelOpen() { this.play('panelOpen', 220); }
  panelClose() { this.play('panelClose', 220); }
  subjectSelect() { this.play('subjectSelect', 180); }
  chapterSelect() { this.play('chapterSelect', 180); }
  lessonSelect() { this.play('lessonSelect', 220); }
  gameSelect() { this.play('success', 220); }
  gameSwitch() { this.play('toggle', 140); }
  boardSelect() { this.play('boardSelect', 180); }
  bookletSelect() { this.play('bookletSelect', 180); }
  swipeUp() { this.play('swipeUp', 420); }
  swipeDown() { this.play('swipeDown', 420); }
}

export const appSfx = new AppSfxEngine();
