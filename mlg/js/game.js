(function(){
  // 槽位容量改为可变，默认 8
  let SLOT_CAPACITY = 8;
  const DIFFICULTY_LABELS = ['入门','进阶','高手','大师','宗师'];

  function getStorageKey(user){
    return `cat_${(user && user.uid) || 'guest'}`;
  }

  function clamp(value, min, max){
    return Math.max(min, Math.min(max, value));
  }

  function rng(seed){
    // Simple LCG for deterministic generation per seed
    let s = seed >>> 0;
    return function(){
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0xFFFFFFFF;
    };
  }

  const COLOR_PALETTE = [
    '#ef4444','#f97316','#f59e0b','#84cc16','#10b981','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#a3e635','#f472b6'
  ];

  // 更丰富的符号集（动物/水果/形状/物品等），用于不同类型的牌
  const SYMBOLS = [
    '🐱','🐶','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵',
    '🐤','🐧','🐙','🦄','🐝','🦋','🦕','🦖','🦉','🦜',
    '🍎','🍊','🍋','🍉','🍇','🍓','🍒','🥝','🍍','🥑','🍑','🍌',
    '🌸','🌼','🌻','🍀','🌙','⭐️','☀️','⚡️','🔥','❄️',
    '⚽️','🏀','🏈','🎾','🎲','🎯','🎁','💎','🔔',
    '❤️','💙','💚','💛','💜','🧡','🤎','🖤',
    '🔶','🔷','🔺','🔻','⬛️','⬜️','◼️','◻️'
  ];

  function getSymbolForType(type){
    return SYMBOLS[type % SYMBOLS.length];
  }

  const MLG = {
    bootstrap(user){
      this.user = user;
      this.state = this.loadState();
      this.history = [];
      this.highlightTileId = null;
      this.initCanvas();
      this.bindUI();
      this.newGame(/*keepLevel*/true);
      this.handleResize = this.handleResize.bind(this);
      window.addEventListener('resize', this.handleResize);
    },

    // --- Persistence ---
    loadState(){
      try{
        const raw = localStorage.getItem(getStorageKey(this.user));
        const defaults = {
          level: 1,
          seed: Math.floor(Math.random()*1e9),
          inventory: {
            items: [
              // 移除提示；默认每关洗牌×1、撤销×1；cap 上限保守
              { id: 'shuffle', name: '洗牌', remainingUses: 1, cap: 9 },
              { id: 'undo', name: '撤销', remainingUses: 1, cap: 9 }
            ],
            powerUpTokens: 0
          },
          stats: {}
        };
        const merged = raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
        // 迁移与矫正：去掉提示道具，确保存在洗牌/撤销条目
        const items = (merged.inventory && Array.isArray(merged.inventory.items)) ? merged.inventory.items : [];
        const filtered = items.filter(it => it && (it.id === 'shuffle' || it.id === 'undo'));
        const ensure = (id, name)=>{
          if (!filtered.some(it=> it.id === id)) filtered.push({ id, name, remainingUses: 1, cap: 9 });
        };
        ensure('shuffle','洗牌');
        ensure('undo','撤销');
        merged.inventory = merged.inventory || { items: [], powerUpTokens: 0 };
        merged.inventory.items = filtered;
        return merged;
      }catch{ return { level:1, seed: Math.floor(Math.random()*1e9), inventory:{ items:[], powerUpTokens:0 }, stats:{} }; }
    },

    saveState(){
      try{
        localStorage.setItem(getStorageKey(this.user), JSON.stringify({
          level: this.state.level,
          seed: this.state.seed,
          inventory: this.state.inventory,
          stats: this.state.stats
        }));
      }catch{}
    },

    // --- Setup & UI ---
    initCanvas(){
      this.canvas = document.getElementById('game-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.dpr = window.devicePixelRatio || 1;
      this.resizeCanvas();
      this.canvas.addEventListener('click', (e)=> this.handleCanvasClick(e));
    },

    resizeCanvas(){
      const rect = this.canvas.getBoundingClientRect();
      this.dpr = window.devicePixelRatio || 1;
      this.cssWidth = rect.width;
      this.cssHeight = rect.height;
      // 设置实际像素尺寸
      this.canvas.width = Math.floor(this.cssWidth * this.dpr);
      this.canvas.height = Math.floor(this.cssHeight * this.dpr);
      // 使用 CSS 像素坐标系进行绘制
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    },

    handleResize(){
      this.resizeCanvas();
      this.render();
    },

    bindUI(){
      // Top HUD
      this.updateHud();

      const addBtn = document.getElementById('btn-add');
      if (addBtn) addBtn.addEventListener('click', ()=> this.handleAdd());
      document.getElementById('btn-shuffle').addEventListener('click', ()=> this.useShuffle());
      document.getElementById('btn-undo').addEventListener('click', ()=> this.useUndo());
      document.getElementById('btn-restart').addEventListener('click', ()=> this.newGame(/*keepLevel*/true));
    },

    updateHud(){
      const levelEl = document.getElementById('level');
      const diffEl = document.getElementById('difficulty');
      if (levelEl) levelEl.textContent = this.state.level;
      if (diffEl) diffEl.textContent = DIFFICULTY_LABELS[Math.floor((this.state.level - 1) / 3)] || DIFFICULTY_LABELS[0];
      document.getElementById('moves').textContent = '--';
      document.getElementById('time').textContent = '--';
    },

    // --- Game Loop ---
    newGame(keepLevel){
      if (!keepLevel) this.state.level = 1;
      this.state.seed = Math.floor(Math.random()*1e9);
      this.slot = [];
      this.tiles = this.generateLevel(this.state.level, this.state.seed);
      this.history = [];
      this.highlightTileId = null;
      // 每关重置：槽位容量默认 8；洗牌/撤销不累加，重置为 1 次
      SLOT_CAPACITY = 8;
      const shuffleItem = this.getItem('shuffle'); if (shuffleItem) shuffleItem.remainingUses = 1;
      const undoItem = this.getItem('undo'); if (undoItem) { undoItem.remainingUses = 1; this.undoStepBudget = 2; }
      this.saveState();
      this.updateHud();
      this.render();
    },

    nextLevel(){
      this.state.level += 1;
      this.newGame(/*keepLevel*/true);
    },

    // --- Level Generation ---
    getLevelParams(level){
      const tier = Math.floor((level - 1) / 3); // 每3关提升一档
      const rows = clamp(6 + tier, 6, 10);
      const cols = clamp(6 + tier, 6, 10);
      const layers = clamp(5 + Math.floor(tier/1), 5, 8); // 起始 5 层，上限更高
      const typeCount = clamp(10 + tier * 3, 10, Math.min(SYMBOLS.length - 1, 30));
      // 提高覆盖密度，增加堆叠；并用于去相邻策略
      const coverDensity = clamp(0.70 + tier * 0.05, 0.70, 0.90);
      return { rows, cols, layers, typeCount, coverDensity };
    },

    generateLevel(level, seed){
      const params = this.getLevelParams(level);
      const random = rng(seed);
      const positions = [];
      // 生成更高层级和更密集的分布
      for (let z = 0; z < params.layers; z++){
        for (let r = 0; r < params.rows; r++){
          for (let c = 0; c < params.cols; c++){
            const keep = random() < params.coverDensity;
            if (keep) positions.push({ layer: z, row: r, col: c });
          }
        }
      }
      // 保证位置数量可被 3 整除
      const remainder = positions.length % 3;
      if (remainder !== 0){
        positions.splice(0, remainder);
      }
      // 先为每个位置分配一个类型池，避免同层相邻概率过高：
      // - 创建类型数组，复制三次（三消）
      const tripleCount = positions.length / 3;
      const typesPool = [];
      for (let i = 0; i < tripleCount; i++){
        const t = Math.floor(random() * params.typeCount);
        typesPool.push(t,t,t);
      }
      // 洗牌类型池
      for (let i = typesPool.length - 1; i > 0; i--){
        const j = Math.floor(random() * (i + 1));
        [typesPool[i], typesPool[j]] = [typesPool[j], typesPool[i]];
      }
      // 将 positions 按层分组并打乱，以减少可见相邻重复
      const byLayer = new Map();
      for (const pos of positions){
        if (!byLayer.has(pos.layer)) byLayer.set(pos.layer, []);
        byLayer.get(pos.layer).push(pos);
      }
      for (const arr of byLayer.values()){
        for (let i = arr.length - 1; i > 0; i--){
          const j = Math.floor(random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
      }
      // 合并层序，交错从各层取，进一步降低相邻重复
      const merged = [];
      const layerKeys = [...byLayer.keys()].sort((a,b)=> a-b);
      let progressed = true;
      while (progressed){
        progressed = false;
        for (const k of layerKeys){
          const arr = byLayer.get(k);
          if (arr && arr.length){ merged.push(arr.shift()); progressed = true; }
        }
      }
      // 按邻近惩罚分配类型：尽量避免与最近两个相同
      const tiles = [];
      for (let i = 0; i < merged.length; i++){
        // 选择一个类型，使其不与最近两个已分配类型相同
        let pickedType = null;
        for (let attempt = 0; attempt < 3 && typesPool.length; attempt++){
          const candidate = typesPool.pop();
          const prev1 = tiles[i-1]?.type;
          const prev2 = tiles[i-2]?.type;
          if (candidate !== prev1 && candidate !== prev2){
            pickedType = candidate;
            break;
          }
          // 放回候选，放到前面，稍后再试
          typesPool.unshift(candidate);
        }
        if (pickedType === null && typesPool.length){ pickedType = typesPool.pop(); }
        const pos = merged[i];
        tiles.push({ id: `t${i}`, type: pickedType ?? 0, layer: pos.layer, row: pos.row, col: pos.col, status: 'board' });
      }
      return tiles;
    },

    // --- Geometry & Rules ---
    computeTileRects(){
      // compute pixel rects for each tile based on rows/cols and layer offset
      const params = this.getLevelParams(this.state.level);
      const padding = 16; // CSS px
      const boardWidth = this.cssWidth - padding * 2;
      const boardHeight = this.cssHeight - padding * 2 - 80; // 留出阴影空间
      const cellSize = Math.min(boardWidth / params.cols, boardHeight / params.rows);
      const offsetX = (this.cssWidth - cellSize * params.cols) / 2;
      const offsetY = padding;
      const layerOffset = Math.floor(cellSize * 0.15);
      const rects = new Map();
      for (const tile of this.tiles){
        const x = Math.floor(offsetX + tile.col * cellSize + tile.layer * layerOffset);
        const y = Math.floor(offsetY + tile.row * cellSize + (params.layers - tile.layer - 1) * layerOffset);
        rects.set(tile.id, { x, y, w: Math.floor(cellSize * 0.95), h: Math.floor(cellSize * 0.95) });
      }
      return rects;
    },

    isCovered(tile, rects){
      // 规则：只要有更高层的牌与当前牌矩形有任何重叠，即判定为被覆盖（不可点击）
      if (tile.status !== 'board') return false;
      const a = rects.get(tile.id);
      for (const other of this.tiles){
        if (other === tile) continue;
        if (other.status !== 'board') continue;
        if (other.layer <= tile.layer) continue;
        const b = rects.get(other.id);
        const overlapW = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const overlapH = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (overlapW > 0 && overlapH > 0) return true;
      }
      return false;
    },

    getSelectableTileAtPoint(px, py){
      const rects = this.computeTileRects();
      const dpr = window.devicePixelRatio || 1;
      // iterate from topmost layer to bottom, find first selectable tile under point
      const sorted = [...this.tiles].filter(t=> t.status==='board').sort((a,b)=> a.layer - b.layer);
      for (let i = sorted.length - 1; i >= 0; i--){
        const t = sorted[i];
        const r = rects.get(t.id);
        if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h){
          if (!this.isCovered(t, rects)) return t;
        }
      }
      return null;
    },

    handleCanvasClick(e){
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left); // CSS px
      const y = (e.clientY - rect.top);
      const tile = this.getSelectableTileAtPoint(x, y);
      if (!tile){
        // 点击空白或不可选区域时不做二次点击要求，直接返回
        return;
      }
      this.pickTile(tile.id);
    },

    pickTile(tileId){
      const tile = this.tiles.find(t=> t.id === tileId);
      if (!tile || tile.status !== 'board') return;
      const action = { kind: 'pick', tileId, removed: [] };
      // move to slot
      tile.status = 'slot';
      this.slot.push(tileId);
      // check triple
      const type = tile.type;
      const sameTypeInSlot = this.slot.filter(id => this.tiles.find(t=> t.id===id).type === type);
      if (sameTypeInSlot.length >= 3){
        // remove three of that type (the earliest three)
        const toRemove = [];
        for (const id of this.slot){
          if (this.tiles.find(t=> t.id===id).type === type){
            toRemove.push(id);
            if (toRemove.length === 3) break;
          }
        }
        this.slot = this.slot.filter(id => !toRemove.includes(id));
        for (const id of toRemove){
          const t = this.tiles.find(tt=> tt.id===id);
          if (t) t.status = 'gone';
        }
        action.removed = toRemove;
      }
      // fail check
      if (this.slot.length > SLOT_CAPACITY){
        // revert last move and show fail
        this.undoAction(action);
        this.showMessage('失败：槽位已满', 'error');
        return;
      }

      this.history.push(action);
      this.render();
      this.checkWin();
      this.saveState();
    },

    undoAction(action){
      if (action.kind !== 'pick') return;
      // restore removed
      for (const id of action.removed){
        const t = this.tiles.find(tt=> tt.id===id);
        if (t && t.status === 'gone') t.status = 'board';
      }
      // remove last added from slot back to board
      const idx = this.slot.lastIndexOf(action.tileId);
      if (idx >= 0) this.slot.splice(idx, 1);
      const tile = this.tiles.find(t=> t.id===action.tileId);
      if (tile) tile.status = 'board';
      this.render();
    },

    useUndo(){
      const undoItem = this.getItem('undo');
      if (!undoItem || undoItem.remainingUses <= 0){ this.showMessage('撤销次数不足', 'warn'); return; }
      // 每次使用可撤销最多 2 步
      let steps = 0;
      while (steps < 2){
        const action = this.history.pop();
        if (!action) break;
        this.undoAction(action);
        steps++;
      }
      if (steps === 0){ this.showMessage('没有可撤销的操作', 'info'); return; }
      undoItem.remainingUses -= 1;
      this.saveState();
    },

    useShuffle(){
      const item = this.getItem('shuffle');
      if (!item || item.remainingUses <= 0){ this.showMessage('洗牌次数不足', 'warn'); return; }
      // shuffle types among tiles still on board
      const pool = this.tiles.filter(t=> t.status==='board');
      const types = pool.map(t=> t.type);
      // simple shuffle
      for (let i = types.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [types[i], types[j]] = [types[j], types[i]];
      }
      pool.forEach((t, idx)=> t.type = types[idx]);
      item.remainingUses -= 1;
      this.render();
      this.saveState();
    },

    // 移除提示功能

    handleAdd(){
      // 通过 prompt 选择增加：洗牌/撤销/扩容
      const pick = prompt('选择要增加的内容（shuffle/undo/slot）：', 'shuffle');
      if (!pick) return;
      const value = pick.trim().toLowerCase();
      if (value === 'slot' || value === '扩容'){
        SLOT_CAPACITY = clamp(SLOT_CAPACITY + 1, 1, 16);
        this.showMessage(`槽位容量 +1 → ${SLOT_CAPACITY}`, 'info');
      } else if (value === 'shuffle' || value === '洗牌'){
        const item = this.getItem('shuffle');
        if (item){ item.remainingUses = clamp(item.remainingUses + 1, 0, item.cap); }
        this.showMessage('洗牌 +1', 'info');
      } else if (value === 'undo' || value === '撤销'){
        const item = this.getItem('undo');
        if (item){ item.remainingUses = clamp(item.remainingUses + 1, 0, item.cap); }
        this.showMessage('撤销 +1', 'info');
      } else {
        this.showMessage('无效选择', 'warn');
        return;
      }
      this.saveState();
      this.render();
    },

    getItem(id){
      return this.state.inventory.items.find(it=> it.id === id);
    },

    // --- Win/Lose ---
    checkWin(){
      const remaining = this.tiles.some(t=> t.status !== 'gone');
      if (!remaining){
        this.showMessage('通关！进入下一关', 'success');
        setTimeout(()=> this.nextLevel(), 600);
      }
    },

    // --- Rendering ---
    render(){
      const ctx = this.ctx;
      const w = this.cssWidth;
      const h = this.cssHeight;
      ctx.clearRect(0,0,w,h);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0,0,w,h);

      const rects = this.computeTileRects();
      // draw tiles from bottom to top (lower layer first)
      const sorted = [...this.tiles].sort((a,b)=> a.layer - b.layer);
      for (const tile of sorted){
        if (tile.status !== 'board') continue; // 只渲染棋盘上的牌
        const r = rects.get(tile.id);
        // shadow by layer
        ctx.save();
        ctx.translate(0, 0);
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(r.x + 3, r.y + 3, r.w, r.h);
        // face
        const color = COLOR_PALETTE[tile.type % COLOR_PALETTE.length];
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeRect(r.x, r.y, r.w, r.h);
        // symbol
        ctx.fillStyle = color;
        ctx.font = `${Math.floor(r.h*0.5)}px system-ui`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(getSymbolForType(tile.type), r.x + r.w/2, r.y + r.h/2 + 2);
        // overlay for non-selectable
        if (tile.status==='board' && this.isCovered(tile, rects)){
          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.fillRect(r.x, r.y, r.w, r.h);
        }
        // highlight
        if (this.highlightTileId === tile.id){
          ctx.strokeStyle = '#0ea5e9';
          ctx.lineWidth = 5;
          ctx.strokeRect(r.x-2, r.y-2, r.w+4, r.h+4);
        }
        ctx.restore();
      }

      // Render slot bar (DOM)
      this.renderSlotBar();
    },

    renderSlotBar(){
      const container = document.getElementById('slot-bar');
      const items = this.slot.map(id => this.tiles.find(t=> t.id===id)).map(tile => {
        const color = COLOR_PALETTE[tile.type % COLOR_PALETTE.length];
        const sym = getSymbolForType(tile.type);
        return `<div class="slot-item" style="border-color:${color}"><span class="slot-emoji">${sym}</span></div>`;
      });
      // fill empty with placeholders
      const empties = Math.max(0, SLOT_CAPACITY - this.slot.length);
      for (let i=0;i<empties;i++){ items.push('<div class="slot-item empty"></div>'); }
      container.innerHTML = items.join('');
    },

    // --- Toast ---
    showMessage(text, type){
      // minimal toast using alert-like UX for now
      console.log(`[${type}]`, text);
      // can be improved to custom toast UI later
    }
  };

  window.MLG = MLG;
})();
