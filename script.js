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
const startGuidedTutorialBtn = $("startGuidedTutorialBtn");
const tutorialGuideBox = $("tutorialGuideBox");
const tutorialGuideTitle = $("tutorialGuideTitle");
const tutorialGuideText = $("tutorialGuideText");
const skipGuidedTutorialBtn = $("skipGuidedTutorialBtn");

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
const packHintText = $("packHintText");

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

const collectionModal = $("collectionModal");
const collectionBtn = $("collectionBtn");
const closeCollectionBtn = $("closeCollectionBtn");
const collectionList = $("collectionList");
const collectionSummary = $("collectionSummary");
const collectionFamilyFilter = $("collectionFamilyFilter");
const collectionRarityFilter = $("collectionRarityFilter");
const dustDuplicatesBtn = $("dustDuplicatesBtn");

const deckBuilderModal = $("deckBuilderModal");
const deckBuilderBtn = $("deckBuilderBtn");
const closeDeckBuilderBtn = $("closeDeckBuilderBtn");
const deckBuilderList = $("deckBuilderList");
const deckBuilderSummary = $("deckBuilderSummary");
const deckFamilyFilter = $("deckFamilyFilter");
const deckRarityFilter = $("deckRarityFilter");
const deckCostFilter = $("deckCostFilter");
const deckSearchInput = $("deckSearchInput");
const deckNameInput = $("deckNameInput");
const newDeckBtn = $("newDeckBtn");
const deleteDeckBtn = $("deleteDeckBtn");
const savedDecksList = $("savedDecksList");
const autoBuildDeckBtn = $("autoBuildDeckBtn");
const saveCustomDeckBtn = $("saveCustomDeckBtn");
const clearCustomDeckBtn = $("clearCustomDeckBtn");

const shopModal = $("shopModal");
const shopBtn = $("shopBtn");
const closeShopBtn = $("closeShopBtn");
const shopCurrencyText = $("shopCurrencyText");
const shopResult = $("shopResult");

const dailyRewardModal = $("dailyRewardModal");
const dailyRewardBtn = $("dailyRewardBtn");
const closeDailyRewardBtn = $("closeDailyRewardBtn");
const claimDailyRewardBtn = $("claimDailyRewardBtn");
const dailyRewardText = $("dailyRewardText");
const dailyRewardCards = $("dailyRewardCards");

const achievementsModal = $("achievementsModal");
const achievementsBtn = $("achievementsBtn");
const closeAchievementsBtn = $("closeAchievementsBtn");
const achievementsList = $("achievementsList");

const profileModal = $("profileModal");
const profileBtn = $("profileBtn");
const closeProfileBtn = $("closeProfileBtn");
const profileStatsBox = $("profileStatsBox");
const profileTitlesBox = $("profileTitlesBox");

const settingsModal = $("settingsModal");
const settingsBtn = $("settingsBtn");
const closeSettingsBtn = $("closeSettingsBtn");
const saveSettingsBtn = $("saveSettingsBtn");
const audioToggle = $("audioToggle");
const vibrationToggle = $("vibrationToggle");
const reducedMotionToggle = $("reducedMotionToggle");

const cardBackSelect = $("cardBackSelect");
const arenaSkinSelect = $("arenaSkinSelect");
const difficultySelect = $("difficultySelect");
const heroPowerBtn = $("heroPowerBtn");
const campaignMapModal = $("campaignMapModal");
const campaignMapList = $("campaignMapList");
const campaignProgressText = $("campaignProgressText");
const closeCampaignMapBtn = $("closeCampaignMapBtn");
const resetCampaignBtn = $("resetCampaignBtn");
const profileNameText = $("profileNameText");
const profileLevelText = $("profileLevelText");

const enemyHudBox = $("enemyHudBox");

const STARTING_LIFE = 30;
const STARTING_HAND = 5;
const MAX_FIELD_SIZE = 5;
const TURN_SECONDS = 60;

let selectedDeck = "balanced";
let selectedAvatar = "🧙";
let selectedCardBack = "classic";
let selectedArena = "default";
let selectedDifficulty = localStorage.getItem("botDifficulty") || "normal";
let selectedHero = localStorage.getItem("selectedHero") || "pyromancer";
let currentCampaignNode = null;
let activeDeckId = localStorage.getItem("ceaActiveDeckId") || "deck_1";

let game = null;
let gameMode = "bot";
let mySlot = "p1";
let roomCode = null;
let unsubscribeRoom = null;
let lastAttackCardId = null;
let selectedAttackerIndex = null;
let turnTimerInterval = null;
let guidedTutorialStep = 0;

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

const abilityLabels = {
  guard: "Guardia",
  haste: "Rapidità",
  flying: "Volare",
  rage: "Rabbia",
  poison: "Veleno",
  lifesteal: "Furto vitale",
  shield: "Scudo",
  regen: "Rigenera",
  growth: "Crescita",
  sniper: "Cecchino",
  burn: "Bruciatura",
  curse: "Maledizione",
  freeze: "Congela",
  bleed: "Sanguina",
  silence: "Silenzio",
  barrier: "Barriera",
  execute: "Esecuzione"
};

const abilityDescriptions = {
  guard: "Guardia: deve essere attaccata prima delle altre creature.",
  haste: "Rapidità: può attaccare subito quando entra.",
  flying: "Volare: può attaccare direttamente se il nemico non ha creature volanti.",
  rage: "Rabbia: quando subisce danno e sopravvive, guadagna +1 ATK.",
  poison: "Veleno: avvelena la creatura con cui combatte. Il veleno fa danno a inizio turno.",
  lifesteal: "Furto vitale: quando infligge danno in combattimento cura il proprietario.",
  shield: "Scudo: blocca il primo danno subito una volta entrata in campo.",
  regen: "Rigenera: a inizio turno recupera 1 HP.",
  growth: "Crescita: a inizio turno ottiene +1 ATK e +1 HP.",
  sniper: "Cecchino: può ignorare Guardia quando attacca una creatura.",
  burn: "Bruciatura: può incendiare i bersagli. Bruciato subisce 1 danno a inizio turno.",
  curse: "Maledizione: indebolisce il nemico nelle partite lunghe."
};

const deckLabels = {
  fire: "Fuoco",
  water: "Acqua",
  forest: "Foresta",
  shadow: "Ombra",
  light: "Luce",
  balanced: "Bilanciato",
  draft: "Draft",
  custom: "Mazzo personalizzato"
};

const difficultyLabels = {
  easy: "Facile",
  normal: "Normale",
  hard: "Difficile",
  nightmare: "Incubo"
};

const difficultyConfig = {
  easy: { life: 24, startEnergy: 0, smart: 0, reward: 0.85 },
  normal: { life: 30, startEnergy: 0, smart: 1, reward: 1 },
  hard: { life: 35, startEnergy: 1, smart: 2, reward: 1.25 },
  nightmare: { life: 40, startEnergy: 1, smart: 3, reward: 1.6 }
};

const heroData = {
  pyromancer: {
    name: "Mago del Fuoco",
    icon: "🔥",
    desc: "Infligge 2 danni diretti all'avversario.",
    cooldown: 3,
    type: "damage"
  },
  tidequeen: {
    name: "Regina degli Abissi",
    icon: "🌊",
    desc: "Pesca 1 carta e cura 1 vita.",
    cooldown: 3,
    type: "drawHeal"
  },
  druid: {
    name: "Druido Antico",
    icon: "🌿",
    desc: "Dà +1 ATK e +1 HP a una tua creatura.",
    cooldown: 3,
    type: "buff"
  },
  assassin: {
    name: "Assassino Ombra",
    icon: "🌑",
    desc: "Avvelena una creatura nemica. Se non ci sono creature, fa 1 danno.",
    cooldown: 3,
    type: "poison"
  },
  paladin: {
    name: "Paladino Solare",
    icon: "☀️",
    desc: "Dà Scudo a una tua creatura e cura 1 vita.",
    cooldown: 3,
    type: "shield"
  }
};

const campaignNodes = [
  { id: "arena", icon: "⚔️", title: "Arena degli Apprendisti", subtitle: "Battaglia introduttiva", boss: "apprentice", rewardGold: 70, rewardDust: 8 },
  { id: "forest", icon: "🌿", title: "Foresta Antica", subtitle: "Nemici con crescita e rabbia", boss: "knight", rewardGold: 90, rewardDust: 12 },
  { id: "volcano", icon: "🔥", title: "Vulcano Cremisi", subtitle: "Boss aggressivo Fuoco", boss: "dragon", rewardGold: 120, rewardDust: 18 },
  { id: "abyss", icon: "🌊", title: "Maree Eterne", subtitle: "Resistenza e controllo", boss: "apprentice", rewardGold: 130, rewardDust: 20 },
  { id: "shadow", icon: "🌑", title: "Regno delle Ombre", subtitle: "Veleno e danni sporchi", boss: "eclipse", rewardGold: 160, rewardDust: 26 },
  { id: "final", icon: "👑", title: "Signore dell'Evoluzione", subtitle: "Boss finale della campagna", boss: "final", rewardGold: 250, rewardDust: 45 }
];

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
  s("spell_energy", "Energia Antica", 0, "legendary", "🔮", "+2 energia nel turno.", "spellGainEnergy", ["balanced", "shadow", "light"]),
  s("spell_freeze", "Gelo Marino", 2, "rare", "❄️", "Congela la creatura nemica più pericolosa.", "spellFreeze", ["water", "balanced"]),
  s("spell_silence", "Sigillo del Silenzio", 2, "rare", "🔇", "Silenza una creatura nemica per 1 turno.", "spellSilence", ["light", "shadow", "balanced"]),
  s("spell_bleed", "Taglio Profondo", 1, "common", "🩸", "Applica sanguinamento a una creatura nemica.", "spellBleed", ["shadow", "fire", "balanced"]),
  s("spell_barrier", "Barriera Mistica", 2, "rare", "🛡️", "Dà Barriera a tutto il tuo campo.", "spellBarrier", ["light", "water", "balanced"])
];

const equipments = [
  e("eq_sword", "Spada di Fuoco", 2, "rare", "🗡️", "+2 ATK alla creatura.", "equipSword", ["fire", "forest", "balanced"]),
  e("eq_shield", "Scudo Antico", 2, "rare", "🛡️", "+3 HP e Guardia.", "equipShield", ["water", "light", "balanced"]),
  e("eq_wings", "Ali Mistiche", 3, "epic", "🪽", "Dà Volare.", "equipWings", ["light", "water", "balanced"]),
  e("eq_poison", "Lama Tossica", 2, "rare", "☠️", "Dà Veleno.", "equipPoison", ["shadow", "forest", "balanced"]),
  e("eq_frost", "Cristallo Gelido", 2, "rare", "❄️", "Dà Congela.", "equipFreeze", ["water", "balanced"]),
  e("eq_crown", "Corona del Duello", 3, "epic", "👑", "Dà Esecuzione e Barriera.", "equipDuelCrown", ["fire", "shadow", "balanced"])
];

const terrains = [
  t("terrain_sun", "Sole Rovente", 2, "rare", "☀️", "Per 3 turni le creature Fuoco hanno +1 ATK.", "sun", ["fire", "balanced"]),
  t("terrain_fog", "Nebbia Oscura", 2, "rare", "🌫️", "Per 2 turni blocca gli attacchi diretti.", "fog", ["shadow", "balanced"]),
  t("terrain_tide", "Marea Alta", 2, "rare", "🌊", "Per 3 turni le creature Acqua hanno +2 HP.", "tide", ["water", "balanced"]),
  t("terrain_swamp", "Palude Velenosa", 3, "epic", "☠️", "Per 3 turni il veleno fa 2 danni.", "swamp", ["shadow", "balanced"])
];



