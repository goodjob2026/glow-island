import { Component, _decorator, AudioSource, AudioClip, director, resources, sys, tween, Node } from 'cc'
import {
  BGMKey,
  SFXKey,
  BGM_VOLUME_KEY,
  SFX_VOLUME_KEY,
  DEFAULT_BGM_VOLUME,
  DEFAULT_SFX_VOLUME
} from './AudioConfig'

const { ccclass, property } = _decorator

@ccclass('AudioManager')
export class AudioManager extends Component {
  private static _instance: AudioManager | null = null

  @property(AudioSource)
  private _bgmSource: AudioSource | null = null

  @property(AudioSource)
  private _sfxSource: AudioSource | null = null

  private _bgmVolume: number = DEFAULT_BGM_VOLUME
  private _sfxVolume: number = DEFAULT_SFX_VOLUME
  private _currentBGMKey: BGMKey | null = null

  static getInstance(): AudioManager {
    return AudioManager._instance!
  }

  onLoad(): void {
    if (AudioManager._instance && AudioManager._instance !== this) {
      this.node.destroy()
      return
    }
    AudioManager._instance = this
    director.addPersistRootNode(this.node)

    // Ensure AudioSource components exist
    if (!this._bgmSource) {
      this._bgmSource = this.node.addComponent(AudioSource)
      this._bgmSource.loop = true
    }
    if (!this._sfxSource) {
      this._sfxSource = this.node.addComponent(AudioSource)
      this._sfxSource.loop = false
    }

    // Restore persisted volumes
    const storedBGM = sys.localStorage.getItem(BGM_VOLUME_KEY)
    this._bgmVolume = storedBGM !== null ? parseFloat(storedBGM) : DEFAULT_BGM_VOLUME

    const storedSFX = sys.localStorage.getItem(SFX_VOLUME_KEY)
    this._sfxVolume = storedSFX !== null ? parseFloat(storedSFX) : DEFAULT_SFX_VOLUME

    this._bgmSource.volume = this._bgmVolume
    this._sfxSource.volume = this._sfxVolume
  }

  onDestroy(): void {
    if (AudioManager._instance === this) {
      AudioManager._instance = null
    }
  }

  // -------------------------------------------------------------------------
  // BGM
  // -------------------------------------------------------------------------

  playBGM(key: BGMKey, fadeDuration: number = 1.0): void {
    if (this._currentBGMKey === key) {
      return
    }

    const path = `audio/bgm/${key}`
    resources.load(path, AudioClip, (err, clip) => {
      if (err) {
        console.warn(`[AudioManager] BGM not found: ${path}`, err)
        return
      }

      const src = this._bgmSource!

      const startNewBGM = () => {
        src.clip = clip
        src.volume = 0
        src.play()
        this._currentBGMKey = key

        tween(src)
          .to(fadeDuration, { volume: this._bgmVolume })
          .start()
      }

      if (src.playing) {
        // Fade out current BGM, then start new one
        tween(src)
          .to(fadeDuration * 0.5, { volume: 0 })
          .call(() => {
            src.stop()
            startNewBGM()
          })
          .start()
      } else {
        startNewBGM()
      }
    })
  }

  stopBGM(fadeDuration: number = 0.5): void {
    const src = this._bgmSource!
    if (!src.playing) {
      return
    }

    tween(src)
      .to(fadeDuration, { volume: 0 })
      .call(() => {
        src.stop()
        this._currentBGMKey = null
      })
      .start()
  }

  // -------------------------------------------------------------------------
  // SFX
  // -------------------------------------------------------------------------

  playSFX(key: SFXKey): void {
    const path = `audio/sfx/${key}`
    resources.load(path, AudioClip, (err, clip) => {
      if (err) {
        console.warn(`[AudioManager] SFX not found: ${path}`, err)
        return
      }

      const src = this._sfxSource!
      src.volume = this._sfxVolume
      src.playOneShot(clip, this._sfxVolume)
    })
  }

  // -------------------------------------------------------------------------
  // Volume control
  // -------------------------------------------------------------------------

  setBGMVolume(v: number): void {
    this._bgmVolume = Math.max(0, Math.min(1, v))
    sys.localStorage.setItem(BGM_VOLUME_KEY, String(this._bgmVolume))

    if (this._bgmSource && this._bgmSource.playing) {
      this._bgmSource.volume = this._bgmVolume
    }
  }

  setSFXVolume(v: number): void {
    this._sfxVolume = Math.max(0, Math.min(1, v))
    sys.localStorage.setItem(SFX_VOLUME_KEY, String(this._sfxVolume))

    if (this._sfxSource) {
      this._sfxSource.volume = this._sfxVolume
    }
  }

  getBGMVolume(): number {
    return this._bgmVolume
  }

  getSFXVolume(): number {
    return this._sfxVolume
  }

  // -------------------------------------------------------------------------
  // Chapter BGM management
  // -------------------------------------------------------------------------

  playChapterBGM(chapterId: number): void {
    const chapterBGMMap: Record<number, BGMKey> = {
      1: BGMKey.CHAPTER_1,
      2: BGMKey.CHAPTER_2,
      3: BGMKey.CHAPTER_3,
      4: BGMKey.CHAPTER_4,
      5: BGMKey.CHAPTER_5,
      6: BGMKey.CHAPTER_6
    }

    const key = chapterBGMMap[chapterId]
    if (!key) {
      console.warn(`[AudioManager] No BGM mapped for chapter: ${chapterId}`)
      return
    }

    this.playBGM(key)
  }
}
