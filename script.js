import {
  firebaseReady,
  createMatchDoc,
  getMatchDoc,
  updateMatchDoc,
  listenMatchDoc,
  updateLeaderboardPlayer,
  getLeaderboardTop
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
const campaignBtn = $("campaignBtn");
const draftBtn = $("draftBtn");
const raidBtn = $("raidBtn");
const raidModal = $("raidModal");
const startRaidBtn = $("startRaidBtn");
const closeRaidBtn = $("closeRaidBtn");

const roomCodeText = $("roomCodeText");
const lobbyStatusText = $("lobbyStatusText");
const copyCodeBtn = $("copyCodeBtn");
const copyInviteLinkBtn = $("copyInviteLinkBtn");
const leaveLobbyBtn = $("leaveLobbyBtn");

const modeText = $("modeText");
const roomInfoText = $("roomInfoText");
const turnTimerText = $("turnTimerText");
const activeTerrainText = $("activeTerrainText");

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
const playerEnergyDotsEl = $("playerEnergyDots");
const enemyEnergyDotsEl = $("enemyEnergyDots");
const playerDeckCountEl = $("playerDeckCount");
const enemyDeckCountEl = $("enemyDeckCount");
const playerHandCountEl = $("playerHandCount");
const enemyHandCountEl = $("enemyHandCount");

const enemyNameEl = $("enemyName");
const playerNameText = $("playerNameText");
const turnTextEl = $("turnText");
const messageEl = $("message");
const cancelAttackBtn = $("cancelAttackBtn");

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
const detailAbilityDescriptions = $("detailAbilityDescriptions");
const detailDesc = $("detailDesc");
const closeDetailBtn = $("closeDetailBtn");

const resultModal = $("resultModal");
const resultIcon = $("resultIcon");
const resultTitle = $("resultTitle");
const resultText = $("resultText");
const matchStatsBox = $("matchStatsBox");
const playAgainBtn = $("playAgainBtn");
const resultMenuBtn = $("resultMenuBtn");
const openPackBtn = $("openPackBtn");
const replayBtn = $("replayBtn");

const tutorialModal = $("tutorialModal");
const tutorialBtn = $("tutorialBtn");
const closeTutorialBtn = $("closeTutorialBtn");

const leaderboardModal = $("leaderboardModal");
const leaderboardBtn = $("leaderboardBtn");
const leaderboardList = $("leaderboardList");
const closeLeaderboardBtn = $("closeLeaderboardBtn");

const missionsModal = $("missionsModal");
const openMissionsBtn = $("openMissionsBtn");
const closeMissionsBtn = $("closeMissionsBtn");
const missionsList = $("missionsList");

const campaignModal = $("campaignModal");
const closeCampaignBtn = $("closeCampaignBtn");

const draftModal = $("draftModal");
const draftChoices = $("draftChoices");
const draftProgressText = $("draftProgressText");
const startDraftGameBtn = $("startDraftGameBtn");
const closeDraftBtn = $("closeDraftBtn");

const packModal = $("packModal");
const packCards = $("packCards");
const closePackBtn = $("closePackBtn");

const quickChatModal = $("quickChatModal");
const quickChatBtn = $("quickChatBtn");
const closeQuickChatBtn = $("closeQuickChatBtn");

const historyModal = $("historyModal");
const historyBtn = $("historyBtn");
const historyList = $("historyList");
const closeHistoryBtn = $("closeHistoryBtn");

const replayModal = $("replayModal");
const replayList = $("replayList");
const closeReplayBtn = $("closeReplayBtn");

const cardBackSelect = $("cardBackSelect");
const arenaSkinSelect = $("arenaSkinSelect");
const profileNameText = $("profileNameText");
const profileLevelText = $("profileLevelText");
const openOptionsHubBtn = $("openOptionsHubBtn");
const closeOptionsHubBtn = $("closeOptionsHubBtn");
const optionsHubModal = $("optionsHubModal");
const summaryAvatar = $("summaryAvatar");
const summaryDeck = $("summaryDeck");
const summaryArena = $("summaryArena");
const summaryAvatarChip = $("summaryAvatarChip");
const summaryDeckChip = $("summaryDeckChip");
const summaryArenaChip = $("summaryArenaChip");

const enemyHudBox = $("enemyHudBox");

const appBottomNav = $("appBottomNav");
const navHomeBtn = $("navHomeBtn");
const navPlayBtn = $("navPlayBtn");
const navCollectionBtn = $("navCollectionBtn");
const navRankBtn = $("navRankBtn");
const navSettingsBtn = $("navSettingsBtn");

const collectionModal = $("collectionModal");
const collectionGrid = $("collectionGrid");
const collectionStats = $("collectionStats");
const closeCollectionBtn = $("closeCollectionBtn");

const rankModal = $("rankModal");
const rankProfileBox = $("rankProfileBox");
const closeRankBtn = $("closeRankBtn");
const rankPlayBtn = $("rankPlayBtn");


const STARTING_LIFE = 30;
const STARTING_HAND = 5;
const MAX_FIELD_SIZE = 5;
const TURN_SECONDS = 60;

let selectedDeck = "balanced";
let selectedAvatar = "🧙";
let selectedCardBack = "classic";
let selectedArena = "default";

let game = null;
let gameMode = "bot";
let mySlot = "p1";
let roomCode = null;
let unsubscribeRoom = null;
let lastAttackCardId = null;
let selectedAttackerIndex = null;
let turnTimerInterval = null;

let draftDeck = [];
let draftPickCount = 0;
let draftCurrentChoices = [];

let dragState = {
  active: false,
  cardId: null,
  card: null,
  sourceEl: null,
  ghostEl: null,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  moved: false
};


/* =========================
   FINAL · ARTWORK COLLEGATI ALLE CARTE
   ========================= */

const CARD_ART_BY_ID = {
  "fire_3": "assets/cards/drakthar-drago-infernale.png",
  "water_3": "assets/cards/leviatano-degli-abissi.png",
  "light_3": "assets/cards/aurelia-angelo-solare.png",
  "shadow_3": "assets/cards/necromante-del-vuoto.png",
  "fire_2": "assets/cards/fenice-reale.png",
  "forest_3": "assets/cards/guardiano-della-foresta.png",
  "forest_2": "assets/cards/arciera-elfea.png",
  "water_2": "assets/cards/mago-del-gelo.png",
  "shadow_2": "assets/cards/stregone-del-chaos.png"
};

function getCardArt(card) {
  return CARD_ART_BY_ID[card?.cardId] || "";
}

const abilityLabels = {
  guard: "Guardia",
  haste: "Rapidità",
  flying: "Volare",
  rage: "Rabbia",
  poison: "Veleno"
};

const abilityDescriptions = {
  guard: "Guardia: deve essere attaccata prima delle altre creature.",
  haste: "Rapidità: può attaccare subito quando entra.",
  flying: "Volare: può attaccare direttamente se il nemico non ha creature volanti.",
  rage: "Rabbia: quando subisce danno e sopravvive, guadagna +1 ATK.",
  poison: "Veleno: avvelena la creatura con cui combatte. Il veleno fa danno a inizio turno."
};

const deckLabels = {
  fire: "Fuoco",
  water: "Acqua",
  forest: "Foresta",
  shadow: "Ombra",
  light: "Luce",
  balanced: "Bilanciato",
  draft: "Draft"
};

const bossData = {
  apprentice: {
    name: "Apprendista",
    avatar: "🧙",
    life: 24,
    deck: "balanced",
    power: "Ogni 3 turni pesca 1 carta."
  },
  knight: {
    name: "Cavaliere",
    avatar: "⚔️",
    life: 32,
    deck: "light",
    power: "Ogni 3 turni cura 2 vita."
  },
  dragon: {
    name: "Drago Solare",
    avatar: "🐉",
    life: 36,
    deck: "fire",
    power: "Ogni 3 turni infligge 2 danni diretti."
  },
  eclipse: {
    name: "Signore Eclissi",
    avatar: "🌑",
    life: 38,
    deck: "shadow",
    power: "Ogni 3 turni avvelena una tua creatura."
  },
  draktharPrime: {
    name: "Drakthar Prime",
    avatar: "🐉",
    life: 100,
    deck: "fire",
    power: "Ogni 3 turni infligge 4 danni e potenzia una creatura.",
    raid: true
  },
  final: {
    name: "Boss Finale",
    avatar: "👑",
    life: 45,
    deck: "balanced",
    power: "Ogni 3 turni guadagna +1 energia e infligge 1 danno."
  }
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

const equipments = [
  e("eq_sword", "Spada di Fuoco", 2, "rare", "🗡️", "+2 ATK alla creatura.", "equipSword", ["fire", "forest", "balanced"]),
  e("eq_shield", "Scudo Antico", 2, "rare", "🛡️", "+3 HP e Guardia.", "equipShield", ["water", "light", "balanced"]),
  e("eq_wings", "Ali Mistiche", 3, "epic", "🪽", "Dà Volare.", "equipWings", ["light", "water", "balanced"]),
  e("eq_poison", "Lama Tossica", 2, "rare", "☠️", "Dà Veleno.", "equipPoison", ["shadow", "forest", "balanced"])
];

const terrains = [
  t("terrain_sun", "Sole Rovente", 2, "rare", "☀️", "Per 3 turni le creature Fuoco hanno +1 ATK.", "sun", ["fire", "light", "balanced"]),
  t("terrain_fog", "Nebbia Oscura", 2, "rare", "🌫️", "Per 2 turni blocca gli attacchi diretti.", "fog", ["shadow", "water", "balanced"]),
  t("terrain_tide", "Marea Alta", 2, "rare", "🌊", "Per 3 turni le creature Acqua hanno +2 HP.", "tide", ["water", "balanced"]),
  t("terrain_swamp", "Palude Velenosa", 3, "epic", "☠️", "Per 3 turni il veleno fa 2 danni.", "swamp", ["shadow", "forest", "balanced"])
];

function c(cardId, name, family, stage, attack, hp, cost, rarity, desc, effect, abilities) {
  return { cardId, type: "creature", name, family, stage, attack, hp, cost, rarity, desc, effect, abilities };
}

function s(cardId, name, cost, rarity, icon, desc, effect, decks) {
  return { cardId, type: "spell", name, cost, rarity, icon, desc, effect, decks };
}

function e(cardId, name, cost, rarity, icon, desc, effect, decks) {
  return { cardId, type: "equipment", name, cost, rarity, icon, desc, effect, decks };
}

function t(cardId, name, cost, rarity, icon, desc, terrainType, decks) {
  return { cardId, type: "terrain", name, cost, rarity, icon, desc, terrainType, decks };
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

    if (!existingMatch) return code;
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

function getPlayerAvatar() {
  return localStorage.getItem("playerAvatar") || selectedAvatar || "🧙";
}

function getProfile() {
  const saved = localStorage.getItem("ceaProfile");

  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }

  return {
    xp: 0,
    wins: 0,
    losses: 0,
    missions: {}
  };
}

function saveProfile(profile) {
  localStorage.setItem("ceaProfile", JSON.stringify(profile));
  renderProfile();
}

function addXp(amount) {
  const profile = getProfile();
  profile.xp += amount;
  saveProfile(profile);
}

function getLevelFromXp(xp) {
  return Math.floor(xp / 100) + 1;
}

function renderProfile() {
  const profile = getProfile();
  const name = playerNameInput.value.trim() || localStorage.getItem("playerName") || "Giocatore";
  const level = getLevelFromXp(profile.xp);
  const next = level * 100;
  const currentBase = (level - 1) * 100;

  if (profileNameText) profileNameText.textContent = `${selectedAvatar} ${name}`;
  if (profileLevelText) {
    profileLevelText.textContent = `Livello ${level} · XP ${profile.xp - currentBase}/${next - currentBase} · V ${profile.wins || 0} / S ${profile.losses || 0}`;
  }

  updateHomeSummary();
}

function getAvatarLabel(avatar) {
  const map = {
    "🧙": "Mago",
    "⚔️": "Guerriero",
    "🐉": "Domatore",
    "🌑": "Stregone",
    "☀️": "Paladino",
    "🏖️": "Tommi"
  };

  return map[avatar] || "Avatar";
}

function getArenaLabel(arena) {
  const map = {
    default: "Arena mistica",
    volcano: "Vulcano",
    forest: "Foresta sacra",
    abyss: "Abisso oscuro",
    beach: "Spiaggia Tommi 38"
  };

  return map[arena] || "Arena mistica";
}

function updateHomeSummary() {
  if (summaryAvatar) summaryAvatar.textContent = `${selectedAvatar} ${getAvatarLabel(selectedAvatar)}`;
  if (summaryDeck) summaryDeck.textContent = (() => {
    const label = deckLabels[selectedDeck] || "Bilanciato";
    const icons = {
      fire: "🔥",
      water: "🌊",
      forest: "🌿",
      shadow: "🌑",
      light: "☀️",
      balanced: "⚔️",
      draft: "🃏"
    };
    return `${icons[selectedDeck] || "⚔️"} ${label}`;
  })();
  if (summaryArena) summaryArena.textContent = getArenaLabel(selectedArena);
}

function showOnly(screen) {
  menuScreen.classList.add("hidden");
  lobbyScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
  screen.classList.remove("hidden");

  if (screen === menuScreen) setActiveNav("home");
  if (screen === gameScreen) setActiveNav("play");
  updateBottomNavVisibility();
}

function setMessage(text) {
  messageEl.textContent = text;
}

function makeStats() {
  return {
    turns: 1,
    damageDealt: 0,
    damageTaken: 0,
    creaturesPlayed: 0,
    evolutions: 0,
    spellsPlayed: 0,
    equipmentsPlayed: 0,
    terrainsPlayed: 0,
    bestCard: "-"
  };
}

function makePlayer(name, deckType, forcedDeck = null) {
  return {
    id: getPlayerId(),
    name,
    avatar: getPlayerAvatar(),
    life: STARTING_LIFE,
    energy: 0,
    maxEnergy: 0,
    deckType,
    deck: forcedDeck || createDeck(deckType),
    hand: [],
    field: [],
    stats: makeStats()
  };
}

function makeBot(bossKey = null) {
  const boss = bossData[bossKey] || null;
  const deckType = boss?.deck || "balanced";

  return {
    id: "bot",
    name: boss?.name || "Bot",
    avatar: boss?.avatar || "🤖",
    bossKey,
    bossPower: boss?.power || null,
    life: boss?.life || STARTING_LIFE,
    energy: 0,
    maxEnergy: 0,
    deckType,
    deck: createDeck(deckType),
    hand: [],
    field: [],
    stats: makeStats()
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
    for (let i = 0; i < copies; i++) deck.push(createSpellCard(spell));
  });

  equipments.forEach(eq => {
    if (!eq.decks.includes(deckType)) return;
    for (let i = 0; i < 2; i++) deck.push(createEquipmentCard(eq));
  });

  terrains.forEach(terrain => {
    if (!terrain.decks.includes(deckType)) return;
    deck.push(createTerrainCard(terrain));
  });

  while (deck.length < 38) {
    const family = families[randomItem(familyKeys)];
    deck.push(createCreatureCard(family.cards[0]));
  }

  return shuffle(deck);
}

function getFamiliesForDeck(deckType) {
  if (deckType === "balanced" || deckType === "draft") {
    return ["fire", "water", "forest", "shadow", "light"];
  }

  const map = {
    fire: ["fire"],
    water: ["water"],
    forest: ["forest"],
    shadow: ["shadow"],
    light: ["light"]
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
    equipped: [],
    abilities: [...template.abilities]
  };
}

function createSpellCard(template) {
  return { ...template, id: uid() };
}

function createEquipmentCard(template) {
  return { ...template, id: uid() };
}

function createTerrainCard(template) {
  return { ...template, id: uid() };
}

function cloneCardForDeck(card) {
  if (card.type === "creature") return createCreatureCard(card);
  if (card.type === "spell") return createSpellCard(card);
  if (card.type === "equipment") return createEquipmentCard(card);
  if (card.type === "terrain") return createTerrainCard(card);
  return { ...card, id: uid() };
}

function allDraftTemplates() {
  const templates = [];

  Object.values(families).forEach(family => {
    family.cards.forEach(card => templates.push(card));
  });

  spells.forEach(card => templates.push(card));
  equipments.forEach(card => templates.push(card));
  terrains.forEach(card => templates.push(card));

  return templates;
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

function createBaseGame(mode, p1, p2) {
  return {
    mode,
    status: "playing",
    currentTurn: "p1",
    turnNumber: 1,
    turnStartedAt: Date.now(),
    winner: null,
    leaderboardSaved: false,
    activeTerrain: null,
    players: {
      p1,
      p2
    },
    log: [],
    replay: []
  };
}

function startBotGame(bossKey = null, forcedDeck = null) {
  const name = getPlayerName();

  gameMode = bossKey ? "campaign" : "bot";
  roomCode = null;
  mySlot = "p1";
  lastAttackCardId = null;
  selectedAttackerIndex = null;

  const p1 = makePlayer(name, forcedDeck ? "draft" : selectedDeck, forcedDeck);
  const p2 = makeBot(bossKey);

  game = createBaseGame(gameMode, p1, p2);

  initialDraw(game);
  startTurn("p1");

  modeText.textContent = bossKey
    ? `Campagna · ${p2.name}`
    : `Bot · Mazzo ${deckLabels[selectedDeck]}`;

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
    selectedAttackerIndex = null;

    game = {
      mode: "online",
      status: "waiting",
      code,
      currentTurn: "p1",
      turnNumber: 1,
      turnStartedAt: Date.now(),
      winner: null,
      leaderboardSaved: false,
      activeTerrain: null,
      players: {
        p1: makePlayer(name, selectedDeck),
        p2: null
      },
      log: [`${name} ha creato la partita.`],
      replay: [`${name} ha creato la partita.`]
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
    selectedAttackerIndex = null;

    match.players.p2 = makePlayer(name, selectedDeck);
    match.status = "playing";
    match.log.unshift(`${name} è entrato nella partita.`);
    match.replay = match.replay || [];
    match.replay.unshift(`${name} è entrato nella partita.`);

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
        showOnlyMenu(true);
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
      showOnlyMenu(true);
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
  g.turnStartedAt = Date.now();

  player.maxEnergy = Math.min(10, player.maxEnergy + 1);
  player.energy = player.maxEnergy;

  tickTerrain(g);
  applyPoisonDamage(player);
  prepareCreatures(player);
  drawCard(player);

  if (slot === "p2" && player.bossKey) {
    applyBossPower(player.bossKey);
  }

  addLog(`Turno di ${player.name}.`, g);
}

function tickTerrain(g) {
  if (!g.activeTerrain) return;

  g.activeTerrain.turnsLeft -= 1;

  if (g.activeTerrain.turnsLeft <= 0) {
    addLog(`Il terreno ${g.activeTerrain.name} svanisce.`, g);
    g.activeTerrain = null;
  }
}

function applyBossPower(bossKey) {
  const bot = game.players.p2;
  const player = game.players.p1;

  if (game.turnNumber % 3 !== 0) return;

  if (bossKey === "apprentice") {
    drawCard(bot);
    addLog("Potere Boss: pesca 1 carta.");
  }

  if (bossKey === "knight") {
    healLife(bot, 2, document.querySelector(".hud-box.enemy"));
    addLog("Potere Boss: cura 2 vita.");
  }

  if (bossKey === "dragon") {
    dealLifeDamage(bot, player, 2, document.querySelector(".hud-box.player"));
    addLog("Potere Boss: infligge 2 danni diretti.");
  }

  if (bossKey === "eclipse") {
    if (player.field.length) {
      randomItem(player.field).poisoned = true;
      addLog("Potere Boss: avvelena una tua creatura.");
    }
  }

  if (bossKey === "final") {
    bot.energy += 1;
    dealLifeDamage(bot, player, 1, document.querySelector(".hud-box.player"));
    addLog("Potere Boss Finale: +1 energia e 1 danno.");
  }

  if (bossKey === "draktharPrime") {
    dealLifeDamage(bot, player, 4, document.querySelector(".hud-box.player"));
    if (bot.field.length) {
      const target = randomItem(bot.field);
      target.attack += 2;
      target.maxHp += 2;
      target.currentHp += 2;
      addLog("Raid Boss: Drakthar Prime potenzia una creatura e scatena Fiamme Antiche.");
    } else {
      addLog("Raid Boss: Drakthar Prime scatena Fiamme Antiche.");
    }
    createRaidWarningFx();
  }
}

function prepareCreatures(player) {
  player.field.forEach(card => {
    card.canAttack = true;
    card.hasAttacked = false;
  });
}

function applyPoisonDamage(player) {
  const poisonDamage = game?.activeTerrain?.type === "swamp" ? 2 : 1;

  player.field.forEach(card => {
    if (card.poisoned) {
      card.currentHp -= poisonDamage;
      addLog(`${card.name} subisce ${poisonDamage} danno da veleno.`);
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
  if (card.type === "equipment") return me.field.length > 0;
  if (card.type === "terrain") return true;

  if (card.stage === 1) {
    return me.field.length < MAX_FIELD_SIZE;
  }

  return me.field.some(fieldCard =>
    fieldCard.family === card.family &&
    fieldCard.stage === card.stage - 1
  );
}

function canEvolveWithCard(handCard, fieldCard) {
  if (!handCard || !fieldCard) return false;
  if (handCard.type !== "creature") return false;
  if (handCard.stage <= 1) return false;

  return handCard.family === fieldCard.family &&
    handCard.stage === fieldCard.stage + 1;
}

function playCreature(owner, opponent, cardId) {
  const index = owner.hand.findIndex(card => card.id === cardId);
  const card = owner.hand[index];

  if (!card || card.type !== "creature") return;
  if (owner.field.length >= MAX_FIELD_SIZE) return;
  if (owner.energy < card.cost) return;

  owner.energy -= card.cost;
  owner.hand.splice(index, 1);

  applyTerrainOnSummon(card);

  card.canAttack = hasAbility(card, "haste");
  card.hasAttacked = !hasAbility(card, "haste");

  owner.field.push(card);

setTimeout(() => {
  try {
    playSummonFx(card);
  } catch (error) {
    console.warn("Animazione evocazione non riuscita:", error);
  }
}, 80);

  owner.stats.creaturesPlayed++;
  recordBestCard(owner, card);

  addLog(`${owner.name} evoca ${card.name}.`);

  applyEntryEffect(card, owner, opponent);
}

function applyTerrainOnSummon(card) {
  if (!game?.activeTerrain || card.type !== "creature") return;

  if (game.activeTerrain.type === "sun" && card.family === "fire") {
    card.attack += 1;
  }

  if (game.activeTerrain.type === "tide" && card.family === "water") {
    card.maxHp += 2;
    card.currentHp += 2;
  }
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
    equipped: [...(base.equipped || [])],
    abilities: [...new Set([...(evolution.abilities || []), ...(base.abilities || []).filter(a => a === "guard" || a === "flying" || a === "poison")])]
  };

  applyTerrainOnSummon(evolved);

  owner.field[fieldIndex] = evolved;

setTimeout(() => {
  try {
    playEvolveFx(evolved);
  } catch (error) {
    console.warn("Animazione evoluzione non riuscita:", error);
  }
}, 80);

  owner.stats.evolutions++;
  recordBestCard(owner, evolved);

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

  owner.stats.spellsPlayed++;
  recordBestCard(owner, spell);

  addLog(`${owner.name} gioca ${spell.name}.`);

  applySpellEffect(spell, owner, opponent);
}

function playEquipment(owner, cardId, targetIndex) {
  const index = owner.hand.findIndex(card => card.id === cardId);
  const eq = owner.hand[index];
  const target = owner.field[targetIndex];

  if (!eq || !target || eq.type !== "equipment") return;
  if (owner.energy < eq.cost) return;

  owner.energy -= eq.cost;
  owner.hand.splice(index, 1);

  target.equipped = target.equipped || [];
  target.equipped.push(eq.name);

  if (eq.effect === "equipSword") {
    target.attack += 2;
  }

  if (eq.effect === "equipShield") {
    target.maxHp += 3;
    target.currentHp += 3;
    if (!target.abilities.includes("guard")) target.abilities.push("guard");
  }

  if (eq.effect === "equipWings") {
    if (!target.abilities.includes("flying")) target.abilities.push("flying");
  }

  if (eq.effect === "equipPoison") {
    if (!target.abilities.includes("poison")) target.abilities.push("poison");
  }

setTimeout(() => {
  try {
    playEquipmentFx(target);
  } catch (error) {
    console.warn("Animazione equipaggiamento non riuscita:", error);
  }
}, 80);


  owner.stats.equipmentsPlayed++;
  recordBestCard(owner, eq);

  addLog(`${owner.name} equipaggia ${target.name} con ${eq.name}.`);
}

function playTerrain(owner, cardId) {
  const index = owner.hand.findIndex(card => card.id === cardId);
  const terrain = owner.hand[index];

  if (!terrain || terrain.type !== "terrain") return;
  if (owner.energy < terrain.cost) return;

  owner.energy -= terrain.cost;
  owner.hand.splice(index, 1);

  const turns = terrain.terrainType === "fog" ? 2 : 3;

  game.activeTerrain = {
    name: terrain.name,
    type: terrain.terrainType,
    turnsLeft: turns
  };

setTimeout(() => {
  try {
    playTerrainFx();
  } catch (error) {
    console.warn("Animazione terreno non riuscita:", error);
  }
}, 80);


  owner.stats.terrainsPlayed++;
  recordBestCard(owner, terrain);

  addLog(`${owner.name} attiva il terreno ${terrain.name} per ${turns} turni.`);
}

function applyEntryEffect(card, owner, opponent) {
  switch (card.effect) {
    case "burnEnemy":
      dealLifeDamage(owner, opponent, 1, enemyHudBox);
      addLog(`${card.name} infligge 1 danno diretto.`);
      break;

    case "fireStorm":
      opponent.field.forEach(creature => {
        creature.currentHp -= 2;
        applyRageIfDamaged(creature);
      });
      owner.stats.damageDealt += 2 * opponent.field.length;
      addLog(`${card.name} infligge 2 danni al campo avversario.`);
      removeDead(opponent);
      break;

    case "healOwner":
      healLife(owner, 2);
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
      dealLifeDamage(owner, opponent, 3, enemyHudBox);
      addLog(`${card.name} infligge 3 danni diretti.`);
      break;

    case "healTeam":
      owner.field.forEach(creature => {
        creature.currentHp = Math.min(creature.maxHp, creature.currentHp + 1);
      });
      addLog(`${card.name} cura il campo di 1.`);
      break;

    case "bigHealOwner":
      healLife(owner, 4);
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
        owner.stats.damageDealt += 3;
        applyRageIfDamaged(target);
        addLog(`${spell.name} infligge 3 danni a ${target.name}.`);
        removeDead(opponent);
      } else {
        dealLifeDamage(owner, opponent, 3, enemyHudBox);
        addLog(`${spell.name} infligge 3 danni diretti.`);
      }
      break;

    case "spellHeal":
      healLife(owner, 4);
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
      owner.stats.damageDealt += 2 * opponent.field.length;
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

function dealLifeDamage(attackerOwner, defenderOwner, amount, targetEl = null) {
  defenderOwner.life -= amount;

  if (attackerOwner?.stats) attackerOwner.stats.damageDealt += amount;
  if (defenderOwner?.stats) defenderOwner.stats.damageTaken += amount;

  showDamagePopup(targetEl || enemyHudBox, `-${amount}`);
}

function healLife(owner, amount, targetEl = null) {
  owner.life = Math.min(STARTING_LIFE + 15, owner.life + amount);
  showDamagePopup(targetEl || document.body, `+${amount}`, true);
}

function recordBestCard(player, card) {
  if (!player || !player.stats || !card) return;

  if (card.type === "creature") {
    if (player.stats.bestCard === "-" || card.attack >= 6 || card.stage === 3) {
      player.stats.bestCard = card.name;
    }
  } else {
    player.stats.bestCard = card.name;
  }
}

async function handleCardDropOnOwnField(cardId) {
  if (!isMyTurn()) return;

  const me = getMyPlayer();
  const enemy = getEnemyPlayer();
  if (!me || !enemy) return;

  const card = me.hand.find(c => c.id === cardId);
  if (!card) return;

  if (!canPlayCard(card)) {
    setMessage("Non puoi giocare questa carta ora.");
    return;
  }

  if (card.type === "spell") {
    setMessage("Le magie si trascinano sul campo avversario.");
    return;
  }

  if (card.type === "equipment") {
    setMessage("Gli equipaggiamenti vanno trascinati sopra una tua creatura.");
    return;
  }

  if (card.type === "terrain") {
    playTerrain(me, card.id);
    selectedAttackerIndex = null;
    checkGameOver();
    render();
    await saveOnlineGame();
    return;
  }

  if (card.stage !== 1) {
    setMessage("Per evolvere devi trascinare la carta sopra la creatura giusta.");
    return;
  }

  playCreature(me, enemy, card.id);
  selectedAttackerIndex = null;

  checkGameOver();
  render();
  await saveOnlineGame();
}

async function handleCardDropOnEnemyField(cardId) {
  if (!isMyTurn()) return;

  const me = getMyPlayer();
  const enemy = getEnemyPlayer();
  if (!me || !enemy) return;

  const card = me.hand.find(c => c.id === cardId);
  if (!card) return;

  if (!canPlayCard(card)) {
    setMessage("Non puoi giocare questa carta ora.");
    return;
  }

  if (card.type === "terrain") {
    playTerrain(me, card.id);
    selectedAttackerIndex = null;
    checkGameOver();
    render();
    await saveOnlineGame();
    return;
  }

  if (card.type !== "spell") {
    setMessage("Le creature si trascinano nel tuo campo.");
    return;
  }

  playSpell(me, enemy, card.id);
  selectedAttackerIndex = null;

  checkGameOver();
  render();
  await saveOnlineGame();
}

async function handleCardDropOnOwnCreature(cardId, targetIndex) {
  if (!isMyTurn()) return;

  const me = getMyPlayer();
  const enemy = getEnemyPlayer();
  if (!me || !enemy) return;

  const card = me.hand.find(c => c.id === cardId);
  const target = me.field[targetIndex];

  if (!card || !target) return;

  if (!canPlayCard(card)) {
    setMessage("Non puoi giocare questa carta ora.");
    return;
  }

  if (card.type === "equipment") {
    playEquipment(me, card.id, targetIndex);
    selectedAttackerIndex = null;
    checkGameOver();
    render();
    await saveOnlineGame();
    return;
  }

  if (card.type === "spell" || card.type === "terrain") {
    setMessage("Questa carta non si sovrappone a una creatura.");
    return;
  }

  if (card.stage === 1) {
    setMessage("Questa è una Evo 1: trascinala in uno spazio libero del tuo campo.");
    return;
  }

  if (!canEvolveWithCard(card, target)) {
    setMessage("Evoluzione non valida: devi sovrapporla alla creatura corretta.");
    return;
  }

  evolveCreature(me, enemy, card.id, targetIndex);
  selectedAttackerIndex = null;

  checkGameOver();
  render();
  await saveOnlineGame();
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

    dealLifeDamage(me, enemy, attacker.attack, enemyHudBox);
playAttackFx(enemyHudBox);

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

  attackerOwner.stats.damageDealt += attacker.attack;
  attackerOwner.stats.damageTaken += defender.attack;
  defenderOwner.stats.damageDealt += defender.attack;
  defenderOwner.stats.damageTaken += attacker.attack;

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

const targetCardEl = document.querySelector(".card.enemy-targetable") || document.querySelector(".card.selected-attacker");
playAttackFx(targetCardEl);

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
  if (game?.activeTerrain?.type === "fog") return false;
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

  selectedAttackerIndex = null;

  const me = getMyPlayer();
  const next = getEnemySlot();

  addLog(`${me.name} termina il turno.`);

  if (gameMode === "bot" || gameMode === "campaign") {
    startTurn("p2");
    render();

    setTimeout(() => {
      botTurn();

      if (!game.winner) {
        game.turnNumber++;
        game.players.p1.stats.turns = game.turnNumber;
        game.players.p2.stats.turns = game.turnNumber;
        startTurn("p1");
      }

      render();
    }, 600);
  } else {
    game.turnNumber++;
    game.players.p1.stats.turns = game.turnNumber;
    game.players.p2.stats.turns = game.turnNumber;
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

    const equipment = bot.hand.find(card =>
      card.type === "equipment" &&
      card.cost <= bot.energy &&
      bot.field.length
    );

    if (equipment) {
      playEquipment(bot, equipment.id, 0);
      action = true;
      continue;
    }

    const terrain = bot.hand.find(card =>
      card.type === "terrain" &&
      card.cost <= bot.energy &&
      !game.activeTerrain
    );

    if (terrain) {
      playTerrain(bot, terrain.id);
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
    } else if (canAttackLife(attacker, player.field)) {
      dealLifeDamage(bot, player, attacker.attack, document.querySelector(".hud-box.player"));
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
  if (spell.effect === "spellHeal") return bot.life <= STARTING_LIFE - 5;
  if (spell.effect === "spellDrawTwo") return bot.hand.length <= 3;
  if (spell.effect === "spellBlessing") return bot.field.length >= 2;
  if (spell.effect === "spellStorm") return player.field.length >= 2;
  if (spell.effect === "spellGainEnergy") return bot.hand.some(card => card.cost > bot.energy);
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
    saveMatchResult();
    saveLeaderboardIfNeeded();
    showResult(game.winner === mySlot);
  }
}

function saveMatchResult() {
  const me = getMyPlayer();
  if (!me) return;

  const won = game.winner === mySlot;
  const profile = getProfile();

  if (won) profile.wins = (profile.wins || 0) + 1;
  else profile.losses = (profile.losses || 0) + 1;

  const xp = won ? 35 : 15;
  profile.xp += xp;

  saveProfile(profile);
  saveHistory(won);
}

function saveHistory(won) {
  const history = getHistory();
  const me = getMyPlayer();
  const enemy = getEnemyPlayer();

  history.unshift({
    date: new Date().toLocaleString("it-IT"),
    result: won ? "Vittoria" : "Sconfitta",
    me: me?.name || "Tu",
    enemy: enemy?.name || "Nemico",
    turns: game.turnNumber
  });

  localStorage.setItem("ceaHistory", JSON.stringify(history.slice(0, 20)));
}

function getHistory() {
  const raw = localStorage.getItem("ceaHistory");
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveLeaderboardIfNeeded() {
  if (!game || game.leaderboardSaved) return;

  game.leaderboardSaved = true;

  const me = getMyPlayer();
  if (!me) return;

  try {
    if (firebaseReady()) {
      await updateLeaderboardPlayer(me.id, {
        name: me.name,
        avatar: me.avatar,
        deck: me.deckType,
        won: game.winner === mySlot,
        xp: game.winner === mySlot ? 35 : 15
      });
    }
  } catch (error) {
    console.error("Errore aggiornamento classifica:", error);
  }
}

function showResult(won) {
  const me = getMyPlayer();
  const stats = me?.stats || makeStats();

  resultModal.classList.remove("hidden");

const modalCard = resultModal.querySelector(".modal-card");

if (modalCard) {
  modalCard.classList.remove("victory-pop", "defeat-pop");
  void modalCard.offsetWidth;
  modalCard.classList.add(won ? "victory-pop" : "defeat-pop");
}

playResultFx(won);
  resultIcon.textContent = won ? "🏆" : "💀";
  resultTitle.textContent = won ? "Vittoria!" : "Sconfitta";
  resultText.textContent = won ? "Hai vinto la partita. +35 XP" : "Hai perso la partita. +15 XP";

  matchStatsBox.innerHTML = `
    <div>⏱️ Turni: <strong>${stats.turns}</strong></div>
    <div>⚔️ Danni inflitti: <strong>${stats.damageDealt}</strong></div>
    <div>🛡️ Danni subiti: <strong>${stats.damageTaken}</strong></div>
    <div>🃏 Creature evocate: <strong>${stats.creaturesPlayed}</strong></div>
    <div>🔺 Evoluzioni: <strong>${stats.evolutions}</strong></div>
    <div>✨ Magie usate: <strong>${stats.spellsPlayed}</strong></div>
    <div>🛡️ Equipaggiamenti: <strong>${stats.equipmentsPlayed}</strong></div>
    <div>🌍 Terreni: <strong>${stats.terrainsPlayed}</strong></div>
    <div>⭐ Carta migliore: <strong>${stats.bestCard}</strong></div>
  `;
}

function addLog(text, targetGame = game) {
  if (!targetGame) return;

  targetGame.log.unshift(text);
  targetGame.replay = targetGame.replay || [];
  targetGame.replay.unshift(`Turno ${targetGame.turnNumber}: ${text}`);

  if (targetGame.log.length > 35) targetGame.log.pop();
  if (targetGame.replay.length > 80) targetGame.replay.pop();
}

function render() {
  if (!game || !game.players.p1 || !game.players.p2) return;

  const me = getMyPlayer();
  const enemy = getEnemyPlayer();
  if (!me || !enemy) return;

  playerNameText.textContent = `${me.avatar || ""} ${me.name}`;
  enemyNameEl.textContent = `${enemy.avatar || ""} ${enemy.name}`;

  playerLifeEl.textContent = me.life;
  enemyLifeEl.textContent = enemy.life;

  playerEnergyEl.textContent = me.energy;
  enemyEnergyEl.textContent = enemy.energy;

  playerMaxEnergyEl.textContent = me.maxEnergy;
  enemyMaxEnergyEl.textContent = enemy.maxEnergy;

  playerEnergyDotsEl.textContent = renderEnergyDots(me.energy, me.maxEnergy);
  enemyEnergyDotsEl.textContent = renderEnergyDots(enemy.energy, enemy.maxEnergy);

  playerDeckCountEl.textContent = me.deck.length;
  enemyDeckCountEl.textContent = enemy.deck.length;

  playerHandCountEl.textContent = me.hand.length;
  enemyHandCountEl.textContent = enemy.hand.length;

  activeTerrainText.textContent = game.activeTerrain
    ? `${game.activeTerrain.name} · ${game.activeTerrain.turnsLeft} turni`
    : "Nessun terreno";

  turnTextEl.textContent = isMyTurn()
    ? "Tuo turno"
    : `Turno di ${game.players[game.currentTurn]?.name || "avversario"}`;

  endTurnBtn.disabled = !isMyTurn() || Boolean(game.winner);

  if (enemyHudBox) {
    enemyHudBox.classList.toggle("targetable", selectedAttackerIndex !== null && isMyTurn());
  }

  cancelAttackBtn.classList.toggle("hidden", !(selectedAttackerIndex !== null && isMyTurn()));

  if (selectedAttackerIndex !== null && isMyTurn()) {
    roomInfoText.textContent = "Scegli bersaglio";
    roomInfoText.classList.add("attack-hint");
  } else if (gameMode === "online") {
    roomInfoText.textContent = `Codice ${roomCode}`;
    roomInfoText.classList.remove("attack-hint");
  } else {
    roomInfoText.textContent = "";
    roomInfoText.classList.remove("attack-hint");
  }

  if (gameMode === "online") {
    modeText.textContent = `Online · ${roomCode}`;
  } else if (gameMode === "campaign") {
    modeText.textContent = `Campagna · ${enemy.name}`;
  } else {
    modeText.textContent = `Bot · Mazzo ${deckLabels[selectedDeck]}`;
  }

  renderHand();
  renderField(playerFieldEl, me.field, "player");
  renderField(enemyFieldEl, enemy.field, "enemy");
  renderLog();
  startTimerLoop();

  if (game.winner) {
    endTurnBtn.disabled = true;
  }
}

function startTimerLoop() {
  if (turnTimerInterval) {
    clearInterval(turnTimerInterval);
    turnTimerInterval = null;
  }

  if (!turnTimerText || !game || !game.turnStartedAt || game.status !== "playing" || game.winner) {
    if (turnTimerText) turnTimerText.textContent = "⏱️ --";
    return;
  }

  const updateTimer = () => {
    if (!turnTimerText) return;

    if (!game || game.status !== "playing" || game.winner) {
      turnTimerText.textContent = "⏱️ --";

      if (turnTimerInterval) {
        clearInterval(turnTimerInterval);
        turnTimerInterval = null;
      }

      return;
    }

    const startedAt = Number(game.turnStartedAt || Date.now());
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    const remaining = Math.max(0, TURN_SECONDS - elapsed);
    turnTimerText.textContent = `⏱️ ${remaining}s`;
  };

  updateTimer();
  turnTimerInterval = setInterval(updateTimer, 1000);
}

function renderEnergyDots(current, max) {
  const safeMax = Math.max(0, Math.min(10, max || 0));
  let text = "";

  for (let i = 1; i <= safeMax; i++) {
    text += i <= current ? "●" : "○";
  }

  return text;
}

function renderHand() {
  const me = getMyPlayer();
  if (!me) return;

  playerHandEl.innerHTML = "";

  me.hand.forEach(card => {
    const el = createCardEl(card, "hand-card");

    if (canPlayCard(card)) el.classList.add("playable");
    else el.classList.add("unplayable");

    el.dataset.cardId = card.id;

    addHandCardEvents(el, card);
    playerHandEl.appendChild(el);
  });
}

function addHandCardEvents(cardEl, card) {
  cardEl.addEventListener("pointerdown", event => {
    startPointerDrag(event, cardEl, card);
  });

  cardEl.addEventListener("click", event => {
    if (dragState.moved) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    showCardDetail(card);
  });

  cardEl.addEventListener("contextmenu", event => {
    event.preventDefault();
    showCardDetail(card);
  });
}

function startPointerDrag(event, cardEl, card) {
  if (!isMyTurn() || !canPlayCard(card)) return;
  if (event.button !== undefined && event.button !== 0) return;

  dragState = {
    active: false,
    cardId: card.id,
    card,
    sourceEl: cardEl,
    ghostEl: null,
    startX: event.clientX,
    startY: event.clientY,
    currentX: event.clientX,
    currentY: event.clientY,
    moved: false,
    scrollIntent: false
  };

  const pointerMove = moveEvent => {
    const dx = moveEvent.clientX - dragState.startX;
    const dy = moveEvent.clientY - dragState.startY;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const distance = Math.sqrt(dx * dx + dy * dy);

    /*
      Se il movimento è soprattutto orizzontale,
      NON parte il drag: lasciamo scorrere la mano.
    */
    if (!dragState.active && !dragState.scrollIntent && absX > 8 && absX > absY * 1.25) {
      dragState.scrollIntent = true;
      dragState.moved = true;
      return;
    }

    /*
      Se ormai è stato riconosciuto come scroll,
      non facciamo partire il trascinamento.
    */
    if (dragState.scrollIntent) {
      return;
    }

    /*
      Il drag parte solo se il movimento è abbastanza verticale.
      Così puoi scorrere la mano lateralmente senza trascinare carte.
    */
    if (!dragState.active && distance > 10 && absY >= absX) {
      dragState.active = true;
      dragState.moved = true;

      moveEvent.preventDefault();

      document.body.classList.add("dragging-card");
      cardEl.classList.add("dragging-source");
      createDragGhost(cardEl);

      if (card.type === "spell") {
        setMessage("Trascina la magia sul campo avversario.");
      } else if (card.type === "equipment") {
        setMessage("Trascina l'equipaggiamento sopra una tua creatura.");
      } else if (card.type === "terrain") {
        setMessage("Trascina il terreno sul campo.");
      } else if (card.stage === 1) {
        setMessage("Trascina la creatura nel tuo campo.");
      } else {
        setMessage("Sovrapponi l'evoluzione alla creatura corretta.");
      }
    }

    if (dragState.active) {
      moveEvent.preventDefault();

      dragState.currentX = moveEvent.clientX;
      dragState.currentY = moveEvent.clientY;

      moveDragGhost(moveEvent.clientX, moveEvent.clientY);
      updateDropHighlights(moveEvent.clientX, moveEvent.clientY);
    }
  };

  const pointerUp = async upEvent => {
    document.removeEventListener("pointermove", pointerMove);
    document.removeEventListener("pointerup", pointerUp);
    document.removeEventListener("pointercancel", pointerUp);

    if (dragState.active) {
      upEvent.preventDefault();
      await finishPointerDrop(upEvent.clientX, upEvent.clientY);
    }

    cleanupDragState();
  };

  document.addEventListener("pointermove", pointerMove, { passive: false });
  document.addEventListener("pointerup", pointerUp, { passive: false });
  document.addEventListener("pointercancel", pointerUp, { passive: false });
}

function createDragGhost(sourceEl) {
  const clone = sourceEl.cloneNode(true);
  clone.classList.add("drag-ghost");
  clone.style.width = `${sourceEl.offsetWidth}px`;
  clone.style.height = `${sourceEl.offsetHeight}px`;
  document.body.appendChild(clone);

  dragState.ghostEl = clone;
  moveDragGhost(dragState.currentX, dragState.currentY);
}

function moveDragGhost(x, y) {
  if (!dragState.ghostEl) return;

  dragState.ghostEl.style.left = `${x}px`;
  dragState.ghostEl.style.top = `${y}px`;
}

function updateDropHighlights(x, y) {
  document.querySelectorAll(".drop-zone-active").forEach(el => el.classList.remove("drop-zone-active"));
  document.querySelectorAll(".drop-target").forEach(el => el.classList.remove("drop-target"));

  const target = document.elementFromPoint(x, y);
  if (!target) return;

  const ownCard = target.closest(".card[data-owner='player']");
  const ownField = target.closest("#playerField");
  const enemyField = target.closest("#enemyField");

  if (ownCard) {
    ownCard.classList.add("drop-target");
    return;
  }

  if (ownField) {
    playerFieldEl.classList.add("drop-zone-active");
    return;
  }

  if (enemyField) {
    enemyFieldEl.classList.add("drop-zone-active");
  }
}

async function finishPointerDrop(x, y) {
  const target = document.elementFromPoint(x, y);
  if (!target) return;

  const ownCard = target.closest(".card[data-owner='player']");
  const ownField = target.closest("#playerField");
  const enemyField = target.closest("#enemyField");

  if (ownCard) {
    const targetIndex = Number(ownCard.dataset.index);
    await handleCardDropOnOwnCreature(dragState.cardId, targetIndex);
    return;
  }

  if (ownField) {
    await handleCardDropOnOwnField(dragState.cardId);
    return;
  }

  if (enemyField) {
    await handleCardDropOnEnemyField(dragState.cardId);
    return;
  }

  setMessage("Carta non giocata.");
}

function cleanupDragState() {
  document.body.classList.remove("dragging-card");

  if (dragState.sourceEl) dragState.sourceEl.classList.remove("dragging-source");
  if (dragState.ghostEl) dragState.ghostEl.remove();

  document.querySelectorAll(".drop-zone-active").forEach(el => el.classList.remove("drop-zone-active"));
  document.querySelectorAll(".drop-target").forEach(el => el.classList.remove("drop-target"));

  const moved = dragState.moved;

  dragState = {
    active: false,
    cardId: null,
    card: null,
    sourceEl: null,
    ghostEl: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    moved
  };

  setTimeout(() => {
    dragState.moved = false;
  }, 120);
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

    el.dataset.owner = owner;
el.dataset.index = index;
el.dataset.cardId = card.id;

    if (!card.canAttack) el.classList.add("sleeping");
    if (card.hasAttacked) el.classList.add("attacked");
    if (card.poisoned) el.classList.add("poisoned");
    if (card.id === lastAttackCardId) el.classList.add("attacking");

    if (owner === "player" && selectedAttackerIndex === index) {
      el.classList.add("selected-attacker");
    }

    if (owner === "enemy" && selectedAttackerIndex !== null && isMyTurn()) {
      el.classList.add("enemy-targetable");
    }

    if (owner === "player") addPlayerFieldCardEvents(el, card, index);
    else addEnemyFieldCardEvents(el, card, index);

    container.appendChild(el);
  });
}

function addPlayerFieldCardEvents(cardEl, card, index) {
  cardEl.addEventListener("click", () => {
    if (!isMyTurn()) {
      showCardDetail(card);
      return;
    }

    if (!card.canAttack || card.hasAttacked) {
      showCardDetail(card);
      return;
    }

    selectedAttackerIndex = selectedAttackerIndex === index ? null : index;

    if (selectedAttackerIndex !== null) {
      setMessage("Scegli una creatura nemica da attaccare oppure clicca il box nemico per attaccare la vita.");
    } else {
      setMessage("Attacco annullato.");
    }

    render();
  });

  cardEl.addEventListener("contextmenu", event => {
    event.preventDefault();
    showCardDetail(card);
  });

  cardEl.addEventListener("dblclick", () => {
    showCardDetail(card);
  });
}

function addEnemyFieldCardEvents(cardEl, card, index) {
  cardEl.addEventListener("click", async () => {
    if (selectedAttackerIndex !== null) {
      await playerAttack(selectedAttackerIndex, index);
      selectedAttackerIndex = null;
      render();
      return;
    }

    showCardDetail(card);
  });

  cardEl.addEventListener("contextmenu", event => {
    event.preventDefault();
    showCardDetail(card);
  });

  cardEl.addEventListener("dblclick", () => {
    showCardDetail(card);
  });
}

function createCardEl(card, extraClass) {
  const el = document.createElement("div");

  const realArtwork = getCardArt(card);
  if (realArtwork) {
    el.style.setProperty("--card-art", `url("${realArtwork}")`);
    el.classList.add("has-real-art");
  }

  if (card.type === "creature") {
    el.className = `card creature ${card.family} ${card.rarity} ${extraClass}`;

    const hpPercent = Math.max(0, Math.min(100, Math.round((card.currentHp / card.maxHp) * 100)));
    const abilities = (card.abilities || [])
      .map(ability => `<span class="ability">${abilityLabels[ability]}</span>`)
      .join("");

    const equipped = card.equipped?.length
      ? `<span class="badge legendary">EQ ${card.equipped.length}</span>`
      : "";

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
          ${equipped}
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
    const typeClass = card.type === "equipment"
      ? "equipment-card"
      : card.type === "terrain"
        ? "terrain-card"
        : "spell-card";

    const typeLabel = card.type === "equipment"
      ? "Equip"
      : card.type === "terrain"
        ? "Terreno"
        : "Magia";

    el.className = `card ${typeClass} ${card.rarity} ${extraClass}`;

    el.innerHTML = `
      <div>
        <div class="card-top">
          <div class="card-icon">${card.icon}</div>
          <div class="card-cost">${card.cost}</div>
        </div>

        <div class="card-name">${card.name}</div>

        <div class="card-meta">
          <span class="badge">${typeLabel}</span>
          <span class="badge ${card.rarity}">${shortRarity(card.rarity)}</span>
        </div>

        <div class="card-desc">${card.desc}</div>
      </div>

      <div>
        <div class="card-stats">
          <div class="card-stat">
            <small>TIPO</small>
            ${typeLabel}
          </div>
          <div class="card-stat">
            <small>COSTO</small>
            ${card.cost}
          </div>
        </div>
      </div>
    `;
  }

  return el;
}

function showCardDetail(card) {
  detailIcon.textContent = card.icon || "🃏";
  detailName.textContent = card.name;
  detailCost.textContent = card.cost;
  detailDesc.textContent = card.desc || "Nessuna descrizione.";

  detailAbilities.innerHTML = "";
  detailAbilityDescriptions.innerHTML = "";

  if (card.type === "creature") {
    detailType.textContent = `${families[card.family].label} · Evoluzione ${card.stage}/3 · ${shortRarity(card.rarity)}`;

    detailAtkWrap.classList.remove("hidden");
    detailHpWrap.classList.remove("hidden");

    detailAtk.textContent = card.attack;
    detailHp.textContent = `${card.currentHp}/${card.maxHp}`;

    if (card.abilities?.length) {
      card.abilities.forEach(ability => {
        const span = document.createElement("span");
        span.textContent = abilityLabels[ability];
        detailAbilities.appendChild(span);

        const desc = document.createElement("div");
        desc.textContent = abilityDescriptions[ability] || abilityLabels[ability];
        detailAbilityDescriptions.appendChild(desc);
      });
    } else {
      detailAbilities.innerHTML = `<span>Nessuna abilità</span>`;
    }

    if (card.equipped?.length) {
      const div = document.createElement("div");
      div.textContent = `Equipaggiata con: ${card.equipped.join(", ")}`;
      detailAbilityDescriptions.appendChild(div);
    }
  } else {
    const typeLabel = card.type === "equipment"
      ? "Equipaggiamento"
      : card.type === "terrain"
        ? "Terreno"
        : "Magia";

    detailType.textContent = `${typeLabel} · ${shortRarity(card.rarity)}`;

    detailAtkWrap.classList.add("hidden");
    detailHpWrap.classList.add("hidden");

    detailAbilities.innerHTML = `<span>${typeLabel}</span>`;
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

function createFxFlash(type = "summon") {
  const flash = document.createElement("div");
  flash.className = `fx-flash ${type}`;
  document.body.appendChild(flash);

  setTimeout(() => {
    flash.remove();
  }, 700);
}

function createFxText(text, type = "summon", small = false) {
  const el = document.createElement("div");
  el.className = `fx-event-text ${type} ${small ? "small" : ""}`;
  el.textContent = text;
  document.body.appendChild(el);

  setTimeout(() => {
    el.remove();
  }, 950);
}

function createParticlesFromElement(targetEl, type = "light", count = 14) {
  if (!targetEl || !document.body.contains(targetEl)) {
    targetEl = document.body;
  }

  const rect = targetEl === document.body
    ? {
        left: window.innerWidth / 2,
        top: window.innerHeight / 2,
        width: 0,
        height: 0
      }
    : targetEl.getBoundingClientRect();

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div");
    particle.className = `fx-particle ${type}`;

    const angle = Math.random() * Math.PI * 2;
    const distance = 36 + Math.random() * 74;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;
    particle.style.setProperty("--fx-x", `${x}px`);
    particle.style.setProperty("--fx-y", `${y}px`);

    document.body.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, 850);
  }
}

function shakeScreen() {
  document.body.classList.remove("screen-shake");
  void document.body.offsetWidth;
  document.body.classList.add("screen-shake");

  setTimeout(() => {
    document.body.classList.remove("screen-shake");
  }, 380);
}

function findCardElementById(cardId) {
  if (!cardId) return null;

  const allCards = document.querySelectorAll(".card");

  for (const cardEl of allCards) {
    if (cardEl.dataset.cardId === cardId) return cardEl;
  }

  return null;
}

function animateCardById(cardId, animationClass, particleType = "light", text = "") {
  requestAnimationFrame(() => {
    const cardEl = findCardElementById(cardId);

    if (!cardEl) {
      if (text) createFxText(text, particleType, true);
      createParticlesFromElement(document.body, particleType, 10);
      return;
    }

    cardEl.classList.remove(animationClass);
    void cardEl.offsetWidth;
    cardEl.classList.add(animationClass);

    createParticlesFromElement(cardEl, particleType, 16);

    if (text) {
      createFxText(text, particleType, true);
    }

    setTimeout(() => {
      cardEl.classList.remove(animationClass);
    }, 950);
  });
}

function playSummonFx(card) {
  createFxFlash("summon");
  createFxText("Evocazione", "summon", true);
  animateCardById(card?.id, "fx-card-summon", card?.family || "light");

  if (card?.rarity === "legendary" || card?.stage === 3) {
    playLegendarySummonFx(card);
  }
}

function playEvolveFx(card) {
  createFxFlash("evolve");
  createFxText("Evoluzione!", "evolve");
  animateCardById(card?.id, "fx-card-evolve", "light");

  if (card?.stage === 3 || card?.rarity === "legendary") {
    createCinematicBanner(card?.name || "Evoluzione", "Forma finale", "legendary");
    createParticlesFromElement(document.body, card?.family || "light", 30);
  }
}

function playEquipmentFx(card) {
  createFxFlash("equipment");
  createFxText("Equip!", "equipment", true);
  animateCardById(card?.id, "fx-card-equip", "purple");
}

function playTerrainFx() {
  createFxFlash("terrain");
  createFxText("Terreno attivo", "terrain", true);
  createParticlesFromElement(document.querySelector(".terrain-zone"), "blue", 18);
}

function playAttackFx(targetEl = null) {
  createFxFlash("attack");
  createParticlesFromElement(targetEl || enemyHudBox || document.body, "red", 12);
}

function playResultFx(won) {
  createFxFlash(won ? "win" : "lose");
  createFxText(won ? "Vittoria!" : "Sconfitta", won ? "evolve" : "attack");
}

function showDamagePopup(targetEl, text, heal = false) {
  if (!targetEl || !document.body.contains(targetEl)) {
    targetEl = document.body;
  }

  const rect = targetEl === document.body
    ? {
        left: window.innerWidth / 2,
        top: window.innerHeight / 2,
        width: 0,
        height: 0
      }
    : targetEl.getBoundingClientRect();

  const popup = document.createElement("div");

  popup.className = `damage-popup ${heal ? "heal" : ""}`;
  popup.textContent = text;
  popup.style.left = `${rect.left + rect.width / 2}px`;
  popup.style.top = `${rect.top + rect.height / 2}px`;

  document.body.appendChild(popup);

  createParticlesFromElement(targetEl, heal ? "forest" : "red", heal ? 9 : 12);

  if (!heal) {
    shakeScreen();
  }

  setTimeout(() => {
    popup.remove();
  }, 1000);
}

function showOnlyMenu(force = false) {
  if (!force && game && game.status === "playing") {
    const ok = confirm("Vuoi davvero uscire dalla partita?");
    if (!ok) return;
  }

  if (unsubscribeRoom) {
    unsubscribeRoom();
    unsubscribeRoom = null;
  }

  if (turnTimerInterval) {
    clearInterval(turnTimerInterval);
    turnTimerInterval = null;
  }

  roomCode = null;
  game = null;
  gameMode = "bot";
  mySlot = "p1";
  lastAttackCardId = null;
  selectedAttackerIndex = null;

  resultModal.classList.add("hidden");
  cardDetailModal.classList.add("hidden");

  showOnly(menuScreen);
updateBottomNavVisibility();
setActiveNav("home");
  renderProfile();
}

async function openLeaderboard() {
  leaderboardModal.classList.remove("hidden");
  leaderboardList.textContent = "Caricamento...";

  if (!firebaseReady()) {
    leaderboardList.innerHTML = `<div class="leaderboard-row">Firebase non configurato.</div>`;
    return;
  }

  try {
    const rows = await getLeaderboardTop(10);

    if (!rows.length) {
      leaderboardList.innerHTML = `<div class="leaderboard-row">Nessun risultato ancora.</div>`;
      return;
    }

    leaderboardList.innerHTML = rows.map((row, index) => `
      <div class="leaderboard-row">
        <strong>${index + 1}. ${row.avatar || ""} ${row.name || "Giocatore"}</strong><br>
        Vittorie: ${row.wins || 0} · Sconfitte: ${row.losses || 0} · XP: ${row.xp || 0} · Mazzo: ${deckLabels[row.lastDeck] || row.lastDeck || "-"}
      </div>
    `).join("");
  } catch (error) {
    console.error(error);
    leaderboardList.innerHTML = `<div class="leaderboard-row">Errore nel caricamento classifica.</div>`;
  }
}

function getInviteLink() {
  if (!roomCode) return window.location.href;
  const url = new URL(window.location.href);
  url.searchParams.set("room", roomCode);
  return url.toString();
}

function setupRoomFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const room = params.get("room");
  if (room) joinCodeInput.value = room.toUpperCase();
}

function openPack() {
  packModal.classList.remove("hidden");
  showPremiumToast("Pacchetto aperto");
  upgradePackRevealFx();
  const pool = allDraftTemplates();
  const found = shuffle(pool).slice(0, 3);

  packCards.innerHTML = found.map(card => `
    <div class="pack-card">
      ${card.icon || families[card.family]?.icon || "🃏"}<br>
      ${card.name}<br>
      <small>${card.type || "creature"} · ${card.rarity || "common"}</small>
    </div>
  `).join("");
}

function renderHistory() {
  const history = getHistory();

  if (!history.length) {
    historyList.innerHTML = `<div class="history-row">Nessuna partita registrata.</div>`;
    return;
  }

  historyList.innerHTML = history.map(item => `
    <div class="history-row">
      <strong>${item.result}</strong> · ${item.me} vs ${item.enemy}<br>
      ${item.turns} turni · ${item.date}
    </div>
  `).join("");
}

function renderReplay() {
  if (!game?.replay?.length) {
    replayList.innerHTML = `<div class="replay-row">Nessun replay disponibile.</div>`;
    return;
  }

  replayList.innerHTML = game.replay.map(row => `
    <div class="replay-row">${row}</div>
  `).join("");
}

function renderMissions() {
  const profile = getProfile();

  missionsList.innerHTML = `
    <div class="mission-row">Vinci una partita · <strong>${profile.wins > 0 ? "Completata" : "+20 XP"}</strong></div>
    <div class="mission-row">Gioca una partita · <strong>${(profile.wins + profile.losses) > 0 ? "Completata" : "+10 XP"}</strong></div>
    <div class="mission-row">Raggiungi 100 XP · <strong>${profile.xp >= 100 ? "Completata" : "+30 XP"}</strong></div>
  `;
}

function startDraft() {
  draftDeck = [];
  draftPickCount = 0;
  draftModal.classList.remove("hidden");
  renderDraftChoices();
}

function renderDraftChoices() {
  draftCurrentChoices = shuffle(allDraftTemplates()).slice(0, 3);
  draftProgressText.textContent = `${draftPickCount}/20 carte scelte`;

  draftChoices.innerHTML = draftCurrentChoices.map((card, index) => `
    <button class="draft-choice" data-index="${index}">
      ${card.icon || families[card.family]?.icon || "🃏"}<br>
      ${card.name}<br>
      <small>${card.type || "creature"} · costo ${card.cost}</small>
    </button>
  `).join("");

  document.querySelectorAll(".draft-choice").forEach(button => {
    button.onclick = () => {
      const index = Number(button.dataset.index);
      const chosen = draftCurrentChoices[index];

      draftDeck.push(cloneCardForDeck(chosen));
      draftPickCount++;

      if (draftPickCount >= 20) {
        draftProgressText.textContent = "Mazzo draft pronto.";
        return;
      }

      renderDraftChoices();
    };
  });
}

function startDraftGame() {
  if (draftDeck.length < 20) {
    alert("Scegli almeno 20 carte per il draft.");
    return;
  }

  const fullDeck = shuffle([...draftDeck, ...draftDeck.map(card => cloneCardForDeck(card)).slice(0, 14)]);
  draftModal.classList.add("hidden");
  startBotGame(null, fullDeck);
}

function openOptionsHub() {
  if (!optionsHubModal) return;
  renderProfile();
  optionsHubModal.classList.remove("hidden");
}

function closeOptionsHub() {
  if (!optionsHubModal) return;
  optionsHubModal.classList.add("hidden");
}

function applyArenaSkin(value) {
  document.body.classList.remove("arena-volcano", "arena-forest", "arena-abyss", "arena-beach");

  if (value && value !== "default") {
    document.body.classList.add(`arena-${value}`);
  }
}



/* =========================
   V33 · CINEMATIC POLISH
   ========================= */

function createCinematicBanner(title, subtitle = "", tone = "legendary") {
  const banner = document.createElement("div");
  banner.className = `cinematic-banner ${tone}`;
  banner.innerHTML = `
    <strong>${title}</strong>
    <span>${subtitle}</span>
  `;
  document.body.appendChild(banner);

  setTimeout(() => banner.remove(), 1700);
}

function createRaidWarningFx() {
  createCinematicBanner("RAID BOSS", "Fiamme Antiche", "danger");
  createFxFlash("attack");
  shakeScreen();
}

function playLegendarySummonFx(card) {
  createCinematicBanner(card?.name || "Leggendaria", "Evocazione leggendaria", "legendary");
  createFxFlash("evolve");
  createParticlesFromElement(document.body, card?.family || "light", 34);
  shakeScreen();
}

function upgradePackRevealFx() {
  createCinematicBanner("PACCHETTO APERTO", "Nuove carte sbloccate", "pack");
  createParticlesFromElement(document.body, "light", 28);
}



/* =========================
   V34 · APP NAV / COLLEZIONE / RANK
   ========================= */

function setActiveNav(name) {
  if (!appBottomNav) return;

  const map = {
    home: navHomeBtn,
    play: navPlayBtn,
    cards: navCollectionBtn,
    rank: navRankBtn,
    settings: navSettingsBtn
  };

  Object.values(map).forEach(btn => {
    if (btn) btn.classList.remove("active");
  });

  if (map[name]) map[name].classList.add("active");
}

function updateBottomNavVisibility() {
  if (!appBottomNav) return;
  const inGame = gameScreen && !gameScreen.classList.contains("hidden");
  appBottomNav.classList.toggle("compact", inGame);
}

function openCollection(filter = "all") {
  if (!collectionModal || !collectionGrid || !collectionStats) return;

  collectionModal.classList.remove("hidden");
  setActiveNav("cards");

  document.querySelectorAll(".collection-filter").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
    btn.onclick = () => openCollection(btn.dataset.filter || "all");
  });

  const cards = allDraftTemplates();
  const filtered = filter === "all" ? cards : cards.filter(card => card.type === filter);

  const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
  filtered.sort((a, b) => (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0));

  const total = cards.length;
  const legendary = cards.filter(card => card.rarity === "legendary").length;
  const creatures = cards.filter(card => card.type === "creature").length;

  collectionStats.innerHTML = `
    <div><strong>${total}</strong><span>Totali</span></div>
    <div><strong>${creatures}</strong><span>Creature</span></div>
    <div><strong>${legendary}</strong><span>Leggendarie</span></div>
  `;

  collectionGrid.innerHTML = filtered.map(card => {
    const icon = card.icon || families[card.family]?.icon || "🃏";
    const family = card.family ? families[card.family]?.label || card.family : card.type;
    const type = card.type === "creature" ? `Evo ${card.stage}` : card.type;
    return `
      <button class="collection-card-mini ${card.rarity || "common"}" data-card-id="${card.cardId}" type="button">
        <div class="mini-card-art">${icon}</div>
        <strong>${card.name}</strong>
        <span>${family} · ${type}</span>
        <small>${shortRarity(card.rarity || "common")}</small>
      </button>
    `;
  }).join("");

  document.querySelectorAll(".collection-card-mini").forEach(button => {
    button.onclick = () => {
      const card = cards.find(item => item.cardId === button.dataset.cardId);
      if (card) showCardDetail(card.type === "creature" ? createCreatureCard(card) : { ...card, id: uid() });
    };
  });
}

function openRankPanel() {
  if (!rankModal || !rankProfileBox) return;

  const profile = getProfile();
  const total = (profile.wins || 0) + (profile.losses || 0);
  const winrate = total ? Math.round(((profile.wins || 0) / total) * 100) : 0;
  const level = getLevelFromXp(profile.xp || 0);
  const rankName =
    (profile.wins || 0) >= 40 ? "Master" :
    (profile.wins || 0) >= 25 ? "Diamante" :
    (profile.wins || 0) >= 14 ? "Oro" :
    (profile.wins || 0) >= 6 ? "Argento" :
    "Bronzo";

  rankProfileBox.innerHTML = `
    <div class="rank-avatar">${selectedAvatar}</div>
    <div>
      <strong>${playerNameInput.value.trim() || localStorage.getItem("playerName") || "Giocatore"}</strong>
      <span>Livello ${level} · Rank ${rankName}</span>
    </div>
    <div class="rank-mini-stats">
      <span>V ${profile.wins || 0}</span>
      <span>S ${profile.losses || 0}</span>
      <span>${winrate}%</span>
    </div>
  `;

  rankModal.classList.remove("hidden");
  setActiveNav("rank");
}

function closeAllAppSheets() {
  if (collectionModal) collectionModal.classList.add("hidden");
  if (rankModal) rankModal.classList.add("hidden");
  if (optionsHubModal) optionsHubModal.classList.add("hidden");
}

function showPremiumToast(text) {
  const toast = document.createElement("div");
  toast.className = "premium-toast";
  toast.textContent = text;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1400);
}

document.querySelectorAll(".deck-btn").forEach(button => {
  button.onclick = () => {
    document.querySelectorAll(".deck-btn").forEach(btn => btn.classList.remove("selected"));
    button.classList.add("selected");
    selectedDeck = button.dataset.deck;
    updateHomeSummary();
  };
});

document.querySelectorAll(".avatar-btn").forEach(button => {
  button.onclick = () => {
    document.querySelectorAll(".avatar-btn").forEach(btn => btn.classList.remove("selected"));
    button.classList.add("selected");
    selectedAvatar = button.dataset.avatar;
    localStorage.setItem("playerAvatar", selectedAvatar);
    renderProfile();
  };
});

document.querySelectorAll(".boss-btn").forEach(button => {
  button.onclick = () => {
    campaignModal.classList.add("hidden");
    startBotGame(button.dataset.boss);
  };
});

document.querySelectorAll(".quick-chat-msg").forEach(button => {
  button.onclick = async () => {
    const msg = button.dataset.msg;
    addLog(`${getMyPlayer()?.name || "Giocatore"}: ${msg}`);
    quickChatModal.classList.add("hidden");
    render();
    await saveOnlineGame();
  };
});


if (navHomeBtn) {
  navHomeBtn.onclick = () => {
    closeAllAppSheets();
    showOnlyMenu(true);
    setActiveNav("home");
  };
}

if (navPlayBtn) {
  navPlayBtn.onclick = () => {
    closeAllAppSheets();
    startBotGame();
    setActiveNav("play");
  };
}

if (navCollectionBtn) {
  navCollectionBtn.onclick = () => {
    openCollection("all");
  };
}

if (navRankBtn) {
  navRankBtn.onclick = () => {
    openRankPanel();
  };
}

if (navSettingsBtn) {
  navSettingsBtn.onclick = () => {
    closeAllAppSheets();
    openOptionsHub();
    setActiveNav("settings");
  };
}

if (closeCollectionBtn) {
  closeCollectionBtn.onclick = () => {
    collectionModal.classList.add("hidden");
    setActiveNav(gameScreen && !gameScreen.classList.contains("hidden") ? "play" : "home");
  };
}

if (collectionModal) {
  collectionModal.onclick = event => {
    if (event.target === collectionModal) {
      collectionModal.classList.add("hidden");
      setActiveNav(gameScreen && !gameScreen.classList.contains("hidden") ? "play" : "home");
    }
  };
}

if (closeRankBtn) {
  closeRankBtn.onclick = () => {
    rankModal.classList.add("hidden");
    setActiveNav(gameScreen && !gameScreen.classList.contains("hidden") ? "play" : "home");
  };
}

if (rankModal) {
  rankModal.onclick = event => {
    if (event.target === rankModal) {
      rankModal.classList.add("hidden");
      setActiveNav(gameScreen && !gameScreen.classList.contains("hidden") ? "play" : "home");
    }
  };
}

if (rankPlayBtn) {
  rankPlayBtn.onclick = () => {
    rankModal.classList.add("hidden");
    startBotGame();
  };
}

playBotBtn.onclick = () => startBotGame();
createOnlineBtn.onclick = createOnlineGame;
joinOnlineBtn.onclick = joinOnlineGame;
endTurnBtn.onclick = endTurn;

campaignBtn.onclick = () => campaignModal.classList.remove("hidden");
draftBtn.onclick = startDraft;

if (raidBtn) raidBtn.onclick = () => raidModal.classList.remove("hidden");
if (closeRaidBtn) closeRaidBtn.onclick = () => raidModal.classList.add("hidden");
if (startRaidBtn) {
  startRaidBtn.onclick = () => {
    raidModal.classList.add("hidden");
    startBotGame("draktharPrime");
  };
}

if (openOptionsHubBtn) openOptionsHubBtn.onclick = openOptionsHub;
if (closeOptionsHubBtn) closeOptionsHubBtn.onclick = closeOptionsHub;
if (summaryAvatarChip) summaryAvatarChip.onclick = openOptionsHub;
if (summaryDeckChip) summaryDeckChip.onclick = openOptionsHub;
if (summaryArenaChip) summaryArenaChip.onclick = openOptionsHub;

restartBtn.onclick = () => {
  if (gameMode === "bot" || gameMode === "campaign") {
    startBotGame(game?.players?.p2?.bossKey || null);
  } else {
    alert("Nelle partite online torna al menu e crea una nuova stanza.");
  }
};

backMenuBtn.onclick = () => showOnlyMenu();
leaveLobbyBtn.onclick = () => showOnlyMenu(true);
resultMenuBtn.onclick = () => showOnlyMenu(true);

playAgainBtn.onclick = () => {
  resultModal.classList.add("hidden");

  if (gameMode === "bot" || gameMode === "campaign") {
    startBotGame(game?.players?.p2?.bossKey || null);
  } else {
    showOnlyMenu(true);
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

copyInviteLinkBtn.onclick = async () => {
  if (!roomCode) return;

  try {
    await navigator.clipboard.writeText(getInviteLink());
    lobbyStatusText.textContent = "Link invito copiato.";
  } catch {
    lobbyStatusText.textContent = getInviteLink();
  }
};

toggleLogBtn.onclick = () => logWrapper.classList.toggle("collapsed");

cancelAttackBtn.onclick = () => {
  selectedAttackerIndex = null;
  setMessage("Attacco annullato.");
  render();
};

closeDetailBtn.onclick = () => cardDetailModal.classList.add("hidden");

cardDetailModal.onclick = event => {
  if (event.target === cardDetailModal) cardDetailModal.classList.add("hidden");
};

enemyHudBox.addEventListener("click", async () => {
  if (selectedAttackerIndex === null) return;
  if (!isMyTurn()) return;

  const me = getMyPlayer();
  const enemy = getEnemyPlayer();
  const attacker = me?.field[selectedAttackerIndex];

  if (!attacker) {
    selectedAttackerIndex = null;
    render();
    return;
  }

  if (!canAttackLife(attacker, enemy.field)) {
    setMessage("Non puoi attaccare direttamente: prima devi eliminare le creature che bloccano.");
    return;
  }

  await playerAttack(selectedAttackerIndex, "life");
  selectedAttackerIndex = null;
  render();
});

tutorialBtn.onclick = () => tutorialModal.classList.remove("hidden");

closeTutorialBtn.onclick = () => {
  localStorage.setItem("tutorialSeen", "yes");
  tutorialModal.classList.add("hidden");
};

tutorialModal.onclick = event => {
  if (event.target === tutorialModal) tutorialModal.classList.add("hidden");
};

leaderboardBtn.onclick = openLeaderboard;
closeLeaderboardBtn.onclick = () => leaderboardModal.classList.add("hidden");

leaderboardModal.onclick = event => {
  if (event.target === leaderboardModal) leaderboardModal.classList.add("hidden");
};

openMissionsBtn.onclick = () => {
  renderMissions();
  missionsModal.classList.remove("hidden");
};

closeMissionsBtn.onclick = () => missionsModal.classList.add("hidden");

closeCampaignBtn.onclick = () => campaignModal.classList.add("hidden");

closeDraftBtn.onclick = () => draftModal.classList.add("hidden");
startDraftGameBtn.onclick = startDraftGame;

openPackBtn.onclick = openPack;
closePackBtn.onclick = () => packModal.classList.add("hidden");

quickChatBtn.onclick = () => quickChatModal.classList.remove("hidden");
closeQuickChatBtn.onclick = () => quickChatModal.classList.add("hidden");

historyBtn.onclick = () => {
  renderHistory();
  historyModal.classList.remove("hidden");
};

closeHistoryBtn.onclick = () => historyModal.classList.add("hidden");

replayBtn.onclick = () => {
  renderReplay();
  replayModal.classList.remove("hidden");
};

closeReplayBtn.onclick = () => replayModal.classList.add("hidden");

cardBackSelect.onchange = () => {
  selectedCardBack = cardBackSelect.value;
  localStorage.setItem("cardBack", selectedCardBack);
};

arenaSkinSelect.onchange = () => {
  selectedArena = arenaSkinSelect.value;
  localStorage.setItem("arenaSkin", selectedArena);
  applyArenaSkin(selectedArena);
  updateHomeSummary();
};

playerNameInput.addEventListener("input", renderProfile);

const savedName = localStorage.getItem("playerName");
if (savedName) playerNameInput.value = savedName;

const savedAvatar = localStorage.getItem("playerAvatar");
if (savedAvatar) {
  selectedAvatar = savedAvatar;
  document.querySelectorAll(".avatar-btn").forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.avatar === savedAvatar);
  });
}

const savedCardBack = localStorage.getItem("cardBack");
if (savedCardBack && cardBackSelect) {
  selectedCardBack = savedCardBack;
  cardBackSelect.value = savedCardBack;
}

const savedArena = localStorage.getItem("arenaSkin");
if (savedArena && arenaSkinSelect) {
  selectedArena = savedArena;
  arenaSkinSelect.value = savedArena;
  applyArenaSkin(savedArena);
}

setupRoomFromUrl();
renderProfile();
updateHomeSummary();
showOnly(menuScreen);
updateBottomNavVisibility();
setActiveNav("home");

if (!localStorage.getItem("tutorialSeen")) {
  setTimeout(() => tutorialModal.classList.remove("hidden"), 450);
}

if (optionsHubModal) {
  optionsHubModal.onclick = event => {
    if (event.target === optionsHubModal) closeOptionsHub();
  };
}