/* =========================
   V15 - PIÙ CARTE E MAZZI PIÙ RICCHI
   ========================= */
function addV15Content() {
  families.fire.cards.push(
    c("fire_4", "Salamandra", "fire", 1, 2, 4, 1, "common", "Creatura fuoco stabile, utile per evolvere.", null, []),
    c("fire_5", "Berserker di Brace", "fire", 1, 3, 2, 1, "common", "Attacca forte ma resiste poco.", null, ["haste"]),
    c("fire_6", "Mago di Brace", "fire", 2, 3, 5, 2, "rare", "Quando entra infligge 1 danno diretto.", "burnEnemy", ["burn"]),
    c("fire_7", "Golem di Magma", "fire", 2, 5, 6, 3, "rare", "Corpo pesante per il centro campo.", null, ["guard"]),
    c("fire_8", "Cacciatore Vulcanico", "fire", 2, 5, 4, 3, "epic", "Rapido e aggressivo.", null, ["haste"]),
    c("fire_9", "Spirito della Lava", "fire", 3, 7, 6, 4, "epic", "Quando entra fa danno diretto.", "burnEnemy", ["flying"]),
    c("fire_10", "Fenice Imperiale", "fire", 3, 6, 9, 5, "legendary", "Quando entra colpisce tutto il campo nemico.", "fireStorm", ["flying", "regen"]),
    c("fire_11", "Colosso Infernale", "fire", 3, 9, 8, 5, "legendary", "Enorme creatura d'attacco.", null, ["guard", "burn"])
  );

  families.water.cards.push(
    c("water_4", "Sirena Curatrice", "water", 1, 1, 4, 1, "common", "Quando entra cura 2 vita.", "healOwner", []),
    c("water_5", "Guardiano Corallino", "water", 1, 1, 6, 2, "common", "Blocca gli attacchi iniziali.", null, ["guard"]),
    c("water_6", "Mago delle Maree", "water", 2, 2, 6, 2, "rare", "Quando entra pesca una carta.", "drawOne", []),
    c("water_7", "Tartaruga Antica", "water", 2, 2, 10, 3, "rare", "Difensore molto resistente.", null, ["guard", "regen"]),
    c("water_8", "Leviatano Giovane", "water", 2, 4, 7, 3, "epic", "Cura il proprietario quando entra.", "healOwner", []),
    c("water_9", "Spirito della Nebbia", "water", 3, 5, 8, 4, "epic", "Quando entra pesca una carta.", "drawOne", ["flying"]),
    c("water_10", "Regina degli Abissi", "water", 3, 5, 12, 5, "legendary", "Cura e resiste a lungo.", "bigHealOwner", ["guard", "regen"]),
    c("water_11", "Oceano Vivente", "water", 3, 6, 13, 6, "legendary", "Quando entra pesca una carta.", "drawOne", ["guard"])
  );

  families.forest.cards.push(
    c("forest_4", "Scoiattolo Selvaggio", "forest", 1, 1, 3, 1, "common", "Piccola creatura rapida.", null, ["haste"]),
    c("forest_5", "Lupo Verde", "forest", 1, 3, 3, 2, "common", "Buon attacco iniziale.", null, ["rage"]),
    c("forest_6", "Druido Antico", "forest", 2, 2, 6, 2, "rare", "Dà +1 ATK a un alleato.", "buffAllyAttack", ["growth"]),
    c("forest_7", "Ent Giovane", "forest", 2, 3, 8, 3, "rare", "Difensore naturale.", null, ["guard", "growth"]),
    c("forest_8", "Cervo Sacro", "forest", 2, 4, 5, 3, "epic", "Cura il campo quando entra.", "healTeam", []),
    c("forest_9", "Bestia Rampicante", "forest", 3, 7, 7, 4, "epic", "Cresce ogni turno.", null, ["growth", "rage"]),
    c("forest_10", "Spirito della Foresta", "forest", 3, 6, 10, 5, "legendary", "Dà HP a tutto il campo.", "buffTeamHp", ["regen"]),
    c("forest_11", "Madre Natura", "forest", 3, 7, 11, 6, "legendary", "Potenzia il campo e cresce.", "buffTeamHp", ["growth", "regen"])
  );

  families.shadow.cards.push(
    c("shadow_4", "Corvo Notturno", "shadow", 1, 2, 2, 1, "common", "Volante e fastidioso.", null, ["flying"]),
    c("shadow_5", "Assassino Silente", "shadow", 1, 3, 2, 2, "common", "Ignora Guardia quando colpisce creature.", null, ["sniper"]),
    c("shadow_6", "Strega del Vuoto", "shadow", 2, 3, 5, 2, "rare", "Indebolisce un nemico.", "weakenEnemy", ["poison"]),
    c("shadow_7", "Demone Minore", "shadow", 2, 5, 4, 3, "rare", "Ruba vita in combattimento.", null, ["lifesteal"]),
    c("shadow_8", "Lama d'Ombra", "shadow", 2, 6, 3, 3, "epic", "Cecchino aggressivo.", null, ["sniper", "poison"]),
    c("shadow_9", "Mietitore", "shadow", 3, 7, 6, 4, "epic", "Quando entra fa danno diretto.", "darkBlast", ["lifesteal"]),
    c("shadow_10", "Vampiro Antico", "shadow", 3, 6, 9, 5, "legendary", "Ruba vita e avvelena.", null, ["lifesteal", "poison", "flying"]),
    c("shadow_11", "Re del Vuoto", "shadow", 3, 9, 7, 6, "legendary", "Danno diretto e pressione costante.", "darkBlast", ["sniper", "poison"])
  );

  families.light.cards.push(
    c("light_4", "Scudiero Sacro", "light", 1, 1, 5, 1, "common", "Protegge il campo.", null, ["guard"]),
    c("light_5", "Monaco Solare", "light", 1, 2, 4, 2, "common", "Rigenera salute.", null, ["regen"]),
    c("light_6", "Angelo Custode", "light", 2, 3, 7, 2, "rare", "Difesa volante.", null, ["flying", "guard"]),
    c("light_7", "Paladino Dorato", "light", 2, 4, 8, 3, "rare", "Scudo iniziale e Guardia.", null, ["guard", "shield"]),
    c("light_8", "Sacerdotessa", "light", 2, 2, 7, 3, "epic", "Cura il campo.", "healTeam", ["regen"]),
    c("light_9", "Leone Solare", "light", 3, 7, 8, 4, "epic", "Creatura solida da chiusura.", null, ["guard"]),
    c("light_10", "Giudice Celeste", "light", 3, 6, 10, 5, "legendary", "Cura e protegge.", "bigHealOwner", ["shield", "flying"]),
    c("light_11", "Imperatore della Luce", "light", 3, 7, 12, 6, "legendary", "Difensore finale.", "healTeam", ["guard", "shield", "regen"])
  );

  spells.push(
    s("spell_flame_wave", "Ondata di Fiamme", 3, "rare", "🔥", "2 danni a tutte le creature nemiche.", "spellStorm", ["fire", "balanced"]),
    s("spell_inferno", "Inferno", 4, "epic", "🌋", "2 danni al campo nemico.", "spellStorm", ["fire", "balanced"]),
    s("spell_tide_call", "Richiamo della Marea", 2, "rare", "🌊", "Pesca 2 carte.", "spellDrawTwo", ["water", "balanced"]),
    s("spell_deep_heal", "Cura Profonda", 3, "epic", "💧", "Cura 4 vita.", "spellHeal", ["water", "light", "balanced"]),
    s("spell_wild_growth", "Crescita Selvaggia", 3, "rare", "🌿", "+1 ATK e +1 HP al campo.", "spellBlessing", ["forest", "balanced"]),
    s("spell_roots", "Radici Vive", 1, "common", "🌱", "Pesca 2 carte.", "spellDrawTwo", ["forest", "balanced"]),
    s("spell_void", "Colpo del Vuoto", 2, "rare", "🌑", "3 danni a un bersaglio.", "spellFireball", ["shadow", "balanced"]),
    s("spell_dark_ritual", "Rituale Oscuro", 0, "epic", "🔮", "+2 energia nel turno.", "spellGainEnergy", ["shadow", "balanced"]),
    s("spell_holy_light", "Luce Sacra", 2, "common", "☀️", "Cura 4 vita.", "spellHeal", ["light", "balanced"]),
    s("spell_judgement", "Giudizio", 4, "epic", "⚖️", "2 danni a tutte le creature nemiche.", "spellStorm", ["light", "balanced"])
  );

  equipments.push(
    e("eq_flame_claw", "Artigli di Fiamma", 1, "common", "🔥", "+2 ATK alla creatura.", "equipSword", ["fire", "balanced"]),
    e("eq_coral_armor", "Armatura Corallina", 2, "rare", "🪸", "+3 HP e Guardia.", "equipShield", ["water", "balanced"]),
    e("eq_nature_totem", "Totem Verde", 2, "rare", "🌿", "+3 HP e Guardia.", "equipShield", ["forest", "balanced"]),
    e("eq_shadow_blade", "Pugnale Ombra", 2, "rare", "🗡️", "+2 ATK alla creatura.", "equipSword", ["shadow", "balanced"]),
    e("eq_solar_aegis", "Egida Solare", 3, "epic", "🛡️", "+3 HP e Guardia.", "equipShield", ["light", "balanced"])
  );

  terrains.push(
    t("terrain_volcano", "Arena Vulcanica", 2, "rare", "🌋", "Per 3 turni le creature Fuoco hanno +1 ATK.", "sun", ["fire", "balanced"]),
    t("terrain_lagoon", "Laguna Eterna", 2, "rare", "🌊", "Per 3 turni le creature Acqua hanno +2 HP.", "tide", ["water", "balanced"]),
    t("terrain_grove", "Bosco Sacro", 2, "rare", "🌳", "Per 3 turni aiuta la crescita del campo.", "tide", ["forest", "balanced"]),
    t("terrain_void", "Portale del Vuoto", 3, "epic", "🌑", "Per 3 turni il veleno fa 2 danni.", "swamp", ["shadow", "balanced"]),
    t("terrain_temple", "Tempio Solare", 2, "rare", "🏛️", "Per 2 turni blocca gli attacchi diretti.", "fog", ["light", "balanced"])
  );
}

addV15Content();

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
    gold: 250,
    dust: 0,
    missions: {},
    collection: {},
    achievements: {},
    dailyMissions: {},
    settings: { audio: true, vibration: true, reducedMotion: false },
    title: "Apprendista dell'Arena"
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

function getCampaignProgress() {
  const raw = localStorage.getItem("ceaCampaignProgress");
  if (!raw) return { completed: [] };
  try {
    const data = JSON.parse(raw);
    return { completed: Array.isArray(data.completed) ? data.completed : [] };
  } catch {
    return { completed: [] };
  }
}

function saveCampaignProgress(progress) {
  localStorage.setItem("ceaCampaignProgress", JSON.stringify(progress));
}

function isCampaignNodeUnlocked(index, progress = getCampaignProgress()) {
  if (index === 0) return true;
  return progress.completed.includes(campaignNodes[index - 1].id);
}

function openCampaignMap() {
  if (!campaignMapModal || !campaignMapList) {
    campaignModal.classList.remove("hidden");
    return;
  }
  renderCampaignMap();
  campaignMapModal.classList.remove("hidden");
}

