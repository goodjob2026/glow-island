import { _decorator, Component, sys } from 'cc';
import { AudioManager } from '../audio/AudioManager';
import { BGMKey } from '../audio/AudioConfig';

const { ccclass } = _decorator;

const LS_ZEN_DATE_KEY = 'glow_zen_last_date';
const LS_ZEN_USED_KEY = 'glow_zen_used_today';
const DAILY_ZEN_SLOTS = 3;

@ccclass('ZenModeManager')
export class ZenModeManager extends Component {
  private static _instance: ZenModeManager | null = null;
  private _active = false;

  static getInstance(): ZenModeManager { return ZenModeManager._instance!; }

  onLoad(): void {
    ZenModeManager._instance = this;
  }

  getRemainingSlots(): number {
    const today = new Date().toDateString();
    const savedDate = sys.localStorage.getItem(LS_ZEN_DATE_KEY);
    if (savedDate !== today) {
      sys.localStorage.setItem(LS_ZEN_DATE_KEY, today);
      sys.localStorage.setItem(LS_ZEN_USED_KEY, '0');
      return DAILY_ZEN_SLOTS;
    }
    const used = parseInt(sys.localStorage.getItem(LS_ZEN_USED_KEY) ?? '0', 10);
    return Math.max(0, DAILY_ZEN_SLOTS - used);
  }

  consumeSlot(): boolean {
    if (this.getRemainingSlots() <= 0) return false;
    const today = new Date().toDateString();
    sys.localStorage.setItem(LS_ZEN_DATE_KEY, today);
    const used = parseInt(sys.localStorage.getItem(LS_ZEN_USED_KEY) ?? '0', 10);
    sys.localStorage.setItem(LS_ZEN_USED_KEY, String(used + 1));
    return true;
  }

  isActive(): boolean { return this._active; }

  enterZenMode(): void {
    this._active = true;
    AudioManager.getInstance()?.playBGM(BGMKey.ZEN_AMBIENT);
  }

  exitZenMode(): void {
    this._active = false;
  }
}
