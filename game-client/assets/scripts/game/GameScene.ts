// GameScene.ts — Main game scene controller.
// Wires TileGrid, TileMatcher, ComboTracker, GameSession, GameHUD, LevelCompletePopup,
// BoardEventManager, ObstacleManager, and SpecialBlock behaviors together.
// Also owns all in-game SFX trigger points per audio-bindings spec.

import {
  _decorator, Component, Animation, Node, director, tween, Vec3, UIOpacity,
  Label, Graphics, UITransform, Widget, Button, Color, resources, SpriteFrame, Sprite, find,
} from 'cc';
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
    const opacity = UIOpacity
      ? (tileNode.getComponent(UIOpacity) ?? tileNode.addComponent(UIOpacity))
      : null;
    tween(tileNode)
      .to(0.12, { scale: new Vec3(1.3, 0.7, 1) })
      .to(0.18, { scale: new Vec3(0.0, 0.0, 1) })
      .call(() => { tileNode.active = false; })
      .start();
    if (opacity) {
      tween(opacity)
        .delay(0.24)
        .to(0.06, { opacity: 0 })
        .start();
    }
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
    // Bootstrap programmatic background and HUD when Inspector refs are not wired
    this._bootstrapBackground();
    this._bootstrapHUD();

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
    // When the full GameHUD is not wired, update the bootstrap HUD labels directly
    if (!this.gameHUD && this._hudRegistered && this._session) {
      const sess = this._session as unknown as {
        movesRemaining?: number; maxMoves?: number;
      };
      const moves = typeof sess.movesRemaining === 'number' ? sess.movesRemaining : 0;
      this._updateBootstrapHUD(moves, this._tilesCleared, this._objectiveTarget);
    }
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
      const opacity = UIOpacity
        ? (warningNode.getComponent(UIOpacity) ?? warningNode.addComponent(UIOpacity))
        : null;
      if (!opacity) { warningNode.active = false; return; }
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

  // -------------------------------------------------------------------------
  // Programmatic background bootstrap (fires when background is not wired in editor)
  // -------------------------------------------------------------------------

  private _bootstrapBackground(): void {
    const canvas = this.node.parent ?? find('Canvas') ?? director.getScene()?.getChildByName('Canvas');
    if (!canvas) return;
    if (canvas.getChildByName('Background')) return;

    const bgNode = new Node('Background');
    const uit = bgNode.addComponent(UITransform);
    uit.setContentSize(960, 640);

    const widget = bgNode.addComponent(Widget);
    widget.isAlignLeft   = true;
    widget.isAlignRight  = true;
    widget.isAlignTop    = true;
    widget.isAlignBottom = true;
    widget.left   = 0;
    widget.right  = 0;
    widget.top    = 0;
    widget.bottom = 0;
    widget.alignMode = 2;

    canvas.insertChild(bgNode, 0);

    // Load chapter-appropriate background (before restoration state).
    // Background file stems map to: ch01=harbor, ch02=pottery, ch03=forest,
    // ch04=path, ch05=cliff, ch06=lighthouse.
    const CHAPTER_BG_STEM: Record<number, string> = {
      1: 'harbor', 2: 'pottery', 3: 'forest', 4: 'path', 5: 'cliff', 6: 'lighthouse',
    };
    const stem = CHAPTER_BG_STEM[this.chapterId] ?? 'harbor';
    const chNum = String(this.chapterId).padStart(2, '0');
    const bgKey = `sprites/backgrounds/ch${chNum}_${stem}_before/spriteFrame`;
    resources.load(bgKey, SpriteFrame, (err, sf) => {
      if (!err && sf) {
        const sprite = bgNode.addComponent(Sprite);
        sprite.spriteFrame = sf;
        sprite.sizeMode = 0;  // CUSTOM
      } else {
        // Fallback gradient: ocean palette
        const g = bgNode.addComponent(Graphics);
        g.fillColor = new Color(72, 158, 180, 255);
        g.rect(-480, -320, 960, 640);
        g.fill();
        g.fillColor = new Color(120, 196, 210, 255);
        g.rect(-480, 0, 960, 320);
        g.fill();
        g.fillColor = new Color(220, 195, 150, 255);
        g.rect(-480, -320, 960, 130);
        g.fill();
      }
    });
  }

  // -------------------------------------------------------------------------
  // Programmatic HUD bootstrap (fires when gameHUD Inspector ref is null)
  // -------------------------------------------------------------------------

  private _bootstrapHUD(): void {
    if (this.gameHUD) return;  // Already wired in Inspector — skip

    const canvas = this.node.parent ?? find('Canvas') ?? director.getScene()?.getChildByName('Canvas');
    if (!canvas) return;
    if (canvas.getChildByName('HUD')) return;

    const hud = new Node('HUD');
    const hudUIT = hud.addComponent(UITransform);
    hudUIT.setContentSize(960, 640);
    const hudWidget = hud.addComponent(Widget);
    hudWidget.isAlignLeft   = true;
    hudWidget.isAlignRight  = true;
    hudWidget.isAlignTop    = true;
    hudWidget.isAlignBottom = true;
    hudWidget.left = hudWidget.right = hudWidget.top = hudWidget.bottom = 0;
    hudWidget.alignMode = 2;
    canvas.addChild(hud);

    // --- Moves remaining label (top centre) ---
    const movesNode = new Node('MovesLabel');
    movesNode.addComponent(UITransform).setContentSize(200, 44);
    movesNode.setPosition(new Vec3(0, 280, 0));
    const movesLbl = movesNode.addComponent(Label);
    movesLbl.string   = '-- moves';
    movesLbl.fontSize = 28;
    movesLbl.color    = new Color(255, 240, 200, 255);
    movesLbl.isBold   = true;
    movesLbl.horizontalAlign = 1;
    hud.addChild(movesNode);
    this._hudMovesLabel = movesLbl;

    // --- Objective progress label (top left) ---
    const objNode = new Node('ObjectiveLabel');
    objNode.addComponent(UITransform).setContentSize(200, 36);
    objNode.setPosition(new Vec3(-360, 280, 0));
    const objLbl = objNode.addComponent(Label);
    objLbl.string   = '0 / --';
    objLbl.fontSize = 22;
    objLbl.color    = new Color(255, 255, 255, 210);
    objLbl.horizontalAlign = 0;
    hud.addChild(objNode);
    this._hudObjectiveLabel = objLbl;

    // --- Score / combo label (top right) ---
    const comboNode = new Node('ComboLabel');
    comboNode.addComponent(UITransform).setContentSize(220, 36);
    comboNode.setPosition(new Vec3(360, 280, 0));
    const comboLbl = comboNode.addComponent(Label);
    comboLbl.string   = '';
    comboLbl.fontSize = 22;
    comboLbl.color    = new Color(255, 220, 80, 255);
    comboLbl.horizontalAlign = 2;
    hud.addChild(comboNode);
    this._hudComboLabel = comboLbl;

    // --- Pause button (top-right corner) ---
    const pauseNode = new Node('PauseButton');
    pauseNode.addComponent(UITransform).setContentSize(80, 44);
    pauseNode.setPosition(new Vec3(420, 300, 0));
    const pauseG = pauseNode.addComponent(Graphics);
    pauseG.fillColor = new Color(80, 80, 80, 180);
    pauseG.rect(-40, -22, 80, 44);
    pauseG.fill();
    const pauseLblNode = new Node('PauseLbl');
    pauseLblNode.addComponent(UITransform).setContentSize(80, 44);
    const pauseLbl = pauseLblNode.addComponent(Label);
    pauseLbl.string   = '⏸';
    pauseLbl.fontSize = 24;
    pauseLbl.color    = new Color(255, 255, 255, 255);
    pauseLbl.horizontalAlign = 1;
    pauseNode.addChild(pauseLblNode);
    const pauseBtn = pauseNode.addComponent(Button);
    pauseBtn.node.on(Button.EventType.CLICK, () => {
      const scene = director.getScene();
      const pmNode = scene?.getChildByName('PauseMenu');
      if (pmNode) {
        const pm = pmNode.getComponent('PauseMenu') as { show?: () => void } | null;
        pm?.show ? pm.show() : (pmNode.active = true);
      }
    }, this);
    hud.addChild(pauseNode);

    // Register HUD updater so we can push state without a real GameHUD component
    this._hudRegistered = true;
  }

  /** Dynamically created label refs from _bootstrapHUD */
  private _hudMovesLabel: Label | null    = null;
  private _hudObjectiveLabel: Label | null = null;
  private _hudComboLabel: Label | null     = null;
  private _hudRegistered: boolean          = false;

  /** Called by session state change when using the bootstrap HUD */
  private _updateBootstrapHUD(movesRemaining: number, cleared: number, target: number): void {
    if (!this._hudRegistered) return;
    if (this._hudMovesLabel) {
      this._hudMovesLabel.string = `${movesRemaining} moves`;
      this._hudMovesLabel.color  = movesRemaining <= 5
        ? new Color(224, 90, 74, 255)
        : new Color(255, 240, 200, 255);
    }
    if (this._hudObjectiveLabel) {
      this._hudObjectiveLabel.string = `${cleared} / ${target}`;
    }
  }
}
