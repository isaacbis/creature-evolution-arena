import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD0WHOFYEIMZJZjGM4DVDyLvMWwHu638gE",
  authDomain: "creature-evolution-arena.firebaseapp.com",
  projectId: "creature-evolution-arena",
  storageBucket: "creature-evolution-arena.firebasestorage.app",
  messagingSenderId: "326210536234",
  appId: "1:326210536234:web:2f2970166202d920735453",
  measurementId: "G-SFG6D3TTWD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const $ = (id) => document.getElementById(id);

const rolesCatalog = [
  { id: "lupo", name: "Lupo Mannaro", team: "Lupi", desc: "Di notte sceglie una vittima." },
  { id: "contadino", name: "Contadino", team: "Villaggio", desc: "Non ha poteri, vota di giorno." },
  { id: "veggente", name: "Veggente", team: "Villaggio", desc: "Ogni notte controlla un giocatore." },
  { id: "guardia", name: "Guardia", team: "Villaggio", desc: "Protegge un giocatore ogni notte." },
  { id: "strega", name: "Strega", team: "Villaggio", desc: "Ha una pozione salvezza e una pozione morte, se usate questa variante." },
  { id: "cacciatore", name: "Cacciatore", team: "Villaggio", desc: "Quando muore può eliminare qualcuno." },
  { id: "giullare", name: "Giullare", team: "Neutrale", desc: "Vince se viene eliminato dal voto del villaggio." },
  { id: "cupido", name: "Cupido", team: "Villaggio", desc: "La prima notte lega due innamorati." },
  { id: "medium", name: "Medium", team: "Villaggio", desc: "Può ricevere informazioni dai morti." },
  { id: "lupo_alfa", name: "Lupo Alfa", team: "Lupi", desc: "Conta come lupo. Variante avanzata: può trasformare un cittadino." }
];

const defaultRoleCounts = {
  lupo: 2,
  contadino: 4,
  veggente: 1,
  guardia: 1,
  strega: 0,
  cacciatore: 0,
  giullare: 0,
  cupido: 0,
  medium: 0,
  lupo_alfa: 0
};

const narratorLines = {
  night: [
    "Il villaggio si spegne. Chi mente, adesso respira piano.",
    "È notte. Nessuno parla, anche se qualcuno avrebbe molto da spiegare.",
    "Le case si chiudono. I sospetti, invece, restano aperti."
  ],
  day: [
    "Il sole torna sul villaggio. Non è detto che porti buone notizie.",
    "È giorno. Guardatevi negli occhi: qualcuno sta recitando.",
    "Il villaggio si sveglia. Le facce innocenti sono le più pericolose."
  ],
  vote: [
    "È ora di votare. Ricordate: urlare più forte non rende più innocenti.",
    "Si vota. Scegliete bene, o almeno fingete di farlo.",
    "Il villaggio vuole un colpevole. Speriamo non il solito poveraccio."
  ],
  tie: [
    "Parità. Il villaggio ha litigato molto e concluso poco.",
    "Nessun eliminato: sospetti rimandati alla prossima occasione."
  ],
  death: [
    "Il villaggio perde un altro pezzo. Il ruolo resta segreto.",
    "Qualcuno esce dalla partita. Le domande, però, restano."
  ],
  skip: [
    "Il villaggio decide di non votare. Scelta prudente, o molto sospetta.",
    "Niente voto oggi. I lupi ringraziano, forse."
  ]
};

let currentGameId = null;
let currentGame = null;
let unsubscribeGame = null;

function randomLine(type) {
  const lines = narratorLines[type] || [];
  return lines[Math.floor(Math.random() * lines.length)] || "";
}

function show(el) { el?.classList.remove("hidden"); }
function hide(el) { el?.classList.add("hidden"); }

function setConnectionStatus(text, mode) {
  const el = $("connectionStatus");
  el.textContent = text;
  el.className = `status-pill ${mode || ""}`;
}

window.addEventListener("online", () => setConnectionStatus("Online", "online"));
window.addEventListener("offline", () => setConnectionStatus("Offline", "offline"));
setConnectionStatus(navigator.onLine ? "Online" : "Offline", navigator.onLine ? "online" : "offline");

