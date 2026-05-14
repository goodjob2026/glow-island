// Tracks consecutive match timing and emits combo count/multiplier changes.
// Also checks SPECIAL_BLOCK_GENERATION_COMBO thresholds and invokes
// onSpecialGeneration when a combo reaches an auto-generation threshold.

import { EventTarget } from 'cc';
import { SPECIAL_BLOCK_GENERATION_COMBO, SpecialBlockType } from './SpecialBlock';

const COMBO_WINDOW_MS = 2000;

// Combo cap raised to 6 to support WAVE auto-generation (threshold = 6).
const COMBO_MAX = 6;

const COMBO_THRESHOLDS = [4, 3, 2, 1];
const COMBO_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 1.5,
  3: 2.0,
  4: 3.0,
};

export const COMBO_EVENT = {
  COMBO_CHANGED: 'comboChanged',
} as const;

export class ComboTracker extends EventTarget {
  private comboCount: number = 0;
  private lastMatchTime: number = 0;

  /**
   * Optional callback invoked when the combo count crosses a special-block
   * auto-generation threshold.  The caller (e.g. GameScene or BoardController)
   * is responsible for spawning the special tile on the board.
   *
   * If multiple thresholds are satisfied at once the highest-priority type
   * (lowest threshold) is returned — callers may override this logic.
   */
  onSpecialGeneration: ((type: SpecialBlockType, comboCount: number) => void) | null = null;

  onTileMatched(): void {
    const now = Date.now();
    const elapsed = now - this.lastMatchTime;

    if (this.lastMatchTime === 0 || elapsed >= COMBO_WINDOW_MS) {
      this.comboCount = 1;
    } else {
      this.comboCount = Math.min(this.comboCount + 1, COMBO_MAX);
    }

    this.lastMatchTime = now;
    const multiplier = this.getMultiplier();
    this.emit(COMBO_EVENT.COMBO_CHANGED, this.comboCount, multiplier);

    // Check whether this combo count triggers a special block auto-generation.
    const specialType = this._checkSpecialGeneration(this.comboCount);
    if (specialType !== null) {
      this.onSpecialGeneration?.(specialType, this.comboCount);
    }
  }

  getMultiplier(): number {
    for (const threshold of COMBO_THRESHOLDS) {
      if (this.comboCount >= threshold) {
        return COMBO_MULTIPLIERS[threshold];
      }
    }
    return 1.0;
  }

  getComboCount(): number {
    return this.comboCount;
  }

  reset(): void {
    this.comboCount = 0;
    this.lastMatchTime = 0;
    this.emit(COMBO_EVENT.COMBO_CHANGED, 0, 1.0);
  }

  /**
   * Returns the SpecialBlockType whose auto-generation threshold is exactly met
   * by `comboCount`, or null if none applies.
   *
   * Precedence: when multiple thresholds are satisfied, the type with the
   * highest threshold (most demanding) wins, matching design intent that
   * WAVE (6) takes priority over CASCADE (3) on a combo-6.
   */
  private _checkSpecialGeneration(comboCount: number): SpecialBlockType | null {
    let bestType: SpecialBlockType | null = null;
    let bestThreshold = -1;

    for (const [type, threshold] of Object.entries(SPECIAL_BLOCK_GENERATION_COMBO) as [SpecialBlockType, number | null][]) {
      if (threshold === null) continue;
      // Trigger exactly at the threshold (not on every count above it).
      if (comboCount === threshold && threshold > bestThreshold) {
        bestThreshold = threshold;
        bestType = type;
      }
    }

    return bestType;
  }
}
