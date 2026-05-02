const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");

const playerHandEl = document.getElementById("playerHand");
const playerFieldEl = document.getElementById("playerField");
const enemyFieldEl = document.getElementById("enemyField");
const battleLogEl = document.getElementById("battleLog");

const playerLifeEl = document.getElementById("playerLife");
const enemyLifeEl = document.getElementById("enemyLife");
const playerEnergyEl = document.getElementById("playerEnergy");
const enemyEnergyEl = document.getElementById("enemyEnergy");
const playerMaxEnergyEl = document.getElementById("playerMaxEnergy");
const enemyMaxEnergyEl = document.getElementById("enemyMaxEnergy");
const playerDeckCountEl = document.getElementById("playerDeckCount");
const enemyDeckCountEl = document.getElementById("enemyDeckCount");
const playerHandCountEl = document.getElementById("playerHandCount");
const enemyHandCountEl = document.getElementById("enemyHandCount");

const turnTextEl = document.getElementById("turnText");
const messageEl = document.getElementById("message");
const deckNameEl = document.getElementById("deckName");

const menuWinsEl = document.getElementById("menuWins");
const menuLossesEl = document.getElementById("menuLosses");

const endTurnBtn = document.getElementById("endTurnBtn");
const restartBtn = document.getElementById("restartBtn");
const backMenuBtn = document.getElementById("backMenuBtn");
const toggleLogBtn = document.getElementById("toggleLogBtn");
const logWrapper = document.getElementById("logWrapper");

const MAX_FIELD_SIZE = 5;
const STARTING_LIFE = 30;
const STARTING_HAND = 5;

let selectedDeck = "balanced";
let game;

const deckLabels = {
  fire: "🔥 Mazzo Fuoco",
  water: "🌊 Mazzo Acqua",
  forest: "🌿 Mazzo Foresta",
  shadow: "🌑 Mazzo Ombra",
  light: "☀️ Mazzo Luce",
  balanced: "⚔️ Mazzo Bilanciato"
};

const families = {
  fire: {
    label: "Fuoco",
    icon: "🔥",
    cards: [
      {
        name: "Scintilla",
        stage: 1,
        attack: 2,
        hp: 3,
        cost: 1,
        rarity: "common",
        desc: "Piccola creatura di fuoco.",
        effect: null
      },
      {
        name: "Lupo Ardente",
        stage: 2,
        attack: 4,
        hp: 5,
        cost: 2,
        rarity: "rare",
        desc: "Infligge 1 danno diretto.",
        effect: "burnEnemy"
      },
      {
        name: "Drago Solare",
        stage: 3,
        attack: 7,
        hp: 8,
        cost: 4,
        rarity: "legendary",
        desc: "Infligge 2 danni a tutti i nemici.",
        effect: "fireStorm"
      }
    ]
  },

  water: {
    label: "Acqua",
    icon: "🌊",
    cards: [
      {
        name: "Goccia Viva",
        stage: 1,
        attack: 1,
        hp: 4,
        cost: 1,
        rarity: "common",
        desc: "Creatura resistente.",
        effect: null
      },
      {
        name: "Serpente Marino",
        stage: 2,
        attack: 3,
        hp: 7,
        cost: 2,
        rarity: "rare",
        desc: "Cura 2 vita.",
        effect: "healOwner"
      },
      {
        name: "Titano Abissale",
        stage: 3,
        attack: 6,
        hp: 11,
        cost: 4,
        rarity: "epic",
        desc: "Pesca una carta.",
        effect: "drawOne"
      }
    ]
  },

  forest: {
    label: "Foresta",
    icon: "🌿",
    cards: [
      {
        name: "Radice",
        stage: 1,
        attack: 2,
        hp: 2,
        cost: 1,
        rarity: "common",
        desc: "Economica e veloce.",
        effect: null
      },
      {
        name: "Guardiano Verde",
        stage: 2,
        attack: 5,
        hp: 4,
        cost: 2,
        rarity: "rare",
        desc: "Dà +1 ATK a un alleato.",
        effect: "buffAllyAttack"
      },
      {
        name: "Antico Verde",
        stage: 3,
        attack: 8,
        hp: 7,
        cost: 4,
        rarity: "epic",
        desc: "Dà +2 HP a tutti gli alleati.",
        effect: "buffTeamHp"
      }
    ]
  },

  shadow: {
    label: "Ombra",
    icon: "🌑",
    cards: [
      {
        name: "Ombra Minore",
        stage: 1,
        attack: 3,
        hp: 2,
        cost: 1,
        rarity: "common",
        desc: "Aggressiva ma fragile.",
        effect: null
      },
      {
        name: "Spettro Nero",
        stage: 2,
        attack: 5,
        hp: 5,
        cost: 3,
        rarity: "rare",
        desc: "Toglie 1 ATK a un nemico.",
        effect: "weakenEnemy"
      },
      {
        name: "Signore Eclissi",
        stage: 3,
        attack: 9,
        hp: 6,
        cost: 5,
        rarity: "legendary",
        desc: "Infligge 3 danni diretti.",
        effect: "darkBlast"
      }
    ]
  },

  light: {
    label: "Luce",
    icon: "☀️",
    cards: [
      {
        name: "Lumina",
        stage: 1,
        attack: 1,
        hp: 5,
        cost: 1,
        rarity: "common",
        desc: "Base difensiva.",
        effect: null
      },
      {
        name: "Cavaliere Alba",
        stage: 2,
        attack: 4,
        hp: 6,
        cost: 3,
        rarity: "rare",
        desc: "Cura tutti gli alleati di 1.",
        effect: "healTeam"
      },
      {
        name: "Arcangelo Aureo",
        stage: 3,
        attack: 7,
        hp: 9,
        cost: 5,
        rarity: "legendary",
        desc: "Cura 4 vita.",
        effect: "bigHealOwner"
      }
    ]
  }
};

