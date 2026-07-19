import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  runTransaction
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
const APP_VERSION = "V20";

const ROLES = [
  { id: "wolf", name: "Lupo Mannaro", team: "Lupi", desc: "Di notte sceglie con gli altri lupi una vittima." },
  { id: "villager", name: "Contadino", team: "Villaggio", desc: "Non ha poteri, ma vota e ragiona per trovare i lupi." },
  { id: "seer", name: "Veggente", team: "Villaggio", desc: "Ogni notte controlla un giocatore e scopre se è lupo." },
  { id: "guard", name: "Guardia", team: "Villaggio", desc: "Ogni notte protegge un giocatore." },
  { id: "witch", name: "Strega", team: "Villaggio", desc: "Ha una pozione salvezza e una pozione morte, una volta per partita." },
  { id: "hunter", name: "Cacciatore", team: "Villaggio", desc: "Quando muore può eliminare un altro giocatore." },
  { id: "jester", name: "Giullare", team: "Neutrale", desc: "Vince se viene eliminato con la votazione del villaggio." },
  { id: "medium", name: "Medium", team: "Villaggio", desc: "Può vedere il ruolo di un morto, solo per sé." },
  { id: "cupid", name: "Cupido", team: "Villaggio", desc: "La prima notte lega due innamorati." },
  { id: "mayor", name: "Sindaco", team: "Villaggio", desc: "Il suo voto vale doppio." },
  { id: "alpha", name: "Lupo Alfa", team: "Lupi", desc: "È un lupo. In questa versione conta come lupo speciale." },
  { id: "traitor", name: "Traditore", team: "Lupi", desc: "Vince con i lupi, ma al Veggente risulta non lupo." }
];


const ROLE_ICONS = {
  wolf: "🐺",
  villager: "🌾",
  seer: "🔮",
  guard: "🛡️",
  witch: "🧪",
  hunter: "🏹",
  jester: "🃏",
  medium: "🕯️",
  cupid: "💘",
  mayor: "🎖️",
  alpha: "🐺",
  traitor: "🗡️"
};

function roleIcon(roleId) {
  return ROLE_ICONS[roleId] || "🌙";
}

function setStage(phase) {
  document.body.classList.remove("stage-home", "stage-night", "stage-day", "stage-vote", "stage-end", "stage-lobby");
  const cls = {
    home: "stage-home",
    lobby: "stage-lobby",
    night: "stage-night",
    day: "stage-day",
    vote: "stage-vote",
    hunter: "stage-vote",
    gameOver: "stage-end",
    reveal: "stage-night"
  }[phase] || "stage-home";
  document.body.classList.add(cls);
}

function blip(type = "soft") {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = type === "phase" ? 520 : type === "danger" ? 180 : 330;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {}
}

function openRoleOverlay(roleId, playerName = "") {
  const role = ROLES.find(r => r.id === roleId);
  if (!role) return;
  $("#roleOverlayIcon").textContent = roleIcon(roleId);
  $("#roleOverlayName").textContent = playerName ? `${playerName}` : role.name;
  $("#roleOverlayTeam").textContent = `${role.name} · ${role.team}`;
  $("#roleOverlayDesc").textContent = role.desc;
  $("#roleOverlay").classList.remove("hidden");
  vibrate(45);
  blip("phase");
}

function closeRoleOverlay() {
  $("#roleOverlay").classList.add("hidden");
}


function confirmAction(title, text, onOk, okLabel = "Conferma") {
  $("#confirmTitle").textContent = title;
  $("#confirmText").textContent = text;
  $("#confirmOkBtn").textContent = okLabel;
  $("#confirmModal").classList.remove("hidden");
  $("#confirmCancelBtn").onclick = () => $("#confirmModal").classList.add("hidden");
  $("#confirmOkBtn").onclick = async () => {
    $("#confirmModal").classList.add("hidden");
    await onOk();
  };
}

function addLocalLog(text) {
  if (!local) return;
  local.log = local.log || [];
  local.log.unshift({ at: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), text });
  local.log = local.log.slice(0, 30);
}

async function addRoomLog(text) {
  if (!room?.code || !room?.data) return;
  const log = [{ at: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), text }, ...((room.data.hostLog || []).slice(0, 29))];
  await updateDoc(doc(db, "lupusRooms", room.code), { hostLog: log, updatedAt: serverTimestamp() });
}

function recommendedCounts(n, mode = "auto") {
  const c = Object.fromEntries(ROLES.map(r => [r.id, 0]));
  if (mode === "simple") {
    c.wolf = n >= 8 ? 2 : 1;
    c.seer = 1;
    c.guard = n >= 7 ? 1 : 0;
    c.villager = Math.max(0, n - totalCounts(c));
    return c;
  }
  if (mode === "advanced") {
    c.wolf = n >= 11 ? 3 : n >= 8 ? 2 : 1;
    c.seer = 1;
    c.guard = 1;
    c.witch = n >= 8 ? 1 : 0;
    c.hunter = n >= 9 ? 1 : 0;
    c.jester = n >= 10 ? 1 : 0;
    c.mayor = n >= 11 ? 1 : 0;
    c.medium = n >= 12 ? 1 : 0;
    c.cupid = n >= 12 ? 1 : 0;
    c.traitor = n >= 13 ? 1 : 0;
    c.villager = Math.max(0, n - totalCounts(c));
    return c;
  }
  c.wolf = n >= 11 ? 3 : n >= 8 ? 2 : 1;
  c.seer = 1;
  c.guard = n >= 7 ? 1 : 0;
  c.witch = n >= 8 ? 1 : 0;
  c.hunter = n >= 10 ? 1 : 0;
  c.jester = n >= 11 ? 1 : 0;
  c.mayor = n >= 12 ? 1 : 0;
  c.villager = Math.max(0, n - totalCounts(c));
  return c;
}

function applyCounts(prefix, counts) {
  ROLES.forEach(r => {
    const el = document.querySelector(`[data-${prefix}-role="${r.id}"]`);
    if (el) el.textContent = counts[r.id] || 0;
  });
}

function getLocalNameCount() {
  return $("#localNames").value.split(/\n|,/).map(n => n.trim()).filter(Boolean).length;
}

function getOnlinePlayerCount() {
  return (room.data?.players || []).length || 8;
}

function renderFinalList(containerSel, players) {
  const box = $(containerSel);
  if (!box) return;
  box.innerHTML = (players || []).map(p => `
    <div class="player-row ${p.alive ? "" : "dead"}">
      <span>${roleIcon(p.role)} ${p.name}${p.isBot ? " 🤖" : ""}</span>
      <span class="chip">${roleName(p.role)}</span>
    </div>
  `).join("");
}

function renderLog(containerSel, log) {
  const box = $(containerSel);
  if (!box) return;
  if (!log?.length) {
    box.innerHTML = "<p class='hint'>Nessun evento registrato.</p>";
    return;
  }
  box.innerHTML = log.map(item => `<div class="log-row"><b>${item.at}</b><span>${item.text}</span></div>`).join("");
}

function makeRoomInviteLink(code) {
  return `${location.origin}${location.pathname}#room=${code}`;
}

function updateRoomQr() {
  const canvas = $("#roomQrCanvas");
  const img = $("#roomQrImage");
  const linkBox = $("#roomJoinLink");
  if (!room?.data?.code) return;

  const inviteLink = makeRoomInviteLink(room.data.code);

  if (linkBox) {
    linkBox.innerHTML = `
      <small>Codice stanza</small>
      <b>${room.data.code}</b>
      <small class="invite-url">${inviteLink}</small>
    `;
  }

  // Metodo principale: libreria QRCode su canvas.
  if (canvas && typeof QRCode !== "undefined") {
    try {
      canvas.classList.remove("hidden");
      img?.classList.add("hidden");
      QRCode.toCanvas(
        canvas,
        inviteLink,
        { width: 190, margin: 1, color: { dark: "#ffffff", light: "#00000000" } },
        (err) => {
          if (err) showQrImageFallback(inviteLink);
        }
      );
      return;
    } catch (err) {
      console.warn("QR canvas non disponibile:", err);
    }
  }

  // Fallback: immagine QR da servizio esterno.
  showQrImageFallback(inviteLink);
}

