'use strict';

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');

const PORT = Number(process.env.PORT || 3000);
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: false },
  pingTimeout: 20000,
  pingInterval: 25000
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'"]
    }
  }
}));
app.use(compression());
app.use(express.json({ limit: '20kb' }));

// I file dell'app restano nella cartella principale del vecchio progetto.
const PUBLIC_FILES = new Set([
  'style.css', 'script.js', 'manifest.webmanifest', 'sw.js',
  'icon.svg', 'icon-192.png', 'icon-512.png'
]);
app.get('/api/health', (_req, res) => res.json({ ok: true, rooms: rooms.size }));
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/:file', (req, res, next) => {
  if (!PUBLIC_FILES.has(req.params.file)) return next();
  return res.sendFile(path.join(__dirname, req.params.file));
});
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const rooms = new Map();

const ROLE_DEFS = {
  lupo: {
    name: 'Lupo Mannaro', emoji: '🐺', team: 'wolves',
    short: 'Ogni notte scegli una vittima insieme agli altri lupi.',
    rules: 'Conosci gli altri lupi. Di notte votate una persona non lupo. Vince il branco quando i lupi vivi sono almeno quanti tutti gli altri giocatori vivi.'
  },
  contadino: {
    name: 'Contadino', emoji: '🧑‍🌾', team: 'village',
    short: 'Non hai poteri notturni: osserva, discuti e vota bene.',
    rules: 'Aiuta il villaggio a individuare ed eliminare tutti i lupi. Non ricevi informazioni private oltre al tuo ruolo.'
  },
  veggente: {
    name: 'Veggente', emoji: '🔮', team: 'village',
    short: 'Ogni notte scopri se un giocatore appartiene al branco.',
    rules: 'Scegli un giocatore vivo diverso da te. Il responso indica se appartiene alla squadra dei lupi, senza rivelare il ruolo esatto.'
  },
  guardia: {
    name: 'Guardia', emoji: '🛡️', team: 'village',
    short: 'Ogni notte proteggi una persona dall’attacco dei lupi.',
    rules: 'Puoi proteggere anche te stesso, ma non la stessa persona in due notti consecutive. La protezione ferma soltanto l’attacco dei lupi.'
  },
  strega: {
    name: 'Strega', emoji: '🧪', team: 'village',
    short: 'Hai una pozione di salvezza e una di veleno per partita.',
    rules: 'Durante il tuo turno vedi chi è stato attaccato. Puoi usare una sola volta la pozione di salvezza e una sola volta quella di veleno. Puoi usare entrambe nella stessa notte.'
  },
  medium: {
    name: 'Medium', emoji: '🕯️', team: 'village',
    short: 'Scopri in privato la fazione di chi viene eliminato dal voto.',
    rules: 'Dopo ogni eliminazione diurna ricevi un messaggio privato che indica se la persona eliminata apparteneva ai lupi.'
  }
};

const NIGHT_LINES = {
  wolves: [
    'Il villaggio dorme. I lupi aprono gli occhi e scelgono la loro preda.',
    'La luna è alta. Soltanto il branco resta sveglio: scegliete chi attaccare.',
    'Nella notte si sentono passi tra le case. Lupi, indicate la vostra vittima.'
  ],
  guardia: [
    'La guardia si sveglia in silenzio e decide chi proteggere.',
    'Qualcuno veglia sul villaggio. Guardia, scegli la persona da difendere.',
    'Uno scudo si alza nel buio. Guardia, indica chi sarà al sicuro.'
  ],
  veggente: [
    'La veggente apre gli occhi e scruta l’anima di un abitante.',
    'Le carte parlano. Veggente, scegli chi osservare questa notte.',
    'Una visione attraversa il buio. Veggente, indica un giocatore.'
  ],
  strega: [
    'La strega apre il suo scrigno: questa notte userà una pozione?',
    'Tra fiale e vapori, la strega decide se intervenire.',
    'La strega conosce il bersaglio del branco. È il momento di scegliere.'
  ],
  dawn: [
    'La notte è finita. Tutti si svegliano e il villaggio conta i presenti.',
    'Il sole sorge. Aprite gli occhi: la notte ha lasciato il suo segno.',
    'Un gallo canta decisamente troppo presto. Il villaggio si sveglia.'
  ],
  vote: [
    'È il momento del verdetto. Ogni giocatore vivo esprime il proprio voto.',
    'Le accuse sono finite. Adesso il villaggio deve scegliere.',
    'Il silenzio cala sulla piazza: votate chi ritenete essere un lupo.'
  ]
};

