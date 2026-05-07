// GameScene.ts — Main game scene controller.
// Wires TileGrid, TileMatcher, ComboTracker, GameSession, GameHUD, LevelCompletePopup,
// BoardEventManager, ObstacleManager, and SpecialBlock behaviors together.
// Also owns all in-game SFX trigger points per audio-bindings spec.

import { _decorator, Component, Animation, Node, director, tween, Vec3, UIOpacity } from 'cc';
import { TileGrid, TILE_GRID_EVENT, Point } from '../puzzle/TileGrid';
import { TileMatcher } from '../puzzle/TileMatcher';
import { ComboTracker, COMBO_EVENT } from '../puzzle/ComboTracker';
import { BoardEventManager } from '../puzzle/BoardEventManager';
import { ObstacleManager } from '../puzzle/ObstacleManager';
import { SpecialBlockFactory, SpecialBlockType } from '../puzzle/SpecialBlock';
import { GameSession, GAME_SESSION_EVENT, SessionResult } from './GameSession';
import { MaterialCollector } from './MaterialCollector';
import { LevelLoader } from './LevelLoader';
import { GameHUD } from '../ui/GameHUD';
import { LevelCompletePopup } from '../ui/LevelCompletePopup';
import { AudioManager } from '../audio/AudioManager';
import { SFXKey, BGMKey } from '../audio/AudioConfig';

const { ccclass, property } = _decorator;

// ---------------------------------------------------------------------------
// Tile animation helper: plays tile-disappear.anim on each matched tile node,
// or falls back to a tween if the Animation component is absent.
// ---------------------------------------------------------------------------

function playTileDisappearAnim(tileNode: Node | null): void {
  if (!tileNode) return;
  const anim = tileNode.getComponent(Animation);
  if (anim) {
    anim.play('tile-disappear');
  } else {
    // Tween fallback matching tile-disappear.anim keyframes (squash → collapse)
    const opacity = tileNode.getComponent(UIOpacity) ?? tileNode.addComponent(UIOpacity);
    tween(tileNode)
      .to(0.12, { scale: new Vec3(1.3, 0.7, 1) })
      .to(0.18, { scale: new Vec3(0.0, 0.0, 1) })
      .call(() => { tileNode.active = false; })
      .start();
    tween(opacity)
      .delay(0.24)
      .to(0.06, { opacity: 0 })
      .start();
  }
}

// ---------------------------------------------------------------------------
// GameScene
// ---------------------------------------------------------------------------

@ccclass('GameScene')
export class GameScene extends Component {
  // -------------------------------------------------------------------------
  // Inspector properties — wire in Cocos Creator editor
  // -------------------------------------------------------------------------

  @property({ type: GameHUD, tooltip: 'GameHUD component' })
  gameHUD: GameHUD | null = null;

  @property({ type: LevelCompletePopup, tooltip: 'Level complete popup' })
  levelCompletePopup: LevelCompletePopup | null = null;

  @property({ type: BoardEventManager, tooltip: 'BoardEventManager component' })
  boardEventManager: BoardEventManager | null = null;

  /**
   * Container node that holds one child Node per tile cell.
   * Children must be in row-major order matching the TileGrid dimensions.
   */
  @property({ type: Node, tooltip: 'Node whose children are individual tile view nodes (row-major order)' })
  tileContainer: Node | null = null;

  @property({ tooltip: 'Level id to load on start (e.g. "1-1")' })
  levelId: string = '1-1';

  @property({ tooltip: 'Chapter id used for BGM selection (1-6)' })
  chapterId: number = 1;

  // -------------------------------------------------------------------------
  // Runtime objects
  // -------------------------------------------------------------------------

  private _tileGrid: TileGrid = new TileGrid();
  private _tileMatcher: TileMatcher = new TileMatcher();
  private _comboTracker: ComboTracker = new ComboTracker();
  private _materialCollector: MaterialCollector = new MaterialCollector();
  private _session: GameSession | null = null;
  private _obstacleManager: ObstacleManager | null = null;

  /** Current level's grid rows / cols (set after loading) */
  private _rows: number = 0;
  private _cols: number = 0;

