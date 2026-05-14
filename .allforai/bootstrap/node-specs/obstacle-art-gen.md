---
node: obstacle-art-gen
node_id: obstacle-art-gen
capability: implement
human_gate: false
hard_blocked_by: []
unlocks: [compile-verify]
exit_artifacts:
  - .allforai/game-client/obstacle-art-gen-report.json
---

# Task: 生成障碍物 Sprite 占位图

## 背景

`ObstacleManager.ts` 定义了 5 种障碍物类型：
- `ice_block` — 冰块（1次连接解冻）
- `chain_lock` — 锁链（2次连接解锁）
- `portal` — 传送门（连接自动穿越）
- `single_path_corridor` — 单向走廊
- `spreading_obstacle` — 扩散障碍（藤蔓/苔藓）

当前 `game-client/assets/resources/sprites/tiles/` 目录缺少对应的 obstacle_*.png 文件，导致障碍物在视觉上不可见。

## 执行步骤

### 1. 确认缺少哪些文件

```bash
ls game-client/assets/resources/sprites/tiles/ | grep obstacle
```

如果没有输出，说明全部缺失。

### 2. 确认 ObstacleManager 期望的文件名

读取 `game-client/assets/scripts/puzzle/ObstacleManager.ts`：

```bash
grep -n "obstacle_\|sprite\|resources\|path" game-client/assets/scripts/puzzle/ObstacleManager.ts | head -20
```

确认 spriteFrame 路径格式（例如 `sprites/tiles/obstacle_ice_block`）。

### 3. 生成 PNG 占位图

使用 Python + struct 生成最小有效 PNG（16×16 纯色占位）：

```python
import os, zlib, struct

def make_png(width, height, r, g, b):
    """生成最小有效 PNG 文件（单色 RGB）"""
    def chunk(name, data):
        c = zlib.crc32(name + data) & 0xFFFFFFFF
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', c)
    
    signature = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
    
    raw = b''
    for _ in range(height):
        raw += b'\x00'  # filter type
        for _ in range(width):
            raw += bytes([r, g, b])
    
    idat = chunk(b'IDAT', zlib.compress(raw))
    iend = chunk(b'IEND', b'')
    return signature + ihdr + idat + iend

obstacles = [
    # (filename, r, g, b, description)
    ('obstacle_ice_block',         100, 200, 255, '浅蓝冰块'),
    ('obstacle_chain_lock',        120, 120, 120, '灰色锁链'),
    ('obstacle_portal',            160,  80, 220, '紫色传送门'),
    ('obstacle_single_path',       200, 160,  60, '金色走廊'),
    ('obstacle_spreading',          80, 180,  80, '绿色扩散'),
]

output_dir = 'game-client/assets/resources/sprites/tiles'
for filename, r, g, b, desc in obstacles:
    path = f'{output_dir}/{filename}.png'
    with open(path, 'wb') as f:
        f.write(make_png(64, 64, r, g, b))
    print(f'Created {filename}.png ({desc})')
```

运行：

```bash
python3 -c "..."  # 上述脚本
```

### 4. 确认文件创建

```bash
ls game-client/assets/resources/sprites/tiles/ | grep obstacle
```

期望输出 5 个 obstacle_*.png 文件。

### 5. 生成报告

写入 `.allforai/game-client/obstacle-art-gen-report.json`：

```json
{
  "generated_at": "<ISO timestamp>",
  "obstacle_sprites": [
    {"name": "obstacle_ice_block.png", "size": "64x64", "type": "placeholder"},
    {"name": "obstacle_chain_lock.png", "size": "64x64", "type": "placeholder"},
    {"name": "obstacle_portal.png", "size": "64x64", "type": "placeholder"},
    {"name": "obstacle_single_path.png", "size": "64x64", "type": "placeholder"},
    {"name": "obstacle_spreading.png", "size": "64x64", "type": "placeholder"}
  ],
  "note": "纯色占位图。正式美术资产需由美术设计师提供并替换。",
  "overall_status": "generated"
}
```