function showQrImageFallback(inviteLink) {
  const canvas = $("#roomQrCanvas");
  const img = $("#roomQrImage");
  if (!img) return;

  canvas?.classList.add("hidden");
  img.classList.remove("hidden");
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(inviteLink)}`;
}

function parseHashRoom() {
  const match = location.hash.match(/room=([A-Z0-9]{4,8})/i);
  if (match) {
    show("joinRoomView");
    $("#joinCode").value = match[1].toUpperCase();
  }
}

const DEFAULT_COUNTS = {
  wolf: 2,
  villager: 4,
  seer: 1,
  guard: 1,
  witch: 0,
  hunter: 0,
  jester: 0,
  medium: 0,
  cupid: 0,
  mayor: 0,
  alpha: 0,
  traitor: 0
};

const DEMO_NAMES = ["Marco", "Giulia", "Luca", "Sara", "Matteo", "Anna", "Davide", "Chiara", "Leo", "Sofia"];
const BOT_NAMES = ["Bot Marco", "Bot Giulia", "Bot Luca", "Bot Sara", "Bot Matteo", "Bot Anna", "Bot Davide", "Bot Chiara", "Bot Leo", "Bot Sofia", "Bot Nico", "Bot Emma"];

const LINES = {
  intro: [
    "Il villaggio sembra tranquillo, ma qualcuno sta già mentendo.",
    "Le lanterne si spengono. Da questo momento fidarsi è un lusso.",
    "Occhi chiusi e facce innocenti: la combinazione perfetta per un disastro."
  ],
  night: [
    "La notte cala sul villaggio. Chi russa è probabilmente innocente... o molto bravo a fingere.",
    "Silenzio. I lupi hanno fame e il villaggio fa finta di dormire.",
    "Tutti chiudono gli occhi. Anche quelli che pensano di essere furbi."
  ],
  wolves: [
    "Lupi, aprite gli occhi. Scegliete con calma: il menù del villaggio è ricco.",
    "I lupi si svegliano. Niente ululati, siamo persone educate.",
    "Lupi, è il vostro momento. Indicate chi non arriverà sereno al mattino."
  ],
  seer: [
    "Veggente, apri gli occhi. Vediamo se oggi l’intuito batte le bugie.",
    "Veggente, scegli qualcuno da controllare. Non fare quella faccia, potresti avere ragione.",
    "Il Veggente indaga. Il villaggio spera che non stia guardando la persona sbagliata."
  ],
  guard: [
    "Guardia, apri gli occhi. Scegli chi merita una notte tranquilla.",
    "La Guardia fa il suo giro. Con un po’ di fortuna protegge la persona giusta.",
    "Guardia, indica chi vuoi proteggere. Niente pressioni, solo la vita di qualcuno."
  ],
  witch: [
    "Strega, apri gli occhi. È il momento delle pozioni e delle decisioni discutibili.",
    "La Strega controlla la sua borsa. Salvezza, veleno e un pizzico di caos.",
    "Strega, scegli bene: una pozione può salvare la partita o rovinarla con stile."
  ],
  day: [
    "Il sole sorge. Qualcuno ha dormito male, qualcuno non ha dormito affatto.",
    "È giorno. Sorridete pure, tanto qualcuno sta mentendo.",
    "Il villaggio si sveglia. Le accuse possono iniziare tra tre, due, uno..."
  ],
  vote: [
    "È ora di votare. Ricordate: urlare più forte non rende più innocenti.",
    "Si vota. Le amicizie finiscono qui, almeno fino alla prossima partita.",
    "Il villaggio deve decidere. Accuse, difese e pessime intuizioni sono benvenute."
  ],
  tie: [
    "Parità. Il villaggio non decide e nessuno viene eliminato.",
    "I voti si annullano. La confusione vince il turno.",
    "Nessuna maggioranza. Ottimo lavoro, oppure pessimo: lo scoprirete più tardi."
  ],
  death: [
    "Brutte notizie al mattino.",
    "Il villaggio conta i presenti... e manca qualcuno.",
    "La notte ha lasciato il segno."
  ],
  safe: [
    "Colpo di scena: nessuno è morto. Per una volta il villaggio ha avuto fortuna.",
    "Questa notte non è morto nessuno. I lupi dovranno rivedere la strategia.",
    "Nessuna vittima stanotte. Qualcuno si prende il merito, anche se magari non c’entra niente."
  ],
  skip: [
    "Il villaggio decide di non votare. Scelta prudente... o codarda, dipende dai punti di vista.",
    "Nessuna eliminazione oggi. I sospetti restano vivi, purtroppo anche i lupi forse.",
    "Votazione saltata. Tutti salvi per ora, ma la notte non fa sconti."
  ]
};

const NIGHT_STEPS = ["cupid", "wolves", "seer", "guard", "witch", "medium", "dawn"];
let local = null;
let room = {
  code: null,
  playerId: localStorage.getItem("lupusPlayerId") || null,
  isHost: false,
  data: null,
  unsub: null,
  revealMine: false,
  narratorShowRoles: false,
  timer: null
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function uid() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function randomLine(type) {
  const arr = LINES[type] || [];
  return arr[Math.floor(Math.random() * arr.length)] || "";
}

function narr(type, text) {
  const prefix = randomLine(type);
  return prefix ? `${prefix} ${text}` : text;
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  vibrate(25);
  setTimeout(() => t.classList.remove("show"), 2600);
}

function showTechnicalError(title, err) {
  const details = [
    title,
    `code: ${err?.code || "nessun codice"}`,
    `message: ${err?.message || String(err)}`,
    "",
    "Se vedi ancora un errore generico dopo aver caricato la V18.2, svuota cache/sito o rimuovi l'app dalla schermata Home e riaprila."
  ].join("\n");
  console.error(title, err);
  const box = $("#errorBox");
  const text = $("#errorBoxText");
  if (box && text) {
    text.textContent = details;
    box.classList.remove("hidden");
  }
  toast(`${title}: ${err?.code || err?.message || "errore sconosciuto"}`);
}

function show(viewId) {
  $$(".screen").forEach((s) => s.classList.remove("active"));
  const view = $("#" + viewId);
  if (view) view.classList.add("active");
  if (viewId === "homeView") setStage("home");
  if (viewId === "onlineChoiceView" || viewId === "joinRoomView") setStage("lobby");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function speak(text) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text || ""));
    u.lang = "it-IT";
    u.rate = 0.93;
    speechSynthesis.speak(u);
  } catch {}
}

function vibrate(ms = 80) {
  try { navigator.vibrate?.(ms); } catch {}
}

function roleName(roleId) {
  return ROLES.find((r) => r.id === roleId)?.name || "Ruolo sconosciuto";
}

function roleDesc(roleId) {
  return ROLES.find((r) => r.id === roleId)?.desc || "";
}

function isWolf(role) {
  return role === "wolf" || role === "alpha";
}

function winsWithWolves(role) {
  return role === "wolf" || role === "alpha" || role === "traitor";
}

function seerResult(role) {
  // Il Traditore aiuta i lupi, ma al Veggente risulta NON LUPO.
  return isWolf(role) ? "LUPO" : "NON LUPO";
}

function alivePlayers(players) {
  return (players || []).filter((p) => p.alive);
}

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function roomCode() {
  return Math.random().toString(36).replace(/[^a-z0-9]/g, "").slice(2, 8).toUpperCase();
}

function totalCounts(counts) {
  return Object.values(counts || {}).reduce((s, n) => s + Number(n || 0), 0);
}

function getCounts(prefix) {
  const counts = {};
  ROLES.forEach((r) => {
    counts[r.id] = Number(document.querySelector(`[data-${prefix}-role="${r.id}"]`)?.textContent || 0);
  });
  return counts;
}

function makeRolePicker(el, prefix, counts = DEFAULT_COUNTS) {
  el.innerHTML = ROLES.map((r) => `
    <div class="role-item">
      <div>
        <span>${r.name}</span>
        <small>${r.team}</small>
      </div>
      <div class="qty">
        <button type="button" data-step-role="${r.id}" data-prefix="${prefix}" data-delta="-1">−</button>
        <b data-${prefix}-role="${r.id}">${counts[r.id] || 0}</b>
        <button type="button" data-step-role="${r.id}" data-prefix="${prefix}" data-delta="1">+</button>
      </div>
    </div>
  `).join("");
}

function validateSetup(names, counts) {
  if (names.length < 5) return "Inserisci almeno 5 giocatori.";
  if (totalCounts(counts) > names.length) return "Hai scelto più ruoli dei giocatori.";
  if ((counts.wolf || 0) + (counts.alpha || 0) < 1) return "Serve almeno un Lupo Mannaro o un Lupo Alfa.";
  return "";
}

function makeDeck(counts, total) {
  const deck = [];
  Object.entries(counts).forEach(([role, count]) => {
    for (let i = 0; i < Number(count || 0); i++) deck.push(role);
  });
  while (deck.length < total) deck.push("villager");
  if (deck.length > total) deck.length = total;
  return shuffled(deck);
}

function makePlayers(names, counts) {
  const deck = makeDeck(counts, names.length);
  return names.map((name, i) => ({
    id: uid(),
    name: name.trim(),
    role: deck[i],
    alive: true,
    isBot: false,
    lover: null
  }));
}

function checkWin(players, reason = "") {
  const alive = alivePlayers(players);
  const wolves = alive.filter((p) => isWolf(p.role)).length;
  const wolfTeam = alive.filter((p) => winsWithWolves(p.role)).length;
  const others = alive.length - wolfTeam;

  if (wolves === 0) return `Il villaggio ha vinto: tutti i lupi sono stati eliminati.${reason ? " " + reason : ""}`;
  if (wolfTeam >= others) return `I lupi hanno vinto: sono pari o superiori agli altri giocatori.${reason ? " " + reason : ""}`;
  return null;
}

function publicDeath(name) {
  return `${name} è morto. Il suo ruolo resta segreto.`;
}

function applyLoversDeath(players, initialDeadIds) {
  const deadIds = new Set(initialDeadIds);
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of players) {
      if (deadIds.has(p.id) && p.lover && !deadIds.has(p.lover)) {
        deadIds.add(p.lover);
        changed = true;
      }
    }
  }
  return players.map((p) => deadIds.has(p.id) ? { ...p, alive: false } : p);
}

function voteWeight(player) {
  return player?.role === "mayor" ? 2 : 1;
}

function countVotes(players, votes) {
  const alive = alivePlayers(players);
  const counts = {};
  Object.entries(votes || {}).forEach(([voterId, targetId]) => {
    const voter = alive.find((p) => p.id === voterId);
    const target = alive.find((p) => p.id === targetId);
    if (!voter || !target) return;
    counts[targetId] = (counts[targetId] || 0) + voteWeight(voter);
  });

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return { targetId: null, tie: false, counts };
  const top = entries[0][1];
  const tied = entries.filter(([, n]) => n === top);
  return { targetId: tied.length === 1 ? entries[0][0] : null, tie: tied.length > 1, counts };
}

function statusHtml(players, phase, votes = {}) {
  const alive = alivePlayers(players);
  const wolvesAlive = alive.filter((p) => isWolf(p.role)).length;
  const dead = players.length - alive.length;
  const voteCount = alive.filter((p) => votes[p.id]).length;
  return `
    <div class="status-grid">
      <div><b>${alive.length}</b><span>Vivi</span></div>
      <div><b>${dead}</b><span>Morti</span></div>
      <div><b>${wolvesAlive}</b><span>Lupi vivi</span></div>
      <div><b>${phase}</b><span>Fase</span></div>
      ${phase === "vote" ? `<div><b>${voteCount}/${alive.length}</b><span>Voti</span></div>` : ""}
    </div>
  `;
}


function setupValidation(prefix, playerCount) {
  const counts = getCounts(prefix);
  const selected = totalCounts(counts);
  const wolves = Number(counts.wolf || 0) + Number(counts.alpha || 0);
  let message = "";
  let ok = true;

  if (playerCount < 5) {
    ok = false;
    message = `Servono almeno 5 giocatori. Ora: ${playerCount}.`;
  } else if (selected > playerCount) {
    ok = false;
    message = `Hai scelto ${selected} ruoli per ${playerCount} giocatori.`;
  } else if (wolves < 1) {
    ok = false;
    message = "Serve almeno un Lupo Mannaro o un Lupo Alfa.";
  } else {
    const autoVillagers = playerCount - selected;
    message = autoVillagers > 0
      ? `${playerCount} giocatori · ${selected} ruoli speciali · ${autoVillagers} Contadini aggiunti automaticamente.`
      : `${playerCount} giocatori · configurazione completa.`;
  }
  return { ok, message, selected, counts };
}

function renderOnlineSetupSummary() {
  const box = $("#onlineSetupSummary");
  const btn = $("#startOnlineGameBtn");
  if (!box || !room.data) return;
  const count = (room.data.players || []).length;
  const validation = setupValidation("online", count);
  box.className = `setup-summary ${validation.ok ? "ok-summary" : "error-summary"}`;
  box.innerHTML = `
    <div><b>${count}</b><span>Giocatori</span></div>
    <div><b>${validation.selected}</b><span>Ruoli scelti</span></div>
    <p>${validation.message}</p>
  `;
  if (btn) btn.disabled = !validation.ok || room.data.phase !== "lobby";
}

async function runDiagnostics() {
  const panel = $("#diagnosticsPanel");
  if (!panel) return;
  panel.classList.remove("hidden");
  panel.innerHTML = `<div class="diag-row pending"><span>⏳</span><div><b>Verifica in corso</b><small>Controllo app, rete, Firestore, QR e cache.</small></div></div>`;

  const results = [];
  results.push({
    label: "Versione app",
    ok: true,
    detail: APP_VERSION
  });
  results.push({
    label: "Connessione",
    ok: navigator.onLine,
    detail: navigator.onLine ? "Dispositivo online" : "Dispositivo offline"
  });

  let firestoreOk = false;
  let firestoreDetail = "";
  const testId = `diag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const testRef = doc(db, "lupusRooms", testId);
  try {
    await setDoc(testRef, {
      code: testId,
      diagnostic: true,
      createdAt: serverTimestamp()
    });
    const snap = await getDoc(testRef);
    firestoreOk = snap.exists();
    firestoreDetail = firestoreOk ? "Lettura e scrittura riuscite" : "Documento di test non leggibile";
  } catch (err) {
    firestoreDetail = `${err?.code || "errore"}: ${err?.message || err}`;
  } finally {
    try { await deleteDoc(testRef); } catch {}
  }
  results.push({ label: "Firestore", ok: firestoreOk, detail: firestoreDetail });

  const qrCanvas = typeof window.QRCode !== "undefined";
  const qrFallback = navigator.onLine;
  results.push({
    label: "QR invito",
    ok: qrCanvas || qrFallback,
    detail: qrCanvas ? "Generatore QR disponibile" : qrFallback ? "Disponibile tramite fallback online" : "QR non disponibile offline"
  });

  let swDetail = "Non supportato";
  let swOk = false;
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      swOk = Boolean(reg);
      swDetail = reg ? "Service worker registrato" : "Service worker non ancora registrato";
    }
  } catch (err) {
    swDetail = err?.message || String(err);
  }
  results.push({ label: "Cache app", ok: swOk, detail: swDetail });

  panel.innerHTML = results.map(r => `
    <div class="diag-row ${r.ok ? "diag-ok" : "diag-error"}">
      <span>${r.ok ? "✓" : "!"}</span>
      <div><b>${r.label}</b><small>${r.detail}</small></div>
    </div>
  `).join("");
}

