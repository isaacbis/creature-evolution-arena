import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp
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

const ROLES = [
  { id:"wolf", name:"Lupo Mannaro", team:"Lupi", desc:"Di notte sceglie con gli altri lupi una vittima." },
  { id:"villager", name:"Contadino", team:"Villaggio", desc:"Non ha poteri, ma vota e ragiona per trovare i lupi." },
  { id:"seer", name:"Veggente", team:"Villaggio", desc:"Ogni notte controlla un giocatore e scopre se è lupo." },
  { id:"guard", name:"Guardia", team:"Villaggio", desc:"Ogni notte protegge un giocatore dall'attacco dei lupi." },
  { id:"witch", name:"Strega", team:"Villaggio", desc:"Ha una pozione per salvare e una per uccidere, una volta per partita." },
  { id:"hunter", name:"Cacciatore", team:"Villaggio", desc:"Quando muore può eliminare un altro giocatore." },
  { id:"jester", name:"Giullare", team:"Neutrale", desc:"Vince se viene eliminato con la votazione del villaggio." },
  { id:"medium", name:"Medium", team:"Villaggio", desc:"Può conoscere informazioni sui morti." },
  { id:"cupid", name:"Cupido", team:"Villaggio", desc:"La prima notte lega due innamorati." },
  { id:"mayor", name:"Sindaco", team:"Villaggio", desc:"Il suo voto può valere doppio, se decidete di usare questa regola." },
  { id:"alpha", name:"Lupo Alfa", team:"Lupi", desc:"È un lupo più forte. Variante: una volta può trasformare invece di uccidere." },
  { id:"traitor", name:"Traditore", team:"Lupi", desc:"Sembra cittadino, ma aiuta i lupi." }
];


const NARRATOR_LINES = {
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
    "Veggente, apri gli occhi. Vediamo se oggi l'intuito batte le bugie.",
    "Veggente, scegli qualcuno da controllare. Non fare quella faccia, potresti avere ragione.",
    "Il veggente indaga. Il villaggio spera che non stia guardando la persona sbagliata."
  ],
  guard: [
    "Guardia, apri gli occhi. Scegli chi merita una notte tranquilla.",
    "La Guardia fa il suo giro. Con un po' di fortuna protegge la persona giusta.",
    "Guardia, indica chi vuoi proteggere. Niente pressioni, solo la vita di qualcuno."
  ],
  witch: [
    "Strega, apri gli occhi. È il momento delle pozioni e delle decisioni discutibili.",
    "La Strega controlla la sua borsa. Salvezza, veleno e un pizzico di caos.",
    "Strega, scegli bene: una pozione può salvare la partita o rovinarla con stile."
  ],
  dawn: [
    "Il sole sorge. Qualcuno ha dormito male, qualcuno non ha dormito affatto.",
    "È giorno. Sorridete pure, tanto qualcuno sta mentendo.",
    "Il villaggio si sveglia. Le accuse possono iniziare tra tre, due, uno..."
  ],
  noDeath: [
    "Colpo di scena: nessuno è morto. Per una volta il villaggio ha avuto fortuna.",
    "Questa notte non è morto nessuno. I lupi dovranno rivedere la strategia.",
    "Nessuna vittima stanotte. Qualcuno si prende il merito, anche se magari non c'entra niente."
  ],
  death: [
    "Brutte notizie al mattino.",
    "Il villaggio conta i presenti... e manca qualcuno.",
    "La notte ha lasciato il segno."
  ],
  voteStart: [
    "È ora di votare. Ricordate: urlare più forte non rende più innocenti.",
    "Si vota. Le amicizie finiscono qui, almeno fino alla prossima partita.",
    "Il villaggio deve decidere. Accuse, difese e pessime intuizioni sono benvenute."
  ],
  voteSkipped: [
    "Il villaggio decide di non votare. Scelta prudente... o codarda, dipende dai punti di vista.",
    "Nessuna eliminazione oggi. I sospetti restano vivi, purtroppo anche i lupi forse.",
    "Votazione saltata. Tutti salvi per ora, ma la notte non fa sconti."
  ],
  lynch: [
    "Il villaggio ha deciso. Speriamo non sia l'ennesimo errore collettivo.",
    "Voto concluso. Qualcuno esce tra gli sguardi sospetti degli altri.",
    "La maggioranza ha parlato. Non è detto che abbia capito qualcosa."
  ],
  tie: [
    "Parità. Il villaggio non decide e nessuno viene eliminato.",
    "I voti si annullano. La confusione vince il turno.",
    "Nessuna maggioranza. Ottimo lavoro, oppure pessimo: lo scoprirete più tardi."
  ]
};
function line(type){ const arr=NARRATOR_LINES[type]||[]; return arr[Math.floor(Math.random()*arr.length)]||''; }
function narr(type, text){ const prefix=line(type); return prefix ? `${prefix} ${text}` : text; }

