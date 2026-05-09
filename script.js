/* Lupus Narratore Unico - versione online statica, senza login.
   Puoi caricarla su Render come Static Site. Firestore non è necessario per questa modalità. */

const $ = (id) => document.getElementById(id);

const screens = {
  setup: $('setupScreen'),
  reveal: $('revealScreen'),
  game: $('gameScreen'),
};

const ROLE_INFO = {
  'Lupo Mannaro': 'Di notte scegli una vittima insieme agli altri lupi. Di giorno prova a non farti scoprire.',
  'Veggente': 'Ogni notte puoi controllare un giocatore e sapere se è un lupo.',
  'Guardia': 'Ogni notte puoi proteggere un giocatore dall’attacco dei lupi.',
  'Strega': 'Hai una pozione per salvare e una per eliminare. Usale bene.',
  'Cacciatore': 'Quando muori puoi trascinare con te un altro giocatore.',
  'Giullare': 'Vinci se riesci a farti eliminare dal voto del villaggio.',
  'Contadino': 'Non hai poteri speciali. Osserva, ragiona e vota per eliminare i lupi.'
};

let state = {
  players: [],
  revealIndex: 0,
  cardVisible: false,
  phase: 'reveal',
  round: 1,
  stepIndex: 0,
  voiceEnabled: true,
  pending: {
    wolfTarget: null,
    guardTarget: null,
    seerTarget: null,
    witchSave: false,
    witchKill: null,
    dayVote: null,
  },
  witch: { savePotion: true, killPotion: true },
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

function speak(text) {
  if (!state.voiceEnabled || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'it-IT';
  u.rate = 0.95;
  u.pitch = 0.95;
  window.speechSynthesis.speak(u);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parsePlayers() {
  return $('playersInput').value
    .split('\n')
    .map(n => n.trim())
    .filter(Boolean)
    .filter((n, i, arr) => arr.indexOf(n) === i);
}

function numberValue(id) {
  return Math.max(0, parseInt($(id).value || '0', 10));
}

function buildRoles(playerCount) {
  let roles = [];
  roles.push(...Array(numberValue('wolvesCount')).fill('Lupo Mannaro'));
  roles.push(...Array(numberValue('seerCount')).fill('Veggente'));
  roles.push(...Array(numberValue('guardCount')).fill('Guardia'));
  roles.push(...Array(numberValue('witchCount')).fill('Strega'));
  roles.push(...Array(numberValue('hunterCount')).fill('Cacciatore'));
  roles.push(...Array(numberValue('jesterCount')).fill('Giullare'));

  while (roles.length < playerCount) roles.push('Contadino');
  return roles.slice(0, playerCount);
}

function validateSetup() {
  const players = parsePlayers();
  const specialCount = numberValue('wolvesCount') + numberValue('seerCount') + numberValue('guardCount') + numberValue('witchCount') + numberValue('hunterCount') + numberValue('jesterCount');
  const warning = $('roleWarning');
  warning.classList.add('hidden');

  if (players.length < 4) {
    warning.textContent = 'Inserisci almeno 4 giocatori. Meglio ancora 6 o più.';
    warning.classList.remove('hidden');
    return false;
  }
  if (specialCount > players.length) {
    warning.textContent = 'Hai scelto più ruoli dei giocatori disponibili. Riduci qualche ruolo speciale.';
    warning.classList.remove('hidden');
    return false;
  }
  if (numberValue('wolvesCount') < 1) {
    warning.textContent = 'Serve almeno un Lupo Mannaro.';
    warning.classList.remove('hidden');
    return false;
  }
  return true;
}

function startGame() {
  if (!validateSetup()) return;
  const names = parsePlayers();
  const roles = shuffle(buildRoles(names.length));
  state.players = names.map((name, index) => ({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + index),
    name,
    role: roles[index],
    alive: true,
  }));
  state.revealIndex = 0;
  state.cardVisible = false;
  state.round = 1;
  state.stepIndex = 0;
  state.witch = { savePotion: true, killPotion: true };
  resetPending();
  renderReveal();
  showScreen('reveal');
  speak('Partita creata. Passa il telefono al primo giocatore. Ognuno deve guardare solo la propria carta.');
}

function renderReveal() {
  const current = state.players[state.revealIndex];
  $('roleCard').classList.toggle('hidden', !state.cardVisible);
  $('btnReveal').classList.toggle('hidden', state.cardVisible || !current);
  $('btnHideAndNext').classList.toggle('hidden', !state.cardVisible || state.revealIndex >= state.players.length - 1);
  $('btnGoGame').classList.toggle('hidden', !state.cardVisible || state.revealIndex < state.players.length - 1);

  if (!current) return;
  $('revealTitle').textContent = `${current.name}, guarda la tua carta`;
  $('revealInstruction').textContent = state.cardVisible ? 'Memorizza il ruolo, poi nascondi la carta.' : 'Premi mostra carta solo quando stai guardando tu.';
  $('cardPlayer').textContent = current.name;
  $('cardRole').textContent = current.role;
  $('cardDesc').textContent = ROLE_INFO[current.role] || '';
}

function revealCard() {
  state.cardVisible = true;
  renderReveal();
}

function nextReveal() {
  state.cardVisible = false;
  state.revealIndex += 1;
  renderReveal();
}

function beginNight() {
  state.phase = 'night';
  state.stepIndex = 0;
  resetPending();
  showScreen('game');
  renderGameStep();
}

function resetPending() {
  state.pending = { wolfTarget: null, guardTarget: null, seerTarget: null, witchSave: false, witchKill: null, dayVote: null };
}

function alivePlayers() { return state.players.filter(p => p.alive); }
function aliveByRole(role) { return alivePlayers().filter(p => p.role === role); }
function hasAliveRole(role) { return aliveByRole(role).length > 0; }

function getNightSteps() {
  const steps = [
    { key: 'sleep', text: 'È notte. Tutti chiudono gli occhi. Il villaggio si addormenta.' },
  ];
  if (hasAliveRole('Lupo Mannaro')) steps.push({ key: 'wolves', text: 'Lupi Mannari, aprite gli occhi e scegliete una vittima.' });
  if (hasAliveRole('Veggente')) steps.push({ key: 'seer', text: 'Veggente, apri gli occhi e indica una persona da controllare.' });
  if (hasAliveRole('Guardia')) steps.push({ key: 'guard', text: 'Guardia, apri gli occhi e scegli chi proteggere questa notte.' });
  if (hasAliveRole('Strega') && (state.witch.savePotion || state.witch.killPotion)) steps.push({ key: 'witch', text: 'Strega, apri gli occhi. Puoi usare le tue pozioni, se le hai ancora.' });
  steps.push({ key: 'wake', text: 'Il sole sorge. Tutti aprono gli occhi.' });
  steps.push({ key: 'result', text: 'Vediamo cosa è successo durante la notte.' });
  return steps;
}

function getDaySteps() {
  return [
    { key: 'discussion', text: 'È giorno. Il villaggio discute. Accusate, difendetevi e cercate i lupi.' },
    { key: 'vote', text: 'Ora si vota. Scegliete un giocatore da eliminare.' },
    { key: 'dayResult', text: 'Il voto è concluso. Vediamo chi viene eliminato.' },
  ];
}

function currentSteps() { return state.phase === 'night' ? getNightSteps() : getDaySteps(); }

function renderGameStep() {
  const steps = currentSteps();
  const step = steps[state.stepIndex] || steps[steps.length - 1];
  $('phaseTitle').textContent = state.phase === 'night' ? 'Notte' : 'Giorno';
  $('roundBadge').textContent = `Turno ${state.round}`;
  $('narratorText').textContent = step.text;
  $('actionArea').innerHTML = '';
  renderAction(step.key);
  renderPlayersList();
  speak(step.text);
}

function renderAction(key) {
  const area = $('actionArea');
  const alive = alivePlayers();

  if (key === 'wolves') {
    area.innerHTML = '<p class="action-title">Vittima dei lupi</p>';
    renderChoiceButtons(alive.filter(p => p.role !== 'Lupo Mannaro'), state.pending.wolfTarget, (id) => state.pending.wolfTarget = id);
  }

  if (key === 'seer') {
    area.innerHTML = '<p class="action-title">Controllo del Veggente</p>';
    renderChoiceButtons(alive, state.pending.seerTarget, (id) => {
      state.pending.seerTarget = id;
      const target = state.players.find(p => p.id === id);
      setTimeout(() => {
        alert(target.role === 'Lupo Mannaro' ? `${target.name} è un LUPO.` : `${target.name} NON è un lupo.`);
      }, 100);
    });
  }

  if (key === 'guard') {
    area.innerHTML = '<p class="action-title">Protezione della Guardia</p>';
    renderChoiceButtons(alive, state.pending.guardTarget, (id) => state.pending.guardTarget = id);
  }

  if (key === 'witch') {
    const victim = state.players.find(p => p.id === state.pending.wolfTarget);
    area.innerHTML = `<p class="action-title">Pozioni della Strega</p><p class="muted">Vittima indicata dai lupi: ${victim ? victim.name : 'nessuna'}.</p>`;
    if (state.witch.savePotion && victim) {
      const b = document.createElement('button');
      b.textContent = state.pending.witchSave ? 'Pozione salvezza usata su questa vittima' : 'Usa pozione salvezza';
      b.className = state.pending.witchSave ? 'selected' : '';
      b.onclick = () => { state.pending.witchSave = !state.pending.witchSave; renderGameStepNoSpeak(); };
      area.appendChild(b);
    }
    if (state.witch.killPotion) {
      const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'Pozione morte: scegli una persona, oppure lascia vuoto.'; area.appendChild(p);
      renderChoiceButtons(alive, state.pending.witchKill, (id) => state.pending.witchKill = id, true);
    }
  }

  if (key === 'result') {
    const result = resolveNight(false);
    area.innerHTML = `<p class="action-title">Esito notte</p><p class="muted">${result.preview}</p>`;
  }

  if (key === 'discussion') {
    area.innerHTML = '<p class="muted">Consiglio: fate parlare tutti una volta prima di accusare pesantemente qualcuno.</p>';
  }

  if (key === 'vote') {
    area.innerHTML = '<p class="action-title">Voto del villaggio</p>';
    renderChoiceButtons(alive, state.pending.dayVote, (id) => state.pending.dayVote = id);
  }

  if (key === 'dayResult') {
    const voted = state.players.find(p => p.id === state.pending.dayVote);
    area.innerHTML = `<p class="action-title">Eliminazione</p><p class="muted">${voted ? `${voted.name} verrà eliminato dal villaggio.` : 'Nessun giocatore selezionato.'}</p>`;
  }
}

function renderGameStepNoSpeak() {
  const steps = currentSteps();
  const step = steps[state.stepIndex] || steps[steps.length - 1];
  $('actionArea').innerHTML = '';
  renderAction(step.key);
  renderPlayersList();
}

function renderChoiceButtons(players, selectedId, onPick, allowClear = false) {
  const area = $('actionArea');
  if (allowClear) {
    const clear = document.createElement('button');
    clear.textContent = 'Non usare / nessuno';
    clear.className = !selectedId ? 'selected' : '';
    clear.onclick = () => { onPick(null); renderGameStepNoSpeak(); };
    area.appendChild(clear);
  }
  players.forEach(p => {
    const b = document.createElement('button');
    b.textContent = p.name;
    b.className = selectedId === p.id ? 'selected' : '';
    b.onclick = () => { onPick(p.id); renderGameStepNoSpeak(); };
    area.appendChild(b);
  });
}

function resolveNight(apply) {
  let deadIds = [];
  const wolfTarget = state.pending.wolfTarget;
  const guardTarget = state.pending.guardTarget;
  if (wolfTarget && wolfTarget !== guardTarget && !state.pending.witchSave) deadIds.push(wolfTarget);
  if (state.pending.witchKill) deadIds.push(state.pending.witchKill);
  deadIds = [...new Set(deadIds)].filter(Boolean);

  if (apply) {
    if (state.pending.witchSave && state.witch.savePotion) state.witch.savePotion = false;
    if (state.pending.witchKill && state.witch.killPotion) state.witch.killPotion = false;
    deadIds.forEach(id => {
      const p = state.players.find(x => x.id === id);
      if (p) p.alive = false;
    });
  }

  if (!deadIds.length) return { deadIds, preview: 'Nessuno è morto durante la notte.' };
  const names = deadIds.map(id => state.players.find(p => p.id === id)?.name).filter(Boolean).join(', ');
  return { deadIds, preview: `Durante la notte è morto: ${names}.` };
}

function applyDayVote() {
  const target = state.players.find(p => p.id === state.pending.dayVote);
  if (target) target.alive = false;
  return target;
}

function nextStep() {
  const steps = currentSteps();
  const step = steps[state.stepIndex];

  if (step?.key === 'result') {
    const result = resolveNight(true);
    const msg = result.preview;
    $('narratorText').textContent = msg;
    speak(msg);
    renderPlayersList();
    if (checkWin()) return;
    state.phase = 'day';
    state.stepIndex = 0;
    setTimeout(renderGameStep, 700);
    return;
  }

  if (step?.key === 'dayResult') {
    const target = applyDayVote();
    const msg = target ? `${target.name} è stato eliminato. Il suo ruolo era: ${target.role}.` : 'Nessuno viene eliminato dal villaggio.';
    $('narratorText').textContent = msg;
    speak(msg);
    renderPlayersList();
    if (checkWin()) return;
    state.phase = 'night';
    state.round += 1;
    state.stepIndex = 0;
    resetPending();
    setTimeout(renderGameStep, 900);
    return;
  }

  if (state.stepIndex < steps.length - 1) {
    state.stepIndex += 1;
    renderGameStep();
  }
}

function prevStep() {
  if (state.stepIndex > 0) {
    state.stepIndex -= 1;
    renderGameStep();
  }
}

function checkWin() {
  const alive = alivePlayers();
  const wolves = alive.filter(p => p.role === 'Lupo Mannaro').length;
  const others = alive.length - wolves;
  let message = '';
  if (wolves === 0) message = 'Partita finita. Vincono i cittadini. Tutti i lupi sono stati eliminati.';
  else if (wolves >= others) message = 'Partita finita. Vincono i lupi mannari. I lupi sono pari o superiori agli altri giocatori.';
  if (message) {
    $('phaseTitle').textContent = 'Fine partita';
    $('narratorText').textContent = message;
    $('actionArea').innerHTML = '';
    speak(message);
    return true;
  }
  return false;
}

function renderPlayersList() {
  $('playersList').innerHTML = state.players.map(p => `<span class="player-pill ${p.alive ? '' : 'dead'}">${p.name} · ${p.alive ? 'vivo' : p.role}</span>`).join('');
}

$('btnStart').addEventListener('click', startGame);
$('btnReveal').addEventListener('click', revealCard);
$('btnHideAndNext').addEventListener('click', nextReveal);
$('btnGoGame').addEventListener('click', beginNight);
$('btnNextStep').addEventListener('click', nextStep);
$('btnPrevStep').addEventListener('click', prevStep);
$('btnSpeakAgain').addEventListener('click', () => speak($('narratorText').textContent));
$('btnReset').addEventListener('click', () => { if (confirm('Vuoi iniziare una nuova partita?')) location.reload(); });
$('btnVoice').addEventListener('click', () => {
  state.voiceEnabled = !state.voiceEnabled;
  $('btnVoice').textContent = `Voce: ${state.voiceEnabled ? 'ON' : 'OFF'}`;
  if (!state.voiceEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
});
$('btnExample').addEventListener('click', () => {
  $('playersInput').value = ['Marco','Luca','Sara','Giulia','Andrea','Paolo','Marta','Francesco'].join('\n');
});
$('btnClear').addEventListener('click', () => $('playersInput').value = '');
