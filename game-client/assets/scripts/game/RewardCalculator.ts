// Calculates coin and material rewards after a level is completed.
//
// Economy rules (from economy-model.json):
//   Base coins   : config.coin_reward
//   Combo bonus  : +10% per combo level achieved (1-4), stackable, cap 2.0×
//   Perfect clear: no continues AND movesRemaining >= 5 → +50% multiplier
//   Material     : config.material_reward (flat, driven by star rating elsewhere)

import type { LevelConfig } from './LevelLoader';
import type { SessionResult } from './GameSession';

export interface Reward {
  /** Base coins from config, after multipliers. */
  coins: number;
  /** Material drops defined in the level config. */
  materials: { type: string; amount: number }[];
  /** Extra coins from combo / perfect-clear bonuses (already included in coins). */
  bonusCoins: number;
}

/** Multiplier per combo level reached during the session (0 = no combo). */
const COMBO_BONUS_PER_LEVEL = 0.1; // +10% per combo level
const MAX_TOTAL_MULTIPLIER = 2.0;
const PERFECT_CLEAR_BONUS = 0.5; // +50%
const PERFECT_CLEAR_MIN_MOVES_REMAINING = 5;

export class RewardCalculator {
  /**
   * Calculate the final reward for a completed level.
   *
   * @param config  The level config (provides base coin and material values).
   * @param result  Partial session result containing movesRemaining, comboMax,
   *                continuesUsed (optional), and completed flag.
   */
  calculate(config: LevelConfig, result: Partial<SessionResult>): Reward {
    const base = config.coin_reward;
    const continuesUsed = result.continuesUsed ?? 0;
    const movesRemaining = result.movesRemaining ?? 0;
    const comboMax = result.comboMax ?? 0;

    // Accumulate multipliers (capped at MAX_TOTAL_MULTIPLIER).
    let multiplier = 1.0;

    // Combo bonus: +10% per combo level (comboMax is 1-4 in ComboTracker).
    if (comboMax > 0) {
      multiplier += COMBO_BONUS_PER_LEVEL * comboMax;
    }

    // Perfect clear bonus: no continues AND enough moves remaining.
    const isPerfectClear = continuesUsed === 0 && movesRemaining >= PERFECT_CLEAR_MIN_MOVES_REMAINING;
    if (isPerfectClear) {
      multiplier += PERFECT_CLEAR_BONUS;
    }

    // Clamp to cap.
    multiplier = Math.min(multiplier, MAX_TOTAL_MULTIPLIER);

    const totalCoins = Math.floor(base * multiplier);
    const bonusCoins = totalCoins - base;

    const materials: { type: string; amount: number }[] = [];
    if (config.material_reward && config.material_reward.type) {
      // Scale material amount by star rating if provided, otherwise use config amount.
      const stars = result.stars ?? 1;
      const starMultiplier = stars === 3 ? 3 : stars === 2 ? 2 : 1;
      materials.push({
        type: config.material_reward.type,
        amount: config.material_reward.amount * starMultiplier,
      });
    }

    return { coins: totalCoins, materials, bonusCoins };
  }
}