const DEFAULT_COUNTS = { wolf:2, villager:4, seer:1, guard:1, witch:0, hunter:0, jester:0, medium:0, cupid:0, mayor:0, alpha:0, traitor:0 };
const DEMO_NAMES = ["Marco","Giulia","Luca","Sara","Matteo","Anna","Davide","Chiara","Leo","Sofia"];

let local = null;
let room = { code:null, playerId:null, isHost:false, data:null, unsub:null, revealMine:false, narratorShowRoles:false };

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),2200); }
function uid(){ return Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4); }
function roomCode(){ return Math.random().toString(36).replace(/[^a-z0-9]/g,"").slice(2,8).toUpperCase(); }
function show(id){ $$(".screen").forEach(s=>s.classList.remove("active")); $("#"+id).classList.add("active"); window.scrollTo({top:0,behavior:"smooth"}); }
function speak(text){
  try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang="it-IT"; u.rate=.93; speechSynthesis.speak(u); }catch(e){}
}
function roleName(id){ return ROLES.find(r=>r.id===id)?.name || id; }
function isWolfish(role){ return role==="wolf" || role==="alpha"; }
function alivePlayers(players){ return players.filter(p=>p.alive); }
function shuffled(arr){ return [...arr].sort(()=>Math.random()-.5); }
function makeRoleDeck(counts, total){
  const deck=[];
  Object.entries(counts).forEach(([id,n])=>{ for(let i=0;i<Number(n||0);i++) deck.push(id); });
  while(deck.length<total) deck.push("villager");
  if(deck.length>total) deck.length=total;
  return shuffled(deck);
}
function getCounts(prefix){
  const counts={};
  ROLES.forEach(r=>counts[r.id]=Number(document.querySelector(`[data-${prefix}-role="${r.id}"]`)?.textContent||0));
  return counts;
}
function roleCountTotal(counts){ return Object.values(counts).reduce((sum,n)=>sum+Number(n||0),0); }
function validateSetup(names, counts){
  if(names.length<5) return 'Inserisci almeno 5 giocatori.';
  if(roleCountTotal(counts)>names.length) return 'Hai scelto più ruoli dei giocatori. Riduci qualche ruolo oppure aggiungi giocatori.';
  const wolves=Number(counts.wolf||0)+Number(counts.alpha||0);
  if(wolves<1) return 'Serve almeno un Lupo Mannaro o un Lupo Alfa.';
  return '';
}
function makeRolePicker(el, prefix, counts=DEFAULT_COUNTS){
  el.innerHTML = ROLES.map(r=>`
    <div class="role-item">
      <div><span>${r.name}</span><br><small>${r.team}</small></div>
      <div class="qty">
        <button type="button" data-dec="${r.id}" data-prefix="${prefix}">−</button>
        <b data-${prefix}-role="${r.id}">${counts[r.id]||0}</b>
        <button type="button" data-inc="${r.id}" data-prefix="${prefix}">+</button>
      </div>
    </div>
  `).join("");
}
function bindPickers(){
  document.addEventListener("click", e=>{
    const inc=e.target.closest("[data-inc]"), dec=e.target.closest("[data-dec]");
    if(!inc && !dec) return;
    const btn=inc||dec; const role=btn.dataset.inc||btn.dataset.dec; const prefix=btn.dataset.prefix;
    const b=document.querySelector(`[data-${prefix}-role="${role}"]`); if(!b) return;
    let v=Number(b.textContent||0); v += inc?1:-1; b.textContent=Math.max(0,v);
  });
}
function makePlayers(names, counts){
  const clean=names.map(n=>n.trim()).filter(Boolean);
  const deck=makeRoleDeck(counts, clean.length);
  return clean.map((name,i)=>({ id:uid(), name, role:deck[i], alive:true, revealed:false, protected:false, lover:null }));
}
function winCheck(players){
  const alive=alivePlayers(players);
  const wolves=alive.filter(p=>isWolfish(p.role)).length;
  const village=alive.length-wolves;
  if(wolves===0) return "Il villaggio ha vinto: tutti i lupi sono stati eliminati.";
  if(wolves>=village) return "I lupi hanno vinto: sono pari o superiori agli altri giocatori.";
  return null;
}
function publicDeathText(name){ return `${name} è morto. Il suo ruolo resta segreto per i giocatori.`; }

