import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";
import {
  getFirestore, doc, collection, getDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, serverTimestamp, runTransaction, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
isSupported().then(ok => { if (ok) getAnalytics(app); }).catch(() => {});
const db = getFirestore(app);

const TILE = 64;
const FOV = Math.PI / 3.1;
const RAYS = 240;
const MAX_DEPTH = 18;
const BASE_SPEED = 3.05;
const ROT_SPEED = 2.75;
const CLIENT_ID = localStorage.getItem("ww3d_client_id") || crypto.randomUUID();
localStorage.setItem("ww3d_client_id", CLIENT_ID);

const mapRows = [
"1111111111111111111","1000001000001000001","1000001000001000001","1000000000000000001",
"1000001000001000001","1110111110111110111","1000000000000000001","1000001000001000001",
"1000001000001000001","1110111110111110111","1000001000001000001","1000000000000000001",
"1000001000001000001","1000001000001000001","1111111111111111111"
];

const rooms = [
  {id:"beach", name:"Spiaggia", emoji:"🏖️", x1:1, y1:1, x2:5, y2:4, color:"#ffb36a", tasks:["Sistema ombrelloni","Raccogli oggetti","Controlla torrette"]},
  {id:"bar", name:"Bar", emoji:"🍹", x1:7, y1:1, x2:11, y2:4, color:"#8bc3ff", tasks:["Prepara drink","Conta cassa","Riavvia frigo"]},
  {id:"kitchen", name:"Cucina", emoji:"🍝", x1:13, y1:1, x2:17, y2:4, color:"#ff8c7a", tasks:["Ripara forno","Controlla scorte","Sistema lavello"]},
  {id:"hall", name:"Sala Centrale", emoji:"🏛️", x1:1, y1:6, x2:17, y2:8, color:"#ffd76c", tasks:["Controlla telecamere","Aggiorna registro","Sincronizza mappa"]},
  {id:"cabins", name:"Cabine", emoji:"🚪", x1:1, y1:10, x2:5, y2:13, color:"#c8a8ff", tasks:["Controlla chiavi","Pulisci cabina 3","Ripara serratura"]},
  {id:"tech", name:"Cabina Tech", emoji:"⚡", x1:7, y1:10, x2:11, y2:13, color:"#74f0ff", tasks:["Riattiva quadro","Ripara server","Calibra sensori"]},
  {id:"bath", name:"Bagni", emoji:"🚿", x1:13, y1:10, x2:17, y2:13, color:"#7dffa8", tasks:["Ripulisci bagni","Sistema rubinetto","Ricarica dispenser"]}
];

const starts = [
  {x:2.3,y:2.2,a:0},{x:9.2,y:2.2,a:Math.PI},{x:15.2,y:2.2,a:Math.PI},
  {x:4.2,y:7.2,a:0},{x:2.4,y:12.2,a:0},{x:9.2,y:12.2,a:Math.PI},
  {x:15.2,y:12.2,a:Math.PI},{x:4.5,y:3.2,a:0},{x:14.8,y:3.2,a:Math.PI}
];

const state = {
  roomId: "",
  joined: false,
  room: null,
  players: [],
  bodies: [],
  self: null,
  graphics: "realistic",
  local: { x:2.3*TILE, y:2.2*TILE, angle:0, stamina:100, bob:0 },
  keys: {},
  touch: {forward:false,back:false,left:false,right:false,turnL:false,turnR:false,sprint:false},
  unsubs: [],
  activeTaskId: null,
  dragging: false,
  lastPointerX: 0,
  lastSend: 0,
  lastTime: performance.now(),
  currentRoomBanner: ""
};

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const mini = document.getElementById("miniMap");
const mctx = mini.getContext("2d");

function qs(id){ return document.getElementById(id); }
function toast(msg){ const t=qs("toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),2200); }
function esc(t){ return String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }
function showScreen(id){ document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active")); qs(id).classList.add("active"); document.body.classList.toggle("game-mode", id==="gameScreen"); }
function roomRef(){ return doc(db, "werewolfRooms", state.roomId); }
function playersCol(){ return collection(db, "werewolfRooms", state.roomId, "players"); }
function playerRef(id=CLIENT_ID){ return doc(db, "werewolfRooms", state.roomId, "players", id); }
function bodiesCol(){ return collection(db, "werewolfRooms", state.roomId, "bodies"); }
function bodyRef(id){ return doc(db, "werewolfRooms", state.roomId, "bodies", id); }
function roomById(id){ return rooms.find(r=>r.id===id); }
function roomAt(x,y){ const tx=x/TILE, ty=y/TILE; return rooms.find(r=>tx>=r.x1&&tx<=r.x2&&ty>=r.y1&&ty<=r.y2) || {id:"corridor",name:"Corridoio",emoji:"⬛",color:"#9aa4c0"}; }
function mapCell(x,y){ const tx=Math.floor(x/TILE), ty=Math.floor(y/TILE); if(ty<0||ty>=mapRows.length||tx<0||tx>=mapRows[0].length) return "1"; return mapRows[ty][tx]; }
function isWall(x,y){ return mapCell(x,y)==="1"; }
function shuffle(arr){ return [...arr].sort(()=>Math.random()-.5); }

async function createRoom(){
  const name = cleanName();
  if(!name) return;
  const code = (qs("roomInput").value.trim() || randomCode()).toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,12);
  state.roomId = code;
  state.graphics = qs("graphicsInput").value;

  const snap = await getDoc(roomRef());
  if(!snap.exists()){
    await setDoc(roomRef(), {
      status:"lobby",
      hostId:CLIENT_ID,
      createdAt:serverTimestamp(),
      updatedAt:serverTimestamp(),
      settings:{ wolves:1, tasksPerCitizen:3, killCooldownMs:14000 },
      totalTasks:0,
      completedTasks:0,
      votes:{},
      meeting:null,
      sabotage:{ active:false, type:"", endsAt:0 },
      log:[`Stanza ${code} creata.`],
      winner:null,
      endReason:""
    });
  }

  await joinAsPlayer(name);
}

async function joinRoom(){
  const name = cleanName();
  if(!name) return;
  const code = qs("roomInput").value.trim().toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,12);
  if(!code) return toast("Inserisci codice stanza.");
  state.roomId = code;
  state.graphics = qs("graphicsInput").value;

  const snap = await getDoc(roomRef());
  if(!snap.exists()) return toast("Stanza non trovata.");
  await joinAsPlayer(name);
}

async function joinAsPlayer(name){
  state.unsubs.forEach(u=>u());
  state.unsubs = [];

  const pSnap = await getDoc(playerRef());
  const count = state.players.length;
  const start = starts[count % starts.length];

  if(!pSnap.exists()){
    await setDoc(playerRef(), {
      id:CLIENT_ID,
      name,
      role:"Cittadino",
      x:start.x*TILE,
      y:start.y*TILE,
      angle:start.a,
      room:"corridor",
      alive:true,
      color:["#ff8a3d","#65adff","#50e282","#ffd15a","#a78bfa","#ff3f61","#61f3ff"][Math.floor(Math.random()*7)],
      connected:true,
      tasks:[],
      fakeTasks:false,
      killReadyAt:0,
      emergencyLeft:1,
      specialCooldown:0,
      protectTarget:null,
      joinedAt:serverTimestamp(),
      updatedAt:serverTimestamp()
    });
  } else {
    await updateDoc(playerRef(), { connected:true, name, updatedAt:serverTimestamp() });
  }

  state.joined = true;
  subscribeRoom();
  qs("joinBox").classList.add("hidden");
  qs("lobbyBox").classList.remove("hidden");
  qs("roomCodePill").textContent = "Stanza: " + state.roomId;
  toast("Entrato nella stanza.");
}

function subscribeRoom(){
  state.unsubs.push(onSnapshot(roomRef(), snap => {
    if(!snap.exists()) return;
    state.room = snap.data();
    renderUI();
    if(state.room.status === "playing" || state.room.status === "meeting" || state.room.status === "ended"){
      showScreen("gameScreen");
      resize();
    }
  }));

  state.unsubs.push(onSnapshot(playersCol(), snap => {
    state.players = snap.docs.map(d=>d.data());
    state.self = state.players.find(p=>p.id===CLIENT_ID) || null;
    if(state.self && !state.local.synced){
      state.local.x = state.self.x;
      state.local.y = state.self.y;
      state.local.angle = state.self.angle || 0;
      state.local.synced = true;
    }
    renderUI();
  }));

  state.unsubs.push(onSnapshot(bodiesCol(), snap => {
    state.bodies = snap.docs.map(d=>d.data());
    renderUI();
  }));
}

async function startGame(){
  if(!isHost()) return;
  if(state.players.length < 3) return toast("Servono almeno 3 giocatori per provare, meglio 4+.");

  const settings = {
    wolves:Number(qs("wolvesInput").value),
    tasksPerCitizen:Number(qs("tasksInput").value),
    killCooldownMs:Number(qs("cooldownInput").value)
  };

  const roles = [];
  const wolves = Math.min(settings.wolves, Math.max(1, Math.floor(state.players.length/4)));
  for(let i=0;i<wolves;i++) roles.push("Lupo");
  if(state.players.length>=4) roles.push("Veggente");
  if(state.players.length>=5) roles.push("Guardia");
  if(state.players.length>=6) roles.push("Tecnico");
  while(roles.length < state.players.length) roles.push("Cittadino");

  const shuffled = shuffle(roles);
  const batch = writeBatch(db);
  let totalTasks = 0;

  state.players.forEach((p,i)=>{
    const s = starts[i % starts.length];
    const role = shuffled[i];
    const fake = role === "Lupo";
    const tasks = makeTasks(settings.tasksPerCitizen, fake);
    if(!fake) totalTasks += tasks.length;
    batch.update(playerRef(p.id), {
      role,
      x:s.x*TILE, y:s.y*TILE, angle:s.a,
      room:roomAt(s.x*TILE,s.y*TILE).id,
      alive:true,
      tasks,
      fakeTasks:fake,
      killReadyAt:Date.now()+8000,
      emergencyLeft:1,
      specialCooldown:0,
      protectTarget:null,
      updatedAt:serverTimestamp()
    });
  });

  batch.update(roomRef(), {
    status:"playing",
    settings,
    totalTasks,
    completedTasks:0,
    votes:{},
    meeting:null,
    sabotage:{active:false,type:"",endsAt:0},
    winner:null,
    endReason:"",
    log:[...(state.room?.log || []), "Partita iniziata."].slice(-20),
    updatedAt:serverTimestamp()
  });

  for(const b of state.bodies) batch.delete(bodyRef(b.id));
  await batch.commit();
}

function makeTasks(count, fake=false){
  const all = [];
  rooms.forEach(room => room.tasks.forEach(title => all.push({ id:"t_"+crypto.randomUUID(), room:room.id, title, done:false, fake })));
  return shuffle(all).slice(0,count);
}

function cleanName(){
  const name = qs("nameInput").value.trim().slice(0,18);
  if(!name){ toast("Inserisci nickname."); return ""; }
  return name;
}

function randomCode(){ return Math.random().toString(36).slice(2,8).toUpperCase(); }
function isHost(){ return state.room?.hostId === CLIENT_ID; }

async function updateSettings(){
  if(!isHost()) return;
  await updateDoc(roomRef(), {
    settings:{
      wolves:Number(qs("wolvesInput").value),
      tasksPerCitizen:Number(qs("tasksInput").value),
      killCooldownMs:Number(qs("cooldownInput").value)
    }
  });
}

function renderUI(){
  renderLobby();
  renderGameHud();
  renderMeeting();
  renderEnd();
}

function renderLobby(){
  const list = qs("lobbyList");
  if(!list) return;
  list.innerHTML = "";
  state.players.forEach(p=>{
    const div=document.createElement("div");
    div.className="player-line";
    div.innerHTML=`<div><b>${esc(p.name)}</b><div class="mini">${p.connected ? "online" : "offline"} ${p.id===state.room?.hostId ? "· host" : ""}</div></div><span class="pill">${state.room?.status || "lobby"}</span>`;
    list.appendChild(div);
  });
  qs("hostControls").classList.toggle("hidden", !isHost() || state.room?.status !== "lobby");
}

function renderGameHud(){
  const self = state.self;
  if(!self) return;
  const local = state.local;
  const r = roomAt(local.x, local.y);
  const alive = state.players.filter(p=>p.alive);
  const cd = Math.max(0, Math.ceil(((self.killReadyAt || 0) - Date.now())/1000));
  const pending = (self.tasks || []).filter(t=>!t.done);
  const task = availableTask();
  const victims = nearVictims();
  const bodies = nearBodies();

  qs("statusPill").textContent = state.room?.status || "live";
  qs("taskPill").textContent = `Task ${state.room?.completedTasks || 0}/${state.room?.totalTasks || 0}`;
  qs("alivePill").textContent = `Vivi ${alive.length}`;
  qs("cooldownPill").textContent = `Kill ${cd}`;
  qs("turnName").textContent = self.name;
  qs("turnInfo").textContent = `${r.emoji} ${r.name} · ${self.role || "Ruolo"}`;
  qs("taskInfo").textContent = pending.length ? `Prossimo: ${roomById(pending[0].room)?.name || ""} — ${pending[0].title}${self.fakeTasks ? " (finto)" : ""}` : "Task personali completati.";
  qs("taskProgress").style.width = ((state.room?.totalTasks || 0) ? (state.room.completedTasks/state.room.totalTasks*100) : 0) + "%";
  qs("staminaBar").style.width = local.stamina + "%";

  const playing = state.room?.status === "playing";
  qs("taskBtn").disabled = !self.alive || self.role==="Lupo" || !task || !playing;
  qs("killBtn").disabled = !self.alive || self.role!=="Lupo" || !victims.length || cd>0 || !playing;
  qs("reportBtn").disabled = !self.alive || !bodies.length || !playing;
  qs("emergencyBtn").disabled = !self.alive || (self.emergencyLeft || 0)<=0 || !playing;
  qs("sabotageBtn").disabled = !self.alive || self.role!=="Lupo" || state.room?.sabotage?.active || !playing;
  qs("repairBtn").disabled = !self.alive || !state.room?.sabotage?.active || !playing;
  qs("specialBtn").disabled = !self.alive || !["Veggente","Guardia"].includes(self.role) || !playing;

  qs("taskGlow").classList.toggle("show", !qs("taskBtn").disabled);
  qs("lightsOut").classList.toggle("show", state.room?.sabotage?.type === "lights");
  qs("objectiveText").textContent = self.role === "Lupo" ? "Uccidi, sabota e non farti scoprire." : "Completa task, ripara sabotaggi e scopri il lupo.";
  qs("statusEffect").textContent = state.room?.sabotage?.active ? `Stato: ${state.room.sabotage.type==="lights" ? "luci spente" : "panico"}` : "Stato: normale";
  qs("turnStats").textContent = `Task rimasti: ${pending.length}. Emergenze: ${self.emergencyLeft || 0}.`;
  qs("eventLog").innerHTML = "<b>Diario</b><br>" + ((state.room?.log || []).slice(-12).map(esc).join("<br>") || "Nessun evento.");

  let msg = `${r.emoji} ${r.name}`;
  if(!qs("taskBtn").disabled) msg = "🎯 Task disponibile";
  if(!qs("killBtn").disabled) msg = "🐺 Vittima vicina";
  if(bodies.length) msg = "☠️ Corpo vicino";
  if(state.room?.status === "meeting") msg = "🗳️ Riunione in corso";
  qs("centerMsg").textContent = msg;

  if(state.currentRoomBanner !== r.id){
    state.currentRoomBanner = r.id;
    showRoomBanner(`${r.emoji} ${r.name}`);
  }
}

function availableTask(){
  const self = state.self;
  if(!self?.tasks) return null;
  const r = roomAt(state.local.x, state.local.y);
  return self.tasks.find(t => !t.done && t.room === r.id);
}

function nearVictims(){
  const self = state.self;
  if(!self) return [];
  const r = roomAt(state.local.x,state.local.y);
  return state.players.filter(p => p.alive && p.id !== self.id && (Math.hypot(p.x-state.local.x,p.y-state.local.y)<118 || p.room === r.id));
}

function nearBodies(){
  const r = roomAt(state.local.x,state.local.y);
  return state.bodies.filter(b => Math.hypot(b.x-state.local.x,b.y-state.local.y)<130 || b.room === r.id);
}

function openTaskModal(){
  const task = availableTask();
  if(!task) return;
  state.activeTaskId = task.id;
  qs("taskGameText").textContent = `${task.title}. Completa il mini-task.`;
  const area = qs("taskGameArea");
  area.innerHTML = "";
  qs("finishTaskBtn").disabled = true;

  if(Math.random()<0.5){
    const grid=document.createElement("div");
    grid.className="wire-grid";
    let done=0;
    ["🔧","⚡","✅","🔍","📦"].forEach(icon=>{
      const btn=document.createElement("button");
      btn.className="blue";
      btn.textContent=icon;
      btn.onclick=()=>{btn.disabled=true;btn.textContent="✓";done++;qs("finishTaskBtn").disabled=done<5;};
      grid.appendChild(btn);
    });
    area.appendChild(grid);
  } else {
    const seq=["🐺","🌙","🔥","⚡"].sort(()=>Math.random()-.5);
    let expected=0;
    const card=document.createElement("div");
    card.className="task-card";
    card.innerHTML=`<b>Memoria</b><p>Premi in ordine: ${seq.join(" ")}</p>`;
    const grid=document.createElement("div");
    grid.className="memory-grid";
    seq.slice().sort(()=>Math.random()-.5).forEach(icon=>{
      const btn=document.createElement("button");
      btn.textContent=icon;
      btn.dataset.icon=icon;
      btn.onclick=()=>{
        if(icon===seq[expected]){btn.disabled=true;btn.textContent="✓";expected++;if(expected>=seq.length) qs("finishTaskBtn").disabled=false;}
        else {expected=0;[...grid.querySelectorAll("button")].forEach(b=>{b.disabled=false;b.textContent=b.dataset.icon;});toast("Ordine sbagliato.");}
      };
      grid.appendChild(btn);
    });
    card.appendChild(grid);
    area.appendChild(card);
  }
  qs("taskModal").classList.add("show");
}

async function finishTask(){
  const self = state.self;
  if(!self || !state.activeTaskId) return;
  const task = self.tasks.find(t=>t.id===state.activeTaskId);
  if(!task || task.done) return;

  const newTasks = self.tasks.map(t => t.id===task.id ? {...t, done:true} : t);
  await runTransaction(db, async tx => {
    const rSnap = await tx.get(roomRef());
    const data = rSnap.data();
    tx.update(playerRef(), { tasks:newTasks, updatedAt:serverTimestamp() });
    tx.update(roomRef(), {
      completedTasks:(data.completedTasks || 0) + 1,
      log:[...(data.log || []), `${self.name} ha completato un task.`].slice(-20),
      updatedAt:serverTimestamp()
    });
  });
  state.activeTaskId = null;
  closeModal("taskModal");
}

function openKillModal(){
  const victims = nearVictims();
  qs("killTarget").innerHTML = victims.map(v=>`<option value="${v.id}">${esc(v.name)}</option>`).join("");
  qs("killModal").classList.add("show");
}

async function confirmKill(){
  const targetId = qs("killTarget").value;
  const wolf = state.self;
  const target = state.players.find(p=>p.id===targetId);
  if(!wolf || !target) return;
  if(Date.now() < (wolf.killReadyAt || 0)) return toast("Kill in cooldown.");
  if(Math.hypot(target.x-state.local.x,target.y-state.local.y)>130 && target.room !== roomAt(state.local.x,state.local.y).id) return toast("Troppo lontano.");

  await runTransaction(db, async tx => {
    const rSnap = await tx.get(roomRef());
    const roomData = rSnap.data();
    const targetSnap = await tx.get(playerRef(targetId));
    if(!targetSnap.exists() || !targetSnap.data().alive) return;
    const bodyId = targetId + "_" + Date.now();
    tx.update(playerRef(targetId), { alive:false, updatedAt:serverTimestamp() });
    tx.update(playerRef(), { killReadyAt:Date.now() + (roomData.settings?.killCooldownMs || 14000), updatedAt:serverTimestamp() });
    tx.set(bodyRef(bodyId), { id:bodyId, playerId:targetId, name:target.name, x:target.x, y:target.y, room:target.room, createdAt:serverTimestamp() });
    tx.update(roomRef(), { log:[...(roomData.log || []), "Un giocatore è stato ucciso."].slice(-20), updatedAt:serverTimestamp() });
  });
  flashBlood();
  closeModal("killModal");
}

async function reportBody(){
  const body = nearBodies()[0];
  const self = state.self;
  if(!body || !self) return;
  await updateDoc(roomRef(), {
    status:"meeting",
    meeting:{ reason:`${self.name} ha trovato il corpo di ${body.name}.`, reporterId:self.id, startedAt:Date.now() },
    votes:{},
    log:[...(state.room?.log || []), `${self.name} ha segnalato un corpo.`].slice(-20),
    updatedAt:serverTimestamp()
  });
}

async function callEmergency(){
  const self = state.self;
  if(!self || (self.emergencyLeft || 0)<=0) return;
  await updateDoc(playerRef(), { emergencyLeft:(self.emergencyLeft || 1)-1 });
  await updateDoc(roomRef(), {
    status:"meeting",
    meeting:{ reason:`${self.name} ha chiamato una riunione d'emergenza.`, reporterId:self.id, startedAt:Date.now() },
    votes:{},
    log:[...(state.room?.log || []), `${self.name} ha chiamato emergenza.`].slice(-20),
    updatedAt:serverTimestamp()
  });
}

async function vote(targetId){
  await updateDoc(roomRef(), { [`votes.${CLIENT_ID}`]:targetId, updatedAt:serverTimestamp() });
}

async function resolveVotes(){
  if(!isHost()) return;
  const votes = state.room?.votes || {};
  const counts = {};
  Object.values(votes).forEach(v => { if(v && v !== "skip") counts[v] = (counts[v] || 0) + 1; });
  const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]);

  if(!entries.length) return skipMeeting();
  const tied = entries.filter(e=>e[1]===entries[0][1]);
  if(tied.length>1) return skipMeeting("Pareggio: nessuno eliminato.");

  const eliminated = state.players.find(p=>p.id===entries[0][0]);
  const batch = writeBatch(db);
  batch.update(playerRef(eliminated.id), { alive:false, updatedAt:serverTimestamp() });
  batch.update(roomRef(), {
    status:"playing",
    meeting:null,
    votes:{},
    log:[...(state.room?.log || []), `${eliminated.name} eliminato al voto. Era ${eliminated.role}.`].slice(-20),
    updatedAt:serverTimestamp()
  });
  state.bodies.forEach(b => batch.delete(bodyRef(b.id)));
  await batch.commit();
}

