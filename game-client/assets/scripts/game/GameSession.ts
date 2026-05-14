// GameSession – state machine driving one playthrough of a puzzle level.
//
// States:  loading → playing ⇄ paused
//                  → levelComplete (objectives met)
//                  → failed        (moves exhausted, objectives unmet)
//          failed  → playing       (via continue(), spending glowstones)
//
// Events emitted (via EventTarget):
//   sessionEnded(result: SessionResult)
//   sessionFailed()
//   stateChanged(state: GameSessionState)

import { EventTarget } from 'cc';
import { LevelLoader, LevelConfig } from './LevelLoader';
import { RewardCalculator, Reward } from './RewardCalculator';
import { MaterialCollector } from './MaterialCollector';
import { ZenModeManager } from '../puzzle/ZenModeManager';
import { SFXKey } from '../audio/AudioConfig';
import { AudioManager } from '../audio/AudioManager';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GameSessionState = 'loading' | 'playing' | 'paused' | 'levelComplete' | 'failed';

export interface SessionResult {
  levelId: string;
  completed: boolean;
  movesUsed: number;
  movesRemaining: number;
  comboMax: number;
  /** Number of times the player used a glowstone continue. */
  continuesUsed: number;
  reward: Reward;
  stars: number; // 1-3
}

export const GAME_SESSION_EVENT = {
  SESSION_ENDED: 'sessionEnded',
  SESSION_FAILED: 'sessionFailed',
  STATE_CHANGED: 'stateChanged',
} as const;

/** Glowstone cost per continue (matches economy-model: continue_level cost = 6). */
const CONTINUE_GLOWSTONE_COST = 6;
/** Extra moves awarded per continue. */
const CONTINUE_MOVES_ADDED = 5;
/** Maximum continues per level. */
const CONTINUE_MAX = 3;
/** Moves remaining threshold required for 3-star (no-continue path). */
const THREE_STAR_MOVES_REMAINING = 3;

// ---------------------------------------------------------------------------
// LocalStorage resume key
// ---------------------------------------------------------------------------

const RESUME_KEY = 'glow_island_resume_level';

// ---------------------------------------------------------------------------
// GameSession
// ---------------------------------------------------------------------------

export class GameSession extends EventTarget {
  // ---- Dependencies --------------------------------------------------------
  private loader = new LevelLoader();
  private calculator = new RewardCalculator();
  private materialCollector: MaterialCollector;

  // ---- Runtime state -------------------------------------------------------
  private _state: GameSessionState = 'loading';
  private config: LevelConfig | null = null;

  private _movesRemaining: number = 0;
  private _movesUsed: number = 0;
  private _comboMax: number = 0;
  private _continuesUsed: number = 0;
  private _objectivesMet: boolean = false;

  // ---- Glowstone balance (injected / managed externally) ------------------
  private _glowstones: number = 0;

  constructor(materialCollector: MaterialCollector) {
    super();
    this.materialCollector = materialCollector;
  }

  // ---------------------------------------------------------------------------
  // Public accessors
  // ---------------------------------------------------------------------------

  get state(): GameSessionState {
    return this._state;
  }

  get movesRemaining(): number {
    return this._movesRemaining;
  }

  get movesUsed(): number {
    return this._movesUsed;
  }

  get comboMax(): number {
    return this._comboMax;
  }

  get continuesUsed(): number {
    return this._continuesUsed;
  }

  get levelId(): string {
    return this.config?.id ?? '';
  }

  /** Inject current glowstone balance (call before start or continue). */
  setGlowstones(amount: number): void {
    this._glowstones = Math.max(0, amount);
  }

  // ---------------------------------------------------------------------------
  // State machine transitions
  // ---------------------------------------------------------------------------

  /**
   * Begin a level session.
   * Transitions: (any) → loading → playing
   */
  async start(levelId: string): Promise<LevelConfig> {
    this._setState('loading');
    this._reset();

    this.config = await this.loader.load(levelId);
    this._movesRemaining = this.config.max_moves ?? Infinity;

    this._setState('playing');
    // Clear any stale resume entry for this level since we are starting fresh.
    this._clearResumeEntry();
    return this.config;
  }

  /** Pause the session (only valid while playing). */
  pause(): void {
    if (this._state !== 'playing') return;
    this._setState('paused');
  }

  /** Resume from pause. */
  resume(): void {
    if (this._state !== 'paused') return;
    this._setState('playing');
  }

