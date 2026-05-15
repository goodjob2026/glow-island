/**
 * PrototypeBoard.ts
 * Glow Island – Connect-the-tiles (连连看) core prototype
 * 8×8 grid, 4 tile types, BFS path-finding with ≤2 turns
 * No art assets – pure colour blocks for gameplay feel validation
 */

import {
    _decorator, Component, Node, Label, Color,
    Sprite, UITransform, UIOpacity, Graphics,
    tween, Vec3, easing, resources, SpriteFrame, Texture2D, Widget, Button, director, find,
} from 'cc';

const { ccclass, property } = _decorator;

// ── Tile definitions (Animal Crossing warm healing palette) ──────────────────
const TILE_COLORS: Record<number, { fill: Color; stroke: Color }> = {
    0: { fill: new Color(237, 139, 107, 255), stroke: new Color(187,  89,  57, 255) }, // 珊瑚橙 贝壳
    1: { fill: new Color( 91, 191, 181, 255), stroke: new Color( 41, 141, 131, 255) }, // 海水青 波浪
    2: { fill: new Color(125, 190, 119, 255), stroke: new Color( 75, 140,  69, 255) }, // 竹叶绿 叶子
    3: { fill: new Color(240, 196, 196, 255), stroke: new Color(190, 146, 146, 255) }, // 樱粉 樱花
    4: { fill: new Color(196, 149,  90, 255), stroke: new Color(146,  99,  40, 255) }, // 木纹棕 浮木
};
const TILE_TYPE_COUNT = 5;

const COLS = 8;
const ROWS = 8;
const CELL_SIZE = 60;
const CELL_GAP  =  6;

// Direction helpers
const DIRS = [
    { dx:  0, dy:  1 },
    { dx:  0, dy: -1 },
    { dx:  1, dy:  0 },
    { dx: -1, dy:  0 },
];

// ── BFS state ─────────────────────────────────────────────────────────────────
interface BFSState {
    x: number;
    y: number;
    dir: number;  // -1 = no direction yet
    turns: number;
}

function dirIndex(dx: number, dy: number): number {
    if (dy ===  1) return 0;
    if (dy === -1) return 1;
    if (dx ===  1) return 2;
    return 3;
}

// ── Drawing helpers ───────────────────────────────────────────────────────────
function roundRect(g: Graphics, x: number, y: number, w: number, h: number, r: number) {
    g.moveTo(x + r, y);
    g.lineTo(x + w - r, y);
    g.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
    g.lineTo(x + w, y + h - r);
    g.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    g.lineTo(x + r, y + h);
    g.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
    g.lineTo(x, y + r);
    g.arc(x + r, y + r, r, Math.PI, -Math.PI / 2);
    g.close();
}

@ccclass('PrototypeBoard')
export class PrototypeBoard extends Component {

    // ── UI label references (set in Inspector or found at runtime) ───────────
    @property(Label) comboLabel:   Label | null = null;
    @property(Label) clearedLabel: Label | null = null;

    // ── Internal state ────────────────────────────────────────────────────────
    private grid:      (number | null)[][] = [];   // type index or null (empty)
    private tileNodes: (Node | null)[][]   = [];
    private selected:  { x: number; y: number } | null = null;

    private combo   = 0;
    private cleared = 0;

    /** Pre-loaded SpriteFrames per tile type (0-4), null until loaded */
    private _tileSprites: (SpriteFrame | null)[] = new Array(TILE_TYPE_COUNT).fill(null);

    /** Timestamp of last successful match (ms) */
    private lastMatchTime = 0;
    /** Combo window in ms, from puzzle-mechanics-spec combo.window_ms */
    private readonly COMBO_WINDOW_MS = 2000;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    /** The node used as the tile grid container (separate from this.node when on Canvas) */
    private _boardContainer: Node | null = null;

    /** Resolve the canvas node (the node that holds Background/HUD/Board as children) */
    private _getCanvas(): Node {
        // If this component is on a node whose name is 'Canvas', use it directly
        if (this.node.name === 'Canvas') return this.node;
        // If this node has a parent, use parent (old Board-child-of-Canvas setup)
        const parent = this.node.parent;
        if (parent && parent.name !== 'Prototype' && parent.name !== '') return parent;
        // Fallback: find Canvas in scene
        return find('Canvas') ?? director.getScene()?.getChildByName('Canvas') ?? this.node;
    }

