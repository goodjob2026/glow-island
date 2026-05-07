// Plays the 4-stage area restoration animation and particle effects for a chapter.

import {
  _decorator,
  Component,
  Animation,
  ParticleSystem2D,
  EventTarget,
  Node,
} from 'cc';
import { AudioManager } from '../audio/AudioManager';
import { SFXKey } from '../audio/AudioConfig';

const { ccclass, property } = _decorator;

/** Global event bus for restoration events. */
export const restorationEvents = new EventTarget();

/** Emitted when a chapter reaches stage 4 (full restoration). */
export const EVENT_CHAPTER_FULLY_RESTORED = 'chapterFullyRestored';

@ccclass('AreaRestorationEffect')
export class AreaRestorationEffect extends Component {
  @property({ tooltip: 'Chapter id (1-6)' })
  chapter: number = 1;

  @property({ tooltip: 'Current restoration stage (1-4)' })
  stage: 1 | 2 | 3 | 4 = 1;

  @property({ type: Animation, tooltip: 'Animation component that plays area-restore-sequence.anim' })
  anim: Animation | null = null;

  @property({ type: ParticleSystem2D, tooltip: 'vfx-area-restore.effect particle system' })
  vfxAreaRestore: ParticleSystem2D | null = null;

  // Animation clip name convention: area-restore-stage-N
  private readonly ANIM_CLIP_PREFIX = 'area-restore-stage-';
  private readonly FULL_SEQUENCE_CLIP = 'area-restore-sequence';

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Play the restoration effect for the given chapter and stage.
   * Resolves when the animation finishes.
   */
  async playStage(chapter: number, stage: 1 | 2 | 3 | 4): Promise<void> {
    this.chapter = chapter;
    this.stage = stage;

    await Promise.all([
      this._playAnimation(stage),
      this._playParticles(),
    ]);

    if (stage === 4) {
      // SFX: area restoration complete
      AudioManager.getInstance()?.playSFX(SFXKey.AREA_RESTORE);
      this._onFullyRestored(chapter);
    }
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private _playAnimation(stage: 1 | 2 | 3 | 4): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.anim) {
        resolve();
        return;
      }

      // Prefer a per-stage clip; fall back to the full sequence clip.
      const stageClipName = `${this.ANIM_CLIP_PREFIX}${stage}`;
      const clips = this.anim.clips;
      const hasStageClip = clips.some(c => c && c.name === stageClipName);
      const clipName = hasStageClip ? stageClipName : this.FULL_SEQUENCE_CLIP;

      const state = this.anim.getState(clipName);
      if (!state) {
        console.warn(`[AreaRestorationEffect] Animation clip "${clipName}" not found on chapter ${this.chapter}`);
        resolve();
        return;
      }

      const onFinish = () => {
        this.anim!.off(Animation.EventType.FINISHED, onFinish);
        resolve();
      };
      this.anim.on(Animation.EventType.FINISHED, onFinish, this);
      this.anim.play(clipName);
    });
  }

  private _playParticles(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.vfxAreaRestore) {
        resolve();
        return;
      }

      // Reset and play the particle burst
      this.vfxAreaRestore.stopSystem();
      this.vfxAreaRestore.resetSystem();
      this.vfxAreaRestore.playOnLoad = false;

      // Start emission
      if ((this.vfxAreaRestore as any).play) {
        (this.vfxAreaRestore as any).play();
      } else {
        this.vfxAreaRestore.resetSystem();
      }

      // Particle duration from art-tokens: area_restore_duration = 5.0s
      const PARTICLE_DURATION_MS = 5000;
      this.scheduleOnce(() => resolve(), PARTICLE_DURATION_MS / 1000);
    });
  }

  private _onFullyRestored(chapterId: number): void {
    restorationEvents.emit(EVENT_CHAPTER_FULLY_RESTORED, chapterId);
  }
}
