// ChapterNode: a state machine component representing one restorable chapter on the island map.

import {
  _decorator,
  Component,
  Node,
  Label,
  Sprite,
  Color,
  SpriteFrame,
  ProgressBar,
  tween,
  Vec3,
  UIOpacity,
} from 'cc';

const { ccclass, property } = _decorator;

export enum ChapterState {
  LOCKED = 'LOCKED',
  AVAILABLE = 'AVAILABLE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface ChapterColors {
  primary: string;
  secondary: string;
}

@ccclass('ChapterNode')
export class ChapterNode extends Component {
  @property({ type: Node, tooltip: 'Root visual node tinted per chapter color' })
  visualRoot: Node | null = null;

  @property({ type: Label, tooltip: 'Chapter name label' })
  nameLabel: Label | null = null;

  @property({ type: Label, tooltip: 'Lock hint label (materials required)' })
  lockHintLabel: Label | null = null;

  @property({ type: Node, tooltip: 'Lock icon node' })
  lockIconNode: Node | null = null;

  @property({ type: Node, tooltip: 'NPC node, shown when COMPLETED' })
  npcNode: Node | null = null;

  @property({ type: ProgressBar, tooltip: 'Restoration progress bar' })
  progressBar: ProgressBar | null = null;

  @property({ type: Node, tooltip: 'Animated restoration sprite node' })
  restorationAnimNode: Node | null = null;

  @property({ tooltip: 'Chapter id 1-6' })
  chapterId: number = 1;

  // Set by IslandMapScene from art-tokens
  chapterColors: ChapterColors = { primary: '#FFFFFF', secondary: '#CCCCCC' };

  private _state: ChapterState = ChapterState.LOCKED;
  private _restorationStage: number = 0; // 0-4
  private _totalLevels: number = 1;

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  get state(): ChapterState {
    return this._state;
  }

  setState(state: ChapterState, restorationStage = 0, totalLevels = 1): void {
    this._state = state;
    this._restorationStage = restorationStage;
    this._totalLevels = Math.max(1, totalLevels);
    this._applyVisuals();
  }

  setLockHint(materialsDescription: string): void {
    if (this.lockHintLabel) {
      this.lockHintLabel.string = materialsDescription;
    }
  }

  // -----------------------------------------------------------------------
  // Cocos lifecycle
  // -----------------------------------------------------------------------

  onLoad(): void {
    this._applyVisuals();

    // Wire up click
    this.node.on(Node.EventType.TOUCH_END, this._onTap, this);
  }

  onDestroy(): void {
    this.node.off(Node.EventType.TOUCH_END, this._onTap, this);
  }

  // -----------------------------------------------------------------------
  // Visuals
  // -----------------------------------------------------------------------

  private _applyVisuals(): void {
    switch (this._state) {
      case ChapterState.LOCKED:
        this._applyLocked();
        break;
      case ChapterState.AVAILABLE:
        this._applyAvailable();
        break;
      case ChapterState.IN_PROGRESS:
        this._applyInProgress();
        break;
      case ChapterState.COMPLETED:
        this._applyCompleted();
        break;
    }
  }

  private _applyLocked(): void {
    this._setColor('#A0A0A0'); // gray/white
    this._setNodeVisible(this.lockIconNode, true);
    this._setNodeVisible(this.npcNode, false);
    this._setNodeVisible(this.progressBar?.node ?? null, false);
    this._setOpacity(this.visualRoot, 150);
  }

  private _applyAvailable(): void {
    this._setColor(this.chapterColors.primary);
    this._setNodeVisible(this.lockIconNode, false);
    this._setNodeVisible(this.npcNode, false);
    this._setNodeVisible(this.progressBar?.node ?? null, false);
    this._setOpacity(this.visualRoot, 255);
  }

  private _applyInProgress(): void {
    this._setColor(this.chapterColors.primary);
    this._setNodeVisible(this.lockIconNode, false);
    this._setNodeVisible(this.npcNode, false);
    this._setNodeVisible(this.progressBar?.node ?? null, true);
    this._setOpacity(this.visualRoot, 255);

    if (this.progressBar) {
      const targetProgress = this._restorationStage / 4;
      tween(this.progressBar)
        .to(0.6, { progress: targetProgress }, { easing: 'sineOut' })
        .start();
    }

    if (this.restorationAnimNode) {
      this._playRestorationPulse();
    }
  }

  private _applyCompleted(): void {
    this._setColor(this.chapterColors.primary);
    this._setNodeVisible(this.lockIconNode, false);
    this._setNodeVisible(this.npcNode, true);
    this._setNodeVisible(this.progressBar?.node ?? null, false);
    this._setOpacity(this.visualRoot, 255);

    if (this.progressBar) {
      this.progressBar.progress = 1;
    }

    // Celebratory scale pop
    if (this.visualRoot) {
      tween(this.visualRoot)
        .to(0.15, { scale: new Vec3(1.08, 1.08, 1) }, { easing: 'sineOut' })
        .to(0.15, { scale: new Vec3(1, 1, 1) }, { easing: 'sineIn' })
        .start();
    }
  }

  private _playRestorationPulse(): void {
    if (!this.restorationAnimNode) return;
    tween(this.restorationAnimNode)
      .repeatForever(
        tween()
          .to(1.5, { scale: new Vec3(1.05, 1.05, 1) }, { easing: 'sineInOut' })
          .to(1.5, { scale: new Vec3(1, 1, 1) }, { easing: 'sineInOut' })
      )
      .start();
  }

  // -----------------------------------------------------------------------
  // Color helpers
  // -----------------------------------------------------------------------

  private _setColor(hexColor: string): void {
    if (!this.visualRoot) return;
    const sprite = this.visualRoot.getComponent(Sprite);
    if (sprite) {
      sprite.color = this._hexToColor(hexColor);
    }
  }

  private _setOpacity(node: Node | null, opacity: number): void {
    if (!node) return;
    const uiOpacity = node.getComponent(UIOpacity);
    if (uiOpacity) {
      uiOpacity.opacity = opacity;
    }
  }

  private _setNodeVisible(node: Node | null, visible: boolean): void {
    if (node) node.active = visible;
  }

  private _hexToColor(hex: string): Color {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return new Color(r, g, b, 255);
  }

  // -----------------------------------------------------------------------
  // Input
  // -----------------------------------------------------------------------

  private _onTap(): void {
    // Emit a custom event that IslandMapScene listens to.
    this.node.emit('chapter-tapped', { chapterId: this.chapterId, state: this._state });
  }
}
