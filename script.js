/* ═══════════════════════════════════════════
   WORLD CUP DRAW 2026 — script.js
   ═══════════════════════════════════════════ */

let players      = [];
let nations      = [];
let history      = [];
let totalPlayers = 0;
let totalNations = 0;
let isDrawing    = false;

const FLAG_MAP = {
  "Spagna":      "🇪🇸",
  "Argentina":   "🇦🇷",
  "Francia":     "🇫🇷",
  "Inghilterra": "En",
  "Brasile":     "🇧🇷",
  "Portogallo":  "🇵🇹",
  "Olanda":      "🇳🇱",
  "Marocco":     "🇲🇦",
  "Belgio":      "🇧🇪",
  "Germania":    "🇩🇪",
  "Croazia":     "🇭🇷",
  "Senegal":     "🇸🇳",
  "Italia":      "🇮🇹"
};

function getFlag(nation) {
  return nation.flag || FLAG_MAP[nation.name] || "🏳️";
}

/* ── LOAD ───────────────────────────── */
async function loadData() {
  try {
    const res  = await fetch("data.json");
    const data = await res.json();

    totalPlayers = data.players.length;
    totalNations = data.nations.length;

    const savedP = localStorage.getItem("wc26_p");
    const savedN = localStorage.getItem("wc26_n");
    const savedH = localStorage.getItem("wc26_h");

    players = savedP ? JSON.parse(savedP) : [...data.players];
    nations = savedN ? JSON.parse(savedN) : [...data.nations];
    history = savedH ? JSON.parse(savedH) : [];

    render();
  } catch (e) {
    console.error("Errore caricamento dati:", e);
  }
}

/* ── SAVE ───────────────────────────── */
function save() {
  localStorage.setItem("wc26_p", JSON.stringify(players));
  localStorage.setItem("wc26_n", JSON.stringify(nations));
  localStorage.setItem("wc26_h", JSON.stringify(history));
}

/* ── RESET ──────────────────────────── */
window.resetApp = function () {
  if (confirm("Resettare il sorteggio? Tutti i dati verranno cancellati.")) {
    localStorage.removeItem("wc26_p");
    localStorage.removeItem("wc26_n");
    localStorage.removeItem("wc26_h");
    location.reload();
  }
};

