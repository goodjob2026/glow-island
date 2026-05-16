// ComboSystem.js — tracks combo streak and multiplier for match scoring

export class ComboSystem {
  constructor() {
    this._combo   = 0;
    this._timer   = 0;
    this._timeout = 2.0; // seconds before combo resets
  }

  /**
   * Call on every successful match.
   * @returns {{ combo: number, multiplier: number }}
   */
  onMatch() {
    this._combo++;
    this._timer = this._timeout;
    // index 0=1.0, 1=1.0, 2=1.5, 3=2.0, 4+=3.0
    const multipliers = [1.0, 1.0, 1.5, 2.0, 3.0];
    const multiplier = multipliers[Math.min(this._combo, 4)];
    return { combo: this._combo, multiplier };
  }

  /**
   * Call on a failed match attempt.
   * Note: only the timeout resets the combo — a miss does NOT reset it.
   */
  onMiss() {
    // intentionally empty — timeout-only reset
  }

  /**
   * Advance the combo timer. Call every game-loop tick.
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    if (this._combo > 0) {
      this._timer -= dt;
      if (this._timer <= 0) {
        this._combo = 0;
        this._timer = 0;
      }
    }
  }

  /** Current combo count. */
  getCombo() {
    return this._combo;
  }

  /** Reset combo and timer immediately (e.g. on level end). */
  reset() {
    this._combo = 0;
    this._timer = 0;
  }
}
