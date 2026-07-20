'use strict';

const socket = io({ transports: ['websocket', 'polling'] });
const $ = selector => document.querySelector(selector);
const els = {
  landing: $('#landingScreen'), game: $('#gameScreen'),
  createTab: $('#createTab'), joinTab: $('#joinTab'), createForm: $('#createForm'), joinForm: $('#joinForm'),
  createName: $('#createName'), joinName: $('#joinName'), joinCode: $('#joinCode'), entryError: $('#entryError'),
  roomCode: $('#roomCodeLabel'), phaseEyebrow: $('#phaseEyebrow'), phaseTitle: $('#phaseTitle'), phaseText: $('#phaseText'),
  main: $('#mainContent'), shareBtn: $('#shareBtn'), leaveBtn: $('#leaveBtn'), voiceBtn: $('#voiceBtn'),
  rulesBtn: $('#rulesBtn'), rulesDialog: $('#rulesDialog'), closeRulesBtn: $('#closeRulesBtn'), toast: $('#toast')
};

let state = null;
let selectedTarget = null;
let roleVisible = false;
let voiceEnabled = localStorage.getItem('lupusVoice') === '1';
let toastTimer = null;
let wakeLock = null;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function savedSession() {
  try { return JSON.parse(localStorage.getItem('lupusSession') || 'null'); }
  catch { return null; }
}

function saveSession(data) {
  localStorage.setItem('lupusSession', JSON.stringify(data));
}

function clearSession() {
  localStorage.removeItem('lupusSession');
}

function showToast(text) {
  clearTimeout(toastTimer);
  els.toast.textContent = text;
  els.toast.classList.add('show');
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2600);
}

function setEntryMode(mode) {
  const create = mode === 'create';
  els.createTab.classList.toggle('active', create);
  els.joinTab.classList.toggle('active', !create);
  els.createTab.setAttribute('aria-selected', String(create));
  els.joinTab.setAttribute('aria-selected', String(!create));
  els.createForm.classList.toggle('hidden', !create);
  els.joinForm.classList.toggle('hidden', create);
  els.entryError.textContent = '';
}

function openGame() {
  els.landing.classList.add('hidden');
  els.game.classList.remove('hidden');
  els.voiceBtn.classList.remove('hidden');
  requestWakeLock();
}

function openLanding() {
  state = null;
  roleVisible = false;
  selectedTarget = null;
  els.game.classList.add('hidden');
  els.landing.classList.remove('hidden');
  els.voiceBtn.classList.add('hidden');
  document.title = 'Lupus — Il villaggio dorme';
  releaseWakeLock();
}

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator && document.visibilityState === 'visible') wakeLock = await navigator.wakeLock.request('screen');
  } catch {}
}
function releaseWakeLock() {
  try { wakeLock?.release(); } catch {}
  wakeLock = null;
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state) requestWakeLock();
});

function emitAck(event, payload = {}) {
  return new Promise(resolve => {
    socket.timeout(7000).emit(event, payload, (error, response) => {
      if (error) resolve({ ok: false, error: 'Connessione lenta o interrotta.' });
      else resolve(response || { ok: false, error: 'Nessuna risposta dal server.' });
    });
  });
}

function getInitials(name) {
  return String(name).split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();
}

function roleTeamLabel(team) {
  return team === 'wolves' ? 'SQUADRA DEI LUPI' : 'SQUADRA DEL VILLAGGIO';
}

function phaseCopy(s) {
  const copies = {
    lobby: ['LOBBY', 'Il villaggio si sta formando', 'Condividi il codice e attendi che tutti siano pronti.'],
    roleReveal: ['RUOLI ASSEGNATI', 'Non farti scoprire', 'Tieni premuto per vedere il tuo ruolo, poi coprilo di nuovo.'],
    night: [`NOTTE ${s.day}`, 'Tutto il villaggio dorme', s.me?.nightPrompt ? 'È il turno del tuo ruolo. Agisci in silenzio.' : 'Chiudi gli occhi e ascolta la voce del narratore.'],
    dayDiscussion: [`GIORNO ${s.day}`, 'Il villaggio si sveglia', s.publicMessage || 'Discutete e cercate i lupi.'],
    voting: [`GIORNO ${s.day}`, 'Il villaggio decide', 'Ogni giocatore vivo deve esprimere il proprio voto.'],
    dayResult: [`GIORNO ${s.day}`, 'Il verdetto è arrivato', s.publicMessage || 'La votazione è conclusa.'],
    ended: ['PARTITA TERMINATA', s.winner === 'wolves' ? 'Il branco ha vinto' : 'Il villaggio ha vinto', s.publicMessage]
  };
  return copies[s.phase] || ['LUPUS', 'Partita in corso', s.publicMessage || ''];
}