    start() {
        // Create a dedicated board container node so we never destroy Canvas children
        const canvas = this._getCanvas();
        let boardNode = canvas.getChildByName('BoardGrid');
        if (!boardNode) {
            boardNode = new Node('BoardGrid');
            boardNode.addComponent(UITransform).setContentSize(960, 640);
            canvas.addChild(boardNode);
        }
        this._boardContainer = boardNode;

        this._bootstrapBackground();
        this._bootstrapHUD();
        this._injectAudioPaths();
        this.initGrid();
        this.buildNodes();
        this.updateLabels();
        this._preloadTileSprites();
    }

    // ── Background bootstrap ──────────────────────────────────────────────────
    /**
     * Loads the chapter-1 harbor background from resources and attaches it as a
     * full-screen Sprite behind the board.  Falls back to a solid warm-teal fill
     * if the resource cannot be loaded (e.g. editor preview without build step).
     */
    private _bootstrapBackground(): void {
        const canvas = this._getCanvas();
        if (!canvas) return;

        // Check if a background node already exists (editor-wired)
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
        widget.alignMode = 2; // ALWAYS

        // Synchronous fallback: draw solid warm-teal gradient via Graphics immediately
        // so the background is always visible regardless of async asset loading.
        const g = bgNode.addComponent(Graphics);
        g.fillColor = new Color(72, 158, 180, 255);  // coastal blue-teal
        g.rect(-480, -320, 960, 640);
        g.fill();
        // Lighter sky strip (top 40%)
        g.fillColor = new Color(120, 196, 210, 255);
        g.rect(-480, 0, 960, 320);
        g.fill();
        // Sand strip (bottom 20%)
        g.fillColor = new Color(220, 195, 150, 255);
        g.rect(-480, -320, 960, 130);
        g.fill();

        // Insert as the first child so it renders behind everything
        canvas.insertChild(bgNode, 0);

        // Attempt to upgrade with the harbor background sprite (ch01)
        resources.load('sprites/backgrounds/ch01_harbor_before/texture', Texture2D, (err: Error | null, tex: Texture2D) => {
            if (!err && tex) {
                const sf = new SpriteFrame();
                sf.texture = tex;
                const existingG = bgNode.getComponent(Graphics);
                if (existingG) existingG.destroy();
                const sprite = bgNode.addComponent(Sprite);
                sprite.spriteFrame = sf;
                sprite.sizeMode = 0;
            }
        });
    }

