import { _decorator, Component, Button, Label, Node, director, tween, Vec3, UIOpacity } from 'cc';
import { GameSession } from '../game/GameSession';
import { ProgressionManager } from '../meta/ProgressionManager';

const { ccclass, property } = _decorator;

const CONTINUE_GLOWSTONE_COST = 6;
const CONTINUE_MAX = 3;

@ccclass('FailPopup')
export class FailPopup extends Component {
  @property(Button)
  continueBtn: Button | null = null;

  @property(Button)
  exitBtn: Button | null = null;

  @property(Label)
  glowstoneBalanceLabel: Label | null = null;

  @property(Label)
  continuesLeftLabel: Label | null = null;

  @property(Node)
  insufficientHint: Node | null = null;

  private _session: GameSession | null = null;

  onLoad(): void {
    this.node.active = false;
    this.continueBtn?.node.on(Button.EventType.CLICK, this._onContinue, this);
    this.exitBtn?.node.on(Button.EventType.CLICK, this._onExit, this);
  }

  onDestroy(): void {
    this.continueBtn?.node.off(Button.EventType.CLICK, this._onContinue, this);
    this.exitBtn?.node.off(Button.EventType.CLICK, this._onExit, this);
  }

  show(session: GameSession): void {
    this._session = session;
    this.node.active = true;
    this._refreshUI();

    const opacity = this.node.getComponent(UIOpacity) ?? this.node.addComponent(UIOpacity);
    opacity.opacity = 0;
    this.node.setScale(0.85, 0.85, 1);
    tween(this.node).to(0.25, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }).start();
    tween(opacity).to(0.2, { opacity: 255 }).start();
  }

  private _refreshUI(): void {
    if (!this._session) return;
    const glowstones = ProgressionManager.getInstance().getCurrentProgress().currency.glowstones;
    const canContinue = glowstones >= CONTINUE_GLOWSTONE_COST
      && this._session.continuesUsed < CONTINUE_MAX;

    if (this.continueBtn) this.continueBtn.interactable = canContinue;
    if (this.glowstoneBalanceLabel) this.glowstoneBalanceLabel.string = String(glowstones);
    if (this.continuesLeftLabel) {
      this.continuesLeftLabel.string = String(CONTINUE_MAX - this._session.continuesUsed);
    }
    if (this.insufficientHint) this.insufficientHint.active = !canContinue;
  }

  private _onContinue(): void {
    if (!this._session) return;
    const glowstones = ProgressionManager.getInstance().getCurrentProgress().currency.glowstones;
    const success = this._session.continue(glowstones);
    if (success) {
      ProgressionManager.getInstance().addCurrency(0, -CONTINUE_GLOWSTONE_COST);
      this.node.active = false;
    } else {
      this._refreshUI();
    }
  }

  private _onExit(): void {
    this._session?.exitMidSession();
    director.loadScene('IslandMapScene');
  }
}