function playerList(players, options = {}) {
  return `<div class="player-list">${players.map(p => {
    const label = !p.alive ? 'Eliminato' : p.ready ? 'Pronto' : p.connected ? 'In attesa' : 'Disconnesso';
    const statusClass = !p.alive ? 'dead' : p.ready ? 'ready' : '';
    const host = p.isHostPlayer ? ' · dispositivo base' : '';
    const role = p.role ? ` · ${escapeHtml(p.role)}` : '';
    return `<div class="player-row">
      <div class="avatar">${escapeHtml(getInitials(p.name))}</div>
      <div class="player-main"><strong>${escapeHtml(p.name)}</strong><small>${label}${host}${role}</small></div>
      ${options.kick && !p.isHostPlayer ? `<button class="kick-btn" data-kick="${p.id}">Rimuovi</button>` : `<span class="status-dot ${statusClass}"></span>`}
    </div>`;
  }).join('')}</div>`;
}

function privateMessages(s) {
  const messages = s.me?.privateMessages || [];
  if (!messages.length) return '';
  return `<section class="panel">
    <div class="panel-title"><div><h3>Informazioni private</h3><p>Visibili soltanto sul tuo telefono.</p></div><span class="chip">SEGRETO</span></div>
    <div class="message-list">${messages.slice().reverse().map(m => `<article class="private-message"><strong>${escapeHtml(m.title)}</strong><p>${escapeHtml(m.text)}</p></article>`).join('')}</div>
  </section>`;
}

function renderLobby(s) {
  const meReady = s.me?.id ? s.players.find(p => p.id === s.me.id)?.ready : true;
  const readyCount = s.players.filter(p => p.ready).length;
  const hostControls = s.isHost ? `<section class="panel">
    <div class="panel-title"><div><h3>Controllo partita</h3><p>Servono almeno ${s.minPlayers} giocatori e tutti devono essere pronti.</p></div><span class="chip">BASE</span></div>
    <div class="notice info">${s.hostPlays ? 'Anche tu giocherai: il server non mostrerà mai i ruoli degli altri.' : 'Questo dispositivo farà soltanto da narratore e controller.'}</div>
    <div class="button-stack"><button id="startGameBtn" class="primary-btn" ${s.canStart ? '' : 'disabled'}>Assegna i ruoli</button></div>
  </section>` : '';

  const readyButton = s.me ? `<button id="readyBtn" class="${meReady ? 'secondary-btn' : 'primary-btn'}">${meReady ? 'Non sono più pronto' : 'Sono pronto'}</button>` : '';
  return `<section class="panel">
      <div class="panel-title"><div><h3>Giocatori</h3><p>${readyCount} su ${s.players.length} pronti</p></div><span class="chip ${s.players.length >= s.minPlayers ? 'good' : ''}">${s.players.length} GIOCATORI</span></div>
      ${playerList(s.players, { kick: s.isHost })}
      ${readyButton ? `<div class="button-stack">${readyButton}</div>` : ''}
    </section>${hostControls}`;
}

function renderRoleReveal(s) {
  const role = s.me?.role;
  const roleCard = role ? `<section class="panel role-cover" id="roleCover">
    <div class="role-hidden ${roleVisible ? 'hidden' : ''}">
      <div class="lock">🔒</div><h3>Il tuo ruolo è coperto</h3><p>Appoggia e tieni premuto il pulsante. Solleva il dito per nasconderlo.</p>
      <button id="holdRoleBtn" class="hold-btn" type="button">TIENI PREMUTO PER VEDERE</button>
    </div>
    <div class="role-visible ${roleVisible ? '' : 'hidden'}">
      <div class="role-emoji">${role.emoji}</div><h3>${escapeHtml(role.name)}</h3><span class="team">${roleTeamLabel(role.team)}</span>
      <p>${escapeHtml(role.short)}</p>
      ${role.allies?.length ? `<div class="role-rules"><strong>Gli altri lupi:</strong> ${escapeHtml(role.allies.join(', '))}</div>` : ''}
      <div class="role-rules">${escapeHtml(role.rules)}</div>
    </div>
  </section>` : `<section class="panel center-copy"><div class="phase-orb">🎙️</div><h3>Sei il narratore</h3><p>Non partecipi come giocatore e non riceverai nessun ruolo.</p></section>`;

  const controls = s.isHost ? `<section class="panel"><div class="panel-title"><div><h3>Quando tutti hanno controllato</h3><p>Fai chiudere gli occhi e avvia la prima notte.</p></div><span class="chip">BASE</span></div><button id="beginNightBtn" class="primary-btn">Inizia la prima notte</button></section>` : '';
  return roleCard + controls;
}

