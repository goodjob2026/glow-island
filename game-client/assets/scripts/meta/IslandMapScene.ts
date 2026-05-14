// IslandMapScene: orchestrates the island overview, chapter states, and scene navigation.

import {
  _decorator,
  Component,
  Node,
  director,
  Label,
  ParticleSystem2D,
} from 'cc';
import { ChapterNode, ChapterState } from './ChapterNode';
import { ProgressionManager } from './ProgressionManager';
import { AreaRestorationEffect, restorationEvents, EVENT_CHAPTER_FULLY_RESTORED } from './AreaRestorationEffect';
import { AudioManager } from '../audio/AudioManager';
import { SFXKey } from '../audio/AudioConfig';
import { MemoryCapsuleManager } from './MemoryCapsuleManager';
import { NarrativeManager } from './NarrativeManager';
import { NPCDialog } from '../ui/NPCDialog';

const { ccclass, property } = _decorator;

// -----------------------------------------------------------------------
// Chapter color data sourced from art-tokens.json → colors.chapters[]
// -----------------------------------------------------------------------
interface ChapterColorDef {
  id: number;
  primary: string;
  secondary: string;
  /** Chapter unlock threshold: completed levels required across the game */
  unlockLevel: number;
  /** Materials needed to repair (display names from chapter-emotional-arcs.json) */
  materialsNeeded: string[];
}

const CHAPTER_DEFS: ChapterColorDef[] = [
  {
    id: 1,
    primary: '#87CEEB',
    secondary: '#F5DEB3',
    unlockLevel: 1,
    materialsNeeded: ['浮木', '绳索', '铁钉', '桐油'],
  },
  {
    id: 2,
    primary: '#F4C95D',
    secondary: '#C97D4E',
    unlockLevel: 15,
    materialsNeeded: ['石块', '木料', '彩釉砖', '灯芯草'],
  },
  {
    id: 3,
    primary: '#C9A8D4',
    secondary: '#7DBD7A',
    unlockLevel: 30,
    materialsNeeded: ['花种', '腐殖土', '石阶砖', '浇水壶'],
  },
  {
    id: 4,
    primary: '#6B9E5E',
    secondary: '#8B6241',
    unlockLevel: 45,
    materialsNeeded: ['帆布', '原木', '火石', '苔藓清除剂'],
  },
  {
    id: 5,
    primary: '#B8D4E0',
    secondary: '#A0A8B0',
    unlockLevel: 60,
    materialsNeeded: ['导水管', '防滑石板', '浴池填缝料', '香草束'],
  },
  {
    id: 6,
    primary: '#2D4A7A',
    secondary: '#F5C842',
    unlockLevel: 80,
    materialsNeeded: ['灯芯', '灯油', '玻璃碎片', '铁锻件', '石灰涂料'],
  },
];

@ccclass('IslandMapScene')
export class IslandMapScene extends Component {
  // -----------------------------------------------------------------------
  // Inspector-wired nodes
  // -----------------------------------------------------------------------

  @property({ type: [ChapterNode], tooltip: '6 ChapterNode components, order must match chapter id 1-6' })
  chapterNodes: ChapterNode[] = [];

  @property({ type: Node, tooltip: 'Prompt node shown when a locked chapter is tapped' })
  lockPromptNode: Node | null = null;

  @property({ type: Label, tooltip: 'Label inside lockPromptNode that shows the materials hint' })
  lockPromptLabel: Label | null = null;

  @property({ type: ParticleSystem2D, tooltip: 'vfx-lighthouse-final full-screen particle effect for chapter 6 complete' })
  vfxLighthouseFinal: ParticleSystem2D | null = null;

  @property({ type: AreaRestorationEffect, tooltip: 'Shared AreaRestorationEffect component' })
  areaRestorationEffect: AreaRestorationEffect | null = null;

  @property({ type: NPCDialog, tooltip: 'NPCDialog component for narrative lines on area restore' })
  npcDialog: NPCDialog | null = null;

  // -----------------------------------------------------------------------
  // Cocos lifecycle
  // -----------------------------------------------------------------------

  onLoad(): void {
    restorationEvents.on(EVENT_CHAPTER_FULLY_RESTORED, this._onChapterFullyRestored, this);

    for (const chapterNode of this.chapterNodes) {
      chapterNode.node.on('chapter-tapped', this._onChapterTapped, this);
    }

    // Wire NarrativeManager: listen for narrativeTrigger emitted by AreaRestorationEffect
    if (this.areaRestorationEffect) {
      this.areaRestorationEffect.node.on(
        'narrativeTrigger',
        (data: { chapter: number; trigger: 'area_restore' | 'player_tap' | 'chapter_enter' }) => {
          const narrative = NarrativeManager.getInstance();
          if (!narrative) return;

          // Show the first NPC line for this trigger
          const npcLines = narrative.getNPCLines(data.chapter, data.trigger);
          if (npcLines.length > 0 && npcLines[0].lines.length > 0) {
            this.npcDialog?.showLine(npcLines[0].lines[0].text_zh);
          }

          // Unlock area_restore diary fragments for this chapter
          narrative.getChapterFragments(data.chapter).forEach(f => {
            if (f.unlock_condition === 'area_restore') {
              narrative.unlockFragment(f.id);
            }
          });
        },
        this
      );
    }
  }