function openModal(title, text, actions = []) {
  $("modalTitle").textContent = title;
  $("modalText").textContent = text;
  const actionsBox = $("modalActions");
  actionsBox.innerHTML = "";

  actions.forEach(action => {
    const btn = document.createElement("button");
    btn.textContent = action.label;
    btn.className = action.className || "secondary";
    btn.onclick = action.onClick;
    actionsBox.appendChild(btn);
  });

  if (!actions.length) {
    const btn = document.createElement("button");
    btn.textContent = "Ok";
    btn.className = "primary";
    btn.onclick = closeModal;
    actionsBox.appendChild(btn);
  }

  show($("modal"));
}

function closeModal() { hide($("modal")); }
$("closeModalBtn").onclick = closeModal;

async function createGame() {
  try {
    const name = $("gameName").value.trim() || "Partita Lupus";
    const docRef = await addDoc(collection(db, "lupusGames"), {
      name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      phase: "setup",
      dayNumber: 1,
      nightNumber: 1,
      stepIndex: 0,
      players: [],
      roleCounts: defaultRoleCounts,
      rolesAssigned: false,
      votes: {},
      voteOpen: false,
      gameOver: false,
      winner: null,
      lastEvent: ""
    });
    loadGame(docRef.id);
  } catch (err) {
    openModal("Errore", "Non riesco a creare la partita. Controlla connessione e Firestore Rules.");
    console.error(err);
  }
}

function loadGame(gameId) {
  currentGameId = gameId;
  if (unsubscribeGame) unsubscribeGame();

  unsubscribeGame = onSnapshot(doc(db, "lupusGames", gameId), (snap) => {
    if (!snap.exists()) return;
    currentGame = { id: snap.id, ...snap.data() };
    renderAll();
  }, (err) => {
    openModal("Errore Firestore", "Non riesco a leggere la partita. Controlla le regole di Firestore.");
    console.error(err);
  });
}

async function loadSavedGames() {
  try {
    const q = query(collection(db, "lupusGames"), orderBy("updatedAt", "desc"), limit(10));
    const snap = await getDocs(q);
    const box = $("savedGames");
    box.innerHTML = "";

    if (snap.empty) {
      box.innerHTML = `<p class="muted">Nessuna partita salvata.</p>`;
    } else {
      snap.forEach(gameDoc => {
        const game = gameDoc.data();
        const btn = document.createElement("button");
        btn.className = "secondary";
        btn.textContent = game.name || "Partita senza nome";
        btn.onclick = () => loadGame(gameDoc.id);
        box.appendChild(btn);
      });
    }
    show(box);
  } catch (err) {
    openModal("Errore", "Non riesco a caricare le partite salvate.");
    console.error(err);
  }
}

async function saveGamePatch(patch) {
  if (!currentGameId || currentGame?.gameOver && !patch.allowAfterGameOver) return;
  const cleanPatch = { ...patch };
  delete cleanPatch.allowAfterGameOver;
  await updateDoc(doc(db, "lupusGames", currentGameId), {
    ...cleanPatch,
    updatedAt: serverTimestamp()
  });
}

async function addPlayer() {
  const name = $("playerName").value.trim();
  if (!name || !currentGame || currentGame.rolesAssigned) return;
  const players = currentGame.players || [];
  if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    openModal("Nome già usato", "Inserisci un nome diverso per evitare confusione.");
    return;
  }
  players.push({ id: crypto.randomUUID(), name, roleId: null, alive: true });
  $("playerName").value = "";
  await saveGamePatch({ players, rolesAssigned: false });
}

async function removePlayer(playerId) {
  if (currentGame.rolesAssigned) {
    openModal("Partita già iniziata", "Dopo aver assegnato i ruoli non puoi rimuovere giocatori. Usa Elimina manualmente se qualcuno muore.");
    return;
  }
  const players = (currentGame.players || []).filter(p => p.id !== playerId);
  await saveGamePatch({ players, rolesAssigned: false });
}

async function changeRoleCount(roleId, delta) {
  if (currentGame.rolesAssigned) return;
  const roleCounts = { ...(currentGame.roleCounts || defaultRoleCounts) };
  roleCounts[roleId] = Math.max(0, (roleCounts[roleId] || 0) + delta);
  await saveGamePatch({ roleCounts, rolesAssigned: false });
}

function totalRoles() {
  const counts = currentGame?.roleCounts || defaultRoleCounts;
  return Object.values(counts).reduce((sum, n) => sum + Number(n || 0), 0);
}

function hasWolfRole(counts) {
  return (counts.lupo || 0) + (counts.lupo_alfa || 0) > 0;
}