async function quickBotTest() {
  try {
    const code = roomCode();
    const hostId = uid();
    const hostName = "Tu";
    const phaseSeconds = Number($("#phaseSeconds").value || 20);
    const human = { id: hostId, name: hostName, role: null, alive: true, isBot: false, lover: null, joinedAt: Date.now() };
    const bots = BOT_NAMES.slice(0, 7).map(name => ({
      id: "bot_" + uid(),
      name,
      role: null,
      alive: true,
      isBot: true,
      lover: null,
      joinedAt: Date.now()
    }));
    const players = [human, ...bots];
    const counts = recommendedCounts(players.length, "auto");
    const deck = makeDeck(counts, players.length);
    const assigned = players.map((p, i) => ({ ...p, role: deck[i] }));

    room.code = code;
    room.playerId = hostId;
    room.isHost = true;
    room.revealMine = false;
    localStorage.setItem("lupusPlayerId", hostId);
    localStorage.setItem("lupusLastRoom", JSON.stringify({ code, playerId: hostId }));

    await setDoc(doc(db, "lupusRooms", code), {
      code,
      hostId,
      phase: "night",
      step: 0,
      dayNumber: 0,
      nightNumber: 1,
      phaseSeconds,
      autoMode: phaseSeconds > 0,
      phaseDeadline: phaseSeconds > 0 ? Date.now() + phaseSeconds * 1000 : null,
      players: assigned,
      roleCounts: counts,
      votes: {},
      voteRound: 0,
      night: {},
      privateResults: {},
      witch: { save: true, kill: true },
      loversChosen: false,
      pendingHunterId: null,
      narration: narr("night", "Test rapido avviato con sette bot. Tutti chiudono gli occhi."),
      hostNote: "Test automatico: usa “Fai giocare i bot” oppure lascia avanzare il timer.",
      hostLog: [{ at: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), text: "Test rapido con bot avviato." }],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    listenRoom(code);
    show("roomView");
    toast("Test rapido avviato.");
  } catch (err) {
    showTechnicalError("Errore test rapido", err);
  }
}

async function restartLocalSamePlayers() {
  if (!local?.players?.length) return;
  const names = local.players.map(p => p.name);
  const counts = local.roleCounts || recommendedCounts(names.length, "auto");
  const players = makePlayers(names, counts);
  local = {
    players,
    roleCounts: counts,
    phase: "reveal",
    step: 0,
    revealIndex: 0,
    night: {},
    witch: { save: true, kill: true },
    loversChosen: false,
    narration: narr("intro", "Nuova partita. Passa il telefono al primo giocatore."),
    hostNote: "",
    log: [{ at: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), text: "Nuova partita con gli stessi giocatori." }]
  };
  $("#localRevealBox").dataset.visible = "0";
  $("#localRevealBox").className = "role-card hidden-role";
  $("#localRevealBox").textContent = "Tocca “Mostra carta”";
  renderLocal();
  setStage("reveal");
}

async function restartOnlineSamePlayers() {
  if (!room.isHost || !room.data) return;
  const d = room.data;
  const players = (d.players || []).map(p => ({
    ...p,
    role: null,
    alive: true,
    lover: null
  }));
  await updateDoc(doc(db, "lupusRooms", room.code), {
    players,
    phase: "lobby",
    step: 0,
    dayNumber: 0,
    nightNumber: 0,
    votes: {},
    voteRound: 0,
    night: {},
    privateResults: {},
    witch: { save: true, kill: true },
    loversChosen: false,
    pendingHunterId: null,
    winnerText: null,
    narration: "Nuova lobby pronta con gli stessi giocatori.",
    hostNote: "Controlla i ruoli e avvia la nuova partita.",
    phaseDeadline: null,
    hostLog: [{ at: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), text: "Lobby riaperta con gli stessi giocatori." }],
    updatedAt: serverTimestamp()
  });
  toast("Nuova lobby pronta.");
}


function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function phaseProgress(deadline) {
  if (!deadline) return 0;
  const total = Math.max(1, Number(room.data?.phaseSeconds || 20) * 1000);
  const left = Math.max(0, deadline - Date.now());
  return Math.max(0, Math.min(100, (left / total) * 100));
}

function localPhaseInfo() {
  if (!local) return { title: "", desc: "" };
  const alive = alivePlayers(local.players).length;
  if (local.phase === "reveal") return {
    title: `Mostra carte · ${local.revealIndex + 1}/${local.players.length}`,
    desc: "Passa il telefono a ogni giocatore e mostra il ruolo in privato."
  };
  if (local.phase === "night") return {
    title: local.currentNightKey ? `Notte · ${nightStepLabel(local.currentNightKey)}` : "Notte",
    desc: "Segna le azioni dei ruoli e poi risolvi la notte."
  };
  if (local.phase === "day") return {
    title: `Giorno · ${alive} vivi`,
    desc: "Discutete dal vivo e poi scegli se aprire o saltare la votazione."
  };
  if (local.phase === "vote") return {
    title: "Votazione",
    desc: "Scegli chi eliminare. A meno di ruoli speciali, il ruolo resta segreto."
  };
  if (local.phase === "hunter") return {
    title: "Cacciatore",
    desc: "Il Cacciatore può sparare una volta prima che il gioco prosegua."
  };
  if (local.phase === "gameOver") return {
    title: "Partita conclusa",
    desc: "Puoi vedere i ruoli finali e iniziare una nuova partita con gli stessi giocatori."
  };
  return { title: local.phase, desc: "" };
}

function roomPhaseInfo(d, me) {
  const alive = alivePlayers(d.players || []).length;
  if (d.phase === "lobby") return {
    title: "Lobby",
    desc: room.isHost ? "Invita i giocatori, controlla i ruoli e poi avvia la partita." : "Aspetta che il narratore avvii la partita."
  };
  if (d.phase === "night") return {
    title: `Notte ${d.nightNumber || 1} · ${nightStepLabel(currentNightStep(d, d.players || []))}`,
    desc: me?.alive ? "Se è il tuo turno, fai la tua azione. Altrimenti aspetta." : "Sei morto: puoi osservare ma non agire."
  };
  if (d.phase === "day") return {
    title: `Giorno ${d.dayNumber || 1} · ${alive} vivi`,
    desc: "Parlate dal vivo. Il narratore può aprire la votazione quando siete pronti."
  };
  if (d.phase === "vote") {
    const votes = d.votes || {};
    const voted = alivePlayers(d.players || []).filter(p => votes[p.id]).length;
    return {
      title: `Votazione · ${voted}/${alive} voti`,
      desc: me?.alive ? "Ogni giocatore vivo vota una sola volta per questo giorno." : "Sei morto: puoi solo seguire la votazione."
    };
  }
  if (d.phase === "hunter") return {
    title: "Azione del Cacciatore",
    desc: room.isHost ? "Scegli il bersaglio del Cacciatore oppure fai saltare il colpo." : "Aspetta che il narratore risolva l'azione del Cacciatore."
  };
  if (d.phase === "gameOver") return {
    title: "Partita conclusa",
    desc: "Sono visibili tutti i ruoli finali. Il narratore può riaprire una nuova lobby con gli stessi giocatori."
  };
  return { title: d.phase, desc: "" };
}

function phaseMetaHtml(title, desc, progress = null, extra = "") {
  return `
    <div class="phase-head">
      <div>
        <b>${title}</b>
        <small>${desc}</small>
      </div>
      ${extra || ""}
    </div>
    ${progress !== null ? `<div class="meter"><div class="meter-bar" style="width:${progress}%"></div></div>` : ""}
  `;
}

/* -------------------- INIT -------------------- */

function init() {
  makeRolePicker($("#localRolePicker"), "local");
  makeRolePicker($("#onlineRolePicker"), "online");

  document.addEventListener("click", (e) => {
    const jump = e.target.closest("[data-scroll-target]");
    if (jump) scrollToSection(jump.dataset.scrollTarget);

    const step = e.target.closest("[data-step-role]");
    if (step) {
      const role = step.dataset.stepRole;
      const prefix = step.dataset.prefix;
      const delta = Number(step.dataset.delta || 0);
      const box = document.querySelector(`[data-${prefix}-role="${role}"]`);
      box.textContent = Math.max(0, Number(box.textContent || 0) + delta);
      if (prefix === "online") renderOnlineSetupSummary();
    }

    const open = e.target.closest("[data-open]");
    if (open) show(open.dataset.open);

    const back = e.target.closest(".back");
    if (back) show("homeView");

    const localAction = e.target.closest("[data-local-action]");
    if (localAction) handleLocalAction(localAction.dataset.localAction, localAction.dataset.target || null);

    const onlineAction = e.target.closest("[data-online-action]");
    if (onlineAction) handleOnlinePlayerAction(onlineAction.dataset.onlineAction, onlineAction.dataset.target || null);

    const hostAction = e.target.closest("[data-host-action]");
    if (hostAction) handleHostAction(hostAction.dataset.hostAction);
  });

  $("#closeErrorBoxBtn")?.addEventListener("click", () => $("#errorBox").classList.add("hidden"));
  $("#closeRoleOverlayBtn").onclick = closeRoleOverlay;
  $("#roleOverlay").addEventListener("click", (e) => {
    if (e.target.id === "roleOverlay" || e.target.classList.contains("role-overlay-bg")) closeRoleOverlay();
  });

  $("#copyRoomCodeBtn")?.addEventListener("click", async () => {
    if (!room?.data?.code) return;
    try {
      await navigator.clipboard.writeText(room.data.code);
      toast("Codice stanza copiato.");
    } catch {
      toast(`Codice: ${room.data.code}`);
    }
  });

  $("#copyRoomLinkBtn")?.addEventListener("click", async () => {
    if (!room?.data?.code) return;
    const link = makeRoomInviteLink(room.data.code);
    try {
      await navigator.clipboard.writeText(link);
      toast("Link invito copiato.");
    } catch {
      toast("Non riesco a copiare il link.");
    }
  });

  document.addEventListener("click", (e) => {
    const preset = e.target.closest("[data-preset]");
    if (!preset) return;
    const [prefix, mode] = preset.dataset.preset.split(":");
    const count = prefix === "local" ? getLocalNameCount() : getOnlinePlayerCount();
    if (!count || count < 5) return toast("Servono almeno 5 giocatori per consigliare i ruoli.");
    applyCounts(prefix, recommendedCounts(count, mode));
    toast("Ruoli consigliati applicati.");
  });

  parseHashRoom();

  setInterval(() => {
    try {
      if ($("#roomView")?.classList.contains("active") && room.data) renderRoom();
    } catch {}
  }, 1000);

  $("#resetAppBtn").onclick = async () => {
    localStorage.removeItem("lupusPlayerId");
    localStorage.removeItem("lupusLastRoom");
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch {}
    location.reload();
  };

  $("#demoBtn").onclick = () => {
    $("#localNames").value = DEMO_NAMES.join("\n");
    show("localSetupView");
    toast("Demo caricata.");
  };

  $("#startLocalBtn").onclick = startLocal;
  $("#localSpeakBtn").onclick = () => speak($("#localNarration").textContent);
  $("#localNextBtn").onclick = localContinue;
  $("#showRoleBtn").onclick = toggleLocalRole;
  $("#nextRoleBtn").onclick = nextLocalRole;

  $("#createRoomBtn").onclick = createRoom;
  $("#joinRoomBtn").onclick = joinRoom;
  $("#rejoinLastRoomBtn").onclick = rejoinLastRoom;
  $("#quickBotTestBtn").onclick = quickBotTest;
  $("#diagnosticsBtn").onclick = runDiagnostics;
  $("#restartLocalSameBtn").onclick = restartLocalSamePlayers;
  $("#restartOnlineSameBtn").onclick = restartOnlineSamePlayers;
  $("#startOnlineGameBtn").onclick = startOnlineGame;
  $("#toggleMyRoleBtn").onclick = () => { room.revealMine = !room.revealMine; renderRoom(); };
  $("#onlineRevealAllBtn").onclick = () => { room.narratorShowRoles = !room.narratorShowRoles; renderRoom(); };
  $("#roomSpeakBtn").onclick = () => speak($("#roomNarration").textContent);
  $("#roomNextBtn").onclick = () => onlineAdvanceManual();

  const last = localStorage.getItem("lupusLastRoom");
  $("#rejoinLastRoomBtn").classList.toggle("hidden", !last);
}

