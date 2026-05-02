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
const levelTextEl = document.getElementById("levelText");
const enemyTitleEl = document.getElementById("enemyTitle");

const menuWinsEl = document.getElementById("menuWins");
const menuLossesEl = document.getElementById("menuLosses");
const menuMaxLevelEl = document.getElementById("menuMaxLevel");
const menuUnlockedEl = document.getElementById("menuUnlocked");

const endTurnBtn = document.getElementById("endTurnBtn");
const restartBtn = document.getElementById("restartBtn");
const backMenuBtn = document.getElementById("backMenuBtn");
const toggleLogBtn = document.getElementById("toggleLogBtn");
const logWrapper = document.getElementById("logWrapper");

const resultModal = document.getElementById("resultModal");
const resultIcon = document.getElementById("resultIcon");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");
const rewardBox = document.getElementById("rewardBox");
const rewardText = document.getElementById("rewardText");
const nextLevelBtn = document.getElementById("nextLevelBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const modalMenuBtn = document.getElementById("modalMenuBtn");

const collectionBtn = document.getElementById("collectionBtn");
const collectionPanel = document.getElementById("collectionPanel");
const closeCollectionBtn = document.getElementById("closeCollectionBtn");
const collectionList = document.getElementById("collectionList");
const resetProgressBtn = document.getElementById("resetProgressBtn");

const MAX_FIELD_SIZE = 5;
const STARTING_LIFE = 30;
const STARTING_HAND = 5;

let selectedDeck = "balanced";
let currentLevel = 1;
let game;

const deckLabels = {
  fire: "🔥 Mazzo Fuoco",
  water: "🌊 Mazzo Acqua",
  forest: "🌿 Mazzo Foresta",
  shadow: "🌑 Mazzo Ombra",
  light: "☀️ Mazzo Luce",
  balanced: "⚔️ Mazzo Bilanciato"
};

const abilityLabels = {
  guard: "Guardia",
  haste: "Rapidità",
  flying: "Volare",
  rage: "Rabbia",
  poison: "Veleno"
};

const allUnlockableIds = [
  "fire_stage3",
  "water_stage3",
  "forest_stage3",
  "shadow_stage3",
  "light_stage3",
  "spell_storm",
  "spell_energy",
  "spell_blessing"
];

const families = {
  fire: {
    label: "Fuoco",
    icon: "🔥",
    cards: [
      {
        cardId: "fire_stage1",
        name: "Scintilla",
        stage: 1,
        attack: 2,
        hp: 3,
        cost: 1,
        rarity: "common",
        desc: "Piccola creatura di fuoco.",
        effect: null,
        abilities: []
      },
      {
        cardId: "fire_stage2",
        name: "Lupo Ardente",
        stage: 2,
        attack: 4,
        hp: 5,
        cost: 2,
        rarity: "rare",
        desc: "Infligge 1 danno diretto.",
        effect: "burnEnemy",
        abilities: ["haste"]
      },
      {
        cardId: "fire_stage3",
        name: "Drago Solare",
        stage: 3,
        attack: 7,
        hp: 8,
        cost: 4,
        rarity: "legendary",
        desc: "Infligge 2 danni al campo nemico.",
        effect: "fireStorm",
        abilities: ["flying"],
        locked: true
      }
    ]
  },

  water: {
    label: "Acqua",
    icon: "🌊",
    cards: [
      {
        cardId: "water_stage1",
        name: "Goccia Viva",
        stage: 1,
        attack: 1,
        hp: 4,
        cost: 1,
        rarity: "common",
        desc: "Creatura resistente.",
        effect: null,
        abilities: ["guard"]
      },
      {
        cardId: "water_stage2",
        name: "Serpente Marino",
        stage: 2,
        attack: 3,
        hp: 7,
        cost: 2,
        rarity: "rare",
        desc: "Cura 2 vita.",
        effect: "healOwner",
        abilities: ["guard"]
      },
      {
        cardId: "water_stage3",
        name: "Titano Abissale",
        stage: 3,
        attack: 6,
        hp: 11,
        cost: 4,
        rarity: "epic",
        desc: "Pesca una carta.",
        effect: "drawOne",
        abilities: ["guard"],
        locked: true
      }
    ]
  },

  forest: {
    label: "Foresta",
    icon: "🌿",
    cards: [
      {
        cardId: "forest_stage1",
        name: "Radice",
        stage: 1,
        attack: 2,
        hp: 2,
        cost: 1,
        rarity: "common",
        desc: "Economica e veloce.",
        effect: null,
        abilities: []
      },
      {
        cardId: "forest_stage2",
        name: "Guardiano Verde",
        stage: 2,
        attack: 5,
        hp: 4,
        cost: 2,
        rarity: "rare",
        desc: "Dà +1 ATK a un alleato.",
        effect: "buffAllyAttack",
        abilities: ["rage"]
      },
      {
        cardId: "forest_stage3",
        name: "Antico Verde",
        stage: 3,
        attack: 8,
        hp: 7,
        cost: 4,
        rarity: "epic",
        desc: "Dà +2 HP al campo.",
        effect: "buffTeamHp",
        abilities: ["rage"],
        locked: true
      }
    ]
  },

  shadow: {
    label: "Ombra",
    icon: "🌑",
    cards: [
      {
        cardId: "shadow_stage1",
        name: "Ombra Minore",
        stage: 1,
        attack: 3,
        hp: 2,
        cost: 1,
        rarity: "common",
        desc: "Aggressiva ma fragile.",
        effect: null,
        abilities: ["poison"]
      },
      {
        cardId: "shadow_stage2",
        name: "Spettro Nero",
        stage: 2,
        attack: 5,
        hp: 5,
        cost: 3,
        rarity: "rare",
        desc: "Toglie 1 ATK a un nemico.",
        effect: "weakenEnemy",
        abilities: ["poison"]
      },
      {
        cardId: "shadow_stage3",
        name: "Signore Eclissi",
        stage: 3,
        attack: 9,
        hp: 6,
        cost: 5,
        rarity: "legendary",
        desc: "Infligge 3 danni diretti.",
        effect: "darkBlast",
        abilities: ["poison", "flying"],
        locked: true
      }
    ]
  },

  light: {
    label: "Luce",
    icon: "☀️",
    cards: [
      {
        cardId: "light_stage1",
        name: "Lumina",
        stage: 1,
        attack: 1,
        hp: 5,
        cost: 1,
        rarity: "common",
        desc: "Base difensiva.",
        effect: null,
        abilities: ["guard"]
      },
      {
        cardId: "light_stage2",
        name: "Cavaliere Alba",
        stage: 2,
        attack: 4,
        hp: 6,
        cost: 3,
        rarity: "rare",
        desc: "Cura il campo di 1.",
        effect: "healTeam",
        abilities: []
      },
      {
        cardId: "light_stage3",
        name: "Arcangelo Aureo",
        stage: 3,
        attack: 7,
        hp: 9,
        cost: 5,
        rarity: "legendary",
        desc: "Cura 4 vita.",
        effect: "bigHealOwner",
        abilities: ["flying", "guard"],
        locked: true
      }
    ]
  }
};

const spellTemplates = [
  {
    cardId: "spell_fireball",
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
    cardId: "spell_heal",
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
    cardId: "spell_draw",
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
    cardId: "spell_blessing",
    type: "spell",
    name: "Benedizione",
    cost: 3,
    rarity: "rare",
    icon: "✨",
    desc: "+1 ATK e +1 HP al campo.",
    effect: "spellBlessing",
    decks: ["light", "forest", "balanced"],
    locked: true
  },
  {
    cardId: "spell_storm",
    type: "spell",
    name: "Tempesta",
    cost: 4,
    rarity: "epic",
    icon: "🌀",
    desc: "2 danni a tutti i nemici.",
    effect: "spellStorm",
    decks: ["shadow", "fire", "balanced"],
    locked: true
  },
  {
    cardId: "spell_energy",
    type: "spell",
    name: "Energia Antica",
    cost: 0,
    rarity: "legendary",
    icon: "🔮",
    desc: "+2 energia nel turno.",
    effect: "spellGainEnergy",
    decks: ["balanced", "shadow", "light"],
    locked: true
  }
];

function uid() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return String(Date.now()) + Math.random().toString(16).slice(2);
}