function randomId(bytes = 18) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function createRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 30; attempt += 1) {
    let code = '';
    for (let i = 0; i < 5; i += 1) code += chars[crypto.randomInt(chars.length)];
    if (!rooms.has(code)) return code;
  }
  return randomId(4).slice(0, 5).toUpperCase();
}

function cleanName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 24);
}

function defaultSettings(input = {}) {
  return {
    hostPlays: input.hostPlays !== false,
    revealRoleOnDeath: Boolean(input.revealRoleOnDeath),
    enableGuard: input.enableGuard !== false,
    enableSeer: input.enableSeer !== false,
    enableWitch: input.enableWitch !== false,
    enableMedium: input.enableMedium !== false
  };
}

function makePlayer(name, socket, isHostPlayer = false) {
  return {
    id: randomId(9),
    token: randomId(18),
    socketId: socket.id,
    name,
    connected: true,
    ready: isHostPlayer,
    isHostPlayer,
    role: null,
    alive: true,
    vote: null,
    hasActed: false,
    privateMessages: [],
    lastProtected: null,
    witch: { save: true, poison: true }
  };
}

function publicPlayer(p, room) {
  const base = {
    id: p.id,
    name: p.name,
    alive: p.alive,
    connected: p.connected,
    ready: p.ready,
    isHostPlayer: p.isHostPlayer
  };
  if (room.phase === 'ended' || (room.settings.revealRoleOnDeath && !p.alive)) {
    base.role = p.role ? ROLE_DEFS[p.role].name : null;
    base.roleKey = p.role;
  }
  return base;
}

function roleForClient(player, room) {
  if (!player || !player.role) return null;
  const def = ROLE_DEFS[player.role];
  const role = { key: player.role, ...def };
  if (player.role === 'lupo') {
    role.allies = [...room.players.values()]
      .filter(p => p.id !== player.id && p.role === 'lupo')
      .map(p => p.name);
  }
  return role;
}

function getNightPrompt(room, player) {
  if (room.phase !== 'night' || !player?.alive) return null;
  const step = room.nightStep;
  if (step === 'wolves' && player.role === 'lupo') {
    return {
      type: 'target', title: 'Scelta del branco',
      text: 'Scegliete una vittima. In caso di parità tra bersagli, l’app ne sorteggerà uno tra i più votati.',
      targets: alivePlayers(room).filter(p => p.role !== 'lupo').map(p => ({ id: p.id, name: p.name })),
      submitted: Boolean(room.nightActions.wolves[player.id])
    };
  }
  if (step === 'guardia' && player.role === 'guardia') {
    return {
      type: 'target', title: 'Proteggi qualcuno',
      text: 'La stessa persona non può essere protetta in due notti consecutive.',
      targets: alivePlayers(room).filter(p => p.id !== player.lastProtected).map(p => ({ id: p.id, name: p.name })),
      submitted: Boolean(room.nightActions.guardia[player.id])
    };
  }
  if (step === 'veggente' && player.role === 'veggente') {
    return {
      type: 'target', title: 'Interroga le stelle',
      text: 'Scoprirai soltanto se il bersaglio appartiene al branco.',
      targets: alivePlayers(room).filter(p => p.id !== player.id).map(p => ({ id: p.id, name: p.name })),
      submitted: Boolean(room.nightActions.veggente[player.id])
    };
  }
  if (step === 'strega' && player.role === 'strega') {
    const victim = room.pendingWolfTarget ? room.players.get(room.pendingWolfTarget) : null;
    return {
      type: 'witch', title: 'Pozioni della strega',
      text: victim ? `${victim.name} è stato attaccato dal branco.` : 'Questa notte il branco non ha una vittima.',
      attacked: victim ? { id: victim.id, name: victim.name } : null,
      canSave: player.witch.save && Boolean(victim),
      canPoison: player.witch.poison,
      poisonTargets: alivePlayers(room).filter(p => p.id !== player.id).map(p => ({ id: p.id, name: p.name })),
      submitted: Boolean(room.nightActions.strega[player.id])
    };
  }
  return null;
}