init();

/* -------------------- LOCAL MODE -------------------- */

function startLocal() {
  const names = $("#localNames").value.split(/\n|,/).map((n) => n.trim()).filter(Boolean);
  const counts = getCounts("local");
  const err = validateSetup(names, counts);
  if (err) return toast(err);

  local = {
    players: makePlayers(names, counts),
    roleCounts: counts,
    phase: "reveal",
    step: 0,
    revealIndex: 0,
    night: {},
    witch: { save: true, kill: true },
    loversChosen: false,
    narration: narr("intro", "Passa il telefono al primo giocatore per mostrare il ruolo."),
    hostNote: "",
    log: []
  };

  show("localGameView");
  renderLocal();
  speak(local.narration);
}

function renderLocal() {
  if (!local) return;
  setStage(local.phase);

  $("#localPhaseBadge").textContent = local.phase;
  $("#localAliveCount").textContent = `Vivi: ${alivePlayers(local.players).length}/${local.players.length}`;
  $("#localNarration").textContent = local.narration;
  $("#localStatus").innerHTML = statusHtml(local.players, local.phase, {});
  const localInfo = localPhaseInfo();
  $("#localPhaseMeta").innerHTML = phaseMetaHtml(localInfo.title, localInfo.desc);
  $("#localPlayersList").innerHTML = local.players.map((p) => `
    <div class="player-row ${p.alive ? "" : "dead"}">
      <span>${local.phase === "gameOver" ? roleIcon(p.role) + " " : ""}${p.name}${p.lover ? " 💞" : ""}</span>
      <span class="chip ${p.alive ? "alive-chip" : "dead-chip"}">${p.alive ? "vivo" : "morto"}</span>
    </div>
  `).join("");

  $("#localRevealCard").classList.toggle("hidden", local.phase !== "reveal");
  $("#localFinalRevealCard").classList.toggle("hidden", local.phase !== "gameOver");
  renderFinalList("#localFinalRevealList", local.players);
  renderLog("#localHostLogList", local.log || []);
  renderLocalActions();
}

function toggleLocalRole() {
  const p = local?.players?.[local.revealIndex];
  if (!p) return;
  const box = $("#localRevealBox");
  if (box.dataset.visible === "1") {
    box.dataset.visible = "0";
    box.className = "role-card hidden-role";
    box.innerHTML = "Carta nascosta";
  } else {
    box.dataset.visible = "1";
    box.className = "role-card";
    box.innerHTML = `<span class="role-icon">${roleIcon(p.role)}</span>${p.name}<br><small>${roleName(p.role)}</small><em>${roleDesc(p.role)}</em>`;
    box.onclick = () => openRoleOverlay(p.role, p.name);
  }
}

function nextLocalRole() {
  if (!local) return;
  $("#localRevealBox").dataset.visible = "0";
  $("#localRevealBox").className = "role-card hidden-role";
  $("#localRevealBox").innerHTML = "Tocca “Mostra carta”";
  local.revealIndex += 1;

  if (local.revealIndex >= local.players.length) {
    local.phase = "night";
    local.step = 0;
    local.narration = narr("night", "Prima notte. Tutti chiudono gli occhi.");
  } else {
    local.narration = `Passa il telefono a ${local.players[local.revealIndex].name}.`;
  }
  renderLocal();
}

function localContinue() {
  if (!local) return;
  if (local.phase === "gameOver") return toast("La partita è finita.");
  if (local.phase === "reveal") return nextLocalRole();
  if (local.phase === "night") return localNightStep();
  if (local.phase === "day") return startLocalVote();
  if (local.phase === "vote") return toast("Scegli chi eliminare nella sezione azioni.");
}

function localNightStep() {
  const available = getAvailableNightSteps(local.players, local.step === 0);
  const key = available[local.step] || "dawn";
  const textByKey = {
    cupid: narr("intro", "Cupido apre gli occhi e sceglie due innamorati."),
    wolves: narr("wolves", "I lupi aprono gli occhi e scelgono una vittima."),
    seer: narr("seer", "Il Veggente apre gli occhi e può controllare un giocatore."),
    guard: narr("guard", "La Guardia apre gli occhi e sceglie chi proteggere."),
    witch: narr("witch", "La Strega apre gli occhi. Può usare le pozioni."),
    medium: "Il Medium può ricevere informazioni sui morti.",
    dawn: narr("day", "Tutti aprono gli occhi.")
  };
  local.narration = textByKey[key] || "Notte.";
  local.currentNightKey = key;
  local.step += 1;

  if (key === "dawn") resolveLocalNight();
  else {
    renderLocal();
    speak(local.narration);
  }
}

function getAvailableNightSteps(players, includeCupid) {
  const roles = new Set(alivePlayers(players).map((p) => p.role));
  const steps = [];
  if (includeCupid && roles.has("cupid")) steps.push("cupid");
  if ([...roles].some(isWolf)) steps.push("wolves");
  if (roles.has("seer")) steps.push("seer");
  if (roles.has("guard")) steps.push("guard");
  if (roles.has("witch")) steps.push("witch");
  if (roles.has("medium")) steps.push("medium");
  steps.push("dawn");
  return steps;
}

function renderLocalActions() {
  const area = $("#localActionArea");
  const note = local.hostNote ? `<div class="host-note"><b>Nota narratore:</b> ${local.hostNote}</div>` : "";

  if (local.phase === "gameOver") {
    area.innerHTML = `${note}<p><b>Partita conclusa.</b></p>`;
    return;
  }

  if (local.phase === "reveal") {
    area.innerHTML = "<p class='hint'>Prima mostra i ruoli a tutti.</p>";
    return;
  }

  if (local.phase === "night") {
    const key = local.currentNightKey || "";
    area.innerHTML = `${note}<div class="action-grid">
      <p class="hint">Azioni manuali del narratore. I ruoli dei morti restano segreti ai giocatori.</p>
      <button class="secondary" data-local-action="cupid">Cupido: scegli innamorati</button>
      <button class="secondary" data-local-action="wolf">Lupi: scegli vittima</button>
      <button class="secondary" data-local-action="seer">Veggente: controlla</button>
      <button class="secondary" data-local-action="guard">Guardia: proteggi</button>
      <button class="secondary" data-local-action="witchSave">Strega: salva vittima</button>
      <button class="secondary" data-local-action="witchKill">Strega: uccidi</button>
      <button class="secondary" data-local-action="medium">Medium: vedi un morto</button>
      <button class="primary" data-local-action="resolveNight">Risolvi notte / giorno</button>
    </div>`;
    return;
  }

  if (local.phase === "hunter") {
    const hunter = local.players.find((p) => p.id === local.pendingHunterId);
    area.innerHTML = `${note}<p>Il Cacciatore ${hunter?.name || ""} può sparare.</p>
      <div class="action-grid">
        ${alivePlayers(local.players).filter((p) => p.id !== hunter?.id).map((p) => `<button class="target-btn" data-local-action="hunterShot" data-target="${p.id}">${p.name}</button>`).join("")}
        <button class="secondary full" data-local-action="hunterShot" data-target="skip">Non sparare</button>
      </div>`;
    return;
  }

  if (local.phase === "day") {
    area.innerHTML = `${note}<div class="action-grid">
      <button class="primary" data-local-action="startVote">Inizia votazione</button>
      <button class="secondary" data-local-action="skipVote">Salta votazione e vai alla notte</button>
    </div>`;
    return;
  }

  if (local.phase === "vote") {
    area.innerHTML = `${note}<p>Vota chi eliminare:</p>
      <div class="action-grid">
        ${alivePlayers(local.players).map((p) => `<button class="target-btn" data-local-action="lynch" data-target="${p.id}">${p.name}</button>`).join("")}
        <button class="secondary full" data-local-action="skipVote">Nessuna eliminazione</button>
      </div>`;
  }
}

function chooseLocalTarget(title, callback, filter = () => true) {
  const players = alivePlayers(local.players).filter(filter);
  $("#localActionArea").innerHTML = `<p>${title}</p><div class="action-grid">${players.map((p) => `<button class="target-btn" data-temp="${p.id}">${p.name}</button>`).join("")}</div>`;
  $$("#localActionArea [data-temp]").forEach((b) => {
    b.onclick = () => callback(b.dataset.temp);
  });
}

function handleLocalAction(action, target) {
  if (!local) return;
  if (action === "resolveNight") return confirmAction("Risolvi notte", "Vuoi chiudere la notte e mostrare l'esito?", resolveLocalNight, "Risolvi");
  if (action === "startVote") return startLocalVote();
  if (action === "skipVote") return confirmAction("Saltare voto", "Vuoi davvero saltare la votazione e passare alla notte?", skipLocalVote, "Salta voto");

  if (action === "cupid") {
    const picked = [];
    chooseLocalTarget("Cupido: scegli il primo innamorato.", (id1) => {
      picked.push(id1);
      chooseLocalTarget("Cupido: scegli il secondo innamorato.", (id2) => {
        if (id1 === id2) return toast("Scegli due persone diverse.");
        local.players = local.players.map((p) => p.id === id1 ? { ...p, lover: id2 } : p.id === id2 ? { ...p, lover: id1 } : p);
        local.loversChosen = true;
        local.hostNote = "Cupido ha scelto gli innamorati."; addLocalLog("Cupido ha scelto due innamorati.");
        renderLocal();
      });
    });
  }

  if (action === "wolf") chooseLocalTarget("Vittima scelta dai lupi:", (id) => { local.night.victim = id; local.hostNote = "Vittima dei lupi segnata."; addLocalLog("I lupi hanno scelto una vittima."); renderLocal(); });
  if (action === "seer") chooseLocalTarget("Veggente: chi controlli?", (id) => {
    const p = local.players.find((x) => x.id === id);
    local.hostNote = `${p.name}: ${seerResult(p.role)}.`; addLocalLog(`Veggente: ${p.name} è ${seerResult(p.role)}.`);
    toast(local.hostNote);
    renderLocal();
  });
  if (action === "guard") chooseLocalTarget("Guardia: chi proteggi?", (id) => { local.night.protected = id; local.hostNote = "Protezione segnata."; addLocalLog("La Guardia ha scelto una protezione."); renderLocal(); });
  if (action === "witchSave") {
    if (!local.witch.save) return toast("Pozione salvezza già usata.");
    local.night.witchSave = true; local.witch.save = false; local.hostNote = "La Strega ha salvato la vittima."; addLocalLog("La Strega ha usato la pozione salvezza."); renderLocal();
  }
  if (action === "witchKill") {
    if (!local.witch.kill) return toast("Pozione morte già usata.");
    chooseLocalTarget("Strega: chi vuoi avvelenare?", (id) => { local.night.witchKill = id; local.witch.kill = false; local.hostNote = "Pozione morte usata."; addLocalLog("La Strega ha usato la pozione morte."); renderLocal(); });
  }
  if (action === "medium") {
    const dead = local.players.filter((p) => !p.alive);
    if (!dead.length) return toast("Non ci sono morti da controllare.");
    $("#localActionArea").innerHTML = `<p>Medium: scegli un morto.</p><div class="action-grid">${dead.map((p) => `<button class="target-btn" data-dead="${p.id}">${p.name}</button>`).join("")}</div>`;
    $$("#localActionArea [data-dead]").forEach((b) => b.onclick = () => {
      const p = local.players.find((x) => x.id === b.dataset.dead);
      local.hostNote = `${p.name} era ${roleName(p.role)}.`; addLocalLog(`Medium: ${p.name} era ${roleName(p.role)}.`);
      renderLocal();
    });
  }
  if (action === "lynch") {
    const p = local.players.find(x => x.id === target);
    return confirmAction("Eliminare giocatore", `Vuoi eliminare ${p?.name || "questo giocatore"}?`, () => lynchLocal(target), "Elimina");
  }
  if (action === "hunterShot") return hunterShotLocal(target);
}

