import type {
  Level,
  LevelObjective,
  ObjectiveType,
  LevelReward,
  BoardEventConfig,
  BoardEventId,
} from '../types/LevelSchema';
import { TILE_DEFINITIONS, OBSTACLE_DEFINITIONS } from '../data/tile-types';

interface Props {
  level: Level;
  onUpdateLevel: (patch: Partial<Omit<Level, 'grid'>>) => void;
  onUpdateObjectives: (objectives: LevelObjective[]) => void;
  onUpdateReward: (reward: LevelReward) => void;
  onUpdateBoardEvents: (events: BoardEventConfig[]) => void;
}

const OBJECTIVE_TYPE_LABELS: Record<ObjectiveType, string> = {
  tile_target:      '消除图块',
  obstacle_clear:   '清除障碍',
  score_target:     '目标分数',
  glow_energy:      '积累光能',
  combo_challenge:  '连击挑战',
};

const BOARD_EVENT_OPTIONS: { id: BoardEventId; label: string }[] = [
  { id: 'tile_gravity', label: '图块滑落 (始终开启)' },
  { id: 'water_flow',   label: '水流移动' },
  { id: 'freeze_zone',  label: '冰冻区域' },
  { id: 'vine_spread',  label: '藤蔓扩散' },
];

function ObjectiveEditor({
  objective,
  index,
  onChange,
  onRemove,
}: {
  objective: LevelObjective;
  index: number;
  onChange: (obj: LevelObjective) => void;
  onRemove: () => void;
}) {
  const set = <K extends keyof LevelObjective>(key: K, value: LevelObjective[K]) =>
    onChange({ ...objective, [key]: value });

  return (
    <div className="objective-item">
      <div className="objective-item__header">
        <span className="objective-item__index">目标 {index + 1}</span>
        <select
          value={objective.type}
          onChange={(e) => set('type', e.target.value as ObjectiveType)}
        >
          {Object.entries(OBJECTIVE_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button className="btn btn--sm btn--danger" onClick={onRemove}>删除</button>
      </div>

      {objective.type === 'tile_target' && (
        <div className="objective-fields">
          <label>
            图块类型
            <select
              value={objective.targetTileType ?? ''}
              onChange={(e) =>
                set('targetTileType', e.target.value as LevelObjective['targetTileType'])
              }
            >
              <option value="">（任意）</option>
              {TILE_DEFINITIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} {t.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            数量
            <input
              type="number"
              min={1}
              value={objective.requiredCount ?? 20}
              onChange={(e) => set('requiredCount', Number(e.target.value))}
            />
          </label>
        </div>
      )}

      {objective.type === 'obstacle_clear' && (
        <div className="objective-fields">
          <label>
            障碍类型
            <select
              value={objective.obstacleType ?? ''}
              onChange={(e) =>
                set('obstacleType', e.target.value as LevelObjective['obstacleType'])
              }
            >
              <option value="">（所有障碍）</option>
              {OBSTACLE_DEFINITIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id} {o.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            清除数量
            <input
              type="number"
              min={1}
              value={objective.requiredCount ?? 5}
              onChange={(e) => set('requiredCount', Number(e.target.value))}
            />
          </label>
        </div>
      )}

      {objective.type === 'score_target' && (
        <div className="objective-fields">
          <label>
            目标分数
            <input
              type="number"
              min={100}
              step={100}
              value={objective.requiredScore ?? 1000}
              onChange={(e) => set('requiredScore', Number(e.target.value))}
            />
          </label>
        </div>
      )}

      {objective.type === 'glow_energy' && (
        <div className="objective-fields">
          <label>
            光能数量
            <input
              type="number"
              min={1}
              value={objective.requiredGlowEnergy ?? 100}
              onChange={(e) => set('requiredGlowEnergy', Number(e.target.value))}
            />
          </label>
        </div>
      )}

      {objective.type === 'combo_challenge' && (
        <div className="objective-fields">
          <label>
            连击次数
            <input
              type="number"
              min={1}
              value={objective.requiredComboCount ?? 3}
              onChange={(e) => set('requiredComboCount', Number(e.target.value))}
            />
          </label>
          <label>
            最低连击数
            <input
              type="number"
              min={2}
              max={4}
              value={objective.minComboThreshold ?? 2}
              onChange={(e) => set('minComboThreshold', Number(e.target.value))}
            />
          </label>
        </div>
      )}
    </div>
  );
}

export default function ObjectivesPanel({
  level,
  onUpdateLevel,
  onUpdateObjectives,
  onUpdateReward,
  onUpdateBoardEvents,
}: Props) {
  const addObjective = () => {
    onUpdateObjectives([
      ...level.objectives,
      { type: 'tile_target', requiredCount: 20 },
    ]);
  };

  const updateObjectiveAt = (index: number, obj: LevelObjective) => {
    const next = level.objectives.map((o, i) => (i === index ? obj : o));
    onUpdateObjectives(next);
  };

  const removeObjectiveAt = (index: number) => {
    onUpdateObjectives(level.objectives.filter((_, i) => i !== index));
  };

  const toggleEvent = (eventId: BoardEventId) => {
    const exists = level.boardEvents.some((e) => e.id === eventId);
    if (eventId === 'tile_gravity') return; // always on
    if (exists) {
      onUpdateBoardEvents(level.boardEvents.filter((e) => e.id !== eventId));
    } else {
      onUpdateBoardEvents([...level.boardEvents, { id: eventId }]);
    }
  };

  return (
    <div className="objectives-panel">
      {/* --- Level meta --- */}
      <section className="panel-section">
        <h3>关卡属性</h3>
        <div className="field-group">
          <label>
            关卡 ID
            <input
              type="text"
              value={level.id}
              onChange={(e) => onUpdateLevel({ id: e.target.value })}
            />
          </label>
          <label>
            关卡名称
            <input
              type="text"
              value={level.name ?? ''}
              onChange={(e) => onUpdateLevel({ name: e.target.value })}
            />
          </label>
          <label>
            章节
            <input
              type="number"
              min={1}
              max={6}
              value={level.chapter}
              onChange={(e) => onUpdateLevel({ chapter: Number(e.target.value) })}
            />
          </label>
          <label>
            序号
            <input
              type="number"
              min={1}
              value={level.sequence}
              onChange={(e) => onUpdateLevel({ sequence: Number(e.target.value) })}
            />
          </label>
          <label>
            最大步数
            <input
              type="number"
              min={5}
              value={level.maxMoves ?? ''}
              placeholder="无限制"
              onChange={(e) =>
                onUpdateLevel({
                  maxMoves: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </label>
          <label>
            情感笔记
            <input
              type="text"
              value={level.emotionalNote ?? ''}
              onChange={(e) => onUpdateLevel({ emotionalNote: e.target.value })}
            />
          </label>
        </div>
      </section>

      {/* --- Objectives --- */}
      <section className="panel-section">
        <h3>关卡目标</h3>
        {level.objectives.map((obj, i) => (
          <ObjectiveEditor
            key={i}
            objective={obj}
            index={i}
            onChange={(o) => updateObjectiveAt(i, o)}
            onRemove={() => removeObjectiveAt(i)}
          />
        ))}
        <button className="btn btn--primary btn--sm" onClick={addObjective}>
          + 添加目标
        </button>
      </section>

      {/* --- Rewards --- */}
      <section className="panel-section">
        <h3>奖励配置</h3>
        <div className="field-group">
          <label>
            金币
            <input
              type="number"
              min={0}
              value={level.reward.coins ?? 0}
              onChange={(e) =>
                onUpdateReward({ ...level.reward, coins: Number(e.target.value) })
              }
            />
          </label>
          <label>
            材料类型
            <input
              type="text"
              value={level.reward.material?.type ?? ''}
              placeholder="如 wood, stone..."
              onChange={(e) =>
                onUpdateReward({
                  ...level.reward,
                  material: e.target.value
                    ? {
                        type: e.target.value,
                        amount: level.reward.material?.amount ?? 1,
                      }
                    : undefined,
                })
              }
            />
          </label>
          {level.reward.material && (
            <label>
              材料数量
              <input
                type="number"
                min={1}
                value={level.reward.material.amount}
                onChange={(e) =>
                  onUpdateReward({
                    ...level.reward,
                    material: {
                      type: level.reward.material!.type,
                      amount: Number(e.target.value),
                    },
                  })
                }
              />
            </label>
          )}
        </div>
      </section>

      {/* --- Board Events --- */}
      <section className="panel-section">
        <h3>棋盘事件</h3>
        <div className="field-group">
          {BOARD_EVENT_OPTIONS.map(({ id, label }) => {
            const active = level.boardEvents.some((e) => e.id === id);
            return (
              <label key={id} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={active}
                  disabled={id === 'tile_gravity'}
                  onChange={() => toggleEvent(id)}
                />
                {label}
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
}
