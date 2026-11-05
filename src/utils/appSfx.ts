type AppSfxName =
  | 'back'
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
  | 'swipeDown'
  | 'challenge'
  | 'cardFlip'
  | 'next'
  | 'previous'
  | 'gameSelect'
  | 'gameSwitch';

const KENNEY = `${import.meta.env.BASE_URL}audio/kenney-ui`;

const SOURCES: Record<AppSfxName, string> = {
  back: `${KENNEY}/back.mp3`,
  tap: `${KENNEY}/tap.mp3`,
  toggle: `${KENNEY}/select.mp3`,
  notification: `${KENNEY}/notification.mp3`,
  success: `${KENNEY}/success.mp3`,
  attention: `${KENNEY}/attention.mp3`,
  panelOpen: `${KENNEY}/panel-open.mp3`,
  panelClose: `${KENNEY}/panel-close.mp3`,
  subjectSelect: `${KENNEY}/select.mp3`,
  chapterSelect: `${KENNEY}/chapter.mp3`,
  lessonSelect: `${KENNEY}/lesson.mp3`,
  boardSelect: `${KENNEY}/board.mp3`,
  bookletSelect: `${KENNEY}/booklet.mp3`,
  swipeUp: `${KENNEY}/swipe-up.mp3`,
  swipeDown: `${KENNEY}/swipe-down.mp3`,
  challenge: `${KENNEY}/challenge.mp3`,
  cardFlip: `${KENNEY}/card-flip.mp3`,
  next: `${KENNEY}/next.mp3`,
  previous: `${KENNEY}/previous.mp3`,
  // Interactive-game entry cues stay on the previously approved assets.
  gameSelect: `${import.meta.env.BASE_URL}audio/ui/success.mp3`,
  gameSwitch: `${import.meta.env.BASE_URL}audio/ui/toggle.mp3`,
};

const VOLUMES: Record<AppSfxName, number> = {
  back: 0.3,
  tap: 0.24,
  toggle: 0.24,
  notification: 0.32,
  success: 0.34,
  attention: 0.3,
  panelOpen: 0.28,
  panelClose: 0.27,
  subjectSelect: 0.28,
  chapterSelect: 0.29,
  lessonSelect: 0.3,
  boardSelect: 0.27,
  bookletSelect: 0.27,
  swipeUp: 0.25,
  swipeDown: 0.25,
  challenge: 0.35,
  cardFlip: 0.28,
  next: 0.25,
  previous: 0.25,
  gameSelect: 0.17,
  gameSwitch: 0.12,
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

  navigation() { this.play('back', 160); }
  tap() { this.play('tap'); }
  toggle() { this.play('toggle', 120); }
  notification() { this.play('notification', 300); }
  success() { this.play('success', 300); }
  attention() { this.play('attention', 300); }
  panelOpen() { this.play('panelOpen', 180); }
  panelClose() { this.play('panelClose', 180); }
  subjectSelect() { this.play('subjectSelect', 160); }
  chapterSelect() { this.play('chapterSelect', 160); }
  lessonSelect() { this.play('lessonSelect', 180); }
  gameSelect() { this.play('gameSelect', 220); }
  gameSwitch() { this.play('gameSwitch', 140); }
  boardSelect() { this.play('boardSelect', 160); }
  bookletSelect() { this.play('bookletSelect', 160); }
  swipeUp() { this.play('swipeUp', 360); }
  swipeDown() { this.play('swipeDown', 360); }
  challenge() { this.play('challenge', 300); }
  cardFlip() { this.play('cardFlip', 160); }
  next() { this.play('next', 120); }
  previous() { this.play('previous', 120); }
}

export const appSfx = new AppSfxEngine();
