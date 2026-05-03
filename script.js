import {
  firebaseReady,
  createMatchDoc,
  getMatchDoc,
  updateMatchDoc,
  listenMatchDoc
} from "./firebase.js";

const $ = id => document.getElementById(id);

const menuScreen = $("menuScreen");
const lobbyScreen = $("lobbyScreen");
const gameScreen = $("gameScreen");

const playerNameInput = $("playerNameInput");
const joinCodeInput = $("joinCodeInput");
const playBotBtn = $("playBotBtn");
const createOnlineBtn = $("createOnlineBtn");
const joinOnlineBtn = $("joinOnlineBtn");

const roomCodeText = $("roomCodeText");
const lobbyStatusText = $("lobbyStatusText");
const copyCodeBtn = $("copyCodeBtn");
const leaveLobbyBtn = $("leaveLobbyBtn");

const modeText = $("modeText");
const roomInfoText = $("roomInfoText");

const playerHandEl = $("playerHand");
const playerFieldEl = $("playerField");
const enemyFieldEl = $("enemyField");
const battleLogEl = $("battleLog");

const playerLifeEl = $("playerLife");
const enemyLifeEl = $("enemyLife");
const playerEnergyEl = $("playerEnergy");
const enemyEnergyEl = $("enemyEnergy");
const playerMaxEnergyEl = $("playerMaxEnergy");
const enemyMaxEnergyEl = $("enemyMaxEnergy");
const playerDeckCountEl = $("playerDeckCount");
const enemyDeckCountEl = $("enemyDeckCount");
const playerHandCountEl = $("playerHandCount");
const enemyHandCountEl = $("enemyHandCount");

const enemyNameEl = $("enemyName");
const playerNameText = $("playerNameText");
const turnTextEl = $("turnText");
const messageEl = $("message");

const endTurnBtn = $("endTurnBtn");
const restartBtn = $("restartBtn");
const backMenuBtn = $("backMenuBtn");
const toggleLogBtn = $("toggleLogBtn");
const logWrapper = $("logWrapper");

const cardDetailModal = $("cardDetailModal");
const detailIcon = $("detailIcon");
const detailName = $("detailName");
const detailType = $("detailType");
const detailCost = $("detailCost");
const detailAtk = $("detailAtk");
const detailHp = $("detailHp");
const detailAtkWrap = $("detailAtkWrap");
const detailHpWrap = $("detailHpWrap");
const detailAbilities = $("detailAbilities");
const detailDesc = $("detailDesc");
const closeDetailBtn = $("closeDetailBtn");

const resultModal = $("resultModal");
const resultIcon = $("resultIcon");
const resultTitle = $("resultTitle");
const resultText = $("resultText");
const playAgainBtn = $("playAgainBtn");
const resultMenuBtn = $("resultMenuBtn");

const STARTING_LIFE = 30;
const STARTING_HAND = 5;
const MAX_FIELD_SIZE = 5;

let selectedDeck = "balanced";
let game = null;
let gameMode = "bot";
let mySlot = "p1";
let roomCode = null;
let unsubscribeRoom = null;
let lastAttackCardId = null;

const abilityLabels = {
  guard: "Guardia",
  haste: "Rapidità",
  flying: "Volare",
  rage: "Rabbia",
  poison: "Veleno"
};

const deckLabels = {
  fire: "Fuoco",
  water: "Acqua",
  forest: "Foresta",
  shadow: "Ombra",
  light: "Luce",
  balanced: "Bilanciato"
};

const families = {
  fire: {
    label: "Fuoco",
    icon: "🔥",
    cards: [
      c("fire_1", "Scintilla", "fire", 1, 2, 3, 1, "common", "Piccola creatura di fuoco.", null, []),
      c("fire_2", "Lupo Ardente", "fire", 2, 4, 5, 2, "rare", "Quando entra, infligge 1 danno diretto.", "burnEnemy", ["haste"]),
      c("fire_3", "Drago Solare", "fire", 3, 7, 8, 4, "legendary", "Quando entra, infligge 2 danni a tutte le creature nemiche.", "fireStorm", ["flying"])
    ]
  },

  water: {
    label: "Acqua",
    icon: "🌊",
    cards: [
      c("water_1", "Goccia Viva", "water", 1, 1, 4, 1, "common", "Creatura resistente con Guardia.", null, ["guard"]),
      c("water_2", "Serpente Marino", "water", 2, 3, 7, 2, "rare", "Quando entra, cura 2 vita.", "healOwner", ["guard"]),
      c("water_3", "Titano Abissale", "water", 3, 6, 11, 4, "epic", "Quando entra, pesca una carta.", "drawOne", ["guard"])
    ]
  },

  forest: {
    label: "Foresta",
    icon: "🌿",
    cards: [
      c("forest_1", "Radice", "forest", 1, 2, 2, 1, "common", "Economica e veloce.", null, []),
      c("forest_2", "Guardiano Verde", "forest", 2, 5, 4, 2, "rare", "Quando entra, dà +1 ATK a un alleato.", "buffAllyAttack", ["rage"]),
      c("forest_3", "Antico Verde", "forest", 3, 8, 7, 4, "epic", "Quando entra, dà +2 HP al campo.", "buffTeamHp", ["rage"])
    ]
  },

  shadow: {
    label: "Ombra",
    icon: "🌑",
    cards: [
      c("shadow_1", "Ombra Minore", "shadow", 1, 3, 2, 1, "common", "Avvelena chi combatte contro di lei.", null, ["poison"]),
      c("shadow_2", "Spettro Nero", "shadow", 2, 5, 5, 3, "rare", "Quando entra, toglie 1 ATK a un nemico.", "weakenEnemy", ["poison"]),
      c("shadow_3", "Signore Eclissi", "shadow", 3, 9, 6, 5, "legendary", "Quando entra, infligge 3 danni diretti.", "darkBlast", ["poison", "flying"])
    ]
  },

  light: {
    label: "Luce",
    icon: "☀️",
    cards: [
      c("light_1", "Lumina", "light", 1, 1, 5, 1, "common", "Base difensiva con Guardia.", null, ["guard"]),
      c("light_2", "Cavaliere Alba", "light", 2, 4, 6, 3, "rare", "Quando entra, cura il campo di 1.", "healTeam", []),
      c("light_3", "Arcangelo Aureo", "light", 3, 7, 9, 5, "legendary", "Quando entra, cura 4 vita.", "bigHealOwner", ["flying", "guard"])
    ]
  }
};