function targetButtons(targets, selected) {
  return `<div class="action-grid">${targets.map(t => `<button class="target-btn ${selected === t.id ? 'selected' : ''}" data-target="${t.id}" type="button">
    <span class="avatar">${escapeHtml(getInitials(t.name))}</span><strong>${escapeHtml(t.name)}</strong><span class="check">✓</span>
  </button>`).join('')}</div>`;
}

function renderNightPrompt(prompt) {
  if (!prompt) return `<section class="panel center-copy"><div class="phase-orb">🌙</div><h3>Dormi in silenzio</h3><p>Il tuo ruolo non deve agire in questo momento. Tieni gli occhi chiusi e non toccare lo schermo.</p></section>`;
  if (prompt.submitted) return `<section class="panel center-copy"><div class="phase-orb">✓</div><h3>Azione ricevuta</h3><p>Copri il telefono e attendi il prossimo annuncio del narratore.</p></section>`;

  if (prompt.type === 'witch') {
    return `<section class="panel">
      <div class="panel-title"><div><h3>${escapeHtml(prompt.title)}</h3><p>${escapeHtml(prompt.text)}</p></div><span class="chip">SEGRETO</span></div>
      <div class="switch-options">
        <label class="option-toggle"><span>Usa la pozione di salvezza</span><input id="witchSave" type="checkbox" ${prompt.canSave ? '' : 'disabled'}></label>
      </div>
      <div class="panel-title top-gap"><div><h3>Pozione di veleno</h3><p>${prompt.canPoison ? 'Puoi scegliere una persona oppure non usarla.' : 'La pozione è già stata utilizzata.'}</p></div></div>
      ${prompt.canPoison ? targetButtons(prompt.poisonTargets, selectedTarget) : ''}
      <div class="button-stack"><button id="submitWitchBtn" class="primary-btn">Conferma le pozioni</button></div>
    </section>`;
  }

  return `<section class="panel">
    <div class="panel-title"><div><h3>${escapeHtml(prompt.title)}</h3><p>${escapeHtml(prompt.text)}</p></div><span class="chip">SEGRETO</span></div>
    ${targetButtons(prompt.targets, selectedTarget)}
    <div class="button-stack"><button id="submitNightBtn" class="primary-btn" ${selectedTarget ? '' : 'disabled'}>Conferma scelta</button></div>
  </section>`;
}

function renderNight(s) {
  const progress = s.requiredNightActions;
  const hostPanel = s.isHost ? `<section class="panel">
    <div class="panel-title"><div><h3>Regia automatica</h3><p>L’host non vede chi sta agendo né quale bersaglio ha scelto.</p></div><span class="chip">BASE</span></div>
    ${progress ? `<div class="notice info">Azioni ricevute: ${progress.submitted} di ${progress.required}.</div><progress class="progress-line" max="${progress.required || 1}" value="${progress.submitted}"></progress>` : ''}
    <div class="button-stack"><button id="forceNightBtn" class="secondary-btn">Salta questo turno</button></div>
  </section>` : '';
  const playerPanel = s.me?.alive === false
    ? `<section class="panel center-copy"><div class="phase-orb">👻</div><h3>Sei fuori dalla partita</h3><p>Segui in silenzio e non dare suggerimenti ai giocatori ancora vivi.</p></section>`
    : renderNightPrompt(s.me?.nightPrompt);
  return playerPanel + privateMessages(s) + hostPanel;
}

