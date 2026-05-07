import {
  Component,
  _decorator,
  Label,
  Button,
  Node,
  director,
  instantiate,
  Prefab,
  Color,
  UIOpacity,
  tween,
} from 'cc'
import { ProgressionManager } from '../meta/ProgressionManager'

const { ccclass, property } = _decorator

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.GLOW_API_BASE_URL) ||
  'http://localhost:3000/v1'

export interface LeaderboardEntry {
  rank: number
  display_name: string
  total_score: number
  chapter_reached: number
  player_id?: string
}

export interface MyRank {
  rank: number
  total_score: number
  chapter_reached: number
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[]
  pagination?: {
    page: number
    limit: number
    total_entries: number
    total_pages: number
  }
  my_rank?: MyRank | null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@ccclass('LeaderboardScene')
export class LeaderboardScene extends Component {
  // -------------------------------------------------------------------------
  // Inspector properties
  // -------------------------------------------------------------------------

  /** Scroll view content node – rank-item nodes are added as children here */
  @property(Node)
  listContainer: Node | null = null

  /** Label at the bottom showing the current player's own rank */
  @property(Label)
  myRankLabel: Label | null = null

  /** Prefab used for each row; if null a Label node is created procedurally */
  @property(Prefab)
  rankItemPrefab: Prefab | null = null

  /** Shown while data is loading */
  @property(Node)
  loadingNode: Node | null = null

  /** Shown when the fetch fails */
  @property(Node)
  errorNode: Node | null = null

  @property(Button)
  retryButton: Button | null = null

  @property(Button)
  backButton: Button | null = null

  // -------------------------------------------------------------------------
  // Private state
  // -------------------------------------------------------------------------

  /** Locally known player_id – stored in ProgressionManager progress or localStorage */
  private _myPlayerId: string = ''

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  onLoad(): void {
    this.retryButton?.node.on(Button.EventType.CLICK, this._onRetry, this)
    this.backButton?.node.on(Button.EventType.CLICK, this._onBack, this)
  }

  async start(): Promise<void> {
    // Retrieve local player id (best-effort; may be empty for guests)
    this._myPlayerId = this._resolveMyPlayerId()
    await this._loadLeaderboard()
  }

  onDestroy(): void {
    this.retryButton?.node.off(Button.EventType.CLICK, this._onRetry, this)
    this.backButton?.node.off(Button.EventType.CLICK, this._onBack, this)
  }

  // -------------------------------------------------------------------------
  // Data loading
  // -------------------------------------------------------------------------

