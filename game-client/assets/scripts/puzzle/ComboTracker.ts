// Tracks consecutive match timing and emits combo count/multiplier changes.

import { EventTarget } from 'cc';

const COMBO_WINDOW_MS = 2000;

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

  onTileMatched(): void {
    const now = Date.now();
    const elapsed = now - this.lastMatchTime;

    if (this.lastMatchTime === 0 || elapsed >= COMBO_WINDOW_MS) {
      this.comboCount = 1;
    } else {
      this.comboCount = Math.min(this.comboCount + 1, 4);
    }

    this.lastMatchTime = now;
    const multiplier = this.getMultiplier();
    this.emit(COMBO_EVENT.COMBO_CHANGED, this.comboCount, multiplier);
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
}