async function skipMeeting(msg="Riunione chiusa senza eliminazioni."){
  if(!isHost()) return;
  const batch = writeBatch(db);
  batch.update(roomRef(), { status:"playing", meeting:null, votes:{}, log:[...(state.room?.log || []), msg].slice(-20), updatedAt:serverTimestamp() });
  state.bodies.forEach(b => batch.delete(bodyRef(b.id)));
  await batch.commit();
}

async function activateSabotage(){
  const type = Math.random()<0.5 ? "lights" : "panic";
  await updateDoc(roomRef(), {
    sabotage:{ active:true, type, endsAt:Date.now()+25000 },
    log:[...(state.room?.log || []), type==="lights" ? "Sabotaggio: luci spente." : "Sabotaggio: panico."].slice(-20)
  });
  showDanger(type==="lights" ? "💡 Luci spente" : "⚠️ Panico");
}

async function repairSabotage(){
  const self = state.self;
  const r = roomAt(state.local.x,state.local.y);
  if(self.role !== "Tecnico" && r.id !== "tech") return toast("Vai in Cabina Tech o serve il Tecnico.");
  await updateDoc(roomRef(), {
    sabotage:{ active:false, type:"", endsAt:0 },
    log:[...(state.room?.log || []), `${self.name} ha riparato il sabotaggio.`].slice(-20)
  });
}