  /** Tracks tiles cleared this session for objective progress */
  private _tilesCleared: number = 0;
  private _objectiveTarget: number = 0;

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  async start(): Promise<void> {
    // Resolve level id — may be overridden by director globals (from MainMenuScene continue flow)
    const directorGlobals = director as unknown as Record<string, unknown>;
    const resumeLevel = (directorGlobals['_lastLevel'] as string) || this.levelId;

    // Create session
    this._materialCollector.restore();
    this._session = new GameSession(this._materialCollector);

    // Play chapter BGM
    AudioManager.getInstance()?.playChapterBGM(this.chapterId);

    try {
      const config = await this._session.start(resumeLevel);
      const [rows, cols] = config.grid_size;
      this._rows = rows;
      this._cols = cols;
      this._objectiveTarget = config.objectives.reduce(
        (acc, obj) => acc + (obj.count ?? 0), 0
      );

      // Initialize board
      const loader = new LevelLoader();
      const boardGrid = loader.createBoard(config);
      this._tileGrid.initialize(rows, cols);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          this._tileGrid.setTile(r, c, boardGrid[r][c]);
        }
      }

      // Initialize obstacle manager
      this._obstacleManager = new ObstacleManager(this._tileGrid);

      // Wire board events
      if (this.boardEventManager) {
        this.boardEventManager.setGrid(this._tileGrid);
        this.boardEventManager.initFromLevelConfig(config.board_events);
      }

      // Subscribe to TileGrid events
      this._tileGrid.on(TILE_GRID_EVENT.TILES_MATCHED, this._onTilesMatched, this);
      this._tileGrid.on(TILE_GRID_EVENT.TILES_SETTLED, this._onTilesSettled, this);
      this._tileGrid.on(TILE_GRID_EVENT.COMBO_CHANGED, this._onComboChanged, this);

      // Subscribe to ComboTracker events (for HUD)
      this._comboTracker.on(COMBO_EVENT.COMBO_CHANGED, this._onComboChangedFromTracker, this);

      // Subscribe to GameSession events
      this._session.on(GAME_SESSION_EVENT.SESSION_ENDED, this._onSessionEnded, this);
      this._session.on(GAME_SESSION_EVENT.SESSION_FAILED, this._onSessionFailed, this);
      this._session.on(GAME_SESSION_EVENT.STATE_CHANGED, this._onSessionStateChanged, this);

