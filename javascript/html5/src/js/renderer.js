// Copyright (c) 2016,2026 Oliver Merkel. All rights reserved.
// SPDX-License-Identifier: MIT

const SVG_NS = 'http://www.w3.org/2000/svg';
const VB_W = 1600;
const VB_H = 1220;
const TILE_W = 92;
const TILE_H = 122;
const STEP_X = 94;
const STEP_Y = 124;
const OFFSET_X = 160;
const OFFSET_Y = 110;
const LAYER_SHIFT = 14;

const svgEl = (tag, attrs = {}) => {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
  return el;
};

const paletteForFace = (face, theme) => {
  if (theme === 'Ink') {
    if (face.startsWith('B')) return { fill: '#f5f3ff', accent: '#4c1d95' };
    if (face.startsWith('C')) return { fill: '#ecfeff', accent: '#0e7490' };
    if (face === 'DR') return { fill: '#fef2f2', accent: '#dc2626' };
    if (face === 'DG') return { fill: '#f0fdf4', accent: '#15803d' };
    if (face === 'DW') return { fill: '#f8fafc', accent: '#6b7280' };
    if (face.startsWith('D')) return { fill: '#ecfdf5', accent: '#065f46' };
    if (face.startsWith('W')) return { fill: '#f8fafc', accent: '#0f172a' };
    if (face.startsWith('F')) return { fill: '#fdf4ff', accent: '#a21caf' };
    if (face.startsWith('S')) return { fill: '#fff7ed', accent: '#9a3412' };
    return { fill: '#fafaf9', accent: '#292524' };
  }

  if (face.startsWith('B')) return { fill: '#f0fdf4', accent: '#166534' };
  if (face.startsWith('C')) return { fill: '#eff6ff', accent: '#1d4ed8' };
  if (face === 'DR') return { fill: '#fef2f2', accent: '#dc2626' };
  if (face === 'DG') return { fill: '#f0fdf4', accent: '#16a34a' };
  if (face === 'DW') return { fill: '#f8fafc', accent: '#6b7280' };
  if (face.startsWith('D')) return { fill: '#ecfdf5', accent: '#047857' };
  if (face.startsWith('W')) return { fill: '#f8fafc', accent: '#334155' };
  if (face.startsWith('F')) return { fill: '#ecfeff', accent: '#0e7490' };
  if (face.startsWith('S')) return { fill: '#fff7ed', accent: '#c2410c' };
  return { fill: '#fafaf9', accent: '#44403c' };
};