function openSpecialModal(){
  const self = state.self;
  const area=qs("specialArea");
  area.innerHTML="";
  if(!["Veggente","Guardia"].includes(self.role)) return toast("Nessuna abilità speciale.");

  qs("specialText").textContent = self.role==="Veggente" ? "Scegli chi investigare." : "Scegli chi proteggere.";
  const select=document.createElement("select");
  state.players.filter(p=>p.alive && p.id!==self.id).forEach(p=>{
    const opt=document.createElement("option");
    opt.value=p.id; opt.textContent=p.name;
    select.appendChild(opt);
  });
  const btn=document.createElement("button");
  btn.className="big blue";
  btn.textContent = self.role==="Veggente" ? "Investiga" : "Proteggi";
  btn.onclick=async()=>{
    const target=state.players.find(p=>p.id===select.value);
    if(self.role==="Veggente") alert(`${target.name}: ${target.role==="Lupo" ? "È LUPO" : "Non è lupo"}`);
    if(self.role==="Guardia") {
      await updateDoc(playerRef(), { protectTarget:target.id });
      toast(`Hai protetto ${target.name}.`);
    }
    closeModal("specialModal");
  };
  area.appendChild(select);
  area.appendChild(btn);
  qs("specialModal").classList.add("show");
}

function renderMeeting(){
  const modal = qs("voteModal");
  if(state.room?.status !== "meeting"){ modal.classList.remove("show"); return; }
  qs("voteReason").textContent = state.room.meeting?.reason || "Riunione.";
  const box=qs("voteList");
  box.innerHTML="";
  const votes = state.room.votes || {};
  state.players.filter(p=>p.alive).forEach(p=>{
    const count = Object.values(votes).filter(v=>v===p.id).length;
    const div=document.createElement("div");
    div.className="vote-row";
    div.innerHTML=`<div><b>${esc(p.name)}</b><div class="mini">${p.room || ""}</div></div><div class="counter">${count}</div><button data-vote="${p.id}">Vota</button>`;
    box.appendChild(div);
  });
  const skipCount = Object.values(votes).filter(v=>v==="skip").length;
  const skip=document.createElement("div");
  skip.className="vote-row";
  skip.innerHTML=`<div><b>Nessuno</b><div class="mini">Non eliminare</div></div><div class="counter">${skipCount}</div><button data-vote="skip">Vota</button>`;
  box.appendChild(skip);
  box.querySelectorAll("[data-vote]").forEach(btn=>btn.onclick=()=>vote(btn.dataset.vote));
  qs("meetingHostControls").classList.toggle("hidden", !isHost());
  modal.classList.add("show");
}