async function assignRoles() {
  const players = [...(currentGame.players || [])];
  const counts = currentGame.roleCounts || defaultRoleCounts;
  const roleIds = [];

  Object.entries(counts).forEach(([roleId, count]) => {
    for (let i = 0; i < count; i++) roleIds.push(roleId);
  });

  if (players.length < 4) {
    openModal("Servono più giocatori", "Ti consiglio almeno 4 giocatori, meglio 8 o più.");
    return;
  }

  if (players.length !== roleIds.length) {
    openModal("Totale non corretto", "Il numero dei ruoli deve essere uguale al numero dei giocatori.");
    return;
  }

  if (!hasWolfRole(counts)) {
    openModal("Manca il lupo", "Aggiungi almeno 1 Lupo Mannaro o 1 Lupo Alfa.");
    return;
  }

  const shuffledRoles = roleIds.sort(() => Math.random() - 0.5);
  const assignedPlayers = players.map((player, index) => ({
    ...player,
    roleId: shuffledRoles[index],
    alive: true
  }));

  await saveGamePatch({
    players: assignedPlayers,
    rolesAssigned: true,
    phase: "night",
    nightNumber: 1,
    dayNumber: 0,
    stepIndex: 0,
    voteOpen: false,
    votes: {},
    gameOver: false,
    winner: null,
    lastEvent: randomLine("night")
  });
}

function getRole(roleId) {
  return rolesCatalog.find(r => r.id === roleId) || { name: "Ruolo sconosciuto", team: "", desc: "" };
}

function isWolf(player) {
  return player.roleId === "lupo" || player.roleId === "lupo_alfa";
}

function checkWinCondition(players) {
  const alive = players.filter(p => p.alive);
  const aliveWolves = alive.filter(isWolf);
  const aliveNonWolves = alive.filter(p => !isWolf(p));

  if (aliveWolves.length === 0) return "Villaggio";
  if (aliveWolves.length >= aliveNonWolves.length) return "Lupi";
  return null;
}

function getNightSteps() {
  const players = currentGame?.players || [];
  const aliveRoles = new Set(players.filter(p => p.alive).map(p => p.roleId));
  const steps = [
    { title: "Tutti dormono", text: "Tutti chiudono gli occhi. Nessuno parla." }
  ];

  if (aliveRoles.has("cupido") && currentGame.nightNumber === 1) {
    steps.push({ title: "Cupido", text: "Cupido apre gli occhi e indica due innamorati. Poi richiude gli occhi." });
  }
  if (aliveRoles.has("lupo") || aliveRoles.has("lupo_alfa")) {
    steps.push({ title: "Lupi Mannari", text: "I lupi aprono gli occhi, si riconoscono e scelgono una vittima. Poi richiudono gli occhi." });
  }
  if (aliveRoles.has("veggente")) {
    steps.push({ title: "Veggente", text: "Il veggente apre gli occhi e indica una persona da controllare. Il narratore risponde solo con sì o no." });
  }
  if (aliveRoles.has("guardia")) {
    steps.push({ title: "Guardia", text: "La guardia apre gli occhi e sceglie una persona da proteggere questa notte." });
  }
  if (aliveRoles.has("strega")) {
    steps.push({ title: "Strega", text: "La strega apre gli occhi. Può decidere se usare una pozione, secondo le regole scelte dal gruppo." });
  }
  if (aliveRoles.has("medium")) {
    steps.push({ title: "Medium", text: "Il medium apre gli occhi e riceve eventuali informazioni sui morti." });
  }

  steps.push({ title: "Risveglio", text: "Tutti aprono gli occhi. Annuncia cosa è successo durante la notte senza rivelare ruoli." });
  return steps;
}

function getDaySteps() {
  return [
    { title: "Discussione", text: "I vivi discutono, accusano, si difendono e cercano i lupi." },
    { title: "Decisione", text: "Il villaggio può votare oppure saltare la votazione e passare alla notte." }
  ];
}

function getSteps() {
  return currentGame?.phase === "day" ? getDaySteps() : getNightSteps();
}

async function nextStep() {
  if (currentGame.gameOver) return;
  const steps = getSteps();
  const stepIndex = currentGame.stepIndex || 0;

  if (stepIndex < steps.length - 1) {
    await saveGamePatch({ stepIndex: stepIndex + 1 });
  } else if (currentGame.phase === "night") {
    await startDay();
  } else {
    await startNight();
  }
}

async function prevStep() {
  if (currentGame.gameOver) return;
  const stepIndex = currentGame.stepIndex || 0;
  if (stepIndex > 0) await saveGamePatch({ stepIndex: stepIndex - 1 });
}

