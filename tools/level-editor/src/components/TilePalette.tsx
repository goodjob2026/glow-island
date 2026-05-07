import type { PaletteItem, PaletteItemType } from '../types/LevelSchema';
import { PALETTE_ITEMS } from '../data/tile-types';

interface Props {
  selected: PaletteItemType;
  onSelect: (id: PaletteItemType) => void;
}

const CATEGORIES: { key: PaletteItem['category']; label: string }[] = [
  { key: 'empty',    label: '清空' },
  { key: 'tile',     label: '图块 (Tiles)' },
  { key: 'special',  label: '特殊块 (Special)' },
  { key: 'obstacle', label: '障碍 (Obstacles)' },
];

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

export default function TilePalette({ selected, onSelect }: Props) {
  return (
    <div className="tile-palette">
      {CATEGORIES.map(({ key, label }) => {
        const items = PALETTE_ITEMS.filter((p) => p.category === key);
        if (!items.length) return null;
        return (
          <div key={key} className="tile-palette__group">
            <div className="tile-palette__group-label">{label}</div>
            <div className="tile-palette__items">
              {items.map((item) => {
                const isSelected = item.id === selected;
                const textColor = isLightColor(item.color) ? '#222' : '#eee';
                return (
                  <button
                    key={item.id}
                    className={`palette-item${isSelected ? ' palette-item--selected' : ''}`}
                    title={`${item.label} (${item.id})`}
                    style={{
                      background: item.color,
                      color: textColor,
                      border: isSelected ? '2px solid #fff' : '2px solid transparent',
                      outline: isSelected ? '2px solid #6c6fff' : 'none',
                    }}
                    onClick={() => onSelect(item.id)}
                  >
                    <span className="palette-item__label">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