async function checkWinMaybe(){
  if(!isHost() || state.room?.status !== "playing") return;
  const alive = state.players.filter(p=>p.alive);
  const wolves = alive.filter(p=>p.role==="Lupo");
  const citizens = alive.filter(p=>p.role!=="Lupo");
  let winner="", reason="";
  if((state.room.totalTasks || 0)>0 && state.room.completedTasks >= state.room.totalTasks){ winner="Cittadini"; reason="I cittadini hanno completato tutti i task."; }
  else if(wolves.length===0){ winner="Cittadini"; reason="Tutti i lupi sono stati eliminati."; }
  else if(wolves.length >= citizens.length){ winner="Lupi"; reason="I lupi sono rimasti in numero pari o superiore ai cittadini."; }
  if(winner) await updateDoc(roomRef(), { status:"ended", winner, endReason:reason, updatedAt:serverTimestamp() });
}

function renderEnd(){
  if(state.room?.status !== "ended"){ qs("endModal").classList.remove("show"); return; }
  qs("endTitle").textContent = `Vittoria: ${state.room.winner}`;
  qs("endText").textContent = state.room.endReason;
  qs("endRoles").innerHTML = state.players.map(p=>`<div class="player-line"><div><b>${esc(p.name)}</b><div class="mini">${p.alive?"Vivo":"Eliminato"} · task ${(p.tasks||[]).filter(t=>t.done).length}/${(p.tasks||[]).length}</div></div><span class="pill">${p.role}</span></div>`).join("");
  qs("endModal").classList.add("show");
}

