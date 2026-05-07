import { useState } from 'react';
import type { Level } from '../types/LevelSchema';
import { CHAPTER_SIZES } from '../data/tile-types';

interface Props {
  levels: Level[];
  activeLevelId: string | null;
  onSelect: (id: string) => void;
  onAdd: (chapter: number) => void;
  onDelete: (id: string) => void;
}

const CHAPTER_NAMES: Record<number, string> = {
  1: '第1章 · 海边码头',
  2: '第2章 · 中央小镇',
  3: '第3章 · 花田山坡',
  4: '第4章 · 森林露营地',
  5: '第5章 · 温泉山谷',
  6: '第6章 · 夜晚灯塔',
};

export default function LevelList({ levels, activeLevelId, onSelect, onAdd, onDelete }: Props) {
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(
    new Set([1, 2, 3, 4, 5, 6])
  );

  const toggleChapter = (chapter: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapter)) {
        next.delete(chapter);
      } else {
        next.add(chapter);
      }
      return next;
    });
  };

  return (
    <div className="level-list">
      <div className="level-list__header">
        <h2>关卡列表</h2>
        <span className="level-list__count">{levels.length} 关</span>
      </div>

      {CHAPTER_SIZES.map(({ chapter }) => {
        const chapterLevels = levels
          .filter((l) => l.chapter === chapter)
          .sort((a, b) => a.sequence - b.sequence);
        const isExpanded = expandedChapters.has(chapter);

        return (
          <div key={chapter} className="level-list__chapter">
            <button
              className="level-list__chapter-header"
              onClick={() => toggleChapter(chapter)}
            >
              <span className="chapter-arrow">{isExpanded ? '▾' : '▸'}</span>
              <span className="chapter-name">{CHAPTER_NAMES[chapter] ?? `第${chapter}章`}</span>
              <span className="chapter-count">({chapterLevels.length})</span>
            </button>

            {isExpanded && (
              <div className="level-list__chapter-levels">
                {chapterLevels.map((level) => (
                  <div
                    key={level.id}
                    className={`level-item${level.id === activeLevelId ? ' level-item--active' : ''}`}
                  >
                    <button
                      className="level-item__select"
                      onClick={() => onSelect(level.id)}
                    >
                      <span className="level-item__id">{level.id}</span>
                      <span className="level-item__name">{level.name}</span>
                      <span className="level-item__size">
                        {level.cols}×{level.rows}
                      </span>
                    </button>
                    <button
                      className="level-item__delete"
                      title="删除关卡"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`确认删除关卡 ${level.id}？`)) {
                          onDelete(level.id);
                        }
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  className="level-list__add-btn"
                  onClick={() => onAdd(chapter)}
                >
                  + 新增关卡
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