      // Wire HUD
      if (this.gameHUD) {
        this.gameHUD.init(this._comboTracker, this._session);
      }
    } catch (e) {
      console.error('[GameScene] Failed to start level:', e);
    }
  }

  onDestroy(): void {
    this._tileGrid.off(TILE_GRID_EVENT.TILES_MATCHED, this._onTilesMatched, this);
    this._tileGrid.off(TILE_GRID_EVENT.TILES_SETTLED, this._onTilesSettled, this);
    this._tileGrid.off(TILE_GRID_EVENT.COMBO_CHANGED, this._onComboChanged, this);
    this._comboTracker.off(COMBO_EVENT.COMBO_CHANGED, this._onComboChangedFromTracker, this);
    this._session?.off(GAME_SESSION_EVENT.SESSION_ENDED, this._onSessionEnded, this);
    this._session?.off(GAME_SESSION_EVENT.SESSION_FAILED, this._onSessionFailed, this);
    this._session?.off(GAME_SESSION_EVENT.STATE_CHANGED, this._onSessionStateChanged, this);
  }

  update(dt: number): void {
    this._obstacleManager?.updateWaterCurrent(dt);
  }

  // -------------------------------------------------------------------------
  // Public API — called by board input controller / tile view
  // -------------------------------------------------------------------------

  /**
   * Attempt to match two tiles at the given grid positions.
   * Call this from the tile selection/input handler.
   */
  tryMatch(r1: number, c1: number, r2: number, c2: number): boolean {
    const path = this._tileMatcher.findPath(
      this._tileGrid.getRawGrid(), r1, c1, r2, c2
    );

    if (!path) return false;

    // Check obstacle path blocking
    if (this._obstacleManager?.isPathBlocked(path)) return false;

    // --- SFX: valid tile connection ---
    AudioManager.getInstance()?.playSFX(SFXKey.TILE_CONNECT);

    // Clear the matched tiles
    const matchedPositions: Point[] = [
      { row: r1, col: c1 },
      { row: r2, col: c2 },
    ];

    // Apply obstacle interactions for adjacent cells
    this._obstacleManager?.onTileMatched(matchedPositions);

    // Clear tiles from grid
    this._tileGrid.clearTile(r1, c1);
    this._tileGrid.clearTile(r2, c2);

    // --- SFX: tile disappear ---
    AudioManager.getInstance()?.playSFX(SFXKey.TILE_DISAPPEAR);

    // Play disappear animations on matched tile nodes
    if (this.tileContainer) {
      const node1 = this._getTileNode(r1, c1);
      const node2 = this._getTileNode(r2, c2);
      playTileDisappearAnim(node1);
      playTileDisappearAnim(node2);
    }

    // Notify combo tracker
    this._comboTracker.onTileMatched();

    // Notify session: consume a move
    this._session?.onMoveMade(this._comboTracker.getComboCount());

    // Emit matched event with path
    this._tileGrid.emitTilesMatched(path);

    // Update tiles-cleared count and check objectives
    this._tilesCleared += 2;
    if (this._tilesCleared >= this._objectiveTarget && this._objectiveTarget > 0) {
      this._session?.onObjectivesMet();
    }

    // Apply gravity after match
    this.boardEventManager?.triggerEventNow('tile_gravity');
    this._tileGrid.applyGravity();

    return true;
  }

  /**
   * Trigger a special block at the given grid position.
   * Call this when a special tile is activated by the player.
   */
  triggerSpecialBlock(row: number, col: number, type: SpecialBlockType): void {
    const behavior = SpecialBlockFactory.create(type);
    const comboCount = this._comboTracker.getComboCount();
    behavior.trigger(this._tileGrid, { row, col }, comboCount);

    // --- SFX: special block triggers ---
    const audio = AudioManager.getInstance();
    if (audio) {
      switch (type) {
        case SpecialBlockType.BOMB:
          audio.playSFX(SFXKey.SPECIAL_BOMB);
          break;
        case SpecialBlockType.WINDMILL:
          audio.playSFX(SFXKey.SPECIAL_WINDMILL);
          break;
        case SpecialBlockType.LIGHT:
          audio.playSFX(SFXKey.SPECIAL_LIGHT);
          break;
        case SpecialBlockType.WAVE:
          audio.playSFX(SFXKey.SPECIAL_WAVE);
          break;
      }
    }

    // Apply gravity after special
    this._tileGrid.applyGravity();
  }

  // -------------------------------------------------------------------------
  // TileGrid event handlers
  // -------------------------------------------------------------------------

  private _onTilesMatched(_path: Point[]): void {
    // Additional per-match logic can go here (e.g., scoring, VFX spawning)
  }

  private _onTilesSettled(): void {
    // After gravity settles, check if board is deadlocked (no valid moves)
    // Future: call a deadlock-detector and offer a reshuffle
  }

  private _onComboChanged(_count: number, _multiplier: number): void {
    // TileGrid also forwards combo, but we primarily use ComboTracker directly
  }

  // -------------------------------------------------------------------------
  // ComboTracker event handler (feeds HUD and session)
  // -------------------------------------------------------------------------

  private _onComboChangedFromTracker(_count: number, _multiplier: number): void {
    // GameHUD already subscribes via init(); nothing additional needed here
  }

  // -------------------------------------------------------------------------
  // GameSession event handlers
  // -------------------------------------------------------------------------

  private _onSessionEnded(result: SessionResult): void {
    // Show LevelCompletePopup
    if (this.levelCompletePopup) {
      // Map SessionResult → LevelCompletePopup's SessionResult shape
      const materialRewards: Record<string, number> = {};
      for (const m of result.reward.materials) {
        materialRewards[m.type] = m.amount;
      }

      this.levelCompletePopup.show({
        stars: result.stars,
        score: result.reward.coins,
        materialRewards,
        levelId: result.levelId,
        chapterId: this.chapterId,
        tilesCleared: this._tilesCleared,
        movesUsed: result.movesUsed,
      });
    } else {
      // Fallback: navigate back to map
      this.scheduleOnce(() => {
        director.loadScene('IslandMapScene');
      }, 1.5);
    }
  }

  private _onSessionFailed(): void {
    // Show failure/continue dialog
    const failNode = director.getScene()?.getChildByName('FailPopup');
    if (failNode) {
      failNode.active = true;
    } else {
      // Fallback: navigate back to map after a delay
      this.scheduleOnce(() => {
        director.loadScene('IslandMapScene');
      }, 2.0);
    }
  }

  private _onSessionStateChanged(_state: string): void {
    // Forward state changes; GameHUD listens directly via its own session listener
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /** Get the view Node for a given grid cell (row-major, 0-indexed). */
  private _getTileNode(row: number, col: number): Node | null {
    if (!this.tileContainer) return null;
    const index = row * this._cols + col;
    const child = this.tileContainer.children[index];
    return child ?? null;
  }
}