async function goDay() {
  if (currentGame.gameOver) return;
  await startDay();
}

async function startDay(extra = {}) {
  if (currentGame.gameOver) return;
  await saveGamePatch({
    phase: "day",
    stepIndex: 0,
    dayNumber: (currentGame.dayNumber || 0) + 1,
    voteOpen: false,
    votes: {},
    lastEvent: extra.lastEvent || randomLine("day")
  });
}

async function startNight(extra = {}) {
  if (currentGame.gameOver) return;
  await saveGamePatch({
    phase: "night",
    stepIndex: 0,
    nightNumber: (currentGame.nightNumber || 1) + 1,
    voteOpen: false,
    votes: {},
    lastEvent: extra.lastEvent || randomLine("night")
  });
}

async function openVote() {
  if (currentGame.gameOver || currentGame.phase !== "day") return;
  await saveGamePatch({ voteOpen: true, votes: {}, stepIndex: 1, lastEvent: randomLine("vote") });
}

async function skipVote() {
  if (currentGame.gameOver || currentGame.phase !== "day") return;
  await startNight({ lastEvent: randomLine("skip") });
}

async function setVote(voterId, targetId) {
  if (!currentGame.voteOpen || currentGame.gameOver) return;
  const voter = currentGame.players.find(p => p.id === voterId && p.alive);
  if (!voter) return;

  const votes = { ...(currentGame.votes || {}) };

  // Se il narratore rimette "Scegli...", togliamo quel voto.
  if (!targetId) {
    delete votes[voterId];
    await saveGamePatch({ votes });
    return;
  }

  const target = currentGame.players.find(p => p.id === targetId && p.alive);
  if (!target) return;

  votes[voterId] = targetId;
  await saveGamePatch({ votes });
}

async function resolveVote(force = false) {
  if (!currentGame.voteOpen || currentGame.gameOver) return;
  const players = currentGame.players || [];
  const alive = players.filter(p => p.alive);
  const votes = currentGame.votes || {};

  const validVotesCount = alive.filter(p => votes[p.id]).length;
  if (!force && validVotesCount < alive.length) {
    openModal(
      "Voti incompleti",
      `Hanno votato ${validVotesCount} giocatori su ${alive.length}. Vuoi contare comunque i voti?`,
      [
        { label: "Aspetta", className: "secondary", onClick: closeModal },
        { label: "Conta comunque", className: "danger", onClick: async () => { closeModal(); await resolveVote(true); } }
      ]
    );
    return;
  }

  const counts = {};

  Object.values(votes).forEach(targetId => {
    if (alive.some(p => p.id === targetId)) counts[targetId] = (counts[targetId] || 0) + 1;
  });

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    await startNight({ lastEvent: "Nessun voto valido. Il villaggio passa alla notte." });
    return;
  }

  const [topId, topVotes] = entries[0];
  const tied = entries.filter(([, n]) => n === topVotes);
  if (tied.length > 1) {
    await startNight({ lastEvent: randomLine("tie") });
    return;
  }

  const eliminated = players.find(p => p.id === topId);
  const updatedPlayers = players.map(p => p.id === topId ? { ...p, alive: false } : p);
  const winner = checkWinCondition(updatedPlayers);

  if (winner) {
    await saveGamePatch({
      players: updatedPlayers,
      voteOpen: false,
      votes: {},
      gameOver: true,
      winner,
      lastEvent: `${eliminated?.name || "Un giocatore"} è stato eliminato. Il ruolo resta segreto. Vince: ${winner}.`,
      allowAfterGameOver: true
    });
  } else {
    await saveGamePatch({
      players: updatedPlayers,
      phase: "night",
      stepIndex: 0,
      nightNumber: (currentGame.nightNumber || 1) + 1,
      voteOpen: false,
      votes: {},
      lastEvent: `${eliminated?.name || "Un giocatore"} è stato eliminato. Il ruolo resta segreto. ${randomLine("death")}`
    });
  }
}

function choosePlayerToKill() {
  if (currentGame.gameOver) return;
  const alive = (currentGame.players || []).filter(p => p.alive);
  const actions = alive.map(player => ({
    label: player.name,
    className: "danger",
    onClick: async () => {
      const players = currentGame.players.map(p => p.id === player.id ? { ...p, alive: false } : p);
      const winner = checkWinCondition(players);
      await saveGamePatch({
        players,
        ...(winner ? { gameOver: true, winner, voteOpen: false, lastEvent: `${player.name} è morto. Il ruolo resta segreto. Vince: ${winner}.`, allowAfterGameOver: true } : { lastEvent: `${player.name} è morto. Il ruolo resta segreto.` })
      });
      closeModal();
    }
  }));
  openModal("Elimina giocatore", "Scegli chi è morto. Il ruolo non verrà mostrato ai giocatori.", actions);
}