    // ── HUD bootstrap ─────────────────────────────────────────────────────────
    /**
     * Creates an in-scene HUD overlay with combo label, cleared counter, and a
     * Reset button if the Inspector references (comboLabel, clearedLabel) are not
     * already wired.  This allows the scene to be fully playable from a minimal
     * scene file that only contains a Camera node.
     */
    private _bootstrapHUD(): void {
        const canvas = this._getCanvas();
        if (!canvas) return;

        // If both labels already wired (editor setup), skip bootstrap
        if (this.comboLabel && this.clearedLabel) return;

        const hud = new Node('HUD');
        const hudUIT = hud.addComponent(UITransform);
        hudUIT.setContentSize(960, 640);

        const hudWidget = hud.addComponent(Widget);
        hudWidget.isAlignLeft   = true;
        hudWidget.isAlignRight  = true;
        hudWidget.isAlignTop    = true;
        hudWidget.isAlignBottom = true;
        hudWidget.left   = 0;
        hudWidget.right  = 0;
        hudWidget.top    = 0;
        hudWidget.bottom = 0;
        hudWidget.alignMode = 2;

        canvas.addChild(hud);

        // Combo label – top centre
        if (!this.comboLabel) {
            const comboNode = new Node('ComboLabel');
            comboNode.addComponent(UITransform).setContentSize(400, 40);
            comboNode.setPosition(new Vec3(0, 270, 0));
            const lbl = comboNode.addComponent(Label);
            lbl.string     = 'COMBO × 0  (×1.0)';
            lbl.fontSize   = 24;
            lbl.color      = new Color(255, 240, 200, 255);
            lbl.isBold     = true;
            lbl.horizontalAlign = 1; // CENTER
            hud.addChild(comboNode);
            this.comboLabel = lbl;
        }

        // Cleared label – top-left
        if (!this.clearedLabel) {
            const clearedNode = new Node('ClearedLabel');
            clearedNode.addComponent(UITransform).setContentSize(200, 36);
            clearedNode.setPosition(new Vec3(-360, 270, 0));
            const lbl = clearedNode.addComponent(Label);
            lbl.string   = 'Cleared: 0';
            lbl.fontSize = 22;
            lbl.color    = new Color(255, 255, 255, 220);
            lbl.horizontalAlign = 0; // LEFT
            hud.addChild(clearedNode);
            this.clearedLabel = lbl;
        }

        // Steps / moves label – top-right
        const stepsNode = new Node('StepsLabel');
        stepsNode.addComponent(UITransform).setContentSize(200, 36);
        stepsNode.setPosition(new Vec3(360, 270, 0));
        const stepsLbl = stepsNode.addComponent(Label);
        stepsLbl.string   = 'Steps: 0';
        stepsLbl.fontSize = 22;
        stepsLbl.color    = new Color(255, 255, 255, 220);
        stepsLbl.horizontalAlign = 2; // RIGHT
        hud.addChild(stepsNode);
        this._stepsLabel = stepsLbl;

        // Reset button – bottom centre
        const btnNode = new Node('ResetButton');
        btnNode.addComponent(UITransform).setContentSize(120, 44);
        btnNode.setPosition(new Vec3(0, -285, 0));

        // Button background via Graphics
        const btnG = btnNode.addComponent(Graphics);
        btnG.fillColor = new Color(91, 191, 181, 230);
        roundRect(btnG, -60, -22, 120, 44, 10);
        btnG.fill();
        btnG.strokeColor = new Color(41, 141, 131, 255);
        btnG.lineWidth   = 2;
        roundRect(btnG, -60, -22, 120, 44, 10);
        btnG.stroke();

        // Button label
        const btnLblNode = new Node('ResetBtnLabel');
        btnLblNode.addComponent(UITransform).setContentSize(120, 44);
        const btnLbl = btnLblNode.addComponent(Label);
        btnLbl.string   = 'Reset';
        btnLbl.fontSize = 22;
        btnLbl.color    = new Color(255, 255, 255, 255);
        btnLbl.isBold   = true;
        btnLbl.horizontalAlign = 1;
        btnNode.addChild(btnLblNode);

        const btn = btnNode.addComponent(Button);
        btn.node.on(Button.EventType.CLICK, this.onResetClick, this);

        hud.addChild(btnNode);
    }

    /** Extra label for steps counter created during HUD bootstrap */
    private _stepsLabel: Label | null = null;

    // ── Grid initialisation ───────────────────────────────────────────────────
    private initGrid() {
        this.grid = [];
        for (let r = 0; r < ROWS; r++) {
            this.grid[r] = [];
            for (let c = 0; c < COLS; c++) {
                this.grid[r][c] = Math.floor(Math.random() * TILE_TYPE_COUNT);
            }
        }
    }

    // ── Node construction ─────────────────────────────────────────────────────
    private buildNodes() {
        const container = this._boardContainer ?? this.node;
        // Clear previous tile children (for reset) — only destroy named tile_ nodes
        const toDestroy = container.children.filter(ch => ch.name.startsWith('tile_'));
        toDestroy.forEach(ch => ch.destroy());

        this.tileNodes = [];
        const totalW = COLS * (CELL_SIZE + CELL_GAP) - CELL_GAP;
        const totalH = ROWS * (CELL_SIZE + CELL_GAP) - CELL_GAP;
        const startX = -totalW / 2 + CELL_SIZE / 2;
        const startY =  totalH / 2 - CELL_SIZE / 2;

        for (let r = 0; r < ROWS; r++) {
            this.tileNodes[r] = [];
            for (let c = 0; c < COLS; c++) {
                const type = this.grid[r][c];
                if (type === null) {
                    this.tileNodes[r][c] = null;
                    continue;
                }
                const tile = this.createTileNode(c, r, type, startX, startY);
                container.addChild(tile);
                this.tileNodes[r][c] = tile;
            }
        }
    }

