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
const APP_VERSION = "V27";

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
  const colors = {
    "stage-home": "#080b16",
    "stage-lobby": "#111827",
    "stage-night": "#080b22",
    "stage-day": "#211405",
    "stage-vote": "#25090f",
    "stage-end": "#07170e"
  };
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = colors[cls] || "#080b16";
}

function blip(type = "soft") {
  if (!settings.sound) return;
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
  if (!match) return;
  show("homeView");
  $("#joinCode").value = match[1].toUpperCase();
  setTimeout(() => {
    $("#joinSection")?.scrollIntoView({ behavior: "smooth", block: "center" });
    $("#joinName")?.focus();
  }, 120);
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
    "Il villaggio sembra tranquillo. È sempre così, poco prima che qualcuno inizi a mentire.",
    "Le lanterne si spengono e la fiducia va a dormire per prima.",
    "Facce innocenti, sorrisi sospetti e almeno una persona che ha già capito tutto. Forse.",
    "Benvenuti nel villaggio, dove tutti dicono la verità. Questa era la prima bugia.",
    "La partita comincia. Da ora in poi anche chiedere l’ora può sembrare sospetto.",
    "Mettetevi comodi. Tra poco qualcuno accuserà il suo migliore amico senza alcuna prova.",
    "Il villaggio è pronto. Il buon senso, invece, non ha confermato la presenza.",
    "Si parte. Ricordate: sembrare tranquilli non vi rende innocenti, ma aiuta parecchio.",
    "Tutto tace. È il momento perfetto per iniziare a dubitare di chiunque.",
    "La luna sale e con lei il numero di accuse completamente inventate."
  ],
  night: [
    "Scende la notte. Chiudete gli occhi e cercate di non ridere proprio adesso.",
    "Tutti dormono. O almeno fingono con una serietà sorprendente.",
    "Il villaggio spegne le luci. Le cattive intenzioni, invece, restano ben sveglie.",
    "Occhi chiusi. Chi sbircia verrà accusato anche nella prossima partita.",
    "È notte. Respirate piano e non fate rumori da lupo dilettante.",
    "Le case si chiudono, le ombre si allungano e qualcuno ha già scelto una pessima strategia.",
    "Tutti a dormire. Sì, anche chi sostiene di non fidarsi del narratore.",
    "La notte avvolge il villaggio. Le scuse per domani sono già in preparazione.",
    "Silenzio assoluto. Il minimo colpo di tosse verrà usato come prova.",
    "Chiudete gli occhi. Da questo momento ogni fruscio sembra un complotto.",
    "La luna è alta. Le probabilità di una decisione discutibile anche.",
    "Il villaggio dorme. I sospetti, come sempre, non ne hanno alcuna intenzione."
  ],
  cupid: [
    "Cupido, apri gli occhi. È il momento di creare una coppia che potrebbe rimpiangerti.",
    "Cupido si sveglia. Due cuori stanno per ricevere una notifica non richiesta.",
    "Cupido, scegli due innamorati. L’amore è cieco, ma tu puoi guardare.",
    "È il turno di Cupido: unisci due destini e lascia il caos fare il resto.",
    "Cupido prende la mira. Romanticismo e pessime conseguenze sono pronti.",
    "Cupido, scegli la coppia. Nessuno ha chiesto il tuo intervento, quindi è perfetto.",
    "Due giocatori stanno per diventare inseparabili. Cupido, decidi chi.",
    "Cupido si alza in silenzio. Il villaggio non sa ancora che sta nascendo un problema sentimentale."
  ],
  wolves: [
    "Lupi, aprite gli occhi. Il menù del villaggio è aperto, ma niente discussioni infinite.",
    "Il branco si sveglia. Scegliete una vittima e cercate almeno di sembrare organizzati.",
    "Lupi, è il vostro momento. Niente ululati: i vicini si lamentano.",
    "Le ombre si muovono. I lupi scelgono chi avrà una mattinata molto breve.",
    "Lupi, indicate la vostra preda. Le recensioni del villaggio sono tutte sospette.",
    "Il branco apre gli occhi. Una decisione rapida vale più di cinque minuti di mimica confusa.",
    "Lupi, fate la vostra scelta. Il silenzio è elegante, ma mettetevi d’accordo.",
    "La caccia comincia. Scegliete con cura: ogni errore sarà discusso rumorosamente domani.",
    "I lupi si svegliano e controllano chi sembra troppo sereno.",
    "Branco, tocca a voi. Una vittima, zero ululati e possibilmente nessun teatrino.",
    "Lupi, scegliete chi non vedrà l’alba. Almeno non in questa partita.",
    "La luna illumina il branco. È tempo di prendere una decisione terribilmente importante."
  ],
  seer: [
    "Veggente, apri gli occhi. Vediamo se l’intuito oggi lavora o è ancora in pausa.",
    "Il Veggente si sveglia. Scegli qualcuno e scopri se quella faccia innocente è in garanzia.",
    "Veggente, indica un giocatore. La verità è vicina, ma potrebbe essere molto scomoda.",
    "È il turno del Veggente. Una sola domanda, nessuna possibilità di chiamare un amico.",
    "Veggente, controlla chi ti insospettisce. Sì, anche se è la persona più simpatica.",
    "La sfera si accende. Speriamo non mostri proprio la persona che difendevi da dieci minuti.",
    "Veggente, scegli con calma. Domani dovrai convincere gli altri senza sembrare troppo informato.",
    "Il Veggente osserva il villaggio. Qualcuno sta per perdere la copertura.",
    "Veggente, cerca un lupo. Evita di controllare sempre la stessa persona solo perché ti sta antipatica.",
    "La verità bussa alla porta. Veggente, decidi a quale.",
    "Veggente, apri gli occhi. Il tuo intuito è ufficialmente sotto esame.",
    "Scegli un giocatore, Veggente. Potresti trovare un lupo oppure un’altra persona che non ti crederà."
  ],
  guard: [
    "Guardia, apri gli occhi. Scegli chi merita una notte senza drammi.",
    "La Guardia inizia il giro. Proteggi qualcuno e spera che i lupi abbiano avuto la stessa idea.",
    "Guardia, indica chi vuoi salvare. Nessuna pressione: c’è solo una vita in gioco.",
    "È il turno della Guardia. Scudo pronto, intuito possibilmente acceso.",
    "Guardia, scegli una persona. Proteggere te stesso è legale, ma poco eroico.",
    "La Guardia si sveglia. Qualcuno sta per ricevere una sicurezza notturna completamente gratuita.",
    "Proteggi un giocatore, Guardia. Domani potrai prenderti il merito anche senza prove.",
    "La Guardia pattuglia il villaggio. Speriamo non stia difendendo proprio un lupo.",
    "Guardia, fai la tua scelta. Il servizio clienti non accetta reclami dopo l’alba.",
    "Uno scudo, molti sospetti. Guardia, decidi chi coprire.",
    "Guardia, scegli chi deve superare la notte. Poi torna a dormire come se niente fosse.",
    "La Guardia apre gli occhi. Il villaggio confida nel tuo istinto, forse troppo."
  ],
  witch: [
    "Strega, apri gli occhi. Pozioni pronte e responsabilità discutibili.",
    "La Strega controlla la borsa: salvezza, veleno e zero istruzioni per l’uso.",
    "Strega, scegli bene. Una pozione può cambiare tutto o creare un magnifico disastro.",
    "È il turno della Strega. Il villaggio spera che tu abbia letto le etichette.",
    "Strega, puoi salvare, avvelenare o fare finta di non aver sentito nulla.",
    "La Strega si sveglia. Farmacia aperta, rimborsi esclusi.",
    "Pozioni sul tavolo. Strega, decidi se essere eroina, minaccia o entrambe.",
    "Strega, la notte ti presenta il conto. Scegli quale bottiglia aprire.",
    "La Strega osserva la situazione e probabilmente pensa: perché sempre io?",
    "Strega, agisci con calma. Il veleno non accetta il tasto annulla.",
    "È il momento delle pozioni. Leggere attentamente le controindicazioni sarebbe utile, ma è tardi.",
    "Strega, fai la tua scelta. Domani tutti commenteranno, senza sapere che eri tu."
  ],
  medium: [
    "Medium, apri gli occhi. I morti hanno finalmente qualcosa di utile da dire.",
    "Il Medium si sveglia e consulta chi non può più interrompere la discussione.",
    "Medium, scegli un morto. Almeno lui non potrà mentirti in faccia.",
    "È il turno del Medium. Il confine con l’aldilà ha un’assistenza sorprendentemente rapida.",
    "Medium, interroga il passato. Il villaggio ne avrà bisogno, anche se non lo ammetterà.",
    "Le candele si accendono. Medium, scegli chi ascoltare dall’altra parte.",
    "Il Medium apre gli occhi. I vivi sono confusi, proviamo con i morti.",
    "Medium, consulta uno spirito. Le risposte potrebbero essere più chiare della discussione diurna.",
    "È ora di parlare con l’aldilà. Là almeno nessuno cambia versione ogni trenta secondi.",
    "Medium, scegli un morto e scopri quale ruolo si è portato nella tomba."
  ],
  dawn: [
    "La notte si ritira. Tutti possono riaprire gli occhi, con moderato ottimismo.",
    "Arriva l’alba. Contatevi bene prima di iniziare a sorridere.",
    "Il sole sorge sul villaggio. Non è detto che sia una buona notizia per tutti.",
    "La notte è finita. Aprite gli occhi e preparate le vostre migliori facce sorprese.",
    "Il gallo canta. Qualcuno lo trova rassicurante, qualcun altro decisamente prematuro.",
    "Torna la luce. Vediamo chi ha ancora qualcosa da dire.",
    "Il villaggio si sveglia. Prima regola del mattino: controllare chi manca.",
    "È giorno. Le ombre spariscono, le bugie invece restano."
  ],
  day: [
    "Il sole sorge. Qualcuno ha dormito male e qualcuno non ha dormito affatto.",
    "È giorno. Sorridete pure: tanto qualcuno sta mentendo.",
    "Il villaggio si sveglia. Le accuse possono iniziare tra tre, due, uno.",
    "La piazza si riempie. Portate prove, sospetti o almeno una storia convincente.",
    "Inizia il giorno. Chi parla troppo è sospetto, chi tace anche. Buona fortuna.",
    "Il villaggio apre gli occhi e chiude temporaneamente il buon senso.",
    "È arrivato il momento di discutere. Le amicizie sono ufficialmente sospese.",
    "La luce del giorno rivela tutto, tranne chi sta dicendo la verità.",
    "Il villaggio è sveglio. Preparate accuse precise o completamente creative.",
    "Si discute. Ricordate che dire ‘fidatevi di me’ non è una prova."
  ],
  discussion: [
    "Ora discutete. Cercate il lupo, non il volume più alto della stanza.",
    "La parola passa al villaggio. Le prove sono gradite, le sceneggiate inevitabili.",
    "Inizia la discussione. Difendetevi bene e accusate con almeno un minimo di fantasia.",
    "Avete qualche minuto per capire tutto. Nessuno si aspetta davvero che succeda.",
    "Parlate, osservate e ricordate chi cambia versione ogni dodici secondi.",
    "Il villaggio può discutere. Le alleanze dureranno probabilmente meno del timer.",
    "È tempo di indagini. Anche fissare qualcuno in silenzio sembra una strategia, a quanto pare.",
    "Confrontate le storie. Una di queste potrebbe perfino essere vera.",
    "La discussione è aperta. Chi dice ‘io sono sicuramente buono’ parte già malissimo.",
    "Cercate le contraddizioni. Oppure accusate a caso, come da tradizione."
  ],
  vote: [
    "È ora di votare. Ricordate: urlare più forte non rende più innocenti.",
    "Si vota. Le amicizie finiscono qui, almeno fino alla prossima partita.",
    "Il villaggio deve decidere. Accuse, difese e pessime intuizioni sono benvenute.",
    "Tempo scaduto per le parole. Ora servono voti e un po’ di coraggio.",
    "La votazione è aperta. Scegliete con la testa, oppure con il rancore: nessuno può controllare.",
    "È il momento della verità. O almeno di una decisione collettiva molto rumorosa.",
    "Votate chi ritenete un lupo. Non chi vi ha rubato l’ultima patatina.",
    "Il villaggio sceglie un nome. Pensateci bene: il tasto indietro non salva nessuno.",
    "Si passa ai voti. Ogni scelta pesa, quella del Sindaco un po’ di più.",
    "È ora di eliminare un sospetto. La certezza non è richiesta, purtroppo.",
    "Votate. Qualcuno sta per scoprire quanto vale davvero la fiducia del gruppo.",
    "La piazza vuole un verdetto. Fate la vostra scelta e assumetevi almeno metà della colpa."
  ],
  tie: [
    "Parità. Il villaggio non decide e la confusione si prende il punto.",
    "I voti si annullano. Nessuno esce, ma tutti diventano ancora più sospetti.",
    "Nessuna maggioranza. Ottimo lavoro, oppure pessimo: lo scoprirete più tardi.",
    "Pareggio perfetto. Il villaggio rimanda la decisione e i lupi ringraziano educatamente.",
    "La votazione finisce in parità. Nessun colpevole, nessun innocente, solo caos.",
    "Nessuno viene eliminato. Le accuse restano in circolo, come un brutto pettegolezzo.",
    "Il villaggio non trova un accordo. La notte, invece, arriverà puntualissima.",
    "Parità. Tutti salvi per ora e tutti pronti a dire ‘io l’avevo detto’."
  ],
  elimination: [
    "Il villaggio ha deciso. Speriamo almeno che abbia deciso bene.",
    "Il verdetto è arrivato. La sicurezza mostrata fino a un secondo fa è improvvisamente sparita.",
    "La piazza indica un colpevole. O un innocente molto sfortunato.",
    "La votazione è conclusa. Qualcuno deve salutare il villaggio.",
    "Decisione presa. Da questo momento ogni errore verrà ricordato per tutta la serata.",
    "Il villaggio emette la sentenza. Le prove restano discutibili, il risultato no.",
    "Un nome ha raccolto più sospetti degli altri. È il momento del verdetto.",
    "La maggioranza ha parlato. Non è detto che abbia ragione, ma ha parlato."
  ],
  death: [
    "Brutte notizie al mattino.",
    "Il villaggio conta i presenti e i conti non tornano.",
    "La notte ha lasciato il segno.",
    "Qualcuno non risponde all’appello.",
    "Il risveglio porta una notizia che nessuno voleva sentire.",
    "La notte non è passata senza conseguenze.",
    "Manca una voce nella piazza del villaggio.",
    "Il sole è sorto, ma per qualcuno decisamente troppo tardi."
  ],
  safe: [
    "Colpo di scena: nessuno è morto. Per una volta il villaggio ha avuto fortuna.",
    "Questa notte non è morto nessuno. I lupi dovranno rivedere la strategia.",
    "Nessuna vittima stanotte. Qualcuno si prende il merito, anche se magari non c’entra niente.",
    "Tutti presenti. Il villaggio festeggia, i lupi fingono entusiasmo.",
    "La notte finisce senza vittime. Un raro momento di pace, non abituatevi.",
    "Nessuno è stato eliminato. La Guardia sorride, la Strega pure, forse senza motivo.",
    "Il villaggio è ancora al completo. Le accuse, purtroppo, anche.",
    "Nessun morto. Ottima notizia per tutti, tranne per chi aveva preparato un discorso commovente."
  ],
  skip: [
    "Il villaggio decide di non votare. Scelta prudente o codarda, dipende da chi racconta la storia.",
    "Nessuna eliminazione oggi. I sospetti restano vivi e forse anche i lupi.",
    "Votazione saltata. Tutti salvi per ora, ma la notte non fa sconti.",
    "Il villaggio rimanda il verdetto. I lupi apprezzano la gentilezza.",
    "Nessun voto. Le accuse vengono conservate per domani, insieme ai rancori.",
    "La piazza non decide. La notte prende nota e prosegue.",
    "Oggi nessuno viene eliminato. È una tregua, non un’assoluzione.",
    "Il voto viene saltato. Qualcuno tira un sospiro di sollievo un po’ troppo evidente."
  ],
  hunter: [
    "Il Cacciatore ha ancora un ultimo colpo. Anche da eliminato non sa stare tranquillo.",
    "Cacciatore, scegli chi portare con te. L’uscita di scena può ancora diventare memorabile.",
    "Il Cacciatore prepara l’ultimo colpo. Qualcuno farebbe bene a smettere di sorridere.",
    "Ultima azione del Cacciatore. Una freccia, molti rimpianti possibili.",
    "Il Cacciatore non ha finito. Scegli il bersaglio e chiudi la faccenda con stile.",
    "Cacciatore, tocca a te. Il villaggio pensava fosse finita, ingenuamente.",
    "Un ultimo colpo risuona nel villaggio. Decidi verso chi.",
    "Il Cacciatore può reagire. È il momento perfetto per una scelta impulsiva, oppure no."
  ],
  gameOver: [
    "La partita è finita. Ora tutti possono finalmente dire che avevano capito tutto dall’inizio.",
    "Sipario. Le bugie sono terminate e iniziano le giustificazioni.",
    "Il villaggio scopre la verità. Alcuni saranno fieri, altri molto meno.",
    "Fine della partita. È il momento di rivelare ruoli, strategie e pessime decisioni.",
    "La storia si chiude. Le amicizie possono essere riattivate, con cautela.",
    "Il verdetto finale è arrivato. Adesso potete discutere su chi ha rovinato tutto.",
    "Partita conclusa. Il mistero è risolto, il dibattito post-partita appena iniziato.",
    "Tutto è finito. Tranne la persona che continuerà a dire ‘ve l’avevo detto’."
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

const settings = {
  sound: localStorage.getItem("lupusSound") !== "0",
  vibration: localStorage.getItem("lupusVibration") !== "0",
  wakeLock: localStorage.getItem("lupusWakeLock") === "1"
};
let wakeLockHandle = null;
let actionBusy = false;
let onlineRolesTouched = false;
let lastRecommendedPlayerCount = 0;
let roleHideTimer = null;
let roleHideInterval = null;
let lastRenderedPhase = null;
let lastTurnKey = "";
let voiceEnabled = localStorage.getItem("lupusVoiceEnabled") !== "false";
let voiceRate = Number(localStorage.getItem("lupusVoiceRate") || "1");
let voiceUnlocked = sessionStorage.getItem("lupusVoiceUnlocked") === "true";
let lastSpokenKey = "";
let lastSpokenText = "";
let availableVoices = [];
let speechQueue = [];
let speechToken = 0;
const narrationBags = new Map();
const lastNarrationLine = new Map();
let selectedTheme = localStorage.getItem("lupusTheme") || "castle";
let cinematicEnabled = localStorage.getItem("lupusCinematic") !== "false";
let lastCinematicKey = "";
let lastImmersiveKey = "";
let cinematicTimer = null;

let playersPage = 0;
let playerTargetPage = 0;
let playerTargetContext = "";
let hostTargetPage = 0;
let hostTargetContext = "";
let witchView = "choices";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function uid() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function shuffled(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function resetNarrationBags() {
  narrationBags.clear();
  lastNarrationLine.clear();
}

function randomLine(type) {
  const source = LINES[type] || [];
  if (!source.length) return "";
  let bag = narrationBags.get(type) || [];
  if (!bag.length) {
    bag = shuffled(source);
    const previous = lastNarrationLine.get(type);
    if (bag.length > 1 && bag[0] === previous) [bag[0], bag[1]] = [bag[1], bag[0]];
  }
  const line = bag.shift() || "";
  narrationBags.set(type, bag);
  lastNarrationLine.set(type, line);
  return line;
}

function narr(type, text = "") {
  const prefix = randomLine(type).trim();
  const suffix = String(text || "").trim();
  if (!prefix) return suffix;
  if (!suffix) return prefix;
  return `${prefix} ${suffix}`.replace(/\s+/g, " ").trim();
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
    "Controlla di vedere V21 in alto. Se non compare, premi Reset e ricarica il sito."
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
  document.body.classList.toggle("in-game", ["localGameView", "roomView"].includes(viewId));
  if (viewId === "homeView") setStage("home");
  if (viewId === "onlineChoiceView" || viewId === "joinRoomView") setStage("lobby");
  window.scrollTo({ top: 0, behavior: "auto" });
}

function speak(text) {
  speakNarration(text, { force: true });
}

function vibrate(ms = 80) {
  if (!settings.vibration) return;
  try { navigator.vibrate?.(ms); } catch {}
}

function syncViewportMetrics() {
  const viewport = window.visualViewport;
  const height = Math.max(320, Math.round(viewport?.height || window.innerHeight));
  const width = Math.max(280, Math.round(viewport?.width || window.innerWidth));
  document.documentElement.style.setProperty("--app-height", `${height}px`);
  document.documentElement.style.setProperty("--app-width", `${width}px`);
  const keyboardOpen = Boolean(viewport && window.innerHeight - viewport.height > 140);
  document.body.classList.toggle("keyboard-open", keyboardOpen);
  document.body.classList.toggle("very-short-screen", height < 590);
  document.body.classList.toggle("very-narrow-screen", width < 350);
}

function setupMobileViewport() {
  syncViewportMetrics();
  window.addEventListener("resize", syncViewportMetrics, { passive: true });
  window.addEventListener("orientationchange", () => setTimeout(syncViewportMetrics, 120), { passive: true });
  window.visualViewport?.addEventListener("resize", syncViewportMetrics, { passive: true });
  window.visualViewport?.addEventListener("scroll", syncViewportMetrics, { passive: true });
}

async function updateWakeLock() {
  const status = $("#wakeLockStatus");
  try {
    if (wakeLockHandle) {
      await wakeLockHandle.release();
      wakeLockHandle = null;
    }
    if (settings.wakeLock && "wakeLock" in navigator && document.visibilityState === "visible") {
      wakeLockHandle = await navigator.wakeLock.request("screen");
      wakeLockHandle.addEventListener("release", () => { wakeLockHandle = null; });
      if (status) status.textContent = "Schermo sempre acceso: attivo.";
    } else if (status) {
      status.textContent = settings.wakeLock
        ? "La funzione non è disponibile su questo browser."
        : "Schermo sempre acceso: disattivato.";
    }
  } catch (err) {
    if (status) status.textContent = "Non è stato possibile mantenere lo schermo acceso.";
  }
}

function syncSettingsUi() {
  $("#soundSetting").checked = settings.sound;
  $("#vibrationSetting").checked = settings.vibration;
  $("#wakeLockSetting").checked = settings.wakeLock;
  updateWakeLock();
}

function openSettings() {
  syncSettingsUi();
  $("#settingsModal").classList.remove("hidden");
}

function closeSettings() {
  $("#settingsModal").classList.add("hidden");
}

async function leaveCurrentRoom() {
  clearTimeout(room.timer);
  room.unsub?.();
  room.unsub = null;
  room.data = null;
  room.code = null;
  room.isHost = false;
  room.revealMine = false;
  lastSpokenKey = "";
  lastSpokenText = "";
  playersPage = 0;
  playerTargetPage = 0;
  playerTargetContext = "";
  hostTargetPage = 0;
  hostTargetContext = "";
  witchView = "choices";
  history.replaceState(null, "", location.pathname + location.search);
  show("homeView");
  toast("Sei uscito dalla stanza.");
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
  if (new Set(names.map(n => n.trim().toLowerCase())).size !== names.length) return "Ogni giocatore deve avere un nome diverso.";
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

function statusHtml(players, phase, votes = {}, options = {}) {
  const alive = alivePlayers(players);
  const dead = players.length - alive.length;
  const voteCount = alive.filter(p => votes[p.id]).length;
  const wolfCount = alive.filter(p => isWolf(p.role)).length;
  const phaseText = phaseLabel(phase);
  return `
    <div class="status-grid">
      <div><b>${alive.length}</b><span>Vivi</span></div>
      <div><b>${dead}</b><span>Morti</span></div>
      <div><b>${phaseText}</b><span>Fase</span></div>
      ${phase === "vote"
        ? `<div><b>${voteCount}/${alive.length}</b><span>Hanno votato</span></div>`
        : options.showWolfCount
          ? `<div><b>${wolfCount}</b><span>Lupi vivi · narratore</span></div>`
          : `<div><b>${players.length}</b><span>Giocatori</span></div>`}
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
    resetNarrationBags();
    const code = roomCode();
    const hostId = uid();
    const hostName = ($("#createName")?.value.trim().slice(0, 24) || "Tu");
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
      nightOrder: buildNightOrder(assigned, true),
      resolvingNight: false,
      resolvingVote: false,
      votes: {},
      voteRound: 0,
      night: {},
      privateResults: {},
      witch: { save: true, kill: true },
      loversChosen: false,
      pendingHunterId: null,
      narration: `${randomLine("intro")} Test rapido avviato con sette bot. ${randomLine("night")}`.replace(/\s+/g, " ").trim(),
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



async function restartOnlineSamePlayers() {
  if (!room.isHost || !room.data) return;
  resetNarrationBags();
  lastSpokenKey = "";
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
    nightOrder: [],
    resolvingNight: false,
    resolvingVote: false,
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

function phaseDuration(baseSeconds, phase) {
  const base = Number(baseSeconds || 0);
  if (base <= 0) return 0;
  if (phase === "day") return base * 3;
  if (phase === "vote") return Math.max(base * 2, 30);
  return base;
}

function phaseProgress(deadline, phase = room.data?.phase) {
  if (!deadline) return 0;
  const total = Math.max(1, phaseDuration(room.data?.phaseSeconds || 25, phase) * 1000);
  const left = Math.max(0, deadline - Date.now());
  return Math.max(0, Math.min(100, (left / total) * 100));
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


function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase() || "?";
}

function playerRowHtml(p, options = {}) {
  const showRole = Boolean(options.showRole && p.role);
  const isMe = Boolean(options.meId && p.id === options.meId);
  const avatar = showRole ? roleIcon(p.role) : initials(p.name);
  const hasVoted = options.phase === "vote" && Boolean(options.votes?.[p.id]);
  const secondary = showRole
    ? roleName(p.role)
    : hasVoted
      ? "Ha votato ✓"
      : options.phase === "vote" && p.alive
        ? "Deve ancora votare"
        : p.alive
          ? "In gioco"
          : "Eliminato";

  return `<div class="player-row ${p.alive ? "" : "dead"} ${isMe ? "is-me" : ""} ${hasVoted ? "has-voted" : ""}">
    <div class="player-main">
      <span class="player-avatar">${avatar}</span>
      <span class="player-copy">
        <b>${p.name}${isMe ? " · Tu" : ""}${p.isBot ? " 🤖" : ""}</b>
        <small>${secondary}</small>
      </span>
    </div>
    <span class="chip ${p.alive ? "alive-chip" : "dead-chip"}">${p.alive ? "vivo" : "morto"}</span>
  </div>`;
}

function winnerBannerHtml(text = "") {
  const lower = text.toLowerCase();
  let icon = "🏆", title = "Partita conclusa", team = "neutral";
  if (lower.includes("villaggio")) { icon = "🏘️"; title = "Vince il Villaggio"; team = "village"; }
  else if (lower.includes("lupi") || lower.includes("lupo")) { icon = "🐺"; title = "Vincono i Lupi"; team = "wolves"; }
  else if (lower.includes("giullare")) { icon = "🃏"; title = "Vince il Giullare"; team = "jester"; }
  return `<div class="winner-symbol">${icon}</div><div><small>Risultato finale</small><b>${title}</b><p>${text}</p></div>`;
}

function buildNightOrder(players, includeCupid = false) {
  const roles = new Set(alivePlayers(players).map(p => p.role));
  const order = [];
  if (includeCupid && roles.has("cupid")) order.push("cupid");
  if ([...roles].some(isWolf)) order.push("wolves");
  if (roles.has("seer")) order.push("seer");
  if (roles.has("guard")) order.push("guard");
  if (roles.has("witch")) order.push("witch");
  if (roles.has("medium")) order.push("medium");
  order.push("dawn");
  return order;
}

function newlyDeadIds(beforePlayers, afterPlayers) {
  const beforeAlive = new Set((beforePlayers || []).filter(p => p.alive).map(p => p.id));
  return (afterPlayers || []).filter(p => beforeAlive.has(p.id) && !p.alive).map(p => p.id);
}

async function acquirePhaseLock(field, expectedPhase) {
  const ref = doc(db, "lupusRooms", room.code);
  try {
    return await runTransaction(db, async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return null;
      const d = snap.data();
      if (d.phase !== expectedPhase || d[field]) return null;
      tx.update(ref, { [field]: true, updatedAt: serverTimestamp() });
      return d;
    });
  } catch (err) {
    console.error("Phase lock error", err);
    return null;
  }
}




function getTurnState(d, players, me) {
  if (!me) return { key: "missing", kind: "wait", icon: "⚠️", title: "Dispositivo non registrato", text: "Rientra nella stanza dallo stesso telefono." };
  if (d.phase === "lobby") return { key: "lobby", kind: "wait", icon: "👥", title: "In attesa", text: room.isHost ? "Invita almeno 5 giocatori e avvia la partita." : "Il narratore sta preparando la partita." };
  if (d.phase === "gameOver") return { key: "end", kind: "done", icon: "🏆", title: "Partita conclusa", text: "Scopri i ruoli finali." };
  if (!me.alive) return { key: `dead-${d.phase}`, kind: "dead", icon: "👻", title: "Sei stato eliminato", text: "Puoi seguire la partita, ma non puoi agire o votare." };

  if (d.phase === "night") {
    const step = currentNightStep(d, players);
    const roleCanAct =
      (step === "cupid" && me.role === "cupid") ||
      (step === "wolves" && isWolf(me.role)) ||
      (step === "seer" && me.role === "seer") ||
      (step === "guard" && me.role === "guard") ||
      (step === "witch" && me.role === "witch") ||
      (step === "medium" && me.role === "medium");
    if (roleCanAct) {
      const acted = hasActed(d, me.id, step);
      return acted
        ? { key: `done-${step}`, kind: "done", icon: "✓", title: "Azione registrata", text: "Aspetta il prossimo turno." }
        : { key: `act-${step}`, kind: "action", icon: roleIcon(me.role), title: "È il tuo turno", text: `Devi agire come ${roleName(me.role)}.` };
    }
    return { key: `wait-${step}`, kind: "wait", icon: "🌙", title: `Sta giocando: ${nightStepLabel(step)}`, text: "Aspetta: il tuo ruolo non deve agire ora." };
  }

  if (d.phase === "day") {
    return { key: `day-${d.dayNumber}`, kind: "talk", icon: "☀️", title: "È giorno", text: "Discutete dal vivo e cercate di riconoscere i lupi." };
  }

  if (d.phase === "vote") {
    const targetId = d.votes?.[me.id];
    const target = players.find(p => p.id === targetId);
    return targetId
      ? { key: `voted-${d.voteRound}`, kind: "done", icon: "🗳️", title: "Voto registrato", text: target ? `Hai votato ${target.name}.` : "Hai già votato." }
      : { key: `vote-${d.voteRound}`, kind: "action", icon: "🗳️", title: "Devi votare", text: "Scegli un giocatore da eliminare." };
  }

  if (d.phase === "hunter") {
    const isHunter = d.pendingHunterId === me.id;
    return isHunter
      ? { key: "hunter-act", kind: "action", icon: "🏹", title: "Sei il Cacciatore", text: "Il narratore deve scegliere il tuo bersaglio." }
      : { key: "hunter-wait", kind: "wait", icon: "🏹", title: "Azione del Cacciatore", text: "Aspetta che il narratore risolva il colpo." };
  }

  return { key: d.phase, kind: "wait", icon: "…", title: "Attendi", text: "La partita sta proseguendo." };
}

function renderTurnBanner(d, players, me) {
  const state = getTurnState(d, players, me);
  const banner = $("#turnBanner");
  banner.className = `turn-banner turn-${state.kind}`;
  banner.innerHTML = `<span class="turn-icon">${state.icon}</span><span><b>${state.title}</b><small>${state.text}</small></span>`;

  const requiresAction = state.kind === "action";
  $("#mobileActionNavBtn")?.classList.toggle("needs-action", requiresAction);
  $("#actionNavDot")?.classList.toggle("visible", requiresAction);

  if (requiresAction && lastTurnKey !== state.key && lastTurnKey) {
    vibrate([35, 30, 65]);
    blip("phase");
    toast(state.title);
  }
  lastTurnKey = state.key;
}

function privateIntelHtml(d, players, me) {
  if (!me?.role) return "";
  const items = [];

  if (isWolf(me.role)) {
    const mates = players.filter(p => p.id !== me.id && p.alive && isWolf(p.role)).map(p => p.name);
    items.push({
      icon: "🐺",
      title: "Branco",
      text: mates.length ? `Gli altri lupi vivi sono: ${mates.join(", ")}.` : "Sei l’unico lupo vivo."
    });
  }

  if (me.role === "traitor") {
    const wolves = players.filter(p => p.alive && isWolf(p.role)).map(p => p.name);
    items.push({
      icon: "🗡️",
      title: "I lupi",
      text: wolves.length ? `Devi aiutare: ${wolves.join(", ")}.` : "Non ci sono più lupi vivi."
    });
  }

  if (me.lover) {
    const partner = players.find(p => p.id === me.lover);
    if (partner) items.push({
      icon: "💞",
      title: "Innamorati",
      text: `Sei legato/a a ${partner.name}. Se uno muore, muore anche l’altro.`
    });
  }

  if (me.role === "witch") {
    const witch = d.witch || { save: true, kill: true };
    items.push({
      icon: "🧪",
      title: "Pozioni",
      text: `Salvezza: ${witch.save ? "disponibile" : "usata"} · Morte: ${witch.kill ? "disponibile" : "usata"}.`
    });
  }

  if (me.role === "mayor") {
    items.push({ icon: "🎖️", title: "Voto doppio", text: "Il tuo voto vale due durante ogni votazione." });
  }

  if (!items.length) return "";
  return `<div class="private-intel">${items.map(item => `
    <div class="intel-row">
      <span>${item.icon}</span>
      <div><b>${item.title}</b><small>${item.text}</small></div>
    </div>`).join("")}</div>`;
}

function hideRoleNow() {
  clearTimeout(roleHideTimer);
  clearInterval(roleHideInterval);
  roleHideTimer = null;
  roleHideInterval = null;
  room.revealMine = false;
  $("#roleAutoHideHint")?.classList.add("hidden");
  if (room.data) renderRoom();
}

function revealRoleTemporarily() {
  clearTimeout(roleHideTimer);
  clearInterval(roleHideInterval);

  if (room.revealMine) {
    hideRoleNow();
    return;
  }

  room.revealMine = true;
  let seconds = 10;
  const hint = $("#roleAutoHideHint");
  hint.textContent = `Si nasconde automaticamente tra ${seconds} secondi.`;
  hint.classList.remove("hidden");
  renderRoom();

  roleHideInterval = setInterval(() => {
    seconds -= 1;
    if (seconds > 0 && hint) hint.textContent = `Si nasconde automaticamente tra ${seconds} secondi.`;
  }, 1000);

  roleHideTimer = setTimeout(hideRoleNow, 10000);
}

function setEntryTab(tab) {
  const create = tab === "create";
  $("#showCreateTabBtn").classList.toggle("active", create);
  $("#showJoinTabBtn").classList.toggle("active", !create);
  $("#createSection").classList.toggle("active-entry", create);
  $("#joinSection").classList.toggle("active-entry", !create);
}

function updateNetworkState() {
  const offline = !navigator.onLine;
  $("#networkBanner").classList.toggle("hidden", !offline);
  document.body.classList.toggle("is-offline", offline);
}


function playerPageSize() { return window.innerWidth <= 760 ? 8 : 12; }
function paginateList(items, page, size) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const safePage = Math.max(0, Math.min(page, pages - 1));
  return { pages, page: safePage, items: items.slice(safePage * size, safePage * size + size) };
}
function targetPagerHtml(pages, page, scope = "player") {
  if (pages <= 1) return "";
  return `<div class="target-pager">
    <button class="ghost" data-target-scope="${scope}" data-target-page="${Math.max(0, page - 1)}" ${page <= 0 ? "disabled" : ""}>‹</button>
    <span>${page + 1}/${pages}</span>
    <button class="ghost" data-target-scope="${scope}" data-target-page="${Math.min(pages - 1, page + 1)}" ${page >= pages - 1 ? "disabled" : ""}>›</button>
  </div>`;
}
function compactPlayerRowHtml(p, options = {}) {
  const showRole = Boolean(options.showRole && p.role);
  const isMe = options.meId === p.id;
  const hasVoted = options.phase === "vote" && Boolean(options.votes?.[p.id]);
  const label = showRole ? roleName(p.role) : hasVoted ? "Votato ✓" : p.alive ? "Vivo" : "Morto";
  return `<div class="mini-player ${p.alive ? "" : "dead"} ${isMe ? "is-me" : ""}"><span class="mini-player-avatar">${showRole ? roleIcon(p.role) : initials(p.name)}</span><span class="mini-player-copy"><b>${p.name}${p.isBot ? " 🤖" : ""}</b><small>${label}</small></span></div>`;
}
function renderPlayerPages(d, players) {
  const paged = paginateList(players, playersPage, playerPageSize());
  playersPage = paged.page;
  $("#roomPlayersList").innerHTML = paged.items.map(p => compactPlayerRowHtml(p, { showRole: d.phase === "gameOver", meId: room.playerId, phase: d.phase, votes: d.votes || {} })).join("");
  $("#playersPager").classList.toggle("hidden", paged.pages <= 1);
  $("#playersPageLabel").textContent = `${paged.page + 1}/${paged.pages}`;
  $("#playersPrevBtn").disabled = paged.page <= 0;
  $("#playersNextBtn").disabled = paged.page >= paged.pages - 1;
}
function compactTimerText(d) {
  if (!d.autoMode || !d.phaseDeadline || ["lobby", "gameOver"].includes(d.phase)) return "";
  return `${Math.max(0, Math.ceil((d.phaseDeadline - Date.now()) / 1000))}s`;
}


function loadVoices() {
  if ("speechSynthesis" in window) availableVoices = speechSynthesis.getVoices() || [];
}

function italianVoice() {
  const italian = availableVoices.filter(v => /^it(-|_)/i.test(v.lang) || /ital/i.test(v.name));
  return italian.find(v => v.localService) || italian[0] || availableVoices.find(v => v.localService) || availableVoices[0] || null;
}

function setVoiceEnabled(v) {
  voiceEnabled = Boolean(v);
  if (voiceEnabled) lastSpokenKey = "";
  localStorage.setItem("lupusVoiceEnabled", String(voiceEnabled));
  if ($("#voiceEnabledInput")) $("#voiceEnabledInput").checked = voiceEnabled;
  updateVoiceButtons();
  if (!voiceEnabled && "speechSynthesis" in window) {
    speechToken += 1;
    speechQueue = [];
    speechSynthesis.cancel();
  }
}

function setVoiceRate(v) {
  voiceRate = Math.max(.75, Math.min(1.35, Number(v) || 1));
  localStorage.setItem("lupusVoiceRate", String(voiceRate));
  if ($("#voiceRateInput")) $("#voiceRateInput").value = voiceRate;
  if ($("#voiceRateValue")) $("#voiceRateValue").textContent = `${voiceRate.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}×`;
}

function requestVoiceUnlock() {
  if (voiceEnabled && !voiceUnlocked && "speechSynthesis" in window) $("#audioUnlockOverlay")?.classList.remove("hidden");
}

function unlockVoice() {
  voiceUnlocked = true;
  sessionStorage.setItem("lupusVoiceUnlocked", "true");
  $("#audioUnlockOverlay")?.classList.add("hidden");
  const current = narrationForState(room.data, room.data?.players || []);
  lastSpokenKey = current?.key || "";
  const activation = "Narratore vocale attivato. Prometto di non ululare troppo forte.";
  speakNarration(current ? `${activation} ${current.text}` : activation, { force: true });
}

function splitSpeechText(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
  const chunks = [];
  let current = "";
  for (const sentence of sentences) {
    const candidate = `${current} ${sentence}`.trim();
    if (candidate.length > 190 && current) {
      chunks.push(current);
      current = sentence.trim();
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function playSpeechQueue(token, options = {}) {
  if (token !== speechToken || !speechQueue.length || !("speechSynthesis" in window)) return;
  const text = speechQueue.shift();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "it-IT";
  utterance.rate = voiceRate;
  utterance.pitch = options.pitch || 1;
  utterance.volume = 1;
  const voice = italianVoice();
  if (voice) utterance.voice = voice;
  utterance.onend = () => playSpeechQueue(token, options);
  utterance.onerror = event => {
    if (event.error !== "canceled" && event.error !== "interrupted") console.warn("Voce narratore:", event.error);
    playSpeechQueue(token, options);
  };
  speechSynthesis.speak(utterance);
}

function speakNarration(text, options = {}) {
  if (!text || !("speechSynthesis" in window)) return;
  if (!voiceEnabled && !options.force) return;
  if (!voiceUnlocked && !options.force) {
    requestVoiceUnlock();
    return;
  }
  const chunks = splitSpeechText(text);
  if (!chunks.length) return;
  speechToken += 1;
  const token = speechToken;
  speechQueue = chunks;
  speechSynthesis.cancel();
  lastSpokenText = chunks.join(" ");
  setTimeout(() => playSpeechQueue(token, options), 40);
}

function textHash(value = "") {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function narrationForState(d, players) {
  if (!d || d.phase === "lobby") return null;
  const phase = d.phase || "lobby";
  const round = d.nightNumber || d.dayNumber || d.voteRound || 0;
  const step = phase === "night" ? currentNightStep(d, players || []) : "";
  const fallbacks = {
    night: "Scende la notte. Tutti chiudono gli occhi.",
    day: "La notte è terminata. Tutti possono riaprire gli occhi.",
    vote: "È il momento della votazione. Ogni giocatore scelga chi eliminare.",
    hunter: "Il Cacciatore deve scegliere chi portare con sé.",
    gameOver: d.winnerText || "La partita è terminata."
  };
  const text = String(d.narration || fallbacks[phase] || "").trim();
  if (!text) return null;
  return { key: `${phase}:${round}:${step}:${textHash(text)}`, text };
}

function maybeSpeakGameState(d, players) {
  if (!room.isHost) return;
  const narration = narrationForState(d, players);
  if (!narration || narration.key === lastSpokenKey) return;
  lastSpokenKey = narration.key;
  const pitch = d.phase === "night" ? .94 : d.phase === "gameOver" ? 1.05 : 1;
  speakNarration(narration.text, { pitch });
}

function updateVoiceButtons() {
  if ($("#voiceToggleBtn")) {
    $("#voiceToggleBtn").textContent = voiceEnabled ? "🔊" : "🔇";
    $("#voiceToggleBtn").classList.toggle("voice-on", voiceEnabled);
    $("#voiceToggleBtn").classList.toggle("voice-off", !voiceEnabled);
  }
  if ($("#voiceEnabledInput")) $("#voiceEnabledInput").checked = voiceEnabled;
  setVoiceRate(voiceRate);
}

function applyTheme(theme) {
  const allowed = ["castle","horror","vampire","zombie","western"];
  selectedTheme = allowed.includes(theme) ? theme : "castle";
  localStorage.setItem("lupusTheme", selectedTheme);
  document.documentElement.dataset.gameTheme = selectedTheme;
  if ($("#themeSetting")) $("#themeSetting").value = selectedTheme;
}

function setCinematicEnabled(enabled) {
  cinematicEnabled = Boolean(enabled);
  localStorage.setItem("lupusCinematic", String(cinematicEnabled));
  if ($("#cinematicSetting")) $("#cinematicSetting").checked = cinematicEnabled;
}

function phaseScene(d, players) {
  const phase = d?.phase || "lobby";
  if (phase === "night") {
    const step = currentNightStep(d, players || []);
    const scenes = {
      cupid:["💘","Cupido","Sceglie i due innamorati"],
      wolves:["🐺","I lupi si svegliano","Il branco sceglie una vittima"],
      seer:["🔮","Il Veggente si sveglia","Osserva un giocatore"],
      guard:["🛡️","La Guardia si sveglia","Sceglie chi proteggere"],
      witch:["🧪","La Strega si sveglia","Può salvare oppure avvelenare"],
      medium:["🕯️","Il Medium si sveglia","Consulta il mondo dei morti"],
      dawn:["🌅","Arriva l’alba","Tutti possono riaprire gli occhi"]
    };
    return { key:`night:${d.round||d.nightNumber||0}:${step}`, values:scenes[step] || ["🌙","Scende la notte","Tutti chiudono gli occhi"] };
  }
  const scenes = {
    day:["☀️","Il villaggio si sveglia","Inizia la discussione"],
    vote:["🗳️","È il momento del voto","Scegliete chi eliminare"],
    hunter:["🏹","Ultimo colpo","Il Cacciatore sceglie il bersaglio"],
    gameOver:["🏆","Partita terminata", d?.winnerText || "Scoprite il vincitore"]
  };
  return scenes[phase] ? { key:`${phase}:${d.round||0}:${d.phaseStartedAt||d.winner||''}`, values:scenes[phase] } : null;
}

function showPhaseCinematic(d, players) {
  if (!cinematicEnabled) return;
  const scene = phaseScene(d, players);
  if (!scene || scene.key === lastCinematicKey) return;
  lastCinematicKey = scene.key;
  const [icon,title,text] = scene.values;
  $("#phaseCinematicIcon").textContent = icon;
  $("#phaseCinematicTitle").textContent = title;
  $("#phaseCinematicText").textContent = text;
  const overlay = $("#phaseCinematic");
  overlay.className = `phase-cinematic phase-${d.phase}`;
  clearTimeout(cinematicTimer);
  requestAnimationFrame(() => overlay.classList.add("show"));
  cinematicTimer = setTimeout(() => {
    overlay.classList.remove("show");
    setTimeout(() => overlay.classList.add("hidden"), 320);
  }, 1450);
  overlay.classList.remove("hidden");
}

function immersiveHaptic(d, players, me) {
  if (!settings?.vibration || !navigator.vibrate || !me) return;
  if (d.phase === "night") {
    const step = currentNightStep(d, players);
    const active = (step === "wolves" && isWolf(me.role)) || step === me.role;
    if (active) navigator.vibrate([35,45,70]);
  } else if (d.phase === "vote") navigator.vibrate(45);
  else if (d.phase === "gameOver") navigator.vibrate([80,60,120]);
}

/* -------------------- INIT -------------------- */

function init() {
  setupMobileViewport();
  makeRolePicker($("#onlineRolePicker"), "online");

  applyTheme(selectedTheme);
  setCinematicEnabled(cinematicEnabled);
  $("#themeSetting").onchange = e => applyTheme(e.target.value);
  $("#cinematicSetting").onchange = e => setCinematicEnabled(e.target.checked);

  loadVoices();
  if("speechSynthesis" in window) speechSynthesis.onvoiceschanged=loadVoices;
  updateVoiceButtons();
  $("#voiceToggleBtn").onclick=()=>{setVoiceEnabled(!voiceEnabled); if(voiceEnabled)requestVoiceUnlock(); toast(voiceEnabled?"Narratore vocale attivo.":"Narratore vocale disattivato.");};
  $("#voiceEnabledInput").onchange=e=>{setVoiceEnabled(e.target.checked); if(voiceEnabled)requestVoiceUnlock();};
  $("#voiceRateInput").oninput=e=>setVoiceRate(e.target.value);
  $("#testVoiceBtn").onclick=()=>{if(!voiceUnlocked){requestVoiceUnlock();return;} speakNarration("Questa è la voce del narratore automatico. Ogni partita userà frasi diverse e un po’ meno prevedibili.", { force: true });};
  $("#audioUnlockBtn").onclick=unlockVoice;
  $("#settingsBtn").onclick = openSettings;
  $("#roomSettingsBtn").onclick = openSettings;
  $("#closeSettingsBtn").onclick = closeSettings;
  $("#settingsModal").addEventListener("click", e => {
    if (e.target.id === "settingsModal") closeSettings();
  });

  $("#soundSetting").onchange = e => {
    settings.sound = e.target.checked;
    localStorage.setItem("lupusSound", settings.sound ? "1" : "0");
    if (settings.sound) blip("phase");
  };
  $("#vibrationSetting").onchange = e => {
    settings.vibration = e.target.checked;
    localStorage.setItem("lupusVibration", settings.vibration ? "1" : "0");
    if (settings.vibration) vibrate(60);
  };
  $("#wakeLockSetting").onchange = e => {
    settings.wakeLock = e.target.checked;
    localStorage.setItem("lupusWakeLock", settings.wakeLock ? "1" : "0");
    updateWakeLock();
  };
  document.addEventListener("visibilitychange", () => {
    if (settings.wakeLock && document.visibilityState === "visible") updateWakeLock();
  });

  document.addEventListener("click", e => {
    const jump = e.target.closest("[data-scroll-target]");
    if (jump) scrollToSection(jump.dataset.scrollTarget);

    const step = e.target.closest("[data-step-role]");
    if (step) {
      const role = step.dataset.stepRole;
      const delta = Number(step.dataset.delta || 0);
      const box = document.querySelector(`[data-online-role="${role}"]`);
      if (box) {
        box.textContent = Math.max(0, Number(box.textContent || 0) + delta);
        onlineRolesTouched = true;
        renderOnlineSetupSummary();
      }
    }

    const targetPager = e.target.closest("[data-target-page]");
    if (targetPager) {
      const page = Number(targetPager.dataset.targetPage || 0);
      if (targetPager.dataset.targetScope === "host") hostTargetPage = page;
      else playerTargetPage = page;
      renderRoom();
      return;
    }
    const uiAction = e.target.closest("[data-ui-action]");
    if (uiAction) {
      if (uiAction.dataset.uiAction === "witchKill") witchView = "kill";
      if (uiAction.dataset.uiAction === "witchBack") witchView = "choices";
      playerTargetPage = 0;
      playerTargetContext = "";
      renderRoom();
      return;
    }
    const closeDetails = e.target.closest(".close-details-btn");
    if (closeDetails) { closeDetails.closest("details")?.removeAttribute("open"); return; }
    const onlineAction = e.target.closest("[data-online-action]");
    if (onlineAction) handleOnlinePlayerAction(onlineAction.dataset.onlineAction, onlineAction.dataset.target || null);

    const hostAction = e.target.closest("[data-host-action]");
    if (hostAction) handleHostAction(hostAction.dataset.hostAction);

    const preset = e.target.closest("[data-preset]");
    if (preset) {
      const mode = preset.dataset.preset.split(":")[1] || "auto";
      const count = getOnlinePlayerCount();
      if (count < 5) return toast("Servono almeno 5 giocatori.");
      applyCounts("online", recommendedCounts(count, mode));
      onlineRolesTouched = true;
      lastRecommendedPlayerCount = count;
      renderOnlineSetupSummary();
      toast(mode === "auto" ? "Ruoli consigliati impostati." : "Configurazione applicata.");
    }
  });

  $("#closeErrorBoxBtn").onclick = () => $("#errorBox").classList.add("hidden");
  $("#closeRoleOverlayBtn").onclick = closeRoleOverlay;
  $("#roleOverlay").addEventListener("click", e => {
    if (e.target.id === "roleOverlay" || e.target.classList.contains("role-overlay-bg")) {
      closeRoleOverlay();
    }
  });

  $("#roomCodeBadge").onclick = async () => {
    if (!room?.data?.code) return;
    try { await navigator.clipboard.writeText(room.data.code); toast("Codice copiato."); }
    catch { toast(`Codice: ${room.data.code}`); }
  };
  $("#playersPrevBtn").onclick = () => { playersPage = Math.max(0, playersPage - 1); renderRoom(); };
  $("#playersNextBtn").onclick = () => { playersPage += 1; renderRoom(); };
  $("#copyRoomCodeBtn").onclick = async () => {
    if (!room?.data?.code) return;
    try {
      await navigator.clipboard.writeText(room.data.code);
      toast("Codice copiato.");
    } catch {
      toast(`Codice: ${room.data.code}`);
    }
  };

  $("#copyRoomLinkBtn").onclick = async () => {
    if (!room?.data?.code) return;
    try {
      await navigator.clipboard.writeText(makeRoomInviteLink(room.data.code));
      toast("Link copiato.");
    } catch {
      toast("Non riesco a copiare il link.");
    }
  };

  $("#shareRoomBtn").onclick = async () => {
    if (!room?.data?.code) return;
    const link = makeRoomInviteLink(room.data.code);
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Lupus Online",
          text: `Entra nella stanza ${room.data.code}`,
          url: link
        });
      } else {
        await navigator.clipboard.writeText(link);
        toast("Link copiato.");
      }
    } catch (err) {
      if (err?.name !== "AbortError") toast("Condivisione non riuscita.");
    }
  };

  $("#showCreateTabBtn").onclick = () => setEntryTab("create");
  $("#showJoinTabBtn").onclick = () => setEntryTab("join");
  $("#createRoomBtn").onclick = createRoom;
  $("#joinRoomBtn").onclick = joinRoom;
  $("#rejoinLastRoomBtn").onclick = rejoinLastRoom;
  $("#quickBotTestBtn").onclick = quickBotTest;
  $("#diagnosticsBtn").onclick = runDiagnostics;
  $("#restartOnlineSameBtn").onclick = restartOnlineSamePlayers;

  $("#leaveRoomBtn").onclick = () => confirmAction(
    "Uscire dalla stanza",
    "Potrai rientrare dall’ultima stanza salvata.",
    leaveCurrentRoom,
    "Esci"
  );

  $("#startOnlineGameBtn").onclick = startOnlineGame;
  $("#toggleMyRoleBtn").onclick = revealRoleTemporarily;
  $("#onlineRevealAllBtn").onclick = () => {
    toast("I ruoli restano segreti fino alla fine della partita.");
  };
  $("#roomSpeakBtn").onclick = () => speakNarration(lastSpokenText || room.data?.narration || $("#roomNarration").textContent, { force: true });
  $("#roomNextBtn").onclick = onlineAdvanceManual;

  $("#joinCode").addEventListener("input", e => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  });

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

  const savedName = localStorage.getItem("lupusDisplayName") || "";
  $("#createName").value = savedName;
  $("#joinName").value = savedName;

  window.addEventListener("online", updateNetworkState);
  window.addEventListener("offline", updateNetworkState);
  updateNetworkState();
  setEntryTab(location.hash.includes("room=") ? "join" : "create");

  parseHashRoom();

  setInterval(() => {
    try {
      if ($("#roomView").classList.contains("active") && room.data) renderRoom();
    } catch {}
  }, 1000);

  const last = localStorage.getItem("lupusLastRoom");
  $("#rejoinLastRoomBtn").classList.toggle("hidden", !last);
}

init();

/* -------------------- ONLINE MODE -------------------- */

async function createRoom() {
  try {
    const hostName = $("#createName").value.trim().slice(0, 24);
    if (!hostName) {
      $("#createName").focus();
      return toast("Inserisci il tuo nome.");
    }
    if (!navigator.onLine) return toast("Serve una connessione internet.");

    localStorage.setItem("lupusDisplayName", hostName);
    const phaseSeconds = Number($("#phaseSeconds").value || 25);
    const hostId = uid();
    let code = null;

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const candidate = roomCode();
      const snap = await getDoc(doc(db, "lupusRooms", candidate));
      if (!snap.exists()) {
        code = candidate;
        break;
      }
    }
    if (!code) throw new Error("Non riesco a generare un codice stanza libero.");

    const hostPlayer = {
      id: hostId,
      name: hostName,
      role: null,
      alive: true,
      isBot: false,
      lover: null,
      joinedAt: Date.now()
    };

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
      nightOrder: [],
      resolvingNight: false,
      resolvingVote: false,
      votes: {},
      voteRound: 0,
      night: {},
      privateResults: {},
      witch: { save: true, kill: true },
      loversChosen: false,
      pendingHunterId: null,
      narration: "Stanza creata. Condividi il codice con gli altri giocatori.",
      hostNote: "Chi crea la stanza è anche un giocatore.",
      hostLog: [{
        at: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
        text: "Stanza creata."
      }],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    history.replaceState(null, "", `${location.pathname}${location.search}#room=${code}`);
    listenRoom(code);
    show("roomView");
    toast(`Stanza ${code} creata.`);
  } catch (err) {
    showTechnicalError("Errore creazione stanza", err);
  }
}

async function joinRoom() {
  try {
    const code = $("#joinCode").value.trim().toUpperCase();
    const name = $("#joinName").value.trim().slice(0, 24);
    if (!code || !name) return toast("Inserisci codice e nome.");
    if (!navigator.onLine) return toast("Serve una connessione internet.");

    localStorage.setItem("lupusDisplayName", name);
    const playerId = localStorage.getItem("lupusPlayerId") || uid();
    const ref = doc(db, "lupusRooms", code);
    let joinError = "";

    await runTransaction(db, async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        joinError = "Stanza non trovata.";
        return;
      }

      const d = snap.data();
      if (d.phase !== "lobby") {
        joinError = "La partita è già iniziata.";
        return;
      }

      const players = [...(d.players || [])];
      const existing = players.find(p => p.id === playerId);
      const duplicateName = players.find(p =>
        p.id !== playerId &&
        p.name.trim().toLowerCase() === name.trim().toLowerCase()
      );

      if (duplicateName) {
        joinError = "Questo nome è già usato nella stanza.";
        return;
      }
      if (!existing && players.length >= 24) {
        joinError = "La stanza è piena.";
        return;
      }

      if (existing) {
        existing.name = name;
      } else {
        players.push({
          id: playerId,
          name,
          role: null,
          alive: true,
          isBot: false,
          lover: null,
          joinedAt: Date.now()
        });
      }

      tx.update(ref, { players, updatedAt: serverTimestamp() });
    });

    if (joinError) return toast(joinError);

    localStorage.setItem("lupusPlayerId", playerId);
    localStorage.setItem("lupusLastRoom", JSON.stringify({ code, playerId }));
    room.code = code;
    room.playerId = playerId;
    room.revealMine = false;
    history.replaceState(null, "", `${location.pathname}${location.search}#room=${code}`);
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
  resetNarrationBags();
  lastSpokenKey = "";
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
    nightOrder: buildNightOrder(assigned, true),
    resolvingNight: false,
    resolvingVote: false,
    nightNumber: 1,
    dayNumber: 0,
    phaseSeconds: seconds,
    autoMode: seconds > 0,
    phaseDeadline: seconds > 0 ? Date.now() + phaseDuration(seconds, "night") * 1000 : null,
    votes: {},
    voteRound: 0,
    night: {},
    privateResults: {},
    witch: { save: true, kill: true },
    loversChosen: false,
    pendingHunterId: null,
    narration: `${randomLine("intro")} ${randomLine("night")} Guardate il vostro ruolo, poi chiudete gli occhi.`.replace(/\s+/g, " ").trim(),
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
  $("#roomStatus").innerHTML = statusHtml(players, d.phase, d.votes || {}, { showWolfCount: room.isHost });
  renderTurnBanner(d, players, me);

  if (lastRenderedPhase && lastRenderedPhase !== d.phase) {
    blip("phase");
    vibrate(55);
  }
  lastRenderedPhase = d.phase;

  const info = roomPhaseInfo(d, me);
  const timerExtra = d.autoMode && d.phaseDeadline && !["lobby","gameOver"].includes(d.phase)
    ? `<span class="meta-chip">⏱️ ${Math.max(0, Math.ceil((d.phaseDeadline - Date.now()) / 1000))}s</span>`
    : "";
  const progress = d.autoMode && d.phaseDeadline && !["lobby","gameOver"].includes(d.phase)
    ? phaseProgress(d.phaseDeadline, d.phase)
    : null;
  $("#roomPhaseMeta").innerHTML = phaseMetaHtml(info.title, info.desc, progress, timerExtra);
  $$(".narrator-only").forEach(el => {
    if (!room.isHost) el.classList.add("hidden");
  });

  $("#toggleMyRoleBtn").textContent = room.revealMine ? "🙈 Nascondi" : "👁 MOSTRA RUOLO";
  if (!room.revealMine) $("#roleAutoHideHint").classList.add("hidden");
  if (me?.role && room.revealMine) {
    $("#myRoleCard").className = "mini-role-card";
    $("#myRoleCard").innerHTML = `<span class="mini-role-icon">${roleIcon(me.role)}</span><span class="role-copy"><b>${roleName(me.role)}</b><small>${roleDesc(me.role)}</small></span>`;
    $("#myRoleCard").onclick = () => openRoleOverlay(me.role, me.name);
  } else {
    $("#myRoleCard").className = "mini-role-card hidden-role";
    $("#myRoleCard").innerHTML = me?.role ? `<span class="role-hidden-lock">🔒</span><span><b>Il tuo ruolo è nascosto</b><small>Tocca MOSTRA RUOLO</small></span>` : "Ruolo non ancora assegnato";
    $("#myRoleCard").onclick = null;
  }

  $("#roomPrivateInfo").innerHTML = "";

  const isLobby = d.phase === "lobby";
  const isGameOver = d.phase === "gameOver";
  $("#oneScreenDashboard").classList.toggle("lobby-mode", isLobby);
  $("#oneScreenDashboard").classList.toggle("host-lobby", isLobby && room.isHost);
  $("#oneScreenDashboard").classList.toggle("guest-lobby", isLobby && !room.isHost);
  $("#oneScreenDashboard").classList.toggle("game-mode", !isLobby && !isGameOver);
  $("#oneScreenDashboard").classList.toggle("host-game", !isLobby && !isGameOver && room.isHost);
  $("#oneScreenDashboard").classList.toggle("guest-game", !isLobby && !isGameOver && !room.isHost);
  $("#oneScreenDashboard").classList.toggle("end-mode", isGameOver);
  $("#inviteSection").classList.toggle("hidden", !(room.isHost && isLobby));
  $("#hostSetupSection").classList.toggle("hidden", !(room.isHost && isLobby));
  $("#roomRoleSection").classList.toggle("hidden", isLobby || isGameOver);
  $("#roomActionSection").classList.toggle("hidden", isLobby || isGameOver);
  $("#hostControlBar").classList.toggle("hidden", !(room.isHost && !isLobby && !isGameOver));
  $("#roomSpeakBtn").classList.toggle("hidden", !(room.isHost && !isLobby && !isGameOver));
  $("#voiceToggleBtn").classList.toggle("hidden", !room.isHost);
  document.documentElement.dataset.gamePhase = d.phase;
  $("#hostPhaseControls").classList.add("hidden");
  $("#gameQuickNav").classList.add("hidden");
  $("#mobileGameDock").classList.add("hidden");
  $("#narratorToolsSection").classList.add("hidden");
  const compactTimer = compactTimerText(d);
  const timerSeconds = compactTimer ? Number(compactTimer.replace(/\D/g, "")) : 0;
  $("#gameTimerCompact").textContent = compactTimer;
  $("#gameTimerCompact").classList.toggle("hidden", !compactTimer);
  $("#gameTimerCompact").classList.toggle("timer-urgent", Boolean(compactTimer && timerSeconds <= 5));
  $("#playerCountBadge").textContent = players.length;
  $("#roomMainTitle").textContent = isLobby ? "Prepara la stanza" : phaseLabel(d.phase);

  if (room.isHost && isLobby && players.length >= 5 && !onlineRolesTouched && lastRecommendedPlayerCount !== players.length) {
    applyCounts("online", recommendedCounts(players.length, "auto"));
    lastRecommendedPlayerCount = players.length;
  }

  updateRoomQr();
  $("#finalRevealCard").classList.toggle("hidden", d.phase !== "gameOver");
  $("#restartOnlineSameBtn").classList.toggle("hidden", !(room.isHost && d.phase === "gameOver"));
  $("#roomWinnerBanner").innerHTML = winnerBannerHtml(d.winnerText || d.narration || "");
  renderFinalList("#finalRevealList", players);
  renderLog("#hostLogList", d.hostLog || []);

  renderPlayerPages(d, players);
  renderOnlineSetupSummary();
  renderRoomActions(d, players, me);
  maybeSpeakGameState(d, players);
  showPhaseCinematic(d, players);
  const immersiveKey = phaseScene(d, players)?.key || d.phase;
  if (immersiveKey !== lastImmersiveKey) {
    lastImmersiveKey = immersiveKey;
    immersiveHaptic(d, players, me);
  }
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
    return `<div class="private-result compact-private-result"><b>Risultato Veggente</b><br>${r.targetName}: <b>${r.result}</b><small>Resta visibile solo a te.</small></div>`;
  }
  if (r.type === "medium") {
    return `<div class="private-result compact-private-result"><b>Risultato Medium</b><br>${r.targetName}: <b>${r.result}</b><small>Resta visibile solo a te.</small></div>`;
  }
  if (r.type === "cupid") {
    return `<div class="private-result compact-private-result"><b>Scelta di Cupido</b><br>${r.firstName} 💞 ${r.secondName}<small>Resta visibile solo a te.</small></div>`;
  }
  return "";
}