  private async _loadLeaderboard(): Promise<void> {
    this._setState('loading')

    try {
      // Include player_id so backend returns my_rank object
      const params = new URLSearchParams({ limit: '50' })
      if (this._myPlayerId) {
        params.set('player_id', this._myPlayerId)
      }

      const headers: Record<string, string> = {}
      const token = this._resolveAuthToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const res = await fetch(`${API_BASE_URL}/leaderboard?${params.toString()}`, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = (await res.json()) as LeaderboardResponse
      this._renderList(data)
      this._renderMyRank(data)
      this._setState('ready')
    } catch (e) {
      console.warn('[LeaderboardScene] Failed to load leaderboard:', e)
      this._setState('error')
    }
  }

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  private _renderList(data: LeaderboardResponse): void {
    if (!this.listContainer) return

    // Clear existing items
    this.listContainer.removeAllChildren()

    const entries = data.entries ?? []
    entries.forEach((entry, i) => {
      const itemNode = this._createRankItemNode(entry)
      if (!itemNode) return

      // Stagger fade-in for a pleasant enter feel (art-tokens: ui_screen_transition)
      const opacity = itemNode.getComponent(UIOpacity) ?? itemNode.addComponent(UIOpacity)
      opacity.opacity = 0
      this.listContainer!.addChild(itemNode)

      this.scheduleOnce(() => {
        tween(opacity)
          .to(0.18, { opacity: 255 })
          .start()
      }, i * 0.03)
    })
  }

  private _createRankItemNode(entry: LeaderboardEntry): Node | null {
    let itemNode: Node

    if (this.rankItemPrefab) {
      itemNode = instantiate(this.rankItemPrefab)
    } else {
      // Fallback: build a simple text row
      itemNode = new Node(`rank_${entry.rank}`)
      const label = itemNode.addComponent(Label)
      label.string = this._formatRow(entry)
      label.fontSize = 14
      label.lineHeight = 20
    }

    // Highlight the current player's row
    const isMe = entry.player_id && entry.player_id === this._myPlayerId
    if (isMe) {
      this._highlightRow(itemNode)
    }

    // Populate named sub-labels if the prefab exposes them by child name
    this._populatePrefabFields(itemNode, entry)

    return itemNode
  }

  private _populatePrefabFields(node: Node, entry: LeaderboardEntry): void {
    const set = (childName: string, text: string) => {
      const child = node.getChildByName(childName)
      if (!child) return
      const label = child.getComponent(Label)
      if (label) label.string = text
    }

    set('RankLabel', `#${entry.rank}`)
    set('NameLabel', entry.display_name)
    set('ScoreLabel', String(entry.total_score))
    set('ChapterLabel', `Ch.${entry.chapter_reached}`)
  }

  private _formatRow(entry: LeaderboardEntry): string {
    const rank = String(entry.rank).padStart(3, ' ')
    const name = entry.display_name.substring(0, 12).padEnd(12, ' ')
    const score = String(entry.total_score).padStart(8, ' ')
    const chapter = `Ch.${entry.chapter_reached}`
    return `${rank}  ${name}  ${score}  ${chapter}`
  }

  private _highlightRow(node: Node): void {
    // Tint the row with brand_secondary yellow (rgba(244,201,93,0.25) overlay)
    // In production this would set a Sprite color or a named Color property on the prefab.
    const sprite = node.getComponent('Sprite') as { color: Color } | null
    if (sprite) {
      sprite.color = new Color(244, 201, 93, 255)
    }
    // Add a gentle scale pulse to draw attention
    tween(node)
      .to(0.4, { scale: { x: 1.02, y: 1.02, z: 1 } as { x: number; y: number; z: number } })
      .to(0.4, { scale: { x: 1.0, y: 1.0, z: 1 } as { x: number; y: number; z: number } })
      .start()
  }

  private _renderMyRank(data: LeaderboardResponse): void {
    if (!this.myRankLabel) return

    // Use server-provided my_rank object if available (backend returns { rank, total_score, chapter_reached })
    if (data.my_rank != null) {
      const score = data.my_rank.total_score ?? 0
      // Try to resolve display name from entries list
      const found = data.entries?.find((e) => e.player_id === this._myPlayerId)
      const name = found?.display_name ?? '我'
      this.myRankLabel.string = `我的排名：#${data.my_rank.rank}  ${name}  ${score}`
      return
    }

    // Try to find the player within the top-50 result set
    if (this._myPlayerId) {
      const found = data.entries?.find((e) => e.player_id === this._myPlayerId)
      if (found) {
        this.myRankLabel.string = `我的排名：#${found.rank}  ${found.display_name}  ${found.total_score}`
        return
      }
    }

    this.myRankLabel.string = '我的排名：未上榜'
  }

  // -------------------------------------------------------------------------
  // State management
  // -------------------------------------------------------------------------

  private _setState(state: 'loading' | 'ready' | 'error'): void {
    if (this.loadingNode) {
      this.loadingNode.active = state === 'loading'
    }
    if (this.errorNode) {
      this.errorNode.active = state === 'error'
    }
    if (this.listContainer) {
      this.listContainer.active = state === 'ready'
    }
  }

  // -------------------------------------------------------------------------
  // Button handlers
  // -------------------------------------------------------------------------

  private _onRetry(): void {
    this._loadLeaderboard().catch((e) =>
      console.warn('[LeaderboardScene] retry failed:', e)
    )
  }

  private _onBack(): void {
    director.loadScene('MainMenuScene')
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private _resolveMyPlayerId(): string {
    // Try localStorage first (set during authentication flow)
    try {
      return localStorage.getItem('glow_player_id') ?? ''
    } catch {
      return ''
    }
  }

  private _resolveAuthToken(): string {
    try {
      return localStorage.getItem('glow_auth_token') ?? ''
    } catch {
      return ''
    }
  }
}