function roomSnapshot(room, viewerPlayer, hostToken) {
  const isHost = hostToken && hostToken === room.hostToken;
  const me = viewerPlayer ? {
    id: viewerPlayer.id,
    name: viewerPlayer.name,
    alive: viewerPlayer.alive,
    role: roleForClient(viewerPlayer, room),
    privateMessages: viewerPlayer.privateMessages.slice(-8),
    nightPrompt: getNightPrompt(room, viewerPlayer),
    hasVoted: room.phase === 'voting' && Boolean(viewerPlayer.vote)
  } : null;

  return {
    code: room.code,
    phase: room.phase,
    day: room.day,
    nightStep: room.nightStep,
    players: [...room.players.values()].map(p => publicPlayer(p, room)),
    hostPlays: room.settings.hostPlays,
    settings: room.settings,
    isHost,
    me,
    minPlayers: 5,
    winner: room.winner,
    publicMessage: room.publicMessage,
    lastNightDeaths: room.lastNightDeaths.map(id => room.players.get(id)?.name).filter(Boolean),
    lastEliminated: room.lastEliminated ? room.players.get(room.lastEliminated)?.name : null,
    votingTargets: room.phase === 'voting' && viewerPlayer?.alive
      ? alivePlayers(room).filter(p => p.id !== viewerPlayer.id).map(p => ({ id: p.id, name: p.name }))
      : [],
    allReady: [...room.players.values()].every(p => p.ready),
    requiredNightActions: isHost && room.phase === 'night' ? nightProgress(room) : null,
    canStart: isHost && room.phase === 'lobby' && room.players.size >= 5 && [...room.players.values()].every(p => p.ready),
    canStartVoting: isHost && room.phase === 'dayDiscussion',
    canStartNextNight: isHost && room.phase === 'dayResult' && !room.winner,
    log: room.publicLog.slice(-10)
  };
}

function emitRoom(room) {
  for (const socket of io.sockets.sockets.values()) {
    if (socket.data.roomCode !== room.code) continue;
    const player = socket.data.playerId ? room.players.get(socket.data.playerId) : null;
    socket.emit('roomState', roomSnapshot(room, player, socket.data.hostToken));
  }
}

function narrate(room, key, customText = null) {
  const lines = NIGHT_LINES[key] || [];
  const text = customText || (lines.length ? lines[crypto.randomInt(lines.length)] : '');
  if (!text) return;
  io.to(room.code).emit('narration', { key, text, at: Date.now() });
}

function alivePlayers(room) {
  return [...room.players.values()].filter(p => p.alive);
}

function getPlayerBySocket(room, socket) {
  return socket.data.playerId ? room.players.get(socket.data.playerId) : null;
}

function requireHost(socket, room) {
  return Boolean(room && socket.data.hostToken && socket.data.hostToken === room.hostToken);
}

