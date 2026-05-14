import { _decorator, Component, Node, Label, tween, UIOpacity } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('NPCDialog')
export class NPCDialog extends Component {
  @property({ type: Label })
  dialogLabel: Label | null = null;

  @property({ type: Node })
  bubbleNode: Node | null = null;

  private _hideTimer: ReturnType<typeof setTimeout> | null = null;

  showLine(text: string, autohideMs = 4000): void {
    if (!this.dialogLabel || !this.bubbleNode) return;
    this.dialogLabel.string = text;
    this.bubbleNode.active = true;

    const opacity = this.bubbleNode.getComponent(UIOpacity);
    if (opacity) {
      opacity.opacity = 0;
      tween(opacity).to(0.3, { opacity: 255 }).start();
    }

    if (this._hideTimer) clearTimeout(this._hideTimer);
    this._hideTimer = setTimeout(() => this.hide(), autohideMs);
  }

  hide(): void {
    if (!this.bubbleNode) return;
    const opacity = this.bubbleNode.getComponent(UIOpacity);
    if (opacity) {
      tween(opacity).to(0.2, { opacity: 0 })
        .call(() => { if (this.bubbleNode) this.bubbleNode.active = false; })
        .start();
    } else {
      this.bubbleNode.active = false;
    }
  }
}