const createTileGraphics = (face, palette, theme = 'Classic') => {
  const g = svgEl('g');
  const cx = TILE_W / 2;
  const cy = TILE_H / 2;
  const color = palette.accent;

  if (face.startsWith('B')) {
    const num = parseInt(face[1]);
    
    if (num === 1) {
      // B1 "Bird": elaborate side-view multicolored bird with rich detail
      const darkColor = color;
      const lightColor = palette.fill;
      const accentColor = theme === 'Ink' ? '#f59e0b' : '#fbbf24'; // Warm amber/gold
      const wingshadow = theme === 'Ink' ? '#4c1d95' : '#166534'; // Darker wing tone
      
      // Back/rump - darker shaded area
      g.appendChild(svgEl('ellipse', { cx: cx - 8, cy: cy - 2, rx: 8, ry: 10, fill: wingshadow, opacity: '0.7' }));
      
      // Main body - teardrop ellipse
      g.appendChild(svgEl('ellipse', { cx: cx + 2, cy: cy + 4, rx: 14, ry: 17, fill: darkColor, opacity: '0.95' }));
      
      // Breast/underside - lighter cream color
      g.appendChild(svgEl('ellipse', { cx: cx + 4, cy: cy + 8, rx: 9, ry: 12, fill: accentColor, opacity: '0.4' }));
      
      // Wing - large curved filled shape
      g.appendChild(svgEl('path', { d: `M ${cx - 8} ${cy - 4} Q ${cx - 28} ${cy - 8} ${cx - 30} ${cy + 10} Q ${cx - 20} ${cy + 18} ${cx - 6} ${cy + 12}`, stroke: darkColor, 'stroke-width': 0.5, fill: wingshadow, opacity: '0.85' }));
      
      // Wing feather detail - stripes
      g.appendChild(svgEl('path', { d: `M ${cx - 15} ${cy} Q ${cx - 22} ${cy - 2} ${cx - 24} ${cy + 4}`, stroke: darkColor, 'stroke-width': 1.5, fill: 'none', opacity: '0.6' }));
      g.appendChild(svgEl('path', { d: `M ${cx - 12} ${cy + 2} Q ${cx - 20} ${cy + 2} ${cx - 22} ${cy + 10}`, stroke: darkColor, 'stroke-width': 1.5, fill: 'none', opacity: '0.6' }));
      g.appendChild(svgEl('path', { d: `M ${cx - 10} ${cy + 6} Q ${cx - 18} ${cy + 8} ${cx - 20} ${cy + 14}`, stroke: darkColor, 'stroke-width': 1.5, fill: 'none', opacity: '0.6' }));
      
      // Neck - curved bridge
      g.appendChild(svgEl('path', { d: `M ${cx + 8} ${cy - 8} Q ${cx + 12} ${cy - 14} ${cx + 14} ${cy - 20}`, stroke: darkColor, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }));
      
      // Head - side profile circle
      g.appendChild(svgEl('circle', { cx: cx + 16, cy: cy - 22, r: 9, fill: darkColor }));
      
      // Head crest/crown detail
      g.appendChild(svgEl('path', { d: `M ${cx + 18} ${cy - 31} L ${cx + 22} ${cy - 28} L ${cx + 20} ${cy - 26}`, stroke: darkColor, 'stroke-width': 2, fill: darkColor, 'stroke-linejoin': 'round' }));
      
      // Head highlight/cap
      g.appendChild(svgEl('ellipse', { cx: cx + 14, cy: cy - 24, rx: 3, ry: 4, fill: accentColor, opacity: '0.5' }));
      
      // Eye - large and expressive
      g.appendChild(svgEl('circle', { cx: cx + 20, cy: cy - 22, r: 3, fill: '#fff' }));
      g.appendChild(svgEl('circle', { cx: cx + 21, cy: cy - 23, r: 1.8, fill: '#000' }));
      
      // Beak - pointed triangle pointing right
      g.appendChild(svgEl('polygon', { points: `${cx + 22},${cy - 20} ${cx + 32},${cy - 18} ${cx + 22},${cy - 16}`, fill: '#d97706' }));
      g.appendChild(svgEl('polygon', { points: `${cx + 22},${cy - 20} ${cx + 32},${cy - 18} ${cx + 22},${cy - 16}`, stroke: '#b45309', 'stroke-width': 0.5, fill: 'none' }));
      
      // Tail - fan of feathers extending left and down
      // Tail base
      g.appendChild(svgEl('path', { d: `M ${cx - 22} ${cy + 8} L ${cx - 38} ${cy + 10}`, stroke: darkColor, 'stroke-width': 4, 'stroke-linecap': 'round' }));
      // Upper tail feather
      g.appendChild(svgEl('path', { d: `M ${cx - 22} ${cy + 4} Q ${cx - 32} ${cy - 2} ${cx - 40} ${cy - 4}`, stroke: darkColor, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }));
      g.appendChild(svgEl('path', { d: `M ${cx - 22} ${cy + 4} Q ${cx - 32} ${cy - 2} ${cx - 40} ${cy - 4}`, stroke: accentColor, 'stroke-width': 1, fill: 'none', 'stroke-linecap': 'round', opacity: '0.6' }));
      
      // Middle tail feather
      g.appendChild(svgEl('path', { d: `M ${cx - 22} ${cy + 8} Q ${cx - 36} ${cy + 12} ${cx - 44} ${cy + 16}`, stroke: darkColor, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }));
      g.appendChild(svgEl('path', { d: `M ${cx - 22} ${cy + 8} Q ${cx - 36} ${cy + 12} ${cx - 44} ${cy + 16}`, stroke: accentColor, 'stroke-width': 1, fill: 'none', 'stroke-linecap': 'round', opacity: '0.6' }));
      
      // Lower tail feather
      g.appendChild(svgEl('path', { d: `M ${cx - 22} ${cy + 12} Q ${cx - 32} ${cy + 22} ${cx - 40} ${cy + 28}`, stroke: darkColor, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }));
      g.appendChild(svgEl('path', { d: `M ${cx - 22} ${cy + 12} Q ${cx - 32} ${cy + 22} ${cx - 40} ${cy + 28}`, stroke: accentColor, 'stroke-width': 1, fill: 'none', 'stroke-linecap': 'round', opacity: '0.6' }));
      
      // Legs - thin and realistic
      g.appendChild(svgEl('path', { d: `M ${cx - 4} ${cy + 21} L ${cx - 4} ${cy + 32}`, stroke: '#8b6f47', 'stroke-width': 2, 'stroke-linecap': 'round' }));
      g.appendChild(svgEl('path', { d: `M ${cx + 6} ${cy + 21} L ${cx + 6} ${cy + 32}`, stroke: '#8b6f47', 'stroke-width': 2, 'stroke-linecap': 'round' }));
      
      // Feet - simple three-toe marks
      g.appendChild(svgEl('path', { d: `M ${cx - 6} ${cy + 32} L ${cx - 2} ${cy + 32}`, stroke: '#8b6f47', 'stroke-width': 1.5, 'stroke-linecap': 'round' }));
      g.appendChild(svgEl('path', { d: `M ${cx + 4} ${cy + 32} L ${cx + 8} ${cy + 32}`, stroke: '#8b6f47', 'stroke-width': 1.5, 'stroke-linecap': 'round' }));
      g.appendChild(svgEl('circle', { cx: cx - 4, cy: cy + 33, r: 1, fill: '#8b6f47' }));
      g.appendChild(svgEl('circle', { cx: cx + 6, cy: cy + 33, r: 1, fill: '#8b6f47' }));
    } else if (num === 8) {
      // B8: Like other bamboo but with more sophisticated layout
      const layouts = {
        8: [[-19, -20], [19, -20], [-19, 20], [19, 20], [-8, -20], [8, -20], [-8, 20], [8, 20]],
      };
      for (const [dx, dy] of (layouts[num] ?? [[0, 0]])) {
        const rotation = Math.abs(dx) === 8
          ? (Math.sign(dx) === Math.sign(dy) ? 45 : -45)
          : 0;
        const stem = svgEl('g', {
          transform: rotation !== 0
            ? `translate(${cx + dx} ${cy + dy}) rotate(${rotation})`
            : `translate(${cx + dx} ${cy + dy})`,
        });
        stem.appendChild(svgEl('circle', { cx: 0, cy: -10, r: 8, fill: color }));
        stem.appendChild(svgEl('circle', { cx: 0, cy: 0, r: 7, fill: color }));
        stem.appendChild(svgEl('circle', { cx: 0, cy: 10, r: 8, fill: color }));
        stem.appendChild(svgEl('path', { d: 'M 0 -11 L 0 11', stroke: '#fff', 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }));
        g.appendChild(stem);
      }
    } else {
      // B2-B7, B9: Bamboo as 3 simple filled circles with inner white line in patterns
      const layouts = {
        2: [[0, -20], [0, 20]],
        3: [[-16, -20], [16, 0], [-16, 20]],
        4: [[-16, -20], [16, -20], [-16, 20], [16, 20]],
        5: [[-16, -24], [16, -24], [0, 0], [-16, 24], [16, 24]],
        6: [[-16, -26], [16, -26], [-16, 0], [16, 0], [-16, 26], [16, 26]],
        7: [[-16, -28], [0, -28], [16, -28], [-16, 0], [16, 0], [-16, 28], [16, 28]],
        9: [[-22, -24], [0, -24], [22, -24], [-22, 0], [0, 0], [22, 0], [-22, 24], [0, 24], [22, 24]],
      };
      for (const [dx, dy] of (layouts[num] ?? [[0, 0]])) {
        g.appendChild(svgEl('circle', { cx: cx + dx, cy: cy + dy - 6, r: 5, fill: color }));
        g.appendChild(svgEl('circle', { cx: cx + dx, cy: cy + dy, r: 4, fill: color }));
        g.appendChild(svgEl('circle', { cx: cx + dx, cy: cy + dy + 6, r: 5, fill: color }));
        g.appendChild(svgEl('path', { d: `M ${cx + dx} ${cy + dy - 5} L ${cx + dx} ${cy + dy + 5}`, stroke: '#fff', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }));
      }
    }
  } else if (face.startsWith('C')) {
    const num = parseInt(face[1]);
    const chars = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
    g.appendChild(svgEl('text', { x: cx, y: cy + 18, 'text-anchor': 'middle', style: `font:bold 46px Georgia;fill:${color};pointer-events:none;` })).textContent = chars[num - 1];
  } else if (face === 'DR' || face === 'DG' || face === 'DW') {
    const symbols = { DR: '中', DG: '發', DW: '白' };
    g.appendChild(svgEl('circle', { cx, cy, r: 30, fill: color, opacity: '0.3' }));
    g.appendChild(svgEl('text', { x: cx, y: cy + 16, 'text-anchor': 'middle', style: `font:bold 42px Arial;fill:${color};pointer-events:none;` })).textContent = symbols[face];
  } else if (face.startsWith('D')) {
    // Circles suit D1–D9: concentric rings per number
    const num = parseInt(face[1]);
    const layouts = {
      1: [[0, 0]],
      2: [[0, -20], [0, 20]],
      3: [[0, -22], [-18, 14], [18, 14]],
      4: [[-18, -18], [18, -18], [-18, 18], [18, 18]],
      5: [[-18, -24], [18, -24], [0, 0], [-18, 24], [18, 24]],
      6: [[-18, -26], [18, -26], [-18, 0], [18, 0], [-18, 26], [18, 26]],
      7: [[-18, -28], [0, -28], [18, -28], [-18, 0], [18, 0], [-18, 28], [18, 28]],
      8: [[-18, -30], [18, -30], [-18, -10], [18, -10], [-18, 10], [18, 10], [-18, 30], [18, 30]],
      9: [[-22, -24], [0, -24], [22, -24], [-22, 0], [0, 0], [22, 0], [-22, 24], [0, 24], [22, 24]],
    };
    for (const [dx, dy] of (layouts[num] ?? layouts[1])) {
      g.appendChild(svgEl('circle', { cx: cx + dx, cy: cy + dy, r: 9, fill: 'none', stroke: color, 'stroke-width': 3 }));
      g.appendChild(svgEl('circle', { cx: cx + dx, cy: cy + dy, r: 4, fill: color }));
    }
  } else if (face.startsWith('W')) {
    const windSymbols = { E: '→', S: '↓', W: '←', N: '↑' };
    const dir = face.substring(1);
    const symbol = windSymbols[dir] || '◆';
    g.appendChild(svgEl('text', { x: cx, y: cy + 18, 'text-anchor': 'middle', style: `font:bold 46px Arial;fill:${color};pointer-events:none;` })).textContent = symbol;
  } else if (face.startsWith('F')) {
    const num = parseInt(face[1]);
    // Distinct petal counts per flower (5, 6, 4, 8 petals)
    const petalCounts = { 1: 5, 2: 6, 3: 4, 4: 8 };
    const petals = petalCounts[num] ?? 5;
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(angle) * 22;
      const py = cy + Math.sin(angle) * 22;
      g.appendChild(svgEl('circle', { cx: px, cy: py, r: 8, fill: color, opacity: '0.85' }));
    }
    g.appendChild(svgEl('circle', { cx, cy, r: 6, fill: color }));
    // Number badge bottom-right
    g.appendChild(svgEl('text', { x: cx + 26, y: cy + 30, 'text-anchor': 'middle', style: `font:bold 16px Arial;fill:${color};pointer-events:none;` })).textContent = num;
  } else if (face.startsWith('S')) {
    const seasons = ['🌸', '🌞', '🍂', '❄'];
    const seasonNum = parseInt(face[1]);
    g.appendChild(svgEl('text', { x: cx, y: cy + 14, 'text-anchor': 'middle', style: `font:38px Arial;pointer-events:none;` })).textContent = seasons[seasonNum - 1];
  }

  return g;
};

