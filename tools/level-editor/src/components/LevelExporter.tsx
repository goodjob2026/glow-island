import { useState, useCallback } from 'react';
import type { Level, LevelDesign } from '../types/LevelSchema';

interface Props {
  levels: Level[];
  activeLevel: Level | null;
  onImportLevel: (level: Level) => void;
  onImportDesign: (levels: Level[]) => void;
}

function levelToDesign(levels: Level[]): LevelDesign {
  const chapterMap = new Map<number, Level[]>();
  for (const level of levels) {
    const arr = chapterMap.get(level.chapter) ?? [];
    arr.push(level);
    chapterMap.set(level.chapter, arr);
  }
  const chapters = Array.from(chapterMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([id, lvls]) => ({
      id,
      name: `Chapter ${id}`,
      levels: lvls.sort((a, b) => a.sequence - b.sequence),
    }));
  return { version: '1.0', chapters };
}

function downloadJSON(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type TabType = 'single' | 'all' | 'import';

export default function LevelExporter({
  levels,
  activeLevel,
  onImportLevel,
  onImportDesign,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('single');
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importText, setImportText] = useState('');

  const singleJson = activeLevel ? JSON.stringify(activeLevel, null, 2) : '';
  const allJson = JSON.stringify(levelToDesign(levels), null, 2);

  const copyToClipboard = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // fallback
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    },
    []
  );

  const handleImport = useCallback(() => {
    setImportError(null);
    if (!importText.trim()) {
      setImportError('请粘贴 JSON 内容');
      return;
    }
    try {
      const parsed: unknown = JSON.parse(importText);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const obj = parsed as Record<string, unknown>;
        // Check if it's a single level
        if (typeof obj.id === 'string' && typeof obj.chapter === 'number') {
          onImportLevel(obj as unknown as Level);
          setImportText('');
          return;
        }
        // Check if it's a LevelDesign
        if (Array.isArray(obj.chapters)) {
          const design = obj as unknown as LevelDesign;
          const allLevels = design.chapters.flatMap((c) => c.levels);
          if (allLevels.length === 0) {
            setImportError('导入的设计文件中没有关卡数据');
            return;
          }
          onImportDesign(allLevels);
          setImportText('');
          return;
        }
      }
      setImportError('无法识别的 JSON 格式，请检查是否为关卡或关卡设计文件');
    } catch (e) {
      setImportError(`JSON 解析失败: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [importText, onImportLevel, onImportDesign]);

  return (
    <div className="level-exporter">
      <div className="exporter-tabs">
        <button
          className={`exporter-tab${activeTab === 'single' ? ' exporter-tab--active' : ''}`}
          onClick={() => setActiveTab('single')}
        >
          当前关卡
        </button>
        <button
          className={`exporter-tab${activeTab === 'all' ? ' exporter-tab--active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          全量导出
        </button>
        <button
          className={`exporter-tab${activeTab === 'import' ? ' exporter-tab--active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          导入 JSON
        </button>
      </div>

      {activeTab === 'single' && (
        <div className="exporter-panel">
          <div className="exporter-actions">
            <button
              className="btn btn--primary"
              disabled={!activeLevel}
              onClick={() =>
                activeLevel &&
                copyToClipboard(singleJson)
              }
            >
              {copied ? '已复制！' : '复制 JSON'}
            </button>
            <button
              className="btn"
              disabled={!activeLevel}
              onClick={() =>
                activeLevel &&
                downloadJSON(`level-${activeLevel.id}.json`, activeLevel)
              }
            >
              下载 JSON
            </button>
          </div>
          {activeLevel ? (
            <pre className="json-preview">{singleJson}</pre>
          ) : (
            <p className="exporter-empty">未选择关卡</p>
          )}
        </div>
      )}

      {activeTab === 'all' && (
        <div className="exporter-panel">
          <div className="exporter-actions">
            <button
              className="btn btn--primary"
              onClick={() => copyToClipboard(allJson)}
            >
              {copied ? '已复制！' : '复制全量 JSON'}
            </button>
            <button
              className="btn"
              onClick={() =>
                downloadJSON('level-design.json', levelToDesign(levels))
              }
            >
              下载 level-design.json
            </button>
          </div>
          <pre className="json-preview">{allJson}</pre>
        </div>
      )}

      {activeTab === 'import' && (
        <div className="exporter-panel">
          <p className="exporter-hint">
            粘贴单个关卡 JSON 或完整 level-design.json 进行导入
          </p>
          {importError && (
            <div className="exporter-error">{importError}</div>
          )}
          <textarea
            className="json-import-area"
            placeholder='粘贴 JSON...'
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={16}
          />
          <div className="exporter-actions">
            <button
              className="btn btn--primary"
              onClick={handleImport}
              disabled={!importText.trim()}
            >
              导入
            </button>
            <button
              className="btn"
              onClick={() => {
                setImportText('');
                setImportError(null);
              }}
            >
              清空
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