function compactPrivateIntelHtml(d, players, me) {
  if (!me?.role) return "";
  const lines = [];
  if (isWolf(me.role)) {
    const mates = players.filter(p => p.id !== me.id && p.alive && isWolf(p.role)).map(p => p.name);
    lines.push(`🐺 ${mates.length ? `Branco: ${mates.join(", ")}` : "Sei l’unico lupo vivo"}`);
  }
  if (me.role === "traitor") {
    const wolves = players.filter(p => p.alive && isWolf(p.role)).map(p => p.name);
    lines.push(`🗡️ Lupi: ${wolves.length ? wolves.join(", ") : "nessuno vivo"}`);
  }
  if (me.lover) {
    const partner = players.find(p => p.id === me.lover);
    if (partner) lines.push(`💞 Innamorato/a di ${partner.name}`);
  }
  if (me.role === "mayor") lines.push("🎖️ Il tuo voto vale doppio");
  if (!lines.length) return "";
  return `<div class="compact-intel-strip">${lines.map(line => `<span>${line}</span>`).join("")}</div>`;
}

function renderRoomActions(d, players, me) {
  const area = $("#roomActionArea");
  const hostArea = $("#hostControlsArea");
  if (d.phase === "lobby" || d.phase === "gameOver") { area.innerHTML = ""; hostArea.innerHTML = ""; return; }
  area.innerHTML = `${privateResultHtml(d, me)}${compactPrivateIntelHtml(d, players, me)}${renderPlayerControls(d, players, me)}`;
  hostArea.innerHTML = room.isHost ? renderHostControls(d, players) : "";
}

