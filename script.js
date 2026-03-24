// Stato principale
let players = [];
let nations = [];
let history = [];

// Totali fissi presi dal JSON (13 / 13)
let totalPlayers = 0;
let totalNations = 0;

// Carica i dati dal file JSON esterno
async function loadData() {
  try {
    const response = await fetch("data.json");
    const data = await response.json();

    // Totali fissi dal JSON
    totalPlayers = data.players.length;
    totalNations = data.nations.length;

    // Se il localStorage è vuoto, usa i dati del JSON
    players = JSON.parse(localStorage.getItem("wc_p")) || [...data.players];
    nations = JSON.parse(localStorage.getItem("wc_n")) || [...data.nations];
    history = JSON.parse(localStorage.getItem("wc_h")) || [];

    render();
  } catch (error) {
    console.error("Errore nel caricamento dei dati:", error);
  }
}

// Salva su localStorage
function save() {
  localStorage.setItem("wc_p", JSON.stringify(players));
  localStorage.setItem("wc_n", JSON.stringify(nations));
  localStorage.setItem("wc_h", JSON.stringify(history));
}

// Reset totale app
window.resetApp = function () {
  if (confirm("Resettare il sorteggio?")) {
    localStorage.clear();
    location.reload();
  }
};

// Funzione di render principale
function render() {
  // Contatori in alto (totali) e sulle urne (rimasti)
  const c1 = document.getElementById("c1");   // tot partecipanti
  const c2 = document.getElementById("c2");   // tot nazionali
  const c1b = document.getElementById("c1b"); // partecipanti rimasti
  const c2b = document.getElementById("c2b"); // nazionali rimaste

  if (c1) c1.textContent = totalPlayers;
  if (c2) c2.textContent = totalNations;
  if (c1b) c1b.textContent = players.length;
  if (c2b) c2b.textContent = nations.length;

  // Render palline
  renderBalls(players, "playersBalls", false);
  renderBalls(nations, "nationsBalls", true);

  // Liste sotto le urne
  renderLists();

  // Cronologia
  renderHistory();

  // Stato pulsante sorteggio
  const btnDraw = document.getElementById("btnDraw");
  if (btnDraw) {
    btnDraw.disabled = players.length === 0 || nations.length === 0;
  }

  // Messaggi nelle box risultato se non bloccate
  const playerResultBox = document.getElementById("playerResult");
  const nationResultBox = document.getElementById("nationResult");
  if (playerResultBox && !playerResultBox.dataset.locked) {
    playerResultBox.textContent = "Premi “ESegui sorteggio”";
  }
  if (nationResultBox && !nationResultBox.dataset.locked) {
    nationResultBox.textContent = "Premi “ESegui sorteggio”";
  }
}

// Disegna le palline dentro l’urna
function renderBalls(list, containerId, isNation) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = list
    .map((item, i) => {
      const x = 10 + (i % 4) * 20;
      const y = 25 + Math.floor(i / 4) * 18;
      const delay = (Math.random() * 0.4).toFixed(2) + "s";
      const tx = Math.random() * 100 - 50 + "px";
      const ty = Math.random() * -160 - 40 + "px";

      let style = `left:${x}%; top:${y}%; --delay:${delay}; --tx:${tx}; --ty:${ty};`;

      if (isNation) {
        // caso speciale: Inghilterra con croce rossa
        if (item.name === "Inghilterra") {
          style += `
            background-color: #ffffff;
            background-image:
              linear-gradient(#ce1124, #ce1124),
              linear-gradient(#ce1124, #ce1124);
            background-size:
              28% 100%,   /* barra verticale rossa */
              100% 28%;   /* barra orizzontale rossa */
            background-position:
              50% 50%,    /* centro palla */
              50% 50%;
            background-repeat: no-repeat;
          `;
        } else {
          // resto nazionali: bandiera a strisce
          const grad = `linear-gradient(135deg, ${item.colors[0]} 33%, ${item.colors[1]} 33%, ${item.colors[1]} 66%, ${item.colors[2]} 66%)`;
          style += `background:${grad};`;
        }

        return `<div class="ball" style="${style}" title="${item.name}"></div>`;
      } else {
        // item è una stringa (nome giocatore)
        style += `background:radial-gradient(circle at 30% 30%, #fff, var(--gold)); color:#000;`;
        const initials = item
          .split(" ")
          .map((p) => p[0])
          .join("");
        return `<div class="ball" style="${style}" title="${item}">${initials}</div>`;
      }
    })
    .join("");
}