function renderDayDiscussion(s) {
  const deaths = s.lastNightDeaths || [];
  const summary = deaths.length ? `<div class="notice danger">Questa notte sono stati eliminati: <strong>${escapeHtml(deaths.join(', '))}</strong>.</div>` : `<div class="notice">Nessuna vittima durante la notte.</div>`;
  const host = s.isHost ? `<section class="panel"><div class="panel-title"><div><h3>Quando la discussione è finita</h3><p>Apri la votazione sui telefoni dei giocatori vivi.</p></div><span class="chip">BASE</span></div><button id="startVotingBtn" class="primary-btn">Avvia la votazione</button></section>` : '';
  return `<section class="panel">${summary}<div class="panel-title top-gap"><div><h3>Giocatori ancora in partita</h3><p>Osservate accuse, difese e contraddizioni.</p></div></div>${playerList(s.players.filter(p => p.alive))}</section>${privateMessages(s)}${host}`;
}

function renderVoting(s) {
  let votePanel;
  if (!s.me) votePanel = `<section class="panel center-copy"><div class="phase-orb">🗳️</div><h3>Votazione in corso</h3><p>Il dispositivo base attende i voti senza poterli vedere.</p></section>`;
  else if (!s.me.alive) votePanel = `<section class="panel center-copy"><div class="phase-orb">👻</div><h3>Non puoi votare</h3><p>I giocatori eliminati devono restare in silenzio.</p></section>`;
  else if (s.me.hasVoted) votePanel = `<section class="panel center-copy"><div class="phase-orb">✓</div><h3>Voto ricevuto</h3><p>La scelta resta segreta fino alla conclusione della votazione.</p></section>`;
  else votePanel = `<section class="panel"><div class="panel-title"><div><h3>Chi vuoi eliminare?</h3><p>Non puoi votare te stesso. La scelta non può essere cambiata dopo la conferma.</p></div><span class="chip">SEGRETO</span></div>${targetButtons(s.votingTargets, selectedTarget)}<div class="button-stack"><button id="submitVoteBtn" class="primary-btn" ${selectedTarget ? '' : 'disabled'}>Conferma voto</button></div></section>`;

  const host = s.isHost ? `<section class="panel"><div class="panel-title"><div><h3>Controllo votazione</h3><p>Il risultato si calcola da solo quando tutti i vivi hanno votato.</p></div><span class="chip">BASE</span></div><button id="forceVoteBtn" class="secondary-btn">Chiudi con i voti ricevuti</button></section>` : '';
  return votePanel + host;
}

function renderDayResult(s) {
  const host = s.isHost && s.canStartNextNight ? `<section class="panel"><div class="panel-title"><div><h3>La partita continua</h3><p>Fai richiudere gli occhi a tutti.</p></div><span class="chip">BASE</span></div><button id="nextNightBtn" class="primary-btn">Inizia la notte successiva</button></section>` : '';
  return `<section class="panel center-copy"><div class="phase-orb">⚖️</div><h3>${escapeHtml(s.publicMessage)}</h3><p>Il risultato è stato registrato. I giocatori eliminati non possono più intervenire.</p></section>${privateMessages(s)}${host}`;
}

function renderEnded(s) {
  return `<section class="panel center-copy"><div class="phase-orb">${s.winner === 'wolves' ? '🐺' : '🏘️'}</div><h3>${s.winner === 'wolves' ? 'Vittoria dei lupi' : 'Vittoria del villaggio'}</h3><p>${escapeHtml(s.publicMessage)}</p></section>
  <section class="panel"><div class="panel-title"><div><h3>Tutti i ruoli</h3><p>La segretezza termina insieme alla partita.</p></div></div><div class="role-reveal-list">${s.players.map(p => `<article class="role-reveal-item"><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.role || 'Ruolo sconosciuto')}</small></article>`).join('')}</div></section>
  ${s.isHost ? `<section class="panel"><button id="restartBtn" class="primary-btn">Gioca un’altra partita</button></section>` : ''}`;
}

function render() {
  if (!state) return;
  openGame();
  els.roomCode.textContent = state.code;
  const [eyebrow, title, text] = phaseCopy(state);
  els.phaseEyebrow.textContent = eyebrow;
  els.phaseTitle.textContent = title;
  els.phaseText.textContent = text;
  els.voiceBtn.textContent = voiceEnabled ? '🔊' : '🔇';
  els.voiceBtn.setAttribute('aria-label', voiceEnabled ? 'Disattiva narratore' : 'Attiva narratore');
  document.title = `${state.code} · Lupus`;

  const renderers = {
    lobby: renderLobby, roleReveal: renderRoleReveal, night: renderNight,
    dayDiscussion: renderDayDiscussion, voting: renderVoting, dayResult: renderDayResult, ended: renderEnded
  };
  els.main.innerHTML = (renderers[state.phase] || renderDayDiscussion)(state);
  bindDynamicEvents();
}