  /**
   * Record a move being consumed.
   * Call this after each player action (tile match) from the board controller.
   * Also accepts the latest comboLevel (1-4) from ComboTracker.
   */
  onMoveMade(comboLevel: number = 0): void {
    if (this._state !== 'playing') return;

    if (this._movesRemaining !== Infinity) {
      this._movesRemaining = Math.max(0, this._movesRemaining - 1);
    }
    this._movesUsed++;
    if (comboLevel > this._comboMax) {
      this._comboMax = comboLevel;
    }

    // Check failure condition only when there is a move limit.
    if (this.config?.max_moves !== null && this._movesRemaining <= 0 && !this._objectivesMet) {
      if (ZenModeManager.getInstance()?.isActive()) {
        this._triggerZenComplete();
      } else {
        this._setState('failed');
        this.emit(GAME_SESSION_EVENT.SESSION_FAILED);
      }
    }
  }

  /**
   * Notify the session that all objectives have been satisfied.
   * Call this from the board/objective tracker when the last objective clears.
   */
  onObjectivesMet(): void {
    if (this._state !== 'playing') return;
    this._objectivesMet = true;
    this._completeLevel();
  }

  /**
   * Force the session into the failed state immediately.
   * Used for board-overrun conditions (spreading obstacle covers entire board)
   * where there is no move-count path to failure (e.g. levels with no move limit).
   */
  failNow(): void {
    if (this._state !== 'playing') return;
    this._setState('failed');
    this.emit(GAME_SESSION_EVENT.SESSION_FAILED);
  }

  /**
   * Spend glowstones to continue after failure (+5 moves).
   * Returns false if insufficient glowstones or max continues reached.
   */
  continue(glowstones: number): boolean {
    if (this._state !== 'failed') return false;
    if (this._continuesUsed >= CONTINUE_MAX) return false;
    if (glowstones < CONTINUE_GLOWSTONE_COST) return false;

    this._glowstones -= CONTINUE_GLOWSTONE_COST;
    this._movesRemaining += CONTINUE_MOVES_ADDED;
    this._continuesUsed++;
    this._setState('playing');
    return true;
  }

  /**
   * Exit mid-session (e.g. player backs out to meta map).
   * Saves the current level id to localStorage so it can be resumed.
   * No material penalty is applied.
   */
  exitMidSession(): void {
    if (this._state === 'loading' || this._state === 'levelComplete') return;
    if (this.config) {
      try {
        localStorage.setItem(RESUME_KEY, this.config.id);
      } catch {
        // Storage not available; ignore silently.
      }
    }
    this._setState('loading'); // Reset state to neutral.
  }

  /**
   * Return the level id that was interrupted mid-session, if any.
   * Returns null if no resume entry exists.
   */
  static getPendingResumeLevel(): string | null {
    try {
      return localStorage.getItem(RESUME_KEY);
    } catch {
      return null;
    }
  }

  /** Clear the resume entry (called after successfully starting the level). */
  private _clearResumeEntry(): void {
    try {
      localStorage.removeItem(RESUME_KEY);
    } catch {
      // ignore
    }
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private _setState(next: GameSessionState): void {
    if (this._state === next) return;
    this._state = next;
    this.emit(GAME_SESSION_EVENT.STATE_CHANGED, next);
  }

  private _reset(): void {
    this.config = null;
    this._movesRemaining = 0;
    this._movesUsed = 0;
    this._comboMax = 0;
    this._continuesUsed = 0;
    this._objectivesMet = false;
  }

  private _completeLevel(): void {
    if (!this.config) return;

    this._setState('levelComplete');

    const stars = this._computeStars();
    const movesRemaining = this.config.max_moves === null ? 999 : this._movesRemaining;

    const partialResult: Partial<SessionResult> = {
      levelId: this.config.id,
      completed: true,
      movesUsed: this._movesUsed,
      movesRemaining,
      comboMax: this._comboMax,
      continuesUsed: this._continuesUsed,
      stars,
    };

    const reward = this.calculator.calculate(this.config, partialResult);

    // Persist materials to collector.
    if (reward.materials.length > 0) {
      this.materialCollector.add(reward.materials);
    }

    const result: SessionResult = {
      ...(partialResult as Required<typeof partialResult>),
      reward,
    };

    this.emit(GAME_SESSION_EVENT.SESSION_ENDED, result);
  }

  /**
   * Star rating:
   *   3 stars: completed with 0 continues AND movesRemaining >= 3
   *   2 stars: completed with 0 continues
   *   1 star : completed (with continues)
   */
  private _computeStars(): number {
    if (this._continuesUsed > 0) return 1;
    const remaining = this.config?.max_moves === null
      ? THREE_STAR_MOVES_REMAINING // no move limit = always 3-star eligible
      : this._movesRemaining;
    if (remaining >= THREE_STAR_MOVES_REMAINING) return 3;
    return 2;
  }

  private _triggerZenComplete(): void {
    const decorationReward = { type: 'decoration', item_id: 'flower_pot_01', quantity: 1 };
    this.emit('zenComplete', decorationReward);
    AudioManager.getInstance()?.playSFX(SFXKey.ZEN_COMPLETE);
  }
}