async function resetGame() {
  openModal("Reset partita", "Vuoi davvero cancellare questa partita dal database?", [
    { label: "Annulla", className: "secondary", onClick: closeModal },
    { label: "Cancella", className: "danger", onClick: async () => {
      await deleteDoc(doc(db, "lupusGames", currentGameId));
      currentGameId = null;
      currentGame = null;
      if (unsubscribeGame) unsubscribeGame();
      closeModal();
      location.reload();
    }}
  ]);
}

function renderAll() {
  if (!currentGame) return;
  show($("playersSection"));
  show($("rolesSection"));

  if (currentGame.rolesAssigned) {
    show($("roleRevealSection"));
    show($("gameSection"));
  } else {
    hide($("roleRevealSection"));
    hide($("gameSection"));
  }

  $("currentGameLabel").textContent = `Partita: ${currentGame.name}`;
  renderPlayers();
  renderRoles();
  renderRevealList();
  renderGame();
}

function renderPlayers() {
  const box = $("playersList");
  const players = currentGame.players || [];
  box.innerHTML = "";

  if (!players.length) {
    box.innerHTML = `<p class="muted">Aggiungi i giocatori.</p>`;
    return;
  }

  players.forEach(player => {
    const row = document.createElement("div");
    row.className = `item ${player.alive ? "" : "dead"}`;
    row.innerHTML = `
      <div>
        <div class="item-title">${escapeHtml(player.name)}</div>
        <div class="item-sub">${currentGame.rolesAssigned ? (player.alive ? "Vivo" : "Morto · ruolo nascosto") : "In attesa"}</div>
      </div>
      <button class="danger ghost">Rimuovi</button>
    `;
    row.querySelector("button").onclick = () => removePlayer(player.id);
    box.appendChild(row);
  });
}

function renderRoles() {
  const box = $("rolesGrid");
  const counts = currentGame.roleCounts || defaultRoleCounts;
  box.innerHTML = "";

  rolesCatalog.forEach(role => {
    const div = document.createElement("div");
    div.className = "role-control";
    div.innerHTML = `
      <div class="top">
        <div>
          <strong>${role.name}</strong>
          <small>${role.team}</small>
        </div>
      </div>
      <div class="stepper">
        <button class="secondary minus" ${currentGame.rolesAssigned ? "disabled" : ""}>−</button>
        <span>${counts[role.id] || 0}</span>
        <button class="secondary plus" ${currentGame.rolesAssigned ? "disabled" : ""}>+</button>
      </div>
    `;
    div.querySelector(".minus").onclick = () => changeRoleCount(role.id, -1);
    div.querySelector(".plus").onclick = () => changeRoleCount(role.id, 1);
    box.appendChild(div);
  });

  $("playersCount").textContent = String((currentGame.players || []).length);
  $("rolesCount").textContent = String(totalRoles());
  $("assignRolesBtn").disabled = Boolean(currentGame.rolesAssigned);
}

function renderRevealList() {
  const box = $("revealList");
  const players = currentGame.players || [];
  box.innerHTML = "";

  players.forEach(player => {
    const role = getRole(player.roleId);
    const row = document.createElement("div");
    row.className = `item ${player.alive ? "" : "dead"}`;
    row.innerHTML = `
      <div>
        <div class="item-title">${escapeHtml(player.name)}</div>
        <div class="item-sub">Tocca per vedere il ruolo</div>
      </div>
      <button class="primary">Vedi</button>
    `;
    row.querySelector("button").onclick = () => openModal(
      player.name,
      `${role.name} — ${role.team}. ${role.desc}`,
      [{ label: "Nascondi", className: "secondary", onClick: closeModal }]
    );
    box.appendChild(row);
  });
}

