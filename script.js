import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  deleteDoc
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

const screen = document.querySelector("#screen");
const resetBtn = document.querySelector("#resetBtn");
let state = {
  roomCode: localStorage.getItem("lupus_room") || "",
  playerId: localStorage.getItem("lupus_pid") || makeId(),
  isHost: localStorage.getItem("lupus_host") === "1",
  room: null,
  players: [],
  unsubRoom: null,
  unsubPlayers: null,
  single: null
};
localStorage.setItem("lupus_pid", state.playerId);

const ROLES = {
  wolf: { name: "Lupo Mannaro", team: "Lupi", icon: "🐺", desc: "Di notte scegli la vittima con gli altri lupi." },
  villager: { name: "Contadino", team: "Villaggio", icon: "🌾", desc: "Scopri i lupi con discussione e voto." },
  seer: { name: "Veggente", team: "Villaggio", icon: "🔮", desc: "Di notte controlli se una persona è lupo." },
  guard: { name: "Guardia", team: "Villaggio", icon: "🛡️", desc: "Di notte proteggi una persona." },
  witch: { name: "Strega", team: "Villaggio", icon: "🧪", desc: "Variante semplice: giochi come cittadino speciale." }
};

function $(id){ return document.getElementById(id); }
function makeId(){ return Math.random().toString(36).slice(2, 10); }
function makeCode(){ return "L" + Math.random().toString(36).slice(2, 7).toUpperCase(); }
function toast(msg){
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}
function cloneTemplate(id){
  const t = document.querySelector(id);
  screen.innerHTML = "";
  screen.appendChild(t.content.cloneNode(true));
}
function alivePlayers(){ return state.players.filter(p => p.alive !== false); }
function me(){ return state.players.find(p => p.id === state.playerId); }
function roomRef(){ return doc(db, "lupusRooms", state.roomCode); }
function playersCol(){ return collection(db, "lupusRooms", state.roomCode, "players"); }
function playerRef(id = state.playerId){ return doc(db, "lupusRooms", state.roomCode, "players", id); }

resetBtn.addEventListener("click", async () => {
  if (state.unsubRoom) state.unsubRoom();
  if (state.unsubPlayers) state.unsubPlayers();
  localStorage.removeItem("lupus_room");
  localStorage.removeItem("lupus_host");
  state.roomCode = "";
  state.room = null;
  state.players = [];
  state.isHost = false;
  showHome();
});

if (state.roomCode) subscribeRoom(state.roomCode); else showHome();

function showHome(){
  cloneTemplate("#homeTemplate");
  $("createRoomBtn").onclick = showHostSetup;
  $("singleDeviceBtn").onclick = showSingleDevice;
  $("joinRoomBtn").onclick = joinRoom;
}

function showHostSetup(){
  cloneTemplate("#hostSetupTemplate");
  $("confirmCreateBtn").onclick = createRoom;
}