function renderPlayerControls(d, players, me) {
  if (!me) return `<div class="compact-state state-wait"><span>⚠️</span><div><b>Non registrato</b><small>Rientra con questo telefono.</small></div></div>`;
  if (!me.alive) return `<div class="compact-state state-dead"><span>👻</span><div><b>Sei morto</b><small>Puoi soltanto seguire.</small></div></div>`;

  const step = currentNightStep(d, players);
  const acted = hasActed(d, me.id, step);
  const done = text => `<div class="compact-state state-done"><span>✓</span><div><b>Registrata</b><small>${text}</small></div></div>`;
  const wait = text => `<div class="compact-state state-wait"><span>🌙</span><div><b>Aspetta</b><small>${text}</small></div></div>`;

  if (d.phase === "night") {
    if (step === "cupid" && me.role === "cupid") return acted ? done("I due innamorati sono stati scelti.") : cupidControls(players);
    if (step === "wolves" && isWolf(me.role)) return acted ? done("La scelta del branco è stata registrata.") : targetButtons("Scegli la vittima", players, me.id, "wolf", "🐺");
    if (step === "seer" && me.role === "seer") return acted ? done("Leggi il risultato privato qui sopra.") : targetButtons("Chi vuoi controllare?", players, me.id, "seer", "🔮");
    if (step === "guard" && me.role === "guard") return acted ? done("La protezione è stata registrata.") : targetButtons("Chi vuoi proteggere?", players, null, "guard", "🛡️");
    if (step === "witch" && me.role === "witch") return acted ? done("La scelta della Strega è stata registrata.") : witchControls(d, players);
    if (step === "medium" && me.role === "medium") return acted ? done("Leggi il risultato privato qui sopra.") : mediumControls(players);
    return wait(`Ora sta giocando: ${nightStepLabel(step)}.`);
  }

  if (d.phase === "day") {
    return `<div class="compact-state state-talk"><span>☀️</span><div><b>Discutete</b><small>Accusate e difendetevi.</small></div></div>`;
  }

  if (d.phase === "vote") {
    const votes = d.votes || {};
    if (votes[me.id]) {
      const voted = players.find(p => p.id === votes[me.id]);
      return `<div class="compact-state state-done"><span>🗳️</span><div><b>Votato</b><small>${voted ? voted.name : "Voto registrato"}</small></div></div>${voteProgress(d, players)}`;
    }
    return `${targetButtons("Chi elimini?", players, me.id, "vote", "🗳️")}${voteProgress(d, players)}`;
  }

  if (d.phase === "hunter") {
    return `<div class="compact-state state-wait"><span>🏹</span><div><b>Cacciatore</b><small>Il narratore sceglie il bersaglio.</small></div></div>`;
  }

  return `<div class="compact-state state-wait"><span>…</span><div><b>Attendi</b><small>La partita continua.</small></div></div>`;
}