const spellTemplates = [
  {
    type: "spell",
    name: "Palla Fuoco",
    cost: 2,
    rarity: "common",
    icon: "☄️",
    desc: "3 danni a un nemico.",
    effect: "spellFireball",
    decks: ["fire", "balanced"]
  },
  {
    type: "spell",
    name: "Cura Rapida",
    cost: 2,
    rarity: "common",
    icon: "💧",
    desc: "Cura 4 vita.",
    effect: "spellHeal",
    decks: ["water", "light", "balanced"]
  },
  {
    type: "spell",
    name: "Richiamo",
    cost: 1,
    rarity: "rare",
    icon: "📜",
    desc: "Pesca 2 carte.",
    effect: "spellDrawTwo",
    decks: ["water", "forest", "balanced"]
  },
  {
    type: "spell",
    name: "Benedizione",
    cost: 3,
    rarity: "rare",
    icon: "✨",
    desc: "+1 ATK e +1 HP al tuo campo.",
    effect: "spellBlessing",
    decks: ["light", "forest", "balanced"]
  },
  {
    type: "spell",
    name: "Tempesta",
    cost: 4,
    rarity: "epic",
    icon: "🌀",
    desc: "2 danni a tutti i nemici.",
    effect: "spellStorm",
    decks: ["shadow", "fire", "balanced"]
  },
  {
    type: "spell",
    name: "Energia Antica",
    cost: 0,
    rarity: "legendary",
    icon: "🔮",
    desc: "+2 energia nel turno.",
    effect: "spellGainEnergy",
    decks: ["balanced", "shadow", "light"]
  }
];

function uid() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return String(Date.now()) + Math.random().toString(16).slice(2);
}

function showMenu() {
  gameScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  renderMenuStats();
}

function showGame() {
  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
}

function startGame(deckType = selectedDeck) {
  selectedDeck = deckType;

  game = {
    player: createPlayer(selectedDeck),
    enemy: createPlayer("balanced"),
    turn: "player",
    turnNumber: 1,
    ended: false,
    resultSaved: false,
    log: []
  };

  for (let i = 0; i < STARTING_HAND; i++) {
    drawCard(game.player);
    drawCard(game.enemy);
  }

  deckNameEl.textContent = deckLabels[selectedDeck];
  showGame();

  addLog("La partita comincia.");
  startPlayerTurn();
}

function createPlayer(deckType) {
  return {
    life: STARTING_LIFE,
    energy: 0,
    maxEnergy: 0,
    deck: createDeck(deckType),
    hand: [],
    field: []
  };
}