function bindDynamicEvents() {
  $('#readyBtn')?.addEventListener('click', async () => {
    const me = state.players.find(p => p.id === state.me.id);
    const res = await emitAck('setReady', !me.ready);
    if (!res.ok) showToast(res.error || 'Operazione non riuscita.');
  });
  $('#startGameBtn')?.addEventListener('click', async () => {
    const res = await emitAck('startGame'); if (!res.ok) showToast(res.error || 'Non posso iniziare.');
  });
  $('#beginNightBtn')?.addEventListener('click', async () => {
    roleVisible = false; const res = await emitAck('beginFirstNight'); if (!res.ok) showToast('Non posso iniziare la notte.');
  });
  $('#startVotingBtn')?.addEventListener('click', async () => {
    const res = await emitAck('startVoting'); if (!res.ok) showToast('Non posso aprire la votazione.');
  });
  $('#nextNightBtn')?.addEventListener('click', async () => {
    selectedTarget = null; const res = await emitAck('startNextNight'); if (!res.ok) showToast('Non posso iniziare la notte.');
  });
  $('#forceNightBtn')?.addEventListener('click', async () => {
    const res = await emitAck('forceAdvanceNight'); if (!res.ok) showToast('Turno non saltato.');
  });
  $('#forceVoteBtn')?.addEventListener('click', async () => {
    const res = await emitAck('forceResolveVote'); if (!res.ok) showToast('Votazione non chiusa.');
  });
  $('#restartBtn')?.addEventListener('click', async () => {
    selectedTarget = null; roleVisible = false; const res = await emitAck('restartGame'); if (!res.ok) showToast('Riavvio non riuscito.');
  });

  document.querySelectorAll('[data-kick]').forEach(btn => btn.addEventListener('click', async () => {
    const res = await emitAck('kickPlayer', { playerId: btn.dataset.kick }); if (!res.ok) showToast('Non posso rimuovere il giocatore.');
  }));
  document.querySelectorAll('[data-target]').forEach(btn => btn.addEventListener('click', () => {
    selectedTarget = btn.dataset.target;
    render();
  }));

  $('#submitNightBtn')?.addEventListener('click', async () => {
    const res = await emitAck('submitNightAction', { targetId: selectedTarget });
    if (!res.ok) showToast(res.error || 'Scelta non inviata.'); else selectedTarget = null;
  });
  $('#submitWitchBtn')?.addEventListener('click', async () => {
    const res = await emitAck('submitNightAction', { save: Boolean($('#witchSave')?.checked), poisonTarget: selectedTarget });
    if (!res.ok) showToast(res.error || 'Scelta non inviata.'); else selectedTarget = null;
  });
  $('#submitVoteBtn')?.addEventListener('click', async () => {
    const res = await emitAck('submitVote', { targetId: selectedTarget });
    if (!res.ok) showToast(res.error || 'Voto non inviato.'); else selectedTarget = null;
  });

  const hold = $('#holdRoleBtn');
  const cover = $('#roleCover');
  if (hold && cover) {
    const hiddenSide = cover.querySelector('.role-hidden');
    const visibleSide = cover.querySelector('.role-visible');
    const hideRole = () => {
      roleVisible = false;
      hiddenSide?.classList.remove('hidden');
      visibleSide?.classList.add('hidden');
      window.removeEventListener('pointerup', hideRole);
      window.removeEventListener('pointercancel', hideRole);
      window.removeEventListener('blur', hideRole);
    };
    hold.addEventListener('pointerdown', event => {
      event.preventDefault();
      roleVisible = true;
      hiddenSide?.classList.add('hidden');
      visibleSide?.classList.remove('hidden');
      try { hold.setPointerCapture(event.pointerId); } catch {}
      window.addEventListener('pointerup', hideRole, { once: true });
      window.addEventListener('pointercancel', hideRole, { once: true });
      window.addEventListener('blur', hideRole, { once: true });
    });
  }
}