function assignRoles(room) {
  const count = room.players.size;
  const roles = [];
  const wolves = Math.max(1, Math.floor(count / 4));
  for (let i = 0; i < wolves; i += 1) roles.push('lupo');

  const s = room.settings;
  if (s.enableSeer && count >= 5) roles.push('veggente');
  if (s.enableGuard && count >= 6) roles.push('guardia');
  if (s.enableMedium && count >= 7) roles.push('medium');
  if (s.enableWitch && count >= 8) roles.push('strega');
  while (roles.length < count) roles.push('contadino');
  while (roles.length > count) roles.pop();

  for (let i = roles.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  [...room.players.values()].forEach((p, i) => {
    p.role = roles[i];
    p.alive = true;
    p.vote = null;
    p.hasActed = false;
    p.privateMessages = [];
    p.lastProtected = null;
    p.witch = { save: true, poison: true };
  });
}

function buildNightQueue(room) {
  const queue = ['wolves'];
  if (alivePlayers(room).some(p => p.role === 'guardia')) queue.push('guardia');
  if (alivePlayers(room).some(p => p.role === 'veggente')) queue.push('veggente');
  if (alivePlayers(room).some(p => p.role === 'strega')) queue.push('strega');
  return queue;
}

function startNight(room) {
  room.phase = 'night';
  room.day += 1;
  room.nightQueue = buildNightQueue(room);
  room.nightIndex = -1;
  room.nightStep = null;
  room.pendingWolfTarget = null;
  room.nightActions = { wolves: {}, guardia: {}, veggente: {}, strega: {} };
  room.lastNightDeaths = [];
  room.publicMessage = `Notte ${room.day}`;
  for (const p of room.players.values()) {
    p.vote = null;
    p.hasActed = false;
  }
  setTimeout(() => advanceNight(room), 300);
}

function requiredActors(room, step) {
  if (step === 'wolves') return alivePlayers(room).filter(p => p.role === 'lupo');
  if (step === 'guardia') return alivePlayers(room).filter(p => p.role === 'guardia');
  if (step === 'veggente') return alivePlayers(room).filter(p => p.role === 'veggente');
  if (step === 'strega') return alivePlayers(room).filter(p => p.role === 'strega');
  return [];
}

function nightProgress(room) {
  const actors = requiredActors(room, room.nightStep);
  const submitted = actors.filter(p => room.nightActions[room.nightStep]?.[p.id]).length;
  return { submitted, required: actors.length, step: room.nightStep };
}

function pickTopVote(votes) {
  const counts = new Map();
  for (const target of Object.values(votes).filter(Boolean)) {
    counts.set(target, (counts.get(target) || 0) + 1);
  }
  if (!counts.size) return null;
  const max = Math.max(...counts.values());
  const tied = [...counts.entries()].filter(([, c]) => c === max).map(([id]) => id);
  return tied[crypto.randomInt(tied.length)];
}

function finalizeNightStep(room, step) {
  if (step === 'wolves') {
    room.pendingWolfTarget = pickTopVote(room.nightActions.wolves);
  }
  if (step === 'guardia') {
    for (const [actorId, targetId] of Object.entries(room.nightActions.guardia)) {
      const actor = room.players.get(actorId);
      if (actor) actor.lastProtected = targetId;
    }
  }
  if (step === 'veggente') {
    for (const [actorId, targetId] of Object.entries(room.nightActions.veggente)) {
      const actor = room.players.get(actorId);
      const target = room.players.get(targetId);
      if (actor && target) {
        const isWolf = ROLE_DEFS[target.role].team === 'wolves';
        actor.privateMessages.push({
          id: randomId(5),
          title: `Visione su ${target.name}`,
          text: isWolf ? 'La visione è oscura: appartiene al branco.' : 'La visione è limpida: non appartiene al branco.',
          at: Date.now()
        });
      }
    }
  }
}

function advanceNight(room) {
  if (room.phase !== 'night') return;
  if (room.nightStep) finalizeNightStep(room, room.nightStep);
  room.nightIndex += 1;
  if (room.nightIndex >= room.nightQueue.length) {
    resolveNight(room);
    return;
  }
  room.nightStep = room.nightQueue[room.nightIndex];
  room.publicMessage = `Notte ${room.day}: ${room.nightStep}`;
  emitRoom(room);
  narrate(room, room.nightStep);

  const actors = requiredActors(room, room.nightStep);
  if (!actors.length) setTimeout(() => advanceNight(room), 350);
}

function resolveNight(room) {
  const protectedIds = new Set(Object.values(room.nightActions.guardia).filter(Boolean));
  let saved = false;
  let poisoned = null;

  for (const [witchId, action] of Object.entries(room.nightActions.strega)) {
    const witch = room.players.get(witchId);
    if (!witch || !action) continue;
    if (action.save && witch.witch.save && room.pendingWolfTarget) {
      witch.witch.save = false;
      saved = true;
    }
    if (action.poisonTarget && witch.witch.poison) {
      witch.witch.poison = false;
      poisoned = action.poisonTarget;
    }
  }

  const deaths = new Set();
  if (room.pendingWolfTarget && !protectedIds.has(room.pendingWolfTarget) && !saved) deaths.add(room.pendingWolfTarget);
  if (poisoned) deaths.add(poisoned);

  for (const id of deaths) {
    const p = room.players.get(id);
    if (p) p.alive = false;
  }

  room.lastNightDeaths = [...deaths];
  room.nightStep = null;
  room.phase = 'dayDiscussion';
  room.publicMessage = deaths.size
    ? `All’alba mancano: ${[...deaths].map(id => room.players.get(id)?.name).filter(Boolean).join(', ')}.`
    : 'È stata una notte tranquilla: nessuna vittima.';
  room.publicLog.push({ at: Date.now(), text: room.publicMessage });

  const winner = checkWinner(room);
  if (winner) endGame(room, winner);
  else {
    emitRoom(room);
    setTimeout(() => narrate(room, 'dawn', `${NIGHT_LINES.dawn[crypto.randomInt(NIGHT_LINES.dawn.length)]} ${room.publicMessage}`), 250);
  }
}

function checkWinner(room) {
  const alive = alivePlayers(room);
  const wolves = alive.filter(p => p.role === 'lupo').length;
  const others = alive.length - wolves;
  if (wolves === 0) return 'village';
  if (wolves >= others) return 'wolves';
  return null;
}

function endGame(room, winner) {
  room.phase = 'ended';
  room.winner = winner;
  room.publicMessage = winner === 'wolves' ? 'Il branco ha conquistato il villaggio.' : 'Il villaggio ha eliminato tutti i lupi.';
  room.publicLog.push({ at: Date.now(), text: room.publicMessage });
  emitRoom(room);
  narrate(room, 'dawn', room.publicMessage);
}

function resolveVote(room) {
  const alive = alivePlayers(room);
  const counts = new Map();
  for (const p of alive) {
    if (!p.vote) continue;
    counts.set(p.vote, (counts.get(p.vote) || 0) + 1);
  }

  let eliminated = null;
  if (counts.size) {
    const max = Math.max(...counts.values());
    const leaders = [...counts.entries()].filter(([, c]) => c === max).map(([id]) => id);
    if (leaders.length === 1) eliminated = leaders[0];
  }

  if (eliminated) {
    const target = room.players.get(eliminated);
    target.alive = false;
    room.lastEliminated = eliminated;
    room.publicMessage = `${target.name} è stato eliminato dal villaggio.`;
    for (const medium of alivePlayers(room).filter(p => p.role === 'medium')) {
      const isWolf = target.role === 'lupo';
      medium.privateMessages.push({
        id: randomId(5),
        title: `Voce dall’aldilà: ${target.name}`,
        text: isWolf ? 'La persona eliminata apparteneva al branco.' : 'La persona eliminata non apparteneva al branco.',
        at: Date.now()
      });
    }
  } else {
    room.lastEliminated = null;
    room.publicMessage = 'La votazione è terminata in parità: nessuno viene eliminato.';
  }

  room.publicLog.push({ at: Date.now(), text: room.publicMessage });
  room.phase = 'dayResult';
  for (const p of room.players.values()) p.vote = null;
  const winner = checkWinner(room);
  if (winner) endGame(room, winner);
  else {
    emitRoom(room);
    narrate(room, 'vote', room.publicMessage);
  }
}

function maybeFinishNightAction(room) {
  const { submitted, required } = nightProgress(room);
  emitRoom(room);
  if (required > 0 && submitted >= required) setTimeout(() => advanceNight(room), 450);
}

function leaveCurrentRoom(socket) {
  const code = socket.data.roomCode;
  if (!code) return;
  const room = rooms.get(code);
  if (!room) return;
  socket.leave(code);
  const player = getPlayerBySocket(room, socket);
  if (player) {
    player.connected = false;
    player.socketId = null;
  }
  socket.data.roomCode = null;
  socket.data.playerId = null;
  socket.data.hostToken = null;
  emitRoom(room);
}

io.on('connection', socket => {
  socket.on('createRoom', (payload, ack = () => {}) => {
    try {
      leaveCurrentRoom(socket);
      const name = cleanName(payload?.name);
      if (!name) return ack({ ok: false, error: 'Inserisci il tuo nome.' });
      const settings = defaultSettings(payload?.settings);
      const code = createRoomCode();
      const room = {
        code,
        hostToken: randomId(24),
        settings,
        players: new Map(),
        phase: 'lobby',
        day: 0,
        nightQueue: [],
        nightIndex: -1,
        nightStep: null,
        nightActions: { wolves: {}, guardia: {}, veggente: {}, strega: {} },
        pendingWolfTarget: null,
        lastNightDeaths: [],
        lastEliminated: null,
        winner: null,
        publicMessage: 'Stanza creata. Attendi gli altri giocatori.',
        publicLog: [],
        createdAt: Date.now()
      };

      let player = null;
      if (settings.hostPlays) {
        player = makePlayer(name, socket, true);
        room.players.set(player.id, player);
      }
      rooms.set(code, room);
      socket.join(code);
      socket.data.roomCode = code;
      socket.data.hostToken = room.hostToken;
      socket.data.playerId = player?.id || null;
      ack({ ok: true, code, hostToken: room.hostToken, playerToken: player?.token || null });
      emitRoom(room);
    } catch (error) {
      console.error(error);
      ack({ ok: false, error: 'Impossibile creare la stanza.' });
    }
  });

  socket.on('joinRoom', (payload, ack = () => {}) => {
    try {
      leaveCurrentRoom(socket);
      const code = String(payload?.code || '').trim().toUpperCase();
      const name = cleanName(payload?.name);
      const room = rooms.get(code);
      if (!room) return ack({ ok: false, error: 'Stanza non trovata.' });
      if (room.phase !== 'lobby') return ack({ ok: false, error: 'La partita è già iniziata.' });
      if (!name) return ack({ ok: false, error: 'Inserisci il tuo nome.' });
      if ([...room.players.values()].some(p => p.name.toLowerCase() === name.toLowerCase())) {
        return ack({ ok: false, error: 'Questo nome è già in uso nella stanza.' });
      }
      const player = makePlayer(name, socket, false);
      room.players.set(player.id, player);
      socket.join(code);
      socket.data.roomCode = code;
      socket.data.playerId = player.id;
      socket.data.hostToken = null;
      ack({ ok: true, code, playerToken: player.token });
      emitRoom(room);
    } catch (error) {
      console.error(error);
      ack({ ok: false, error: 'Impossibile entrare nella stanza.' });
    }
  });

  socket.on('resumeRoom', (payload, ack = () => {}) => {
    const code = String(payload?.code || '').trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) return ack({ ok: false, error: 'La stanza non esiste più.' });
    leaveCurrentRoom(socket);

    let player = null;
    if (payload?.playerToken) {
      player = [...room.players.values()].find(p => p.token === payload.playerToken) || null;
      if (player) {
        player.connected = true;
        player.socketId = socket.id;
      }
    }
    const isHost = payload?.hostToken && payload.hostToken === room.hostToken;
    if (!player && !isHost) return ack({ ok: false, error: 'Sessione non riconosciuta.' });

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerId = player?.id || null;
    socket.data.hostToken = isHost ? room.hostToken : null;
    ack({ ok: true });
    emitRoom(room);
  });

  socket.on('setReady', (ready, ack = () => {}) => {
    const room = rooms.get(socket.data.roomCode);
    const player = room && getPlayerBySocket(room, socket);
    if (!room || !player || room.phase !== 'lobby') return ack({ ok: false });
    player.ready = Boolean(ready);
    emitRoom(room);
    ack({ ok: true });
  });

  socket.on('startGame', (_payload, ack = () => {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!requireHost(socket, room)) return ack({ ok: false, error: 'Solo il dispositivo base può iniziare.' });
    if (room.phase !== 'lobby') return ack({ ok: false, error: 'La partita è già iniziata.' });
    if (room.players.size < 5) return ack({ ok: false, error: 'Servono almeno 5 giocatori.' });
    if (![...room.players.values()].every(p => p.ready)) return ack({ ok: false, error: 'Non tutti sono pronti.' });
    assignRoles(room);
    room.phase = 'roleReveal';
    room.publicMessage = 'I ruoli sono stati assegnati. Ognuno controlli il proprio telefono.';
    emitRoom(room);
    narrate(room, 'dawn', 'I ruoli sono stati assegnati. Guardate il vostro telefono senza mostrarlo agli altri. Quando siete pronti, il dispositivo base farà iniziare la notte.');
    ack({ ok: true });
  });

  socket.on('beginFirstNight', (_payload, ack = () => {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!requireHost(socket, room) || room.phase !== 'roleReveal') return ack({ ok: false });
    startNight(room);
    emitRoom(room);
    ack({ ok: true });
  });

  socket.on('submitNightAction', (payload, ack = () => {}) => {
    const room = rooms.get(socket.data.roomCode);
    const player = room && getPlayerBySocket(room, socket);
    if (!room || !player || room.phase !== 'night' || !player.alive) return ack({ ok: false, error: 'Azione non disponibile.' });
    const step = room.nightStep;
    const prompt = getNightPrompt(room, player);
    if (!prompt) return ack({ ok: false, error: 'Non è il tuo turno.' });

    if (prompt.type === 'target') {
      const targetId = String(payload?.targetId || '');
      if (!prompt.targets.some(t => t.id === targetId)) return ack({ ok: false, error: 'Bersaglio non valido.' });
      room.nightActions[step][player.id] = targetId;
    } else if (prompt.type === 'witch') {
      const action = {
        save: Boolean(payload?.save) && prompt.canSave,
        poisonTarget: prompt.canPoison && prompt.poisonTargets.some(t => t.id === payload?.poisonTarget)
          ? payload.poisonTarget : null
      };
      room.nightActions.strega[player.id] = action;
    }
    ack({ ok: true });
    maybeFinishNightAction(room);
  });

  socket.on('forceAdvanceNight', (_payload, ack = () => {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!requireHost(socket, room) || room.phase !== 'night') return ack({ ok: false });
    advanceNight(room);
    ack({ ok: true });
  });

  socket.on('startVoting', (_payload, ack = () => {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!requireHost(socket, room) || room.phase !== 'dayDiscussion') return ack({ ok: false });
    room.phase = 'voting';
    room.publicMessage = 'Votazione aperta.';
    for (const p of room.players.values()) p.vote = null;
    emitRoom(room);
    narrate(room, 'vote');
    ack({ ok: true });
  });

  socket.on('submitVote', (payload, ack = () => {}) => {
    const room = rooms.get(socket.data.roomCode);
    const player = room && getPlayerBySocket(room, socket);
    if (!room || !player || room.phase !== 'voting' || !player.alive) return ack({ ok: false, error: 'Non puoi votare.' });
    const targetId = String(payload?.targetId || '');
    if (!alivePlayers(room).some(p => p.id === targetId && p.id !== player.id)) {
      return ack({ ok: false, error: 'Voto non valido.' });
    }
    player.vote = targetId;
    ack({ ok: true });
    emitRoom(room);
    if (alivePlayers(room).every(p => p.vote)) setTimeout(() => resolveVote(room), 500);
  });

  socket.on('forceResolveVote', (_payload, ack = () => {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!requireHost(socket, room) || room.phase !== 'voting') return ack({ ok: false });
    resolveVote(room);
    ack({ ok: true });
  });

  socket.on('startNextNight', (_payload, ack = () => {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!requireHost(socket, room) || room.phase !== 'dayResult' || room.winner) return ack({ ok: false });
    startNight(room);
    emitRoom(room);
    ack({ ok: true });
  });

  socket.on('restartGame', (_payload, ack = () => {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!requireHost(socket, room)) return ack({ ok: false });
    room.phase = 'lobby';
    room.day = 0;
    room.winner = null;
    room.nightStep = null;
    room.lastNightDeaths = [];
    room.lastEliminated = null;
    room.publicMessage = 'Nuova partita: confermate quando siete pronti.';
    room.publicLog = [];
    for (const p of room.players.values()) {
      p.role = null;
      p.alive = true;
      p.vote = null;
      p.ready = p.isHostPlayer;
      p.privateMessages = [];
    }
    emitRoom(room);
    ack({ ok: true });
  });

  socket.on('kickPlayer', (payload, ack = () => {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!requireHost(socket, room) || room.phase !== 'lobby') return ack({ ok: false });
    const player = room.players.get(String(payload?.playerId || ''));
    if (!player || player.isHostPlayer) return ack({ ok: false });
    if (player.socketId) io.sockets.sockets.get(player.socketId)?.emit('kicked');
    room.players.delete(player.id);
    emitRoom(room);
    ack({ ok: true });
  });

  socket.on('disconnect', () => {
    const room = rooms.get(socket.data.roomCode);
    const player = room && getPlayerBySocket(room, socket);
    if (player) {
      player.connected = false;
      player.socketId = null;
      emitRoom(room);
    }
  });
});

setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    const connected = [...room.players.values()].some(p => p.connected);
    const hostConnected = [...io.sockets.sockets.values()].some(s => s.data.roomCode === code && s.data.hostToken === room.hostToken);
    if (!connected && !hostConnected && now - room.createdAt > 6 * 60 * 60 * 1000) rooms.delete(code);
  }
}, 30 * 60 * 1000).unref();

server.listen(PORT, () => {
  console.log(`Lupus Mobile attivo sulla porta ${PORT}`);
});