function renderHostControls(d, players) {
  if (d.phase === "hunter") {
    const hunter = players.find(p => p.id === d.pendingHunterId);
    const targets = alivePlayers(players).filter(p => p.id !== hunter?.id);
    if (hostTargetContext !== "host-hunter") { hostTargetContext = "host-hunter"; hostTargetPage = 0; }
    const paged = paginateList(targets, hostTargetPage, 4); hostTargetPage = paged.page;
    return `<div class="host-hunter-line"><span><b>🏹 ${hunter?.name || "Cacciatore"}</b><small>Scegli bersaglio</small></span><div class="host-targets">${paged.items.map(p => `<button class="secondary" data-host-action="hunter:${p.id}">${p.name}</button>`).join("")}<button class="ghost" data-host-action="hunter:skip">Passa</button></div>${targetPagerHtml(paged.pages, paged.page, "host")}</div>`;
  }
  const buttons = [];
  if (d.phase === "night") { buttons.push(`<button class="secondary" data-host-action="botsAct">🤖 Bot</button>`,`<button class="primary" data-host-action="next">Avanti</button>`,`<button class="secondary" data-host-action="resolveNight">Alba</button>`); }
  else if (d.phase === "day") { buttons.push(`<button class="primary" data-host-action="startVote">Apri voto</button>`,`<button class="secondary" data-host-action="skipVote">Salta</button>`,`<button class="ghost" data-host-action="newNight">Notte</button>`); }
  else if (d.phase === "vote") { const missing = alivePlayers(players).filter(p => !(d.votes || {})[p.id]).length; buttons.push(`<button class="secondary" data-host-action="botsAct">🤖 Bot</button>`,`<button class="primary" data-host-action="resolveVote">Conta${missing ? ` · ${missing}` : ""}</button>`,`<button class="ghost" data-host-action="skipVote">Annulla</button>`); }
  if (!["gameOver","lobby","hunter"].includes(d.phase)) buttons.push(`<button class="ghost auto-mini" data-host-action="toggleAuto">${d.autoMode ? "Auto ON" : "Auto OFF"}</button>`);
  return `<div class="compact-host-buttons">${buttons.join("")}</div>`;
}

