(function(){
  const SLOT_CAPACITY = 7;
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
              { id: 'hint', name: '提示', remainingUses: 2, cap: 5 },
              { id: 'shuffle', name: '洗牌', remainingUses: 2, cap: 5 },
              { id: 'undo', name: '撤销', remainingUses: 3, cap: 6 }
            ],
            powerUpTokens: 0
          },
          stats: {}
        };
        return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
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
      this.resizeCanvas();
      this.canvas.addEventListener('click', (e)=> this.handleCanvasClick(e));
    },

    resizeCanvas(){
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      // 使用实际渲染尺寸，避免 CSS 高度与画布像素高度不一致导致坐标偏移
      this.canvas.width = Math.floor(rect.width * dpr);
      this.canvas.height = Math.floor(rect.height * dpr);
    },

    handleResize(){
      this.resizeCanvas();
      this.render();
    },

    bindUI(){
      // Top HUD
      this.updateHud();

      document.getElementById('btn-powerup').addEventListener('click', ()=> this.handlePowerUp());
      document.getElementById('btn-hint').addEventListener('click', ()=> this.useHint());
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
      const rows = clamp(5 + tier, 5, 9);
      const cols = clamp(5 + tier, 5, 9);
      const layers = clamp(2 + Math.floor(tier/1), 2, 4);
      // 增加类型数量上限，提升多样性
      const typeCount = clamp(8 + tier * 2, 8, Math.min(SYMBOLS.length - 1, 24));
      // 略微提高覆盖密度，增加层叠感
      const coverDensity = clamp(0.60 + tier * 0.05, 0.60, 0.85);
      return { rows, cols, layers, typeCount, coverDensity };
    },

    generateLevel(level, seed){
      const params = this.getLevelParams(level);
      const random = rng(seed);
      const positions = [];
      // Generate grid positions per layer with some holes based on coverDensity
      for (let z = 0; z < params.layers; z++){
        for (let r = 0; r < params.rows; r++){
          for (let c = 0; c < params.cols; c++){
            // create a hole chance inversely proportional to density
            const keep = random() < params.coverDensity;
            if (keep) positions.push({ layer: z, row: r, col: c });
          }
        }
      }
      // Ensure total positions is multiple of 3 (each type in triples)
      const remainder = positions.length % 3;
      if (remainder !== 0){
        positions.splice(0, remainder); // drop a few to make divisible by 3
      }
      // Assign types in triples
      const tiles = [];
      let typeId = 0;
      for (let i = 0; i < positions.length; i += 3){
        const t = Math.floor(random() * params.typeCount);
        for (let j = 0; j < 3; j++){
          const pos = positions[i + j];
          tiles.push({
            id: `t${i+j}`,
            type: t,
            layer: pos.layer,
            row: pos.row,
            col: pos.col,
            status: 'board' // 'board' | 'slot' | 'gone'
          });
        }
      }
      // Shuffle within layers to reduce obvious triples clustering
      tiles.sort(()=> random() - 0.5);
      // Re-assign ids after shuffle for stable rendering order (higher layer drawn later)
      tiles.forEach((tile, idx)=> tile.id = `t${idx}`);
      return tiles;
    },

    // --- Geometry & Rules ---
    computeTileRects(){
      // compute pixel rects for each tile based on rows/cols and layer offset
      const params = this.getLevelParams(this.state.level);
      const dpr = window.devicePixelRatio || 1;
      const padding = 16 * dpr;
      const boardWidth = this.canvas.width - padding * 2;
      const boardHeight = this.canvas.height - padding * 2 - 80 * dpr; // leave room for layer shadows
      const cellSize = Math.min(boardWidth / params.cols, boardHeight / params.rows);
      const offsetX = (this.canvas.width - cellSize * params.cols) / 2;
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
      const dpr = window.devicePixelRatio || 1;
      const x = (e.clientX - rect.left) * dpr;
      const y = (e.clientY - rect.top) * dpr;
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
      const action = this.history.pop();
      if (!action){ this.showMessage('没有可撤销的操作', 'info'); return; }
      this.undoAction(action);
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

    useHint(){
      const item = this.getItem('hint');
      if (!item || item.remainingUses <= 0){ this.showMessage('提示次数不足', 'warn'); return; }
      // find a selectable tile whose type count (board+slot) >= 3
      const counts = new Map();
      for (const t of this.tiles){
        if (t.status === 'gone') continue;
        counts.set(t.type, (counts.get(t.type)||0) + 1);
      }
      const rects = this.computeTileRects();
      let targetId = null;
      for (const t of this.tiles){
        if (t.status !== 'board') continue;
        if (counts.get(t.type) >= 3 && !this.isCovered(t, rects)) { targetId = t.id; break; }
      }
      if (!targetId){
        // fallback: highlight any selectable
        for (const t of this.tiles){
          if (t.status==='board' && !this.isCovered(t, rects)) { targetId = t.id; break; }
        }
      }
      if (targetId){
        this.highlightTileId = targetId;
        item.remainingUses -= 1;
        this.render();
        setTimeout(()=>{ this.highlightTileId = null; this.render(); }, 800);
        this.saveState();
      } else {
        this.showMessage('暂无可提示的目标', 'info');
      }
    },

    handlePowerUp(){
      // simple selector via prompt
      const choices = this.state.inventory.items.map(it=> it.id).join('/');
      const pick = prompt(`选择要扩容的道具(${choices})：`, 'hint');
      if (!pick) return;
      const item = this.getItem(pick.trim());
      if (!item){ this.showMessage('未知道具', 'warn'); return; }
      const old = item.remainingUses;
      item.remainingUses = clamp(item.remainingUses * 2, 0, item.cap);
      this.showMessage(`${item.name || item.id} 次数：${old} → ${item.remainingUses}`, 'info');
      this.saveState();
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
      const w = this.canvas.width;
      const h = this.canvas.height;
      const dpr = window.devicePixelRatio || 1;
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