const toPoint = (tile) => ({
  x: OFFSET_X + tile.x * STEP_X + tile.z * LAYER_SHIFT,
  y: OFFSET_Y + tile.y * STEP_Y - tile.z * LAYER_SHIFT,
});

export const createRenderer = (container, onTileClick) => {
  const svg = svgEl('svg', {
    viewBox: `0 0 ${VB_W} ${VB_H}`,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': 'Mahjong Solitaire board',
  });
  svg.style.cssText = 'display:block;width:100%;height:100%;';

  const bg = svgEl('rect', {
    x: 0,
    y: 0,
    width: VB_W,
    height: VB_H,
    fill: 'url(#table-cloth)',
  });

  const defs = svgEl('defs');
  const grad = svgEl('linearGradient', { id: 'table-cloth', x1: '0%', y1: '0%', x2: '100%', y2: '100%' });
  grad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#0b3b2e' }));
  grad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#1f5c45' }));
  defs.appendChild(grad);
  svg.appendChild(defs);
  svg.appendChild(bg);

  const statusText = svgEl('text', {
    x: VB_W / 2,
    y: 56,
    'text-anchor': 'middle',
    style: 'font:700 42px/1 Georgia,serif;fill:#f8fafc;stroke:#052e16;stroke-width:1;',
  });
  svg.appendChild(statusText);

  const tileLayer = svgEl('g');
  svg.appendChild(tileLayer);
  container.appendChild(svg);

  let clickHandlers = [];

  const clearHandlers = () => {
    clickHandlers.forEach(({ el, fn }) => el.removeEventListener('click', fn));
    clickHandlers = [];
  };

  const render = (boardState, freeTileIds = [], selectedTileId = null, hintPair = null, showFree = true, theme = 'Classic') => {
    if (!boardState) return;

    clearHandlers();
    tileLayer.innerHTML = '';

    const freeSet = new Set(showFree ? freeTileIds : []);
    const hintSet = new Set(hintPair ?? []);

    const visibleTiles = boardState.tiles
      .filter((tile) => !tile.removed)
      .sort((a, b) => (a.z - b.z) || (a.y - b.y) || (a.x - b.x));

    for (const tile of visibleTiles) {
      const p = toPoint(tile);
      const g = svgEl('g', { transform: `translate(${p.x} ${p.y})` });
      const plate = svgEl('rect', {
        x: 0,
        y: 0,
        rx: 10,
        ry: 10,
        width: TILE_W,
        height: TILE_H,
        fill: '#e7e5e4',
        stroke: '#78716c',
        'stroke-width': 2,
      });

      const palette = paletteForFace(tile.face, theme);

      const body = svgEl('rect', {
        x: 4,
        y: 4,
        rx: 8,
        ry: 8,
        width: TILE_W - 8,
        height: TILE_H - 8,
        fill: palette.fill,
        stroke: '#fafaf9',
        'stroke-width': 1.6,
      });

      const mark = createTileGraphics(tile.face, palette, theme);

      if (selectedTileId === tile.id) {
        body.setAttribute('stroke', '#22c55e');
        body.setAttribute('stroke-width', '5');
      } else if (hintSet.has(tile.id)) {
        body.setAttribute('stroke', '#f59e0b');
        body.setAttribute('stroke-width', '4');
        body.setAttribute('stroke-dasharray', '8 6');
      } else if (freeSet.has(tile.id)) {
        body.setAttribute('stroke', '#0ea5e9');
        body.setAttribute('stroke-width', '3.5');
      }

      g.appendChild(plate);
      g.appendChild(body);
      g.appendChild(mark);
      tileLayer.appendChild(g);

      const onClick = () => onTileClick(tile.id);
      g.addEventListener('click', onClick);
      clickHandlers.push({ el: g, fn: onClick });
      g.style.cursor = 'pointer';
    }

    if (boardState.isWon) {
      statusText.textContent = `Solved in ${boardState.moves} moves`;
    } else if (boardState.isBlocked) {
      statusText.textContent = 'No more legal pairs - start a new game';
    } else {
      statusText.textContent = `${boardState.remaining} tiles remaining`;
    }
  };

  const updateStatus = (boardState, elapsedSeconds = null) => {
    if (!boardState) return;
    
    if (boardState.isWon) {
      statusText.textContent = `Solved in ${boardState.moves} moves`;
    } else if (boardState.isBlocked) {
      statusText.textContent = 'No more legal pairs - start a new game';
    } else {
      const remaining = `${boardState.remaining} tiles remaining`;
      if (elapsedSeconds !== null && boardState.firstMoveTime) {
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;
        statusText.textContent = `${remaining} | ${timeStr}`;
      } else {
        statusText.textContent = remaining;
      }
    }
  };

  return {
    render,
    updateStatus,
    resize: () => {},
    actionKey: (action) => `${action.firstId}:${action.secondId}`,
  };
};

export { createTileGraphics, paletteForFace, svgEl };
