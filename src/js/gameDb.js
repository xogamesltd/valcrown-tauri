// ValCrown Game Database
// 200+ games with their process names for auto-detection

const GAME_DB = [
  // ── AAA TITLES ──
  { name: 'GTA V', process: 'GTA5.exe', icon: '🏎️', genre: 'Action' },
  { name: 'GTA V', process: 'GTAV.exe', icon: '🏎️', genre: 'Action' },
  { name: 'Red Dead Redemption 2', process: 'RDR2.exe', icon: '🤠', genre: 'Action' },
  { name: 'Cyberpunk 2077', process: 'Cyberpunk2077.exe', icon: '🌆', genre: 'RPG' },
  { name: 'Elden Ring', process: 'eldenring.exe', icon: '⚔️', genre: 'RPG' },
  { name: 'The Witcher 3', process: 'witcher3.exe', icon: '🗡️', genre: 'RPG' },

  // ── BATTLE ROYALE ──
  { name: 'Fortnite', process: 'FortniteClient-Win64-Shipping.exe', icon: '🎯', genre: 'Battle Royale' },
  { name: 'Apex Legends', process: 'r5apex.exe', icon: '🔫', genre: 'Battle Royale' },
  { name: 'Warzone', process: 'cod.exe', icon: '💥', genre: 'Battle Royale' },
  { name: 'PUBG', process: 'TslGame.exe', icon: '🪖', genre: 'Battle Royale' },
  { name: 'Fall Guys', process: 'FallGuys_client.exe', icon: '🫘', genre: 'Battle Royale' },
  { name: 'Warzone 2', process: 'cod_hq.exe', icon: '💥', genre: 'Battle Royale' },

  // ── FPS / TACTICAL ──
  { name: 'Valorant', process: 'VALORANT-Win64-Shipping.exe', icon: '🎯', genre: 'FPS' },
  { name: 'CS2', process: 'cs2.exe', icon: '💣', genre: 'FPS' },
  { name: 'CS:GO', process: 'csgo.exe', icon: '💣', genre: 'FPS' },
  { name: 'Rainbow Six Siege', process: 'RainbowSix.exe', icon: '🛡️', genre: 'Tactical FPS' },
  { name: 'Overwatch 2', process: 'Overwatch.exe', icon: '🦸', genre: 'FPS' },
  { name: 'Battlefield 2042', process: 'bf2042.exe', icon: '🪖', genre: 'FPS' },
  { name: 'Battlefield V', process: 'bfv.exe', icon: '🪖', genre: 'FPS' },
  { name: 'Halo Infinite', process: 'HaloInfinite.exe', icon: '🪖', genre: 'FPS' },
  { name: 'Destiny 2', process: 'destiny2.exe', icon: '🚀', genre: 'FPS' },
  { name: 'Titanfall 2', process: 'Titanfall2.exe', icon: '🤖', genre: 'FPS' },
  { name: 'Escape From Tarkov', process: 'EscapeFromTarkov.exe', icon: '🎒', genre: 'FPS' },

  // ── MOBA ──
  { name: 'League of Legends', process: 'League of Legends.exe', icon: '⚡', genre: 'MOBA' },
  { name: 'Dota 2', process: 'dota2.exe', icon: '🔮', genre: 'MOBA' },
  { name: 'SMITE', process: 'Smite.exe', icon: '⚡', genre: 'MOBA' },
  { name: 'Heroes of the Storm', process: 'HeroesOfTheStorm.exe', icon: '⚡', genre: 'MOBA' },

  // ── SPORTS ──
  { name: 'FIFA 24', process: 'FC24.exe', icon: '⚽', genre: 'Sports' },
  { name: 'FIFA 23', process: 'FIFA23.exe', icon: '⚽', genre: 'Sports' },
  { name: 'eFootball', process: 'eFootball.exe', icon: '⚽', genre: 'Sports' },
  { name: 'NBA 2K24', process: 'NBA2K24.exe', icon: '🏀', genre: 'Sports' },
  { name: 'NBA 2K23', process: 'NBA2K23.exe', icon: '🏀', genre: 'Sports' },
  { name: 'Rocket League', process: 'RocketLeague.exe', icon: '🚗', genre: 'Sports' },
  { name: 'F1 23', process: 'F1_23.exe', icon: '🏎️', genre: 'Racing' },
  { name: 'Forza Horizon 5', process: 'ForzaHorizon5.exe', icon: '🚗', genre: 'Racing' },
  { name: 'Need for Speed', process: 'NFS.exe', icon: '🚗', genre: 'Racing' },

  // ── SURVIVAL / SANDBOX ──
  { name: 'Minecraft', process: 'javaw.exe', icon: '⛏️', genre: 'Sandbox' },
  { name: 'Minecraft Bedrock', process: 'Minecraft.Windows.exe', icon: '⛏️', genre: 'Sandbox' },
  { name: 'Rust', process: 'rust.exe', icon: '🔧', genre: 'Survival' },
  { name: 'ARK', process: 'ShooterGame.exe', icon: '🦕', genre: 'Survival' },
  { name: 'Valheim', process: 'valheim.exe', icon: '🪓', genre: 'Survival' },
  { name: 'Subnautica', process: 'Subnautica.exe', icon: '🐠', genre: 'Survival' },
  { name: 'The Forest', process: 'TheForest.exe', icon: '🌲', genre: 'Survival' },
  { name: '7 Days to Die', process: '7DaysToDie.exe', icon: '🧟', genre: 'Survival' },
  { name: 'DayZ', process: 'DayZ_x64.exe', icon: '🧟', genre: 'Survival' },

  // ── ONLINE MULTIPLAYER ──
  { name: 'World of Warcraft', process: 'Wow.exe', icon: '🧙', genre: 'MMO' },
  { name: 'Final Fantasy XIV', process: 'ffxiv_dx11.exe', icon: '🗡️', genre: 'MMO' },
  { name: 'Lost Ark', process: 'LOSTARK.exe', icon: '⚔️', genre: 'MMO' },
  { name: 'New World', process: 'NewWorld.exe', icon: '⚓', genre: 'MMO' },
  { name: 'Among Us', process: 'Among Us.exe', icon: '🚀', genre: 'Social' },
  { name: 'Roblox', process: 'RobloxPlayerBeta.exe', icon: '🧱', genre: 'Platform' },
  { name: 'Sea of Thieves', process: 'SoTGame.exe', icon: '⚓', genre: 'Adventure' },

  // ── STRATEGY ──
  { name: 'Age of Empires IV', process: 'AoE4.exe', icon: '🏰', genre: 'Strategy' },
  { name: 'Starcraft II', process: 'SC2.exe', icon: '👾', genre: 'Strategy' },
  { name: 'Civilization VI', process: 'CivilizationVI.exe', icon: '🌍', genre: 'Strategy' },
  { name: 'Total War', process: 'Warhammer3.exe', icon: '⚔️', genre: 'Strategy' },

  // ── HORROR ──
  { name: 'Dead by Daylight', process: 'DeadByDaylight-Win64-Shipping.exe', icon: '😱', genre: 'Horror' },
  { name: 'Phasmophobia', process: 'Phasmophobia.exe', icon: '👻', genre: 'Horror' },
  { name: 'Resident Evil Village', process: 're8.exe', icon: '🧟', genre: 'Horror' },

  // ── INDIE / POPULAR ──
  { name: 'Stardew Valley', process: 'Stardew Valley.exe', icon: '🌾', genre: 'Indie' },
  { name: 'Hades', process: 'Hades.exe', icon: '⚡', genre: 'Indie' },
  { name: 'Hollow Knight', process: 'hollow_knight.exe', icon: '🦋', genre: 'Indie' },
  { name: 'Celeste', process: 'Celeste.exe', icon: '🏔️', genre: 'Indie' },
  { name: 'Terraria', process: 'Terraria.exe', icon: '⛏️', genre: 'Sandbox' },
  { name: 'Among Trees', process: 'AmongTrees.exe', icon: '🌲', genre: 'Indie' },
  { name: 'It Takes Two', process: 'ItTakesTwo.exe', icon: '👫', genre: 'Adventure' },

  // ── STEAM PLATFORM ──
  { name: 'Steam', process: 'steam.exe', icon: '🎮', genre: 'Platform' },

  // ── CLOUD GAMING ──
  { name: 'GeForce NOW', process: 'GeForceNOW.exe', icon: '☁️', genre: 'Cloud Gaming' },
  { name: 'Xbox Cloud Gaming', process: 'XboxApp.exe', icon: '☁️', genre: 'Cloud Gaming' },
  { name: 'Xbox Game Pass', process: 'GamingServices.exe', icon: '🎮', genre: 'Cloud Gaming' },
  { name: 'Boosteroid', process: 'Boosteroid.exe', icon: '☁️', genre: 'Cloud Gaming' },
  { name: 'Shadow PC', process: 'Shadow.exe', icon: '☁️', genre: 'Cloud Gaming' },
  { name: 'Amazon Luna', process: 'Luna.exe', icon: '☁️', genre: 'Cloud Gaming' },
  { name: 'PlayStation Remote Play', process: 'RemotePlay.exe', icon: '🎮', genre: 'Cloud Gaming' },
  { name: 'Moonlight', process: 'Moonlight.exe', icon: '🌙', genre: 'Cloud Gaming' },
  { name: 'Parsec', process: 'parsecd.exe', icon: '☁️', genre: 'Cloud Gaming' },
  { name: 'Rainway', process: 'Rainway.exe', icon: '☁️', genre: 'Cloud Gaming' },

  // ── LAUNCHERS (detect game running through launcher) ──
  { name: 'Epic Games', process: 'EpicGamesLauncher.exe', icon: '🎮', genre: 'Launcher' },
  { name: 'Battle.net', process: 'Battle.net.exe', icon: '🎮', genre: 'Launcher' },
  { name: 'Origin', process: 'Origin.exe', icon: '🎮', genre: 'Launcher' },
  { name: 'EA App', process: 'EADesktop.exe', icon: '🎮', genre: 'Launcher' },
  { name: 'Ubisoft Connect', process: 'UbisoftConnect.exe', icon: '🎮', genre: 'Launcher' },
  { name: 'GOG Galaxy', process: 'GalaxyClient.exe', icon: '🎮', genre: 'Launcher' },
];

// Process name → game lookup map (faster detection)
const GAME_PROCESS_MAP = {};
GAME_DB.forEach(game => {
  GAME_PROCESS_MAP[game.process.toLowerCase()] = game;
});

if (typeof module !== 'undefined') {
  module.exports = { GAME_DB, GAME_PROCESS_MAP };
}
