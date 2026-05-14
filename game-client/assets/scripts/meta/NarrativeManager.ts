import { _decorator, Component, sys } from 'cc';

const { ccclass } = _decorator;

export interface DiaryFragment {
  id: string;
  chapter: number;
  order: number;
  author: 'wataru';
  text_jp: string;
  text_zh: string;
  unlock_condition: 'area_restore' | 'chapter_complete';
}

export interface NPCLine {
  npc_id: string;
  chapter: number;
  trigger: 'area_restore' | 'player_tap' | 'chapter_enter';
  lines: Array<{ text_zh: string; text_en: string }>;
}

const LS_UNLOCKED_FRAGMENTS_KEY = 'glow_diary_fragments';

@ccclass('NarrativeManager')
export class NarrativeManager extends Component {
  private static _instance: NarrativeManager | null = null;
  private _unlockedFragments: Set<string> = new Set();

  static getInstance(): NarrativeManager { return NarrativeManager._instance!; }

  onLoad(): void {
    NarrativeManager._instance = this;
    this._loadUnlocked();
  }

  private _loadUnlocked(): void {
    try {
      const raw = sys.localStorage.getItem(LS_UNLOCKED_FRAGMENTS_KEY) ?? '[]';
      this._unlockedFragments = new Set(JSON.parse(raw) as string[]);
    } catch { this._unlockedFragments = new Set(); }
  }

  unlockFragment(fragmentId: string): boolean {
    if (this._unlockedFragments.has(fragmentId)) return false;
    this._unlockedFragments.add(fragmentId);
    sys.localStorage.setItem(
      LS_UNLOCKED_FRAGMENTS_KEY,
      JSON.stringify([...this._unlockedFragments])
    );
    return true;
  }

  isFragmentUnlocked(fragmentId: string): boolean {
    return this._unlockedFragments.has(fragmentId);
  }

  getChapterFragments(chapter: number): DiaryFragment[] {
    return DIARY_FRAGMENTS.filter(f => f.chapter === chapter)
      .sort((a, b) => a.order - b.order);
  }

  getNPCLines(chapter: number, trigger: NPCLine['trigger']): NPCLine[] {
    return NPC_LINES.filter(l => l.chapter === chapter && l.trigger === trigger);
  }
}

const DIARY_FRAGMENTS: DiaryFragment[] = [
  { id: 'ch1_f1', chapter: 1, order: 1, author: 'wataru',
    text_jp: '今日、一人の若者が島に来た。東京から逃げてきた目をしている。',
    text_zh: '今天，一个年轻人来到了岛上。他有一双逃离东京的眼神。',
    unlock_condition: 'area_restore' },
  { id: 'ch1_f2', chapter: 1, order: 2, author: 'wataru',
    text_jp: '健三は「あいつは残る」と言った。老人はいつも正しい。',
    text_zh: '健三说"那小子会留下来"。老人总是对的。',
    unlock_condition: 'area_restore' },
  { id: 'ch2_f1', chapter: 2, order: 1, author: 'wataru',
    text_jp: '梅子の工房に明かりが戻ってきた。島が息をしている。',
    text_zh: '梅子的工坊又亮起了灯。小岛在呼吸。',
    unlock_condition: 'area_restore' },
  { id: 'ch2_f2', chapter: 2, order: 2, author: 'wataru',
    text_jp: '陶器の音が遠くまで聞こえる。島の音が戻ってきた。',
    text_zh: '陶器的声音传得很远。小岛的声音回来了。',
    unlock_condition: 'area_restore' },
  { id: 'ch3_f1', chapter: 3, order: 1, author: 'wataru',
    text_jp: '夏帆の研究室に光が差し込んだ。海が呼んでいる。',
    text_zh: '阳光照进了夏帆的研究室。大海在呼唤。',
    unlock_condition: 'area_restore' },
  { id: 'ch3_f2', chapter: 3, order: 2, author: 'wataru',
    text_jp: '若い研究者の目に島の未来が映っている。',
    text_zh: '年轻研究者的眼中映出了小岛的未来。',
    unlock_condition: 'area_restore' },
  { id: 'ch4_f1', chapter: 4, order: 1, author: 'wataru',
    text_jp: '冬子が父の形見を抱きしめていた。島が癒えていく。',
    text_zh: '冬子抱着父亲的遗物。小岛在愈合。',
    unlock_condition: 'area_restore' },
  { id: 'ch4_f2', chapter: 4, order: 2, author: 'wataru',
    text_jp: '森の声が戻ってきた。鳥たちが歌い始めた。',
    text_zh: '森林的声音回来了。鸟儿开始歌唱。',
    unlock_condition: 'area_restore' },
  { id: 'ch5_f1', chapter: 5, order: 1, author: 'wataru',
    text_jp: 'ひなたと温泉に行った。島の温もりが戻った。',
    text_zh: '和阿晴去了温泉。小岛的温度回来了。',
    unlock_condition: 'area_restore' },
  { id: 'ch5_f2', chapter: 5, order: 2, author: 'wataru',
    text_jp: 'あの子は島の未来だ。笑顔が眩しい。',
    text_zh: '那孩子是小岛的未来。笑容灿烂。',
    unlock_condition: 'area_restore' },
  { id: 'ch6_f1', chapter: 6, order: 1, author: 'wataru',
    text_jp: '灯台の光が戻る日、私はもういないだろう。でも光は残る。',
    text_zh: '灯塔重燃的那天，我大概已不在了。但光会留下。',
    unlock_condition: 'chapter_complete' },
];

const NPC_LINES: NPCLine[] = [
  { npc_id: 'isobe_kenzo', chapter: 1, trigger: 'area_restore',
    lines: [
      { text_zh: '这地方... 活回来了。像当年渉刚来时一样。', text_en: 'This place... it\'s alive again. Like when Wataru first arrived.' },
    ]},
  { npc_id: 'kirishima_umeko', chapter: 2, trigger: 'area_restore',
    lines: [
      { text_zh: '（摸了摸刚出窑的陶器）今天的土，烧得很好。', text_en: '(touches fresh pottery) Today\'s clay fired well.' },
    ]},
  { npc_id: 'umino_kaho', chapter: 3, trigger: 'area_restore',
    lines: [
      { text_zh: '（翻开海图）新的数据又可以记录了。', text_en: '(opens chart) New data can be recorded again.' },
    ]},
  { npc_id: 'maruyama_fuyuko', chapter: 4, trigger: 'area_restore',
    lines: [
      { text_zh: '父亲会高兴的。这里和以前一样了。', text_en: 'Father would be happy. It\'s the same as before.' },
    ]},
  { npc_id: 'maruyama_hinata', chapter: 5, trigger: 'area_restore',
    lines: [
      { text_zh: '（轻轻笑了）温泉... 真的又暖了呢。', text_en: '(smiles softly) The hot spring... it\'s warm again.' },
    ]},
  { npc_id: 'maruyama_hinata', chapter: 6, trigger: 'area_restore',
    lines: [
      { text_zh: '（看着灯塔方向）爷爷说过，灯塔亮着，大家都会回来。', text_en: '(looks toward lighthouse) Grandpa said — when the lighthouse shines, everyone comes home.' },
    ]},
];