/* ── RENDER ─────────────────────────── */
function render() {
  setText("c1", totalPlayers);
  setText("c2", totalNations);
  setText("c3", history.length);
  setText("c1b", players.length);
  setText("c2b", nations.length);
  setText("historyCount", history.length + (history.length === 1 ? " estrazione" : " estrazioni"));

  const drawn = totalPlayers - players.length;
  const pct   = totalPlayers > 0 ? (drawn / totalPlayers) * 100 : 0;
  const bar   = document.getElementById("progressBar");
  if (bar) bar.style.width = pct + "%";

  const hint = document.getElementById("drawHint");
  if (hint) {
    if (players.length === 0 || nations.length === 0) {
      hint.textContent = "Sorteggio completato! 🏆";
    } else {
      hint.textContent = players.length + " giocatori · " + nations.length + " nazionali rimaste";
    }
  }

  renderBalls(players, "playersBalls", false);
  renderBalls(nations, "nationsBalls", true);
  renderLists();
  renderHistory();

  const btn = document.getElementById("btnDraw");
  if (btn) btn.disabled = (players.length === 0 || nations.length === 0 || isDrawing);

  const empty = document.getElementById("historyEmpty");
  if (empty) empty.classList.toggle("hidden", history.length > 0);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ═══════════════════════════════════════════
   RENDER BALLS
   ─ Nazione normale  → gradient + sigla (ES, IT…)
   ─ Inghilterra      → bianco + croce rossa SVG + "EN"
   ─ Giocatore        → oro + iniziali
   ═══════════════════════════════════════════ */
function renderBalls(list, containerId, isNation) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const cols = 4;
  container.innerHTML = list.map((item, i) => {
    const x     = 6  + (i % cols) * 23;
    const y     = 14 + Math.floor(i / cols) * 24;
    const delay = (Math.random() * 0.4).toFixed(2) + "s";
    const tx    = (Math.random() * 100 - 50).toFixed(0) + "px";
    const ty    = (Math.random() * -130 - 40).toFixed(0) + "px";
    const base  = `left:${x}%;top:${y}%;--delay:${delay};--tx:${tx};--ty:${ty};`;

    if (isNation) {
      const code = item.code || "??";

      /* ── INGHILTERRA: bianco + croce di San Giorgio ── */
      if (item.england) {
        return `
          <div class="ball ball-england" style="${base}" title="${item.name}">
            <svg class="eng-cross" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
              <rect width="36" height="36" rx="18" fill="#FFFFFF"/>
              <!-- croce orizzontale -->
              <rect x="0" y="13" width="36" height="10" rx="0" fill="#CE1124"/>
              <!-- croce verticale -->
              <rect x="13" y="0" width="10" height="36" rx="0" fill="#CE1124"/>
              <!-- maschera circolare -->
              <rect width="36" height="36" rx="18" fill="none"
                stroke="#FFFFFF" stroke-width="0"/>
            </svg>
            <span class="ball-code" style="color:#CE1124;text-shadow:0 1px 2px rgba(255,255,255,.8);">${code}</span>
          </div>`;
      }

      /* ── NAZIONE NORMALE: gradient + sigla ── */
      const c = item.colors;
      let grad;
      if (c.length === 2) {
        grad = `linear-gradient(135deg,${c[0]} 50%,${c[1]} 50%)`;
      } else {
        grad = `linear-gradient(135deg,${c[0]} 33%,${c[1]} 33%,${c[1]} 66%,${c[2]} 66%)`;
      }

      /* Calcola colore testo contrastante rispetto al colore centrale */
      const midColor = c[Math.floor(c.length / 2)];
      const textCol  = contrastColor(midColor);

      return `
        <div class="ball" style="${base}background:${grad};" title="${item.name}">
          <span class="ball-code" style="color:${textCol};">${code}</span>
        </div>`;

    } else {
      /* ── GIOCATORE: oro + iniziali ── */
      const initials = item.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
      return `
        <div class="ball ball-player" style="${base}" title="${item}">
          ${initials}
        </div>`;
    }
  }).join("");
}

/* Restituisce #fff o #000 in base alla luminosità del colore hex */
function contrastColor(hex) {
  try {
    const h = hex.replace("#","");
    const r = parseInt(h.slice(0,2),16);
    const g = parseInt(h.slice(2,4),16);
    const b = parseInt(h.slice(4,6),16);
    const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
    return lum > 0.55 ? "#1a1a1a" : "#ffffff";
  } catch {
    return "#ffffff";
  }
}

/* ── RENDER LISTS ───────────────────── */
function renderLists() {
  const pEl = document.getElementById("playersList");
  const nEl = document.getElementById("nationsList");

  if (pEl) {
    pEl.innerHTML = players.length
      ? players.map(p => `<div class="list-item"><span>👤</span><span>${p}</span></div>`).join("")
      : `<div class="list-item" style="color:var(--text3);font-style:italic">Nessun giocatore rimasto</div>`;
  }

  if (nEl) {
    nEl.innerHTML = nations.length
      ? nations.map(n => `
          <div class="list-item">
            <span class="list-flag">${getFlag(n)}</span>
            <span>${n.name}</span>
            <span class="list-code">${n.code || ""}</span>
          </div>`).join("")
      : `<div class="list-item" style="color:var(--text3);font-style:italic">Nessuna nazionale rimasta</div>`;
  }
}