async function resetRoom(){
  if(!isHost()) return;
  await updateDoc(roomRef(), { status:"lobby", winner:null, endReason:"", meeting:null, votes:{}, completedTasks:0, totalTasks:0, sabotage:{active:false,type:"",endsAt:0}, log:["Stanza resettata."] });
}

function update(dt){
  const self = state.self;
  if(!self || !self.alive || state.room?.status !== "playing") return;

  let move=0, strafe=0, rot=0;
  if(state.keys["w"]||state.keys["arrowup"]||state.touch.forward) move+=1;
  if(state.keys["s"]||state.keys["arrowdown"]||state.touch.back) move-=1;
  if(state.keys["a"]||state.touch.left) strafe-=1;
  if(state.keys["d"]||state.touch.right) strafe+=1;
  if(state.keys["q"]||state.touch.turnL) rot-=1;
  if(state.keys["e"]||state.touch.turnR) rot+=1;

  const sprinting=(state.keys["shift"]||state.touch.sprint)&&state.local.stamina>3&&move>0;
  const speedMult=sprinting?1.55:1;
  if(sprinting) state.local.stamina=Math.max(0,state.local.stamina-28*dt);
  else state.local.stamina=Math.min(100,state.local.stamina+18*dt);

  state.local.angle += rot*ROT_SPEED*dt;
  const slow = state.room?.sabotage?.type === "panic" ? .86 : 1;
  const speed=BASE_SPEED*TILE*dt*speedMult*slow;
  const nx=state.local.x+Math.cos(state.local.angle)*move*speed+Math.cos(state.local.angle+Math.PI/2)*strafe*speed;
  const ny=state.local.y+Math.sin(state.local.angle)*move*speed+Math.sin(state.local.angle+Math.PI/2)*strafe*speed;

  const radius=12;
  if(!isWall(nx+Math.sign(nx-state.local.x)*radius,state.local.y)) state.local.x=nx;
  if(!isWall(state.local.x,ny+Math.sign(ny-state.local.y)*radius)) state.local.y=ny;
  if(move||strafe) state.local.bob += dt*7*speedMult;

  const now=performance.now();
  if(now-state.lastSend>90){
    updateDoc(playerRef(), { x:state.local.x, y:state.local.y, angle:state.local.angle, room:roomAt(state.local.x,state.local.y).id, updatedAt:serverTimestamp() });
    state.lastSend=now;
  }
}