function renderCampaignMap() {
  const progress = getCampaignProgress();
  const done = progress.completed.length;
  if (campaignProgressText) {
    campaignProgressText.textContent = `Progresso campagna: ${done}/${campaignNodes.length}`;
  }
  campaignMapList.innerHTML = campaignNodes.map((node, index) => {
    const completed = progress.completed.includes(node.id);
    const unlocked = isCampaignNodeUnlocked(index, progress);
    const status = completed ? "Completato" : unlocked ? "Gioca" : "Bloccato";
    const cls = completed ? "completed" : unlocked ? "current" : "locked";
    return `
      <button class="campaign-node ${cls}" data-node="${node.id}" ${unlocked ? "" : "disabled"}>
        <span class="node-icon">${node.icon}</span>
        <span><b>${index + 1}. ${node.title}</b><small>${node.subtitle} · Premio: ${node.rewardGold} oro / ${node.rewardDust} polvere</small></span>
        <span class="node-status">${status}</span>
      </button>
    `;
  }).join("");

  campaignMapList.querySelectorAll(".campaign-node:not(.locked)").forEach(button => {
    button.onclick = () => startCampaignNode(button.dataset.node);
  });
}

function startCampaignNode(nodeId) {
  const node = campaignNodes.find(item => item.id === nodeId);
  if (!node) return;
  currentCampaignNode = node;
  if (campaignMapModal) campaignMapModal.classList.add("hidden");
  startBotGame(node.boss);
  if (modeText) modeText.textContent = `Campagna · ${node.title}`;
  addLog(`Nodo campagna: ${node.title}. Vinci per sbloccare il prossimo livello.`);
  render();
}

function completeCampaignNodeIfNeeded(won) {
  if (!won || gameMode !== "campaign" || !currentCampaignNode) return;
  const progress = getCampaignProgress();
  if (!progress.completed.includes(currentCampaignNode.id)) {
    progress.completed.push(currentCampaignNode.id);
    saveCampaignProgress(progress);
  }
  const profile = getProfile();
  profile.gold = (profile.gold || 0) + (currentCampaignNode.rewardGold || 0);
  profile.dust = (profile.dust || 0) + (currentCampaignNode.rewardDust || 0);
  saveProfile(profile);
  addLog(`Ricompensa campagna: +${currentCampaignNode.rewardGold || 0} oro e +${currentCampaignNode.rewardDust || 0} polvere.`);
}

function updateHeroPowerButton() {
  if (!heroPowerBtn || !game || !game.players?.[mySlot]) return;
  const me = getMyPlayer();
  const hero = heroData[me.heroKey];
  const visible = Boolean(hero && game.status === "playing" && !game.winner && gameMode !== "tutorial");
  heroPowerBtn.classList.toggle("hidden", !visible);
  if (!visible) return;

  const cooldown = me.heroCooldown || 0;
  heroPowerBtn.textContent = cooldown > 0
    ? `${hero.icon} ${cooldown} turni`
    : `${hero.icon} Potere`;
  heroPowerBtn.disabled = !isMyTurn() || cooldown > 0;
}

async function useHeroPower() {
  if (!isMyTurn()) return;
  const me = getMyPlayer();
  const enemy = getEnemyPlayer();
  if (!me || !enemy) return;
  const hero = heroData[me.heroKey];
  if (!hero || (me.heroCooldown || 0) > 0) return;

  if (hero.type === "damage") {
    dealLifeDamage(me, enemy, 2, enemyHudBox);
    addLog(`${hero.name}: infligge 2 danni diretti.`);
  }

  if (hero.type === "drawHeal") {
    drawCard(me);
    healLife(me, 1, document.querySelector(".my-bar"));
    addLog(`${hero.name}: pesca 1 carta e cura 1 vita.`);
  }

  if (hero.type === "buff") {
    if (me.field.length) {
      const target = [...me.field].sort((a, b) => (b.attack + b.currentHp) - (a.attack + a.currentHp))[0];
      target.attack += 1;
      target.maxHp += 1;
      target.currentHp += 1;
      addLog(`${hero.name}: ${target.name} ottiene +1 ATK e +1 HP.`);
      playEquipmentFx(target);
    } else {
      setMessage("Evoca una creatura prima di usare questo potere.");
      return;
    }
  }

  if (hero.type === "poison") {
    if (enemy.field.length) {
      const target = [...enemy.field].sort((a, b) => b.attack - a.attack)[0];
      target.poisoned = true;
      addLog(`${hero.name}: ${target.name} è avvelenata.`);
      playAttackFx(enemyFieldEl);
    } else {
      dealLifeDamage(me, enemy, 1, enemyHudBox);
      addLog(`${hero.name}: nessuna creatura nemica, infligge 1 danno.`);
    }
  }

  if (hero.type === "shield") {
    if (me.field.length) {
      const target = [...me.field].sort((a, b) => a.currentHp - b.currentHp)[0];
      if (!target.abilities.includes("shield")) target.abilities.push("shield");
      healLife(me, 1, document.querySelector(".my-bar"));
      addLog(`${hero.name}: dà Scudo a ${target.name} e cura 1 vita.`);
      playEquipmentFx(target);
    } else {
      healLife(me, 2, document.querySelector(".my-bar"));
      addLog(`${hero.name}: cura 2 vita.`);
    }
  }

  me.heroCooldown = hero.cooldown || 3;
  checkGameOver();
  render();
  await saveOnlineGame();
}

function renderProfile() {
  const profile = getProfile();
  const name = playerNameInput.value.trim() || localStorage.getItem("playerName") || "Giocatore";
  const level = getLevelFromXp(profile.xp);
  const next = level * 100;
  const currentBase = (level - 1) * 100;

  if (profileNameText) profileNameText.textContent = `${selectedAvatar} ${name}`;
  if (profileLevelText) {
    profileLevelText.textContent = `Livello ${level} · XP ${profile.xp - currentBase}/${next - currentBase} · Oro ${profile.gold || 0} · Polvere ${profile.dust || 0}`;
  }
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
  const savedCustomDeck = !forcedDeck && deckType === "custom" ? getSavedCustomDeckCards() : null;

  return {
    id: getPlayerId(),
    name,
    avatar: getPlayerAvatar(),
    life: STARTING_LIFE,
    energy: 0,
    maxEnergy: 0,
    deckType,
    deck: forcedDeck || savedCustomDeck || createDeck(deckType),
    heroKey: selectedHero,
    heroCooldown: 0,
    hand: [],
    field: [],
    stats: makeStats()
  };
}