function resolveLocalNight() {
  if (!local || local.phase === "gameOver") return;
  const deadIds = [];
  if (local.night.victim && local.night.victim !== local.night.protected && !local.night.witchSave) deadIds.push(local.night.victim);
  if (local.night.witchKill) deadIds.push(local.night.witchKill);

  local.players = applyLoversDeath(local.players, deadIds);
  const deadNames = [...new Set(deadIds)]
    .map((id) => local.players.find((p) => p.id === id)?.name)
    .filter(Boolean);

  const hunter = local.players.find((p) => deadIds.includes(p.id) && p.role === "hunter");
  const win = checkWin(local.players);
  if (deadNames.length) addLocalLog(`Notte risolta: morti ${deadNames.join(", ")}.`);
  else addLocalLog("Notte risolta: nessun morto.");

  local.night = {};
  local.currentNightKey = "";
  local.step = 0;
  local.hostNote = hunter ? `${hunter.name} era il Cacciatore: può sparare.` : "";

  if (win) {
    local.phase = "gameOver";
    local.narration = (deadNames.length ? narr("death", deadNames.map(publicDeath).join(" ")) : narr("safe", "Non è morto nessuno.")) + " " + win;
  } else if (hunter) {
    local.phase = "hunter";
    local.pendingHunterId = hunter.id;
    local.narration = narr("death", deadNames.map(publicDeath).join(" "));
  } else {
    local.phase = "day";
    local.narration = deadNames.length ? narr("death", deadNames.map(publicDeath).join(" ")) : narr("safe", "Non è morto nessuno.");
  }
  renderLocal();
  speak(local.narration);
}

function startLocalVote() {
  local.phase = "vote";
  local.narration = narr("vote", "Il villaggio vota chi eliminare.");
  renderLocal();
  speak(local.narration);
}

function skipLocalVote() {
  local.phase = "night";
  local.step = 0;
  local.hostNote = "";
  local.narration = narr("skip", "Tutti chiudono gli occhi. Ricomincia la notte.");
  renderLocal();
  speak(local.narration);
}

function lynchLocal(id) {
  const p = local.players.find((x) => x.id === id);
  if (!p) return;
  local.players = applyLoversDeath(local.players, [id]);
  local.hostNote = "";

  if (p.role === "jester") {
    local.phase = "gameOver";
    addLocalLog(`${p.name} eliminato al voto. Vittoria del Giullare.`);
    local.narration = narr("vote", `${p.name} è stato eliminato. Il ruolo resta segreto. Il Giullare ha vinto.`);
    renderLocal(); speak(local.narration); return;
  }

  if (p.role === "hunter") {
    local.phase = "hunter";
    local.pendingHunterId = p.id;
    local.hostNote = `${p.name} era il Cacciatore: può sparare.`;
    local.narration = narr("vote", `${p.name} è stato eliminato. Il ruolo resta segreto.`);
    renderLocal(); speak(local.narration); return;
  }

  addLocalLog(`${p.name} è stato eliminato al voto.`);
  const win = checkWin(local.players);
  if (win) {
    local.phase = "gameOver";
    local.narration = narr("vote", `${p.name} è stato eliminato. Il ruolo resta segreto. ${win}`);
  } else {
    local.phase = "night";
    local.step = 0;
    local.narration = narr("vote", `${p.name} è stato eliminato. Il ruolo resta segreto. Tutti chiudono gli occhi.`);
  }
  renderLocal();
  speak(local.narration);
}

function hunterShotLocal(id) {
  if (id && id !== "skip") {
    local.players = applyLoversDeath(local.players, [id]);
    const target = local.players.find((p) => p.id === id);
    local.hostNote = `${target?.name || "Un giocatore"} è stato colpito dal Cacciatore.`;
  } else {
    local.hostNote = "Il Cacciatore non ha sparato.";
  }

  const win = checkWin(local.players);
  if (win) {
    local.phase = "gameOver";
    local.narration += " " + win;
  } else {
    local.phase = "day";
  }
  local.pendingHunterId = null;
  renderLocal();
}

/* -------------------- ONLINE MODE -------------------- */

async function createRoom() {
  try {
    const code = roomCode();
    const hostId = uid();
    const hostName = (prompt("Nome del giocatore su questo telefono?", "Tu") || "Tu").trim().slice(0, 24) || "Tu";
    const phaseSeconds = Number($("#phaseSeconds").value || 20);
    const hostPlayer = { id: hostId, name: hostName, role: null, alive: true, isBot: false, lover: null, joinedAt: Date.now() };

    room.code = code;
    room.playerId = hostId;
    room.isHost = true;
    room.revealMine = false;
    localStorage.setItem("lupusPlayerId", hostId);
    localStorage.setItem("lupusLastRoom", JSON.stringify({ code, playerId: hostId }));

    await setDoc(doc(db, "lupusRooms", code), {
      code,
      hostId,
      phase: "lobby",
      step: 0,
      dayNumber: 0,
      nightNumber: 0,
      phaseSeconds,
      autoMode: phaseSeconds > 0,
      phaseDeadline: null,
      players: [hostPlayer],
      votes: {},
      voteRound: 0,
      night: {},
      privateResults: {},
      witch: { save: true, kill: true },
      loversChosen: false,
      pendingHunterId: null,
      narration: "Stanza creata. Fai entrare i giocatori con il codice.",
      hostNote: "Chi crea la stanza è anche un giocatore.",
      hostLog: [{ at: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), text: "Stanza creata." }],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    listenRoom(code);
    show("roomView");
    toast(`Codice stanza: ${code}`);
  } catch (err) {
    showTechnicalError("Errore creazione stanza", err);
  }
}

async function joinRoom() {
  try {
    const code = $("#joinCode").value.trim().toUpperCase();
    const name = $("#joinName").value.trim().slice(0, 24);
    if (!code || !name) return toast("Inserisci codice e nome.");

    const ref = doc(db, "lupusRooms", code);
    const snap = await getDoc(ref);
    if (!snap.exists()) return toast("Stanza non trovata.");

    const d = snap.data();
    if (d.phase !== "lobby") return toast("La partita è già iniziata.");

    const playerId = localStorage.getItem("lupusPlayerId") || uid();
    localStorage.setItem("lupusPlayerId", playerId);
    localStorage.setItem("lupusLastRoom", JSON.stringify({ code, playerId }));

    const players = [...(d.players || [])];
    if (!players.some((p) => p.id === playerId)) {
      players.push({ id: playerId, name, role: null, alive: true, isBot: false, lover: null, joinedAt: Date.now() });
      await updateDoc(ref, { players, updatedAt: serverTimestamp() });
    }

    room.code = code;
    room.playerId = playerId;
    room.revealMine = false;
    listenRoom(code);
    show("roomView");
  } catch (err) {
    showTechnicalError("Errore entrata stanza", err);
  }
}

async function rejoinLastRoom() {
  try {
    const saved = JSON.parse(localStorage.getItem("lupusLastRoom") || "null");
    if (!saved?.code || !saved?.playerId) return toast("Nessuna stanza salvata.");
    const ref = doc(db, "lupusRooms", saved.code);
    const snap = await getDoc(ref);
    if (!snap.exists()) return toast("La stanza non esiste più.");

    room.code = saved.code;
    room.playerId = saved.playerId;
    room.revealMine = false;
    listenRoom(saved.code);
    show("roomView");
  } catch {
    toast("Non riesco a rientrare nella stanza.");
  }
}

function listenRoom(code) {
  if (room.unsub) room.unsub();
  room.unsub = onSnapshot(doc(db, "lupusRooms", code), (snap) => {
    if (!snap.exists()) {
      toast("Stanza eliminata o non trovata.");
      return;
    }
    room.data = snap.data();
    room.isHost = room.data.hostId === room.playerId;
    renderRoom();
    scheduleAuto();
  }, (err) => {
    showTechnicalError("Errore lettura Firestore", err);
  });
}

async function startOnlineGame() {
  if (!room.isHost || !room.data) return;
  const players = [...(room.data.players || [])];
  const counts = getCounts("online");
  const validation = setupValidation("online", players.length);
  if (!validation.ok) return toast(validation.message);

  const deck = makeDeck(counts, players.length);
  const assigned = players.map((p, i) => ({ ...p, role: deck[i], alive: true, lover: null }));

  const seconds = Number($("#phaseSeconds").value || room.data.phaseSeconds || 20);
  await updateDoc(doc(db, "lupusRooms", room.code), {
    players: assigned,
    roleCounts: counts,
    phase: "night",
    step: 0,
    nightNumber: 1,
    dayNumber: 0,
    phaseSeconds: seconds,
    autoMode: seconds > 0,
    phaseDeadline: seconds > 0 ? Date.now() + seconds * 1000 : null,
    votes: {},
    voteRound: 0,
    night: {},
    privateResults: {},
    witch: { save: true, kill: true },
    loversChosen: false,
    pendingHunterId: null,
    narration: narr("night", "Partita iniziata. Tutti guardano la propria carta. Poi parla il turno della notte."),
    hostNote: "Automatico attivo se il timer non è su manuale.",
    hostLog: [{ at: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), text: "Partita online iniziata." }, ...((room.data.hostLog || []).slice(0, 29))],
    updatedAt: serverTimestamp()
  });
}