function castRay(angle){
  let depth=0;
  const sin=Math.sin(angle), cos=Math.cos(angle);
  while(depth<MAX_DEPTH*TILE){
    const x=state.local.x+cos*depth, y=state.local.y+sin*depth;
    if(isWall(x,y)) return {depth,x,y,checker:(Math.floor(x/TILE)+Math.floor(y/TILE))%2};
    depth+=4;
  }
  return {depth:MAX_DEPTH*TILE,x:state.local.x+cos*MAX_DEPTH*TILE,y:state.local.y+sin*MAX_DEPTH*TILE,checker:0};
}

function render3D(){
  const w=innerWidth,h=innerHeight;
  const pr=roomAt(state.local.x,state.local.y);
  const realistic = state.graphics === "realistic" || state.graphics === "cinematic";
  const cinematic = state.graphics === "cinematic";
  const bobOffset=Math.sin(state.local.bob)*2;

  const sky=ctx.createLinearGradient(0,0,0,h*.54);
  sky.addColorStop(0, cinematic ? "#090d1c" : realistic ? "#11182f" : "#172149");
  sky.addColorStop(.62, cinematic ? "#060914" : realistic ? "#0b1024" : "#0f1735");
  sky.addColorStop(1,"#070a17");
  ctx.fillStyle=sky; ctx.fillRect(0,0,w,h*.54);

  const floor=ctx.createLinearGradient(0,h*.50,0,h);
  floor.addColorStop(0,hexToRgba(pr.color || "#9aa4c0", realistic ? .15 : .19));
  floor.addColorStop(1,"#03040a");
  ctx.fillStyle=floor; ctx.fillRect(0,h*.50,w,h*.50);

  for(let i=0;i<RAYS;i++){
    const rayAngle=state.local.angle-FOV/2+(i/RAYS)*FOV;
    const ray=castRay(rayAngle);
    const corrected=Math.max(1,ray.depth*Math.cos(rayAngle-state.local.angle));
    const wallH=Math.min(h*1.18,(TILE*720)/corrected);
    const x=(i/RAYS)*w, stripW=Math.ceil(w/RAYS)+1, y=h/2-wallH/2+bobOffset;
    const brightness=Math.max(42,236-corrected*.21);
    const base=ray.checker?mixColors(pr.color || "#9aa4c0","#ffffff",.10):mixColors("#6a83ff",pr.color || "#9aa4c0",.30);
    ctx.fillStyle=shadeColor(base,brightness/255); ctx.fillRect(x,y,stripW,wallH);
    ctx.fillStyle=`rgba(0,0,0,${Math.min(.58,corrected/(MAX_DEPTH*TILE))})`; ctx.fillRect(x,y,stripW,wallH);
  }

  drawSprites();
  drawVignette(w,h);
}

