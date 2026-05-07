import { useState, useCallback, useEffect } from 'react';
import type {
  Level,
  CellContent,
  LevelObjective,
  LevelReward,
  BoardEventConfig,
  PaletteItemType,
} from '../types/LevelSchema';
import { CHAPTER_SIZES } from '../data/tile-types';

function makeEmptyGrid(rows: number, cols: number): CellContent[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: 'empty' as const }))
  );
}

function makeNewLevel(id: string, chapter: number, sequence: number): Level {
  const size = CHAPTER_SIZES.find((s) => s.chapter === chapter) ?? {
    cols: 8,
    rows: 8,
  };
  return {
    id,
    chapter,
    sequence,
    name: `Level ${sequence}`,
    cols: size.cols,
    rows: size.rows,
    maxMoves: 30,
    objectives: [{ type: 'tile_target', requiredCount: 20 }],
    reward: { coins: 10 },
    emotionalNote: '',
    boardEvents: [{ id: 'tile_gravity' }],
    grid: makeEmptyGrid(size.rows, size.cols),
  };
}

function paletteToCell(paletteId: PaletteItemType): CellContent {
  if (paletteId === 'empty') return { type: 'empty' };
  if (paletteId.startsWith('tile_')) {
    return { type: 'tile', tileId: paletteId as CellContent['tileId'] };
  }
  if (['bomb', 'windmill', 'lantern', 'wave'].includes(paletteId)) {
    return { type: 'special', specialId: paletteId as CellContent['specialId'] };
  }
  return { type: 'obstacle', obstacleId: paletteId as CellContent['obstacleId'] };
}

const STORAGE_KEY = 'glow-island-level-editor';

interface EditorState {
  levels: Level[];
  activeLevelId: string | null;
  selectedPalette: PaletteItemType;
}

function loadFromStorage(): EditorState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EditorState;
  } catch {
    return null;
  }
}

function saveToStorage(state: EditorState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function useGridEditor() {
  const [levels, setLevels] = useState<Level[]>(() => {
    const saved = loadFromStorage();
    if (saved?.levels?.length) return saved.levels;
    return [makeNewLevel('1-1', 1, 1)];
  });

  const [activeLevelId, setActiveLevelId] = useState<string | null>(() => {
    const saved = loadFromStorage();
    return saved?.activeLevelId ?? levels[0]?.id ?? null;
  });

  const [selectedPalette, setSelectedPalette] = useState<PaletteItemType>('tile_01');

  // Persist on change
  useEffect(() => {
    saveToStorage({ levels, activeLevelId, selectedPalette });
  }, [levels, activeLevelId, selectedPalette]);

  const activeLevel = levels.find((l) => l.id === activeLevelId) ?? null;

  // ----- Level CRUD -----

  const addLevel = useCallback(
    (chapter: number) => {
      const chapterLevels = levels.filter((l) => l.chapter === chapter);
      const sequence = chapterLevels.length + 1;
      const id = `${chapter}-${sequence}`;
      const newLevel = makeNewLevel(id, chapter, sequence);
      setLevels((prev) => [...prev, newLevel]);
      setActiveLevelId(id);
    },
    [levels]
  );

  const deleteLevel = useCallback(
    (id: string) => {
      setLevels((prev) => {
        const next = prev.filter((l) => l.id !== id);
        if (activeLevelId === id) {
          setActiveLevelId(next[0]?.id ?? null);
        }
        return next;
      });
    },
    [activeLevelId]
  );

  const selectLevel = useCallback((id: string) => {
    setActiveLevelId(id);
  }, []);

  // ----- Level property mutations -----

  const updateLevel = useCallback(
    (id: string, patch: Partial<Omit<Level, 'grid'>>) => {
      setLevels((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
      );
    },
    []
  );

  const resizeGrid = useCallback(
    (id: string, newRows: number, newCols: number) => {
      setLevels((prev) =>
        prev.map((l) => {
          if (l.id !== id) return l;
          const newGrid: CellContent[][] = Array.from({ length: newRows }, (_, r) =>
            Array.from({ length: newCols }, (_, c) => {
              if (r < l.rows && c < l.cols) return l.grid[r][c];
              return { type: 'empty' as const };
            })
          );
          return { ...l, rows: newRows, cols: newCols, grid: newGrid };
        })
      );
    },
    []
  );

  // ----- Grid painting -----

  const paintCell = useCallback(
    (row: number, col: number, paletteId: PaletteItemType) => {
      if (!activeLevelId) return;
      setLevels((prev) =>
        prev.map((l) => {
          if (l.id !== activeLevelId) return l;
          const newGrid = l.grid.map((r, ri) =>
            r.map((cell, ci) => {
              if (ri === row && ci === col) return paletteToCell(paletteId);
              return cell;
            })
          );
          return { ...l, grid: newGrid };
        })
      );
    },
    [activeLevelId]
  );

  const clearCell = useCallback(
    (row: number, col: number) => {
      paintCell(row, col, 'empty');
    },
    [paintCell]
  );

  const clearGrid = useCallback(() => {
    if (!activeLevelId) return;
    setLevels((prev) =>
      prev.map((l) => {
        if (l.id !== activeLevelId) return l;
        return { ...l, grid: makeEmptyGrid(l.rows, l.cols) };
      })
    );
  }, [activeLevelId]);

  // ----- Objectives -----

  const updateObjectives = useCallback(
    (id: string, objectives: LevelObjective[]) => {
      setLevels((prev) =>
        prev.map((l) => (l.id === id ? { ...l, objectives } : l))
      );
    },
    []
  );

  // ----- Rewards -----

  const updateReward = useCallback((id: string, reward: LevelReward) => {
    setLevels((prev) =>
      prev.map((l) => (l.id === id ? { ...l, reward } : l))
    );
  }, []);

  // ----- Board events -----

  const updateBoardEvents = useCallback(
    (id: string, events: BoardEventConfig[]) => {
      setLevels((prev) =>
        prev.map((l) => (l.id === id ? { ...l, boardEvents: events } : l))
      );
    },
    []
  );

  // ----- Import -----

  const importLevel = useCallback((level: Level) => {
    setLevels((prev) => {
      const exists = prev.find((l) => l.id === level.id);
      if (exists) {
        return prev.map((l) => (l.id === level.id ? level : l));
      }
      return [...prev, level];
    });
    setActiveLevelId(level.id);
  }, []);

  const importDesign = useCallback((newLevels: Level[]) => {
    setLevels(newLevels);
    setActiveLevelId(newLevels[0]?.id ?? null);
  }, []);

  return {
    levels,
    activeLevelId,
    activeLevel,
    selectedPalette,
    setSelectedPalette,
    addLevel,
    deleteLevel,
    selectLevel,
    updateLevel,
    resizeGrid,
    paintCell,
    clearCell,
    clearGrid,
    updateObjectives,
    updateReward,
    updateBoardEvents,
    importLevel,
    importDesign,
  };
}
