/**
 * PrototypeBoard.ts
 * Glow Island – Connect-the-tiles (连连看) core prototype
 * 8×8 grid, 4 tile types, BFS path-finding with ≤2 turns
 * No art assets – pure colour blocks for gameplay feel validation
 */

import {
    _decorator, Component, Node, Label, Color,
    Sprite, UITransform, UIOpacity, Graphics,
    tween, Vec3, easing
} from 'cc';

const { ccclass, property } = _decorator;

// ── Tile definitions (Animal Crossing warm healing palette) ──────────────────
const TILE_COLORS: Record<number, Color> = {
    0: new Color(255, 182, 108, 255),  // coral orange
    1: new Color( 94, 188, 221, 255),  // sea blue
    2: new Color(140, 210, 124, 255),  // leaf green
    3: new Color(243, 227, 179, 255),  // sand beige
};
const TILE_TYPE_COUNT = 4;

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

    /** Timestamp of last successful match (ms) */
    private lastMatchTime = 0;
    /** Combo window in ms, from puzzle-mechanics-spec combo.window_ms */
    private readonly COMBO_WINDOW_MS = 2000;

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    start() {
        this.initGrid();
        this.buildNodes();
        this.updateLabels();
    }

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
        // Clear previous children (for reset)
        this.node.destroyAllChildren();

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
                this.node.addChild(tile);
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

        // Rounded tile base
        const fillColor = TILE_COLORS[type];
        g.fillColor = fillColor;
        g.strokeColor = new Color(
            Math.floor(fillColor.r * 0.75),
            Math.floor(fillColor.g * 0.75),
            Math.floor(fillColor.b * 0.75),
            180
        );
        g.lineWidth = 1.5;
        roundRect(g, -CELL_SIZE / 2, -CELL_SIZE / 2, CELL_SIZE, CELL_SIZE, CELL_SIZE * 0.2);
        g.fill();
        g.stroke();

        // Inner glow highlight (top-left shimmer)
        g.fillColor = new Color(255, 255, 255, 80);
        g.circle(-CELL_SIZE * 0.18, -CELL_SIZE * 0.18, CELL_SIZE * 0.15);
        g.fill();

        const op = tile.addComponent(UIOpacity);
        op.opacity = 255;

        const px = startX + c * (CELL_SIZE + CELL_GAP);
        const py = startY - r * (CELL_SIZE + CELL_GAP);
        tile.setPosition(new Vec3(px, py, 0));

        // Store grid coords as custom data
        (tile as any)._gridC = c;
        (tile as any)._gridR = r;

        tile.on(Node.EventType.TOUCH_END, () => this.onTileTap(c, r), this);
        return tile;
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
                    this.node.addChild(tile);
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