function makeBot(bossKey = null) {
  const boss = bossData[bossKey] || null;
  const deckType = boss?.deck || "balanced";
  const diff = difficultyConfig[selectedDifficulty] || difficultyConfig.normal;
  const baseLife = boss?.life || diff.life || STARTING_LIFE;

  return {
    id: "bot",
    name: boss?.name || `Bot ${difficultyLabels[selectedDifficulty] || "Normale"}`,
    avatar: boss?.avatar || "🤖",
    bossKey,
    bossPower: boss?.power || null,
    life: boss ? Math.round(baseLife + (diff.life - STARTING_LIFE) / 2) : baseLife,
    energy: 0,
    maxEnergy: diff.startEnergy || 0,
    difficulty: selectedDifficulty,
    deckType,
    deck: createBotDeck(deckType, selectedDifficulty),
    heroKey: null,
    heroCooldown: 0,
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

function createBotDeck(deckType, difficulty = "normal") {
  const base = createDeck(deckType);
  if (difficulty === "easy") {
    return shuffle(base.filter(card => (card.rarity || "common") !== "legendary").concat(base.slice(0, 6))).slice(0, base.length);
  }
  if (difficulty === "hard" || difficulty === "nightmare") {
    const premium = base.filter(card => ["rare", "epic", "legendary"].includes(card.rarity || "common"));
    const extra = premium.map(card => cloneCardForDeck(card));
    return shuffle([...base, ...extra]).slice(0, Math.max(base.length, difficulty === "nightmare" ? 44 : 40));
  }
  return base;
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
    burned: false,
    frozen: 0,
    bleeding: false,
    silenced: 0,
    shieldUsed: false,
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


const guidedTutorialSteps = [
  {
    title: "Tutorial 1/6 · Evoca",
    text: "Trascina Scintilla dalla mano al tuo campo. Guarda il costo energia in alto sulla carta."
  },
  {
    title: "Tutorial 2/6 · Fine turno",
    text: "Premi Fine turno. Le tue creature si preparano e avrai più energia al turno dopo."
  },
  {
    title: "Tutorial 3/6 · Attacca",
    text: "Tocca Scintilla nel tuo campo, poi tocca il riquadro del nemico per attaccare la vita."
  },
  {
    title: "Tutorial 4/6 · Evolvi",
    text: "Trascina Lupo Ardente sopra Scintilla. È un'evoluzione Fuoco di livello successivo."
  },
  {
    title: "Tutorial 5/6 · Ricarica energia",
    text: "Premi Fine turno un'altra volta per avere energia sufficiente per la magia."
  },
  {
    title: "Tutorial 6/6 · Magia",
    text: "Trascina Palla Fuoco sul campo avversario per infliggere danni diretti."
  },
  {
    title: "Tutorial completato",
    text: "Hai imparato le basi: evocazione, attacco, evoluzione e magia. Ora puoi giocare una partita vera."
  }
];

function stopGuidedTutorial(resetMode = true) {
  document.body.classList.remove("guided-tutorial");
  guidedTutorialStep = 0;
  if (tutorialGuideBox) tutorialGuideBox.classList.add("hidden");
  if (resetMode && gameMode === "tutorial") {
    gameMode = "bot";
  }
}

function updateGuidedTutorialBox() {
  if (!tutorialGuideBox || gameMode !== "tutorial") return;
  const step = guidedTutorialSteps[guidedTutorialStep] || guidedTutorialSteps[guidedTutorialSteps.length - 1];
  tutorialGuideTitle.textContent = step.title;
  tutorialGuideText.textContent = step.text;
  tutorialGuideBox.classList.remove("hidden");
}

function guidedTutorialAdvance(eventName, data = {}) {
  if (gameMode !== "tutorial") return;

  if (guidedTutorialStep === 0 && eventName === "playCreature" && data.card?.cardId === "fire_1") {
    guidedTutorialStep = 1;
  } else if (guidedTutorialStep === 1 && eventName === "endTurn") {
    guidedTutorialStep = 2;
  } else if (guidedTutorialStep === 2 && eventName === "attack") {
    guidedTutorialStep = 3;
  } else if (guidedTutorialStep === 3 && eventName === "evolve" && data.card?.cardId === "fire_2") {
    guidedTutorialStep = 4;
  } else if (guidedTutorialStep === 4 && eventName === "endTurn") {
    guidedTutorialStep = 5;
  } else if (guidedTutorialStep === 5 && eventName === "spell" && data.card?.cardId === "spell_fireball") {
    guidedTutorialStep = 6;
    localStorage.setItem("tutorialSeen", "yes");
    setTimeout(() => {
      try { openPack(); } catch { /* ignore */ }
    }, 600);
  } else {
    return;
  }

  updateGuidedTutorialBox();
  if (guidedTutorialStep < 6) {
    createFxText("Passaggio completato", "evolve", true);
  } else {
    createFxText("Tutorial completato", "evolve");
  }
}

function findTemplate(cardId) {
  return allCollectibleTemplates().find(card => card.cardId === cardId);
}

function createCardFromTemplateId(cardId) {
  const template = findTemplate(cardId);
  if (!template) return null;
  if (template.type === "creature") return createCreatureCard(template);
  if (template.type === "spell") return createSpellCard(template);
  if (template.type === "equipment") return createEquipmentCard(template);
  if (template.type === "terrain") return createTerrainCard(template);
  return { ...template, id: uid() };
}

function startGuidedTutorial() {
  tutorialModal.classList.add("hidden");
  resultModal.classList.add("hidden");
  cardDetailModal.classList.add("hidden");
  packModal.classList.add("hidden");

  if (unsubscribeRoom) {
    unsubscribeRoom();
    unsubscribeRoom = null;
  }

  gameMode = "tutorial";
  roomCode = null;
  mySlot = "p1";
  selectedAttackerIndex = null;
  lastAttackCardId = null;
  guidedTutorialStep = 0;

  const name = getPlayerName();
  const p1 = makePlayer(name, "fire", []);
  const p2 = makeBot(null);

  p1.life = 30;
  p1.maxEnergy = 1;
  p1.energy = 1;
  p1.hand = [
    createCardFromTemplateId("fire_1"),
    createCardFromTemplateId("fire_2"),
    createCardFromTemplateId("spell_fireball")
  ].filter(Boolean);
  p1.deck = [
    createCardFromTemplateId("fire_3"),
    createCardFromTemplateId("eq_sword"),
    createCardFromTemplateId("terrain_sun")
  ].filter(Boolean);
  p1.field = [];

  p2.name = "Maestro Tutorial";
  p2.avatar = "📘";
  p2.life = 18;
  p2.hand = [];
  p2.deck = [];
  p2.field = [];
  p2.maxEnergy = 0;
  p2.energy = 0;

  game = createBaseGame("tutorial", p1, p2);
  game.log = ["Tutorial guidato avviato."];
  game.replay = ["Tutorial guidato avviato."];
  game.turnStartedAt = Date.now();

  modeText.textContent = "Tutorial guidato";
  roomInfoText.textContent = "";
  document.body.classList.add("guided-tutorial");
  showOnly(gameScreen);
  updateGuidedTutorialBox();
  render();
}

function startBotGame(bossKey = null, forcedDeck = null) {
  stopGuidedTutorial(false);
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
    ? `Campagna · ${p2.name} · ${difficultyLabels[selectedDifficulty]}`
    : `Bot ${difficultyLabels[selectedDifficulty]} · ${deckLabels[selectedDeck]}`;

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
  if (typeof player.heroCooldown === "number" && player.heroCooldown > 0) {
    player.heroCooldown = Math.max(0, player.heroCooldown - 1);
  }

  tickTerrain(g);
  applyStartTurnStatus(player);
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
}

function prepareCreatures(player) {
  player.field.forEach(card => {
    if (hasAbility(card, "regen") && card.currentHp < card.maxHp) {
      card.currentHp = Math.min(card.maxHp, card.currentHp + 1);
      addLog(`${card.name} rigenera 1 HP.`);
    }

    if (hasAbility(card, "growth")) {
      card.attack += 1;
      card.maxHp += 1;
      card.currentHp += 1;
      addLog(`${card.name} cresce: +1 ATK e +1 HP.`);
    }

    card.canAttack = true;
    card.hasAttacked = false;
  });
}

function applyStartTurnStatus(player) {
  const poisonDamage = game?.activeTerrain?.type === "swamp" ? 2 : 1;

  player.field.forEach(card => {
    if (card.poisoned) {
      card.currentHp -= poisonDamage;
      addLog(`${card.name} subisce ${poisonDamage} danno da veleno.`);
      showMiniStatusText(card.id, "☠️ Veleno");
    }

    if (card.burned) {
      card.currentHp -= 1;
      addLog(`${card.name} subisce 1 danno da bruciatura.`);
      showMiniStatusText(card.id, "🔥 Brucia");
    }

    if (card.bleeding) {
      card.currentHp -= 1;
      card.bleeding = false;
      addLog(`${card.name} perde 1 HP da sanguinamento.`);
      showMiniStatusText(card.id, "🩸 Sanguina");
    }

    if (card.silenced && card.silenced > 0) {
      card.silenced -= 1;
      if (card.silenced === 0) addLog(`${card.name} recupera le abilità.`);
    }

    if (hasAbility(card, "regen") && card.currentHp > 0) {
      const before = card.currentHp;
      card.currentHp = Math.min(card.maxHp, card.currentHp + 1);
      if (card.currentHp > before) showMiniStatusText(card.id, "🌱 +1 HP");
    }

    if (hasAbility(card, "growth") && card.currentHp > 0) {
      card.attack += 1;
      card.maxHp += 1;
      card.currentHp += 1;
      addLog(`${card.name} cresce: +1 ATK e +1 HP.`);
      showMiniStatusText(card.id, "🌿 Crescita");
    }

    if (hasAbility(card, "curse") && card.attack > 0) {
      card.attack = Math.max(0, card.attack - 1);
      addLog(`${card.name} perde 1 ATK per Maledizione.`);
      showMiniStatusText(card.id, "🌑 -1 ATK");
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
  guidedTutorialAdvance("playCreature", { card, owner });

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
  guidedTutorialAdvance("evolve", { card: evolution, owner });

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
  guidedTutorialAdvance("spell", { card: spell, owner });

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

  if (eq.effect === "equipFreeze") {
    if (!target.abilities.includes("freeze")) target.abilities.push("freeze");
  }

  if (eq.effect === "equipDuelCrown") {
    if (!target.abilities.includes("execute")) target.abilities.push("execute");
    if (!target.abilities.includes("barrier")) target.abilities.push("barrier");
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

    case "spellFreeze": {
      const target = chooseSpellTarget(opponent.field);
      if (target) {
        target.frozen = Math.max(target.frozen || 0, 1);
        addLog(`${spell.name} congela ${target.name}.`);
        showMiniStatusText(target.id, "❄️ Congela");
      }
      break;
    }

    case "spellSilence": {
      const target = chooseSpellTarget(opponent.field);
      if (target) {
        target.silenced = Math.max(target.silenced || 0, 1);
        addLog(`${spell.name} silenzia ${target.name}.`);
        showMiniStatusText(target.id, "🔇 Silenzio");
      }
      break;
    }

    case "spellBleed": {
      const target = chooseSpellTarget(opponent.field);
      if (target) {
        target.bleeding = true;
        addLog(`${spell.name} fa sanguinare ${target.name}.`);
        showMiniStatusText(target.id, "🩸 Sanguina");
      } else {
        dealLifeDamage(owner, opponent, 1, enemyHudBox);
      }
      break;
    }

    case "spellBarrier":
      owner.field.forEach(creature => {
        if (!creature.abilities.includes("barrier")) creature.abilities.push("barrier");
      });
      addLog(`${spell.name} dà Barriera al tuo campo.`);
      break;

    default:
      break;
  }
}

function chooseSpellTarget(field) {
  if (!field || !field.length) return null;
  const guard = field.find(card => hasAbility(card, "guard"));
  if (guard) return guard;
  return [...field].sort((a, b) => cardThreatValue(b) - cardThreatValue(a))[0];
}

function cardThreatValue(card) {
  if (!card) return 0;
  const abilityScore = { guard: 3, flying: 3, poison: 2, lifesteal: 4, shield: 4, regen: 3, growth: 5, freeze: 4, silence: 4, barrier: 3, execute: 4, burn: 3, bleed: 3 };
  return (card.attack || 0) * 2 + (card.currentHp || card.hp || 0) + (card.stage || 0) * 2 + (card.abilities || []).reduce((sum, a) => sum + (abilityScore[a] || 1), 0);
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

    if (guards.length && !hasAbility(target, "guard") && !hasAbility(attacker, "sniper")) {
      setMessage("Devi attaccare prima Guardia. Le creature con Cecchino possono ignorarla.");
      return;
    }

    fight(attacker, target, me, enemy);
  }

  guidedTutorialAdvance("attack", { attacker });
  checkGameOver();
  render();

  setTimeout(() => {
    lastAttackCardId = null;
    render();
  }, 320);

  await saveOnlineGame();
}

function fight(attacker, defender, attackerOwner, defenderOwner) {
  let damageToDefender = attacker.attack;
  let damageToAttacker = defender.attack;

  if (hasAbility(attacker, "execute") && defender.currentHp < defender.maxHp) {
    damageToDefender += 2;
    addLog(`${attacker.name} attiva Esecuzione: +2 danni.`);
  }

  if (hasAbility(defender, "execute") && attacker.currentHp < attacker.maxHp) {
    damageToAttacker += 2;
    addLog(`${defender.name} attiva Esecuzione: +2 danni.`);
  }

  if (hasAbility(defender, "barrier")) {
    damageToDefender = Math.max(0, damageToDefender - 1);
  }

  if (hasAbility(attacker, "barrier")) {
    damageToAttacker = Math.max(0, damageToAttacker - 1);
  }

  if (hasAbility(defender, "shield") && !defender.shieldUsed) {
    damageToDefender = 0;
    defender.shieldUsed = true;
    addLog(`${defender.name} blocca il danno con Scudo.`);
  }

  if (hasAbility(attacker, "shield") && !attacker.shieldUsed) {
    damageToAttacker = 0;
    attacker.shieldUsed = true;
    addLog(`${attacker.name} blocca il danno con Scudo.`);
  }

  defender.currentHp -= damageToDefender;
  attacker.currentHp -= damageToAttacker;
  attacker.hasAttacked = true;

  attackerOwner.stats.damageDealt += damageToDefender;
  attackerOwner.stats.damageTaken += damageToAttacker;
  defenderOwner.stats.damageDealt += damageToAttacker;
  defenderOwner.stats.damageTaken += damageToDefender;

  if (damageToDefender > 0 && hasAbility(attacker, "lifesteal")) {
    healLife(attackerOwner, Math.min(3, damageToDefender));
    addLog(`${attacker.name} attiva Furto vitale.`);
  }

  if (damageToAttacker > 0 && hasAbility(defender, "lifesteal")) {
    healLife(defenderOwner, Math.min(3, damageToAttacker));
    addLog(`${defender.name} attiva Furto vitale.`);
  }

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

  if (hasAbility(attacker, "burn") && defender.currentHp > 0) {
    defender.burned = true;
    addLog(`${defender.name} prende fuoco.`);
  }

  if (hasAbility(defender, "burn") && attacker.currentHp > 0) {
    attacker.burned = true;
    addLog(`${attacker.name} prende fuoco.`);
  }

  if (hasAbility(attacker, "freeze") && defender.currentHp > 0) {
    defender.frozen = Math.max(defender.frozen || 0, 1);
    addLog(`${defender.name} viene congelata.`);
  }

  if (hasAbility(defender, "freeze") && attacker.currentHp > 0) {
    attacker.frozen = Math.max(attacker.frozen || 0, 1);
    addLog(`${attacker.name} viene congelata.`);
  }

  if (hasAbility(attacker, "bleed") && defender.currentHp > 0) {
    defender.bleeding = true;
    addLog(`${defender.name} sanguina.`);
  }

  if (hasAbility(defender, "bleed") && attacker.currentHp > 0) {
    attacker.bleeding = true;
    addLog(`${attacker.name} sanguina.`);
  }

  if (hasAbility(attacker, "silence") && defender.currentHp > 0) {
    defender.silenced = Math.max(defender.silenced || 0, 1);
    addLog(`${defender.name} è silenziata per 1 turno.`);
  }

  if (hasAbility(defender, "silence") && attacker.currentHp > 0) {
    attacker.silenced = Math.max(attacker.silenced || 0, 1);
    addLog(`${attacker.name} è silenziata per 1 turno.`);
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
  if (game?.activeTerrain?.type === "fog" && !hasAbility(attacker, "sniper")) return false;
  if (!defenderField.length) return true;
  if (defenderField.some(card => hasAbility(card, "guard")) && !hasAbility(attacker, "sniper")) return false;

  if (hasAbility(attacker, "flying")) {
    return !defenderField.some(card => hasAbility(card, "flying"));
  }

  return false;
}

function hasAbility(card, ability) {
  if (!card || (card.silenced && card.silenced > 0)) return false;
  return Array.isArray(card.abilities) && card.abilities.includes(ability);
}

async function endTurn() {
  if (!isMyTurn()) return;

  selectedAttackerIndex = null;

  const me = getMyPlayer();
  const next = getEnemySlot();

  addLog(`${me.name} termina il turno.`);

  if (gameMode === "tutorial") {
    game.turnNumber++;
    game.players.p1.stats.turns = game.turnNumber;
    game.players.p2.stats.turns = game.turnNumber;
    startTurn("p1");
    guidedTutorialAdvance("endTurn");
    render();
    return;
  }

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
  const intelligence = difficultyConfig[bot.difficulty || selectedDifficulty]?.smart || 1;

  let action = true;
  let count = 0;

  while (action && count < 10) {
    count++;
    action = false;

    const lethalSpell = bot.hand.find(card =>
      card.type === "spell" &&
      card.cost <= bot.energy &&
      card.effect === "spellFireball" &&
      player.life <= 3
    );
    if (lethalSpell && intelligence >= 1) {
      playSpell(bot, player, lethalSpell.id);
      action = true;
      continue;
    }

    const evolution = chooseBestEvolution(bot);
    if (evolution) {
      const index = bot.field.findIndex(fieldCard =>
        fieldCard.family === evolution.family &&
        fieldCard.stage === evolution.stage - 1
      );
      evolveCreature(bot, player, evolution.id, index);
      action = true;
      continue;
    }

    const usefulSpell = chooseBestBotSpell(bot, player, intelligence);
    if (usefulSpell) {
      playSpell(bot, player, usefulSpell.id);
      action = true;
      continue;
    }

    const equipment = chooseBestEquipment(bot, intelligence);
    if (equipment) {
      const targetIndex = chooseEquipmentTargetIndex(bot, equipment, intelligence);
      playEquipment(bot, equipment.id, targetIndex);
      action = true;
      continue;
    }

    const terrain = bot.hand.find(card =>
      card.type === "terrain" &&
      card.cost <= bot.energy &&
      !game.activeTerrain &&
      (intelligence >= 2 || bot.field.length >= 1)
    );
    if (terrain) {
      playTerrain(bot, terrain.id);
      action = true;
      continue;
    }

    const creature = chooseBestCreatureToPlay(bot, intelligence);
    if (creature && bot.field.length < MAX_FIELD_SIZE) {
      playCreature(bot, player, creature.id);
      action = true;
    }
  }

  const attackers = [...bot.field].sort((a, b) => {
    if (intelligence >= 2) return b.attack - a.attack;
    return 0;
  });

  attackers.forEach(attacker => {
    if (game.winner) return;
    if (!bot.field.includes(attacker)) return;
    if (!attacker.canAttack || attacker.hasAttacked) return;

    lastAttackCardId = attacker.id;

    if (canAttackLife(attacker, player.field) && (player.life <= attacker.attack || intelligence >= 2 && player.life <= attacker.attack + 3)) {
      dealLifeDamage(bot, player, attacker.attack, document.querySelector(".my-bar"));
      attacker.hasAttacked = true;
      addLog(`${bot.name} attacca direttamente e infligge ${attacker.attack} danni.`);
    } else if (player.field.length) {
      const guards = player.field.filter(card => hasAbility(card, "guard"));
      const target = guards[0] || chooseBotTarget(player.field, attacker, intelligence);
      fight(attacker, target, bot, player);
    } else if (canAttackLife(attacker, player.field)) {
      dealLifeDamage(bot, player, attacker.attack, document.querySelector(".my-bar"));
      attacker.hasAttacked = true;
      addLog(`${bot.name} infligge ${attacker.attack} danni diretti.`);
    }

    checkGameOver();
  });

  setTimeout(() => {
    lastAttackCardId = null;
    render();
  }, 320);
}

function chooseBestEvolution(bot) {
  return bot.hand
    .filter(card => card.type === "creature" && card.stage > 1 && card.cost <= bot.energy)
    .filter(card => bot.field.some(fieldCard => fieldCard.family === card.family && fieldCard.stage === card.stage - 1))
    .sort((a, b) => (b.stage - a.stage) || (b.attack + b.hp - a.attack - a.hp))[0];
}

function chooseBestCreatureToPlay(bot, intelligence = 1) {
  const playable = bot.hand.filter(card => card.type === "creature" && card.stage === 1 && card.cost <= bot.energy);
  if (!playable.length) return null;
  if (intelligence < 2) return playable[0];
  return playable.sort((a, b) => (b.attack + b.hp + (b.abilities?.length || 0)) - (a.attack + a.hp + (a.abilities?.length || 0)))[0];
}

function chooseBestEquipment(bot, intelligence = 1) {
  const playable = bot.hand.filter(card => card.type === "equipment" && card.cost <= bot.energy && bot.field.length);
  if (!playable.length) return null;
  if (intelligence < 2) return playable[0];
  return playable.sort((a, b) => b.cost - a.cost)[0];
}

function chooseEquipmentTargetIndex(bot, equipment, intelligence = 1) {
  if (intelligence < 2) return 0;
  let best = 0;
  bot.field.forEach((card, index) => {
    if ((card.attack + card.currentHp) > (bot.field[best].attack + bot.field[best].currentHp)) best = index;
  });
  return best;
}

function chooseBestBotSpell(bot, player, intelligence = 1) {
  const spellsPlayable = bot.hand.filter(card => card.type === "spell" && card.cost <= bot.energy && shouldBotUseSpell(card, bot, player));
  if (!spellsPlayable.length) return null;
  if (intelligence < 2) return spellsPlayable[0];

  return spellsPlayable.sort((a, b) => {
    const score = spellBotScore(b, bot, player) - spellBotScore(a, bot, player);
    return score || b.cost - a.cost;
  })[0];
}

function spellBotScore(spell, bot, player) {
  if (spell.effect === "spellFireball") return player.life <= 3 ? 100 : player.field.length ? 45 : 30;
  if (spell.effect === "spellStorm") return player.field.length * 18;
  if (spell.effect === "spellHeal") return bot.life <= 12 ? 55 : 8;
  if (spell.effect === "spellDrawTwo") return bot.hand.length <= 2 ? 50 : 20;
  if (spell.effect === "spellBlessing") return bot.field.length * 15;
  if (spell.effect === "spellGainEnergy") return bot.hand.some(card => card.cost > bot.energy) ? 35 : 12;
  return 10;
}

function shouldBotUseSpell(spell, bot, player) {
  if (spell.effect === "spellHeal") return bot.life <= STARTING_LIFE - 5;
  if (spell.effect === "spellDrawTwo") return bot.hand.length <= 3;
  if (spell.effect === "spellBlessing") return bot.field.length >= 2;
  if (spell.effect === "spellStorm") return player.field.length >= 2;
  if (spell.effect === "spellGainEnergy") return bot.hand.some(card => card.cost > bot.energy);
  return true;
}

function chooseBotTarget(field, attacker = null, intelligence = 1) {
  if (intelligence < 2 || !attacker) {
    return [...field].sort((a, b) => a.currentHp - b.currentHp)[0];
  }

  const killable = field
    .filter(card => card.currentHp <= attacker.attack)
    .sort((a, b) => (b.attack + b.currentHp) - (a.attack + a.currentHp))[0];
  if (killable) return killable;

  return [...field].sort((a, b) => b.attack - a.attack || a.currentHp - b.currentHp)[0];
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
  if (!game || game.matchRewardSaved) return;
  game.matchRewardSaved = true;

  const me = getMyPlayer();
  if (!me) return;

  const won = game.winner === mySlot;
  const profile = normalizeProfile();
  const diff = difficultyConfig[selectedDifficulty] || difficultyConfig.normal;
  const multiplier = gameMode === "campaign" ? diff.reward + 0.25 : diff.reward;

  if (won) profile.wins = (profile.wins || 0) + 1;
  else profile.losses = (profile.losses || 0) + 1;

  const xp = Math.round((won ? 35 : 15) * multiplier);
  const gold = Math.round((won ? 80 : 30) * multiplier);
  const dust = Math.round((won ? 12 : 4) * multiplier);
  profile.xp += xp;
  profile.gold = (profile.gold || 0) + gold;
  profile.dust = (profile.dust || 0) + dust;

  let bonusCard = null;
  if (won || Math.random() < 0.35) {
    bonusCard = randomItem(allCollectibleTemplates());
    if (bonusCard) profile.collection[cardKey(bonusCard)] = (profile.collection[cardKey(bonusCard)] || 0) + 1;
  }

  game.lastRewards = {
    xp,
    gold,
    dust,
    bonusCard: bonusCard ? `${bonusCard.icon || families[bonusCard.family]?.icon || "🃏"} ${bonusCard.name}` : null,
    difficulty: difficultyLabels[selectedDifficulty] || "Normale"
  };

  updateDailyMissionProgress("play", 1);
  if (won) updateDailyMissionProgress("win", 1);
  updateDailyMissionProgress("creatures", me.stats?.creaturesPlayed || 0);
  updateDailyMissionProgress("spells", me.stats?.spellsPlayed || 0);
  updateDailyMissionProgress("evolutions", me.stats?.evolutions || 0);

  saveProfile(profile);
  saveHistory(won);
  completeCampaignNodeIfNeeded(won);
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
  const rewards = game?.lastRewards || { xp: won ? 35 : 15, gold: won ? 80 : 30, dust: won ? 12 : 4 };
  resultText.textContent = won
    ? `Hai vinto. +${rewards.xp} XP, +${rewards.gold} oro, +${rewards.dust} polvere${rewards.bonusCard ? `, carta: ${rewards.bonusCard}` : ""}`
    : `Hai perso. +${rewards.xp} XP, +${rewards.gold} oro, +${rewards.dust} polvere${rewards.bonusCard ? `, carta: ${rewards.bonusCard}` : ""}`;

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
  updateHeroPowerButton();

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
  } else if (gameMode === "tutorial") {
    modeText.textContent = "Tutorial guidato";
    updateGuidedTutorialBox();
  } else if (gameMode === "campaign") {
    modeText.textContent = `Campagna · ${enemy.name} · ${difficultyLabels[selectedDifficulty]}`;
  } else {
    modeText.textContent = `Bot ${difficultyLabels[selectedDifficulty]} · ${deckLabels[selectedDeck]}`;
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

function getStatusBadges(card) {
  const badges = [];
  if (card.poisoned) badges.push(`<span class="status-chip poison">☠️</span>`);
  if (card.burned) badges.push(`<span class="status-chip burn">🔥</span>`);
  if (card.frozen && card.frozen > 0) badges.push(`<span class="status-chip freeze">❄️</span>`);
  if (card.bleeding) badges.push(`<span class="status-chip bleed">🩸</span>`);
  if (card.silenced && card.silenced > 0) badges.push(`<span class="status-chip silence">🔇</span>`);
  if (hasAbility(card, "shield") && !card.shieldUsed) badges.push(`<span class="status-chip shield">🛡️</span>`);
  return badges.join("");
}

function abilityIcon(ability) {
  const map = {
    guard: "🛡️", haste: "⚡", flying: "🪽", rage: "💢", poison: "☠️", lifesteal: "🩸",
    shield: "✨", regen: "🌱", growth: "🌿", sniper: "🎯", burn: "🔥", curse: "🌑",
    freeze: "❄️", bleed: "🩸", silence: "🔇", barrier: "🛡️", execute: "⚔️"
  };
  return map[ability] || "✦";
}

function createCardEl(card, extraClass) {
  const el = document.createElement("div");

  if (card.type === "creature") {
    el.className = `card creature ${card.family} ${card.rarity} ${extraClass}`;

    const hpPercent = Math.max(0, Math.min(100, Math.round((card.currentHp / card.maxHp) * 100)));
    const abilities = (card.abilities || [])
      .map(ability => `<span class="ability" title="${abilityLabels[ability]}">${abilityIcon(ability)}</span>`)
      .join("");

    const equipped = card.equipped?.length
      ? `<span class="badge legendary">EQ ${card.equipped.length}</span>`
      : "";

    const statusBadges = getStatusBadges(card);

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

        <div class="status-row">${statusBadges}</div>
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
}

function playEvolveFx(card) {
  createFxFlash("evolve");
  createFxText("Evoluzione!", "evolve");
  animateCardById(card?.id, "fx-card-evolve", "light");
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
  maybeVibrate(won ? [30, 40, 30] : 60);
  createFxFlash(won ? "win" : "lose");
  createFxText(won ? "Vittoria!" : "Sconfitta", won ? "evolve" : "attack");
}

function showMiniStatusText(cardId, text) {
  requestAnimationFrame(() => {
    const el = findCardElementById(cardId);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const tag = document.createElement("div");
    tag.className = "mini-status-pop";
    tag.textContent = text;
    tag.style.left = `${rect.left + rect.width / 2}px`;
    tag.style.top = `${rect.top + 12}px`;
    document.body.appendChild(tag);
    setTimeout(() => tag.remove(), 900);
  });
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
    maybeVibrate(35);
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
  currentCampaignNode = null;

  resultModal.classList.add("hidden");
  cardDetailModal.classList.add("hidden");

  stopGuidedTutorial(false);
  showOnly(menuScreen);
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
  if (packHintText) packHintText.textContent = "Tocca le carte coperte per rivelarle.";
  const found = openRewardPack("base", true);
  packCards.innerHTML = renderPackCards(found);
  attachPackRevealEvents(packCards);
}

function cardKey(card) {
  return card.cardId || card.name;
}

function normalizeProfile() {
  const profile = getProfile();
  profile.gold = profile.gold || 0;
  profile.dust = profile.dust || 0;
  profile.collection = profile.collection || {};
  profile.achievements = profile.achievements || {};
  profile.dailyMissions = profile.dailyMissions || {};
  profile.settings = profile.settings || { audio: true, vibration: true, reducedMotion: false };
  profile.title = profile.title || "Apprendista dell'Arena";
  return profile;
}

function allCollectibleTemplates() {
  return allDraftTemplates().filter(card => card.cardId);
}

function addCardToCollection(card, amount = 1) {
  const profile = normalizeProfile();
  const key = cardKey(card);
  profile.collection[key] = (profile.collection[key] || 0) + amount;
  saveProfile(profile);
}

function getOwnedCount(card) {
  const profile = normalizeProfile();
  return profile.collection[cardKey(card)] || 0;
}

function openRewardPack(packType = "base", save = true) {
  const pool = allCollectibleTemplates();
  const cards = [];

  const byRarity = rarity => pool.filter(card => (card.rarity || "common") === rarity);
  const pickByRarity = rarity => randomItem(byRarity(rarity).length ? byRarity(rarity) : pool);
  const pickAny = () => randomItem(pool);

  if (packType === "legendary") {
    cards.push(pickByRarity(Math.random() < 0.35 ? "legendary" : "epic"));
    cards.push(pickByRarity(Math.random() < 0.45 ? "rare" : "common"));
    cards.push(pickAny());
    cards.push(pickAny());
    cards.push(pickAny());
  } else if (packType === "rare") {
    cards.push(pickByRarity(Math.random() < 0.2 ? "epic" : "rare"));
    cards.push(pickAny());
    cards.push(pickAny());
    cards.push(pickAny());
  } else {
    cards.push(pickAny());
    cards.push(pickAny());
    cards.push(pickAny());
  }

  const result = cards.map(card => ({
    ...card,
    __wasNew: getOwnedCount(card) <= 0
  }));

  if (save) {
    result.forEach(card => addCardToCollection(card, 1));
  }

  return result;
}

function renderPackCards(cards, revealed = false) {
  return cards.map((card, index) => {
    const familyLabel = card.family ? families[card.family]?.label : (card.type || "Carta");
    const rarity = card.rarity || "common";
    const badge = card.__wasNew
      ? `<span class="new-badge">Nuova carta</span>`
      : `<span class="duplicate-badge">Doppione</span>`;

    return `
      <button type="button" class="pack-card reveal-card rarity-${rarity} ${revealed ? "revealed" : ""}" data-pack-index="${index}">
        <span class="card-back-cover">🎴<br>Rivela</span>
        <span class="card-front">
          ${card.icon || families[card.family]?.icon || "🃏"}<br>
          <strong>${card.name}</strong><br>
          <small>${familyLabel} · ${shortRarity(rarity)}</small><br>
          ${badge}
        </span>
      </button>
    `;
  }).join("");
}

function attachPackRevealEvents(container) {
  if (!container) return;

  const cards = [...container.querySelectorAll(".reveal-card")];
  cards.forEach(card => {
    card.onclick = () => {
      if (card.classList.contains("revealed")) return;
      card.classList.add("revealed");
      createParticlesFromElement(card, card.classList.contains("rarity-legendary") ? "light" : "blue", 12);

      const allRevealed = cards.every(item => item.classList.contains("revealed"));
      if (allRevealed && packHintText && container === packCards) {
        packHintText.textContent = "Pacchetto aperto. Le carte sono state aggiunte alla collezione.";
      }
    };
  });
}


function renderCollection() {
  const profile = normalizeProfile();
  const familyFilter = collectionFamilyFilter?.value || "all";
  const rarityFilter = collectionRarityFilter?.value || "all";
  const cards = allCollectibleTemplates().filter(card => {
    if (familyFilter !== "all" && card.family !== familyFilter && !(card.decks || []).includes(familyFilter)) return false;
    if (rarityFilter !== "all" && (card.rarity || "common") !== rarityFilter) return false;
    return true;
  });

  const ownedUnique = allCollectibleTemplates().filter(card => (profile.collection[cardKey(card)] || 0) > 0).length;
  const totalUnique = allCollectibleTemplates().length;
  collectionSummary.textContent = `Carte diverse: ${ownedUnique}/${totalUnique} · Oro ${profile.gold || 0} · Polvere ${profile.dust || 0}`;

  collectionList.innerHTML = cards.map(card => {
    const count = profile.collection[cardKey(card)] || 0;
    const locked = count <= 0;
    const familyLabel = card.family ? families[card.family]?.label : (card.type || "Carta");
    return `
      <div class="collection-card ${locked ? "locked" : ""}">
        <strong>${locked ? "❔ Carta non trovata" : `${card.icon || families[card.family]?.icon || "🃏"} ${card.name}`}</strong>
        <small>${familyLabel} · ${shortRarity(card.rarity || "common")} · copie ${count}</small>
      </div>
    `;
  }).join("");
}

function openCollection() {
  collectionModal.classList.remove("hidden");
  renderCollection();
}

function dustDuplicates() {
  const profile = normalizeProfile();
  let gained = 0;
  const rarityDust = { common: 5, rare: 20, epic: 80, legendary: 250 };

  allCollectibleTemplates().forEach(card => {
    const key = cardKey(card);
    const count = profile.collection[key] || 0;
    if (count > 1) {
      const extra = count - 1;
      gained += extra * (rarityDust[card.rarity || "common"] || 5);
      profile.collection[key] = 1;
    }
  });

  profile.dust = (profile.dust || 0) + gained;
  saveProfile(profile);
  alert(gained ? `Hai ottenuto ${gained} polvere.` : "Non hai doppioni da convertire.");
  renderCollection();
}

function openShop() {
  const profile = normalizeProfile();
  shopCurrencyText.textContent = `Oro ${profile.gold || 0} · Polvere ${profile.dust || 0}`;
  shopResult.innerHTML = "";
  shopModal.classList.remove("hidden");
}

function buyPack(packType) {
  const costs = { base: 100, rare: 250, legendary: 700 };
  const cost = costs[packType] || 100;
  const profile = normalizeProfile();

  if ((profile.gold || 0) < cost) {
    alert(`Oro insufficiente. Ti servono ${cost} oro.`);
    return;
  }

  profile.gold -= cost;
  saveProfile(profile);
  const cards = openRewardPack(packType, true);
  shopCurrencyText.textContent = `Oro ${profile.gold || 0} · Polvere ${profile.dust || 0}`;
  shopResult.innerHTML = renderPackCards(cards);
  attachPackRevealEvents(shopResult);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function openDailyReward() {
  const profile = normalizeProfile();
  const claimed = profile.lastDailyReward === todayKey();
  dailyRewardText.textContent = claimed
    ? "Hai già riscattato la ricompensa di oggi. Torna domani."
    : "Ricompensa pronta: 120 oro + 1 pacchetto base.";
  claimDailyRewardBtn.disabled = claimed;
  if (dailyRewardCards) dailyRewardCards.innerHTML = "";
  dailyRewardModal.classList.remove("hidden");
}

function claimDailyReward() {
  const profile = normalizeProfile();
  if (profile.lastDailyReward === todayKey()) return;
  profile.lastDailyReward = todayKey();
  profile.gold = (profile.gold || 0) + 120;
  saveProfile(profile);
  const cards = openRewardPack("base", true);
  dailyRewardText.textContent = "Ricompensa riscattata: +120 oro. Tocca le carte per rivelarle.";
  if (dailyRewardCards) {
    dailyRewardCards.innerHTML = renderPackCards(cards);
    attachPackRevealEvents(dailyRewardCards);
  }
  claimDailyRewardBtn.disabled = true;
}

const achievementDefs = [
  { id: "first_win", title: "Prima vittoria", test: p => (p.wins || 0) >= 1, reward: 100 },
  { id: "ten_wins", title: "10 vittorie", test: p => (p.wins || 0) >= 10, reward: 300 },
  { id: "collector_10", title: "Collezionista I", test: p => Object.values(p.collection || {}).filter(v => v > 0).length >= 10, reward: 150 },
  { id: "collector_30", title: "Collezionista II", test: p => Object.values(p.collection || {}).filter(v => v > 0).length >= 30, reward: 350 },
  { id: "level_5", title: "Livello 5", test: p => getLevelFromXp(p.xp || 0) >= 5, reward: 250 }
];

function renderAchievements() {
  const profile = normalizeProfile();
  achievementsList.innerHTML = achievementDefs.map(a => {
    const done = a.test(profile);
    const claimed = profile.achievements?.[a.id];
    return `
      <div class="mission-row">
        <strong>${done ? "✅" : "⬜"} ${a.title}</strong><br>
        Premio: ${a.reward} oro · ${claimed ? "riscattato" : done ? `<button class="claim-achievement-btn" data-id="${a.id}">Riscatta</button>` : "non completato"}
      </div>
    `;
  }).join("");

  document.querySelectorAll(".claim-achievement-btn").forEach(btn => {
    btn.onclick = () => claimAchievement(btn.dataset.id);
  });
}

function claimAchievement(id) {
  const profile = normalizeProfile();
  const achievement = achievementDefs.find(a => a.id === id);
  if (!achievement || profile.achievements?.[id] || !achievement.test(profile)) return;
  profile.achievements[id] = true;
  profile.gold = (profile.gold || 0) + achievement.reward;
  saveProfile(profile);
  renderAchievements();
}

function openAchievements() {
  achievementsModal.classList.remove("hidden");
  renderAchievements();
}

function getSavedDecks() {
  let decks = [];
  try { decks = JSON.parse(localStorage.getItem("ceaSavedDecks") || "[]"); }
  catch { decks = []; }
  if (!Array.isArray(decks) || decks.length === 0) {
    decks = [{ id: "deck_1", name: "Mazzo 1", cards: [] }];
    localStorage.setItem("ceaSavedDecks", JSON.stringify(decks));
  }
  if (!decks.some(deck => deck.id === activeDeckId)) activeDeckId = decks[0].id;
  localStorage.setItem("ceaActiveDeckId", activeDeckId);
  return decks;
}

function saveSavedDecks(decks) {
  localStorage.setItem("ceaSavedDecks", JSON.stringify(decks));
}

function getActiveDeck() {
  const decks = getSavedDecks();
  return decks.find(deck => deck.id === activeDeckId) || decks[0];
}

function getCustomDeckList() {
  return getActiveDeck().cards || [];
}

function saveCustomDeckList(list) {
  const decks = getSavedDecks();
  const deck = decks.find(d => d.id === activeDeckId) || decks[0];
  deck.cards = list;
  if (deckNameInput && deckNameInput.value.trim()) deck.name = deckNameInput.value.trim();
  saveSavedDecks(decks);
}

function getSavedCustomDeckCards() {
  const list = getCustomDeckList();
  if (list.length < 30) return null;
  const templates = allCollectibleTemplates();
  const cards = list.map(id => templates.find(card => cardKey(card) === id)).filter(Boolean).map(cloneCardForDeck);
  return cards.length >= 30 ? shuffle(cards) : null;
}

function getMaxCopiesForCard(card) {
  if ((card.rarity || "common") === "legendary") return 1;
  if ((card.rarity || "common") === "epic") return 2;
  if ((card.rarity || "common") === "rare") return 2;
  return 3;
}

function openDeckBuilder() {
  deckBuilderModal.classList.remove("hidden");
  renderDeckBuilder();
}

function renderSavedDecks() {
  const decks = getSavedDecks();
  const active = getActiveDeck();
  if (deckNameInput) deckNameInput.value = active.name || "Mazzo";
  if (!savedDecksList) return;
  savedDecksList.innerHTML = decks.map(deck => `
    <button class="saved-deck-pill ${deck.id === activeDeckId ? "active" : ""}" data-id="${deck.id}">
      ${deck.name || "Mazzo"} · ${(deck.cards || []).length}
    </button>
  `).join("");
  document.querySelectorAll(".saved-deck-pill").forEach(btn => {
    btn.onclick = () => {
      activeDeckId = btn.dataset.id;
      localStorage.setItem("ceaActiveDeckId", activeDeckId);
      renderDeckBuilder();
    };
  });
}

function renderDeckBuilder() {
  const profile = normalizeProfile();
  const custom = getCustomDeckList();
  renderSavedDecks();
  const filter = deckFamilyFilter?.value || "all";
  const rarity = deckRarityFilter?.value || "all";
  const cost = deckCostFilter?.value || "all";
  const search = (deckSearchInput?.value || "").trim().toLowerCase();
  const cards = allCollectibleTemplates().filter(card => {
    const owned = profile.collection[cardKey(card)] || 0;
    if (owned <= 0) return false;
    if (filter !== "all" && card.family !== filter && !(card.decks || []).includes(filter)) return false;
    if (rarity !== "all" && (card.rarity || "common") !== rarity) return false;
    if (cost === "0-1" && card.cost > 1) return false;
    if (cost === "2-3" && (card.cost < 2 || card.cost > 3)) return false;
    if (cost === "4+" && card.cost < 4) return false;
    if (search && !card.name.toLowerCase().includes(search)) return false;
    return true;
  });

  const active = getActiveDeck();
  const valid = custom.length >= 30 && custom.length <= 40;
  deckBuilderSummary.textContent = `${active.name || "Mazzo"}: ${custom.length}/30 carte · massimo 40 · ${valid ? "pronto" : "non valido"}`;
  deckBuilderList.innerHTML = cards.map(card => {
    const key = cardKey(card);
    const count = custom.filter(id => id === key).length;
    const max = Math.min(getMaxCopiesForCard(card), profile.collection[key] || 0);
    const familyLabel = card.family ? families[card.family]?.label : (card.type || "Carta");
    return `
      <div class="deck-build-card">
        <strong>${card.icon || families[card.family]?.icon || "🃏"} ${card.name}</strong>
        <small>${familyLabel} · ${shortRarity(card.rarity || "common")} · costo ${card.cost} · possedute ${profile.collection[key] || 0} · max ${max}</small>
        <div class="deck-build-actions">
          <button class="deck-remove-card" data-id="${key}">−</button>
          <div class="deck-count-pill">${count}</div>
          <button class="deck-add-card" data-id="${key}">+</button>
        </div>
      </div>
    `;
  }).join("") || `<div class="mission-row">Nessuna carta trovata. Cambia filtri o apri pacchetti.</div>`;

  document.querySelectorAll(".deck-add-card").forEach(btn => btn.onclick = () => addCardToCustomDeck(btn.dataset.id));
  document.querySelectorAll(".deck-remove-card").forEach(btn => btn.onclick = () => removeCardFromCustomDeck(btn.dataset.id));
}

function addCardToCustomDeck(id) {
  const profile = normalizeProfile();
  const card = allCollectibleTemplates().find(ca => cardKey(ca) === id);
  if (!card) return;
  const custom = getCustomDeckList();
  const current = custom.filter(x => x === id).length;
  const max = Math.min(getMaxCopiesForCard(card), profile.collection[id] || 0);
  if (custom.length >= 40) return alert("Il mazzo può avere massimo 40 carte.");
  if (current >= max) return alert("Hai raggiunto il limite copie per questa carta.");
  custom.push(id);
  saveCustomDeckList(custom);
  renderDeckBuilder();
}

function removeCardFromCustomDeck(id) {
  const custom = getCustomDeckList();
  const index = custom.indexOf(id);
  if (index >= 0) custom.splice(index, 1);
  saveCustomDeckList(custom);
  renderDeckBuilder();
}

function autoBuildDeck() {
  const profile = normalizeProfile();
  const filter = deckFamilyFilter?.value || selectedDeck || "balanced";
  const owned = allCollectibleTemplates().filter(card => {
    if ((profile.collection[cardKey(card)] || 0) <= 0) return false;
    if (filter !== "all" && filter !== "balanced" && card.family !== filter && !(card.decks || []).includes(filter)) return false;
    return true;
  });
  const sorted = shuffle(owned).sort((a, b) => {
    const rarityScore = { legendary: 4, epic: 3, rare: 2, common: 1 };
    return (rarityScore[b.rarity] || 1) - (rarityScore[a.rarity] || 1) || b.cost - a.cost;
  });
  const list = [];
  sorted.forEach(card => {
    const max = Math.min(getMaxCopiesForCard(card), profile.collection[cardKey(card)] || 0);
    for (let i = 0; i < max && list.length < 30; i++) list.push(cardKey(card));
  });
  saveCustomDeckList(list);
  renderDeckBuilder();
}

function createNewDeck() {
  const decks = getSavedDecks();
  const id = `deck_${Date.now()}`;
  const name = deckNameInput?.value?.trim() || `Mazzo ${decks.length + 1}`;
  decks.push({ id, name, cards: [] });
  activeDeckId = id;
  localStorage.setItem("ceaActiveDeckId", activeDeckId);
  saveSavedDecks(decks);
  renderDeckBuilder();
}

function deleteActiveDeck() {
  let decks = getSavedDecks();
  if (decks.length <= 1) {
    decks[0].cards = [];
    saveSavedDecks(decks);
    renderDeckBuilder();
    return;
  }
  decks = decks.filter(deck => deck.id !== activeDeckId);
  activeDeckId = decks[0].id;
  localStorage.setItem("ceaActiveDeckId", activeDeckId);
  saveSavedDecks(decks);
  renderDeckBuilder();
}

function saveAndUseCustomDeck() {
  const list = getCustomDeckList();
  if (list.length < 30) return alert("Il mazzo deve avere almeno 30 carte.");
  if (deckNameInput?.value.trim()) saveCustomDeckList(list);
  selectedDeck = "custom";
  document.querySelectorAll(".deck-btn").forEach(btn => btn.classList.remove("selected"));
  alert("Mazzo salvato. Ora quando premi Gioca userai il mazzo personalizzato selezionato.");
  deckBuilderModal.classList.add("hidden");
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

const dailyMissionDefs = [
  { id: "play", label: "Gioca 1 partita", target: 1, rewardGold: 50, rewardXp: 15 },
  { id: "win", label: "Vinci 1 partita", target: 1, rewardGold: 90, rewardXp: 25 },
  { id: "creatures", label: "Evoca 6 creature", target: 6, rewardGold: 60, rewardXp: 20 },
  { id: "spells", label: "Usa 3 magie", target: 3, rewardGold: 60, rewardXp: 20 },
  { id: "evolutions", label: "Fai 2 evoluzioni", target: 2, rewardGold: 70, rewardXp: 25 }
];

function ensureDailyMissions(profile = normalizeProfile()) {
  const today = todayKey();
  if (!profile.dailyMissions || profile.dailyMissions.date !== today) {
    profile.dailyMissions = {
      date: today,
      progress: {},
      claimed: {}
    };
    saveProfile(profile);
  }
  return profile.dailyMissions;
}

function updateDailyMissionProgress(id, amount) {
  const profile = normalizeProfile();
  const daily = ensureDailyMissions(profile);
  daily.progress[id] = (daily.progress[id] || 0) + amount;
  profile.dailyMissions = daily;
  saveProfile(profile);
}

function claimDailyMission(id) {
  const profile = normalizeProfile();
  const daily = ensureDailyMissions(profile);
  const def = dailyMissionDefs.find(m => m.id === id);
  if (!def || daily.claimed[id]) return;
  if ((daily.progress[id] || 0) < def.target) return;
  daily.claimed[id] = true;
  profile.gold = (profile.gold || 0) + def.rewardGold;
  profile.xp = (profile.xp || 0) + def.rewardXp;
  profile.dailyMissions = daily;
  saveProfile(profile);
  renderMissions();
}

function renderMissions() {
  const profile = normalizeProfile();
  const daily = ensureDailyMissions(profile);

  missionsList.innerHTML = dailyMissionDefs.map(def => {
    const progress = Math.min(def.target, daily.progress[def.id] || 0);
    const done = progress >= def.target;
    const claimed = daily.claimed[def.id];
    return `
      <div class="mission-row">
        <strong>${done ? "✅" : "⬜"} ${def.label}</strong><br>
        Progresso: ${progress}/${def.target} · Premio: ${def.rewardGold} oro + ${def.rewardXp} XP<br>
        ${claimed ? "Riscattata" : done ? `<button class="claim-daily-mission-btn" data-id="${def.id}">Riscatta</button>` : "In corso"}
      </div>
    `;
  }).join("");

  document.querySelectorAll(".claim-daily-mission-btn").forEach(btn => {
    btn.onclick = () => claimDailyMission(btn.dataset.id);
  });
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

function applyArenaSkin(value) {
  document.body.classList.remove("arena-volcano", "arena-forest", "arena-abyss", "arena-beach");

  if (value && value !== "default") {
    document.body.classList.add(`arena-${value}`);
  }
}

function getWinRate(profile) {
  const total = (profile.wins || 0) + (profile.losses || 0);
  return total ? Math.round(((profile.wins || 0) / total) * 100) : 0;
}

function getCollectionCompletion(profile) {
  const total = allCollectibleTemplates().length;
  const owned = Object.values(profile.collection || {}).filter(v => v > 0).length;
  return { owned, total, pct: total ? Math.round((owned / total) * 100) : 0 };
}

function openProfile() {
  const profile = normalizeProfile();
  const level = getLevelFromXp(profile.xp || 0);
  const coll = getCollectionCompletion(profile);
  const active = getActiveDeck();
  const favoriteDeck = localStorage.getItem("favoriteDeck") || deckLabels[selectedDeck] || "Bilanciato";

  profileStatsBox.innerHTML = `
    <div class="profile-stat-card"><small>Titolo</small><strong>${profile.title || "Apprendista"}</strong></div>
    <div class="profile-stat-card"><small>Livello</small><strong>${level}</strong></div>
    <div class="profile-stat-card"><small>XP</small><strong>${profile.xp || 0}</strong></div>
    <div class="profile-stat-card"><small>Oro</small><strong>${profile.gold || 0}</strong></div>
    <div class="profile-stat-card"><small>Polvere</small><strong>${profile.dust || 0}</strong></div>
    <div class="profile-stat-card"><small>Vittorie / Sconfitte</small><strong>${profile.wins || 0} / ${profile.losses || 0}</strong></div>
    <div class="profile-stat-card"><small>Win rate</small><strong>${getWinRate(profile)}%</strong></div>
    <div class="profile-stat-card"><small>Collezione</small><strong>${coll.owned}/${coll.total} · ${coll.pct}%</strong></div>
    <div class="profile-stat-card"><small>Mazzo attivo</small><strong>${selectedDeck === "custom" ? active.name : deckLabels[selectedDeck]}</strong></div>
    <div class="profile-stat-card"><small>Difficoltà</small><strong>${difficultyLabels[selectedDifficulty]}</strong></div>
  `;

  const titles = [
    { title: "Apprendista dell'Arena", ok: true },
    { title: "Campione dell'Arena", ok: (profile.wins || 0) >= 10 },
    { title: "Collezionista Leggendario", ok: coll.owned >= 40 },
    { title: "Signore delle Ombre", ok: (profile.collection?.shadow_12 || 0) > 0 },
    { title: "Domatore di Draghi", ok: Object.keys(profile.collection || {}).some(k => k.toLowerCase().includes("dragon") || k.toLowerCase().includes("drago")) }
  ];

  profileTitlesBox.innerHTML = titles.map(t => `
    <div class="mission-row">
      <strong>${t.ok ? "✅" : "🔒"} ${t.title}</strong>
      ${t.ok ? `<button class="equip-title-btn" data-title="${t.title}">Equipaggia</button>` : ""}
    </div>
  `).join("");
  document.querySelectorAll(".equip-title-btn").forEach(btn => {
    btn.onclick = () => {
      const p = normalizeProfile();
      p.title = btn.dataset.title;
      saveProfile(p);
      openProfile();
    };
  });

  profileModal.classList.remove("hidden");
}

function getSettings() {
  return normalizeProfile().settings || { audio: true, vibration: true, reducedMotion: false };
}

function applySettings() {
  const settings = getSettings();
  document.body.classList.toggle("reduced-motion", Boolean(settings.reducedMotion));
}

function openSettings() {
  const settings = getSettings();
  if (audioToggle) audioToggle.checked = Boolean(settings.audio);
  if (vibrationToggle) vibrationToggle.checked = Boolean(settings.vibration);
  if (reducedMotionToggle) reducedMotionToggle.checked = Boolean(settings.reducedMotion);
  settingsModal.classList.remove("hidden");
}

function saveSettingsFromModal() {
  const profile = normalizeProfile();
  profile.settings = {
    audio: Boolean(audioToggle?.checked),
    vibration: Boolean(vibrationToggle?.checked),
    reducedMotion: Boolean(reducedMotionToggle?.checked)
  };
  saveProfile(profile);
  applySettings();
  settingsModal.classList.add("hidden");
}

function maybeVibrate(pattern = 25) {
  const settings = getSettings();
  if (settings.vibration && navigator.vibrate) navigator.vibrate(pattern);
}

document.querySelectorAll(".hero-class-btn").forEach(button => {
  button.classList.toggle("selected", button.dataset.hero === selectedHero);
  button.onclick = () => {
    document.querySelectorAll(".hero-class-btn").forEach(btn => btn.classList.remove("selected"));
    button.classList.add("selected");
    selectedHero = button.dataset.hero;
    localStorage.setItem("selectedHero", selectedHero);
    renderProfile();
  };
});

document.querySelectorAll(".deck-btn").forEach(button => {
  button.onclick = () => {
    document.querySelectorAll(".deck-btn").forEach(btn => btn.classList.remove("selected"));
    button.classList.add("selected");
    selectedDeck = button.dataset.deck;
    localStorage.setItem("favoriteDeck", deckLabels[selectedDeck] || selectedDeck);
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

playBotBtn.onclick = () => startBotGame();
createOnlineBtn.onclick = createOnlineGame;
joinOnlineBtn.onclick = joinOnlineGame;
endTurnBtn.onclick = endTurn;

campaignBtn.onclick = openCampaignMap;
draftBtn.onclick = startDraft;

restartBtn.onclick = () => {
  if (gameMode === "tutorial") {
    startGuidedTutorial();
  } else if (gameMode === "bot" || gameMode === "campaign") {
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

  if (gameMode === "tutorial") {
    startGuidedTutorial();
  } else if (gameMode === "bot" || gameMode === "campaign") {
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
if (startGuidedTutorialBtn) startGuidedTutorialBtn.onclick = startGuidedTutorial;
if (skipGuidedTutorialBtn) skipGuidedTutorialBtn.onclick = () => showOnlyMenu(true);

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
};

if (difficultySelect) {
  difficultySelect.value = selectedDifficulty;
  difficultySelect.onchange = () => {
    selectedDifficulty = difficultySelect.value;
    localStorage.setItem("botDifficulty", selectedDifficulty);
    renderProfile();
  };
}

playerNameInput.addEventListener("input", renderProfile);



if (collectionBtn) collectionBtn.onclick = openCollection;
if (closeCollectionBtn) closeCollectionBtn.onclick = () => collectionModal.classList.add("hidden");
if (collectionFamilyFilter) collectionFamilyFilter.onchange = renderCollection;
if (collectionRarityFilter) collectionRarityFilter.onchange = renderCollection;
if (dustDuplicatesBtn) dustDuplicatesBtn.onclick = dustDuplicates;

if (shopBtn) shopBtn.onclick = openShop;
if (closeShopBtn) closeShopBtn.onclick = () => shopModal.classList.add("hidden");
document.querySelectorAll(".shop-buy-btn").forEach(btn => {
  btn.onclick = () => buyPack(btn.dataset.pack);
});

if (dailyRewardBtn) dailyRewardBtn.onclick = openDailyReward;
if (closeDailyRewardBtn) closeDailyRewardBtn.onclick = () => dailyRewardModal.classList.add("hidden");
if (claimDailyRewardBtn) claimDailyRewardBtn.onclick = claimDailyReward;

if (achievementsBtn) achievementsBtn.onclick = openAchievements;
if (closeAchievementsBtn) closeAchievementsBtn.onclick = () => achievementsModal.classList.add("hidden");

if (profileBtn) profileBtn.onclick = openProfile;
if (closeProfileBtn) closeProfileBtn.onclick = () => profileModal.classList.add("hidden");
if (settingsBtn) settingsBtn.onclick = openSettings;
if (closeSettingsBtn) closeSettingsBtn.onclick = () => settingsModal.classList.add("hidden");
if (saveSettingsBtn) saveSettingsBtn.onclick = saveSettingsFromModal;

if (heroPowerBtn) heroPowerBtn.onclick = useHeroPower;
if (closeCampaignMapBtn) closeCampaignMapBtn.onclick = () => campaignMapModal.classList.add("hidden");
if (resetCampaignBtn) resetCampaignBtn.onclick = () => {
  const ok = confirm("Vuoi azzerare il progresso campagna?");
  if (!ok) return;
  saveCampaignProgress({ completed: [] });
  renderCampaignMap();
};

if (deckBuilderBtn) deckBuilderBtn.onclick = openDeckBuilder;
if (closeDeckBuilderBtn) closeDeckBuilderBtn.onclick = () => deckBuilderModal.classList.add("hidden");
if (deckFamilyFilter) deckFamilyFilter.onchange = renderDeckBuilder;
if (autoBuildDeckBtn) autoBuildDeckBtn.onclick = autoBuildDeck;
if (clearCustomDeckBtn) clearCustomDeckBtn.onclick = () => { saveCustomDeckList([]); renderDeckBuilder(); };
if (saveCustomDeckBtn) saveCustomDeckBtn.onclick = saveAndUseCustomDeck;

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
getSavedDecks();
applySettings();
renderProfile();
showOnly(menuScreen);

if (!localStorage.getItem("tutorialSeen")) {
  setTimeout(() => tutorialModal.classList.remove("hidden"), 450);
}

/* =========================
   V18 - UI APP POLISH
   ========================= */
function updateWalletStripV18() {
  try {
    const profile = getProfile();
    const gold = document.getElementById("walletGoldText");
    const dust = document.getElementById("walletDustText");
    const wins = document.getElementById("walletWinText");
    if (gold) gold.textContent = profile.gold || 0;
    if (dust) dust.textContent = profile.dust || 0;
    if (wins) wins.textContent = profile.wins || 0;
  } catch (error) {
    console.warn("Wallet strip non aggiornata:", error);
  }
}

function setupAppNavigationV18() {
  const nav = document.getElementById("appBottomNav");
  if (!nav) return;

  const setActive = action => {
    nav.querySelectorAll(".app-nav-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.action === action);
    });
  };

  nav.querySelectorAll(".app-nav-btn").forEach(button => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      setActive(action);

      if (action === "home") {
        showOnlyMenu(true);
        return;
      }

      if (action === "play") {
        if (typeof startBotGame === "function") startBotGame();
        return;
      }

      if (action === "cards") {
        const deckBtn = document.getElementById("deckBuilderBtn");
        const collectionBtn = document.getElementById("collectionBtn");
        if (deckBtn) deckBtn.click();
        else if (collectionBtn) collectionBtn.click();
        return;
      }

      if (action === "shop") {
        const shopBtn = document.getElementById("shopBtn");
        if (shopBtn) shopBtn.click();
        return;
      }

      if (action === "profile") {
        const profileBtn = document.getElementById("profileBtn");
        if (profileBtn) profileBtn.click();
        return;
      }
    });
  });
}

function hideSplashV18() {
  const splash = document.getElementById("appSplash");
  if (!splash) return;
  setTimeout(() => {
    splash.classList.add("splash-hide");
    setTimeout(() => splash.remove(), 520);
  }, 700);
}

function applySettingsLookV18() {
  try {
    const settings = JSON.parse(localStorage.getItem("ceaSettings") || "{}");
    document.body.classList.toggle("reduced-motion", Boolean(settings.reducedMotion));
  } catch {
    document.body.classList.remove("reduced-motion");
  }
}

const originalRenderProfileV18 = typeof renderProfile === "function" ? renderProfile : null;
if (originalRenderProfileV18) {
  renderProfile = function patchedRenderProfileV18() {
    originalRenderProfileV18();
    updateWalletStripV18();
    applySettingsLookV18();
  };
}

window.addEventListener("load", () => {
  hideSplashV18();
  setupAppNavigationV18();
  updateWalletStripV18();
  applySettingsLookV18();
});