const spells = [
  s("spell_fireball", "Palla Fuoco", 2, "common", "☄️", "Infligge 3 danni a una creatura nemica o alla vita.", "spellFireball", ["fire", "balanced"]),
  s("spell_heal", "Cura Rapida", 2, "common", "💧", "Cura 4 vita.", "spellHeal", ["water", "light", "balanced"]),
  s("spell_draw", "Richiamo", 1, "rare", "📜", "Pesca 2 carte.", "spellDrawTwo", ["water", "forest", "balanced"]),
  s("spell_blessing", "Benedizione", 3, "rare", "✨", "+1 ATK e +1 HP al tuo campo.", "spellBlessing", ["light", "forest", "balanced"]),
  s("spell_storm", "Tempesta", 4, "epic", "🌀", "2 danni a tutte le creature nemiche.", "spellStorm", ["shadow", "fire", "balanced"]),
  s("spell_energy", "Energia Antica", 0, "legendary", "🔮", "+2 energia nel turno.", "spellGainEnergy", ["balanced", "shadow", "light"])
];

function c(cardId, name, family, stage, attack, hp, cost, rarity, desc, effect, abilities) {
  return {
    cardId,
    type: "creature",
    name,
    family,
    stage,
    attack,
    hp,
    cost,
    rarity,
    desc,
    effect,
    abilities
  };
}

function s(cardId, name, cost, rarity, icon, desc, effect, decks) {
  return {
    cardId,
    type: "spell",
    name,
    cost,
    rarity,
    icon,
    desc,
    effect,
    decks
  };
}

function uid() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return String(Date.now()) + Math.random().toString(16).slice(2);
}

function randomCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

async function generateUniqueRoomCode() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = randomCode();
    const existingMatch = await getMatchDoc(code);

    if (!existingMatch) {
      return code;
    }
  }

  throw new Error("Non riesco a generare un codice stanza libero. Riprova.");
}

function getPlayerName() {
  const raw = playerNameInput.value.trim();
  const name = raw || localStorage.getItem("playerName") || "Giocatore";

  localStorage.setItem("playerName", name);

  return name;
}

function getPlayerId() {
  let id = localStorage.getItem("playerId");

  if (!id) {
    id = uid();
    localStorage.setItem("playerId", id);
  }

  return id;
}

function showOnly(screen) {
  menuScreen.classList.add("hidden");
  lobbyScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");

  screen.classList.remove("hidden");
}

function setMessage(text) {
  messageEl.textContent = text;
}

function makePlayer(name, deckType) {
  return {
    id: getPlayerId(),
    name,
    life: STARTING_LIFE,
    energy: 0,
    maxEnergy: 0,
    deck: createDeck(deckType),
    hand: [],
    field: []
  };
}

function makeBot() {
  return {
    id: "bot",
    name: "Bot",
    life: STARTING_LIFE,
    energy: 0,
    maxEnergy: 0,
    deck: createDeck("balanced"),
    hand: [],
    field: []
  };
}

function createDeck(deckType) {
  const deck = [];
  const familyKeys = getFamiliesForDeck(deckType);

  familyKeys.forEach(key => {
    families[key].cards.forEach(template => {
      let copies = 2;

      if (template.stage === 1) copies = deckType === "balanced" ? 2 : 5;
      if (template.stage === 2) copies = deckType === "balanced" ? 2 : 4;
      if (template.stage === 3) copies = deckType === "balanced" ? 1 : 3;

      for (let i = 0; i < copies; i++) {
        deck.push(createCreatureCard(template));
      }
    });
  });

  spells.forEach(spell => {
    if (!spell.decks.includes(deckType)) return;

    const copies = spell.rarity === "legendary" ? 1 : 2;

    for (let i = 0; i < copies; i++) {
      deck.push(createSpellCard(spell));
    }
  });

  while (deck.length < 34) {
    const family = families[randomItem(familyKeys)];
    deck.push(createCreatureCard(family.cards[0]));
  }

  return shuffle(deck);
}

function getFamiliesForDeck(deckType) {
  if (deckType === "balanced") {
    return ["fire", "water", "forest", "shadow", "light"];
  }

  const map = {
    fire: ["fire", "shadow"],
    water: ["water", "light"],
    forest: ["forest", "water"],
    shadow: ["shadow", "fire"],
    light: ["light", "forest"]
  };

  return map[deckType] || ["fire", "water", "forest", "shadow", "light"];
}

