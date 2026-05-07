import { useState } from 'react';
import { useGridEditor } from './hooks/useGridEditor';
import LevelList from './components/LevelList';
import GridEditor from './components/GridEditor';
import TilePalette from './components/TilePalette';
import ObjectivesPanel from './components/ObjectivesPanel';
import LevelExporter from './components/LevelExporter';
import './App.css';

type RightTab = 'properties' | 'export';

export default function App() {
  const editor = useGridEditor();
  const [rightTab, setRightTab] = useState<RightTab>('properties');

  const { activeLevel } = editor;

  return (
    <div className="app">
      {/* ---- Header ---- */}
      <header className="app-header">
        <h1 className="app-title">Glow Island · 关卡编辑器</h1>
        {activeLevel && (
          <span className="app-active-level">
            当前：{activeLevel.id} — {activeLevel.name}
          </span>
        )}
      </header>

      {/* ---- Main layout ---- */}
      <div className="app-body">
        {/* Left panel: level list */}
        <aside className="app-left">
          <LevelList
            levels={editor.levels}
            activeLevelId={editor.activeLevelId}
            onSelect={editor.selectLevel}
            onAdd={editor.addLevel}
            onDelete={editor.deleteLevel}
          />
        </aside>

        {/* Center: grid editor + palette */}
        <main className="app-center">
          {activeLevel ? (
            <>
              <GridEditor
                level={activeLevel}
                selectedPalette={editor.selectedPalette}
                onPaintCell={editor.paintCell}
                onClearCell={editor.clearCell}
                onClearGrid={editor.clearGrid}
                onResize={(rows, cols) =>
                  editor.resizeGrid(activeLevel.id, rows, cols)
                }
              />
              <div className="app-palette-wrapper">
                <TilePalette
                  selected={editor.selectedPalette}
                  onSelect={editor.setSelectedPalette}
                />
              </div>
            </>
          ) : (
            <div className="app-empty">
              <p>左侧选择关卡，或点击「+ 新增关卡」开始编辑</p>
            </div>
          )}
        </main>

        {/* Right panel: properties + export */}
        <aside className="app-right">
          <div className="right-tabs">
            <button
              className={`right-tab${rightTab === 'properties' ? ' right-tab--active' : ''}`}
              onClick={() => setRightTab('properties')}
            >
              属性
            </button>
            <button
              className={`right-tab${rightTab === 'export' ? ' right-tab--active' : ''}`}
              onClick={() => setRightTab('export')}
            >
              导出 / 导入
            </button>
          </div>

          <div className="right-panel-content">
            {rightTab === 'properties' && activeLevel ? (
              <ObjectivesPanel
                level={activeLevel}
                onUpdateLevel={(patch) =>
                  editor.updateLevel(activeLevel.id, patch)
                }
                onUpdateObjectives={(objs) =>
                  editor.updateObjectives(activeLevel.id, objs)
                }
                onUpdateReward={(reward) =>
                  editor.updateReward(activeLevel.id, reward)
                }
                onUpdateBoardEvents={(events) =>
                  editor.updateBoardEvents(activeLevel.id, events)
                }
              />
            ) : rightTab === 'properties' ? (
              <div className="app-empty">
                <p>请先选择一个关卡</p>
              </div>
            ) : (
              <LevelExporter
                levels={editor.levels}
                activeLevel={activeLevel}
                onImportLevel={editor.importLevel}
                onImportDesign={editor.importDesign}
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
