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

// CONFIG FIREBASE: ho inserito quella che mi avevi mandato per il gioco di carte.
// Se cambi progetto Firebase, sostituisci questi dati.
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
  { id: "strega", name: "Strega", team: "Villaggio", desc: "Può salvare o avvelenare, secondo variante." },
  { id: "cacciatore", name: "Cacciatore", team: "Villaggio", desc: "Quando muore può eliminare qualcuno." },
  { id: "giullare", name: "Giullare", team: "Neutrale", desc: "Vince se viene eliminato dal voto." },
  { id: "cupido", name: "Cupido", team: "Villaggio", desc: "La prima notte lega due innamorati." },
  { id: "medium", name: "Medium", team: "Villaggio", desc: "Può ricevere informazioni dai morti." },
  { id: "lupo_alfa", name: "Lupo Alfa", team: "Lupi", desc: "Variante: può trasformare un cittadino." }
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

let currentGameId = null;
let currentGame = null;
let unsubscribeGame = null;

function setConnectionStatus(text, mode) {
  const el = $("connectionStatus");
  el.textContent = text;
  el.className = `status-pill ${mode || ""}`;
}

window.addEventListener("online", () => setConnectionStatus("Online", "online"));
window.addEventListener("offline", () => setConnectionStatus("Offline", "offline"));
setConnectionStatus(navigator.onLine ? "Online" : "Offline", navigator.onLine ? "online" : "offline");

function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }

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
  show($("modal"));
}

function closeModal() { hide($("modal")); }
$("closeModalBtn").onclick = closeModal;

async function createGame() {
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
    rolesAssigned: false
  });
  loadGame(docRef.id);
}

function loadGame(gameId) {
  currentGameId = gameId;
  if (unsubscribeGame) unsubscribeGame();

  unsubscribeGame = onSnapshot(doc(db, "lupusGames", gameId), (snap) => {
    if (!snap.exists()) return;
    currentGame = { id: snap.id, ...snap.data() };
    renderAll();
  });
}

async function loadSavedGames() {
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
}

async function saveGamePatch(patch) {
  if (!currentGameId) return;
  await updateDoc(doc(db, "lupusGames", currentGameId), {
    ...patch,
    updatedAt: serverTimestamp()
  });
}

async function addPlayer() {
  const name = $("playerName").value.trim();
  if (!name || !currentGame) return;
  const players = currentGame.players || [];
  players.push({ id: crypto.randomUUID(), name, roleId: null, alive: true });
  $("playerName").value = "";
  await saveGamePatch({ players });
}

async function removePlayer(playerId) {
  const players = (currentGame.players || []).filter(p => p.id !== playerId);
  await saveGamePatch({ players, rolesAssigned: false });
}

async function changeRoleCount(roleId, delta) {
  const roleCounts = { ...(currentGame.roleCounts || defaultRoleCounts) };
  roleCounts[roleId] = Math.max(0, (roleCounts[roleId] || 0) + delta);
  await saveGamePatch({ roleCounts, rolesAssigned: false });
}

function totalRoles() {
  const counts = currentGame?.roleCounts || defaultRoleCounts;
  return Object.values(counts).reduce((sum, n) => sum + Number(n || 0), 0);
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
    dayNumber: 1,
    stepIndex: 0
  });
}

function getRole(roleId) {
  return rolesCatalog.find(r => r.id === roleId) || { name: "Ruolo sconosciuto", team: "", desc: "" };
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

  steps.push({ title: "Risveglio", text: "Tutti aprono gli occhi. Annuncia cosa è successo durante la notte." });
  return steps;
}

function getDaySteps() {
  return [
    { title: "Discussione", text: "I vivi discutono, accusano, si difendono e cercano i lupi." },
    { title: "Votazione", text: "Ogni giocatore vota chi eliminare. Chi prende più voti muore." },
    { title: "Verdetto", text: "Mostra il ruolo dell'eliminato, se la vostra variante lo prevede. Poi passa alla notte successiva." }
  ];
}

function getSteps() {
  return currentGame?.phase === "day" ? getDaySteps() : getNightSteps();
}

async function nextStep() {
  const steps = getSteps();
  const stepIndex = currentGame.stepIndex || 0;

  if (stepIndex < steps.length - 1) {
    await saveGamePatch({ stepIndex: stepIndex + 1 });
  } else if (currentGame.phase === "night") {
    await saveGamePatch({ phase: "day", stepIndex: 0 });
  } else {
    await saveGamePatch({ phase: "night", stepIndex: 0, nightNumber: (currentGame.nightNumber || 1) + 1, dayNumber: (currentGame.dayNumber || 1) + 1 });
  }
}

async function prevStep() {
  const stepIndex = currentGame.stepIndex || 0;
  if (stepIndex > 0) await saveGamePatch({ stepIndex: stepIndex - 1 });
}

async function goDay() {
  await saveGamePatch({ phase: "day", stepIndex: 0 });
}

function choosePlayerToKill() {
  const alive = (currentGame.players || []).filter(p => p.alive);
  const actions = alive.map(player => ({
    label: player.name,
    className: "danger",
    onClick: async () => {
      const players = currentGame.players.map(p => p.id === player.id ? { ...p, alive: false } : p);
      await saveGamePatch({ players });
      closeModal();
    }
  }));
  openModal("Elimina giocatore", "Scegli chi è morto o chi è stato votato.", actions);
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
    const role = player.roleId ? getRole(player.roleId).name : "Ruolo non assegnato";
    const row = document.createElement("div");
    row.className = `item ${player.alive ? "" : "dead"}`;
    row.innerHTML = `
      <div>
        <div class="item-title">${escapeHtml(player.name)}</div>
        <div class="item-sub">${currentGame.rolesAssigned ? role : "In attesa"}</div>
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
        <button class="secondary minus">−</button>
        <span>${counts[role.id] || 0}</span>
        <button class="secondary plus">+</button>
      </div>
    `;
    div.querySelector(".minus").onclick = () => changeRoleCount(role.id, -1);
    div.querySelector(".plus").onclick = () => changeRoleCount(role.id, 1);
    box.appendChild(div);
  });

  $("playersCount").textContent = String((currentGame.players || []).length);
  $("rolesCount").textContent = String(totalRoles());
}

function renderRevealList() {
  const box = $("revealList");
  const players = currentGame.players || [];
  box.innerHTML = "";

  players.forEach(player => {
    const role = getRole(player.roleId);
    const row = document.createElement("div");
    row.className = "item";
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

  $("phaseTitle").textContent = phase === "day" ? `Giorno ${currentGame.dayNumber || 1}` : `Notte ${currentGame.nightNumber || 1}`;
  $("phaseInstruction").textContent = phase === "day" ? "Discussione, accuse e votazione." : "Tutti chiudono gli occhi.";
  $("narratorStepTitle").textContent = step.title;
  $("narratorStepText").textContent = step.text;

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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

$("createGameBtn").onclick = createGame;
$("loadGamesBtn").onclick = loadSavedGames;
$("addPlayerBtn").onclick = addPlayer;
$("assignRolesBtn").onclick = assignRoles;
$("nextStepBtn").onclick = nextStep;
$("prevStepBtn").onclick = prevStep;
$("newDayBtn").onclick = goDay;
$("killPlayerBtn").onclick = choosePlayerToKill;
$("resetGameBtn").onclick = resetGame;

$("playerName").addEventListener("keydown", (event) => {
  if (event.key === "Enter") addPlayer();
});