function init(){
  makeRolePicker($("#localRolePicker"),"local", DEFAULT_COUNTS);
  makeRolePicker($("#onlineRolePicker"),"online", DEFAULT_COUNTS);
  bindPickers();
  $$('[data-open]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.open)));
  $$('.back').forEach(b=>b.addEventListener('click',()=>show('homeView')));
  $('#resetAppBtn').onclick=()=>{ localStorage.removeItem('lupusPlayerId'); location.reload(); };
  $('#demoBtn').onclick=startDemo;
  $('#startLocalBtn').onclick=startLocal;
  $('#localSpeakBtn').onclick=()=>speak($('#localNarration').textContent);
  $('#localNextBtn').onclick=localNext;
  $('#showRoleBtn').onclick=toggleLocalRole;
  $('#nextRoleBtn').onclick=nextLocalReveal;
  $('#createRoomBtn').onclick=createRoom;
  $('#joinRoomBtn').onclick=joinRoom;
  $('#startOnlineGameBtn').onclick=startOnlineGame;
  $('#onlineRevealAllBtn').onclick=()=>{ room.narratorShowRoles=!room.narratorShowRoles; renderRoom(); };
  $('#toggleMyRoleBtn').onclick=()=>{ room.revealMine=!room.revealMine; renderRoom(); };
  $('#roomSpeakBtn').onclick=()=>speak($('#roomNarration').textContent);
  $('#roomNextBtn').onclick=onlineNext;
}

function startDemo(){
  $('#localNames').value=DEMO_NAMES.join('\n');
  show('localSetupView');
  toast('Demo caricata. Puoi avviare la partita.');
}
function startLocal(){
  const names=$('#localNames').value.split(/\n|,/).map(s=>s.trim()).filter(Boolean);
  const counts=getCounts('local');
  const setupError=validateSetup(names, counts);
  if(setupError) return toast(setupError);
  const players=makePlayers(names, counts);
  local={players, phase:'reveal', step:0, revealIndex:0, night:{victim:null, protected:null, witchSave:false, witchKill:null}, witch:{save:true, kill:true}, lastText:narr('intro','Passa il telefono al primo giocatore per mostrare il ruolo.'), hostNote:''};
  show('localGameView'); renderLocal(); speak(local.lastText);
}
function renderLocal(){
  $('#localPhaseBadge').textContent=local.phase;
  $('#localAliveCount').textContent=`Vivi: ${alivePlayers(local.players).length}/${local.players.length}`;
  $('#localNarration').textContent=local.lastText;
  $('#localPlayersList').innerHTML=local.players.map(p=>`<div class="player-row ${p.alive?'':'dead'}"><span>${p.name}</span><span class="chip ${p.alive?'alive-chip':'dead-chip'}">${p.alive?'vivo':'morto'}</span></div>`).join('');
  $('#localRevealCard').classList.toggle('hidden', local.phase!=='reveal');
  renderLocalActions();
}
function toggleLocalRole(){
  const p=local.players[local.revealIndex]; if(!p) return;
  const box=$('#localRevealBox');
  if(box.dataset.visible==='1'){ box.dataset.visible='0'; box.className='role-card hidden-role'; box.textContent='Carta nascosta'; }
  else { box.dataset.visible='1'; box.className='role-card'; box.innerHTML=`${p.name}<br><small>${roleName(p.role)}</small>`; }
}
function nextLocalReveal(){
  $('#localRevealBox').dataset.visible='0'; $('#localRevealBox').className='role-card hidden-role'; $('#localRevealBox').textContent='Tocca “Mostra carta”';
  local.revealIndex++;
  if(local.revealIndex>=local.players.length){ local.phase='night'; local.step=0; local.lastText=narr('night','Prima notte. Tutti chiudono gli occhi.'); speak(local.lastText); }
  else local.lastText=`Passa il telefono a ${local.players[local.revealIndex].name}.`;
  renderLocal();
}
function localNext(){
  if(local.phase==='reveal') return nextLocalReveal();
  if(local.phase==='night') return localNightStep();
  if(local.phase==='day') return startVoteLocal();
  if(local.phase==='vote') return toast('Scegli chi eliminare dalla lista sotto.');
}
function localNightStep(){
  const steps=[
    narr('wolves','I lupi aprono gli occhi e scelgono una vittima.'),
    narr('seer','Il veggente apre gli occhi e può controllare un giocatore.'),
    narr('guard','La guardia apre gli occhi e sceglie chi proteggere.'),
    narr('witch','La strega apre gli occhi. Può salvare la vittima o usare la pozione di morte.'),
    narr('dawn','Tutti chiudono gli occhi. Sta arrivando il giorno.')
  ];
  local.lastText=steps[local.step] || 'Giorno.';
  speak(local.lastText); local.step++;
  if(local.step>steps.length){ resolveNightLocal(); }
  renderLocal();
}
function renderLocalActions(){
  const area=$('#localActionArea');
  const note = local.hostNote ? `<div class="host-note"><b>Nota solo narratore:</b> ${local.hostNote}</div>` : '';
  if(local.phase==='reveal'){ area.innerHTML='<p>Prima mostra i ruoli a tutti.</p>'; return; }
  if(local.phase==='night'){
    area.innerHTML=`${note}<div class="action-grid">
      <p class="hint">Il narratore può segnare le azioni qui. I ruoli dei morti rimangono segreti ai giocatori.</p>
      <button class="secondary" data-local-action="wolf">Scegli vittima dei lupi</button>
      <button class="secondary" data-local-action="seer">Controllo veggente</button>
      <button class="secondary" data-local-action="guard">Protezione guardia</button>
      <button class="secondary" data-local-action="witchSave">Strega: salva vittima</button>
      <button class="secondary" data-local-action="witchKill">Strega: pozione morte</button>
      <button class="primary" data-local-action="resolve">Vai al giorno</button>
    </div>`;
  } else if(local.phase==='hunterShot'){
    const hunter=local.players.find(p=>p.id===local.pendingHunterId);
    area.innerHTML=`${note}<p>Il cacciatore ${hunter?.name||''} può sparare a qualcuno. Questa informazione resta del narratore.</p><div class="action-grid">${alivePlayers(local.players).filter(p=>p.id!==local.pendingHunterId).map(p=>`<button class="target-btn" data-hunter-shot="${p.id}">${p.name}</button>`).join('')}</div><button class="secondary full" data-hunter-shot="skip">Non sparare</button>`;
  } else if(local.phase==='day'){
    area.innerHTML=note + `<div class="action-grid">
      <button class="primary" onclick="window._startVoteLocal()">Inizia votazione</button>
      <button class="secondary" onclick="window._skipVoteLocal()">Salta votazione e vai alla notte</button>
    </div>`;
  } else if(local.phase==='vote'){
    area.innerHTML=`${note}<p>Vota chi eliminare:</p><div class="action-grid">${alivePlayers(local.players).map(p=>`<button class="target-btn" data-lynch="${p.id}">${p.name}</button>`).join('')}</div><button class="secondary full" onclick="window._skipVoteLocal()">Nessuna eliminazione / salta voto</button>`;
  }
}
window._startVoteLocal=()=>startVoteLocal();
window._skipVoteLocal=()=>skipVoteLocal();
document.addEventListener('click', e=>{
  const a=e.target.closest('[data-local-action]');
  if(a && local) chooseLocalAction(a.dataset.localAction);
  const hs=e.target.closest('[data-hunter-shot]');
  if(hs && local) hunterShotLocal(hs.dataset.hunterShot);
  const l=e.target.closest('[data-lynch]');
  if(l && local) lynchLocal(l.dataset.lynch);
});
function chooseTarget(title, cb){
  const area=$('#localActionArea');
  area.innerHTML=`<p>${title}</p><div class="action-grid">${alivePlayers(local.players).map(p=>`<button class="target-btn" data-temp-target="${p.id}">${p.name}</button>`).join('')}</div>`;
  area.querySelectorAll('[data-temp-target]').forEach(b=>b.onclick=()=>cb(b.dataset.tempTarget));
}
function chooseLocalAction(action){
  if(action==='resolve') return resolveNightLocal();
  if(action==='wolf') return chooseTarget('Vittima scelta dai lupi:', id=>{ local.night.victim=id; local.lastText='Vittima dei lupi segnata.'; renderLocal(); });
  if(action==='seer') return chooseTarget('Giocatore da controllare:', id=>{ const p=local.players.find(x=>x.id===id); toast(`${p.name}: ${isWolfish(p.role)?'LUPO':'NON LUPO'}`); renderLocal(); });
  if(action==='guard') return chooseTarget('Chi protegge la guardia?', id=>{ local.night.protected=id; local.lastText='Protezione segnata.'; renderLocal(); });
  if(action==='witchSave'){ if(!local.witch.save) return toast('Pozione salvezza già usata.'); local.night.witchSave=true; local.witch.save=false; local.lastText='La strega ha usato la pozione di salvezza.'; renderLocal(); }
  if(action==='witchKill'){ if(!local.witch.kill) return toast('Pozione morte già usata.'); return chooseTarget('Chi uccide la strega?', id=>{ local.night.witchKill=id; local.witch.kill=false; local.lastText='Pozione di morte segnata.'; renderLocal(); }); }
}
function resolveNightLocal(){
  const deaths=[];
  if(local.night.victim && local.night.victim!==local.night.protected && !local.night.witchSave) deaths.push(local.night.victim);
  if(local.night.witchKill) deaths.push(local.night.witchKill);
  const unique=[...new Set(deaths)];
  unique.forEach(id=>{ const p=local.players.find(x=>x.id===id); if(p) p.alive=false; });
  const hunter=unique.map(id=>local.players.find(p=>p.id===id)).find(p=>p?.role==='hunter');
  local.phase=hunter ? 'hunterShot' : 'day'; local.step=0;
  local.pendingHunterId = hunter?.id || null;
  const names=unique.map(id=>local.players.find(p=>p.id===id)?.name).filter(Boolean);
  local.lastText = names.length ? narr('death', `È giorno. ${names.map(publicDeathText).join(' ')}`) : narr('noDeath', 'È giorno. Questa notte non è morto nessuno.');
  local.hostNote = hunter ? `${hunter.name} era il Cacciatore: può sparare prima di uscire.` : '';
  const win=winCheck(local.players); if(win && !hunter) local.lastText += ' ' + win;
  local.night={victim:null, protected:null, witchSave:false, witchKill:null};
  speak(local.lastText); renderLocal();
}
function hunterShotLocal(id){
  if(id && id!=='skip'){
    const p=local.players.find(x=>x.id===id);
    if(p){ p.alive=false; local.hostNote = `${p.name} è stato colpito dal Cacciatore. Ruolo: ${roleName(p.role)}.`; }
  } else local.hostNote='Il Cacciatore non ha sparato.';
  local.phase='day'; local.pendingHunterId=null;
  const win=winCheck(local.players); if(win) local.lastText += ' ' + win;
  renderLocal();
}

function startVoteLocal(){ local.phase='vote'; local.lastText=narr('voteStart','Discussione finita. Ora il villaggio vota chi eliminare.'); speak(local.lastText); renderLocal(); }
function skipVoteLocal(){
  local.phase='night';
  local.step=0;
  local.hostNote='';
  local.lastText=narr('voteSkipped','Il villaggio decide di non eliminare nessuno. Tutti chiudono gli occhi, ricomincia la notte.');
  speak(local.lastText);
  renderLocal();
}
function lynchLocal(id){
  const p=local.players.find(x=>x.id===id); if(!p) return;
  p.alive=false;
  local.hostNote = p.role==='jester' ? `${p.name} era il Giullare: ha raggiunto il suo obiettivo.` : '';
  if(p.role==='hunter'){
    local.phase='hunterShot'; local.pendingHunterId=p.id; local.step=0;
    local.hostNote = `${p.name} era il Cacciatore: può sparare prima di uscire.`;
    local.lastText=narr('lynch', `${p.name} è stato eliminato dal villaggio. Il suo ruolo resta segreto per i giocatori.`);
    speak(local.lastText); renderLocal(); return;
  }
  local.phase='night'; local.step=0;
  local.lastText=narr('lynch', `${p.name} è stato eliminato dal villaggio. Il suo ruolo resta segreto per i giocatori. Tutti chiudono gli occhi, ricomincia la notte.`);
  const win=winCheck(local.players); if(win) local.lastText += ' ' + win;
  speak(local.lastText); renderLocal();
}

async function createRoom(){
  const code=roomCode(); const hostId=uid();
  room={ code, playerId:hostId, isHost:true, data:null, unsub:null, revealMine:false, narratorShowRoles:false };
  localStorage.setItem('lupusPlayerId', hostId);
  await setDoc(doc(db,'lupusRooms',code), { code, hostId, phase:'lobby', step:0, players:[], votes:{}, night:{}, witch:{save:true,kill:true}, narration:'Stanza creata. Fai entrare i giocatori con il codice.', hostNote:'', createdAt:serverTimestamp(), updatedAt:serverTimestamp() });
  listenRoom(code); show('roomView'); toast(`Codice stanza: ${code}`);
}
async function joinRoom(){
  const code=$('#joinCode').value.trim().toUpperCase(); const name=$('#joinName').value.trim();
  if(!code || !name) return toast('Inserisci codice e nome.');
  const ref=doc(db,'lupusRooms',code); const snap=await getDoc(ref); if(!snap.exists()) return toast('Stanza non trovata.');
  const data=snap.data(); let playerId=localStorage.getItem('lupusPlayerId') || uid(); localStorage.setItem('lupusPlayerId',playerId);
  const players=data.players||[];
  if(!players.some(p=>p.id===playerId)) players.push({id:playerId,name,role:null,alive:true});
  await updateDoc(ref,{ players, updatedAt:serverTimestamp() });
  room={ code, playerId, isHost:data.hostId===playerId, data:null, unsub:null, revealMine:false, narratorShowRoles:false };
  listenRoom(code); show('roomView');
}
function listenRoom(code){
  if(room.unsub) room.unsub();
  room.unsub=onSnapshot(doc(db,'lupusRooms',code), snap=>{ if(!snap.exists()) return; room.data=snap.data(); room.isHost=room.data.hostId===room.playerId; renderRoom(); });
}
async function startOnlineGame(){
  if(!room.isHost) return;
  const players=(room.data.players||[]);
  const counts=getCounts('online');
  const setupError=validateSetup(players.map(p=>p.name), counts);
  if(setupError) return toast(setupError);
  const deck=makeRoleDeck(counts, players.length);
  const assigned=players.map((p,i)=>({...p,role:deck[i],alive:true}));
  await updateDoc(doc(db,'lupusRooms',room.code), { players:assigned, phase:'night', step:0, votes:{}, night:{}, witch:{save:true,kill:true}, narration:narr('intro','La partita inizia. Tutti guardano il proprio ruolo e poi chiudono gli occhi.'), hostNote:'', updatedAt:serverTimestamp() });
}
function renderRoom(){
  if(!room.data) return;
  const d=room.data, players=d.players||[], me=players.find(p=>p.id===room.playerId);
  $('#roomCodeBadge').textContent=d.code || room.code;
  $('#roomPhaseBadge').textContent=d.phase || 'lobby';
  $('#roomNarration').textContent=d.narration || '';
  $$('.narrator-only').forEach(x=>x.classList.toggle('hidden',!room.isHost));
  $('#myRoleCard').className = room.revealMine && me?.role ? 'role-card' : 'role-card hidden-role';
  $('#myRoleCard').innerHTML = room.revealMine && me?.role ? `${me.name}<br><small>${roleName(me.role)}</small><br><small>${ROLES.find(r=>r.id===me.role)?.desc||''}</small>` : (me?.role ? 'Carta nascosta' : 'Ruolo non assegnato');
  $('#roomPlayersList').innerHTML=players.map(p=>{
    const roleTxt = room.isHost && room.narratorShowRoles && p.role ? ` · ${roleName(p.role)}` : '';
    return `<div class="player-row ${p.alive?'':'dead'}"><span>${p.name}${roleTxt}</span><span class="chip ${p.alive?'alive-chip':'dead-chip'}">${p.alive?'vivo':'morto'}</span></div>`;
  }).join('') || '<p class="hint">Nessun giocatore entrato.</p>';
  renderRoomActions(d, players, me);
}
function renderRoomActions(d, players, me){
  const area=$('#roomActionArea');
  if(d.phase==='lobby'){ area.innerHTML= room.isHost ? `<p>Condividi il codice <b>${d.code}</b>. Poi assegna i ruoli.</p>` : '<p>Attendi che il narratore inizi.</p>'; return; }
  if(!me){ area.innerHTML='<p>Non sei registrato come giocatore in questa stanza.</p>'; return; }
  if(room.isHost){
    const hunter=players.find(p=>p.id===d.pendingHunterId);
    if(d.phase==='hunterShot' && hunter){
      area.innerHTML=`${d.hostNote ? `<div class="host-note"><b>Nota solo narratore:</b> ${d.hostNote}</div>` : ''}<p>Il Cacciatore ${hunter.name} può sparare. Il ruolo resta nascosto ai giocatori.</p><div class="action-grid">${alivePlayers(players).filter(p=>p.id!==hunter.id).map(p=>`<button class="target-btn" data-online-host="hunterShot:${p.id}">${p.name}</button>`).join('')}</div><button class="secondary full" data-online-host="hunterShot:skip">Non sparare</button>`;
      return;
    }
    area.innerHTML=`${d.hostNote ? `<div class="host-note"><b>Nota solo narratore:</b> ${d.hostNote}</div>` : ''}<div class="action-grid">
      <p class="hint">Pannello narratore. I morti non mostrano il ruolo ai giocatori.</p>
      <button class="secondary" data-online-host="resolveNight">Risolvi notte / passa al giorno</button>
      <button class="secondary" data-online-host="startVote">Apri votazione giorno</button>
      <button class="secondary" data-online-host="resolveVote">Conta voti / elimina</button>
      <button class="secondary" data-online-host="skipVote">Salta votazione e vai alla notte</button>
      <button class="primary" data-online-host="night">Nuova notte</button>
    </div>`;
    return;
  }
  if(!me.alive){ area.innerHTML='<p>Sei morto. Puoi seguire la partita, ma non votare.</p>'; return; }
  if(d.phase==='night'){
    const targets=alivePlayers(players).filter(p=>p.id!==me.id);
    if(isWolfish(me.role)) area.innerHTML=targetButtons('Scegli vittima dei lupi', targets, 'wolfVictim');
    else if(me.role==='seer') area.innerHTML=targetButtons('Veggente: scegli chi controllare', targets, 'seerCheck');
    else if(me.role==='guard') area.innerHTML=targetButtons('Guardia: scegli chi proteggere', alivePlayers(players), 'guardProtect');
    else if(me.role==='witch') {
      const w=d.witch||{save:true,kill:true};
      const killBtns = w.kill ? targetButtons('Strega: pozione morte disponibile', alivePlayers(players), 'witchKill', false) : '<p>Pozione di morte già usata.</p>';
      const saveBtn = w.save ? '<button class="secondary full" data-online-action="witchSave" data-target="save">Usa pozione salvezza</button>' : '<p>Pozione di salvezza già usata.</p>';
      area.innerHTML = killBtns + saveBtn;
    }
    else area.innerHTML='<p>È notte. Aspetta il tuo turno o il giorno.</p>';
  } else if(d.phase==='vote') area.innerHTML=targetButtons('Vota chi eliminare', alivePlayers(players).filter(p=>p.id!==me.id), 'dayVote');
  else if(d.phase==='hunterShot') area.innerHTML='<p>Il narratore sta gestendo un potere speciale. Attendi.</p>';
  else area.innerHTML='<p>È giorno. Discutete dal vivo, poi il narratore deciderà se aprire o saltare la votazione.</p>';
}
function targetButtons(title, targets, action, witch=false){
  return `<p>${title}</p><div class="action-grid">${targets.map(p=>`<button class="target-btn" data-online-action="${action}" data-target="${p.id}">${p.name}</button>`).join('')}</div>${witch?'<button class="secondary full" data-online-action="witchSave" data-target="save">Usa pozione salvezza</button>':''}`;
}
document.addEventListener('click', async e=>{
  const a=e.target.closest('[data-online-action]'); if(a) return onlinePlayerAction(a.dataset.onlineAction, a.dataset.target);
  const h=e.target.closest('[data-online-host]'); if(h) return onlineHostAction(h.dataset.onlineHost);
});
async function onlinePlayerAction(action,target){
  const ref=doc(db,'lupusRooms',room.code), d=room.data, me=(d.players||[]).find(p=>p.id===room.playerId);
  const night={...(d.night||{})}, votes={...(d.votes||{})};
  if(action==='wolfVictim') night[`wolf_${me.id}`]=target;
  if(action==='seerCheck') { const p=d.players.find(x=>x.id===target); toast(`${p.name}: ${isWolfish(p.role)?'LUPO':'NON LUPO'}`); night[`seer_${me.id}`]=target; }
  if(action==='guardProtect') night[`guard_${me.id}`]=target;
  const witch={...(d.witch||{save:true,kill:true})};
  if(action==='witchKill') { if(!witch.kill) return toast('Pozione morte già usata.'); night[`witchKill_${me.id}`]=target; witch.kill=false; }
  if(action==='witchSave') { if(!witch.save) return toast('Pozione salvezza già usata.'); night[`witchSave_${me.id}`]=true; witch.save=false; }
  if(action==='dayVote') votes[me.id]=target;
  await updateDoc(ref,{night,votes,witch,updatedAt:serverTimestamp()}); toast('Azione registrata.');
}
async function onlineNext(){
  const d=room.data; if(!room.isHost) return;
  const texts=[narr('wolves','I lupi aprono gli occhi e scelgono una vittima.'),narr('seer','Il veggente apre gli occhi e controlla un giocatore.'),narr('guard','La guardia apre gli occhi e protegge un giocatore.'),narr('witch','La strega apre gli occhi e decide se usare le pozioni.'),narr('dawn','Tutti chiudono gli occhi. Sta arrivando il giorno.')];
  let step=(d.step||0)+1; let narration=texts[d.step||0]||'Fase completata.';
  await updateDoc(doc(db,'lupusRooms',room.code),{step,narration,updatedAt:serverTimestamp()}); speak(narration);
}
async function onlineHostAction(action){
  if(action?.startsWith('hunterShot:')) return hunterShotOnline(action.split(':')[1]);
  if(action==='resolveNight') return resolveNightOnline();
  if(action==='startVote') return updateDoc(doc(db,'lupusRooms',room.code),{phase:'vote',votes:{},narration:narr('voteStart','Discussione finita. Ogni giocatore vivo vota dal proprio telefono.'),hostNote:'',updatedAt:serverTimestamp()});
  if(action==='skipVote') return updateDoc(doc(db,'lupusRooms',room.code),{phase:'night',step:0,night:{},votes:{},narration:narr('voteSkipped','Il villaggio decide di non eliminare nessuno. Tutti chiudono gli occhi, ricomincia la notte.'),hostNote:'',updatedAt:serverTimestamp()});
  if(action==='night') return updateDoc(doc(db,'lupusRooms',room.code),{phase:'night',step:0,night:{},votes:{},narration:narr('night','Tutti chiudono gli occhi. Ricomincia la notte.'),hostNote:'',updatedAt:serverTimestamp()});
  if(action==='resolveVote') return resolveVoteOnline();
}
function mostVoted(values){
  const c={}; values.filter(Boolean).forEach(v=>c[v]=(c[v]||0)+1);
  const entries=Object.entries(c).sort((a,b)=>b[1]-a[1]);
  if(!entries.length) return null;
  if(entries[1] && entries[0][1]===entries[1][1]) return null;
  return entries[0][0];
}
function mostVotedFromVotes(votes, players){
  const c={};
  Object.entries(votes||{}).forEach(([voter,target])=>{
    const voterPlayer=players.find(p=>p.id===voter);
    if(!target || !voterPlayer?.alive) return;
    c[target]=(c[target]||0)+(voterPlayer.role==='mayor'?2:1);
  });
  const entries=Object.entries(c).sort((a,b)=>b[1]-a[1]);
  if(!entries.length) return null;
  if(entries[1] && entries[0][1]===entries[1][1]) return null;
  return entries[0][0];
}
async function resolveNightOnline(){
  const d=room.data, players=[...(d.players||[])], night=d.night||{};
  const victim=mostVoted(Object.entries(night).filter(([k])=>k.startsWith('wolf_')).map(([,v])=>v));
  const protectedId=Object.entries(night).find(([k])=>k.startsWith('guard_'))?.[1];
  const witchSave=Object.keys(night).some(k=>k.startsWith('witchSave_'));
  const witchKill=Object.entries(night).find(([k])=>k.startsWith('witchKill_'))?.[1];
  const deaths=[]; if(victim && victim!==protectedId && !witchSave) deaths.push(victim); if(witchKill) deaths.push(witchKill);
  const unique=[...new Set(deaths)];
  unique.forEach(id=>{ const p=players.find(x=>x.id===id); if(p) p.alive=false; });
  const hunter=unique.map(id=>players.find(p=>p.id===id)).find(p=>p?.role==='hunter');
  const names=unique.map(id=>players.find(p=>p.id===id)?.name).filter(Boolean);
  let narration=names.length ? narr('death', `È giorno. ${names.map(publicDeathText).join(' ')}`) : narr('noDeath', 'È giorno. Questa notte non è morto nessuno.');
  let hostNote=hunter ? `${hunter.name} era il Cacciatore: può sparare prima di uscire.` : '';
  const win=winCheck(players); if(win && !hunter) narration += ' ' + win;
  await updateDoc(doc(db,'lupusRooms',room.code),{players,phase:hunter?'hunterShot':'day',pendingHunterId:hunter?.id||null,step:0,night:{},narration,hostNote,updatedAt:serverTimestamp()}); speak(narration);
}
async function resolveVoteOnline(){
  const d=room.data, players=[...(d.players||[])], target=mostVotedFromVotes(d.votes||{}, players);
  let narration=narr('tie','Nessuno è stato eliminato: non ci sono voti validi o c’è parità.');
  let hostNote='';
  let hunter=null;
  if(target){ const p=players.find(x=>x.id===target); if(p){ p.alive=false; narration=narr('lynch', `${p.name} è stato eliminato dal villaggio. Il suo ruolo resta segreto per i giocatori.`); if(p.role==='jester') hostNote=`${p.name} era il Giullare: ha raggiunto il suo obiettivo.`; if(p.role==='hunter'){ hunter=p; hostNote=`${p.name} era il Cacciatore: può sparare prima di uscire.`; } } }
  const win=winCheck(players); if(win && !hunter) narration += ' ' + win;
  await updateDoc(doc(db,'lupusRooms',room.code),{players,phase:hunter?'hunterShot':'day',pendingHunterId:hunter?.id||null,votes:{},narration,hostNote,updatedAt:serverTimestamp()}); speak(narration);
}

async function hunterShotOnline(target){
  const d=room.data, players=[...(d.players||[])], hunter=players.find(p=>p.id===d.pendingHunterId);
  let narration=d.narration || 'Il Cacciatore ha terminato la sua azione.';
  let hostNote='Il Cacciatore non ha sparato.';
  if(target && target!=='skip'){
    const p=players.find(x=>x.id===target);
    if(p && p.alive){
      p.alive=false;
      hostNote=`${p.name} è stato colpito dal Cacciatore. Ruolo: ${roleName(p.role)}.`;
      narration += ` ${p.name} è morto. Il suo ruolo resta segreto per i giocatori.`;
    }
  }
  const win=winCheck(players); if(win) narration += ' ' + win;
  await updateDoc(doc(db,'lupusRooms',room.code),{players,phase:'day',pendingHunterId:null,narration,hostNote,updatedAt:serverTimestamp()});
  speak(narration);
}

init();