/* ── RENDER HISTORY ─────────────────── */
function renderHistory() {
  const container = document.getElementById("historyList");
  if (!container) return;

  container.innerHTML = history.map((h, i) => {
    const num  = history.length - i;
    const flag = h.flag || FLAG_MAP[h.nation] || "🏳️";
    const code = h.code || "";
    return `
      <div class="history-entry">
        <div class="history-left">
          <div class="history-player">
            <span class="history-name">${h.player}</span>
            <span class="history-num">#${num}</span>
          </div>
        </div>
        <div class="history-arrow">→</div>
        <div class="history-right">
          <div class="history-nation">
            <span class="history-flag">${flag}</span>
            <span class="history-team">${h.nation}</span>
            <span class="history-code">${code}</span>
          </div>
        </div>
      </div>`;
  }).join("");
}

/* ── DRAW ───────────────────────────── */
function drawOnce() {
  if (players.length === 0 || nations.length === 0 || isDrawing) return;

  isDrawing = true;
  const btn = document.getElementById("btnDraw");
  if (btn) btn.disabled = true;

  toggleMixing(true);
  triggerFlash();

  setTimeout(() => {
    const pIdx  = players.length - 1;
    const nIdx  = Math.floor(Math.random() * nations.length);

    const player = players.splice(pIdx, 1)[0];
    const nation = nations.splice(nIdx, 1)[0];
    const flag   = getFlag(nation);

    showResult(player, nation, flag);

    history.unshift({
      player,
      nation: nation.name,
      code:   nation.code || "",
      flag:   flag,
      ts:     new Date().toISOString()
    });

    toggleMixing(false);
    isDrawing = false;
    save();
    render();
  }, 900);
}

/* ── SHOW RESULT ────────────────────── */
function showResult(player, nation, flag) {
  const reveal   = document.getElementById("resultReveal");
  const playerEl = document.getElementById("playerResult");
  const nationEl = document.getElementById("nationResult");
  const flagEl   = document.getElementById("resultFlag");
  const codeEl   = document.getElementById("resultCode");

  if (playerEl) playerEl.textContent = player;
  if (nationEl) nationEl.textContent = nation.name;
  if (flagEl)   flagEl.textContent   = flag;
  if (codeEl)   codeEl.textContent   = nation.code ? "(" + nation.code + ")" : "";

  if (reveal) {
    reveal.classList.remove("visible");
    void reveal.offsetWidth;
    reveal.classList.add("visible");
  }
}

/* ── MIXING ─────────────────────────── */
function toggleMixing(on) {
  ["urnPlayers","urnNations"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("mixing", on);
  });
}

/* ── FLASH ──────────────────────────── */
function triggerFlash() {
  const ov = document.getElementById("flashOverlay");
  if (!ov) return;
  ov.classList.add("flash");
  setTimeout(() => ov.classList.remove("flash"), 180);
}

/* ── WHATSAPP ───────────────────────── */
function buildWhatsappText() {
  if (history.length === 0) return "Nessun sorteggio effettuato.";

  const lines = [...history]
    .reverse()
    .map((h, i) => {
      const flag = h.flag || FLAG_MAP[h.nation] || "";
      const code = h.code ? ` (${h.code})` : "";
      return `${i + 1}. ${h.player}  ➜  ${flag} ${h.nation}${code}`;
    });

  return (
    "⚽ *WORLD CUP DRAW — FIFA 2026* ⚽\n" +
    "🇺🇸 🇨🇦 🇲🇽  Coppa del Mondo FIFA 2026\n\n" +
    lines.join("\n") +
    "\n\n" +
    `📊 Estratti: ${history.length} / ${totalPlayers}\n` +
    "🏆 Buona fortuna a tutti!"
  );
}

function sendWhatsapp() {
  const url = `https://wa.me/?text=${encodeURIComponent(buildWhatsappText())}`;
  window.open(url, "_blank");
}

/* ── INIT ───────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  loadData();
  document.getElementById("btnDraw")?.addEventListener("click", drawOnce);
  document.getElementById("btnWa")?.addEventListener("click", sendWhatsapp);
});