    private createTileNode(
        c: number, r: number, type: number,
        startX: number, startY: number
    ): Node {
        const tile = new Node(`tile_${r}_${c}`);
        tile.addComponent(UITransform).setContentSize(CELL_SIZE, CELL_SIZE);

        const g = tile.addComponent(Graphics);

        // Rounded tile base — Animal Crossing warm palette with per-type stroke
        const palette = TILE_COLORS[type];
        g.fillColor   = palette.fill;
        g.strokeColor = palette.stroke;
        g.lineWidth   = 2;
        roundRect(g, -CELL_SIZE / 2, -CELL_SIZE / 2, CELL_SIZE, CELL_SIZE, 12);
        g.fill();
        g.stroke();

        // Inner glow highlight — soft white shimmer in top-left quadrant
        g.fillColor = new Color(255, 255, 255, 70);
        g.moveTo(-CELL_SIZE * 0.28, -CELL_SIZE * 0.05);
        g.arc(-CELL_SIZE * 0.12, -CELL_SIZE * 0.12, CELL_SIZE * 0.18, 0, Math.PI * 2);
        g.close();
        g.fill();

        const op = UIOpacity ? tile.addComponent(UIOpacity) : null;
        if (op) op.opacity = 255;

        const px = startX + c * (CELL_SIZE + CELL_GAP);
        const py = startY - r * (CELL_SIZE + CELL_GAP);
        tile.setPosition(new Vec3(px, py, 0));

        // Store grid coords as custom data
        (tile as any)._gridC = c;
        (tile as any)._gridR = r;

        // Apply pre-loaded sprite immediately if available
        const sf = this._tileSprites[type];
        if (sf) {
            let sp = tile.addComponent(Sprite);
            sp.spriteFrame = sf;
            sp.sizeMode = 0; // CUSTOM
        }

        tile.on(Node.EventType.TOUCH_END, () => this.onTileTap(c, r), this);
        return tile;
    }

    // ── Tile sprite loading ───────────────────────────────────────────────────
    private _preloadTileSprites(): void {
        for (let t = 0; t < TILE_TYPE_COUNT; t++) {
            const idx = t + 1;
            const path = `sprites/tiles/tile_0${idx}/texture`;
            resources.load(path, Texture2D, (err: Error | null, tex: Texture2D) => {
                if (!err && tex) {
                    const sf = new SpriteFrame();
                    sf.texture = tex;
                    this._tileSprites[t] = sf;
                    this._applySpritesToType(t, sf);
                }
            });
        }
    }