function createCreatureCard(template) {
  return {
    ...template,
    id: uid(),
    icon: families[template.family].icon,
    currentHp: template.hp,
    maxHp: template.hp,
    poisoned: false,
    canAttack: false,
    hasAttacked: false,
    abilities: [...template.abilities]
  };
}

function createSpellCard(template) {
  return {
    ...template,
    id: uid()
  };
}

function shuffle(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(item => item.value);
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function drawCard(player) {
  if (!player) return;

  if (player.deck.length === 0) {
    player.life -= 1;
    addLog(`${player.name} ha il mazzo vuoto e perde 1 vita.`);
    return;
  }

  player.hand.push(player.deck.shift());
}

function initialDraw(g) {
  for (let i = 0; i < STARTING_HAND; i++) {
    drawCard(g.players.p1);
    drawCard(g.players.p2);
  }
}

function startBotGame() {
  const name = getPlayerName();

  gameMode = "bot";
  roomCode = null;
  mySlot = "p1";
  lastAttackCardId = null;

  game = {
    mode: "bot",
    status: "playing",
    currentTurn: "p1",
    turnNumber: 1,
    winner: null,
    players: {
      p1: makePlayer(name, selectedDeck),
      p2: makeBot()
    },
    log: []
  };

  initialDraw(game);
  startTurn("p1");

  modeText.textContent = `Bot · Mazzo ${deckLabels[selectedDeck]}`;
  roomInfoText.textContent = "";

  resultModal.classList.add("hidden");
  cardDetailModal.classList.add("hidden");

  showOnly(gameScreen);
  render();
}

async function createOnlineGame() {
  if (!firebaseReady()) {
    alert("Firebase non è configurato. Controlla il file firebase.js.");
    return;
  }

  try {
    const name = getPlayerName();
    const code = await generateUniqueRoomCode();

    gameMode = "online";
    roomCode = code;
    mySlot = "p1";
    lastAttackCardId = null;

    game = {
      mode: "online",
      status: "waiting",
      code,
      currentTurn: "p1",
      turnNumber: 1,
      winner: null,
      players: {
        p1: makePlayer(name, selectedDeck),
        p2: null
      },
      log: [`${name} ha creato la partita.`]
    };

    await createMatchDoc(code, game);

    roomCodeText.textContent = code;
    lobbyStatusText.textContent = "In attesa del secondo giocatore...";

    resultModal.classList.add("hidden");
    cardDetailModal.classList.add("hidden");

    showOnly(lobbyScreen);
    subscribeToRoom(code);
  } catch (error) {
    console.error(error);
    alert("Errore durante la creazione della partita online. Controlla Firebase e le Rules.");
  }
}

async function joinOnlineGame() {
  if (!firebaseReady()) {
    alert("Firebase non è configurato. Controlla il file firebase.js.");
    return;
  }

  try {
    const code = joinCodeInput.value.trim().toUpperCase();

    if (!code) {
      alert("Inserisci il codice partita.");
      return;
    }

    const match = await getMatchDoc(code);

    if (!match) {
      alert("Partita non trovata.");
      return;
    }

    if (match.status !== "waiting" || match.players.p2) {
      alert("Questa partita è già piena o iniziata.");
      return;
    }

    const name = getPlayerName();

    gameMode = "online";
    roomCode = code;
    mySlot = "p2";
    lastAttackCardId = null;

    match.players.p2 = makePlayer(name, selectedDeck);
    match.status = "playing";
    match.log.unshift(`${name} è entrato nella partita.`);

    initialDraw(match);
    startTurnInGame(match, "p1");

    await updateMatchDoc(code, match);

    resultModal.classList.add("hidden");
    cardDetailModal.classList.add("hidden");

    subscribeToRoom(code);
    showOnly(gameScreen);
  } catch (error) {
    console.error(error);
    alert("Errore durante l’ingresso nella partita. Controlla codice, Firebase e Rules.");
  }
}

function subscribeToRoom(code) {
  if (unsubscribeRoom) {
    unsubscribeRoom();
    unsubscribeRoom = null;
  }

  unsubscribeRoom = listenMatchDoc(
    code,
    data => {
      if (!data) {
        alert("Partita non trovata.");
        showOnlyMenu();
        return;
      }

      const previousWinner = game?.winner || null;
      game = data;

      if (game.status === "waiting") {
        roomCodeText.textContent = game.code;
        lobbyStatusText.textContent = "In attesa del secondo giocatore...";
        showOnly(lobbyScreen);
        return;
      }

      showOnly(gameScreen);

      modeText.textContent = `Online · Codice ${game.code}`;
      roomInfoText.textContent = `Codice ${game.code}`;

      render();

      if (game.winner && game.winner !== previousWinner) {
        showResult(game.winner === mySlot);
      }
    },
    error => {
      console.error(error);
      alert("Errore di connessione alla partita. Controlla le Rules di Firestore.");
      showOnlyMenu();
    }
  );
}

async function saveOnlineGame() {
  if (gameMode !== "online" || !roomCode) return;

  try {
    await updateMatchDoc(roomCode, game);
  } catch (error) {
    console.error(error);
    alert("Errore nel salvataggio della mossa online.");
  }
}

function startTurn(slot) {
  startTurnInGame(game, slot);
}

function startTurnInGame(g, slot) {
  const player = g.players[slot];

  if (!player) return;

  g.currentTurn = slot;

  player.maxEnergy = Math.min(10, player.maxEnergy + 1);
  player.energy = player.maxEnergy;

  applyPoisonDamage(player);
  prepareCreatures(player);
  drawCard(player);

  g.log.unshift(`Turno di ${player.name}.`);
}

function prepareCreatures(player) {
  player.field.forEach(card => {
    card.canAttack = true;
    card.hasAttacked = false;
  });
}

function applyPoisonDamage(player) {
  player.field.forEach(card => {
    if (card.poisoned) {
      card.currentHp -= 1;
      addLog(`${card.name} subisce 1 danno da veleno.`);
    }
  });

  removeDead(player);
}

function getMyPlayer() {
  if (!game) return null;
  return game.players[mySlot];
}

function getEnemySlot() {
  return mySlot === "p1" ? "p2" : "p1";
}

function getEnemyPlayer() {
  if (!game) return null;
  return game.players[getEnemySlot()];
}

function isMyTurn() {
  return Boolean(
    game &&
    game.status === "playing" &&
    !game.winner &&
    game.currentTurn === mySlot
  );
}

function canPlayCard(card) {
  const me = getMyPlayer();

  if (!me) return false;
  if (!isMyTurn()) return false;
  if (card.cost > me.energy) return false;

  if (card.type === "spell") return true;

  if (card.stage === 1) {
    return me.field.length < MAX_FIELD_SIZE;
  }

  return me.field.some(fieldCard =>
    fieldCard.family === card.family &&
    fieldCard.stage === card.stage - 1
  );
}

async function handleHandCardClick(cardId) {
  if (!isMyTurn()) return;

  const me = getMyPlayer();
  const enemy = getEnemyPlayer();

  if (!me || !enemy) return;

  const card = me.hand.find(c => c.id === cardId);

  if (!card || !canPlayCard(card)) {
    setMessage("Non puoi giocare questa carta ora.");
    return;
  }

  if (card.type === "spell") {
    playSpell(me, enemy, card.id);
  } else if (card.stage === 1) {
    playCreature(me, enemy, card.id);
  } else {
    const index = me.field.findIndex(fieldCard =>
      fieldCard.family === card.family &&
      fieldCard.stage === card.stage - 1
    );

    evolveCreature(me, enemy, card.id, index);
  }

  checkGameOver();
  render();

  await saveOnlineGame();
}

function playCreature(owner, opponent, cardId) {
  const index = owner.hand.findIndex(card => card.id === cardId);
  const card = owner.hand[index];

  if (!card || card.type !== "creature") return;
  if (owner.field.length >= MAX_FIELD_SIZE) return;
  if (owner.energy < card.cost) return;

  owner.energy -= card.cost;
  owner.hand.splice(index, 1);

  card.canAttack = hasAbility(card, "haste");
  card.hasAttacked = !hasAbility(card, "haste");

  owner.field.push(card);

  addLog(`${owner.name} evoca ${card.name}.`);

  applyEntryEffect(card, owner, opponent);
}

function evolveCreature(owner, opponent, cardId, fieldIndex) {
  const handIndex = owner.hand.findIndex(card => card.id === cardId);
  const evolution = owner.hand[handIndex];
  const base = owner.field[fieldIndex];

  if (!evolution || !base) return;
  if (owner.energy < evolution.cost) return;
  if (evolution.family !== base.family) return;
  if (evolution.stage !== base.stage + 1) return;

  owner.energy -= evolution.cost;
  owner.hand.splice(handIndex, 1);

  const evolved = {
    ...evolution,
    id: uid(),
    currentHp: evolution.hp,
    maxHp: evolution.hp,
    poisoned: false,
    canAttack: base.canAttack || hasAbility(evolution, "haste"),
    hasAttacked: base.hasAttacked && !hasAbility(evolution, "haste"),
    abilities: [...(evolution.abilities || [])]
  };

  owner.field[fieldIndex] = evolved;

  addLog(`${owner.name} evolve ${base.name} in ${evolution.name}.`);

  applyEntryEffect(evolved, owner, opponent);
}

function playSpell(owner, opponent, cardId) {
  const index = owner.hand.findIndex(card => card.id === cardId);
  const spell = owner.hand[index];

  if (!spell || spell.type !== "spell") return;
  if (owner.energy < spell.cost) return;

  owner.energy -= spell.cost;
  owner.hand.splice(index, 1);

  addLog(`${owner.name} gioca ${spell.name}.`);

  applySpellEffect(spell, owner, opponent);
}

function applyEntryEffect(card, owner, opponent) {
  switch (card.effect) {
    case "burnEnemy":
      opponent.life -= 1;
      addLog(`${card.name} infligge 1 danno diretto.`);
      break;

    case "fireStorm":
      opponent.field.forEach(creature => {
        creature.currentHp -= 2;
        applyRageIfDamaged(creature);
      });
      addLog(`${card.name} infligge 2 danni al campo avversario.`);
      removeDead(opponent);
      break;

    case "healOwner":
      owner.life = Math.min(STARTING_LIFE + 15, owner.life + 2);
      addLog(`${card.name} cura 2 vita.`);
      break;

    case "drawOne":
      drawCard(owner);
      addLog(`${card.name} fa pescare 1 carta.`);
      break;

    case "buffAllyAttack":
      if (owner.field.length) {
        const target = randomItem(owner.field);
        target.attack += 1;
        addLog(`${card.name} dà +1 ATK a ${target.name}.`);
      }
      break;

    case "buffTeamHp":
      owner.field.forEach(creature => {
        creature.maxHp += 2;
        creature.currentHp += 2;
      });
      addLog(`${card.name} dà +2 HP al campo.`);
      break;

    case "weakenEnemy":
      if (opponent.field.length) {
        const target = randomItem(opponent.field);
        target.attack = Math.max(0, target.attack - 1);
        addLog(`${card.name} toglie 1 ATK a ${target.name}.`);
      }
      break;

    case "darkBlast":
      opponent.life -= 3;
      addLog(`${card.name} infligge 3 danni diretti.`);
      break;

    case "healTeam":
      owner.field.forEach(creature => {
        creature.currentHp = Math.min(creature.maxHp, creature.currentHp + 1);
      });
      addLog(`${card.name} cura il campo di 1.`);
      break;

    case "bigHealOwner":
      owner.life = Math.min(STARTING_LIFE + 15, owner.life + 4);
      addLog(`${card.name} cura 4 vita.`);
      break;

    default:
      break;
  }
}

function applySpellEffect(spell, owner, opponent) {
  switch (spell.effect) {
    case "spellFireball":
      if (opponent.field.length) {
        const target = chooseSpellTarget(opponent.field);
        target.currentHp -= 3;
        applyRageIfDamaged(target);
        addLog(`${spell.name} infligge 3 danni a ${target.name}.`);
        removeDead(opponent);
      } else {
        opponent.life -= 3;
        addLog(`${spell.name} infligge 3 danni diretti.`);
      }
      break;

    case "spellHeal":
      owner.life = Math.min(STARTING_LIFE + 15, owner.life + 4);
      addLog(`${spell.name} cura 4 vita.`);
      break;

    case "spellDrawTwo":
      drawCard(owner);
      drawCard(owner);
      addLog(`${spell.name} fa pescare 2 carte.`);
      break;

    case "spellBlessing":
      owner.field.forEach(creature => {
        creature.attack += 1;
        creature.maxHp += 1;
        creature.currentHp += 1;
      });
      addLog(`${spell.name} dà +1 ATK e +1 HP al campo.`);
      break;

    case "spellStorm":
      opponent.field.forEach(creature => {
        creature.currentHp -= 2;
        applyRageIfDamaged(creature);
      });
      addLog(`${spell.name} infligge 2 danni al campo avversario.`);
      removeDead(opponent);
      break;

    case "spellGainEnergy":
      owner.energy += 2;
      addLog(`${spell.name} dà +2 energia.`);
      break;

    default:
      break;
  }
}

function chooseSpellTarget(field) {
  const guard = field.find(card => hasAbility(card, "guard"));

  if (guard) return guard;

  return [...field].sort((a, b) => b.attack - a.attack)[0];
}

async function playerAttack(attackerIndex, targetIndex) {
  if (!isMyTurn()) return;

  const me = getMyPlayer();
  const enemy = getEnemyPlayer();

  if (!me || !enemy) return;

  const attacker = me.field[attackerIndex];

  if (!attacker || attacker.hasAttacked || !attacker.canAttack) return;

  lastAttackCardId = attacker.id;

  if (targetIndex === "life") {
    if (!canAttackLife(attacker, enemy.field)) {
      setMessage("Prima devi eliminare Guardia o creature che bloccano.");
      return;
    }

    enemy.life -= attacker.attack;
    attacker.hasAttacked = true;
    addLog(`${attacker.name} infligge ${attacker.attack} danni diretti.`);
  } else {
    const target = enemy.field[targetIndex];

    if (!target) return;

    const guards = enemy.field.filter(card => hasAbility(card, "guard"));

    if (guards.length && !hasAbility(target, "guard")) {
      setMessage("Devi attaccare prima Guardia.");
      return;
    }

    fight(attacker, target, me, enemy);
  }

  checkGameOver();
  render();

  setTimeout(() => {
    lastAttackCardId = null;
    render();
  }, 320);

  await saveOnlineGame();
}

function fight(attacker, defender, attackerOwner, defenderOwner) {
  defender.currentHp -= attacker.attack;
  attacker.currentHp -= defender.attack;
  attacker.hasAttacked = true;

  applyRageIfDamaged(attacker);
  applyRageIfDamaged(defender);

  if (hasAbility(attacker, "poison") && defender.currentHp > 0) {
    defender.poisoned = true;
    addLog(`${defender.name} è avvelenata.`);
  }

  if (hasAbility(defender, "poison") && attacker.currentHp > 0) {
    attacker.poisoned = true;
    addLog(`${attacker.name} è avvelenata.`);
  }

  addLog(`${attacker.name} combatte contro ${defender.name}.`);

  removeDead(attackerOwner);
  removeDead(defenderOwner);
}

function applyRageIfDamaged(card) {
  if (card && card.currentHp > 0 && hasAbility(card, "rage")) {
    card.attack += 1;
    addLog(`${card.name} attiva Rabbia: +1 ATK.`);
  }
}

function removeDead(player) {
  const before = player.field.length;
  player.field = player.field.filter(card => card.currentHp > 0);

  if (player.field.length < before) {
    addLog("Una o più creature sono state eliminate.");
  }
}

function canAttackLife(attacker, defenderField) {
  if (!defenderField.length) return true;

  if (defenderField.some(card => hasAbility(card, "guard"))) return false;

  if (hasAbility(attacker, "flying")) {
    return !defenderField.some(card => hasAbility(card, "flying"));
  }

  return false;
}

function hasAbility(card, ability) {
  return Array.isArray(card.abilities) && card.abilities.includes(ability);
}

async function endTurn() {
  if (!isMyTurn()) return;

  const me = getMyPlayer();
  const next = getEnemySlot();

  addLog(`${me.name} termina il turno.`);

  if (gameMode === "bot") {
    startTurn("p2");
    render();

    setTimeout(() => {
      botTurn();

      if (!game.winner) {
        game.turnNumber++;
        startTurn("p1");
      }

      render();
    }, 600);
  } else {
    game.turnNumber++;
    startTurn(next);
    render();
    await saveOnlineGame();
  }
}

function botTurn() {
  const bot = game.players.p2;
  const player = game.players.p1;

  let action = true;
  let count = 0;

  while (action && count < 8) {
    count++;
    action = false;

    const evolution = bot.hand.find(card =>
      card.type === "creature" &&
      card.stage > 1 &&
      card.cost <= bot.energy &&
      bot.field.some(fieldCard =>
        fieldCard.family === card.family &&
        fieldCard.stage === card.stage - 1
      )
    );

    if (evolution) {
      const index = bot.field.findIndex(fieldCard =>
        fieldCard.family === evolution.family &&
        fieldCard.stage === evolution.stage - 1
      );

      evolveCreature(bot, player, evolution.id, index);
      action = true;
      continue;
    }

    const usefulSpell = bot.hand.find(card =>
      card.type === "spell" &&
      card.cost <= bot.energy &&
      shouldBotUseSpell(card, bot, player)
    );

    if (usefulSpell) {
      playSpell(bot, player, usefulSpell.id);
      action = true;
      continue;
    }

    const creature = bot.hand.find(card =>
      card.type === "creature" &&
      card.stage === 1 &&
      card.cost <= bot.energy
    );

    if (creature && bot.field.length < MAX_FIELD_SIZE) {
      playCreature(bot, player, creature.id);
      action = true;
    }
  }

  [...bot.field].forEach(attacker => {
    if (game.winner) return;
    if (!bot.field.includes(attacker)) return;
    if (!attacker.canAttack || attacker.hasAttacked) return;

    lastAttackCardId = attacker.id;

    if (player.field.length) {
      const guards = player.field.filter(card => hasAbility(card, "guard"));
      const target = guards[0] || chooseBotTarget(player.field);

      fight(attacker, target, bot, player);
    } else {
      player.life -= attacker.attack;
      attacker.hasAttacked = true;
      addLog(`Bot infligge ${attacker.attack} danni diretti.`);
    }

    checkGameOver();
  });

  setTimeout(() => {
    lastAttackCardId = null;
    render();
  }, 320);
}

function shouldBotUseSpell(spell, bot, player) {
  if (spell.effect === "spellHeal") {
    return bot.life <= STARTING_LIFE - 5;
  }

  if (spell.effect === "spellDrawTwo") {
    return bot.hand.length <= 3;
  }

  if (spell.effect === "spellBlessing") {
    return bot.field.length >= 2;
  }

  if (spell.effect === "spellStorm") {
    return player.field.length >= 2;
  }

  if (spell.effect === "spellGainEnergy") {
    return bot.hand.some(card => card.cost > bot.energy);
  }

  return true;
}

function chooseBotTarget(field) {
  return [...field].sort((a, b) => a.currentHp - b.currentHp)[0];
}

function checkGameOver() {
  if (!game || game.winner) return;

  if (game.players.p1.life <= 0) {
    game.players.p1.life = 0;
    game.winner = "p2";
    game.status = "finished";
  }

  if (game.players.p2.life <= 0) {
    game.players.p2.life = 0;
    game.winner = "p1";
    game.status = "finished";
  }

  if (game.winner) {
    addLog(`${game.players[game.winner].name} ha vinto.`);
    showResult(game.winner === mySlot);
  }
}

function showResult(won) {
  resultModal.classList.remove("hidden");
  resultIcon.textContent = won ? "🏆" : "💀";
  resultTitle.textContent = won ? "Vittoria!" : "Sconfitta";
  resultText.textContent = won ? "Hai vinto la partita." : "Hai perso la partita.";
}

function addLog(text) {
  if (!game) return;

  game.log.unshift(text);

  if (game.log.length > 35) {
    game.log.pop();
  }
}

function render() {
  if (!game || !game.players.p1 || !game.players.p2) return;

  const me = getMyPlayer();
  const enemy = getEnemyPlayer();

  if (!me || !enemy) return;

  playerNameText.textContent = me.name;
  enemyNameEl.textContent = enemy.name;

  playerLifeEl.textContent = me.life;
  enemyLifeEl.textContent = enemy.life;

  playerEnergyEl.textContent = me.energy;
  enemyEnergyEl.textContent = enemy.energy;

  playerMaxEnergyEl.textContent = me.maxEnergy;
  enemyMaxEnergyEl.textContent = enemy.maxEnergy;

  playerDeckCountEl.textContent = me.deck.length;
  enemyDeckCountEl.textContent = enemy.deck.length;

  playerHandCountEl.textContent = me.hand.length;
  enemyHandCountEl.textContent = enemy.hand.length;

  turnTextEl.textContent = isMyTurn()
    ? "Tuo turno"
    : `Turno di ${game.players[game.currentTurn]?.name || "avversario"}`;

  endTurnBtn.disabled = !isMyTurn() || Boolean(game.winner);

  if (gameMode === "online") {
    modeText.textContent = `Online · ${roomCode}`;
    roomInfoText.textContent = `Codice ${roomCode}`;
  } else {
    modeText.textContent = `Bot · Mazzo ${deckLabels[selectedDeck]}`;
    roomInfoText.textContent = "";
  }

  renderHand();
  renderField(playerFieldEl, me.field, "player");
  renderField(enemyFieldEl, enemy.field, "enemy");
  renderLog();

  if (game.winner) {
    endTurnBtn.disabled = true;
  }
}

function renderHand() {
  const me = getMyPlayer();

  if (!me) return;

  playerHandEl.innerHTML = "";

  me.hand.forEach(card => {
    const el = createCardEl(card, "hand-card");

    if (canPlayCard(card)) {
      el.classList.add("playable");
    } else {
      el.classList.add("unplayable");
    }

    addHandCardEvents(el, card);
    playerHandEl.appendChild(el);
  });
}

function addHandCardEvents(cardEl, card) {
  let pressTimer = null;
  let didLongPress = false;

  const clear = () => {
    if (pressTimer) clearTimeout(pressTimer);
    pressTimer = null;
  };

  cardEl.addEventListener("pointerdown", () => {
    didLongPress = false;

    pressTimer = setTimeout(() => {
      didLongPress = true;
      showCardDetail(card);
    }, 520);
  });

  cardEl.addEventListener("pointerup", clear);
  cardEl.addEventListener("pointercancel", clear);
  cardEl.addEventListener("pointerleave", clear);

  cardEl.addEventListener("click", event => {
    if (didLongPress) {
      event.preventDefault();
      event.stopPropagation();

      setTimeout(() => {
        didLongPress = false;
      }, 150);

      return;
    }

    handleHandCardClick(card.id);
  });

  cardEl.addEventListener("contextmenu", event => {
    event.preventDefault();
    showCardDetail(card);
  });
}

function renderField(container, field, owner) {
  container.innerHTML = "";

  if (!field.length) {
    const empty = document.createElement("div");
    empty.className = "empty-field";
    empty.textContent = "Nessuna creatura";
    container.appendChild(empty);
    return;
  }

  field.forEach((card, index) => {
    const el = createCardEl(card, owner === "player" ? "player-card" : "enemy-card");

    if (!card.canAttack) el.classList.add("sleeping");
    if (card.hasAttacked) el.classList.add("attacked");
    if (card.poisoned) el.classList.add("poisoned");
    if (card.id === lastAttackCardId) el.classList.add("attacking");

    el.addEventListener("contextmenu", event => {
      event.preventDefault();
      showCardDetail(card);
    });

    el.addEventListener("dblclick", () => {
      showCardDetail(card);
    });

    const actions = document.createElement("div");
    actions.className = "card-actions";

    if (owner === "player") {
      if (isMyTurn() && card.canAttack && !card.hasAttacked) {
        const enemy = getEnemyPlayer();

        if (canAttackLife(card, enemy.field)) {
          const btn = document.createElement("button");
          btn.textContent = "Vita";
          btn.onclick = event => {
            event.stopPropagation();
            playerAttack(index, "life");
          };
          actions.appendChild(btn);
        }

        enemy.field.forEach((enemyCard, enemyIndex) => {
          const guards = enemy.field.filter(enemyCreature => hasAbility(enemyCreature, "guard"));
          const mustAttackGuard = guards.length > 0 && !hasAbility(enemyCard, "guard");

          const btn = document.createElement("button");
          btn.textContent = `Atk ${enemyCard.name.slice(0, 6)}`;
          btn.disabled = mustAttackGuard;
          btn.onclick = event => {
            event.stopPropagation();
            playerAttack(index, enemyIndex);
          };
          actions.appendChild(btn);
        });
      } else {
        const info = document.createElement("small");
        info.textContent = card.hasAttacked ? "Usata" : "Riposo";
        actions.appendChild(info);
      }
    }

    el.appendChild(actions);
    container.appendChild(el);
  });
}

function createCardEl(card, extraClass) {
  const el = document.createElement("div");

  if (card.type === "creature") {
    el.className = `card creature ${card.family} ${card.rarity} ${extraClass}`;

    const hpPercent = Math.max(0, Math.min(100, Math.round((card.currentHp / card.maxHp) * 100)));
    const abilities = (card.abilities || [])
      .map(ability => `<span class="ability">${abilityLabels[ability]}</span>`)
      .join("");

    el.innerHTML = `
      <div>
        <div class="card-top">
          <div class="card-icon">${card.icon}</div>
          <div class="card-cost">${card.cost}</div>
        </div>

        <div class="card-name">${card.name}</div>

        <div class="card-meta">
          <span class="badge">${families[card.family].label}</span>
          <span class="badge">E${card.stage}</span>
          <span class="badge ${card.rarity}">${shortRarity(card.rarity)}</span>
        </div>

        <div class="ability-row">${abilities}</div>
        <div class="card-desc">${card.desc}</div>
      </div>

      <div>
        <div class="hp-bar">
          <div class="hp-fill" style="width:${hpPercent}%"></div>
        </div>

        <div class="card-stats">
          <div class="card-stat">
            <small>ATK</small>
            ${card.attack}
          </div>
          <div class="card-stat">
            <small>HP</small>
            ${card.currentHp}/${card.maxHp}
          </div>
        </div>
      </div>
    `;
  } else {
    el.className = `card spell-card ${card.rarity} ${extraClass}`;

    el.innerHTML = `
      <div>
        <div class="card-top">
          <div class="card-icon">${card.icon}</div>
          <div class="card-cost">${card.cost}</div>
        </div>

        <div class="card-name">${card.name}</div>

        <div class="card-meta">
          <span class="badge">Magia</span>
          <span class="badge ${card.rarity}">${shortRarity(card.rarity)}</span>
        </div>

        <div class="card-desc">${card.desc}</div>
      </div>

      <div>
        <div class="card-stats">
          <div class="card-stat">
            <small>TIPO</small>
            Spell
          </div>
          <div class="card-stat">
            <small>COSTO</small>
            ${card.cost}
          </div>
        </div>
      </div>
    `;
  }

  el.addEventListener("dblclick", () => {
    showCardDetail(card);
  });

  return el;
}

function showCardDetail(card) {
  detailIcon.textContent = card.icon || "🃏";
  detailName.textContent = card.name;
  detailCost.textContent = card.cost;
  detailDesc.textContent = card.desc || "Nessuna descrizione.";

  if (card.type === "creature") {
    detailType.textContent = `${families[card.family].label} · Evoluzione ${card.stage}/3 · ${shortRarity(card.rarity)}`;

    detailAtkWrap.classList.remove("hidden");
    detailHpWrap.classList.remove("hidden");

    detailAtk.textContent = card.attack;
    detailHp.textContent = `${card.currentHp}/${card.maxHp}`;

    detailAbilities.innerHTML = "";

    if (card.abilities?.length) {
      card.abilities.forEach(ability => {
        const span = document.createElement("span");
        span.textContent = abilityLabels[ability];
        detailAbilities.appendChild(span);
      });
    } else {
      detailAbilities.innerHTML = `<span>Nessuna abilità</span>`;
    }
  } else {
    detailType.textContent = `Magia · ${shortRarity(card.rarity)}`;

    detailAtkWrap.classList.add("hidden");
    detailHpWrap.classList.add("hidden");

    detailAbilities.innerHTML = `<span>Effetto magia</span>`;
  }

  cardDetailModal.classList.remove("hidden");
}

function renderLog() {
  battleLogEl.innerHTML = "";

  if (!game) return;

  game.log.forEach(entry => {
    const div = document.createElement("div");
    div.className = "log-entry";
    div.innerHTML = entry;
    battleLogEl.appendChild(div);
  });
}

function shortRarity(rarity) {
  const map = {
    common: "Com",
    rare: "Rara",
    epic: "Epica",
    legendary: "Leg"
  };

  return map[rarity] || rarity;
}

function showOnlyMenu() {
  if (unsubscribeRoom) {
    unsubscribeRoom();
    unsubscribeRoom = null;
  }

  roomCode = null;
  game = null;
  gameMode = "bot";
  mySlot = "p1";
  lastAttackCardId = null;

  resultModal.classList.add("hidden");
  cardDetailModal.classList.add("hidden");

  showOnly(menuScreen);
}

document.querySelectorAll(".deck-btn").forEach(button => {
  button.onclick = () => {
    document.querySelectorAll(".deck-btn").forEach(btn => {
      btn.classList.remove("selected");
    });

    button.classList.add("selected");
    selectedDeck = button.dataset.deck;
  };
});

playBotBtn.onclick = startBotGame;
createOnlineBtn.onclick = createOnlineGame;
joinOnlineBtn.onclick = joinOnlineGame;
endTurnBtn.onclick = endTurn;

restartBtn.onclick = () => {
  if (gameMode === "bot") {
    startBotGame();
  } else {
    alert("Nelle partite online torna al menu e crea una nuova stanza.");
  }
};

backMenuBtn.onclick = showOnlyMenu;
leaveLobbyBtn.onclick = showOnlyMenu;
resultMenuBtn.onclick = showOnlyMenu;

playAgainBtn.onclick = () => {
  resultModal.classList.add("hidden");

  if (gameMode === "bot") {
    startBotGame();
  } else {
    showOnlyMenu();
  }
};

copyCodeBtn.onclick = async () => {
  if (!roomCode) return;

  try {
    await navigator.clipboard.writeText(roomCode);
    lobbyStatusText.textContent = "Codice copiato.";
  } catch {
    lobbyStatusText.textContent = `Codice: ${roomCode}`;
  }
};

toggleLogBtn.onclick = () => {
  logWrapper.classList.toggle("collapsed");
};

closeDetailBtn.onclick = () => {
  cardDetailModal.classList.add("hidden");
};

cardDetailModal.onclick = event => {
  if (event.target === cardDetailModal) {
    cardDetailModal.classList.add("hidden");
  }
};

const savedName = localStorage.getItem("playerName");

if (savedName) {
  playerNameInput.value = savedName;
}

showOnly(menuScreen);