function getDefaultProgress() {
  return {
    wins: 0,
    losses: 0,
    maxLevel: 1,
    unlocked: []
  };
}

function getProgress() {
  const raw = localStorage.getItem("creatureEvolutionProgress");

  if (!raw) return getDefaultProgress();

  try {
    const parsed = JSON.parse(raw);
    return {
      ...getDefaultProgress(),
      ...parsed,
      unlocked: Array.isArray(parsed.unlocked) ? parsed.unlocked : []
    };
  } catch {
    return getDefaultProgress();
  }
}

function saveProgress(progress) {
  localStorage.setItem("creatureEvolutionProgress", JSON.stringify(progress));
}

function isUnlocked(cardId) {
  const progress = getProgress();
  return progress.unlocked.includes(cardId);
}

function isCardAvailable(template, ignoreLocks = false) {
  if (ignoreLocks) return true;
  if (!template.locked) return true;
  return isUnlocked(template.cardId);
}

function showMenu() {
  resultModal.classList.add("hidden");
  gameScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  renderMenuStats();
  renderCollection();
}

function showGame() {
  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
}

function startGame(deckType = selectedDeck, level = currentLevel) {
  selectedDeck = deckType;
  currentLevel = level;

  const enemyInfo = getEnemyInfo(level);

  game = {
    player: createPlayer(selectedDeck, false, level),
    enemy: createEnemy(enemyInfo),
    enemyInfo,
    turn: "player",
    turnNumber: 1,
    ended: false,
    resultSaved: false,
    reward: null,
    log: []
  };

  for (let i = 0; i < STARTING_HAND; i++) {
    drawCard(game.player);
    drawCard(game.enemy);
  }

  deckNameEl.textContent = deckLabels[selectedDeck];
  levelTextEl.textContent = enemyInfo.isBoss ? `BOSS - Livello ${level}` : `Livello ${level}`;
  enemyTitleEl.textContent = enemyInfo.name;

  showGame();
  resultModal.classList.add("hidden");

  addLog(enemyInfo.isBoss ? `Boss in arrivo: <strong>${enemyInfo.name}</strong>.` : "La partita comincia.");
  startPlayerTurn();
}