async function createRoom(event) {
  event.preventDefault();
  els.entryError.textContent = '';
  const res = await emitAck('createRoom', {
    name: els.createName.value,
    settings: {
      hostPlays: $('#hostPlays').checked,
      enableSeer: $('#enableSeer').checked,
      enableGuard: $('#enableGuard').checked,
      enableWitch: $('#enableWitch').checked,
      enableMedium: $('#enableMedium').checked,
      revealRoleOnDeath: $('#revealRole').checked
    }
  });
  if (!res.ok) return void (els.entryError.textContent = res.error || 'Creazione non riuscita.');
  saveSession({ code: res.code, hostToken: res.hostToken, playerToken: res.playerToken });
  history.replaceState(null, '', `/?room=${res.code}`);
}

async function joinRoom(event) {
  event.preventDefault();
  els.entryError.textContent = '';
  const code = els.joinCode.value.trim().toUpperCase();
  const res = await emitAck('joinRoom', { code, name: els.joinName.value });
  if (!res.ok) return void (els.entryError.textContent = res.error || 'Accesso non riuscito.');
  saveSession({ code: res.code, playerToken: res.playerToken, hostToken: null });
  history.replaceState(null, '', `/?room=${res.code}`);
}

function speak(text) {
  if (!voiceEnabled || !state?.isHost || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'it-IT';
  utterance.rate = 0.92;
  utterance.pitch = 0.88;
  utterance.volume = 1;
  const voices = speechSynthesis.getVoices();
  const italian = voices.find(v => v.lang?.toLowerCase().startsWith('it'));
  if (italian) utterance.voice = italian;
  window.speechSynthesis.speak(utterance);
}

els.createTab.addEventListener('click', () => setEntryMode('create'));
els.joinTab.addEventListener('click', () => setEntryMode('join'));
els.createForm.addEventListener('submit', createRoom);
els.joinForm.addEventListener('submit', joinRoom);
els.joinCode.addEventListener('input', () => { els.joinCode.value = els.joinCode.value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 5); });
els.rulesBtn.addEventListener('click', () => els.rulesDialog.showModal());
els.closeRulesBtn.addEventListener('click', () => els.rulesDialog.close());
els.rulesDialog.addEventListener('click', event => { if (event.target === els.rulesDialog) els.rulesDialog.close(); });
els.voiceBtn.addEventListener('click', () => {
  voiceEnabled = !voiceEnabled;
  localStorage.setItem('lupusVoice', voiceEnabled ? '1' : '0');
  els.voiceBtn.textContent = voiceEnabled ? '🔊' : '🔇';
  if (voiceEnabled) {
    const test = new SpeechSynthesisUtterance('Narratore attivato.'); test.lang = 'it-IT'; speechSynthesis.speak(test);
  } else if ('speechSynthesis' in window) speechSynthesis.cancel();
});
els.shareBtn.addEventListener('click', async () => {
  const url = `${location.origin}/?room=${state.code}`;
  const text = `Entra nella mia partita di Lupus. Codice: ${state.code}`;
  try {
    if (navigator.share) await navigator.share({ title: 'Partita di Lupus', text, url });
    else { await navigator.clipboard.writeText(`${text}\n${url}`); showToast('Invito copiato.'); }
  } catch {}
});
els.leaveBtn.addEventListener('click', () => {
  clearSession();
  history.replaceState(null, '', '/');
  location.reload();
});

socket.on('roomState', next => {
  const phaseChanged = state?.phase !== next.phase || state?.nightStep !== next.nightStep;
  state = next;
  if (phaseChanged) { selectedTarget = null; roleVisible = false; }
  render();
});
socket.on('narration', data => speak(data.text));
socket.on('kicked', () => {
  clearSession();
  alert('Sei stato rimosso dalla stanza.');
  location.href = '/';
});
socket.on('connect_error', () => showToast('Connessione al server non disponibile.'));
socket.on('disconnect', () => { if (state) showToast('Connessione persa. Tentativo di riconnessione…'); });

socket.on('connect', async () => {
  const session = savedSession();
  if (session) {
    const res = await emitAck('resumeRoom', session);
    if (!res.ok) {
      clearSession();
      openLanding();
      const queryCode = new URLSearchParams(location.search).get('room');
      if (queryCode) { setEntryMode('join'); els.joinCode.value = queryCode.toUpperCase().slice(0, 5); }
    }
  } else {
    const queryCode = new URLSearchParams(location.search).get('room');
    if (queryCode) { setEntryMode('join'); els.joinCode.value = queryCode.toUpperCase().slice(0, 5); }
  }
});

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