function createDeck(deckType) {
  const deck = [];
  const familyKeys = getFamiliesForDeck(deckType);

  familyKeys.forEach(familyKey => {
    const family = families[familyKey];

    family.cards.forEach(template => {
      let copies = 2;

      if (template.stage === 1) copies = deckType === "balanced" ? 2 : 5;
      if (template.stage === 2) copies = deckType === "balanced" ? 2 : 4;
      if (template.stage === 3) copies = deckType === "balanced" ? 1 : 3;

      for (let i = 0; i < copies; i++) {
        deck.push(createCreatureCard(familyKey, template));
      }
    });
  });

  spellTemplates.forEach(spell => {
    if (!spell.decks.includes(deckType)) return;

    const copies = spell.rarity === "legendary" ? 1 : 2;

    for (let i = 0; i < copies; i++) {
      deck.push(createSpellCard(spell));
    }
  });

  while (deck.length < 34) {
    const randomFamily = randomItem(familyKeys);
    deck.push(createCreatureCard(randomFamily, families[randomFamily].cards[0]));
  }

  return shuffle(deck);
}

function getFamiliesForDeck(deckType) {
  if (deckType === "balanced") {
    return ["fire", "water", "forest", "shadow", "light"];
  }

  const supportMap = {
    fire: ["fire", "shadow"],
    water: ["water", "light"],
    forest: ["forest", "water"],
    shadow: ["shadow", "fire"],
    light: ["light", "forest"]
  };

  return supportMap[deckType] || ["fire", "water", "forest", "shadow", "light"];
}

function createCreatureCard(familyKey, template) {
  return {
    id: uid(),
    type: "creature",
    family: familyKey,
    icon: families[familyKey].icon,
    currentHp: template.hp,
    maxHp: template.hp,
    attack: template.attack,
    canAttack: false,
    hasAttacked: false,
    ...template
  };
}

function createSpellCard(template) {
  return {
    id: uid(),
    ...template
  };
}

function shuffle(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(item => item.value);
}

function drawCard(owner) {
  if (owner.deck.length === 0) {
    owner.life -= 1;
    addLog("Mazzo vuoto: perde 1 vita.");
    return null;
  }

  const card = owner.deck.shift();
  owner.hand.push(card);
  return card;
}

function startPlayerTurn() {
  if (game.ended) return;

  game.turn = "player";
  game.player.maxEnergy = Math.min(10, game.player.maxEnergy + 1);
  game.player.energy = game.player.maxEnergy;

  prepareCreatures(game.player);
  drawCard(game.player);

  setMessage("Tuo turno: gioca, evolvi o attacca.");
  addLog(`<strong>Turno ${game.turnNumber}</strong>: inizi tu.`);
  render();
}

function startEnemyTurn() {
  if (game.ended) return;

  game.turn = "enemy";
  game.enemy.maxEnergy = Math.min(10, game.enemy.maxEnergy + 1);
  game.enemy.energy = game.enemy.maxEnergy;

  prepareCreatures(game.enemy);
  drawCard(game.enemy);

  setMessage("Turno nemico.");
  addLog(`<strong>Turno ${game.turnNumber}</strong>: nemico.`);
  render();

  setTimeout(enemyPlay, 450);
}

function prepareCreatures(owner) {
  owner.field.forEach(card => {
    card.canAttack = true;
    card.hasAttacked = false;
  });
}

function enemyPlay() {
  if (game.ended) return;

  let actions = 0;
  let played = true;

  while (played && actions < 10) {
    played = false;
    actions++;

    const evolution = findEnemyEvolution();

    if (evolution) {
      evolveCreature(game.enemy, evolution.card.id, evolution.index, false);
      played = true;
      continue;
    }

    const spell = game.enemy.hand.find(card =>
      card.type === "spell" &&
      card.cost <= game.enemy.energy &&
      shouldEnemyUseSpell(card)
    );

    if (spell) {
      playSpell(game.enemy, game.player, spell.id, false);
      played = true;
      continue;
    }

    const summon = game.enemy.hand.find(card =>
      card.type === "creature" &&
      card.stage === 1 &&
      card.cost <= game.enemy.energy
    );

    if (summon && game.enemy.field.length < MAX_FIELD_SIZE) {
      playCreature(game.enemy, summon.id, false);
      played = true;
    }
  }

  render();

  setTimeout(enemyAttack, 550);
}

function findEnemyEvolution() {
  for (const card of game.enemy.hand) {
    if (card.type !== "creature") continue;
    if (card.stage === 1) continue;
    if (card.cost > game.enemy.energy) continue;

    const index = game.enemy.field.findIndex(fieldCard =>
      fieldCard.family === card.family &&
      fieldCard.stage === card.stage - 1
    );

    if (index !== -1) {
      return { card, index };
    }
  }

  return null;
}