function getEnemyInfo(level) {
  const isBoss = level % 3 === 0;
  const bossNames = [
    "Drago Antico",
    "Regina dell'Abisso",
    "Re delle Ombre",
    "Custode Solare"
  ];

  const normalDecks = ["fire", "water", "forest", "shadow", "light", "balanced"];
  const enemyDeck = isBoss ? "balanced" : normalDecks[(level - 1) % normalDecks.length];

  return {
    level,
    isBoss,
    deck: enemyDeck,
    name: isBoss ? bossNames[Math.floor((level / 3 - 1) % bossNames.length)] : `Nemico ${deckLabels[enemyDeck].replace(/^[^ ]+ /, "")}`,
    bonusLife: isBoss ? 8 + level : Math.floor(level / 2),
    bonusEnergy: isBoss ? 1 : 0,
    ignoreLocks: isBoss || level >= 4
  };
}

function createPlayer(deckType, ignoreLocks = false) {
  return {
    life: STARTING_LIFE,
    energy: 0,
    maxEnergy: 0,
    deck: createDeck(deckType, ignoreLocks),
    hand: [],
    field: []
  };
}

function createEnemy(enemyInfo) {
  const enemy = createPlayer(enemyInfo.deck, enemyInfo.ignoreLocks);
  enemy.life += enemyInfo.bonusLife;
  enemy.maxEnergy = enemyInfo.bonusEnergy;
  enemy.energy = enemyInfo.bonusEnergy;
  return enemy;
}