    /** Inject audio asset paths into cc.resources config so resources.load('audio/...') works
     *  without requiring the CC3 Editor to reimport the files. */
    private _injectAudioPaths(): void {
        const res = (resources as any);
        const pathMap = res?._config?.paths?._map;
        const AudioClip = (window as any).cc?.AudioClip;
        if (!pathMap || !AudioClip) return;

        const AUDIO: Record<string, string> = {
            'c9278592-d4ee-4549-a24a-f5f05e75eea3': 'audio/sfx/sfx_lighthouse_on',
            '0ce198d3-13bf-491d-80d6-c23e7dca4386': 'audio/sfx/sfx_level_complete',
            'ad60db62-d5d6-4d25-89f6-994621d68e2a': 'audio/sfx/sfx_ui_button',
            'a93843d3-8c36-4938-81e1-cb2c37b40cca': 'audio/sfx/sfx_disappear',
            '23c42738-1bc3-48ee-aadd-9577335145b1': 'audio/sfx/sfx_zen_complete',
            'dc57a1d1-6f10-4d7a-8205-540cc3a32a8e': 'audio/sfx/sfx_area_restore',
            'a109f3ad-24c3-49bf-8b60-bfcbb940d770': 'audio/sfx/sfx_special_cascade',
            'd0845f07-2f8a-4aa3-852e-6c288d5d0720': 'audio/sfx/sfx_connect',
            '65547735-8aba-4051-8a52-8db76b2fa221': 'audio/sfx/sfx_special_light',
            '7f0770fc-4d66-4a9c-aadf-f641c862d648': 'audio/sfx/sfx_combo1',
            '7c2d82d9-8c56-42b3-95f5-8a56721c49d1': 'audio/sfx/sfx_special_wave',
            'd649c08a-ad55-48db-84fb-aa9fdada1dc4': 'audio/sfx/sfx_special_pierce',
            '6ae1d433-8ad9-475f-820c-5015676d1201': 'audio/sfx/sfx_special_windmill',
            'ebda4ed0-2d4d-4398-9f33-6e64c09965b2': 'audio/sfx/sfx_special_swap',
            'f1089b51-d4e1-4256-9da6-c4cf15e76603': 'audio/sfx/sfx_special_bomb',
            'e824496e-8da0-4bc5-8b4d-7564ddfc7126': 'audio/sfx/sfx_special_light_chain',
            '123320dc-80eb-40d0-b32d-d53056b8e984': 'audio/sfx/sfx_combo2',
            'ba5f11df-8ff2-48c1-9371-0090ea4be599': 'audio/sfx/sfx_combo3',
            'a85389db-e840-4394-a152-fa9403614e66': 'audio/bgm/bgm_chapter6_lighthouse',
            '861f1b20-a1d5-49b0-90f5-6cf6740c75f8': 'audio/bgm/bgm_menu',
            'ae17e000-6b73-4fba-a571-0a620e1d12e8': 'audio/bgm/bgm_chapter3_flower',
            'a650c610-99c6-482c-9afd-fa9f4f2222e1': 'audio/bgm/bgm_zen_ambient',
            '5560b57e-6cd0-4374-9c32-b6e7169f50df': 'audio/bgm/bgm_chapter4_forest',
            'e99dc1e4-08b2-445d-ab04-ee6bf8e45fca': 'audio/bgm/bgm_chapter5_hotspring',
            '997c318b-15b8-4196-a458-2f3493728ec3': 'audio/bgm/bgm_chapter1_seaside',
            'b172d859-320b-4057-9935-914b9b47cc65': 'audio/bgm/bgm_chapter2_town',
        };
        for (const [uuid, path] of Object.entries(AUDIO)) {
            if (!pathMap[path]) {
                const info = { uuid, path, ctor: AudioClip };
                pathMap[path] = [info];
                pathMap[uuid] = info;
            }
        }
    }

