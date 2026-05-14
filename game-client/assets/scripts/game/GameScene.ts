// GameScene.ts — Main game scene controller.
// Wires TileGrid, TileMatcher, ComboTracker, GameSession, GameHUD, LevelCompletePopup,
// BoardEventManager, ObstacleManager, and SpecialBlock behaviors together.
// Also owns all in-game SFX trigger points per audio-bindings spec.

import { _decorator, Component, Animation, Node, director, tween, Vec3, UIOpacity } from 'cc';
import { TileGrid, TILE_GRID_EVENT, Point } from '../puzzle/TileGrid';
import { TileMatcher } from '../puzzle/TileMatcher';
import { ComboTracker, COMBO_EVENT } from '../puzzle/ComboTracker';
import { BoardEventManager } from '../puzzle/BoardEventManager';
import { ObstacleManager, ObstacleKind } from '../puzzle/ObstacleManager';
import {
  SpecialBlockFactory, SpecialBlockType,
  WaveBehavior, PierceBehavior, SwapBehavior, CascadeBehavior,
} from '../puzzle/SpecialBlock';
import { GameSession, GAME_SESSION_EVENT, SessionResult } from './GameSession';
import { MaterialCollector } from './MaterialCollector';
import { LevelLoader } from './LevelLoader';
import { GameHUD } from '../ui/GameHUD';
import { LevelCompletePopup } from '../ui/LevelCompletePopup';
import { FailPopup } from '../ui/FailPopup';
import { PauseMenu } from '../ui/PauseMenu';
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

  @property({ type: FailPopup, tooltip: 'Fail / continue popup' })
  failPopup: FailPopup | null = null;

  @property({ type: PauseMenu, tooltip: 'Pause menu overlay' })
  pauseMenu: PauseMenu | null = null;

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
  private _boardEventManager: BoardEventManager | null = null;

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
      this._obstacleManager = new ObstacleManager();
      this._obstacleManager.setGrid(this._tileGrid);

      // Load obstacle definitions from level config
      if (config.obstacles && config.obstacles.length > 0) {
        const obstacleCells = config.obstacles.flatMap(obs =>
          (obs.positions as [number, number][]).map(([r, c]) => ({
            kind: obs.type as ObstacleKind,
            row: r,
            col: c,
          }))
        );
        this._obstacleManager.loadObstacles(obstacleCells);
      }

      // Initialize board event manager programmatically
      this._boardEventManager = new BoardEventManager();
      this._boardEventManager.setGrid(this._tileGrid);
      this._boardEventManager.setChapter(this.chapterId);
      this._boardEventManager.initFromLevelConfig(config.board_events);
      this._boardEventManager.setBoardRotateWarningCallback(payload => {
        this._onBoardRotateWarning(payload);
      });

      // Subscribe to TileGrid events
      this._tileGrid.on(TILE_GRID_EVENT.TILES_MATCHED, this._onTilesMatched, this);
      this._tileGrid.on(TILE_GRID_EVENT.TILES_SETTLED, this._onTilesSettled, this);
      this._tileGrid.on(TILE_GRID_EVENT.COMBO_CHANGED, this._onComboChanged, this);

      // Subscribe to ComboTracker events (for HUD)
      this._comboTracker.on(COMBO_EVENT.COMBO_CHANGED, this._onComboChangedFromTracker, this);

      // Wire special-block auto-generation from combo thresholds.
      this._comboTracker.onSpecialGeneration = (type, _comboCount) => {
        this._spawnSpecialBlockAtBestPosition(type);
      };

      // Subscribe to GameSession events
      this._session.on(GAME_SESSION_EVENT.SESSION_ENDED, this._onSessionEnded, this);
      this._session.on(GAME_SESSION_EVENT.SESSION_FAILED, this._onSessionFailed, this);
      this._session.on(GAME_SESSION_EVENT.STATE_CHANGED, this._onSessionStateChanged, this);

      // Listen for "Next Level" from LevelCompletePopup
      director.on('levelComplete_nextLevel', this._onNextLevel, this);

      // Wire HUD
      if (this.gameHUD) {
        this.gameHUD.init(this._comboTracker, this._session);
      }

      // Wire PauseMenu with session reference
      if (this.pauseMenu) {
        this.pauseMenu.setSession(this._session);
      }
    } catch (e) {
      console.error('[GameScene] Failed to start level:', e);
    }
  }

  onDestroy(): void {
    this.unscheduleAll();
    this._tileGrid.off(TILE_GRID_EVENT.TILES_MATCHED, this._onTilesMatched, this);
    this._tileGrid.off(TILE_GRID_EVENT.TILES_SETTLED, this._onTilesSettled, this);
    this._tileGrid.off(TILE_GRID_EVENT.COMBO_CHANGED, this._onComboChanged, this);
    this._comboTracker.off(COMBO_EVENT.COMBO_CHANGED, this._onComboChangedFromTracker, this);
    this._session?.off(GAME_SESSION_EVENT.SESSION_ENDED, this._onSessionEnded, this);
    this._session?.off(GAME_SESSION_EVENT.SESSION_FAILED, this._onSessionFailed, this);
    this._session?.off(GAME_SESSION_EVENT.STATE_CHANGED, this._onSessionStateChanged, this);
    director.off('levelComplete_nextLevel', this._onNextLevel, this);
  }

  update(dt: number): void {
    this._obstacleManager?.updateWaterCurrent(dt);
    this._boardEventManager?.update(dt);
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

    // Notify board event manager of the move (triggers board_rotate warning if threshold met)
    this._boardEventManager?.onMoveMade();

    // Emit matched event with path
    this._tileGrid.emitTilesMatched(path);

    // Run post-match board events (tile_fall, tile_slide, freeze_zone)
    this._boardEventManager?.onMatchComplete(undefined, matchedPositions);

    // Tick spreading obstacles and check board-overrun game-over condition
    this._obstacleManager?.tickSpread();
    if (this._obstacleManager?.isBoardOverrun()) {
      // Board fully covered by spreading_obstacle → immediate failure
      this._session?.failNow();
    }

    // Update tiles-cleared count and check objectives
    this._tilesCleared += 2;
    if (this._tilesCleared >= this._objectiveTarget && this._objectiveTarget > 0) {
      this._session?.onObjectivesMet();
    }

    // Apply gravity after match (tile_fall board event also calls applyGravity internally)
    this._tileGrid.applyGravity();

    return true;
  }

  /**
   * Trigger a special block at the given grid position.
   * Call this when a special tile is activated by the player.
   *
   * Behavior callbacks are wired before trigger() so that swap UI,
   * pierce buff, cascade chain, and wave buff all integrate with the
   * live board and BoardEventManager.
   */
  triggerSpecialBlock(row: number, col: number, type: SpecialBlockType): void {
    const behavior = SpecialBlockFactory.create(type);
    const comboCount = this._comboTracker.getComboCount();

    // Wire behavior-specific callbacks before triggering.
    switch (type) {
      case SpecialBlockType.WAVE: {
        const wave = behavior as WaveBehavior;
        wave.onWaveBuffStart = (_duration: number, _center) => {
          // Future: drive a wave-buff HUD timer or VFX here.
        };
        break;
      }
      case SpecialBlockType.PIERCE: {
        const pierce = behavior as PierceBehavior;
        pierce.onPierceBuffStart = (duration: number) => {
          this._boardEventManager?.handlePierceBuff(duration);
        };
        break;
      }
      case SpecialBlockType.SWAP: {
        const swap = behavior as SwapBehavior;
        swap.onSwapSelectionStart = (timeoutSec, onSelect, onTimeout) => {
          this._boardEventManager?.handleSwapSelection(timeoutSec, onSelect, onTimeout);
          // Emit event so a UI overlay can highlight selectable cells.
          this.node?.emit('openSwapUI');
        };
        break;
      }
      case SpecialBlockType.CASCADE: {
        const cascade = behavior as CascadeBehavior;
        cascade.onCascadeChainStart = (maxChains, delayMs, findNextPair, autoMatch) => {
          this._boardEventManager?.handleCascadeChain(maxChains, delayMs, findNextPair, autoMatch);
        };
        break;
      }
      default:
        break;
    }

    behavior.trigger(this._tileGrid, { row, col }, comboCount);

    // --- SFX: special block triggers ---
    const audio = AudioManager.getInstance();
    if (audio) {
      switch (type) {
        case SpecialBlockType.WAVE:
          audio.playSFX(SFXKey.SPECIAL_WAVE);
          break;
        case SpecialBlockType.LIGHT_CHAIN:
          audio.playSFX(SFXKey.SPECIAL_LIGHT_CHAIN);
          break;
        case SpecialBlockType.PIERCE:
          audio.playSFX(SFXKey.SPECIAL_PIERCE);
          break;
        case SpecialBlockType.SWAP:
          audio.playSFX(SFXKey.SPECIAL_SWAP);
          break;
        case SpecialBlockType.CASCADE:
          audio.playSFX(SFXKey.SPECIAL_CASCADE);
          break;
        default:
          break;
      }
    }

    // Apply gravity after special (cascade drives its own timed gravity via callbacks)
    if (type !== SpecialBlockType.CASCADE) {
      this._tileGrid.applyGravity();
    }
  }

  /**
   * Called by the swap UI overlay when the player confirms two cell selections.
   * Forwards to BoardEventManager to complete the swap.
   */
  resolveSwapSelection(a: { row: number; col: number }, b: { row: number; col: number }): void {
    this._boardEventManager?.resolveSwapSelection(a, b);
  }

  /**
   * Called by the swap UI overlay when the player cancels or the timeout fires.
   */
  cancelSwapSelection(): void {
    this._boardEventManager?.cancelSwapSelection();
  }

  // -------------------------------------------------------------------------
  // Special block auto-generation (triggered by ComboTracker thresholds)
  // -------------------------------------------------------------------------

  /**
   * Spawns a special block tile on the board when a combo threshold is reached.
   * Picks the most central non-obstacle, non-locked, non-empty cell as the host.
   * The cell retains its original TileType so the pairing rule still applies —
   * the specialBlockType field signals the renderer and input handler to treat
   * this cell as a special tile.
   */
  private _spawnSpecialBlockAtBestPosition(type: SpecialBlockType): void {
    const { rows, cols } = this._tileGrid.getSize();
    const centerRow = Math.floor(rows / 2);
    const centerCol = Math.floor(cols / 2);

    let bestCell: Point | null = null;
    let bestDist = Infinity;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = this._tileGrid.getTile(r, c);
        if (!cell || cell.isObstacle || cell.isLocked || cell.type === 'none') continue;
        // Skip cells already marked as special.
        if (cell.specialBlockType) continue;
        const dist = Math.abs(r - centerRow) + Math.abs(c - centerCol);
        if (dist < bestDist) {
          bestDist = dist;
          bestCell = { row: r, col: c };
        }
      }
    }

    if (!bestCell) return;

    const existing = this._tileGrid.getTile(bestCell.row, bestCell.col);
    if (!existing) return;

    this._tileGrid.setTile(bestCell.row, bestCell.col, {
      ...existing,
      specialBlockType: type,
    });

    // Notify the renderer that a special tile was spawned.
    (this._tileGrid as any).emit('specialBlockSpawned', {
      row: bestCell.row,
      col: bestCell.col,
      type,
    });
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
    // --- SFX: level complete ---
    AudioManager.getInstance()?.playSFX(SFXKey.LEVEL_COMPLETE);

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
    if (this.failPopup && this._session) {
      this.failPopup.show(this._session);
    } else {
      this.scheduleOnce(() => { director.loadScene('IslandMapScene'); }, 2.0);
    }
  }

  private _onNextLevel(): void {
    const directorGlobals = director as unknown as Record<string, unknown>;
    const currentLevel = (directorGlobals['_lastLevel'] as string) || this.levelId;
    const parts = currentLevel.split('-');
    if (parts.length === 2) {
      const chapter = parseInt(parts[0], 10);
      const level = parseInt(parts[1], 10);
      directorGlobals['_lastLevel'] = `${chapter}-${level + 1}`;
    }
    director.loadScene('Prototype');
  }

  private _onSessionStateChanged(_state: string): void {
    // Forward state changes; GameHUD listens directly via its own session listener
  }

  /**
   * Called by BoardEventManager when a board_rotate warning period begins.
   * Flashes a visual warning on the HUD so the player can prepare.
   */
  private _onBoardRotateWarning(payload: {
    topLeft: { row: number; col: number };
    bottomRight: { row: number; col: number };
    warningDuration: number;
  }): void {
    // Show a rotation warning flash on the HUD node if available.
    const scene = director.getScene();
    const warningNode = scene?.getChildByName('BoardRotateWarning');
    if (warningNode) {
      warningNode.active = true;
      const opacity = warningNode.getComponent(UIOpacity) ?? warningNode.addComponent(UIOpacity);
      opacity.opacity = 200;
      tween(opacity)
        .to(payload.warningDuration * 0.5, { opacity: 60 })
        .to(payload.warningDuration * 0.5, { opacity: 0 })
        .call(() => { warningNode.active = false; })
        .start();
    }
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