function targetButtons(title, players, excludeId, action, icon = "🎯") {
  let targets = alivePlayers(players).filter(p => p.id !== excludeId);
  if (action === "wolf") targets = targets.filter(p => !winsWithWolves(p.role));
  const context = `online-${action}`;
  if (playerTargetContext !== context) { playerTargetContext = context; playerTargetPage = 0; }
  const paged = paginateList(targets, playerTargetPage, 6); playerTargetPage = paged.page;
  return `<div class="mini-action-title"><span>${icon}</span><b>${title}</b></div><div class="compact-target-grid">${paged.items.map(p => `<button class="compact-target" data-online-action="${action}" data-target="${p.id}"><span>${initials(p.name)}</span><b>${p.name}</b></button>`).join("")}</div>${targetPagerHtml(paged.pages, paged.page, "player")}`;
}

function cupidControls(players) { return `${targetButtons("Scegli due innamorati", players, null, "cupidPick", "💘")}<p id="cupidHint" class="compact-hint">${cupidBuffer.length ? "Ora scegli il secondo." : "Scegli il primo."}</p>`; }

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
  const wolfTargets = Object.entries(d.night || {}).filter(([key]) => key.startsWith("wolf_")).map(([, value]) => value);
  const victimId = mostFrequent(wolfTargets);
  const victim = players.find(p => p.id === victimId);
  if (witchView === "kill" && w.kill) {
    return `<div class="witch-back-row"><button class="ghost" data-ui-action="witchBack">‹ Indietro</button><span>☠️ Scegli chi avvelenare</span></div>${targetButtons("Pozione morte", players, null, "witchKill", "☠️")}`;
  }
  return `<div class="mini-action-title"><span>🧪</span><b>${victim ? `Vittima: ${victim.name}` : "Nessuna vittima certa"}</b></div><div class="witch-choice-grid"><button class="witch-choice save-choice" data-online-action="witchSave" data-target="save" ${w.save && victim ? "" : "disabled"}><span>💚</span><b>${w.save ? "Salva" : "Usata"}</b></button><button class="witch-choice kill-choice" data-ui-action="witchKill" ${w.kill ? "" : "disabled"}><span>☠️</span><b>${w.kill ? "Avvelena" : "Usata"}</b></button><button class="witch-choice skip-choice" data-online-action="witchSkip" data-target="skip"><span>⏭️</span><b>Passa</b></button></div>`;
}