  async start(): Promise<void> {
    const mgr = ProgressionManager.getInstance();
    await mgr.loadFromCloud();
    this._refreshAllChapterStates();
  }

  onDestroy(): void {
    restorationEvents.off(EVENT_CHAPTER_FULLY_RESTORED, this._onChapterFullyRestored, this);
    for (const chapterNode of this.chapterNodes) {
      chapterNode.node.off('chapter-tapped', this._onChapterTapped, this);
    }
    this.areaRestorationEffect?.node.off('narrativeTrigger', undefined, this);
  }

  // -----------------------------------------------------------------------
  // State synchronisation
  // -----------------------------------------------------------------------

  private _refreshAllChapterStates(): void {
    const progress = ProgressionManager.getInstance().getCurrentProgress();

    for (let i = 0; i < this.chapterNodes.length; i++) {
      const chapterNode = this.chapterNodes[i];
      const def = CHAPTER_DEFS[i];
      if (!def) continue;

      // Apply chapter colors from art-tokens
      chapterNode.chapterColors = { primary: def.primary, secondary: def.secondary };

      const cp = progress.chapterProgress[def.id];
      const restorationStage = cp?.restorationStage ?? 0;
      const completedLevels = cp?.completedLevels ?? 0;

      // Determine total completed levels across all chapters to judge unlock
      const totalCompleted = this._totalCompletedLevels(progress.chapterProgress);

      if (totalCompleted < def.unlockLevel) {
        const remaining = def.unlockLevel - totalCompleted;
        chapterNode.setState(ChapterState.LOCKED);
        chapterNode.setLockHint(`还需完成 ${remaining} 关卡解锁`);
      } else if (restorationStage === 4) {
        chapterNode.setState(ChapterState.COMPLETED, 4);
        // Play area restoration effect for fully-restored chapters
        if (this.areaRestorationEffect) {
          this.areaRestorationEffect.playStage(def.id, 4).catch(() => {});
        }
      } else if (restorationStage > 0) {
        chapterNode.setState(ChapterState.IN_PROGRESS, restorationStage);
      } else {
        chapterNode.setState(ChapterState.AVAILABLE);
      }
    }
  }

  private _totalCompletedLevels(chapterProgress: Record<number, { completedLevels: number }>): number {
    return Object.values(chapterProgress).reduce((sum, cp) => sum + (cp.completedLevels ?? 0), 0);
  }

  // -----------------------------------------------------------------------
  // Event handlers
  // -----------------------------------------------------------------------

  private _onChapterTapped(event: { chapterId: number; state: ChapterState }): void {
    const { chapterId, state } = event;

    if (state === ChapterState.LOCKED) {
      this._showLockPrompt(chapterId);
      return;
    }

    // Navigate to the level select scene for this chapter
    director.loadScene(`LevelSelect_Chapter${chapterId}`);
  }

  private _showLockPrompt(chapterId: number): void {
    const def = CHAPTER_DEFS.find(d => d.id === chapterId);
    if (!def) return;

    const materialsText = def.materialsNeeded.join('、');
    const message = `需要收集材料：${materialsText} 才能解锁此区域`;

    if (this.lockPromptLabel) {
      this.lockPromptLabel.string = message;
    }
    if (this.lockPromptNode) {
      this.lockPromptNode.active = true;
    }
  }

  private _onChapterFullyRestored(chapterId: number): void {
    // Refresh visuals
    this._refreshAllChapterStates();

    const capsule = MemoryCapsuleManager.getInstance()?.unlockForChapter(chapterId);
    if (capsule) {
      this.node.emit('memoryCapsuleUnlocked', capsule);
    }

    if (chapterId === 6) {
      this._triggerLighthouseFinalEffect();
    }
  }

  private _triggerLighthouseFinalEffect(): void {
    if (!this.vfxLighthouseFinal) {
      console.warn('[IslandMapScene] vfxLighthouseFinal not assigned; skipping lighthouse final VFX');
      return;
    }
    this.vfxLighthouseFinal.node.active = true;
    this.vfxLighthouseFinal.resetSystem();
    // SFX: lighthouse final activation
    AudioManager.getInstance()?.playSFX(SFXKey.LIGHTHOUSE_ON);
  }
}