    private _applySpritesToType(type: number, sf: SpriteFrame): void {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (this.grid[r]?.[c] === type && this.tileNodes[r]?.[c]) {
                    const tileNode = this.tileNodes[r][c]!;
                    let sp = tileNode.getComponent(Sprite);
                    if (!sp) sp = tileNode.addComponent(Sprite);
                    sp.spriteFrame = sf;
                    sp.sizeMode = 0; // CUSTOM
                }
            }
        }
    }

    // ── Input handling ────────────────────────────────────────────────────────
    private onTileTap(c: number, r: number) {
        if (this.grid[r][c] === null) return;  // empty cell – ignore

        if (!this.selected) {
            // First selection
            this.setSelected(c, r);
            return;
        }

        const { x: sc, y: sr } = this.selected;

        if (sc === c && sr === r) {
            // Tap same tile – deselect
            this.clearSelected();
            return;
        }

        const selType = this.grid[sr][sc];
        const tapType = this.grid[r][c];

        if (selType !== tapType) {
            // Different type – switch selection
            this.clearSelected();
            this.setSelected(c, r);
            return;
        }

        // Same type – check BFS path
        if (this.bfsPath(sc, sr, c, r)) {
            this.doMatch(sc, sr, c, r);
        } else {
            this.shakeNode(this.tileNodes[r][c]);
            this.shakeNode(this.tileNodes[sr][sc]);
            this.clearSelected();
        }
    }

    private setSelected(c: number, r: number) {
        this.clearSelected();
        this.selected = { x: c, y: r };
        const node = this.tileNodes[r][c];
        if (node) {
            tween(node)
                .to(0.12, { scale: new Vec3(1.15, 1.15, 1) }, { easing: easing.backOut })
                .start();
        }
    }

    private clearSelected() {
        if (this.selected) {
            const { x: c, y: r } = this.selected;
            const node = this.tileNodes[r]?.[c];
            if (node) {
                tween(node)
                    .to(0.1, { scale: new Vec3(0.95, 0.95, 1) }, { easing: easing.quadOut })
                    .to(0.08, { scale: new Vec3(1, 1, 1) }, { easing: easing.quadIn })
                    .start();
            }
        }
        this.selected = null;
    }

    // ── Match execution ───────────────────────────────────────────────────────
    private doMatch(c1: number, r1: number, c2: number, r2: number) {
        const now = Date.now();
        if (now - this.lastMatchTime < this.COMBO_WINDOW_MS) {
            this.combo += 1;
        } else {
            this.combo = 1;
        }
        this.lastMatchTime = now;
        this.cleared += 2;
        this.updateLabels();

        const n1 = this.tileNodes[r1][c1];
        const n2 = this.tileNodes[r2][c2];

        this.clearSelected();

        // Remove from logical grid immediately
        this.grid[r1][c1] = null;
        this.grid[r2][c2] = null;
        this.tileNodes[r1][c1] = null;
        this.tileNodes[r2][c2] = null;

        this.vanishTile(n1);
        this.vanishTile(n2, () => this.dropColumns([c1, c2]));
    }

    private vanishTile(node: Node | null, onDone?: () => void) {
        if (!node) { onDone?.(); return; }
        const op = node.getComponent(UIOpacity);
        tween(node)
            .to(0.12, { scale: new Vec3(1.2, 1.2, 1) }, { easing: easing.quadOut })
            .parallel(
                tween(node).to(0.2, { scale: new Vec3(0, 0, 0) }, { easing: easing.quadIn }),
                op ? tween(op).to(0.2, { opacity: 0 }) : tween(node)
            )
            .call(() => { node.destroy(); onDone?.(); })
            .start();
    }

    // ── Gravity: drop tiles in affected columns and refill from top ───────────
    private dropColumns(cols: number[]) {
        const uniqueCols = Array.from(new Set(cols));
        const totalH = ROWS * (CELL_SIZE + CELL_GAP) - CELL_GAP;
        const startX = -(COLS * (CELL_SIZE + CELL_GAP) - CELL_GAP) / 2 + CELL_SIZE / 2;
        const startY =  totalH / 2 - CELL_SIZE / 2;

        for (const c of uniqueCols) {
            // Compact non-null tiles toward the bottom
            const typeStack: number[] = [];
            for (let r = ROWS - 1; r >= 0; r--) {
                if (this.grid[r][c] !== null) {
                    typeStack.push(this.grid[r][c] as number);
                }
            }
            // Fill from bottom with existing tiles, then add new from top
            const missing = ROWS - typeStack.length;
            const newTypes: number[] = [];
            for (let i = 0; i < missing; i++) {
                newTypes.push(Math.floor(Math.random() * TILE_TYPE_COUNT));
            }
            const fullColumn = [...newTypes, ...typeStack];

            for (let r = 0; r < ROWS; r++) {
                const newType = fullColumn[r];
                const oldNode = this.tileNodes[r][c];
                if (oldNode) {
                    // Destroy existing node if mismatch (shouldn't happen but safety)
                    if (this.grid[r][c] !== newType) {
                        oldNode.destroy();
                        this.tileNodes[r][c] = null;
                    }
                }

                this.grid[r][c] = newType;

                const targetPy = startY - r * (CELL_SIZE + CELL_GAP);
                const targetPx = startX + c * (CELL_SIZE + CELL_GAP);

                if (!this.tileNodes[r][c]) {
                    const tile = this.createTileNode(c, r, newType, startX, startY);
                    // Start above screen for drop-in effect
                    tile.setPosition(new Vec3(targetPx, targetPy - (ROWS - r) * (CELL_SIZE + CELL_GAP) * 1.5, 0));
                    (this._boardContainer ?? this.node).addChild(tile);
                    this.tileNodes[r][c] = tile;
                    tween(tile)
                        .to(0.28, { position: new Vec3(targetPx, targetPy, 0) }, { easing: easing.quadIn })
                        .start();
                }
            }
        }
    }

    // ── Shake feedback for invalid path ───────────────────────────────────────
    private shakeNode(node: Node | null) {
        if (!node) return;
        const orig = node.position.clone();
        tween(node)
            .to(0.05, { position: new Vec3(orig.x - 8, orig.y, 0) })
            .to(0.05, { position: new Vec3(orig.x + 8, orig.y, 0) })
            .to(0.05, { position: new Vec3(orig.x - 5, orig.y, 0) })
            .to(0.05, { position: new Vec3(orig.x + 5, orig.y, 0) })
            .to(0.05, { position: orig })
            .start();
    }

    // ── BFS path-finding (≤2 turns) ───────────────────────────────────────────
    /**
     * Returns true if there exists a path from (c1,r1) to (c2,r2) that:
     *  - Does not pass through any occupied cell (other than the two endpoints)
     *  - Makes at most 2 direction changes (turns)
     *  - May travel along the virtual edge border (one row/col outside the grid)
     *
     * States: (x, y, dirIndex, turns_used)
     * The border strip is represented as coords in range [-1, ROWS] / [-1, COLS].
     */
    private bfsPath(c1: number, r1: number, c2: number, r2: number): boolean {
        // visited[r+1][c+1][dir+1][turns] where dir -1..3, turns 0..2
        // Shift: r+1 offset for border row, c+1 for border col
        const RR = ROWS + 2;
        const CC = COLS + 2;
        // visited array: [row offset][col offset][dir+1 (0=none,1-4)][turns 0-2]
        const visited: boolean[][][][] = Array.from({ length: RR }, () =>
            Array.from({ length: CC }, () =>
                Array.from({ length: 5 }, () => [false, false, false])));

        const queue: BFSState[] = [{ x: c1, y: r1, dir: -1, turns: 0 }];
        visited[r1 + 1][c1 + 1][0][0] = true;

        while (queue.length > 0) {
            const cur = queue.shift()!;

            for (const d of DIRS) {
                const nx = cur.x + d.dx;
                const ny = cur.y + d.dy;
                const nd = dirIndex(d.dx, d.dy);
                const newTurns = (cur.dir === -1 || cur.dir === nd) ? cur.turns : cur.turns + 1;

                if (newTurns > 2) continue;

                // Check bounds including one-cell border
                if (nx < -1 || nx > COLS || ny < -1 || ny > ROWS) continue;

                // Check if destination reached
                if (nx === c2 && ny === r2) return true;

                // Cell must be empty or on the border strip
                const onBorder = (nx === -1 || nx === COLS || ny === -1 || ny === ROWS);
                if (!onBorder) {
                    if (this.grid[ny][nx] !== null) continue; // occupied
                }

                const vi = nd + 1; // 0 reserved for "no dir"
                if (visited[ny + 1][nx + 1][vi][newTurns]) continue;
                visited[ny + 1][nx + 1][vi][newTurns] = true;
                queue.push({ x: nx, y: ny, dir: nd, turns: newTurns });
            }
        }
        return false;
    }

    // ── UI helpers ────────────────────────────────────────────────────────────
    private updateLabels() {
        const multiplier = this.comboMultiplier(this.combo);
        if (this.comboLabel) {
            this.comboLabel.string = `COMBO × ${this.combo}  (×${multiplier.toFixed(1)})`;
        }
        if (this.clearedLabel) {
            this.clearedLabel.string = `Cleared: ${this.cleared}`;
        }
        if (this._stepsLabel) {
            this._stepsLabel.string = `Steps: ${this.cleared / 2 | 0}`;
        }
    }

    /** Returns score multiplier from puzzle-mechanics-spec combo.multipliers */
    private comboMultiplier(combo: number): number {
        if (combo >= 4) return 3.0;
        if (combo === 3) return 2.0;
        if (combo === 2) return 1.5;
        return 1.0;
    }

    // ── Public reset (wired to Reset button in scene) ─────────────────────────
    public onResetClick() {
        this.combo   = 0;
        this.cleared = 0;
        this.lastMatchTime = 0;
        this.initGrid();
        this.buildNodes();
        this.updateLabels();
    }
}
