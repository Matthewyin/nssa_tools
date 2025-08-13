(function () {
  // 槽位容量改为可变，默认 8
  let SLOT_CAPACITY = 8;
  const DIFFICULTY_LABELS = ["入门", "进阶", "高手", "大师", "宗师"];

  function getStorageKey(user) {
    return `cat_${(user && user.uid) || "guest"}`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rng(seed) {
    // Simple LCG for deterministic generation per seed
    let s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0xffffffff;
    };
  }

  // 柔和的立方体配色方案 - 降低饱和度，更温和的色调
  const COLOR_PALETTE = [
    "#dc8a8a", // 柔和红色
    "#e6a373", // 柔和橙色
    "#d4c078", // 柔和黄色
    "#7db88a", // 柔和绿色
    "#6bb6c7", // 柔和青色
    "#8bb4f0", // 柔和蓝色
    "#b19cd9", // 柔和紫色
    "#e091b8", // 柔和粉色
    "#d4a574", // 柔和琥珀色
    "#a8c77a", // 柔和青柠色
    "#6ba8a0", // 柔和蓝绿色
    "#9ca3f7", // 柔和靛蓝色
    "#d687d4", // 柔和紫红色
    "#e08a9b", // 柔和玫瑰色
    "#b888d4", // 柔和紫色
    "#7bb8e8", // 柔和天蓝色
  ];

  // 更丰富的符号集（动物/水果/形状/物品等），用于不同类型的牌
  const SYMBOLS = [
    "🐱",
    "🐶",
    "🐭",
    "🐹",
    "🐰",
    "🦊",
    "🐻",
    "🐼",
    "🐨",
    "🐯",
    "🦁",
    "🐮",
    "🐷",
    "🐸",
    "🐵",
    "🐤",
    "🐧",
    "🐙",
    "🦄",
    "🐝",
    "🦋",
    "🦕",
    "🦖",
    "🦉",
    "🦜",
    "🍎",
    "🍊",
    "🍋",
    "🍉",
    "🍇",
    "🍓",
    "🍒",
    "🥝",
    "🍍",
    "🥑",
    "🍑",
    "🍌",
    "🌸",
    "🌼",
    "🌻",
    "🍀",
    "🌙",
    "⭐️",
    "☀️",
    "⚡️",
    "🔥",
    "❄️",
    "⚽️",
    "🏀",
    "🏈",
    "🎾",
    "🎲",
    "🎯",
    "🎁",
    "💎",
    "🔔",
    "❤️",
    "💙",
    "💚",
    "💛",
    "💜",
    "🧡",
    "🤎",
    "🖤",
    "🔶",
    "🔷",
    "🔺",
    "🔻",
    "⬛️",
    "⬜️",
    "◼️",
    "◻️",
  ];

  function getSymbolForType(type) {
    return SYMBOLS[type % SYMBOLS.length];
  }

  const MLG = {
    // 调整颜色明暗（仅支持 #rrggbb），amount ∈ [-1,1]
    adjustHexColor(hex, amount) {
      try {
        const m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex || ""));
        if (!m) return hex;
        const v = m[1];
        const r = parseInt(v.slice(0, 2), 16);
        const g = parseInt(v.slice(2, 4), 16);
        const b = parseInt(v.slice(4, 6), 16);
        const clamp255 = (n) => Math.max(0, Math.min(255, Math.round(n)));
        const adj = (c) => clamp255(c + amount * 255);
        const toHex = (n) => n.toString(16).padStart(2, "0");
        return `#${toHex(adj(r))}${toHex(adj(g))}${toHex(adj(b))}`;
      } catch {
        return hex;
      }
    },

    // 绘制立方体（长方体）: 前面 + 右侧面 + 顶面 - 层级颜色系统
    // frontX, frontY 为前方面的左上角；frontW、frontH 为前方面尺寸；depth 为挤出深度像素
    drawCuboid(ctx, frontX, frontY, frontW, frontH, depth, options) {
      const o = options || {};
      const actualLayer = o.actualLayer || 0;
      const isTopAtPosition = o.isTopAtPosition || false; // 是否为当前位置的顶层
      const relativeDepth = o.relativeDepth || 0; // 相对深度（0=顶层，1=下一层，等等）
      let frontColor, borderColor;

      // 新的颜色方案：基于相对深度而非绝对层级
      const depthColors = [
        { front: '#FFFFFF', border: '#CCCCCC' }, // 顶层：纯白色
        { front: '#B0BEC5', border: '#37474F' }, // 下一层：蓝灰色
        { front: '#90A4AE', border: '#263238' }, // 更下层：深蓝灰色
        { front: '#546E7A', border: '#102027' }  // 最下层：最深蓝灰色
      ];

      // 如果是当前位置的顶层，使用顶层颜色；否则根据相对深度选择颜色
      let colorIndex;
      if (isTopAtPosition) {
        colorIndex = 0; // 顶层颜色
      } else {
        colorIndex = Math.min(relativeDepth + 1, depthColors.length - 1);
      }

      frontColor = depthColors[colorIndex].front;
      borderColor = depthColors[colorIndex].border;

      const radius = 6;
      const shadowOffset = 3; // 底面阴影偏移

      ctx.save();

      // 绘制底面阴影（简单的立体效果）
      const shadowColor = this.adjustHexColor(frontColor, -0.3); // 底面更暗
      ctx.fillStyle = shadowColor;
      this.createRoundedRectPath(ctx, frontX + shadowOffset, frontY + shadowOffset, frontW, frontH, radius);
      ctx.fill();

      // 底面边框
      ctx.strokeStyle = this.adjustHexColor(borderColor, -0.2);
      ctx.lineWidth = 1;
      ctx.stroke();

      // 绘制主体矩形（正面）
      this.createRoundedRectPath(ctx, frontX, frontY, frontW, frontH, radius);
      ctx.fillStyle = frontColor;
      ctx.fill();

      // 绘制主边框
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 绘制内部高光边框（模拟立体效果）
      this.createRoundedRectPath(ctx, frontX + 2, frontY + 2, frontW - 4, frontH - 4, radius - 2);
      ctx.strokeStyle = this.adjustHexColor(frontColor, 0.15);
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    },
    // 绘制圆角矩形路径 - 增强圆角效果
    createRoundedRectPath(ctx, x, y, width, height, radius) {
      const r = Math.max(3, Math.min(radius || 10, Math.min(width, height) / 3)); // 增加最小圆角和比例
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + width - r, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + r);
      ctx.lineTo(x + width, y + height - r);
      ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
      ctx.lineTo(x + r, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
    },
    bootstrap(user) {
      this.user = user;
      this.state = this.loadState();
      this.history = [];
      this.highlightTileId = null;
      this.timer = null;
      this.warnedNearFull = false;
      this.initCanvas();
      this.bindUI();
      // 如有正在进行的局面，则直接恢复；否则开新局
      if (
        this.state &&
        Array.isArray(this.state.tiles) &&
        this.state.tiles.length > 0
      ) {
        this.tiles = this.state.tiles;
        this.slot = this.state.slot || [];
        this.history = this.state.history || [];
        SLOT_CAPACITY =
          typeof this.state.slotCapacity === "number"
            ? this.state.slotCapacity
            : 8;
        this.highlightTileId = null;
        // 确保存在开始时间
        if (typeof this.state.startedAt !== "number") {
          this.state.startedAt = Date.now();
          this.saveState();
        }
        this.startTimer();
        this.updateHud();
        this.render();
      } else {
        this.newGame(/*keepLevel*/ true);
      }
      this.handleResize = this.handleResize.bind(this);
      window.addEventListener("resize", this.handleResize);
    },

    // --- Persistence ---
    loadState() {
      try {
        const raw = localStorage.getItem(getStorageKey(this.user));
        const defaults = {
          level: 1,
          seed: Math.floor(Math.random() * 1e9),
          inventory: {
            items: [
              // 移除提示；默认每关洗牌×1、撤销×1；cap 上限保守
              { id: "shuffle", name: "洗牌", remainingUses: 1, cap: 9 },
              { id: "undo", name: "撤销", remainingUses: 1, cap: 9 },
            ],
            powerUpTokens: 0,
          },
          stats: {},
          // 进行中局面
          tiles: [],
          slot: [],
          history: [],
          slotCapacity: 8,
          startedAt: Date.now(),
        };
        const merged = raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
        // 迁移与矫正：去掉提示道具，确保存在洗牌/撤销条目
        const items =
          merged.inventory && Array.isArray(merged.inventory.items)
            ? merged.inventory.items
            : [];
        const filtered = items.filter(
          (it) => it && (it.id === "shuffle" || it.id === "undo")
        );
        const ensure = (id, name) => {
          if (!filtered.some((it) => it.id === id))
            filtered.push({ id, name, remainingUses: 1, cap: 9 });
        };
        ensure("shuffle", "洗牌");
        ensure("undo", "撤销");
        merged.inventory = merged.inventory || { items: [], powerUpTokens: 0 };
        merged.inventory.items = filtered;
        if (typeof merged.slotCapacity !== "number") merged.slotCapacity = 8;
        if (!Array.isArray(merged.tiles)) merged.tiles = [];
        if (!Array.isArray(merged.slot)) merged.slot = [];
        if (!Array.isArray(merged.history)) merged.history = [];
        if (typeof merged.startedAt !== "number") merged.startedAt = Date.now();
        return merged;
      } catch {
        return {
          level: 1,
          seed: Math.floor(Math.random() * 1e9),
          inventory: { items: [], powerUpTokens: 0 },
          stats: {},
        };
      }
    },

    saveState() {
      try {
        // 将进行中局面一并保存
        const snapshot = {
          level: this.state.level,
          seed: this.state.seed,
          inventory: this.state.inventory,
          stats: this.state.stats,
          tiles: this.tiles || [],
          slot: this.slot || [],
          history: this.history || [],
          slotCapacity: typeof SLOT_CAPACITY === "number" ? SLOT_CAPACITY : 8,
          startedAt: this.state.startedAt,
        };
        localStorage.setItem(
          getStorageKey(this.user),
          JSON.stringify(snapshot)
        );
      } catch {}
    },

    // --- Setup & UI ---
    initCanvas() {
      this.canvas = document.getElementById("game-canvas");
      this.ctx = this.canvas.getContext("2d");
      this.dpr = window.devicePixelRatio || 1;
      // 先根据可用空间调整 CSS 高度，再进行像素尺寸调整
      this.updateCanvasCssHeight();
      this.resizeCanvas();
      this.canvas.addEventListener("click", (e) => this.handleCanvasClick(e));
      // 监听主题变化，强制重绘，避免返回页面时残留错误底色
      window.addEventListener("mlg:theme-change", () => {
        try {
          this.render();
        } catch {}
      });
    },

    resizeCanvas() {
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

    handleResize() {
      this.updateCanvasCssHeight();
      this.resizeCanvas();
      this.render();
    },

    updateCanvasCssHeight() {
      try {
        const header = document.querySelector("header");
        const topBar = document.getElementById("top-bar");
        const slotBar = document.getElementById("slot-bar");
        const viewportH = Math.max(
          window.innerHeight || 0,
          document.documentElement.clientHeight || 0
        );
        const headerH = header ? header.offsetHeight : 0;
        const topBarH = topBar ? topBar.offsetHeight : 0;
        // 预留给槽位栏的空间（若未渲染高度，则使用其 min-height 作为保底）
        let slotReserve = 84;
        if (slotBar) {
          const cs = getComputedStyle(slotBar);
          const minH = parseFloat(cs.minHeight || "0") || 0;
          const paddingTop = parseFloat(cs.paddingTop || "0") || 0;
          const paddingBottom = parseFloat(cs.paddingBottom || "0") || 0;
          const measured = slotBar.offsetHeight || 0;
          slotReserve = Math.max(
            measured,
            minH + paddingTop + paddingBottom,
            72
          );
        }
        // 其他垂直间距（main 的内边距、容器内边距和安全余量）
        const extraGaps =
          24 /* main py-6 top */ +
          24 /* main py-6 bottom */ +
          24 /* 控件与画布间距余量 */ +
          12 /* 容器内边距上 */ +
          12; /* 容器内边距下 */
        const available = Math.max(
          180,
          viewportH - headerH - topBarH - slotReserve - extraGaps
        );
        this.canvas.style.height = `${Math.floor(available)}px`;
      } catch (e) {
        /* no-op */
      }
    },

    bindUI() {
      // Top HUD
      this.updateHud();
      // 内置增加道具面板
      const addBtn = document.getElementById("btn-add");
      const addPanel = document.getElementById("add-panel");
      const moreBtn = document.getElementById("btn-more");
      const morePanel = document.getElementById("more-panel");
      if (addBtn && addPanel) {
        addBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          addPanel.classList.toggle("hidden");
          addPanel.setAttribute(
            "aria-hidden",
            addPanel.classList.contains("hidden") ? "true" : "false"
          );
        });
        addPanel.addEventListener("click", (e) => {
          const target = e.target.closest(".menu-item");
          if (!target) return;
          const action = target.getAttribute("data-action");
          this.applyAddAction(action);
          addPanel.classList.add("hidden");
          addPanel.setAttribute("aria-hidden", "true");
        });
        // 点击外部关闭
        document.addEventListener("click", (e) => {
          if (addPanel.classList.contains("hidden")) return;
          if (e.target === addBtn || addPanel.contains(e.target)) return;
          addPanel.classList.add("hidden");
          addPanel.setAttribute("aria-hidden", "true");
        });
        // Esc 关闭
        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape") {
            addPanel.classList.add("hidden");
            addPanel.setAttribute("aria-hidden", "true");
          }
        });
      }
      // 移动端更多菜单
      if (moreBtn && morePanel) {
        moreBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          morePanel.classList.toggle("hidden");
          morePanel.setAttribute(
            "aria-hidden",
            morePanel.classList.contains("hidden") ? "true" : "false"
          );
        });
        morePanel.addEventListener("click", (e) => {
          const target = e.target.closest(".menu-item");
          if (!target) return;
          const action = target.getAttribute("data-action");
          if (action === "add") document.getElementById("btn-add")?.click();
          if (action === "shuffle")
            document.getElementById("btn-shuffle")?.click();
          if (action === "undo") document.getElementById("btn-undo")?.click();
          if (action === "restart")
            document.getElementById("btn-restart")?.click();
          morePanel.classList.add("hidden");
          morePanel.setAttribute("aria-hidden", "true");
        });
      }
      document
        .getElementById("btn-shuffle")
        .addEventListener("click", () => this.useShuffle());
      document
        .getElementById("btn-undo")
        .addEventListener("click", () => this.useUndo());
      document
        .getElementById("btn-restart")
        .addEventListener("click", () => this.newGame(/*keepLevel*/ true));
    },

    updateHud() {
      const levelEl = document.getElementById("level");
      const diffEl = document.getElementById("difficulty");
      if (levelEl) levelEl.textContent = this.state.level;
      if (diffEl)
        diffEl.textContent =
          DIFFICULTY_LABELS[Math.floor((this.state.level - 1) / 3)] ||
          DIFFICULTY_LABELS[0];
      const movesEl = document.getElementById("moves");
      const moves = Array.isArray(this.history) ? this.history.length : 0;
      if (movesEl) movesEl.textContent = String(moves);
      // 计时功能已移除，不再更新用时

      // 同步道具按钮可用状态与提示
      const shuffleBtn = document.getElementById("btn-shuffle");
      const undoBtn = document.getElementById("btn-undo");
      const syncBtn = (btn, item) => {
        if (!btn) return;
        const remaining = item ? Number(item.remainingUses || 0) : 0;
        btn.disabled = !item || remaining <= 0;
        btn.title = item ? `${item.name} 剩余 ${remaining}` : "不可用";
      };
      syncBtn(shuffleBtn, this.getItem("shuffle"));
      syncBtn(undoBtn, this.getItem("undo"));
    },

    startTimer() {
      // 计时功能已移除
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },

    // --- Game Loop ---
    newGame(keepLevel) {
      if (!keepLevel) this.state.level = 1;
      this.state.seed = Math.floor(Math.random() * 1e9);
      this.slot = [];
      this.tiles = this.generateLevel(this.state.level, this.state.seed);
      this.history = [];
      this.highlightTileId = null;
      // 每关重置：槽位容量默认 8；洗牌/撤销不累加，重置为 1 次
      SLOT_CAPACITY = 8;
      this.state.slotCapacity = SLOT_CAPACITY;
      const shuffleItem = this.getItem("shuffle");
      if (shuffleItem) shuffleItem.remainingUses = 1;
      const undoItem = this.getItem("undo");
      if (undoItem) {
        undoItem.remainingUses = 1;
        this.undoStepBudget = 2;
      }
      // 计时器重置
      this.state.startedAt = Date.now();
      this.startTimer();
      this.warnedNearFull = false;
      // 更新持久化快照字段
      this.state.tiles = this.tiles;
      this.state.slot = this.slot;
      this.state.history = this.history;
      this.saveState();
      this.updateHud();
      this.render();
    },

    nextLevel() {
      this.state.level += 1;
      this.newGame(/*keepLevel*/ true);
    },

    // --- Level Generation ---
    getLevelParams(level) {
      // 使用测试文件的固定布局参数
      const rows = 9; // 固定9行
      const cols = 7; // 固定7列
      const layers = 4; // 固定4层
      const coverDensity = 0.6; // 固定密度
      const typeCount = clamp(
        12 + Math.floor((level - 1) / 3) * 2,
        12,
        Math.min(SYMBOLS.length - 1, 28)
      );
      return { rows, cols, layers, typeCount, coverDensity };
    },

    generateLevel(level, seed) {
      const params = this.getLevelParams(level);
      const random = rng(seed);
      const positions = [];
      // 使用测试文件的层级概率分布
      for (let layer = 0; layer < params.layers; layer++) {
        for (let row = 0; row < params.rows; row++) {
          for (let col = 0; col < params.cols; col++) {
            // 每层每个位置独立随机决定是否放置立方体
            // 底层概率稍高，上层概率递减，形成金字塔效果
            const probability = 0.6 - (layer * 0.1); // 层0: 60%, 层1: 50%, 层2: 40%, 层3: 30%
            if (random() < probability) {
              positions.push({ layer, row, col });
            }
          }
        }
      }
      // 保证位置数量可被 3 整除
      const remainder = positions.length % 3;
      if (remainder !== 0) {
        positions.splice(0, remainder);
      }
      // 先为每个位置分配一个类型池，避免同层相邻概率过高：
      // - 创建类型数组，复制三次（三消）
      const tripleCount = positions.length / 3;
      const typesPool = [];
      for (let i = 0; i < tripleCount; i++) {
        const t = Math.floor(random() * params.typeCount);
        typesPool.push(t, t, t);
      }
      // 洗牌类型池
      for (let i = typesPool.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [typesPool[i], typesPool[j]] = [typesPool[j], typesPool[i]];
      }
      // 将 positions 按层分组并打乱；层内随机，层间再交错，提升随机性
      const byLayer = new Map();
      for (const pos of positions) {
        if (!byLayer.has(pos.layer)) byLayer.set(pos.layer, []);
        byLayer.get(pos.layer).push(pos);
      }
      for (const arr of byLayer.values()) {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
      }
      // 合并层序，交错从各层取，进一步降低相邻重复
      const merged = [];
      const layerKeys = [...byLayer.keys()].sort((a, b) => a - b);
      let progressed = true;
      while (progressed) {
        progressed = false;
        for (const k of layerKeys) {
          const arr = byLayer.get(k);
          if (arr && arr.length) {
            merged.push(arr.shift());
            progressed = true;
          }
        }
      }
      // 按邻近惩罚分配类型：尽量避免与最近两个相同
      const tiles = [];
      for (let i = 0; i < merged.length; i++) {
        // 选择一个类型，使其不与最近两个已分配类型相同
        let pickedType = null;
        for (let attempt = 0; attempt < 3 && typesPool.length; attempt++) {
          const candidate = typesPool.pop();
          const prev1 = tiles[i - 1]?.type;
          const prev2 = tiles[i - 2]?.type;
          if (candidate !== prev1 && candidate !== prev2) {
            pickedType = candidate;
            break;
          }
          // 放回候选，放到前面，稍后再试
          typesPool.unshift(candidate);
        }
        if (pickedType === null && typesPool.length) {
          pickedType = typesPool.pop();
        }
        const pos = merged[i];
        tiles.push({
          id: `t${i}`,
          type: pickedType ?? 0,
          layer: pos.layer,
          row: pos.row,
          col: pos.col,
          status: "board",
        });
      }
      return tiles;
    },

    // --- Geometry & Rules ---
    computeTileRects() {
      // 基于行列与层级计算“前方面”矩形；
      // - 左侧对齐：每行从左开始布置
      // - 同层级紧凑：同一层内的同一行按出现顺序紧密排列
      // - 纵向仍保留层级向上偏移
      const params = this.getLevelParams(this.state.level);
      // 响应式立方体大小 - 根据屏幕宽度自动缩放
      const screenWidth = window.innerWidth;
      const baseCubeWidth = 60; // 基础宽度60px
      let scale = 1;

      if (screenWidth <= 480) {
        scale = 0.6; // 超小屏幕（iPhone SE等）
      } else if (screenWidth <= 640) {
        scale = 0.7; // 小屏幕手机
      } else if (screenWidth <= 768) {
        scale = 0.85; // 平板竖屏
      }

      const cubeWidth = Math.floor(baseCubeWidth * scale);
      const cubeHeight = Math.floor(cubeWidth * 2.2 / 2); // 2.2:2 比例，高度为宽度的1.1倍
      const maxLayers = 4; // 最多4层
      const rects = new Map();
      
      // 根据立方体大小和层级偏移计算总布局空间
      const baseGridWidth = params.cols * cubeWidth;
      const baseGridHeight = params.rows * cubeHeight;

      // 考虑最大层级的45度偏移
      const maxLayerOffset = (maxLayers - 1) * cubeWidth * 0.5 * Math.cos(Math.PI / 4);
      const totalWidth = baseGridWidth + maxLayerOffset;
      const totalHeight = baseGridHeight + maxLayerOffset;

      // 计算居中位置，确保所有层级都能显示
      const startX = Math.floor((this.cssWidth - totalWidth) / 2);
      const startY = Math.floor((this.cssHeight - totalHeight) / 2);
      // 为每个tile计算位置
      for (const tile of this.tiles) {
        if (tile.status !== "board") continue;
        
        // 方案C：每层45度角偏移半个格子
        const baseX = startX + tile.col * cubeWidth;
        const baseY = startY + tile.row * cubeHeight;

        // 45度角偏移：每层向右下偏移半个格子
        // 45度角的偏移量 = 半个格子 * cos(45°) 和 sin(45°)
        const halfGrid = cubeWidth * 0.5;
        const angle45 = Math.PI / 4; // 45度转弧度

        const layerOffsetX = tile.layer * halfGrid * Math.cos(angle45);
        const layerOffsetY = tile.layer * halfGrid * Math.sin(angle45);

        const x = baseX + layerOffsetX;
        const y = baseY + layerOffsetY;

        rects.set(tile.id, { 
          x: Math.floor(x), 
          y: Math.floor(y), 
          w: cubeWidth, 
          h: cubeHeight 
        });
      }
      return rects;
    },

    isCovered(tile, rects) {
      // 规则：只要有更高层的牌与当前牌矩形有任何重叠，即判定为被覆盖（不可点击）
      if (tile.status !== "board") return false;
      const a = rects.get(tile.id);
      for (const other of this.tiles) {
        if (other === tile) continue;
        if (other.status !== "board") continue;
        if (other.layer <= tile.layer) continue;
        const b = rects.get(other.id);
        const overlapW = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const overlapH = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (overlapW > 0 && overlapH > 0) return true;
      }
      return false;
    },

    getSelectableTileAtPoint(px, py) {
      const rects = this.computeTileRects();
      const dpr = window.devicePixelRatio || 1;
      // iterate from topmost layer to bottom, find first selectable tile under point
      const sorted = [...this.tiles]
        .filter((t) => t.status === "board")
        .sort((a, b) => a.layer - b.layer);
      for (let i = sorted.length - 1; i >= 0; i--) {
        const t = sorted[i];
        const r = rects.get(t.id);
        if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
          if (!this.isCovered(t, rects)) return t;
        }
      }
      return null;
    },

    handleCanvasClick(e) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left; // CSS px
      const y = e.clientY - rect.top;
      const tile = this.getSelectableTileAtPoint(x, y);
      if (!tile) {
        // 点击空白或不可选区域时不做二次点击要求，直接返回
        return;
      }
      this.pickTile(tile.id);
    },

    pickTile(tileId) {
      const tile = this.tiles.find((t) => t.id === tileId);
      if (!tile || tile.status !== "board") return;
      const action = { kind: "pick", tileId, removed: [] };
      // move to slot
      tile.status = "slot";
      this.slot.push(tileId);
      // check triple
      const type = tile.type;
      const sameTypeInSlot = this.slot.filter(
        (id) => this.tiles.find((t) => t.id === id).type === type
      );
      if (sameTypeInSlot.length >= 3) {
        // remove three of that type (the earliest three)
        const toRemove = [];
        for (const id of this.slot) {
          if (this.tiles.find((t) => t.id === id).type === type) {
            toRemove.push(id);
            if (toRemove.length === 3) break;
          }
        }
        this.slot = this.slot.filter((id) => !toRemove.includes(id));
        for (const id of toRemove) {
          const t = this.tiles.find((tt) => tt.id === id);
          if (t) t.status = "gone";
        }
        action.removed = toRemove;
      }
      // fail check
      if (this.slot.length > SLOT_CAPACITY) {
        // revert last move and show fail
        this.undoAction(action);
        this.showMessage("失败：槽位已满", "error");
        return;
      }

      this.history.push(action);
      this.render();
      this.updateHud();
      this.checkWin();
      this.saveState();
    },

    undoAction(action) {
      if (action.kind !== "pick") return;
      // restore removed
      for (const id of action.removed) {
        const t = this.tiles.find((tt) => tt.id === id);
        if (t && t.status === "gone") t.status = "board";
      }
      // remove last added from slot back to board
      const idx = this.slot.lastIndexOf(action.tileId);
      if (idx >= 0) this.slot.splice(idx, 1);
      const tile = this.tiles.find((t) => t.id === action.tileId);
      if (tile) tile.status = "board";
      this.render();
    },

    useUndo() {
      const undoItem = this.getItem("undo");
      if (!undoItem || undoItem.remainingUses <= 0) {
        this.showMessage("撤销次数不足", "warn");
        return;
      }
      // 每次使用可撤销最多 2 步
      let steps = 0;
      while (steps < 2) {
        const action = this.history.pop();
        if (!action) break;
        this.undoAction(action);
        steps++;
      }
      if (steps === 0) {
        this.showMessage("没有可撤销的操作", "info");
        return;
      }
      undoItem.remainingUses -= 1;
      this.updateHud();
      this.saveState();
    },

    useShuffle() {
      const item = this.getItem("shuffle");
      if (!item || item.remainingUses <= 0) {
        this.showMessage("洗牌次数不足", "warn");
        return;
      }
      // shuffle types among tiles still on board
      const pool = this.tiles.filter((t) => t.status === "board");
      const types = pool.map((t) => t.type);
      // simple shuffle
      for (let i = types.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [types[i], types[j]] = [types[j], types[i]];
      }
      pool.forEach((t, idx) => (t.type = types[idx]));
      item.remainingUses -= 1;
      this.render();
      this.updateHud();
      this.saveState();
    },

    // 增加道具：内置面板分支
    handleAdd() {
      const addPanel = document.getElementById("add-panel");
      if (!addPanel) return;
      addPanel.classList.toggle("hidden");
      addPanel.setAttribute(
        "aria-hidden",
        addPanel.classList.contains("hidden") ? "true" : "false"
      );
    },

    applyAddAction(value) {
      const v = String(value || "")
        .trim()
        .toLowerCase();
      if (v === "slot" || v === "扩容") {
        SLOT_CAPACITY = clamp(SLOT_CAPACITY + 1, 1, 16);
        this.state.slotCapacity = SLOT_CAPACITY;
        this.showMessage(`槽位容量 +1 → ${SLOT_CAPACITY}`, "info");
      } else if (v === "shuffle" || v === "洗牌") {
        const item = this.getItem("shuffle");
        if (item) {
          item.remainingUses = clamp(item.remainingUses + 1, 0, item.cap);
        }
        this.showMessage("洗牌 +1", "info");
      } else if (v === "undo" || v === "撤销") {
        const item = this.getItem("undo");
        if (item) {
          item.remainingUses = clamp(item.remainingUses + 1, 0, item.cap);
        }
        this.showMessage("撤销 +1", "info");
      } else {
        this.showMessage("无效选择", "warn");
        return;
      }
      this.saveState();
      this.render();
    },

    getItem(id) {
      return this.state.inventory.items.find((it) => it.id === id);
    },

    // --- Win/Lose ---
    checkWin() {
      const remaining = this.tiles.some((t) => t.status !== "gone");
      if (!remaining) {
        this.showMessage("通关！进入下一关", "success");
        setTimeout(() => this.nextLevel(), 600);
      }
    },

    // --- Rendering ---
    render() {
      const ctx = this.ctx;
      const w = this.cssWidth;
      const h = this.cssHeight;
      ctx.clearRect(0, 0, w, h);
      // 使用画布自身的 CSS 背景色，保持与样式一致（亮色暖色、暗色深色）
      let canvasBg = "";
      try {
        canvasBg = getComputedStyle(this.canvas)
          .getPropertyValue("background-color")
          ?.trim();
      } catch {}
      ctx.fillStyle = canvasBg && canvasBg !== "" ? canvasBg : "#1E293B";
      ctx.fillRect(0, 0, w, h);

      // 统计槽位中类型计数，用于“近三连”棋盘引导（计数==2）
      const countByType = {};
      for (const id of this.slot) {
        const t = this.tiles.find((tt) => tt.id === id);
        if (!t) continue;
        countByType[t.type] = (countByType[t.type] || 0) + 1;
      }
      const nearTripleTypes = new Set(
        Object.keys(countByType)
          .filter((k) => countByType[k] === 2)
          .map((k) => Number(k))
      );

      const rects = this.computeTileRects();

      // 计算每个位置的顶层信息
      const positionTopLayers = new Map(); // 存储每个位置(col,row)的最高层级
      const positionTiles = new Map(); // 存储每个位置的所有立方体

      for (const tile of this.tiles) {
        if (tile.status !== "board") continue;
        const posKey = `${tile.col},${tile.row}`;

        if (!positionTiles.has(posKey)) {
          positionTiles.set(posKey, []);
        }
        positionTiles.get(posKey).push(tile);

        const currentMax = positionTopLayers.get(posKey) || -1;
        if (tile.layer > currentMax) {
          positionTopLayers.set(posKey, tile.layer);
        }
      }

      // draw tiles from bottom to top (lower layer first)
      const sorted = [...this.tiles].sort((a, b) => a.layer - b.layer);
      for (const tile of sorted) {
        if (tile.status !== "board") continue; // 只渲染棋盘上的牌
        const r = rects.get(tile.id);
        ctx.save();
        ctx.translate(0, 0);
        // 主题感知的基色
        const isDark = (function () {
          try {
            const t = localStorage.getItem("mlg_theme") || "light";
            if (t === "dark") return true;
            if (t === "system")
              return window.matchMedia("(prefers-color-scheme: dark)").matches;
          } catch {}
          return false;
        })();
        // 颜色由drawCuboid内部的层级颜色系统处理
        const accentColor = null; // 不再使用，由层级颜色系统处理
        const faceColor = null; // 不再使用

        // 使用测试文件的固定立方体参数
        const frontW = r.w; // 使用computeTileRects计算的宽度
        const frontH = r.h; // 使用computeTileRects计算的高度
        const depth = Math.floor(frontW * 0.2); // 深度比例 0.2，与测试文件一致
        const frontX = r.x;
        const frontY = r.y;

        // 移除阴影效果，与测试文件保持一致
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // 计算当前立方体在其位置的相对深度
        const posKey = `${tile.col},${tile.row}`;
        const topLayerAtPos = positionTopLayers.get(posKey);
        const isTopAtPosition = tile.layer === topLayerAtPos;
        const relativeDepth = topLayerAtPos - tile.layer; // 0=顶层，1=下一层，等等

        // 绘制 3D 长方体（方向：向右上）
        this.drawCuboid(ctx, frontX, frontY, frontW, frontH, depth, {
          actualLayer: tile.layer, // 传递层级信息
          isTopAtPosition: isTopAtPosition, // 是否为当前位置的顶层
          relativeDepth: relativeDepth // 相对深度
        });

        // 符号（绘制在前方面中央）- 与测试文件一致
        const symbol = getSymbolForType(tile.type);
        // 立方体前面是正方形，图标大小接近整个前面
        const fontSize = Math.floor(Math.min(frontW, frontH) * 0.9); // 前面的90%作为字体大小
        const sx = frontX + frontW / 2;
        const sy = frontY + frontH / 2; // 前方面中心
        ctx.font = `${fontSize}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // 主符号 - 根据相对深度调整颜色
        // 顶层符号最清晰，下层逐渐透明
        if (isTopAtPosition) {
          // 当前位置顶层符号：深色，高对比度
          ctx.fillStyle = 'rgba(31, 41, 55, 1)';
        } else {
          // 下层符号：相对深度越大越透明
          const symbolOpacity = Math.max(0.3, 1 - (relativeDepth * 0.25)); // 最低30%透明度
          ctx.fillStyle = `rgba(31, 41, 55, ${symbolOpacity})`;
        }
        ctx.fillText(symbol, sx, sy);

        const covered = tile.status === "board" && this.isCovered(tile, rects);
        // overlay for non-selectable
        if (covered) {
          // 优化覆盖效果，使用更明显的遮罩
          ctx.fillStyle = isDark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.6)";
          // 仅覆盖前方面区域
          const cornerRadius = Math.max(
            4,
            Math.floor(Math.min(frontW, frontH) * 0.08)
          );
          this.createRoundedRectPath(
            ctx,
            frontX,
            frontY,
            frontW,
            frontH,
            cornerRadius
          );
          ctx.fill();

          // 添加"锁定"图标或效果
          ctx.fillStyle = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
          const lockSize = Math.min(frontW, frontH) * 0.3;
          ctx.font = `${lockSize}px system-ui`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("🔒", frontX + frontW / 2, frontY + frontH / 2);
        }
        // near-triple guidance highlight (only for selectable tiles)
        if (!covered && nearTripleTypes.has(tile.type)) {
          ctx.save();
          // 使用发光效果
          ctx.shadowColor = "#22c55e";
          ctx.shadowBlur = 8;
          ctx.strokeStyle = "#22c55e"; // green-500
          ctx.lineWidth = 2;
          if (ctx.setLineDash) ctx.setLineDash([8, 4]);
          this.createRoundedRectPath(
            ctx,
            frontX - 1,
            frontY - 1,
            frontW + 2,
            frontH + 2,
            Math.max(4, Math.floor(Math.min(frontW, frontH) * 0.08))
          );
          ctx.stroke();
          if (ctx.setLineDash) ctx.setLineDash([]);
          ctx.restore();
        }
        // highlight
        if (this.highlightTileId === tile.id) {
          ctx.save();
          ctx.shadowColor = "#3b82f6";
          ctx.shadowBlur = 10;
          ctx.strokeStyle = "#3b82f6"; // blue-500
          ctx.lineWidth = 3;
          this.createRoundedRectPath(
            ctx,
            frontX - 2,
            frontY - 2,
            frontW + 4,
            frontH + 4,
            Math.max(4, Math.floor(Math.min(frontW, frontH) * 0.08))
          );
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }

      // Render slot bar (DOM)
      this.renderSlotBar();
    },

    renderSlotBar() {
      const container = document.getElementById("slot-bar");
      // 统计类型出现次数，用于“近三连”高亮（计数==2）
      const countsByType = {};
      this.slot.forEach((id) => {
        const t = this.tiles.find((tt) => tt.id === id);
        if (!t) return;
        countsByType[t.type] = (countsByType[t.type] || 0) + 1;
      });
      const items = this.slot
        .map((id) => this.tiles.find((t) => t.id === id))
        .map((tile) => {
          const color = COLOR_PALETTE[tile.type % COLOR_PALETTE.length];
          const sym = getSymbolForType(tile.type);
          const near = countsByType[tile.type] === 2;
          const nearClass = near ? " near" : "";
          return `<div class="slot-item${nearClass}" data-type="${tile.type}" style="border-color:${color}"><span class="slot-emoji">${sym}</span></div>`;
        });
      // fill empty with placeholders
      const empties = Math.max(0, SLOT_CAPACITY - this.slot.length);
      for (let i = 0; i < empties; i++) {
        items.push('<div class="slot-item empty"></div>');
      }
      container.innerHTML = items.join("");
      // 预警：接近满容量
      const nearFull =
        this.slot.length >= Math.max(1, SLOT_CAPACITY - 1) &&
        this.slot.length < SLOT_CAPACITY;
      container.classList.toggle("warning", nearFull);
      // 同步到 HUD 胶囊的预警样式
      const hudMoves = document.getElementById("hud-moves");
      if (hudMoves) {
        hudMoves.classList.toggle("warning", nearFull);
      }
      if (nearFull && !this.warnedNearFull) {
        this.showMessage("注意：槽位即将满", "warn");
        this.warnedNearFull = true;
      }
      if (!nearFull) {
        this.warnedNearFull = false;
      }
    },

    // --- Toast ---
    showMessage(text, type) {
      try {
        console.log(`[${type}]`, text);
        const container = document.getElementById("toast-container");
        if (!container) {
          return;
        }
        const toast = document.createElement("div");
        toast.className = `toast ${type || "info"}`;
        toast.textContent = String(text || "");
        container.appendChild(toast);
        setTimeout(() => {
          try {
            toast.remove();
          } catch {}
        }, 2500);
      } catch {}
    },
  };

  window.MLG = MLG;
})();
