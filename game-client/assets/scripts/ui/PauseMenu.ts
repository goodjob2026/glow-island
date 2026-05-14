import { _decorator, Component, Button, Node, director } from 'cc';
import { GameSession } from '../game/GameSession';

const { ccclass, property } = _decorator;

/**
 * PauseMenu — overlay component for the pause state.
 *
 * Attach this Component to the PauseMenu Node in the Prototype.scene hierarchy.
 * Wire resumeButton and quitButton in the Inspector.
 *
 * GameHUD._onPause() shows this node when the pause button is tapped;
 * the session reference is injected via setSession() called by GameScene
 * (or GameHUD after GameScene.start() completes).
 */
@ccclass('PauseMenu')
export class PauseMenu extends Component {
  @property(Button)
  resumeButton: Button | null = null;

  @property(Button)
  quitButton: Button | null = null;

  private _session: GameSession | null = null;

  onLoad(): void {
    this.node.active = false;
    this.resumeButton?.node.on(Button.EventType.CLICK, this._onResume, this);
    this.quitButton?.node.on(Button.EventType.CLICK, this._onQuit, this);
  }

  onDestroy(): void {
    this.resumeButton?.node.off(Button.EventType.CLICK, this._onResume, this);
    this.quitButton?.node.off(Button.EventType.CLICK, this._onQuit, this);
  }

  /** Called by GameScene (or GameHUD) after the session is created. */
  setSession(session: GameSession): void {
    this._session = session;
  }

  show(): void {
    this.node.active = true;
    this._session?.pause();
  }

  private _onResume(): void {
    this._session?.resume();
    this.node.active = false;
  }

  private _onQuit(): void {
    this._session?.exitMidSession();
    director.loadScene('IslandMapScene');
  }
}
