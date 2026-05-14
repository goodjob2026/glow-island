import { _decorator, Component, Node, Label } from 'cc';
import { ZenModeManager } from '../puzzle/ZenModeManager';

const { ccclass, property } = _decorator;

@ccclass('ZenModeHUD')
export class ZenModeHUD extends Component {
  @property({ type: Label })
  slotsLabel: Label | null = null;

  @property({ type: Node })
  zenBadge: Node | null = null;

  start(): void {
    this._updateDisplay();
  }

  private _updateDisplay(): void {
    const remaining = ZenModeManager.getInstance()?.getRemainingSlots() ?? 0;
    if (this.slotsLabel) this.slotsLabel.string = `今日剩余: ${remaining}`;
    if (this.zenBadge) this.zenBadge.active = ZenModeManager.getInstance()?.isActive() ?? false;
  }
}