function shouldEnemyUseSpell(card) {
  if (card.effect === "spellHeal") return game.enemy.life <= 22;
  if (card.effect === "spellDrawTwo") return game.enemy.hand.length <= 3;
  if (card.effect === "spellBlessing") return game.enemy.field.length >= 2;
  if (card.effect === "spellStorm") return game.player.field.length >= 2;
  if (card.effect === "spellGainEnergy") return game.enemy.hand.some(c => c.cost > game.enemy.energy);
  if (card.effect === "spellFireball") return true;
  return true;
}

function enemyAttack() {
  if (game.ended) return;

  const attackers = [...game.enemy.field];

  attackers.forEach(attacker => {
    if (game.ended) return;
    if (!game.enemy.field.includes(attacker)) return;
    if (!attacker.canAttack || attacker.hasAttacked) return;

    if (game.player.field.length > 0) {
      const targetIndex = chooseLowestHpTarget(game.player.field);
      const target = game.player.field[targetIndex];

      if (target) {
        fight(attacker, target, game.enemy, game.player);
      }
    } else {
      attackLife(attacker, game.player);
      addLog(`Nemico: <strong>${attacker.name}</strong> fa ${attacker.attack} danni.`);
    }

    checkGameOver();
  });

  render();

  if (!game.ended) {
    setTimeout(() => {
      game.turnNumber++;
      startPlayerTurn();
    }, 700);
  }
}

function chooseLowestHpTarget(field) {
  let result = 0;
  let hp = Infinity;

  field.forEach((card, index) => {
    if (card.currentHp < hp) {
      hp = card.currentHp;
      result = index;
    }
  });

  return result;
}

function playCreature(owner, cardId, isPlayer = true) {
  if (owner.field.length >= MAX_FIELD_SIZE) {
    setMessage("Campo pieno.");
    return false;
  }

  const index = owner.hand.findIndex(card => card.id === cardId);
  if (index === -1) return false;

  const card = owner.hand[index];

  if (card.type !== "creature") return false;

  if (card.stage !== 1) {
    setMessage("Puoi evocare solo Evo 1.");
    return false;
  }

  if (owner.energy < card.cost) {
    setMessage("Energia insufficiente.");
    return false;
  }

  owner.energy -= card.cost;
  owner.hand.splice(index, 1);

  card.canAttack = false;
  card.hasAttacked = true;

  owner.field.push(card);

  const who = isPlayer ? "Hai evocato" : "Nemico evoca";
  setMessage(`${who}: ${card.name}.`);
  addLog(`${who} <strong>${card.name}</strong>.`);

  applyEntryEffect(card, owner, getOpponent(owner));
  render();
  return true;
}

function evolveCreature(owner, cardId, fieldIndex, isPlayer = true) {
  const handIndex = owner.hand.findIndex(card => card.id === cardId);
  if (handIndex === -1) return false;

  const evolution = owner.hand[handIndex];
  const base = owner.field[fieldIndex];

  if (!base) return false;

  if (evolution.type !== "creature") return false;

  if (evolution.family !== base.family) {
    setMessage("Famiglia sbagliata.");
    return false;
  }

  if (evolution.stage !== base.stage + 1) {
    setMessage("Serve evoluzione successiva.");
    return false;
  }

  if (owner.energy < evolution.cost) {
    setMessage("Energia insufficiente.");
    return false;
  }

  owner.energy -= evolution.cost;
  owner.hand.splice(handIndex, 1);

  const evolved = {
    ...evolution,
    id: uid(),
    currentHp: evolution.hp,
    maxHp: evolution.hp,
    attack: evolution.attack,
    canAttack: base.canAttack,
    hasAttacked: base.hasAttacked
  };

  owner.field[fieldIndex] = evolved;

  const who = isPlayer ? "Hai evoluto" : "Nemico evolve";
  setMessage(`${base.name} → ${evolution.name}.`);
  addLog(`${who} <strong>${base.name}</strong> in <strong>${evolution.name}</strong>.`);

  applyEntryEffect(evolved, owner, getOpponent(owner));
  render();
  return true;
}