// Liste testuali sotto le urne
function renderLists() {
  const playersListEl = document.getElementById("playersList");
  const nationsListEl = document.getElementById("nationsList");

  if (playersListEl) {
    playersListEl.innerHTML = players
      .map((p) => `<div class="list-item">${p}</div>`)
      .join("");
  }

  if (nationsListEl) {
    nationsListEl.innerHTML = nations
      .map((n) => `<div class="list-item">${n.name}</div>`)
      .join("");
  }
}

// Cronologia con freccia centrata
function renderHistory() {
  const container = document.getElementById("historyList");
  if (!container) return;

  container.innerHTML = history
    .map(
      (h) => `
    <div class="history-entry">
      <div class="history-left">
        <span class="history-name">${h.player}</span>
      </div>
      <div class="history-arrow">
        <span class="material-symbols-rounded">trending_flat</span>
      </div>
      <div class="history-right">
        <span class="history-team">${h.nation}</span>
      </div>
    </div>
  `
    )
    .join("");
}

// Logica sorteggio singolo
function drawOnce() {
  if (players.length === 0 || nations.length === 0) {
    alert("Non ci sono abbastanza giocatori o nazionali per il sorteggio.");
    return;
  }

  // Attiva animazione palline
  toggleMixing(true);

  // Delay per simulare mescolamento
  setTimeout(() => {
    // Giocatore: ultimo inserito esce per primo (LIFO)
    const playerIndex = players.length - 1;

    // Nazionale: casuale, come prima
    const nationIndex = Math.floor(Math.random() * nations.length);

    const player = players.splice(playerIndex, 1)[0];
    const nation = nations.splice(nationIndex, 1)[0];

    // Aggiorna risultato visivo
    const playerResultBox = document.getElementById("playerResult");
    const nationResultBox = document.getElementById("nationResult");

    if (playerResultBox) {
      playerResultBox.textContent = player;
      playerResultBox.dataset.locked = "1";
    }
    if (nationResultBox) {
      nationResultBox.textContent = nation.name;
      nationResultBox.dataset.locked = "1";
    }

    // Aggiungi a cronologia
    history.unshift({
      player,
      nation: nation.name,
      timestamp: new Date().toISOString()
    });

    // Ferma animazione e rerender
    toggleMixing(false);
    save();
    render();
  }, 800);
}

// Aggiunge/rimuove la classe .mixing alle urne
function toggleMixing(isMixing) {
  const urnPlayers = document.getElementById("urnPlayers");
  const urnNations = document.getElementById("urnNations");
  if (urnPlayers) {
    urnPlayers.classList.toggle("mixing", isMixing);
  }
  if (urnNations) {
    urnNations.classList.toggle("mixing", isMixing);
  }
}

// Testo per WhatsApp
function buildWhatsappText() {
  if (history.length === 0) {
    return "Nessun sorteggio effettuato.";
  }

  const lines = history
    .slice() // copia
    .reverse() // dal primo sorteggio all'ultimo
    .map((h, i) => `${i + 1}) ${h.player} -> ${h.nation}`);

  return "Sorteggio Mondiale:\n\n" + lines.join("\n");
}

// Apertura WhatsApp
function sendWhatsapp() {
  const text = encodeURIComponent(buildWhatsappText());
  const url = `https://wa.me/?text=${text}`;
  window.open(url, "_blank");
}

// Inizializzazione
document.addEventListener("DOMContentLoaded", () => {
  loadData();

  const btnDraw = document.getElementById("btnDraw");
  if (btnDraw) {
    btnDraw.addEventListener("click", drawOnce);
  }

  const btnWa = document.getElementById("btnWa");
  if (btnWa) {
    btnWa.addEventListener("click", sendWhatsapp);
  }
});
