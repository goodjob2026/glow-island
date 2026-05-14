import { _decorator, Component, sys } from 'cc';

const { ccclass } = _decorator;

const LS_CAPSULES_KEY = 'glow_memory_capsules';

export interface MemoryCapsule {
  id: string;
  chapter: number;
  title_jp: string;
  title_zh: string;
  body_jp: string;
  body_zh: string;
  image_path: string;
  unlocked_at: string | null;
}

@ccclass('MemoryCapsuleManager')
export class MemoryCapsuleManager extends Component {
  private static _instance: MemoryCapsuleManager | null = null;
  private _unlockedIds: Set<string> = new Set();

  static getInstance(): MemoryCapsuleManager { return MemoryCapsuleManager._instance!; }

  onLoad(): void {
    MemoryCapsuleManager._instance = this;
    this._load();
  }

  private _load(): void {
    try {
      const raw = sys.localStorage.getItem(LS_CAPSULES_KEY) ?? '[]';
      this._unlockedIds = new Set(JSON.parse(raw) as string[]);
    } catch { this._unlockedIds = new Set(); }
  }

  unlockForChapter(chapter: number): MemoryCapsule | null {
    const capsule = CAPSULES.find(c => c.chapter === chapter);
    if (!capsule || this._unlockedIds.has(capsule.id)) return null;
    this._unlockedIds.add(capsule.id);
    sys.localStorage.setItem(LS_CAPSULES_KEY, JSON.stringify([...this._unlockedIds]));
    return { ...capsule, unlocked_at: new Date().toISOString() };
  }

  isUnlocked(capsuleId: string): boolean {
    return this._unlockedIds.has(capsuleId);
  }

  getAllCapsules(): MemoryCapsule[] {
    return CAPSULES.map(c => ({
      ...c,
      unlocked_at: this._unlockedIds.has(c.id) ? 'unlocked' : null,
    }));
  }

  getUnlockedCapsules(): MemoryCapsule[] {
    return this.getAllCapsules().filter(c => c.unlocked_at !== null);
  }
}

const CAPSULES: MemoryCapsule[] = [
  {
    id: 'mem_ch1', chapter: 1,
    title_jp: '磯の記憶', title_zh: '渔港的记忆',
    body_jp: '健三さんの古い小舟。傷んだ木の板が、長い年月を語る。',
    body_zh: '健三老伯的旧渔船。斑驳的木板讲述着漫长的岁月。',
    image_path: 'sprites/memories/mem_ch1', unlocked_at: null,
  },
  {
    id: 'mem_ch2', chapter: 2,
    title_jp: '梅子の窯', title_zh: '梅子的窑火',
    body_jp: '工房に積み上げられた失敗作。梅子さんは「これが財産」と笑う。',
    body_zh: '工坊里堆满了失败品。梅子说"这些才是财富"，笑着。',
    image_path: 'sprites/memories/mem_ch2', unlocked_at: null,
  },
  {
    id: 'mem_ch3', chapter: 3,
    title_jp: '夏帆の海図', title_zh: '夏帆的海图',
    body_jp: '研究室の壁一面に貼られた海図。夢の続きがそこにある。',
    body_zh: '研究室墙上贴满了海图。梦想的延续就在那里。',
    image_path: 'sprites/memories/mem_ch3', unlocked_at: null,
  },
  {
    id: 'mem_ch4', chapter: 4,
    title_jp: '父への手紙', title_zh: '写给父亲的信',
    body_jp: '冬子さんが書きかけた手紙。「お父さん、島が戻ってきたよ」',
    body_zh: '冬子写了一半的信。"爸爸，小岛回来了。"',
    image_path: 'sprites/memories/mem_ch4', unlocked_at: null,
  },
  {
    id: 'mem_ch5', chapter: 5,
    title_jp: '温泉の夜', title_zh: '温泉之夜',
    body_jp: 'ひなたと並んで見た星空。言葉はいらなかった。',
    body_zh: '和阿晴并排看了夜空。什么都不需要说。',
    image_path: 'sprites/memories/mem_ch5', unlocked_at: null,
  },
  {
    id: 'mem_ch6', chapter: 6,
    title_jp: '灯台の光', title_zh: '灯塔的光',
    body_jp: '初めて灯台に灯がともった夜、島全体が息をのんだ。',
    body_zh: '灯塔第一次亮起的夜晚，整座岛屿都屏住了呼吸。',
    image_path: 'sprites/memories/mem_ch6', unlocked_at: null,
  },
];