function drawSprites(){
  const sprites=[];
  rooms.forEach(r=>sprites.push({type:"room",x:((r.x1+r.x2)/2)*TILE,y:((r.y1+r.y2)/2)*TILE,label:r.emoji+" "+r.name,color:r.color}));
  if(state.self?.tasks) state.self.tasks.filter(t=>!t.done).forEach(t=>{ const r=roomById(t.room); if(r) sprites.push({type:"task",x:((r.x1+r.x2)/2)*TILE,y:((r.y1+r.y2)/2)*TILE,label:"🎯 Task",color:"#ffd15a"}); });
  state.players.forEach(p=>{ if(p.id!==CLIENT_ID && p.alive) sprites.push({type:"player",x:p.x,y:p.y,label:p.name,color:p.color || "#eef3ff"}); });
  state.bodies.forEach(b=>sprites.push({type:"body",x:b.x,y:b.y,label:"Corpo",color:"#ff3f61"}));
  sprites.sort((a,b)=>Math.hypot(b.x-state.local.x,b.y-state.local.y)-Math.hypot(a.x-state.local.x,a.y-state.local.y));

  sprites.forEach(s=>{
    const dx=s.x-state.local.x,dy=s.y-state.local.y,d=Math.sqrt(dx*dx+dy*dy);
    let angle=Math.atan2(dy,dx)-state.local.angle;
    while(angle<-Math.PI)angle+=Math.PI*2; while(angle>Math.PI)angle-=Math.PI*2;
    if(Math.abs(angle)>FOV*.74||d<10)return;
    const size=Math.min(100,Math.max(18,(TILE*370)/(d+1)));
    const screenX=innerWidth/2+Math.tan(angle)*(innerWidth/2)/Math.tan(FOV/2);
    const screenY=innerHeight/2+size*.22+Math.sin(state.local.bob)*1.5;
    ctx.save(); ctx.globalAlpha=Math.max(.22,Math.min(1,1-d/(TILE*12)));
    if(s.type==="player"){
      ctx.fillStyle="#f2f6ff"; ctx.beginPath(); ctx.arc(screenX,screenY-size*.5,size*.30,0,Math.PI*2); ctx.fill();
      const grad=ctx.createLinearGradient(screenX,screenY-size*.18,screenX,screenY+size*.60); grad.addColorStop(0,"#a8d4ff"); grad.addColorStop(1,s.color || "#5365e8");
      ctx.fillStyle=grad; roundRect(ctx,screenX-size*.26,screenY-size*.17,size*.52,size*.78,10); ctx.fill();
    } else if(s.type==="body"){ ctx.font=`${Math.max(28,size*.72)}px system-ui`; ctx.textAlign="center"; ctx.fillStyle="#ff3f61"; ctx.fillText("☠️",screenX,screenY); }
    else if(s.type==="task"){ ctx.font=`${Math.max(24,size*.58)}px system-ui`; ctx.textAlign="center"; ctx.fillStyle="#ffd15a"; ctx.fillText("🎯",screenX,screenY-size*.12); }
    else if(s.type==="room"){ ctx.fillStyle="rgba(0,0,0,.40)"; roundRect(ctx,screenX-size*.75,screenY-size*1.48,size*1.50,size*.40,9); ctx.fill(); }
    ctx.fillStyle=s.color || "#fff"; ctx.font=`950 ${Math.max(11,Math.min(16,size*.22))}px system-ui`; ctx.textAlign="center"; ctx.fillText(s.label,screenX,screenY-size*.98);
    ctx.restore();
  });
}

function drawMiniMap(){
  const scale=160/(mapRows[0].length*TILE);
  mctx.clearRect(0,0,160,160); mctx.fillStyle="rgba(5,7,15,.95)"; mctx.fillRect(0,0,160,160);
  for(let y=0;y<mapRows.length;y++) for(let x=0;x<mapRows[y].length;x++) if(mapRows[y][x]==="1"){ mctx.fillStyle="rgba(255,255,255,.20)"; mctx.fillRect(x*TILE*scale,y*TILE*scale,TILE*scale,TILE*scale); }
  rooms.forEach(r=>{ mctx.strokeStyle=hexToRgba(r.color,.95); mctx.lineWidth=1.4; mctx.strokeRect(r.x1*TILE*scale,r.y1*TILE*scale,(r.x2-r.x1)*TILE*scale,(r.y2-r.y1)*TILE*scale); });
  state.bodies.forEach(b=>{ mctx.fillStyle="#ff3f61"; mctx.beginPath(); mctx.arc(b.x*scale,b.y*scale,4,0,Math.PI*2); mctx.fill(); });
  state.players.forEach(p=>{ if(!p.alive)return; mctx.fillStyle=p.id===CLIENT_ID?"#ff8a3d":(p.color || "#eef3ff"); const x=p.id===CLIENT_ID?state.local.x:p.x, y=p.id===CLIENT_ID?state.local.y:p.y; mctx.beginPath(); mctx.arc(x*scale,y*scale,p.id===CLIENT_ID?4:3,0,Math.PI*2); mctx.fill(); });
}