function renderRoom() {
  const d = room.data;
  if (!d) return;
  setStage(d.phase);

  const players = d.players || [];
  const me = players.find((p) => p.id === room.playerId);

  $("#roomCodeBadge").textContent = d.code || room.code;
  $("#roomPhaseBadge").textContent = `${phaseLabel(d.phase)}${d.phase === "night" ? ` ${d.nightNumber || 1}` : d.phase === "day" ? ` ${d.dayNumber || 1}` : ""}`;
  $("#roomNarration").textContent = d.narration || "";
  $("#roomStatus").innerHTML = statusHtml(players, d.phase, d.votes || {});
  const info = roomPhaseInfo(d, me);
  const timerExtra = d.autoMode && d.phaseDeadline && !["lobby","gameOver"].includes(d.phase)
    ? `<span class="meta-chip">⏱️ ${Math.max(0, Math.ceil((d.phaseDeadline - Date.now()) / 1000))}s</span>`
    : "";
  const progress = d.autoMode && d.phaseDeadline && !["lobby","gameOver"].includes(d.phase)
    ? phaseProgress(d.phaseDeadline)
    : null;
  $("#roomPhaseMeta").innerHTML = phaseMetaHtml(info.title, info.desc, progress, timerExtra);
  $$(".narrator-only").forEach((el) => el.classList.toggle("hidden", !room.isHost));

  if (me?.role && room.revealMine) {
    $("#myRoleCard").className = "role-card";
    $("#myRoleCard").innerHTML = `<span class="role-icon">${roleIcon(me.role)}</span>${me.name}<br><small>${roleName(me.role)}</small><em>${roleDesc(me.role)}</em>`;
    $("#myRoleCard").onclick = () => openRoleOverlay(me.role, me.name);
  } else {
    $("#myRoleCard").className = "role-card hidden-role";
    $("#myRoleCard").innerHTML = me?.role ? "Carta nascosta" : "Ruolo non ancora assegnato";
    $("#myRoleCard").onclick = null;
  }

  updateRoomQr();
  $("#finalRevealCard").classList.toggle("hidden", d.phase !== "gameOver");
  renderFinalList("#finalRevealList", players);
  renderLog("#hostLogList", d.hostLog || []);

  $("#roomPlayersList").innerHTML = players.length ? players.map((p) => {
    const role = room.isHost && room.narratorShowRoles && p.role ? ` · ${roleName(p.role)}` : "";
    return `<div class="player-row ${p.alive ? "" : "dead"}">
      <span>${room.isHost && room.narratorShowRoles && p.role ? roleIcon(p.role) + " " : ""}${p.name}${p.isBot ? " 🤖" : ""}${p.lover ? " 💞" : ""}${role}</span>
      <span class="chip ${p.alive ? "alive-chip" : "dead-chip"}">${p.alive ? "vivo" : "morto"}</span>
    </div>`;
  }).join("") : "<p class='hint'>Nessun giocatore nella stanza.</p>";

  renderOnlineSetupSummary();
  renderRoomActions(d, players, me);
}

function phaseLabel(phase) {
  return { lobby: "Lobby", night: "Notte", day: "Giorno", vote: "Voto", hunter: "Cacciatore", gameOver: "Fine" }[phase] || phase;
}

function timerHtml(d) {
  if (!d.autoMode || !d.phaseDeadline || d.phase === "lobby" || d.phase === "gameOver") return "";
  const left = Math.max(0, Math.ceil((d.phaseDeadline - Date.now()) / 1000));
  return `<div class="timer-pill">⏱️ ${left}s</div>`;
}

function privateResultHtml(d, me) {
  if (!me) return "";
  const r = (d.privateResults || {})[me.id];
  if (!r) return "";
  if (r.type === "seer") {
    return `<div class="private-result"><b>Risultato Veggente</b><br>${r.targetName}: <b>${r.result}</b><small>Resta visibile solo a te.</small></div>`;
  }
  if (r.type === "medium") {
    return `<div class="private-result"><b>Risultato Medium</b><br>${r.targetName}: <b>${r.result}</b><small>Resta visibile solo a te.</small></div>`;
  }
  return "";
}

function renderRoomActions(d, players, me) {
  const area = $("#roomActionArea");
  const privateBox = privateResultHtml(d, me);

  if (d.phase === "lobby") {
    area.innerHTML = room.isHost
      ? `<p>Condividi il codice <b>${d.code}</b>. Poi assegna i ruoli.</p>
         <div class="action-grid">
           <button class="secondary" data-host-action="bot1">+1 bot</button>
           <button class="secondary" data-host-action="bot3">+3 bot</button>
           <button class="secondary" data-host-action="bot6">+6 bot</button>
           <button class="ghost" data-host-action="clearBots">Rimuovi bot</button>
         </div>`
      : "<p>Attendi che chi ha creato la stanza inizi la partita.</p>";
    return;
  }

  if (d.phase === "gameOver") {
    area.innerHTML = `<p><b>Partita conclusa.</b></p><p>${d.winnerText || d.narration || ""}</p>`;
    return;
  }

  const playerControls = renderPlayerControls(d, players, me);
  const hostControls = room.isHost ? renderHostControls(d, players) : "";

  area.innerHTML = `${privateBox}${playerControls}${hostControls}`;
}

function renderPlayerControls(d, players, me) {
  if (!me) return "<p>Questo dispositivo non è registrato come giocatore.</p>";
  if (!me.alive) return "<p>Sei morto. Puoi seguire la partita, ma non votare.</p>";
  const step = currentNightStep(d, players);
  const acted = hasActed(d, me.id, step);

  if (d.phase === "night") {
    if (step === "cupid" && me.role === "cupid") {
      return acted ? `<p>Azione di Cupido registrata.</p>${timerHtml(d)}` : cupidControls(players);
    }
    if (step === "wolves" && isWolf(me.role)) {
      return acted ? `<p>Azione dei lupi registrata.</p>${timerHtml(d)}` : targetButtons("Lupi: scegliete la vittima", players, me.id, "wolf");
    }
    if (step === "seer" && me.role === "seer") {
      return acted ? `<p>Controllo registrato. Leggi il risultato qui sopra.</p>${timerHtml(d)}` : targetButtons("Veggente: chi controlli?", players, me.id, "seer");
    }
    if (step === "guard" && me.role === "guard") {
      return acted ? `<p>Protezione registrata.</p>${timerHtml(d)}` : targetButtons("Guardia: chi proteggi?", players, null, "guard");
    }
    if (step === "witch" && me.role === "witch") {
      return acted ? `<p>Azione della Strega registrata.</p>${timerHtml(d)}` : witchControls(d, players);
    }
    if (step === "medium" && me.role === "medium") {
      return acted ? `<p>Controllo Medium registrato. Leggi il risultato qui sopra.</p>${timerHtml(d)}` : mediumControls(players);
    }
    return `<p>È notte: <b>${nightStepLabel(step)}</b>. Aspetta il tuo turno.</p>${timerHtml(d)}`;
  }

  if (d.phase === "day") {
    return `<p>È giorno. Discutete dal vivo. Poi si vota.</p>${timerHtml(d)}`;
  }

  if (d.phase === "vote") {
    const votes = d.votes || {};
    if (votes[me.id]) {
      const voted = players.find((p) => p.id === votes[me.id]);
      return `<p>Hai già votato${voted ? `: <b>${voted.name}</b>` : ""}. Potrai rivotare al prossimo giorno.</p>${voteProgress(d, players)}${timerHtml(d)}`;
    }
    return `${targetButtons("Vota chi eliminare", players, me.id, "vote")}${voteProgress(d, players)}${timerHtml(d)}`;
  }

  if (d.phase === "hunter") {
    return "<p>Il narratore sta gestendo il Cacciatore. Attendi.</p>";
  }

  return "<p>Attendi.</p>";
}

function renderHostControls(d, players) {
  let hunterBox = "";
  if (d.phase === "hunter") {
    const hunter = players.find((p) => p.id === d.pendingHunterId);
    hunterBox = `<div class="host-note"><b>Cacciatore:</b> ${hunter?.name || ""} può sparare.
      <div class="action-grid">
        ${alivePlayers(players).filter((p) => p.id !== hunter?.id).map((p) => `<button class="target-btn" data-host-action="hunter:${p.id}">${p.name}</button>`).join("")}
        <button class="secondary full" data-host-action="hunter:skip">Non sparare</button>
      </div>
    </div>`;
  }

  const buttons = [];
  if (d.phase === "night") {
    buttons.push(`<button class="secondary" data-host-action="botsAct">Fai giocare i bot</button>`);
    buttons.push(`<button class="secondary" data-host-action="next">Continua fase</button>`);
    buttons.push(`<button class="secondary" data-host-action="resolveNight">Risolvi notte</button>`);
  }
  if (d.phase === "day") {
    buttons.push(`<button class="primary" data-host-action="startVote">Apri votazione</button>`);
    buttons.push(`<button class="secondary" data-host-action="skipVote">Salta votazione</button>`);
    buttons.push(`<button class="ghost" data-host-action="newNight">Vai direttamente alla notte</button>`);
  }
  if (d.phase === "vote") {
    buttons.push(`<button class="secondary" data-host-action="botsAct">Fai votare i bot</button>`);
    buttons.push(`<button class="primary" data-host-action="resolveVote">Conta voti</button>`);
    buttons.push(`<button class="secondary" data-host-action="skipVote">Annulla voto e vai alla notte</button>`);
  }
  if (!["hunter", "gameOver", "lobby"].includes(d.phase)) {
    buttons.push(`<button class="ghost" data-host-action="toggleAuto">${d.autoMode ? "Disattiva automatico" : "Attiva automatico"}</button>`);
  }

  return `<div class="host-note">
    <b>Pannello narratore</b>
    <p class="hint">${d.hostNote || "Controlli disponibili per questa fase."}</p>
    ${timerHtml(d)}
    ${hunterBox}
    <div class="action-grid">${buttons.join("")}</div>
  </div>`;
}

function targetButtons(title, players, excludeId, action) {
  const targets = alivePlayers(players).filter((p) => p.id !== excludeId);
  return `<p class="action-title">${title}</p><p class="hint">Tocca un nome per confermare l'azione.</p><div class="action-grid">${targets.map((p) => `<button class="target-btn" data-online-action="${action}" data-target="${p.id}">${p.name}</button>`).join("")}</div>`;
}

function cupidControls(players) {
  const alive = alivePlayers(players);
  return `<p>Cupido: scegli due innamorati.</p>
    <div class="cupid-grid">${alive.map((p) => `<button class="target-btn" data-online-action="cupidPick" data-target="${p.id}">${p.name}</button>`).join("")}</div>
    <p id="cupidHint" class="hint">Scegli il primo giocatore.</p>`;
}

let cupidBuffer = [];
async function handleCupidPick(targetId) {
  if (cupidBuffer.includes(targetId)) return toast("Scegli due persone diverse.");
  cupidBuffer.push(targetId);
  if (cupidBuffer.length === 1) {
    $("#cupidHint").textContent = "Ora scegli il secondo innamorato.";
    return;
  }
  const [a, b] = cupidBuffer;
  cupidBuffer = [];
  await submitNightAction("cupid", [a, b]);
}

function witchControls(d, players) {
  const w = d.witch || { save: true, kill: true };
  return `<p>Strega: scegli cosa fare.</p>
    <div class="action-grid">
      ${w.save ? `<button class="secondary" data-online-action="witchSave" data-target="save">Usa pozione salvezza</button>` : "<p>Pozione salvezza già usata.</p>"}
      ${w.kill ? targetButtons("Pozione morte: scegli chi colpire", players, null, "witchKill") : "<p>Pozione morte già usata.</p>"}
      <button class="ghost full" data-online-action="witchSkip" data-target="skip">Non usare pozioni</button>
    </div>`;
}

function mediumControls(players) {
  const dead = (players || []).filter((p) => !p.alive);
  if (!dead.length) return `<p>Medium: non ci sono morti da controllare.</p><button class="secondary full" data-online-action="mediumSkip" data-target="skip">Passa</button>`;
  return `<p>Medium: scegli un morto da controllare.</p><div class="action-grid">${dead.map((p) => `<button class="target-btn" data-online-action="medium" data-target="${p.id}">${p.name}</button>`).join("")}</div>`;
}

function voteProgress(d, players) {
  const alive = alivePlayers(players);
  const votes = d.votes || {};
  const count = alive.filter((p) => votes[p.id]).length;
  return `<div class="vote-progress"><b>${count}/${alive.length}</b> hanno votato</div>`;
}

function nightStepLabel(step) {
  return { cupid: "Cupido", wolves: "Lupi", seer: "Veggente", guard: "Guardia", witch: "Strega", medium: "Medium", dawn: "Arriva il giorno" }[step] || step;
}