function createDeck(deckType, ignoreLocks = false) {
  const deck = [];
  const familyKeys = getFamiliesForDeck(deckType);

  familyKeys.forEach(familyKey => {
    const family = families[familyKey];

    family.cards.forEach(template => {
      if (!isCardAvailable(template, ignoreLocks)) return;

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
    if (!isCardAvailable(spell, ignoreLocks)) return;

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
    poisoned: false,
    canAttack: false,
    hasAttacked: false,
    abilities: [...(template.abilities || [])],
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

  applyPoisonDamage(game.player);
  prepareCreatures(game.player);
  drawCard(game.player);

  setMessage("Tuo turno: gioca, evolvi o attacca.");
  addLog(`<strong>Turno ${game.turnNumber}</strong>: inizi tu.`);
  checkGameOver();
  render();
}

function startEnemyTurn() {
  if (game.ended) return;

  game.turn = "enemy";
  game.enemy.maxEnergy = Math.min(10, game.enemy.maxEnergy + 1);
  game.enemy.energy = game.enemy.maxEnergy;

  applyPoisonDamage(game.enemy);
  prepareCreatures(game.enemy);
  drawCard(game.enemy);

  setMessage("Turno nemico.");
  addLog(`<strong>Turno ${game.turnNumber}</strong>: nemico.`);
  checkGameOver();
  render();

  setTimeout(enemyPlay, 450);
}

function applyPoisonDamage(owner) {
  owner.field.forEach(card => {
    if (card.poisoned) {
      card.currentHp -= 1;
      addLog(`<strong>${card.name}</strong> subisce 1 danno da veleno.`);
    }
  });

  removeDeadCreatures(owner);
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

  while (played && actions < 12) {
    played = false;
    actions++;

    const lethalSpell = findLethalSpell(game.enemy, game.player);
    if (lethalSpell) {
      playSpell(game.enemy, game.player, lethalSpell.id, false);
      played = true;
      continue;
    }

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

function findLethalSpell(owner, opponent) {
  return owner.hand.find(card => {
    if (card.type !== "spell") return false;
    if (card.cost > owner.energy) return false;
    if (card.effect === "spellFireball" && opponent.field.length === 0 && opponent.life <= 3) return true;
    if (card.effect === "spellStorm" && opponent.field.length === 0 && opponent.life <= 2) return true;
    return false;
  });
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
  if (card.effect === "spellHeal") return game.enemy.life <= STARTING_LIFE - 6;
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

    const guards = game.player.field.filter(card => hasAbility(card, "guard"));

    if (guards.length > 0) {
      const target = guards[0];
      fight(attacker, target, game.enemy, game.player);
    } else if (game.player.field.length > 0) {
      if (canAttackLife(attacker, game.player.field) && game.player.life <= attacker.attack) {
        attackLife(attacker, game.player);
        addLog(`Nemico: <strong>${attacker.name}</strong> fa ${attacker.attack} danni diretti.`);
      } else {
        const targetIndex = chooseLowestHpTarget(game.player.field);
        const target = game.player.field[targetIndex];

        if (target) {
          fight(attacker, target, game.enemy, game.player);
        }
      }
    } else {
      attackLife(attacker, game.player);
      addLog(`Nemico: <strong>${attacker.name}</strong> fa ${attacker.attack} danni diretti.`);
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

  card.canAttack = hasAbility(card, "haste");
  card.hasAttacked = !hasAbility(card, "haste");

  owner.field.push(card);

  const who = isPlayer ? "Hai evocato" : "Nemico evoca";
  setMessage(`${who}: ${card.name}.`);
  addLog(`${who} <strong>${card.name}</strong>.`);

  if (hasAbility(card, "haste")) {
    addLog(`<strong>${card.name}</strong> ha Rapidità e può attaccare subito.`);
  }

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
    poisoned: false,
    canAttack: base.canAttack || hasAbility(evolution, "haste"),
    hasAttacked: base.hasAttacked && !hasAbility(evolution, "haste"),
    abilities: [...(evolution.abilities || [])]
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
      owner.life = Math.min(STARTING_LIFE + 15, owner.life + 2);
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
      owner.life = Math.min(STARTING_LIFE + 15, owner.life + 4);
      addLog(`${card.name}: cura 4 vita.`);
      break;
  }

  checkGameOver();
}

function applySpellEffect(spell, owner, opponent) {
  switch (spell.effect) {
    case "spellFireball":
      if (opponent.field.length > 0) {
        const target = chooseSpellTarget(opponent.field);
        target.currentHp -= 3;
        applyRageIfDamaged(target);
        addLog(`${spell.name}: 3 danni a ${target.name}.`);
        removeDeadCreatures(opponent);
      } else {
        opponent.life -= 3;
        addLog(`${spell.name}: 3 danni diretti.`);
      }
      break;

    case "spellHeal":
      owner.life = Math.min(STARTING_LIFE + 15, owner.life + 4);
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
      opponent.field.forEach(enemy => {
        enemy.currentHp -= 2;
        applyRageIfDamaged(enemy);
      });
      addLog(`${spell.name}: 2 danni al campo nemico.`);
      removeDeadCreatures(opponent);
      break;

    case "spellGainEnergy":
      owner.energy += 2;
      addLog(`${spell.name}: +2 energia.`);
      break;
  }
}

function chooseSpellTarget(field) {
  const guards = field.filter(card => hasAbility(card, "guard"));
  if (guards.length > 0) return guards[0];

  let strongest = field[0];

  field.forEach(card => {
    if (card.attack > strongest.attack) strongest = card;
  });

  return strongest;
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
    if (!canAttackLife(attacker, game.enemy.field)) {
      setMessage("Prima elimina Guardia o creature che bloccano.");
      return;
    }

    attackLife(attacker, game.enemy);
    addLog(`${attacker.name}: ${attacker.attack} danni diretti.`);
  } else {
    const target = game.enemy.field[targetIndex];
    if (!target) return;

    const guards = game.enemy.field.filter(card => hasAbility(card, "guard"));

    if (guards.length > 0 && !hasAbility(target, "guard")) {
      setMessage("Devi attaccare prima una creatura con Guardia.");
      return;
    }

    fight(attacker, target, game.player, game.enemy);
  }

  checkGameOver();
  render();
}

function canAttackLife(attacker, defenderField) {
  if (defenderField.length === 0) return true;

  const hasGuard = defenderField.some(card => hasAbility(card, "guard"));
  if (hasGuard) return false;

  if (hasAbility(attacker, "flying")) {
    const enemyFlying = defenderField.some(card => hasAbility(card, "flying"));
    return !enemyFlying;
  }

  return false;
}

function attackLife(attacker, defenderOwner) {
  defenderOwner.life -= attacker.attack;
  attacker.hasAttacked = true;
}

function fight(attacker, defender, attackerOwner, defenderOwner) {
  defender.currentHp -= attacker.attack;
  attacker.currentHp -= defender.attack;
  attacker.hasAttacked = true;

  applyRageIfDamaged(attacker);
  applyRageIfDamaged(defender);

  if (hasAbility(attacker, "poison") && defender.currentHp > 0) {
    defender.poisoned = true;
    addLog(`<strong>${defender.name}</strong> è avvelenata.`);
  }

  if (hasAbility(defender, "poison") && attacker.currentHp > 0) {
    attacker.poisoned = true;
    addLog(`<strong>${attacker.name}</strong> è avvelenata.`);
  }

  setMessage(`${attacker.name} combatte ${defender.name}.`);
  addLog(`<strong>${attacker.name}</strong> vs <strong>${defender.name}</strong>.`);

  removeDeadCreatures(attackerOwner);
  removeDeadCreatures(defenderOwner);
}

function applyRageIfDamaged(card) {
  if (!card || card.currentHp <= 0) return;

  if (hasAbility(card, "rage")) {
    card.attack += 1;
    addLog(`<strong>${card.name}</strong> attiva Rabbia: +1 ATK.`);
  }
}

function removeDeadCreatures(owner) {
  const before = owner.field.length;
  owner.field = owner.field.filter(card => card.currentHp > 0);

  const dead = before - owner.field.length;

  if (dead > 0) {
    addLog(`${dead} creatura/e eliminate.`);
  }
}

function hasAbility(card, ability) {
  return Array.isArray(card.abilities) && card.abilities.includes(ability);
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
    showResult(false);
  }

  if (game.enemy.life <= 0) {
    game.enemy.life = 0;
    game.ended = true;
    setMessage("Hai vinto.");
    addLog("<strong>Hai vinto.</strong>");
    saveResult("win");
    showResult(true);
  }
}

function saveResult(result) {
  if (game.resultSaved) return;

  game.resultSaved = true;

  const progress = getProgress();

  if (result === "win") {
    progress.wins += 1;
    progress.maxLevel = Math.max(progress.maxLevel, currentLevel + 1);

    const unlockedCard = unlockReward(progress);
    game.reward = unlockedCard;
  }

  if (result === "loss") {
    progress.losses += 1;
  }

  saveProgress(progress);
  renderMenuStats();
}

function unlockReward(progress) {
  const available = allUnlockableIds.filter(id => !progress.unlocked.includes(id));

  if (available.length === 0) return null;

  let rewardId;

  if (game.enemyInfo.isBoss) {
    rewardId = available.find(id => id.includes("stage3")) || available[0];
  } else {
    rewardId = available[0];
  }

  progress.unlocked.push(rewardId);

  return getCardNameById(rewardId);
}

function getCardNameById(cardId) {
  for (const familyKey of Object.keys(families)) {
    const card = families[familyKey].cards.find(c => c.cardId === cardId);
    if (card) return `${card.name} (${families[familyKey].label})`;
  }

  const spell = spellTemplates.find(s => s.cardId === cardId);
  if (spell) return `${spell.name} (Magia)`;

  return cardId;
}

function showResult(won) {
  render();

  setTimeout(() => {
    resultModal.classList.remove("hidden");

    if (won) {
      resultIcon.textContent = game.enemyInfo.isBoss ? "👑" : "🏆";
      resultTitle.textContent = game.enemyInfo.isBoss ? "Boss sconfitto!" : "Vittoria!";
      resultText.textContent = `Hai superato il livello ${currentLevel} in ${game.turnNumber} turni.`;

      nextLevelBtn.classList.remove("hidden");

      if (game.reward) {
        rewardBox.classList.remove("hidden");
        rewardText.textContent = game.reward;
      } else {
        rewardBox.classList.add("hidden");
      }
    } else {
      resultIcon.textContent = "💀";
      resultTitle.textContent = "Sconfitta";
      resultText.textContent = `Sei stato sconfitto al livello ${currentLevel}. Riprova con un altro mazzo.`;
      nextLevelBtn.classList.add("hidden");
      rewardBox.classList.add("hidden");
    }
  }, 450);
}

function renderMenuStats() {
  const progress = getProgress();
  const unlockedCount = progress.unlocked.length;

  menuWinsEl.textContent = progress.wins;
  menuLossesEl.textContent = progress.losses;
  menuMaxLevelEl.textContent = progress.maxLevel;
  menuUnlockedEl.textContent = unlockedCount;
}

function renderCollection() {
  collectionList.innerHTML = "";

  const items = [];

  Object.keys(families).forEach(familyKey => {
    families[familyKey].cards.forEach(card => {
      items.push({
        id: card.cardId,
        name: card.name,
        type: families[familyKey].label,
        rarity: card.rarity,
        locked: card.locked && !isUnlocked(card.cardId)
      });
    });
  });

  spellTemplates.forEach(spell => {
    items.push({
      id: spell.cardId,
      name: spell.name,
      type: "Magia",
      rarity: spell.rarity,
      locked: spell.locked && !isUnlocked(spell.cardId)
    });
  });

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = `collection-item ${item.locked ? "locked" : ""}`;
    div.innerHTML = `
      <strong>${item.locked ? "🔒 " : "✅ "}${item.name}</strong>
      <span>${item.type} · ${shortRarity(item.rarity)}</span>
    `;
    collectionList.appendChild(div);
  });
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
        btn.textContent = "Evolvi";
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
    if (card.poisoned) cardEl.classList.add("poisoned");

    const actions = document.createElement("div");
    actions.className = "card-actions";

    if (owner === "player") {
      if (game.turn === "player" && !game.ended && card.canAttack && !card.hasAttacked) {
        if (canAttackLife(card, game.enemy.field)) {
          const btn = document.createElement("button");
          btn.textContent = "Vita";
          btn.onclick = () => playerAttack(index, "life");
          actions.appendChild(btn);
        }

        game.enemy.field.forEach((enemyCard, enemyIndex) => {
          const guards = game.enemy.field.filter(c => hasAbility(c, "guard"));
          const mustAttackGuard = guards.length > 0 && !hasAbility(enemyCard, "guard");

          const btn = document.createElement("button");
          btn.textContent = `Atk ${enemyCard.name.slice(0, 7)}`;
          btn.disabled = mustAttackGuard;
          btn.onclick = () => playerAttack(index, enemyIndex);
          actions.appendChild(btn);
        });
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
    cardEl.className = `card creature ${card.family} ${card.rarity} ${extraClass}`;
  } else {
    cardEl.className = `card spell-card ${card.rarity} ${extraClass}`;
  }

  if (card.type === "creature") {
    const hpPercent = Math.max(0, Math.min(100, Math.round((card.currentHp / card.maxHp) * 100)));
    const abilities = (card.abilities || [])
      .map(ability => `<span class="ability">${abilityLabels[ability]}</span>`)
      .join("");

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
    const progress = getProgress();
    const deck = button.dataset.deck;
    startGame(deck, progress.maxLevel || 1);
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
  startGame(selectedDeck, currentLevel);
});

backMenuBtn.addEventListener("click", () => {
  showMenu();
});

toggleLogBtn.addEventListener("click", () => {
  logWrapper.classList.toggle("collapsed");
});

nextLevelBtn.addEventListener("click", () => {
  startGame(selectedDeck, currentLevel + 1);
});

playAgainBtn.addEventListener("click", () => {
  startGame(selectedDeck, currentLevel);
});

modalMenuBtn.addEventListener("click", () => {
  showMenu();
});

collectionBtn.addEventListener("click", () => {
  collectionPanel.classList.remove("hidden");
  renderCollection();
});

closeCollectionBtn.addEventListener("click", () => {
  collectionPanel.classList.add("hidden");
});

resetProgressBtn.addEventListener("click", () => {
  const ok = confirm("Vuoi davvero cancellare vittorie, livelli e carte sbloccate?");
  if (!ok) return;

  localStorage.removeItem("creatureEvolutionProgress");
  renderMenuStats();
  renderCollection();
});

renderMenuStats();
renderCollection();