function playSpell(owner, opponent, cardId, isPlayer = true) {
  const index = owner.hand.findIndex(card => card.id === cardId);
  if (index === -1) return false;

  const spell = owner.hand[index];

  if (spell.type !== "spell") return false;

  if (owner.energy < spell.cost) {
    setMessage("Energia insufficiente.");
    return false;
  }

  owner.energy -= spell.cost;
  owner.hand.splice(index, 1);

  const who = isPlayer ? "Hai giocato" : "Nemico gioca";
  setMessage(`${who}: ${spell.name}.`);
  addLog(`${who} <strong>${spell.name}</strong>.`);

  applySpellEffect(spell, owner, opponent);
  checkGameOver();
  render();
  return true;
}

function applyEntryEffect(card, owner, opponent) {
  if (!card.effect) return;

  switch (card.effect) {
    case "burnEnemy":
      opponent.life -= 1;
      addLog(`${card.name}: 1 danno diretto.`);
      break;

    case "fireStorm":
      opponent.field.forEach(enemy => enemy.currentHp -= 2);
      addLog(`${card.name}: 2 danni al campo nemico.`);
      removeDeadCreatures(opponent);
      break;

    case "healOwner":
      owner.life = Math.min(STARTING_LIFE, owner.life + 2);
      addLog(`${card.name}: cura 2 vita.`);
      break;

    case "drawOne":
      drawCard(owner);
      addLog(`${card.name}: pesca 1 carta.`);
      break;

    case "buffAllyAttack":
      if (owner.field.length > 0) {
        const ally = randomItem(owner.field);
        ally.attack += 1;
        addLog(`${card.name}: +1 ATK a ${ally.name}.`);
      }
      break;

    case "buffTeamHp":
      owner.field.forEach(ally => {
        ally.maxHp += 2;
        ally.currentHp += 2;
      });
      addLog(`${card.name}: +2 HP al campo.`);
      break;

    case "weakenEnemy":
      if (opponent.field.length > 0) {
        const target = randomItem(opponent.field);
        target.attack = Math.max(0, target.attack - 1);
        addLog(`${card.name}: -1 ATK a ${target.name}.`);
      }
      break;

    case "darkBlast":
      opponent.life -= 3;
      addLog(`${card.name}: 3 danni diretti.`);
      break;

    case "healTeam":
      owner.field.forEach(ally => {
        ally.currentHp = Math.min(ally.maxHp, ally.currentHp + 1);
      });
      addLog(`${card.name}: cura il campo di 1.`);
      break;

    case "bigHealOwner":
      owner.life = Math.min(STARTING_LIFE, owner.life + 4);
      addLog(`${card.name}: cura 4 vita.`);
      break;
  }

  checkGameOver();
}

function applySpellEffect(spell, owner, opponent) {
  switch (spell.effect) {
    case "spellFireball":
      if (opponent.field.length > 0) {
        const target = randomItem(opponent.field);
        target.currentHp -= 3;
        addLog(`${spell.name}: 3 danni a ${target.name}.`);
        removeDeadCreatures(opponent);
      } else {
        opponent.life -= 3;
        addLog(`${spell.name}: 3 danni diretti.`);
      }
      break;

    case "spellHeal":
      owner.life = Math.min(STARTING_LIFE, owner.life + 4);
      addLog(`${spell.name}: cura 4 vita.`);
      break;

    case "spellDrawTwo":
      drawCard(owner);
      drawCard(owner);
      addLog(`${spell.name}: pesca 2 carte.`);
      break;

    case "spellBlessing":
      owner.field.forEach(ally => {
        ally.attack += 1;
        ally.maxHp += 1;
        ally.currentHp += 1;
      });
      addLog(`${spell.name}: +1 ATK/+1 HP al campo.`);
      break;

    case "spellStorm":
      opponent.field.forEach(enemy => enemy.currentHp -= 2);
      addLog(`${spell.name}: 2 danni al campo nemico.`);
      removeDeadCreatures(opponent);
      break;

    case "spellGainEnergy":
      owner.energy += 2;
      addLog(`${spell.name}: +2 energia.`);
      break;
  }
}