function currentNightStep(d, players) {
  const roles = new Set(alivePlayers(players).map((p) => p.role));
  const available = [];
  if (!d.loversChosen && roles.has("cupid")) available.push("cupid");
  if ([...roles].some(isWolf)) available.push("wolves");
  if (roles.has("seer")) available.push("seer");
  if (roles.has("guard")) available.push("guard");
  if (roles.has("witch")) available.push("witch");
  if (roles.has("medium")) available.push("medium");
  available.push("dawn");
  return available[Math.min(d.step || 0, available.length - 1)] || "dawn";
}

function hasActed(d, playerId, step) {
  const n = d.night || {};
  if (step === "cupid") return Boolean(n[`cupid_${playerId}`]);
  if (step === "wolves") return Boolean(n[`wolf_${playerId}`]);
  if (step === "seer") return Boolean(n[`seer_${playerId}`]);
  if (step === "guard") return Boolean(n[`guard_${playerId}`]);
  if (step === "witch") return Boolean(n[`witch_${playerId}`]);
  if (step === "medium") return Boolean(n[`medium_${playerId}`]);
  return false;
}

async function handleOnlinePlayerAction(action, target) {
  if (!room.data || !room.code) return;
  if (action === "cupidPick") return handleCupidPick(target);
  if (action === "vote") return submitVote(target);
  if (["wolf", "seer", "guard", "witchSave", "witchKill", "witchSkip", "medium", "mediumSkip"].includes(action)) {
    return submitNightAction(action, target);
  }
}

async function submitNightAction(action, target) {
  const ref = doc(db, "lupusRooms", room.code);
  let ok = false, msg = "";
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) { msg = "Stanza non trovata."; return; }
    const d = snap.data();
    const players = d.players || [];
    const me = players.find((p) => p.id === room.playerId);
    if (!me || !me.alive) { msg = "Non puoi agire."; return; }
    if (d.phase !== "night") { msg = "Non è notte."; return; }
    const step = currentNightStep(d, players);
    const night = { ...(d.night || {}) };
    const privateResults = { ...(d.privateResults || {}) };
    const patch = { updatedAt: serverTimestamp() };

    if (action === "cupid" && step === "cupid" && me.role === "cupid") {
      const [a, b] = target || [];
      if (!a || !b || a === b) { msg = "Scegli due giocatori diversi."; return; }
      night[`cupid_${me.id}`] = [a, b];
      patch.players = players.map((p) => p.id === a ? { ...p, lover: b } : p.id === b ? { ...p, lover: a } : p);
      patch.loversChosen = true;
      patch.hostNote = "Cupido ha scelto gli innamorati.";
    } else if (action === "wolf" && step === "wolves" && isWolf(me.role)) {
      night[`wolf_${me.id}`] = target;
    } else if (action === "seer" && step === "seer" && me.role === "seer") {
      const t = players.find((p) => p.id === target);
      if (!t) return;
      night[`seer_${me.id}`] = target;
      privateResults[me.id] = { type: "seer", targetName: t.name, result: seerResult(t.role), at: Date.now() };
      patch.privateResults = privateResults;
    } else if (action === "guard" && step === "guard" && me.role === "guard") {
      night[`guard_${me.id}`] = target;
    } else if (step === "witch" && me.role === "witch") {
      const witch = { ...(d.witch || { save: true, kill: true }) };
      if (action === "witchSave" && witch.save) { night[`witch_${me.id}`] = { save: true }; witch.save = false; patch.witch = witch; }
      else if (action === "witchKill" && witch.kill) { night[`witch_${me.id}`] = { kill: target }; witch.kill = false; patch.witch = witch; }
      else if (action === "witchSkip") { night[`witch_${me.id}`] = { skip: true }; }
      else { msg = "Azione Strega non valida."; return; }
    } else if (step === "medium" && me.role === "medium") {
      if (action === "mediumSkip") {
        night[`medium_${me.id}`] = "skip";
      } else {
        const t = players.find((p) => p.id === target && !p.alive);
        if (!t) { msg = "Scegli un morto."; return; }
        night[`medium_${me.id}`] = target;
        privateResults[me.id] = { type: "medium", targetName: t.name, result: roleName(t.role), at: Date.now() };
        patch.privateResults = privateResults;
      }
    } else {
      msg = "Non è il tuo turno.";
      return;
    }

    patch.night = night;
    tx.update(ref, patch);
    ok = true;
  });

  toast(ok ? "Azione registrata." : msg || "Azione non registrata.");
  if (ok) scheduleAuto(true);
}

async function submitVote(targetId) {
  const ref = doc(db, "lupusRooms", room.code);
  let ok = false, msg = "";
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) { msg = "Stanza non trovata."; return; }
    const d = snap.data();
    if (d.phase !== "vote") { msg = "La votazione non è aperta."; return; }
    const players = d.players || [];
    const me = players.find((p) => p.id === room.playerId);
    const target = players.find((p) => p.id === targetId);
    if (!me || !me.alive) { msg = "Non puoi votare."; return; }
    if (!target || !target.alive || target.id === me.id) { msg = "Voto non valido."; return; }
    const votes = { ...(d.votes || {}) };
    if (votes[me.id]) { msg = "Hai già votato."; return; }
    votes[me.id] = targetId;
    tx.update(ref, { votes, updatedAt: serverTimestamp() });
    ok = true;
  });
  toast(ok ? "Voto registrato. Non puoi cambiarlo." : msg || "Voto non registrato.");
  if (ok) scheduleAuto(true);
}

async function handleHostAction(action) {
  if (!room.isHost || !room.data) return toast("Solo chi crea la stanza può farlo.");
  if (action === "bot1") return addBots(1);
  if (action === "bot3") return addBots(3);
  if (action === "bot6") return addBots(6);
  if (action === "clearBots") return clearBots();
  if (action === "botsAct") return botsAct();
  if (action === "toggleAuto") return updateDoc(doc(db, "lupusRooms", room.code), { autoMode: !room.data.autoMode, phaseDeadline: null, updatedAt: serverTimestamp() });
  if (action === "next") return onlineAdvanceManual();
  if (action === "resolveNight") return confirmAction("Risolvi notte", "Vuoi chiudere subito la notte e calcolare le vittime?", () => resolveOnlineNight(room.data), "Risolvi");
  if (action === "startVote") return confirmAction("Aprire votazione", "Vuoi aprire la votazione per tutti i giocatori vivi?", startOnlineVote, "Apri voto");
  if (action === "resolveVote") return confirmAction("Contare voti", "Vuoi contare i voti ed eliminare il più votato?", resolveOnlineVote, "Conta voti");
  if (action === "skipVote") return confirmAction("Saltare voto", "Vuoi saltare la votazione e passare alla notte?", skipOnlineVote, "Salta voto");
  if (action === "newNight") return confirmAction("Nuova notte", "Vuoi passare manualmente alla notte?", () => startOnlineNight(), "Nuova notte");
  if (action.startsWith("hunter:")) return resolveHunterShot(action.split(":")[1]);
}

async function addBots(count) {
  const ref = doc(db, "lupusRooms", room.code);
  const snap = await getDoc(ref);
  if (!snap.exists()) return toast("Stanza non trovata.");
  const d = snap.data();
  if (d.phase !== "lobby") return toast("Puoi aggiungere bot solo in lobby.");
  const players = [...(d.players || [])];
  const names = new Set(players.map((p) => p.name.toLowerCase()));
  let added = 0;
  for (const name of BOT_NAMES) {
    if (added >= count) break;
    if (names.has(name.toLowerCase())) continue;
    players.push({ id: "bot_" + uid(), name, role: null, alive: true, isBot: true, lover: null, joinedAt: Date.now() });
    names.add(name.toLowerCase());
    added++;
  }
  const hostLog = [{ at: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), text: `${added} bot aggiunti.` }, ...((d.hostLog || []).slice(0, 29))];
  await updateDoc(ref, { players, hostLog, updatedAt: serverTimestamp() });
  toast(`${added} bot aggiunti.`);
}

async function clearBots() {
  const ref = doc(db, "lupusRooms", room.code);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const d = snap.data();
  if (d.phase !== "lobby") return toast("Puoi rimuovere bot solo in lobby.");
  const hostLog = [{ at: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), text: "Bot rimossi." }, ...((d.hostLog || []).slice(0, 29))];
  await updateDoc(ref, { players: (d.players || []).filter((p) => !p.isBot), hostLog, updatedAt: serverTimestamp() });
  toast("Bot rimossi.");
}

function randomTarget(players, excludeId, predicate = () => true) {
  const list = alivePlayers(players).filter((p) => p.id !== excludeId && predicate(p));
  return list[Math.floor(Math.random() * list.length)] || null;
}

async function botsAct(silent = false) {
  const d = room.data, players = d.players || [];
  const bots = alivePlayers(players).filter((p) => p.isBot);
  if (!bots.length) {
    if (!silent) toast("Non ci sono bot vivi.");
    return;
  }
  const ref = doc(db, "lupusRooms", room.code);
  const night = { ...(d.night || {}) };
  const votes = { ...(d.votes || {}) };
  const privateResults = { ...(d.privateResults || {}) };
  const witch = { ...(d.witch || { save: true, kill: true }) };
  let patch = {};

  if (d.phase === "night") {
    const step = currentNightStep(d, players);
    bots.forEach((bot) => {
      if (step === "cupid" && bot.role === "cupid" && !night[`cupid_${bot.id}`]) {
        const a = randomTarget(players, bot.id), b = randomTarget(players, a?.id);
        if (a && b) { night[`cupid_${bot.id}`] = [a.id, b.id]; patch.players = players.map((p) => p.id === a.id ? { ...p, lover: b.id } : p.id === b.id ? { ...p, lover: a.id } : p); patch.loversChosen = true; }
      }
      if (step === "wolves" && isWolf(bot.role) && !night[`wolf_${bot.id}`]) {
        const t = randomTarget(players, bot.id, (p) => !isWolf(p.role));
        if (t) night[`wolf_${bot.id}`] = t.id;
      }
      if (step === "seer" && bot.role === "seer" && !night[`seer_${bot.id}`]) {
        const t = randomTarget(players, bot.id);
        if (t) { night[`seer_${bot.id}`] = t.id; privateResults[bot.id] = { type: "seer", targetName: t.name, result: seerResult(t.role), at: Date.now() }; }
      }
      if (step === "guard" && bot.role === "guard" && !night[`guard_${bot.id}`]) {
        const t = randomTarget(players, null);
        if (t) night[`guard_${bot.id}`] = t.id;
      }
      if (step === "witch" && bot.role === "witch" && !night[`witch_${bot.id}`]) {
        if (witch.save && Math.random() < 0.65) { night[`witch_${bot.id}`] = { save: true }; witch.save = false; }
        else if (witch.kill && Math.random() < 0.25) { const t = randomTarget(players, bot.id); if (t) { night[`witch_${bot.id}`] = { kill: t.id }; witch.kill = false; } }
        else night[`witch_${bot.id}`] = { skip: true };
      }
      if (step === "medium" && bot.role === "medium" && !night[`medium_${bot.id}`]) {
        night[`medium_${bot.id}`] = "skip";
      }
    });
    patch = { ...patch, night, witch, privateResults };
  } else if (d.phase === "vote") {
    bots.forEach((bot) => {
      if (!votes[bot.id]) {
        const t = randomTarget(players, bot.id);
        if (t) votes[bot.id] = t.id;
      }
    });
    patch = { votes };
  } else {
    return toast("I bot agiscono solo durante notte o votazione.");
  }
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
  if (!silent) toast("Bot aggiornati.");
  scheduleAuto(true);
}