function mediumControls(players) {
  const dead = (players || []).filter(p => !p.alive);
  if (!dead.length) return `<div class="compact-state"><span>🕯️</span><b>Nessun morto</b></div><button class="secondary compact-skip" data-online-action="mediumSkip" data-target="skip">Passa</button>`;
  if (playerTargetContext !== "online-medium") { playerTargetContext = "online-medium"; playerTargetPage = 0; }
  const paged = paginateList(dead, playerTargetPage, 6); playerTargetPage = paged.page;
  return `<div class="mini-action-title"><span>🕯️</span><b>Scegli un morto</b></div><div class="compact-target-grid">${paged.items.map(p => `<button class="compact-target" data-online-action="medium" data-target="${p.id}"><span>${initials(p.name)}</span><b>${p.name}</b></button>`).join("")}</div>${targetPagerHtml(paged.pages, paged.page, "player")}`;
}

function voteProgress(d, players) { const alive = alivePlayers(players); const count = alive.filter(p => (d.votes || {})[p.id]).length; const percent = alive.length ? Math.round((count / alive.length) * 100) : 0; return `<div class="compact-vote-progress"><span>${count}/${alive.length}</span><i><b style="width:${percent}%"></b></i></div>`; }

function nightStepLabel(step) {
  return { cupid: "Cupido", wolves: "Lupi", seer: "Veggente", guard: "Guardia", witch: "Strega", medium: "Medium", dawn: "Arriva il giorno" }[step] || step;
}