function renderGame() {
  if (!currentGame?.rolesAssigned) return;

  const phase = currentGame.phase || "night";
  const steps = getSteps();
  const stepIndex = Math.min(currentGame.stepIndex || 0, steps.length - 1);
  const step = steps[stepIndex];

  $("phaseTitle").textContent = currentGame.gameOver
    ? "Partita finita"
    : phase === "day" ? `Giorno ${currentGame.dayNumber || 1}` : `Notte ${currentGame.nightNumber || 1}`;
  $("phaseInstruction").textContent = currentGame.gameOver
    ? `Ha vinto: ${currentGame.winner}`
    : phase === "day" ? "Discussione, sospetti e decisione del villaggio." : "Tutti chiudono gli occhi.";
  $("narratorStepTitle").textContent = currentGame.gameOver ? "Fine partita" : step.title;
  $("narratorStepText").textContent = currentGame.gameOver ? "Il gioco è concluso. Non continuare con altre fasi." : step.text;

  const lastEvent = currentGame.lastEvent || "";
  if (lastEvent) {
    $("lastEventText").textContent = lastEvent;
    show($("lastEventText"));
  } else {
    hide($("lastEventText"));
  }

  if (currentGame.gameOver) {
    $("winnerBox").textContent = `🏆 Vince: ${currentGame.winner}`;
    show($("winnerBox"));
  } else {
    hide($("winnerBox"));
  }

  $("prevStepBtn").disabled = currentGame.gameOver || currentGame.voteOpen || (phase !== "night" && phase !== "day");
  $("nextStepBtn").disabled = currentGame.gameOver || currentGame.voteOpen;
  $("killPlayerBtn").disabled = currentGame.gameOver;
  $("newDayBtn").disabled = currentGame.gameOver || phase === "day" || currentGame.voteOpen;

  if (!currentGame.gameOver && !currentGame.voteOpen) {
    show($("nightControls"));
  } else {
    hide($("nightControls"));
  }

  if (!currentGame.gameOver && phase === "day" && !currentGame.voteOpen) {
    show($("dayControls"));
  } else {
    hide($("dayControls"));
  }

  if (!currentGame.gameOver && currentGame.voteOpen) {
    show($("voteSection"));
    renderVoteList();
  } else {
    hide($("voteSection"));
  }

  const aliveBox = $("alivePlayers");
  aliveBox.innerHTML = "";
  (currentGame.players || []).forEach(player => {
    const role = getRole(player.roleId);
    const row = document.createElement("div");
    row.className = `item ${player.alive ? "" : "dead"}`;
    row.innerHTML = `
      <div>
        <div class="item-title">${escapeHtml(player.name)}</div>
        <div class="item-sub">${player.alive ? "Vivo" : "Morto"} · ${role.name}</div>
      </div>
    `;
    aliveBox.appendChild(row);
  });
}

function renderVoteList() {
  const box = $("voteList");
  const players = currentGame.players || [];
  const alive = players.filter(p => p.alive);
  const votes = currentGame.votes || {};
  box.innerHTML = "";

  alive.forEach(voter => {
    const row = document.createElement("div");
    row.className = "vote-row";
    const selected = votes[voter.id] || "";
    row.innerHTML = `
      <label>${escapeHtml(voter.name)} vota:</label>
      <select data-voter="${voter.id}">
        <option value="">Scegli...</option>
        ${alive.filter(target => target.id !== voter.id).map(target => `
          <option value="${target.id}" ${selected === target.id ? "selected" : ""}>${escapeHtml(target.name)}</option>
        `).join("")}
      </select>
    `;
    row.querySelector("select").onchange = (event) => setVote(voter.id, event.target.value);
    box.appendChild(row);
  });

  const voteCount = alive.filter(p => votes[p.id]).length;
  const info = document.createElement("p");
  info.className = "muted";
  info.textContent = `Voti registrati: ${voteCount}/${alive.length}`;
  box.appendChild(info);

  $("resolveVoteBtn").disabled = voteCount === 0;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function bindClick(id, handler) {
  const el = $(id);
  if (el) el.onclick = handler;
  else console.warn(`Elemento mancante: #${id}`);
}

bindClick("createGameBtn", createGame);
bindClick("loadGamesBtn", loadSavedGames);
bindClick("addPlayerBtn", addPlayer);
bindClick("assignRolesBtn", assignRoles);
bindClick("nextStepBtn", nextStep);
bindClick("prevStepBtn", prevStep);
bindClick("newDayBtn", goDay);
bindClick("killPlayerBtn", choosePlayerToKill);
bindClick("resetGameBtn", resetGame);
bindClick("openVoteBtn", openVote);
bindClick("skipVoteBtn", skipVote);
bindClick("resolveVoteBtn", () => resolveVote(false));

const playerNameInput = $("playerName");
if (playerNameInput) {
  playerNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addPlayer();
  });
}