async function createRoom(){
  const name = ($("hostName").value || "Narratore").trim();
  const code = makeCode();
  state.roomCode = code;
  state.isHost = true;
  localStorage.setItem("lupus_room", code);
  localStorage.setItem("lupus_host", "1");

  const settings = {
    wolves: Number($("wolvesCount").value || 2),
    seer: Number($("seerCount").value || 1),
    guard: Number($("guardCount").value || 1),
    witch: Number($("witchCount").value || 0)
  };

  await setDoc(doc(db, "lupusRooms", code), {
    code,
    hostId: state.playerId,
    status: "lobby",
    day: 0,
    phaseLabel: "Lobby",
    settings,
    currentAction: "none",
    wolfTarget: null,
    guardTarget: null,
    killedLast: null,
    eliminatedLast: null,
    voteOpen: false,
    log: ["Stanza creata. Fai entrare i giocatori con il codice."],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  await setDoc(doc(db, "lupusRooms", code, "players", state.playerId), {
    name,
    role: "host",
    alive: true,
    isHost: true,
    joinedAt: serverTimestamp(),
    vote: null,
    nightAction: null
  });

  subscribeRoom(code);
}

async function joinRoom(){
  const code = ($("joinCode").value || "").trim().toUpperCase();
  const name = ($("joinName").value || "").trim();
  if (!name || !code) return toast("Inserisci nome e codice stanza");
  const snap = await getDoc(doc(db, "lupusRooms", code));
  if (!snap.exists()) return toast("Stanza non trovata");
  const room = snap.data();
  if (room.status !== "lobby") return toast("Partita già iniziata");

  state.roomCode = code;
  state.isHost = false;
  localStorage.setItem("lupus_room", code);
  localStorage.setItem("lupus_host", "0");
  await setDoc(doc(db, "lupusRooms", code, "players", state.playerId), {
    name,
    role: null,
    alive: true,
    isHost: false,
    joinedAt: serverTimestamp(),
    vote: null,
    nightAction: null
  }, { merge: true });
  subscribeRoom(code);
}

function subscribeRoom(code){
  cloneTemplate("#roomTemplate");
  $("roomCodeText").textContent = code;
  $("copyCodeBtn").onclick = () => navigator.clipboard.writeText(code).then(() => toast("Codice copiato"));

  if (state.unsubRoom) state.unsubRoom();
  if (state.unsubPlayers) state.unsubPlayers();

  state.unsubRoom = onSnapshot(doc(db, "lupusRooms", code), snap => {
    if (!snap.exists()) { showHome(); return; }
    state.room = snap.data();
    state.isHost = state.room.hostId === state.playerId || localStorage.getItem("lupus_host") === "1";
    renderRoom();
  });

  state.unsubPlayers = onSnapshot(collection(db, "lupusRooms", code, "players"), snap => {
    state.players = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (a.joinedAt?.seconds || 0) - (b.joinedAt?.seconds || 0));
    renderRoom();
  });
}

function renderRoom(){
  if (!state.room || !$("playersList")) return;
  const r = state.room;
  const player = me();
  $("phaseLabel").textContent = r.phaseLabel || r.status;
  $("playerCount").textContent = state.players.filter(p => !p.isHost).length;

  const titleMap = {
    lobby: "In attesa dei giocatori",
    roleReveal: "Ruoli assegnati",
    night: "Notte",
    day: "Giorno",
    vote: "Votazione aperta",
    ended: "Partita conclusa"
  };
  $("mainTitle").textContent = titleMap[r.status] || "Partita";
  $("mainSubtitle").textContent = subtitleForRoom(r);

  renderPlayers();
  renderRole(player);
  renderHostControls();
  renderPlayerActions(player);
  renderLog();
}

function subtitleForRoom(r){
  if (r.status === "lobby") return "Condividi il codice stanza. Quando sono entrati tutti, il narratore avvia la partita.";
  if (r.status === "roleReveal") return "Ogni giocatore vede la propria carta sul suo dispositivo.";
  if (r.status === "night") return nightSubtitle(r.currentAction);
  if (r.status === "day") return r.killedLast ? `Durante la notte è morto: ${r.killedLast}. Discutete e poi aprite le votazioni.` : "Nessuno è morto durante la notte. Discutete e poi votate.";
  if (r.status === "vote") return "Ogni giocatore vivo vota dal suo dispositivo.";
  return "";
}
function nightSubtitle(action){
  if (action === "wolves") return "I lupi scelgono una vittima dai loro dispositivi.";
  if (action === "seer") return "Il veggente può controllare una persona.";
  if (action === "guard") return "La guardia sceglie chi proteggere.";
  if (action === "resolve") return "Il narratore può risolvere la notte.";
  return "Tutti chiudono gli occhi. Il narratore chiama i ruoli.";
}

function renderPlayers(){
  const box = $("playersList");
  box.innerHTML = "";
  state.players.forEach(p => {
    const div = document.createElement("div");
    div.className = "player" + (p.alive === false ? " dead" : "");
    const roleText = state.isHost && p.role && p.role !== "host" ? ` · ${ROLES[p.role]?.name || p.role}` : "";
    div.innerHTML = `<div><div class="playerName">${escapeHtml(p.name || "Senza nome")}</div><div class="playerMeta">${p.isHost ? "Narratore" : p.alive === false ? "Eliminato" : "In gioco"}${roleText}</div></div>${p.vote ? '<span class="pill">ha votato</span>' : ''}`;
    box.appendChild(div);
  });
}

function renderRole(player){
  const box = $("privateRoleCard");
  if (!player || player.isHost || !player.role || player.role === "host") { box.classList.add("hidden"); return; }
  const role = ROLES[player.role] || ROLES.villager;
  box.classList.remove("hidden");
  box.innerHTML = `<div class="roleIcon">${role.icon}</div><div class="roleName">${role.name}</div><div class="roleTeam">Squadra: ${role.team}</div><p class="muted" style="margin-top:10px">${role.desc}</p>${player.alive === false ? '<p class="pill" style="margin-top:14px">Sei eliminato</p>' : ''}`;
}

function renderHostControls(){
  const box = $("hostControls");
  if (!state.isHost) { box.classList.add("hidden"); return; }
  box.classList.remove("hidden");
  const r = state.room;
  let html = `<h3>Comandi narratore</h3><div class="actions">`;
  if (r.status === "lobby") html += `<button class="primary" data-act="start">Assegna ruoli e inizia</button>`;
  if (r.status === "roleReveal") html += `<button class="primary" data-act="night">Inizia la notte</button>`;
  if (r.status === "night") {
    html += `<button class="secondary" data-act="wolves">Chiama i lupi</button>`;
    html += `<button class="secondary" data-act="seer">Chiama il veggente</button>`;
    html += `<button class="secondary" data-act="guard">Chiama la guardia</button>`;
    html += `<button class="primary" data-act="resolveNight">Risolvi notte e passa al giorno</button>`;
    html += renderNightVotesHost();
  }
  if (r.status === "day") html += `<button class="primary" data-act="openVote">Apri votazione</button><button class="secondary" data-act="night">Salta voto e torna alla notte</button>`;
  if (r.status === "vote") html += renderVoteResultsHost() + `<button class="danger" data-act="finalizeVote">Elimina più votato</button>`;
  html += `<button class="ghost" data-act="resetVotes">Pulisci voti/azioni</button>`;
  html += `</div>`;
  box.innerHTML = html;
  box.querySelectorAll("button[data-act]").forEach(btn => btn.onclick = () => hostAction(btn.dataset.act));
}

function renderNightVotesHost(){
  const wolfVotes = countBy(state.players.filter(p => p.role === "wolf" && p.alive !== false).map(p => p.nightAction).filter(Boolean));
  const rows = Object.entries(wolfVotes).map(([id,c]) => `<div class="voteRow"><span>${nameById(id)}</span><b>${c}</b></div>`).join("") || `<p class="muted">Nessuna scelta dei lupi.</p>`;
  return `<div class="card" style="box-shadow:none;margin:8px 0;background:#10141e"><h3>Scelte lupi</h3>${rows}</div>`;
}
function renderVoteResultsHost(){
  const votes = countBy(alivePlayers().filter(p => !p.isHost).map(p => p.vote).filter(Boolean));
  const rows = Object.entries(votes).map(([id,c]) => `<div class="voteRow"><span>${nameById(id)}</span><b>${c}</b></div>`).join("") || `<p class="muted">Nessun voto ancora.</p>`;
  return `<div class="card" style="box-shadow:none;margin:8px 0;background:#10141e"><h3>Risultati voto</h3>${rows}</div>`;
}

async function hostAction(act){
  if (act === "start") return startOnlineGame();
  if (act === "night") return startNight();
  if (["wolves","seer","guard"].includes(act)) return updateDoc(roomRef(), { status:"night", currentAction: act, phaseLabel: "Notte · " + (act === "wolves" ? "Lupi" : act === "seer" ? "Veggente" : "Guardia"), updatedAt: serverTimestamp() });
  if (act === "resolveNight") return resolveNight();
  if (act === "openVote") return openVote();
  if (act === "finalizeVote") return finalizeVote();
  if (act === "resetVotes") return resetVotesAndActions();
}

async function startOnlineGame(){
  const realPlayers = state.players.filter(p => !p.isHost);
  if (realPlayers.length < 5) return toast("Consigliati almeno 5 giocatori");
  const s = state.room.settings || { wolves:2, seer:1, guard:1, witch:0 };
  const special = [
    ...Array(s.wolves).fill("wolf"),
    ...Array(s.seer).fill("seer"),
    ...Array(s.guard).fill("guard"),
    ...Array(s.witch).fill("witch")
  ];
  if (special.length > realPlayers.length) return toast("Troppi ruoli speciali per questi giocatori");
  const deck = shuffle([...special, ...Array(realPlayers.length - special.length).fill("villager")]);
  const batch = writeBatch(db);
  realPlayers.forEach((p, i) => batch.update(playerRef(p.id), { role: deck[i], alive: true, vote: null, nightAction: null }));
  batch.update(roomRef(), { status:"roleReveal", phaseLabel:"Carte ruolo", day:0, currentAction:"none", killedLast:null, eliminatedLast:null, log: addLog("Ruoli assegnati. Ogni giocatore può vedere la propria carta."), updatedAt: serverTimestamp() });
  await batch.commit();
}

async function startNight(){
  const batch = writeBatch(db);
  state.players.forEach(p => batch.update(playerRef(p.id), { vote: null, nightAction: null }));
  batch.update(roomRef(), { status:"night", phaseLabel:"Notte", currentAction:"none", killedLast:null, eliminatedLast:null, wolfTarget:null, guardTarget:null, day:(state.room.day || 0) + 1, voteOpen:false, log:addLog("Scende la notte. Tutti chiudono gli occhi."), updatedAt: serverTimestamp() });
  await batch.commit();
}

async function resolveNight(){
  const wolves = state.players.filter(p => p.role === "wolf" && p.alive !== false);
  const wolfVotes = countBy(wolves.map(p => p.nightAction).filter(Boolean));
  const victimId = topKey(wolfVotes);
  const guard = state.players.find(p => p.role === "guard" && p.alive !== false);
  const guardTarget = guard?.nightAction || null;
  let killedName = null;
  const batch = writeBatch(db);
  if (victimId && victimId !== guardTarget) {
    const victim = state.players.find(p => p.id === victimId);
    if (victim) {
      killedName = victim.name;
      batch.update(playerRef(victimId), { alive: false });
    }
  }
  state.players.forEach(p => batch.update(playerRef(p.id), { nightAction: null, vote: null }));
  batch.update(roomRef(), { status:"day", phaseLabel:"Giorno", currentAction:"none", killedLast:killedName, log:addLog(killedName ? `Al mattino viene trovato morto: ${killedName}.` : "Al mattino non è morto nessuno."), updatedAt: serverTimestamp() });
  await batch.commit();
  await checkWin();
}

async function openVote(){
  const batch = writeBatch(db);
  state.players.forEach(p => batch.update(playerRef(p.id), { vote: null }));
  batch.update(roomRef(), { status:"vote", phaseLabel:"Votazione", voteOpen:true, log:addLog("Votazione aperta."), updatedAt: serverTimestamp() });
  await batch.commit();
}

async function finalizeVote(){
  const votes = countBy(alivePlayers().filter(p => !p.isHost).map(p => p.vote).filter(Boolean));
  const eliminatedId = topKey(votes);
  if (!eliminatedId) return toast("Nessun voto da conteggiare");
  const eliminated = state.players.find(p => p.id === eliminatedId);
  const batch = writeBatch(db);
  batch.update(playerRef(eliminatedId), { alive: false });
  state.players.forEach(p => batch.update(playerRef(p.id), { vote: null }));
  batch.update(roomRef(), { status:"day", phaseLabel:"Giorno", voteOpen:false, eliminatedLast: eliminated?.name || null, log:addLog(`${eliminated?.name || "Un giocatore"} è stato eliminato dal villaggio.`), updatedAt: serverTimestamp() });
  await batch.commit();
  await checkWin();
}

async function resetVotesAndActions(){
  const batch = writeBatch(db);
  state.players.forEach(p => batch.update(playerRef(p.id), { vote: null, nightAction: null }));
  batch.update(roomRef(), { voteOpen:false, wolfTarget:null, guardTarget:null, updatedAt: serverTimestamp() });
  await batch.commit();
}

async function checkWin(){
  const alive = alivePlayers().filter(p => !p.isHost);
  const wolves = alive.filter(p => p.role === "wolf").length;
  const village = alive.length - wolves;
  if (wolves === 0) await updateDoc(roomRef(), { status:"ended", phaseLabel:"Fine", log:addLog("Vincono i cittadini: tutti i lupi sono stati eliminati.") });
  else if (wolves >= village) await updateDoc(roomRef(), { status:"ended", phaseLabel:"Fine", log:addLog("Vincono i lupi: sono pari o superiori ai cittadini.") });
}

function renderPlayerActions(player){
  const box = $("playerActions");
  if (!player || player.isHost || player.alive === false) { box.classList.add("hidden"); return; }
  const r = state.room;
  let html = `<h3>Le tue azioni</h3>`;
  if (r.status === "night" && r.currentAction === "wolves" && player.role === "wolf") {
    html += `<p class="muted">Scegli la vittima. Gli altri non vedono la tua scelta.</p>${choiceButtons("night", alivePlayers().filter(p => !p.isHost && p.role !== "wolf"), player.nightAction)}`;
  } else if (r.status === "night" && r.currentAction === "seer" && player.role === "seer") {
    html += `<p class="muted">Scegli chi controllare. Il risultato appare solo a te.</p>${choiceButtons("seer", alivePlayers().filter(p => !p.isHost && p.id !== player.id), player.nightAction)}`;
  } else if (r.status === "night" && r.currentAction === "guard" && player.role === "guard") {
    html += `<p class="muted">Scegli chi proteggere.</p>${choiceButtons("night", alivePlayers().filter(p => !p.isHost), player.nightAction)}`;
  } else if (r.status === "vote") {
    html += `<p class="muted">Vota chi eliminare.</p>${choiceButtons("vote", alivePlayers().filter(p => !p.isHost && p.id !== player.id), player.vote)}`;
  } else {
    html += `<p class="muted">Non hai azioni da fare in questa fase.</p>`;
  }
  box.classList.remove("hidden");
  box.innerHTML = html;
  box.querySelectorAll("button[data-choice]").forEach(btn => btn.onclick = () => playerChoice(btn.dataset.type, btn.dataset.choice));
}

function choiceButtons(type, list, selected){
  return `<div class="choiceGrid">${list.map(p => `<button class="choice ${selected === p.id ? 'selected' : ''}" data-type="${type}" data-choice="${p.id}"><span>${escapeHtml(p.name)}</span>${selected === p.id ? '<b>✓</b>' : ''}</button>`).join("")}</div>`;
}

async function playerChoice(type, targetId){
  const player = me();
  if (!player || player.alive === false) return;
  if (type === "vote") await updateDoc(playerRef(), { vote: targetId });
  if (type === "night") await updateDoc(playerRef(), { nightAction: targetId });
  if (type === "seer") {
    await updateDoc(playerRef(), { nightAction: targetId });
    const target = state.players.find(p => p.id === targetId);
    toast(`${target?.name || "Giocatore"}: ${target?.role === "wolf" ? "È LUPO" : "Non è lupo"}`);
  }
}

function renderLog(){
  const log = state.room.log || [];
  $("logBox").innerHTML = `<h3>Cronologia</h3>${log.slice(-6).reverse().map(x => `<p>• ${escapeHtml(x)}</p>`).join("") || '<p class="muted">Nessun evento.</p>'}`;
}
function addLog(text){ return [...(state.room?.log || []), text].slice(-30); }
function countBy(arr){ return arr.reduce((a,x) => { a[x] = (a[x] || 0) + 1; return a; }, {}); }
function topKey(obj){ return Object.entries(obj).sort((a,b) => b[1] - a[1])[0]?.[0] || null; }
function nameById(id){ return state.players.find(p => p.id === id)?.name || "---"; }
function shuffle(arr){ return arr.map(v => [Math.random(), v]).sort((a,b) => a[0]-b[0]).map(x => x[1]); }
function escapeHtml(str=""){ return String(str).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }

function showSingleDevice(){
  cloneTemplate("#singleTemplate");
  $("startSingleBtn").onclick = startSingle;
}
function startSingle(){
  const names = ($("singleNames").value || "").split(/\n|,/).map(x => x.trim()).filter(Boolean);
  if (names.length < 5) return toast("Inserisci almeno 5 giocatori");
  const special = [
    ...Array(Number($("singleWolves").value || 2)).fill("wolf"),
    ...Array(Number($("singleSeer").value || 1)).fill("seer"),
    ...Array(Number($("singleGuard").value || 1)).fill("guard"),
    ...Array(Number($("singleWitch").value || 0)).fill("witch")
  ];
  if (special.length > names.length) return toast("Troppi ruoli speciali");
  const deck = shuffle([...special, ...Array(names.length - special.length).fill("villager")]);
  state.single = { phase:"Carte ruolo", day:0, players:names.map((name,i) => ({ name, role:deck[i], alive:true })) };
  renderSingle();
}
function renderSingle(){
  const box = $("singleGame");
  box.classList.remove("hidden");
  const s = state.single;
  box.innerHTML = `<section class="card"><p class="phase">${s.phase}</p><h2>Partita locale</h2><div class="actions"><button class="primary" id="singleNight">Notte</button><button class="secondary" id="singleDay">Giorno</button></div></section><section class="card"><h3>Carte segrete</h3><div class="singleCards">${s.players.map((p,i) => `<div class="secretCard"><b>${escapeHtml(p.name)}</b><p class="muted">Tocca per mostrare/nascondere</p><button class="secondary" data-single="${i}">Mostra carta</button></div>`).join("")}</div></section>`;
  $("singleNight").onclick = () => { state.single.phase = "Notte"; renderSingle(); };
  $("singleDay").onclick = () => { state.single.phase = "Giorno"; renderSingle(); };
  box.querySelectorAll("button[data-single]").forEach(btn => btn.onclick = () => {
    const p = state.single.players[Number(btn.dataset.single)];
    const role = ROLES[p.role];
    btn.closest(".secretCard").innerHTML = `<div class="bigCenter"><div class="roleIcon">${role.icon}</div><div class="roleName">${role.name}</div><p class="roleTeam">${p.name}</p></div>`;
  });
}
