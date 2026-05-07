import React, { useCallback, useRef, useState } from 'react';
import type { Level, CellContent, PaletteItemType } from '../types/LevelSchema';
import {
  getTileColor,
  getSpecialColor,
  getObstacleColor,
} from '../data/tile-types';

interface Props {
  level: Level;
  selectedPalette: PaletteItemType;
  onPaintCell: (row: number, col: number, palette: PaletteItemType) => void;
  onClearCell: (row: number, col: number) => void;
  onClearGrid: () => void;
  onResize: (rows: number, cols: number) => void;
}

function getCellBackground(cell: CellContent): string {
  switch (cell.type) {
    case 'empty':
      return '#1e2030';
    case 'tile':
      return getTileColor(cell.tileId!);
    case 'special':
      return getSpecialColor(cell.specialId!);
    case 'obstacle':
      return getObstacleColor(cell.obstacleId!);
    default:
      return '#1e2030';
  }
}

function getCellLabel(cell: CellContent): string {
  if (cell.type === 'empty') return '';
  if (cell.type === 'tile') return cell.tileId?.replace('tile_', '') ?? '';
  if (cell.type === 'special') {
    const labels: Record<string, string> = {
      bomb: '💥',
      windmill: '🌀',
      lantern: '🏮',
      wave: '🌊',
    };
    return labels[cell.specialId ?? ''] ?? cell.specialId ?? '';
  }
  if (cell.type === 'obstacle') {
    const labels: Record<string, string> = {
      ice_block: '❄',
      weed: '🌿',
      wooden_crate: '📦',
      water_current: '💧',
    };
    return labels[cell.obstacleId ?? ''] ?? cell.obstacleId ?? '';
  }
  return '';
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

export default function GridEditor({
  level,
  selectedPalette,
  onPaintCell,
  onClearCell,
  onClearGrid,
  onResize,
}: Props) {
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
  const isPainting = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, row: number, col: number) => {
      e.preventDefault();
      isPainting.current = true;
      if (e.button === 2) {
        onClearCell(row, col);
      } else {
        onPaintCell(row, col, selectedPalette);
      }
    },
    [onClearCell, onPaintCell, selectedPalette]
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, row: number, col: number) => {
      setHoverCell({ row, col });
      if (isPainting.current && e.buttons === 1) {
        onPaintCell(row, col, selectedPalette);
      } else if (isPainting.current && e.buttons === 2) {
        onClearCell(row, col);
      }
    },
    [onClearCell, onPaintCell, selectedPalette]
  );

  const handleMouseUp = useCallback(() => {
    isPainting.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverCell(null);
    isPainting.current = false;
  }, []);

  const cellSize = Math.min(
    Math.floor(480 / Math.max(level.cols, level.rows)),
    56
  );

  return (
    <div className="grid-editor" onMouseLeave={handleMouseLeave} onMouseUp={handleMouseUp}>
      <div className="grid-editor__toolbar">
        <div className="grid-editor__size-controls">
          <label>
            列数
            <input
              type="number"
              min={6}
              max={10}
              value={level.cols}
              onChange={(e) => onResize(level.rows, Number(e.target.value))}
            />
          </label>
          <label>
            行数
            <input
              type="number"
              min={6}
              max={10}
              value={level.rows}
              onChange={(e) => onResize(Number(e.target.value), level.cols)}
            />
          </label>
          <span className="grid-editor__size-badge">
            {level.cols} × {level.rows}
          </span>
        </div>
        <div className="grid-editor__actions">
          {hoverCell && (
            <span className="grid-editor__coord-hint">
              ({hoverCell.col}, {hoverCell.row})
            </span>
          )}
          <button className="btn btn--danger" onClick={onClearGrid}>
            清空棋盘
          </button>
        </div>
      </div>

      <div
        className="grid-editor__canvas"
        onContextMenu={(e) => e.preventDefault()}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${level.cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${level.rows}, ${cellSize}px)`,
          gap: '2px',
          userSelect: 'none',
        }}
      >
        {level.grid.map((rowArr, row) =>
          rowArr.map((cell, col) => {
            const bg = getCellBackground(cell);
            const label = getCellLabel(cell);
            const isHovered = hoverCell?.row === row && hoverCell?.col === col;
            const textColor = isLightColor(bg) ? '#222' : '#eee';

            return (
              <div
                key={`${row}-${col}`}
                className={`grid-cell${isHovered ? ' grid-cell--hovered' : ''}`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: bg,
                  color: textColor,
                  border: isHovered ? '2px solid #fff' : '1px solid #2e3050',
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: cellSize > 40 ? 14 : 10,
                  fontWeight: 'bold',
                  cursor: 'crosshair',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.1s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseDown={(e) => handleMouseDown(e, row, col)}
                onMouseEnter={(e) => handleMouseEnter(e, row, col)}
              >
                {label && (
                  <span style={{ pointerEvents: 'none', lineHeight: 1 }}>
                    {label}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="grid-editor__legend">
        <span>左键：放置 &nbsp;|&nbsp; 右键：清除 &nbsp;|&nbsp; 拖动：连续绘制</span>
      </div>
    </div>
  );
}