function playerAttack(attackerIndex, targetIndex) {
  if (game.turn !== "player" || game.ended) return;

  const attacker = game.player.field[attackerIndex];

  if (!attacker) return;

  if (!attacker.canAttack || attacker.hasAttacked) {
    setMessage("Questa creatura non può attaccare.");
    return;
  }

  if (targetIndex === "life") {
    if (game.enemy.field.length > 0) {
      setMessage("Prima elimina le creature nemiche.");
      return;
    }

    attackLife(attacker, game.enemy);
    addLog(`${attacker.name}: ${attacker.attack} danni diretti.`);
  } else {
    const target = game.enemy.field[targetIndex];
    if (!target) return;

    fight(attacker, target, game.player, game.enemy);
  }

  checkGameOver();
  render();
}

function attackLife(attacker, defenderOwner) {
  defenderOwner.life -= attacker.attack;
  attacker.hasAttacked = true;
}

function fight(attacker, defender, attackerOwner, defenderOwner) {
  defender.currentHp -= attacker.attack;
  attacker.currentHp -= defender.attack;
  attacker.hasAttacked = true;

  setMessage(`${attacker.name} combatte ${defender.name}.`);
  addLog(`<strong>${attacker.name}</strong> vs <strong>${defender.name}</strong>.`);

  removeDeadCreatures(attackerOwner);
  removeDeadCreatures(defenderOwner);
}

function removeDeadCreatures(owner) {
  const before = owner.field.length;
  owner.field = owner.field.filter(card => card.currentHp > 0);

  const dead = before - owner.field.length;

  if (dead > 0) {
    addLog(`${dead} creatura/e eliminate.`);
  }
}