function scheduleAuto(soon = false) {
  clearTimeout(room.timer);
  const d = room.data;
  if (!room.isHost || !d || !d.autoMode || d.phase === "lobby" || d.phase === "gameOver") return;

  const delay = soon ? 350 : Math.max(500, (d.phaseDeadline || Date.now()) - Date.now());
  room.timer = setTimeout(async () => {
    if (!room.data?.autoMode) return;
    // In automatico fa avanzare l'host; se non c'è host aperto, il primo dispositivo può comunque aiutare.
    try {
      await autoAdvance();
    } catch (err) {
      console.error(err);
    }
  }, delay);
}

async function autoAdvance() {
  const d = room.data;
  if (!d || d.phase === "lobby" || d.phase === "gameOver") return;
  if (d.phase === "night") {
    const players = d.players || [];
    const step = currentNightStep(d, players);
    await botsAct(true);
    const latest = (await getDoc(doc(db, "lupusRooms", room.code))).data();
    if (nightStepReady(latest, currentNightStep(latest, latest.players || [])) || Date.now() >= (latest.phaseDeadline || 0)) {
      await advanceNightStep(latest);
    }
  } else if (d.phase === "day") {
    if (Date.now() >= (d.phaseDeadline || 0)) await startOnlineVote();
  } else if (d.phase === "vote") {
    await botsAct(true);
    const latest = (await getDoc(doc(db, "lupusRooms", room.code))).data();
    const alive = alivePlayers(latest.players || []);
    const votes = latest.votes || {};
    if (alive.every((p) => votes[p.id]) || Date.now() >= (latest.phaseDeadline || 0)) {
      await resolveOnlineVote();
    }
  }
}

function nightStepReady(d, step) {
  const players = d.players || [];
  const alive = alivePlayers(players);
  if (step === "dawn") return true;
  if (step === "cupid") return alive.filter((p) => p.role === "cupid").every((p) => hasActed(d, p.id, step));
  if (step === "wolves") return alive.filter((p) => isWolf(p.role)).every((p) => hasActed(d, p.id, step));
  if (step === "seer") return alive.filter((p) => p.role === "seer").every((p) => hasActed(d, p.id, step));
  if (step === "guard") return alive.filter((p) => p.role === "guard").every((p) => hasActed(d, p.id, step));
  if (step === "witch") return alive.filter((p) => p.role === "witch").every((p) => hasActed(d, p.id, step));
  if (step === "medium") return alive.filter((p) => p.role === "medium").every((p) => hasActed(d, p.id, step));
  return true;
}

async function onlineAdvanceManual() {
  const d = room.data;
  if (!d) return;
  if (d.phase === "night") return advanceNightStep(d);
  if (d.phase === "day") return startOnlineVote();
  if (d.phase === "vote") return resolveOnlineVote();
}

async function advanceNightStep(d) {
  const players = d.players || [];
  const step = currentNightStep(d, players);
  if (step === "dawn") return resolveOnlineNight(d);

  const nextStep = (d.step || 0) + 1;
  const seconds = Number(d.phaseSeconds || 20);
  const nextKey = currentNightStep({ ...d, step: nextStep }, players);
  const texts = {
    cupid: narr("intro", "Cupido sceglie due innamorati."),
    wolves: narr("wolves", "I lupi scelgono una vittima."),
    seer: narr("seer", "Il Veggente sceglie chi controllare."),
    guard: narr("guard", "La Guardia sceglie chi proteggere."),
    witch: narr("witch", "La Strega decide se usare le pozioni."),
    medium: "Il Medium può controllare un morto.",
    dawn: narr("day", "La notte si chiude. Si scopre cosa è successo.")
  };

  await updateDoc(doc(db, "lupusRooms", room.code), {
    step: nextStep,
    narration: texts[nextKey] || "Notte.",
    phaseDeadline: seconds > 0 ? Date.now() + seconds * 1000 : null,
    updatedAt: serverTimestamp()
  });
}

async function resolveOnlineNight(d = room.data) {
  const players = d.players || [];
  const night = d.night || {};
  const deadIds = [];

  const wolfTargets = Object.entries(night).filter(([k]) => k.startsWith("wolf_")).map(([, v]) => v);
  const wolfVictim = mostFrequent(wolfTargets);
  const guardTargets = Object.entries(night).filter(([k]) => k.startsWith("guard_")).map(([, v]) => v);
  const protectedId = guardTargets[0] || null;
  const witchActions = Object.entries(night).filter(([k]) => k.startsWith("witch_")).map(([, v]) => v);
  const witchSaved = witchActions.some((a) => a?.save);
  const witchKill = witchActions.find((a) => a?.kill)?.kill || null;

  if (wolfVictim && wolfVictim !== protectedId && !witchSaved) deadIds.push(wolfVictim);
  if (witchKill) deadIds.push(witchKill);

  const updatedPlayers = applyLoversDeath(players, deadIds);
  const deadNames = [...new Set(deadIds)].map((id) => players.find((p) => p.id === id)?.name).filter(Boolean);
  const hunter = updatedPlayers.find((p) => deadIds.includes(p.id) && p.role === "hunter");
  const win = checkWin(updatedPlayers);

  const baseText = deadNames.length ? narr("death", deadNames.map(publicDeath).join(" ")) : narr("safe", "Non è morto nessuno.");
  const seconds = Number(d.phaseSeconds || 20);
  const nightLogText = deadNames.length ? `Notte risolta: morti ${deadNames.join(", ")}.` : "Notte risolta: nessun morto.";
  const hostLog = [{ at: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), text: nightLogText }, ...((d.hostLog || []).slice(0, 29))];

  if (win) {
    await updateDoc(doc(db, "lupusRooms", room.code), {
      players: updatedPlayers,
      phase: "gameOver",
      winnerText: win,
      narration: `${baseText} ${win}`,
      night: {},
      hostLog,
      phaseDeadline: null,
      updatedAt: serverTimestamp()
    });
  } else if (hunter) {
    await updateDoc(doc(db, "lupusRooms", room.code), {
      players: updatedPlayers,
      phase: "hunter",
      pendingHunterId: hunter.id,
      narration: baseText,
      hostNote: `${hunter.name} era il Cacciatore: può sparare.`,
      night: {},
      hostLog,
      phaseDeadline: null,
      updatedAt: serverTimestamp()
    });
  } else {
    await updateDoc(doc(db, "lupusRooms", room.code), {
      players: updatedPlayers,
      phase: "day",
      step: 0,
      dayNumber: (d.dayNumber || 0) + 1,
      narration: `${baseText} Ora discutete.`,
      night: {},
      hostLog,
      votes: {},
      phaseDeadline: seconds > 0 ? Date.now() + seconds * 1000 : null,
      updatedAt: serverTimestamp()
    });
  }
}

function mostFrequent(values) {
  const counts = {};
  values.filter(Boolean).forEach((v) => counts[v] = (counts[v] || 0) + 1);
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return null;
  const top = entries[0][1];
  const tied = entries.filter(([, n]) => n === top);
  return tied.length === 1 ? entries[0][0] : null;
}

async function startOnlineVote() {
  const d = room.data;
  if (!d || d.phase !== "day") return toast("La votazione si può aprire solo durante il giorno.");
  const seconds = Number(d.phaseSeconds || 20);
  const hostLog = [{ at: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), text: "Votazione aperta." }, ...((d.hostLog || []).slice(0, 29))];
  await updateDoc(doc(db, "lupusRooms", room.code), {
    phase: "vote",
    votes: {},
    voteRound: (d.voteRound || 0) + 1,
    narration: narr("vote", "Ogni giocatore vivo può votare una sola volta."),
    hostLog,
    phaseDeadline: seconds > 0 ? Date.now() + seconds * 1000 : null,
    updatedAt: serverTimestamp()
  });
}

async function skipOnlineVote() {
  const d = room.data;
  if (!d || d.phase === "gameOver") return;
  await startOnlineNight(narr("skip", "Il voto è stato saltato."));
}

async function startOnlineNight(customText = null) {
  const d = room.data;
  if (!d || d.phase === "gameOver") return;
  const seconds = Number(d.phaseSeconds || 20);
  const hostLog = [{ at: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), text: "Nuova notte iniziata." }, ...((d.hostLog || []).slice(0, 29))];
  await updateDoc(doc(db, "lupusRooms", room.code), {
    phase: "night",
    step: 0,
    nightNumber: (d.nightNumber || 0) + 1,
    votes: {},
    night: {},
    narration: customText || narr("night", "Tutti chiudono gli occhi. Ricomincia la notte."),
    hostLog,
    phaseDeadline: seconds > 0 ? Date.now() + seconds * 1000 : null,
    updatedAt: serverTimestamp()
  });
}

async function resolveOnlineVote() {
  const d = room.data;
  if (!d || d.phase !== "vote") return;
  const players = d.players || [];
  const { targetId, tie } = countVotes(players, d.votes || {});
  if (tie || !targetId) {
    await startOnlineNight(narr("tie", "Nessuno viene eliminato. Tutti chiudono gli occhi."));
    return;
  }

  const target = players.find((p) => p.id === targetId);
  let updatedPlayers = applyLoversDeath(players, [targetId]);

  const voteLog = [{ at: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), text: `${target.name} eliminato al voto.` }, ...((d.hostLog || []).slice(0, 29))];

  if (target.role === "jester") {
    await updateDoc(doc(db, "lupusRooms", room.code), {
      players: updatedPlayers,
      phase: "gameOver",
      winnerText: "Il Giullare ha vinto facendosi eliminare dal villaggio.",
      narration: `${target.name} è stato eliminato. Il ruolo resta segreto. Il Giullare ha vinto.`,
      phaseDeadline: null,
      updatedAt: serverTimestamp()
    });
    return;
  }

  if (target.role === "hunter") {
    await updateDoc(doc(db, "lupusRooms", room.code), {
      players: updatedPlayers,
      phase: "hunter",
      pendingHunterId: target.id,
      narration: `${target.name} è stato eliminato. Il ruolo resta segreto.`,
      hostNote: `${target.name} era il Cacciatore: può sparare.`,
      phaseDeadline: null,
      updatedAt: serverTimestamp()
    });
    return;
  }

  const win = checkWin(updatedPlayers);
  if (win) {
    await updateDoc(doc(db, "lupusRooms", room.code), {
      players: updatedPlayers,
      phase: "gameOver",
      winnerText: win,
      narration: `${target.name} è stato eliminato. Il ruolo resta segreto. ${win}`,
      phaseDeadline: null,
      updatedAt: serverTimestamp()
    });
  } else {
    await startOnlineNight(`${target.name} è stato eliminato. Il ruolo resta segreto. Tutti chiudono gli occhi.`);
    await updateDoc(doc(db, "lupusRooms", room.code), { players: updatedPlayers, updatedAt: serverTimestamp() });
  }
}

async function resolveHunterShot(targetId) {
  const d = room.data;
  if (!d || d.phase !== "hunter") return;
  let players = d.players || [];
  if (targetId && targetId !== "skip") {
    players = applyLoversDeath(players, [targetId]);
  }
  const win = checkWin(players);
  if (win) {
    await updateDoc(doc(db, "lupusRooms", room.code), {
      players,
      phase: "gameOver",
      winnerText: win,
      narration: `Il Cacciatore ha scelto. ${win}`,
      pendingHunterId: null,
      phaseDeadline: null,
      updatedAt: serverTimestamp()
    });
  } else {
    const seconds = Number(d.phaseSeconds || 20);
    await updateDoc(doc(db, "lupusRooms", room.code), {
      players,
      phase: "day",
      pendingHunterId: null,
      hostNote: "",
      narration: "Il Cacciatore ha scelto. La discussione può continuare.",
      phaseDeadline: seconds > 0 ? Date.now() + seconds * 1000 : null,
      updatedAt: serverTimestamp()
    });
  }
}