function currentNightStep(d, players) {
  const available = Array.isArray(d.nightOrder) && d.nightOrder.length
    ? d.nightOrder
    : buildNightOrder(players, !d.loversChosen);
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
  if (!room.data || !room.code || actionBusy) return;
  actionBusy = true;
  document.body.classList.add("action-busy");
  try {
    if (action === "cupidPick") return await handleCupidPick(target);
    if (action === "vote") return await submitVote(target);
    if (["wolf", "seer", "guard", "witchSave", "witchKill", "witchSkip", "medium", "mediumSkip"].includes(action)) {
      return await submitNightAction(action, target);
    }
  } finally {
    playerTargetPage = 0;
    playerTargetContext = "";
    witchView = "choices";
    setTimeout(() => {
      actionBusy = false;
      document.body.classList.remove("action-busy");
    }, 350);
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
      patch.players = players.map(p => p.id === a ? { ...p, lover: b } : p.id === b ? { ...p, lover: a } : p);
      const first = players.find(p => p.id === a);
      const second = players.find(p => p.id === b);
      privateResults[me.id] = {
        type: "cupid",
        firstName: first?.name || "Primo giocatore",
        secondName: second?.name || "Secondo giocatore",
        at: Date.now()
      };
      patch.privateResults = privateResults;
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
  if (action === "toggleAuto") {
    const enable = !room.data.autoMode;
    const duration = phaseDuration(room.data.phaseSeconds || 25, room.data.phase);
    return updateDoc(doc(db, "lupusRooms", room.code), {
      autoMode: enable,
      phaseDeadline: enable && duration > 0 ? Date.now() + duration * 1000 : null,
      updatedAt: serverTimestamp()
    });
  }
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
    const coordinatedWolfTarget = step === "wolves"
      ? randomTarget(players, null, p => !winsWithWolves(p.role))
      : null;
    bots.forEach((bot) => {
      if (step === "cupid" && bot.role === "cupid" && !night[`cupid_${bot.id}`]) {
        const a = randomTarget(players, bot.id), b = randomTarget(players, a?.id);
        if (a && b) { night[`cupid_${bot.id}`] = [a.id, b.id]; patch.players = players.map((p) => p.id === a.id ? { ...p, lover: b.id } : p.id === b.id ? { ...p, lover: a.id } : p); patch.loversChosen = true; }
      }
      if (step === "wolves" && isWolf(bot.role) && !night[`wolf_${bot.id}`]) {
        const t = coordinatedWolfTarget || randomTarget(players, bot.id, p => !winsWithWolves(p.role));
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
    bots.forEach(bot => {
      if (votes[bot.id]) return;
      let target = null;
      if (bot.role === "seer") {
        const knownWolf = Object.values(privateResults).find(r => r?.type === "seer" && r?.result === "LUPO");
        target = knownWolf ? players.find(p => p.name === knownWolf.targetName && p.alive) : null;
      }
      if (!target && winsWithWolves(bot.role)) {
        target = randomTarget(players, bot.id, p => !winsWithWolves(p.role));
      }
      if (!target) target = randomTarget(players, bot.id);
      if (target) votes[bot.id] = target.id;
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

async function advanceNightStep(d = room.data) {
  const ref = doc(db, "lupusRooms", room.code);
  let shouldResolve = false;

  await runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const current = snap.data();
    if (current.phase !== "night" || current.resolvingNight) return;

    const players = current.players || [];
    const step = currentNightStep(current, players);
    if (step === "dawn") {
      shouldResolve = true;
      return;
    }

    const nextStep = (current.step || 0) + 1;
    const seconds = Number(current.phaseSeconds || 20);
    const nextKey = currentNightStep({ ...current, step: nextStep }, players);
    const texts = {
      cupid: narr("cupid", "Scegli due giocatori."),
      wolves: narr("wolves", "Scegliete una vittima."),
      seer: narr("seer", "Scegli chi controllare."),
      guard: narr("guard", "Scegli chi proteggere."),
      witch: narr("witch", "Decidi se usare una pozione."),
      medium: narr("medium", "Scegli un morto da consultare."),
      dawn: narr("dawn")
    };

    tx.update(ref, {
      step: nextStep,
      narration: texts[nextKey] || "Notte.",
      phaseDeadline: seconds > 0 ? Date.now() + phaseDuration(seconds, "night") * 1000 : null,
      updatedAt: serverTimestamp()
    });
  });

  if (shouldResolve) await resolveOnlineNight();
}

async function resolveOnlineNight(d = room.data) {
  const locked = await acquirePhaseLock("resolvingNight", "night");
  if (!locked) return;
  d = locked;

  try {
    const players = d.players || [];
    const night = d.night || {};
    const initialDeadIds = [];

    const wolfTargets = Object.entries(night).filter(([k]) => k.startsWith("wolf_")).map(([, v]) => v);
    const wolfVictim = mostFrequent(wolfTargets);
    const guardTargets = Object.entries(night).filter(([k]) => k.startsWith("guard_")).map(([, v]) => v);
    const protectedId = guardTargets[0] || null;
    const witchActions = Object.entries(night).filter(([k]) => k.startsWith("witch_")).map(([, v]) => v);
    const witchSaved = witchActions.some(a => a?.save);
    const witchKill = witchActions.find(a => a?.kill)?.kill || null;

    if (wolfVictim && wolfVictim !== protectedId && !witchSaved) initialDeadIds.push(wolfVictim);
    if (witchKill) initialDeadIds.push(witchKill);

    const updatedPlayers = applyLoversDeath(players, initialDeadIds);
    const allDeadIds = newlyDeadIds(players, updatedPlayers);
    const deadNames = allDeadIds.map(id => players.find(p => p.id === id)?.name).filter(Boolean);
    const hunter = updatedPlayers.find(p => allDeadIds.includes(p.id) && p.role === "hunter");

    const baseText = deadNames.length
      ? narr("death", deadNames.map(publicDeath).join(" "))
      : narr("safe", "Non è morto nessuno.");
    const seconds = Number(d.phaseSeconds || 20);
    const nightLogText = deadNames.length
      ? `Notte risolta: morti ${deadNames.join(", ")}.`
      : "Notte risolta: nessun morto.";
    const hostLog = [{
      at: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
      text: nightLogText
    }, ...((d.hostLog || []).slice(0, 29))];

    if (hunter) {
      await updateDoc(doc(db, "lupusRooms", room.code), {
        players: updatedPlayers,
        phase: "hunter",
        pendingHunterId: hunter.id,
        narration: `${baseText} ${randomLine("hunter")}`.replace(/\s+/g, " ").trim(),
        hostNote: `${hunter.name} era il Cacciatore: può sparare.`,
        night: {},
        nightOrder: [],
        hostLog,
        resolvingNight: false,
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
        narration: `${baseText} ${randomLine("gameOver")} ${win}`.replace(/\s+/g, " ").trim(),
        night: {},
        nightOrder: [],
        hostLog,
        resolvingNight: false,
        phaseDeadline: null,
        updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(doc(db, "lupusRooms", room.code), {
        players: updatedPlayers,
        phase: "day",
        step: 0,
        dayNumber: (d.dayNumber || 0) + 1,
        narration: `${baseText} ${randomLine("discussion")}`.replace(/\s+/g, " ").trim(),
        night: {},
        nightOrder: [],
        hostLog,
        votes: {},
        resolvingNight: false,
        phaseDeadline: seconds > 0 ? Date.now() + phaseDuration(seconds, "day") * 1000 : null,
        updatedAt: serverTimestamp()
      });
    }
  } catch (err) {
    await updateDoc(doc(db, "lupusRooms", room.code), { resolvingNight: false }).catch(() => {});
    showTechnicalError("Errore risoluzione notte", err);
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
    resolvingVote: false,
    voteRound: (d.voteRound || 0) + 1,
    narration: narr("vote", "Ogni giocatore vivo può votare una sola volta."),
    hostLog,
    phaseDeadline: seconds > 0 ? Date.now() + phaseDuration(seconds, "vote") * 1000 : null,
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
  const players = d.players || [];
  const hostLog = [{ at: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), text: "Nuova notte iniziata." }, ...((d.hostLog || []).slice(0, 29))];
  await updateDoc(doc(db, "lupusRooms", room.code), {
    phase: "night",
    step: 0,
    nightOrder: buildNightOrder(players, !d.loversChosen),
    resolvingNight: false,
    resolvingVote: false,
    nightNumber: (d.nightNumber || 0) + 1,
    votes: {},
    night: {},
    hostNote: "",
    narration: customText || narr("night", "Tutti chiudono gli occhi. Ricomincia la notte."),
    hostLog,
    phaseDeadline: seconds > 0 ? Date.now() + phaseDuration(seconds, "night") * 1000 : null,
    updatedAt: serverTimestamp()
  });
}

async function resolveOnlineVote() {
  const locked = await acquirePhaseLock("resolvingVote", "vote");
  if (!locked) return;
  const d = locked;

  try {
    const players = d.players || [];
    const { targetId, tie } = countVotes(players, d.votes || {});
    const seconds = Number(d.phaseSeconds || 20);

    if (tie || !targetId) {
      const hostLog = [{
        at: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
        text: "Votazione conclusa senza eliminazione."
      }, ...((d.hostLog || []).slice(0, 29))];
      await updateDoc(doc(db, "lupusRooms", room.code), {
        phase: "night",
        step: 0,
        nightOrder: buildNightOrder(players, !d.loversChosen),
        resolvingVote: false,
        resolvingNight: false,
        nightNumber: (d.nightNumber || 0) + 1,
        votes: {},
        night: {},
        hostNote: "",
        narration: `${randomLine("tie")} ${randomLine("night")}`.replace(/\s+/g, " ").trim(),
        hostLog,
        phaseDeadline: seconds > 0 ? Date.now() + phaseDuration(seconds, "night") * 1000 : null,
        updatedAt: serverTimestamp()
      });
      return;
    }

    const target = players.find(p => p.id === targetId);
    const updatedPlayers = applyLoversDeath(players, [targetId]);
    const allDeadIds = newlyDeadIds(players, updatedPlayers);
    const voteLog = [{
      at: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
      text: `${target.name} eliminato al voto.`
    }, ...((d.hostLog || []).slice(0, 29))];

    if (target.role === "jester") {
      const winnerText = "Il Giullare ha vinto facendosi eliminare dal villaggio.";
      await updateDoc(doc(db, "lupusRooms", room.code), {
        players: updatedPlayers,
        phase: "gameOver",
        winnerText,
        narration: `${randomLine("elimination")} ${target.name} è stato eliminato. ${randomLine("gameOver")} ${winnerText}`.replace(/\s+/g, " ").trim(),
        hostLog: voteLog,
        resolvingVote: false,
        phaseDeadline: null,
        updatedAt: serverTimestamp()
      });
      return;
    }

    const hunter = updatedPlayers.find(p => allDeadIds.includes(p.id) && p.role === "hunter");
    if (hunter) {
      await updateDoc(doc(db, "lupusRooms", room.code), {
        players: updatedPlayers,
        phase: "hunter",
        pendingHunterId: hunter.id,
        narration: `${randomLine("elimination")} ${target.name} è stato eliminato. Il ruolo resta segreto. ${randomLine("hunter")}`.replace(/\s+/g, " ").trim(),
        hostNote: `${hunter.name} era il Cacciatore: può sparare.`,
        hostLog: voteLog,
        resolvingVote: false,
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
        narration: `${randomLine("elimination")} ${target.name} è stato eliminato. Il ruolo resta segreto. ${randomLine("gameOver")} ${win}`.replace(/\s+/g, " ").trim(),
        hostLog: voteLog,
        resolvingVote: false,
        phaseDeadline: null,
        updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(doc(db, "lupusRooms", room.code), {
        players: updatedPlayers,
        phase: "night",
        step: 0,
        nightOrder: buildNightOrder(updatedPlayers, !d.loversChosen),
        resolvingVote: false,
        resolvingNight: false,
        nightNumber: (d.nightNumber || 0) + 1,
        votes: {},
        night: {},
        hostNote: "",
        narration: `${randomLine("elimination")} ${target.name} è stato eliminato. Il ruolo resta segreto. ${randomLine("night")}`.replace(/\s+/g, " ").trim(),
        hostLog: voteLog,
        phaseDeadline: seconds > 0 ? Date.now() + phaseDuration(seconds, "night") * 1000 : null,
        updatedAt: serverTimestamp()
      });
    }
  } catch (err) {
    await updateDoc(doc(db, "lupusRooms", room.code), { resolvingVote: false }).catch(() => {});
    showTechnicalError("Errore risoluzione voto", err);
  }
}

async function resolveHunterShot(targetId) {
  const d = room.data;
  if (!d || d.phase !== "hunter") return;
  const beforePlayers = d.players || [];
  let players = beforePlayers;
  let shotText = "Il Cacciatore non ha sparato.";

  if (targetId && targetId !== "skip") {
    players = applyLoversDeath(beforePlayers, [targetId]);
    const target = beforePlayers.find(p => p.id === targetId);
    shotText = `${target?.name || "Un giocatore"} è stato colpito dal Cacciatore.`;
  }

  const win = checkWin(players);
  const hostLog = [{
    at: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
    text: shotText
  }, ...((d.hostLog || []).slice(0, 29))];

  if (win) {
    await updateDoc(doc(db, "lupusRooms", room.code), {
      players,
      phase: "gameOver",
      winnerText: win,
      narration: `${shotText} ${randomLine("gameOver")} ${win}`.replace(/\s+/g, " ").trim(),
      hostLog,
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
      narration: `${shotText} ${randomLine("discussion")}`.replace(/\s+/g, " ").trim(),
      hostLog,
      phaseDeadline: seconds > 0 ? Date.now() + phaseDuration(seconds, "day") * 1000 : null,
      updatedAt: serverTimestamp()
    });
  }
}