function getOpponent(owner) {
  return owner === game.player ? game.enemy : game.player;
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function checkGameOver() {
  if (game.ended) return;

  if (game.player.life <= 0) {
    game.player.life = 0;
    game.ended = true;
    setMessage("Hai perso.");
    addLog("<strong>Hai perso.</strong>");
    saveResult("loss");
  }

  if (game.enemy.life <= 0) {
    game.enemy.life = 0;
    game.ended = true;
    setMessage("Hai vinto.");
    addLog("<strong>Hai vinto.</strong>");
    saveResult("win");
  }
}

function saveResult(result) {
  if (game.resultSaved) return;

  game.resultSaved = true;

  const stats = getStats();

  if (result === "win") stats.wins += 1;
  if (result === "loss") stats.losses += 1;

  localStorage.setItem("creatureEvolutionStats", JSON.stringify(stats));
  renderMenuStats();
}

function getStats() {
  const raw = localStorage.getItem("creatureEvolutionStats");

  if (!raw) {
    return {
      wins: 0,
      losses: 0
    };
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {
      wins: 0,
      losses: 0
    };
  }
}

function renderMenuStats() {
  const stats = getStats();

  menuWinsEl.textContent = stats.wins;
  menuLossesEl.textContent = stats.losses;
}

function addLog(text) {
  if (!game) return;

  game.log.unshift(text);

  if (game.log.length > 30) {
    game.log.pop();
  }

  renderLog();
}

function renderLog() {
  if (!game) return;

  battleLogEl.innerHTML = "";

  game.log.forEach(entry => {
    const div = document.createElement("div");
    div.className = "log-entry";
    div.innerHTML = entry;
    battleLogEl.appendChild(div);
  });
}

function setMessage(text) {
  messageEl.textContent = text;
}

function render() {
  playerLifeEl.textContent = game.player.life;
  enemyLifeEl.textContent = game.enemy.life;

  playerEnergyEl.textContent = game.player.energy;
  enemyEnergyEl.textContent = game.enemy.energy;

  playerMaxEnergyEl.textContent = game.player.maxEnergy;
  enemyMaxEnergyEl.textContent = game.enemy.maxEnergy;

  playerDeckCountEl.textContent = game.player.deck.length;
  enemyDeckCountEl.textContent = game.enemy.deck.length;

  playerHandCountEl.textContent = game.player.hand.length;
  enemyHandCountEl.textContent = game.enemy.hand.length;

  turnTextEl.textContent = game.turn === "player" ? "Tuo turno" : "Turno nemico";

  document.querySelector(".hud-box.center").classList.toggle("game-over", game.ended);

  renderLog();
  renderHand();
  renderField(playerFieldEl, game.player.field, "player");
  renderField(enemyFieldEl, game.enemy.field, "enemy");

  endTurnBtn.disabled = game.turn !== "player" || game.ended;
}

function renderHand() {
  playerHandEl.innerHTML = "";

  game.player.hand.forEach(card => {
    const cardEl = createCardEl(card, "hand-card");

    const actions = document.createElement("div");
    actions.className = "card-actions";

    if (game.turn !== "player" || game.ended) {
      const info = document.createElement("small");
      info.textContent = "Non ora";
      actions.appendChild(info);
      cardEl.appendChild(actions);
      playerHandEl.appendChild(cardEl);
      return;
    }

    if (card.type === "spell") {
      const btn = document.createElement("button");
      btn.textContent = "Gioca";
      btn.disabled = game.player.energy < card.cost;
      btn.onclick = () => playSpell(game.player, game.enemy, card.id, true);
      actions.appendChild(btn);
    }

    if (card.type === "creature" && card.stage === 1) {
      const btn = document.createElement("button");
      btn.textContent = "Evoca";
      btn.disabled = game.player.energy < card.cost || game.player.field.length >= MAX_FIELD_SIZE;
      btn.onclick = () => playCreature(game.player, card.id, true);
      actions.appendChild(btn);
    }

    if (card.type === "creature" && card.stage > 1) {
      const targets = game.player.field
        .map((fieldCard, index) => ({ fieldCard, index }))
        .filter(item =>
          item.fieldCard.family === card.family &&
          item.fieldCard.stage === card.stage - 1
        );

      if (targets.length === 0) {
        const info = document.createElement("small");
        info.textContent = "Serve base";
        actions.appendChild(info);
      }

      targets.forEach(item => {
        const btn = document.createElement("button");
        btn.textContent = `Evolvi`;
        btn.disabled = game.player.energy < card.cost;
        btn.onclick = () => evolveCreature(game.player, card.id, item.index, true);
        actions.appendChild(btn);
      });
    }

    cardEl.appendChild(actions);
    playerHandEl.appendChild(cardEl);
  });
}

function renderField(container, field, owner) {
  container.innerHTML = "";

  if (field.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-field";
    empty.textContent = "Nessuna creatura";
    container.appendChild(empty);
    return;
  }

  field.forEach((card, index) => {
    const cardEl = createCardEl(card, owner === "player" ? "player-card" : "enemy-card");

    if (!card.canAttack) cardEl.classList.add("sleeping");
    if (card.hasAttacked) cardEl.classList.add("attacked");

    const actions = document.createElement("div");
    actions.className = "card-actions";

    if (owner === "player") {
      if (game.turn === "player" && !game.ended && card.canAttack && !card.hasAttacked) {
        if (game.enemy.field.length === 0) {
          const btn = document.createElement("button");
          btn.textContent = "Vita";
          btn.onclick = () => playerAttack(index, "life");
          actions.appendChild(btn);
        } else {
          game.enemy.field.forEach((enemyCard, enemyIndex) => {
            const btn = document.createElement("button");
            btn.textContent = `Atk ${enemyCard.name.slice(0, 7)}`;
            btn.onclick = () => playerAttack(index, enemyIndex);
            actions.appendChild(btn);
          });
        }
      } else {
        const info = document.createElement("small");

        if (game.turn !== "player") info.textContent = "Nemico";
        else if (card.hasAttacked) info.textContent = "Usata";
        else info.textContent = "Riposo";

        actions.appendChild(info);
      }
    }

    cardEl.appendChild(actions);
    container.appendChild(cardEl);
  });
}

function createCardEl(card, extraClass) {
  const cardEl = document.createElement("div");

  if (card.type === "creature") {
    cardEl.className = `card creature ${card.family} ${extraClass}`;
  } else {
    cardEl.className = `card spell-card ${extraClass}`;
  }

  if (card.type === "creature") {
    cardEl.innerHTML = `
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

        <div class="card-desc">${card.desc}</div>
      </div>

      <div>
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
    cardEl.innerHTML = `
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

  return cardEl;
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

document.querySelectorAll(".deck-btn").forEach(button => {
  button.addEventListener("click", () => {
    const deck = button.dataset.deck;
    startGame(deck);
  });
});

endTurnBtn.addEventListener("click", () => {
  if (game.turn !== "player" || game.ended) return;

  setMessage("Fine turno.");
  addLog("Hai terminato il turno.");
  render();

  setTimeout(startEnemyTurn, 450);
});

restartBtn.addEventListener("click", () => {
  startGame(selectedDeck);
});

backMenuBtn.addEventListener("click", () => {
  showMenu();
});

toggleLogBtn.addEventListener("click", () => {
  logWrapper.classList.toggle("collapsed");
});

renderMenuStats();