function drawVignette(w,h){ const g=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.20,w/2,h/2,Math.max(w,h)*.72); g.addColorStop(0,"rgba(0,0,0,0)"); g.addColorStop(1,"rgba(0,0,0,.40)"); ctx.fillStyle=g; ctx.fillRect(0,0,w,h); }

function resize(){ const dpr=Math.min(window.devicePixelRatio||1,2); canvas.width=Math.floor(innerWidth*dpr); canvas.height=Math.floor(innerHeight*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); }
function closeModal(id){ qs(id).classList.remove("show"); }
function openRules(){ qs("rulesModal").classList.add("show"); }
function showRoomBanner(text){ const b=qs("roomBanner"); b.textContent=text; b.classList.add("show"); clearTimeout(showRoomBanner._t); showRoomBanner._t=setTimeout(()=>b.classList.remove("show"),1150); }
function flashBlood(){ const f=qs("bloodFlash"); f.classList.add("show"); setTimeout(()=>f.classList.remove("show"),300); }
function showDanger(text){ const b=qs("dangerBanner"); b.textContent=text; b.classList.add("show"); setTimeout(()=>b.classList.remove("show"),1600); }

function loop(now){
  const dt=Math.min(.05,(now-state.lastTime)/1000); state.lastTime=now;
  if(qs("gameScreen").classList.contains("active")){
    update(dt); render3D(); drawMiniMap(); renderUI(); checkWinHost();
  }
  requestAnimationFrame(loop);
}

async function checkWinHost(){
  if(!isHost() || state.room?.status !== "playing") return;
  const alive = state.players.filter(p=>p.alive);
  const wolves = alive.filter(p=>p.role==="Lupo");
  const citizens = alive.filter(p=>p.role!=="Lupo");
  let winner="", reason="";
  if((state.room.totalTasks || 0)>0 && state.room.completedTasks >= state.room.totalTasks){ winner="Cittadini"; reason="I cittadini hanno completato tutti i task."; }
  else if(wolves.length===0){ winner="Cittadini"; reason="Tutti i lupi sono stati eliminati."; }
  else if(wolves.length >= citizens.length){ winner="Lupi"; reason="I lupi sono rimasti in numero pari o superiore ai cittadini."; }
  if(winner) await updateDoc(roomRef(), { status:"ended", winner, endReason:reason });
}

function hexToRgba(hex,a){ const c=(hex||"#9aa4c0").replace("#",""); const n=parseInt(c,16); return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`; }
function parseColor(s){ if(s.startsWith("rgb")){ const nums=s.match(/\d+/g).map(Number); return [nums[0],nums[1],nums[2]]; } const c=(s||"#9aa4c0").replace("#",""); return [parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)]; }
function shadeColor(color,f){ const [r,g,b]=parseColor(color); return `rgb(${Math.round(r*f)},${Math.round(g*f)},${Math.round(b*f)})`; }
function mixColors(a,b,amt){ const x=parseColor(a),y=parseColor(b); return `rgb(${Math.round(x[0]+(y[0]-x[0])*amt)},${Math.round(x[1]+(y[1]-x[1])*amt)},${Math.round(x[2]+(y[2]-x[2])*amt)})`; }
function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

addEventListener("resize",resize);
addEventListener("keydown",e=>state.keys[e.key.toLowerCase()]=true);
addEventListener("keyup",e=>state.keys[e.key.toLowerCase()]=false);
canvas.addEventListener("pointerdown",e=>{state.dragging=true;state.lastPointerX=e.clientX;});
addEventListener("pointerup",()=>state.dragging=false);
addEventListener("pointermove",e=>{ if(!state.dragging || state.room?.status!=="playing") return; const dx=e.clientX-state.lastPointerX; state.local.angle += dx*.006; state.lastPointerX=e.clientX; });

document.querySelectorAll("[data-hold]").forEach(btn=>{
  const k=btn.dataset.hold;
  btn.addEventListener("touchstart",()=>state.touch[k]=true);
  btn.addEventListener("touchend",()=>state.touch[k]=false);
  btn.addEventListener("mousedown",()=>state.touch[k]=true);
  btn.addEventListener("mouseup",()=>state.touch[k]=false);
  btn.addEventListener("mouseleave",()=>state.touch[k]=false);
});
document.querySelectorAll("[data-close]").forEach(btn=>btn.onclick=()=>closeModal(btn.dataset.close));
qs("createBtn").onclick=createRoom;
qs("joinBtn").onclick=joinRoom;
qs("startBtn").onclick=startGame;
qs("resetBtn").onclick=resetRoom;
qs("rulesBtn").onclick=openRules;
qs("taskBtn").onclick=openTaskModal;
qs("finishTaskBtn").onclick=finishTask;
qs("killBtn").onclick=openKillModal;
qs("confirmKillBtn").onclick=confirmKill;
qs("reportBtn").onclick=reportBody;
qs("emergencyBtn").onclick=callEmergency;
qs("sabotageBtn").onclick=activateSabotage;
qs("repairBtn").onclick=repairSabotage;
qs("specialBtn").onclick=openSpecialModal;
qs("resolveVotesBtn").onclick=resolveVotes;
qs("skipMeetingBtn").onclick=()=>skipMeeting();
qs("newGameBtn").onclick=resetRoom;

resize();
requestAnimationFrame(loop);
