let players = [];
let nations = [];
let history = [];
let totalPlayers = 0;
let totalNations = 0;
let isDrawing = false;

/* ─── CANVAS BACKGROUND ─── */
(function initCanvas() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function spawnParticles() {
    particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.8 + .4,
      dx: (Math.random() - .5) * .18,
      dy: -(Math.random() * .25 + .05),
      o: Math.random() * .35 + .05,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(232,255,71,.025)';
    ctx.lineWidth = 1;
    for (let i = -H; i < W + H; i += 90) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + H, H);
      ctx.stroke();
    }
    for (let x = 0; x < W; x += 60) {
      for (let y = 0; y < H; y += 60) {
        ctx.fillStyle = 'rgba(255,255,255,.025)';
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const grad1 = ctx.createRadialGradient(W * .15, H * .3, 0, W * .15, H * .3, 400);
    grad1.addColorStop(0, 'rgba(232,255,71,.06)');
    grad1.addColorStop(1, 'transparent');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, W, H);
    const grad2 = ctx.createRadialGradient(W * .85, H * .7, 0, W * .85, H * .7, 350);
    grad2.addColorStop(0, 'rgba(71,255,180,.04)');
    grad2.addColorStop(1, 'transparent');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.fillStyle = `rgba(232,255,71,${p.o})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.dx;
      p.y += p.dy;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
    });
    requestAnimationFrame(draw);
  }

  resize();
  spawnParticles();
  draw();
  window.addEventListener('resize', () => { resize(); spawnParticles(); });
})();

/* ─── FLAG & CODE DATA ─── */
const CODE_TO_EMOJI = {
  ES: '🇪🇸', AR: '🇦🇷', FR: '🇫🇷', EN: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  BR: '🇧🇷', PT: '🇵🇹', NL: '🇳🇱', MA: '🇲🇦',
  BE: '🇧🇪', DE: '🇩🇪', HR: '🇭🇷', SN: '🇸🇳', IT: '🇮🇹',
};

const CODE_TO_FLAGCDN = {
  ES: 'es', AR: 'ar', FR: 'fr', EN: 'gb-eng',
  BR: 'br', PT: 'pt', NL: 'nl', MA: 'ma',
  BE: 'be', DE: 'de', HR: 'hr', SN: 'sn', IT: 'it', NO: 'no',
};

function getFlag(nation) {
  if (typeof nation === 'object') return nation.flag || CODE_TO_EMOJI[nation.code] || '🏳️';
  return '🏳️';
}

/* ─── DATA LOADING ─── */
async function loadData() {
  try {
    const res = await fetch('data.json');
    const data = await res.json();
    totalPlayers = data.players.length;
    totalNations = data.nations.length;
    const savedP = localStorage.getItem('wc26_p');
    const savedN = localStorage.getItem('wc26_n');
    const savedH = localStorage.getItem('wc26_h');
    players = savedP ? JSON.parse(savedP) : [...data.players];
    nations = savedN ? JSON.parse(savedN) : [...data.nations];
    history = savedH ? JSON.parse(savedH) : [];
    render();
  } catch (e) {
    console.error('Errore caricamento dati:', e);
  }
}

function save() {
  localStorage.setItem('wc26_p', JSON.stringify(players));
  localStorage.setItem('wc26_n', JSON.stringify(nations));
  localStorage.setItem('wc26_h', JSON.stringify(history));
}

window.resetApp = function () {
  if (confirm('Resettare il sorteggio? Tutti i dati verranno cancellati.')) {
    localStorage.removeItem('wc26_p');
    localStorage.removeItem('wc26_n');
    localStorage.removeItem('wc26_h');
    location.reload();
  }
};

/* ─── RENDER ─── */
function render() {
  setText('c1', totalPlayers);
  setText('c2', totalNations);
  setText('c3', history.length);
  setText('c1b', players.length);
  setText('c2b', nations.length);
  setText('historyCount', history.length + (history.length === 1 ? ' estrazione' : ' estrazioni'));

  const drawn = totalPlayers - players.length;
  const pct = totalPlayers > 0 ? (drawn / totalPlayers) * 100 : 0;
  const bar = document.getElementById('progressBar');
  if (bar) bar.style.width = pct + '%';

  const hint = document.getElementById('drawHint');
  if (hint) {
    hint.textContent = (players.length === 0 || nations.length === 0)
      ? 'Sorteggio completato! 🏆'
      : `${players.length} giocatori · ${nations.length} nazionali rimaste`;
  }

  renderBalls(players, 'playersBalls', false);
  renderBalls(nations, 'nationsBalls', true);
  renderLists();
  renderHistory();

  const btn = document.getElementById('btnDraw');
  if (btn) btn.disabled = players.length === 0 || nations.length === 0 || isDrawing;

  const empty = document.getElementById('historyEmpty');
  if (empty) empty.classList.toggle('hidden', history.length > 0);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderBalls(list, containerId, isNation) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const cols = 4;
  container.innerHTML = list.map((item, i) => {
    const x = 5 + (i % cols) * 23;
    const y = 12 + Math.floor(i / cols) * 24;
    const delay = (Math.random() * .4).toFixed(2) + 's';
    const tx = (Math.random() * 100 - 50).toFixed(0) + 'px';
    const ty = (Math.random() * -130 - 40).toFixed(0) + 'px';
    const base = `left:${x}%;top:${y}%;--delay:${delay};--tx:${tx};--ty:${ty};`;

    if (isNation) {
      const fc = CODE_TO_FLAGCDN[item.code] || 'un';
      return `
      <div class="ball ball-nation" style="${base}" title="${item.name}">
        <img class="ball-flag-fill" src="https://flagcdn.com/w40/${fc}.png" alt="${item.name}" />
      </div>`;
    } else {
      const initials = item.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
      return `<div class="ball ball-player" style="${base}" title="${item}">${initials}</div>`;
    }
  }).join('');
}

function contrastColor(hex) {
  try {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > .55 ? '#0b0d12' : '#ffffff';
  } catch { return '#ffffff'; }
}

function renderLists() {
  const pEl = document.getElementById('playersList');
  const nEl = document.getElementById('nationsList');
  if (pEl) {
    pEl.innerHTML = players.length
      ? players.map(p => `<div class="list-item"><span class="list-icon">👤</span><span>${p}</span></div>`).join('')
      : `<div class="list-empty">Nessun giocatore rimasto</div>`;
  }
  if (nEl) {
    nEl.innerHTML = nations.length
      ? nations.map(n => {
          const fc = CODE_TO_FLAGCDN[n.code] || 'un';
          return `
          <div class="list-item list-item-nation">
            <img class="list-flag-img" src="https://flagcdn.com/w40/${fc}.png" alt="${n.name}"/>
            <div class="list-nation-info">
              <span class="list-nation-name">${n.name}</span>
              ${n.representative ? `<span class="list-rep-name">⭐ ${n.representative}</span>` : ''}
            </div>
          </div>`;
        }).join('')
      : `<div class="list-empty">Nessuna nazionale rimasta</div>`;
  }
}

function renderHistory() {
  const container = document.getElementById('historyList');
  if (!container) return;
  container.innerHTML = history.map((h, i) => {
    return `
    <div class="history-entry">
      <div class="history-left">
        <div class="history-player">
          <span class="history-name">${h.player}</span>
        </div>
      </div>
      <div class="history-arrow">→</div>
      <div class="history-right">
        <div class="history-nation">
          <img class="list-flag-img" src="https://flagcdn.com/w40/${CODE_TO_FLAGCDN[h.code]||'un'}.png" alt="${h.nation}"/>
          <div class="history-nation-info">
            <span class="history-team">${h.nation}</span>
            ${h.representative ? `<span class="history-rep">⭐ ${h.representative}</span>` : ''}
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ─── DRAW ─── */
function drawOnce() {
  if (players.length === 0 || nations.length === 0 || isDrawing) return;
  isDrawing = true;
  const btn = document.getElementById('btnDraw');
  if (btn) btn.disabled = true;
  toggleMixing(true);
  triggerFlash();

  // Suspense hint animation
  const hint = document.getElementById('drawHint');
  const suspensePhrases = [
    'Mescolando le urne…',
    'Estrazione in corso●',
    'Estrazione in corso●●',
    'Estrazione in corso●●●',
    'Chi sarà il fortunato?',
    'Il destino decide…',
  ];
  let sIdx = 0;
  const suspenseInterval = setInterval(() => {
    if (hint) hint.textContent = suspensePhrases[sIdx % suspensePhrases.length];
    sIdx++;
  }, 500);

  setTimeout(() => {
    clearInterval(suspenseInterval);
    const pIdx = Math.floor(Math.random() * players.length);
    const nIdx = Math.floor(Math.random() * nations.length);
    const player = players.splice(pIdx, 1)[0];
    const nation = nations.splice(nIdx, 1)[0];
    const flag = getFlag(nation);
    showResult(player, nation);
    history.unshift({
      player,
      nation: nation.name,
      code: nation.code || '',
      flag,
      representative: nation.representative || '',
      ts: new Date().toISOString()
    });
    toggleMixing(false);
    isDrawing = false;
    save();
    render();
  }, 3000);
}

function showResult(player, nation) {
  const reveal = document.getElementById('resultReveal');
  const playerEl = document.getElementById('playerResult');
  const nationEl = document.getElementById('nationResult');
  const flagSpan = document.getElementById('resultFlagSpan');
  const repEl = document.getElementById('resultRepresentative');

  if (playerEl) playerEl.textContent = player;
  if (nationEl) nationEl.textContent = nation.name;

  if (repEl) {
    if (nation.representative) {
      repEl.textContent = '⭐ ' + nation.representative;
      repEl.style.display = 'inline-block';
    } else {
      repEl.textContent = '';
      repEl.style.display = 'none';
    }
  }

  if (flagSpan) {
    const fc = CODE_TO_FLAGCDN[nation.code];
    if (fc) {
      flagSpan.src = `https://flagcdn.com/w80/${fc}.png`;
      flagSpan.alt = nation.name;
    } else {
      flagSpan.src = '';
    }
  }

  if (reveal) {
    reveal.classList.remove('visible');
    void reveal.offsetWidth;
    reveal.classList.add('visible');
  }
}

function toggleMixing(on) {
  ['urnPlayers', 'urnNations'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('mixing', on);
  });
}

function triggerFlash() {
  const ov = document.getElementById('flashOverlay');
  if (!ov) return;
  ov.classList.add('flash');
  setTimeout(() => ov.classList.remove('flash'), 180);
}

/* ─── WHATSAPP ─── */
function buildWhatsappText() {
  if (history.length === 0) return 'Nessun sorteggio effettuato.';
  const lines = [...history].reverse().map((h, i) => {
    const rep = h.representative ? ` (${h.representative})` : '';
    return `${i + 1}. ${h.player} ➜ ${h.nation}${rep}`;
  });
  return `WORLD CUP DRAW — FIFA 2026\nCoppa del Mondo 2026 (USA · CAN · MEX)\n\n${lines.join('\n')}\n\nEstratti: ${history.length} / ${totalPlayers}\nBuona fortuna a tutti!`;
}

function sendWhatsapp() {
  window.open(`https://wa.me/?text=${encodeURIComponent(buildWhatsappText())}`, '_blank');
}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  document.getElementById('btnDraw')?.addEventListener('click', drawOnce);
  document.getElementById('btnWa')?.addEventListener('click', sendWhatsapp);
});