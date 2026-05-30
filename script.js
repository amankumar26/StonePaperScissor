


/* ==========================================================================
   VOXEL SHOWDOWN - GAME LOGIC & WEB AUDIO ENGINE
   ========================================================================== */

// 1. DYNAMIC CSS STYLES FOR BOSSES
const style = document.createElement('style');
style.textContent = `
  .skin-redstone .char-head { background-color: #ef4444; }
  .skin-redstone .char-body { background-color: #7f1d1d; }
  .skin-redstone .char-arm { background-color: #ef4444; }
  .skin-redstone .char-leg { background-color: #450a0a; }
  
  .skin-ender .char-head { background-color: #18181b; }
  .skin-ender .char-body { background-color: #09090b; }
  .skin-ender .char-arm { background-color: #18181b; }
  .skin-ender .char-leg { background-color: #020617; }
  
  .skin-wither .char-head { background-color: #27272a; }
  .skin-wither .char-body { background-color: #09090b; }
  .skin-wither .char-arm { background-color: #27272a; }
  .skin-wither .char-leg { background-color: #18181b; }
`;
document.head.appendChild(style);

// 2. BOSS ROSTER DEFINITION
const BOSSES = [
  {
    name: "HEROBRINE",
    skinClass: "skin-boss",
    headSvg: `<svg viewBox="0 0 8 8" class="pixel-avatar-svg">
      <rect x="0" y="0" width="8" height="8" fill="#dcb594" />
      <rect x="0" y="0" width="8" height="3" fill="#4a3728" />
      <rect x="0" y="3" width="1" height="1" fill="#4a3728" />
      <rect x="7" y="3" width="1" height="1" fill="#4a3728" />
      <rect x="1" y="4" width="2" height="1" fill="#fff" />
      <rect x="5" y="4" width="2" height="1" fill="#fff" />
      <rect x="2" y="6" width="4" height="1" fill="#9c5744" />
      <rect x="3" y="5" width="2" height="1" fill="#c68a75" />
    </svg>`
  },
  {
    name: "ROBLOX KING",
    skinClass: "skin-noob",
    headSvg: `<svg viewBox="0 0 8 8" class="pixel-avatar-svg">
      <rect x="0" y="0" width="8" height="8" fill="#fed7aa" />
      <polygon points="0,2 2,0 4,2 6,0 8,2 8,3 0,3" fill="#facc15" />
      <rect x="2" y="4" width="1" height="1.5" fill="#000" />
      <rect x="5" y="4" width="1" height="1.5" fill="#000" />
      <rect x="2" y="6" width="4" height="1" fill="#000" />
    </svg>`
  },
  {
    name: "REDSTONE GOLEM",
    skinClass: "skin-redstone",
    headSvg: `<svg viewBox="0 0 8 8" class="pixel-avatar-svg">
      <rect x="0" y="0" width="8" height="8" fill="#ef4444" />
      <rect x="1" y="1" width="1" height="1" fill="#991b1b" />
      <rect x="6" y="5" width="1" height="1" fill="#991b1b" />
      <rect x="1" y="3" width="2" height="1" fill="#facc15" />
      <rect x="5" y="3" width="2" height="1" fill="#facc15" />
      <rect x="2" y="5" width="4" height="2" fill="#3f3f46" />
    </svg>`
  },
  {
    name: "ENDER LORD",
    skinClass: "skin-ender",
    headSvg: `<svg viewBox="0 0 8 8" class="pixel-avatar-svg">
      <rect x="0" y="0" width="8" height="8" fill="#18181b" />
      <rect x="1" y="4" width="2" height="1" fill="#d946ef" />
      <rect x="2" y="4" width="1" height="1" fill="#a855f7" />
      <rect x="5" y="4" width="2" height="1" fill="#d946ef" />
      <rect x="5" y="4" width="1" height="1" fill="#a855f7" />
    </svg>`
  },
  {
    name: "WITHER CHIEF",
    skinClass: "skin-wither",
    headSvg: `<svg viewBox="0 0 8 8" class="pixel-avatar-svg">
      <rect x="0" y="0" width="8" height="8" fill="#27272a" />
      <rect x="2" y="3" width="1" height="1" fill="#fff" />
      <rect x="5" y="3" width="1" height="1" fill="#fff" />
      <rect x="3" y="5" width="2" height="1" fill="#fff" />
    </svg>`
  }
];

// 3. INITIAL STATE
const gameState = {
  screen: 'splash', // splash, battle, gameover
  skin: 'steve',
  mode: 'endless', // endless, match
  score: 0,
  highScore: parseInt(localStorage.getItem('voxel_highscore_endless') || localStorage.getItem('voxel_highscore') || '0', 10),
  streak: 0,
  maxStreak: 0,
  playerHP: 3,
  enemyHP: 3,
  maxHP: 3,
  bossIndex: 0,
  roundsPlayed: 0,
  isMuted: localStorage.getItem('voxel_muted') === 'true',
  isLocked: false,
  timerEnabled: localStorage.getItem('voxel_timer_enabled') !== 'false',
  
  // P2P Multiplayer state
  peer: null,
  conn: null, // Host connection for clients
  connections: [], // Array of client connections for the host
  players: {}, // Map of all players: { 1: { skin, choice, hp, name, isAlive, rematchReady }, ... }
  playerIndex: 1, // Self player index (1 is host, 2/3/4 are clients)
  maxPlayers: 2, // Max players in lobby (2, 3, or 4)
  isHost: false,
  peerId: null,
  localChoice: null,
  localRematchReady: false,
  rulesOpenedManually: false,
  lastRulesState: '',
  versusGameType: 'normal', // normal, dare (lobby type)
  todType: 'truth', // truth, dare (winner choice)
  todQuestion: null,
  todAnswers: []
};

// 4. AUDIO SYNTH ENGINE (WEB AUDIO API)
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playClickSound() {
  if (gameState.isMuted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) { console.warn("Audio Context Error", e); }
}

function playTickSound() {
  if (gameState.isMuted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch (e) {}
}

function playSelectSound() {
  if (gameState.isMuted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.setValueAtTime(330, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) { console.warn("Audio Context Error", e); }
}

function playWinSound() {
  if (gameState.isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 arpeggio

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.18, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.15);
    });
  } catch (e) { console.warn("Audio Context Error", e); }
}

function playLoseSound() {
  if (gameState.isMuted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.22);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  } catch (e) { console.warn("Audio Context Error", e); }
}

function playDrawSound() {
  if (gameState.isMuted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.setValueAtTime(135, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch (e) { console.warn("Audio Context Error", e); }
}

function playVictoryFanfare() {
  if (gameState.isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    // Cheerful 8-bit fanfare
    const notes = [
      { f: 261.63, d: 0.1, t: 0 },
      { f: 261.63, d: 0.1, t: 0.1 },
      { f: 261.63, d: 0.1, t: 0.2 },
      { f: 349.23, d: 0.2, t: 0.3 }, // F4
      { f: 440.00, d: 0.2, t: 0.5 }, // A4
      { f: 392.00, d: 0.15, t: 0.7 }, // G4
      { f: 440.00, d: 0.15, t: 0.82 }, // A4
      { f: 493.88, d: 0.15, t: 0.94 }, // B4
      { f: 523.25, d: 0.4, t: 1.06 }  // C5
    ];

    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(note.f, now + note.t);

      gain.gain.setValueAtTime(0.12, now + note.t);
      gain.gain.exponentialRampToValueAtTime(0.005, now + note.t + note.d);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + note.t);
      osc.stop(now + note.t + note.d + 0.05);
    });
  } catch (e) { console.warn("Audio Context Error", e); }
}

// 5. PARTICLE ENGINE (VOXEL DUST EFFECTS)
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function spawnParticles(x, y, colorPalette, count = 22) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12 - 4, // slightly upwards
      size: Math.random() * 8 + 4, // Blocky square size
      color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
      life: 1.0,
      decay: Math.random() * 0.04 + 0.02,
      gravity: 0.22
    });
  }
}

function updateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.life -= p.decay;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1.0;
  requestAnimationFrame(updateParticles);
}
requestAnimationFrame(updateParticles);

// Helper: Get element center coordinates on page
function getElementCenter(el) {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 + window.scrollX,
    y: rect.top + rect.height / 2 + window.scrollY
  };
}

// 6. DOM SELECTORS
const screenSplash = document.getElementById('screen-splash');
const screenBattle = document.getElementById('screen-battle');
const screenGameOver = document.getElementById('screen-gameover');

const playBtn = document.getElementById('play-btn');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');
const muteBtn = document.getElementById('mute-btn');
const audioPath = document.getElementById('audio-path');
const multiplayerPedestalsContainer = document.getElementById('multiplayer-pedestals-container');
const playerLimitBtns = document.querySelectorAll('.player-limit-btn');
const rulesBtn = document.getElementById('rules-btn');
const rulesDropdown = document.getElementById('rules-dropdown');
const rulesCloseBtn = document.getElementById('rules-close-btn');
const rulesBtnText = document.getElementById('rules-btn-text');

const skinCards = document.querySelectorAll('.skin-card');
const modeEndless = document.getElementById('mode-endless');
const modeMatch = document.getElementById('mode-match');
const modeVersus = document.getElementById('mode-versus');
const modeDesc = document.getElementById('mode-desc');

const hudPlayerAvatar = document.getElementById('hud-player-avatar');
const hudPlayerName = document.getElementById('hud-player-name');
const hudEnemyName = document.getElementById('hud-enemy-name');
const playerHeartsContainer = document.getElementById('player-hearts');
const enemyHeartsContainer = document.getElementById('enemy-hearts');

const playerFighter = document.getElementById('player-fighter');
const enemyFighter = document.getElementById('enemy-fighter');
const playerAvatar3D = document.getElementById('player-avatar-3d');
const enemyAvatar3D = document.getElementById('enemy-avatar-3d');

const hudScore = document.getElementById('hud-score');
const hudStreak = document.getElementById('hud-streak');
const streakContainer = document.getElementById('streak-container');

const playerChoiceDisplay = document.getElementById('player-choice-display');
const enemyChoiceDisplay = document.getElementById('enemy-choice-display');
const clashText = document.getElementById('clash-text');
const battleStatusMsg = document.getElementById('battle-status-msg');

const choiceBtns = document.querySelectorAll('.choice-btn');
const consoleOutput = document.getElementById('console-output');

const gameoverTitle = document.getElementById('gameover-title');
const gameoverSubtitle = document.getElementById('gameover-subtitle');
const statFinalScore = document.getElementById('stat-final-score');
const statMaxStreak = document.getElementById('stat-max-streak');
const statHighScore = document.getElementById('stat-high-score');
const statRounds = document.getElementById('stat-rounds');

// 7. SETUP EVENT LISTENERS

// Skin select click handlers
skinCards.forEach(card => {
  card.addEventListener('click', () => {
    skinCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    gameState.skin = card.dataset.skin;
    playClickSound();
    if (gameState.conn && gameState.conn.open) {
      sendPeerMessage({ type: 'skin', skin: gameState.skin });
    }
  });
});

// Mode buttons click handlers
modeEndless.addEventListener('click', () => {
  modeEndless.classList.add('active');
  modeMatch.classList.remove('active');
  modeVersus.classList.remove('active');
  gameState.mode = 'endless';
  modeDesc.textContent = "Fight infinitely to stack score and streaks. Lose 3 hearts and the run ends.";
  document.getElementById('multiplayer-panel').style.display = 'none';
  playBtn.removeAttribute('disabled');
  playBtn.textContent = 'START BATTLE';
  playClickSound();
  updateRulesContent();
});

modeMatch.addEventListener('click', () => {
  modeMatch.classList.add('active');
  modeEndless.classList.remove('active');
  modeVersus.classList.remove('active');
  gameState.mode = 'match';
  gameState.bossIndex = 0;
  modeDesc.textContent = "Defeat the Bosses in order! 3 Hearts each. Advancing restores your HP.";
  document.getElementById('multiplayer-panel').style.display = 'none';
  playBtn.removeAttribute('disabled');
  playBtn.textContent = 'START BATTLE';
  playClickSound();
  updateRulesContent();
});

modeVersus.addEventListener('click', () => {
  selectVersusMode();
  playClickSound();
});

playerLimitBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (gameState.peer && (gameState.peerId || gameState.connections.length > 0)) {
      return;
    }
    playerLimitBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    gameState.maxPlayers = parseInt(btn.dataset.limit, 10);
    playClickSound();
  });
});

// Audio mute button toggle
muteBtn.addEventListener('click', () => {
  gameState.isMuted = !gameState.isMuted;
  localStorage.setItem('voxel_muted', gameState.isMuted);
  updateMuteIcon();
  if (!gameState.isMuted) {
    playClickSound();
  }
});

function updateMuteIcon() {
  if (gameState.isMuted) {
    // Mute icon SVG path
    audioPath.setAttribute('d', 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z');
  } else {
    // Volume up icon SVG path
    audioPath.setAttribute('d', 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z');
  }
}
updateMuteIcon();

// Start button trigger
playBtn.addEventListener('click', () => {
  playClickSound();

  if (gameState.mode === 'versus') {
    const savedLobbyId = sessionStorage.getItem('voxel_lobby_id');
    const savedPlayerIndex = sessionStorage.getItem('voxel_player_index');
    
    // If we have a saved lobby and we are currently disconnected
    if (savedLobbyId && (!gameState.peer || (!gameState.peerId && !gameState.conn))) {
      if (savedPlayerIndex === '1') {
        printLog('[MULTIPLAYER]: Rejoining lobby as Host...', 'text-yellow');
        initPeer(savedLobbyId);
      } else {
        printLog('[MULTIPLAYER]: Rejoining lobby as Client...', 'text-green');
        joinLobby(savedLobbyId);
      }
      return;
    }
  }

  startGame();
});

// Restart buttons
restartBtn.addEventListener('click', () => {
  playClickSound();
  if (gameState.mode === 'versus') {
    if (gameState.localRematchReady) return;
    gameState.localRematchReady = true;
    restartBtn.setAttribute('disabled', 'true');
    restartBtn.textContent = 'WAITING FOR PLAYERS...';
    sendPeerMessage({ type: 'rematch' });
    
    if (gameState.isHost) {
      gameState.players[1].rematchReady = true;
      let allReady = true;
      for (let pId in gameState.players) {
        if (!gameState.players[pId].rematchReady) {
          allReady = false;
        }
      }
      if (allReady) {
        startVersusBattle();
      }
    }
  } else {
    restartBtn.textContent = 'RESPAWN';
    startGame();
  }
});

menuBtn.addEventListener('click', () => {
  playClickSound();
  stopRoundTimer();
  sessionStorage.removeItem('voxel_player_index');
  sessionStorage.removeItem('voxel_lobby_id');
  switchScreen('splash');
});

// Setup weapons selections
const weaponSvgs = {};
choiceBtns.forEach(btn => {
  const weapon = btn.dataset.weapon;
  weaponSvgs[weapon] = btn.querySelector('.choice-icon').innerHTML;

  btn.addEventListener('click', () => {
    if (gameState.isLocked) return;
    executeRound(weapon);
  });
});

// 8. SCREEN CONTROLLER
function switchScreen(screenName) {
  gameState.screen = screenName;
  screenSplash.classList.remove('active');
  screenBattle.classList.remove('active');
  screenGameOver.classList.remove('active');

  if (screenName === 'splash') {
    screenSplash.classList.add('active');
  } else if (screenName === 'battle') {
    screenBattle.classList.add('active');
  } else if (screenName === 'gameover') {
    screenGameOver.classList.add('active');
  }
  updateRulesContent();
}

// 9. RENDER BLOCKY AVATAR COMPONENT
function renderFullBody(skinName, elementContainer) {
  elementContainer.className = `avatar-blocky skin-${skinName}`;
  elementContainer.innerHTML = `
    <div class="char-head"></div>
    <div class="char-body"></div>
    <div class="char-arm left-arm"></div>
    <div class="char-arm right-arm"></div>
    <div class="char-leg left-leg"></div>
    <div class="char-leg right-leg"></div>
  `;
}

function renderHearts(container, currentHP, maxHP) {
  container.innerHTML = '';
  for (let i = 0; i < maxHP; i++) {
    const heart = document.createElement('div');
    heart.className = 'heart-icon';
    if (i >= currentHP) {
      heart.innerHTML = `<svg viewBox="0 0 9 9" width="18" height="18" style="image-rendering: pixelated; shape-rendering: crispEdges;">
        <path d="M1,2 h1 v-1 h1 v-1 h3 v1 h1 v1 h1 v2 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 z" fill="#000"/>
        <path d="M2,2 h1 v-1 h2 v1 h1 v2 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 z" fill="#3f3f46"/>
      </svg>`;
    } else {
      heart.innerHTML = `<svg viewBox="0 0 9 9" width="18" height="18" style="image-rendering: pixelated; shape-rendering: crispEdges;">
        <path d="M1,2 h1 v-1 h1 v-1 h3 v1 h1 v1 h1 v2 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 z" fill="#000"/>
        <path d="M2,2 h1 v-1 h2 v1 h1 v2 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 z" fill="#e11d48"/>
        <rect x="2" y="2" width="1" height="1" fill="#f43f5e"/>
        <rect x="5" y="2" width="1" height="1" fill="#fda4af"/>
        <rect x="3" y="1" width="1" height="1" fill="#fda4af"/>
      </svg>`;
    }
    container.appendChild(heart);
  }
}

// 10. GAME INITIATION
function startGame() {
  restartBtn.removeAttribute('disabled');
  restartBtn.textContent = 'RESPAWN';

  gameState.todQuestion = null;
  gameState.todAnswers = [];
  const todSection = document.getElementById('gameover-tod-section');
  if (todSection) {
    todSection.style.display = 'none';
  }

  // Restore static pedestals and visualizers for singleplayer modes
  playerFighter.style.display = 'flex';
  enemyFighter.style.display = 'flex';
  document.querySelector('.choice-visualizer').style.display = 'flex';
  document.querySelector('.battle-stage').classList.remove('multiplayer');
  multiplayerPedestalsContainer.style.display = 'none';

  if (gameState.mode === 'versus') {
    startVersusBattle();
    return;
  }
  
  if (gameState.maxPlayers > 2) {
    gameState.isHost = true;
    gameState.playerIndex = 1;
    gameState.players = {};
    gameState.players[1] = { hp: 3, isAlive: true, choice: null, skin: gameState.skin };
    
    for (let i = 2; i <= gameState.maxPlayers; i++) {
      let botSkin = 'robot';
      if (gameState.mode === 'match') {
        botSkin = BOSSES[gameState.bossIndex].skinClass;
      } else {
        botSkin = BOSSES[Math.floor(Math.random() * BOSSES.length)].skinClass;
      }
      gameState.players[i] = { hp: 3, isAlive: true, choice: null, skin: botSkin };
    }
    startVersusBattle();
    return;
  }

  gameState.score = 0;
  gameState.streak = 0;
  gameState.maxStreak = 0;
  gameState.roundsPlayed = 0;
  gameState.playerHP = 3;
  gameState.enemyHP = 3;
  if (gameState.mode !== 'match') {
    gameState.bossIndex = 0;
  }
  gameState.isLocked = false;

  // Load mode-specific high score
  let scoreKey = 'voxel_highscore_endless';
  if (gameState.mode === 'match') {
    scoreKey = 'voxel_highscore_match';
  } else if (gameState.mode === 'versus') {
    scoreKey = 'voxel_highscore_versus';
  }
  gameState.highScore = parseInt(localStorage.getItem(scoreKey) || localStorage.getItem('voxel_highscore') || '0', 10);

  // Set up player skin SVG in HUD
  const activeSkinCard = document.querySelector('.skin-card.active');
  hudPlayerAvatar.innerHTML = activeSkinCard.querySelector('.skin-avatar').innerHTML;
  hudPlayerName.textContent = gameState.skin.toUpperCase();

  // Render blocky avatars on pedestals
  renderFullBody(gameState.skin, playerAvatar3D);

  if (gameState.mode === 'match') {
    const currentBoss = BOSSES[gameState.bossIndex];
    hudEnemyName.textContent = currentBoss.name;
    document.querySelector('.hud-avatar.enemy').innerHTML = currentBoss.headSvg;
    renderFullBody(currentBoss.skinClass, enemyAvatar3D);
  } else {
    // Endless mode uses Steve-like Herobrine boss initially, but can randomize boss head later
    hudEnemyName.textContent = "HEROBRINE";
    document.querySelector('.hud-avatar.enemy').innerHTML = BOSSES[0].headSvg;
    renderFullBody("skin-boss", enemyAvatar3D);
  }

  // Update HUD elements
  hudScore.textContent = '0';
  hudStreak.textContent = '0';
  renderHearts(playerHeartsContainer, gameState.playerHP, gameState.maxHP);
  renderHearts(enemyHeartsContainer, gameState.enemyHP, gameState.maxHP);

  // Clear battle visualizer and console logs
  playerChoiceDisplay.classList.remove('active');
  enemyChoiceDisplay.classList.remove('active');
  playerChoiceDisplay.innerHTML = '';
  enemyChoiceDisplay.innerHTML = '';
  clashText.textContent = 'VS';
  battleStatusMsg.textContent = 'BATTLE INITIATED! CHOOSE WEAPON...';

  consoleOutput.innerHTML = `
    <div class="console-line text-yellow">[SYSTEM]: Voxel arena loaded. Mode: ${gameState.mode.toUpperCase()}</div>
    <div class="console-line text-white">[SYSTEM]: You face ${hudEnemyName.textContent}! Select your weapon.</div>
  `;
  scrollConsole();

  setupConsoleForMode();
  switchScreen('battle');
  playVictoryFanfare();
  startRoundTimer();
}

// Console helper
function printLog(text, colorClass = 'text-white') {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const line = document.createElement('div');
  line.className = `console-line ${colorClass}`;
  line.textContent = `[${time}] ${text}`;
  consoleOutput.appendChild(line);
  scrollConsole();
}

function scrollConsole() {
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// 11. BATTLE ENGINE ROUND LOGIC
function executeRound(playerWeapon) {
  stopRoundTimer();

  // Block choices if the local player is dead
  if (gameState.mode === 'versus' && gameState.players[gameState.playerIndex] && gameState.players[gameState.playerIndex].isAlive === false) {
    return;
  }

  if (gameState.mode === 'versus') {
    gameState.isLocked = true;
    gameState.localChoice = playerWeapon;
    gameState.players[gameState.playerIndex].choice = playerWeapon;
    battleStatusMsg.textContent = 'LOCKED! WAITING FOR FRIEND...';
    printLog('[MULTIPLAYER]: Move locked. Waiting for opponent...', 'text-yellow');
    
    sendPeerMessage({ type: 'choice', choice: playerWeapon });

    if (gameState.isHost) {
      let allChosen = true;
      for (let pId in gameState.players) {
        if (gameState.players[pId].isAlive && !gameState.players[pId].choice) {
          allChosen = false;
        }
      }
      if (allChosen) {
        stopRoundTimer();
        resolveVersusRound();
      } else {
        if (!timerInterval && gameState.timerEnabled) {
          startRoundTimer();
        }
      }
    } else {
      if (!timerInterval && gameState.timerEnabled) {
        startRoundTimer();
      }
    }
    return;
  }
  
  if (gameState.maxPlayers > 2) {
    gameState.isLocked = true;
    gameState.localChoice = playerWeapon;
    gameState.players[1].choice = playerWeapon;
    
    const weapons = ['stone', 'paper', 'scissors'];
    for (let i = 2; i <= gameState.maxPlayers; i++) {
      if (gameState.players[i].isAlive) {
        gameState.players[i].choice = weapons[Math.floor(Math.random() * 3)];
      }
    }
    resolveVersusRound();
    return;
  }

  gameState.isLocked = true;

  // Clear displays
  playerChoiceDisplay.classList.remove('active');
  enemyChoiceDisplay.classList.remove('active');
  battleStatusMsg.textContent = 'CHOOSING...';

  // Play rolling animation blips
  let tick = 0;
  const weapons = ['stone', 'paper', 'scissors'];
  const rollInterval = setInterval(() => {
    playSelectSound();

    // Quick random visuals during rolling
    const randPlayer = weapons[Math.floor(Math.random() * 3)];
    const randEnemy = weapons[Math.floor(Math.random() * 3)];

    playerChoiceDisplay.innerHTML = weaponSvgs[randPlayer];
    enemyChoiceDisplay.innerHTML = weaponSvgs[randEnemy];

    playerChoiceDisplay.classList.add('active');
    enemyChoiceDisplay.classList.add('active');

    tick++;
    if (tick >= 8) {
      clearInterval(rollInterval);
      resolveRound(playerWeapon);
    }
  }, 100);
}

function resolveRound(playerWeapon) {
  // Random AI weapon
  const weapons = ['stone', 'paper', 'scissors'];
  const enemyWeapon = weapons[Math.floor(Math.random() * 3)];

  // Update visualizer displays
  if (playerWeapon === 'timeout') {
    playerChoiceDisplay.innerHTML = '<div style="font-size:32px; line-height:72px;">⏱️</div>';
  } else {
    playerChoiceDisplay.innerHTML = weaponSvgs[playerWeapon];
  }
  enemyChoiceDisplay.innerHTML = weaponSvgs[enemyWeapon];

  // Calculate result
  let result = 'draw'; // draw, win, lose

  if (playerWeapon === 'timeout') {
    result = 'lose';
  } else if (playerWeapon === enemyWeapon) {
    result = 'draw';
  } else if (
    (playerWeapon === 'stone' && enemyWeapon === 'scissors') ||
    (playerWeapon === 'paper' && enemyWeapon === 'stone') ||
    (playerWeapon === 'scissors' && enemyWeapon === 'paper')
  ) {
    result = 'win';
  } else {
    result = 'lose';
  }

  const pName = gameState.skin.toUpperCase();
  const eName = hudEnemyName.textContent;

  const playerCenter = getElementCenter(playerChoiceDisplay);
  const enemyCenter = getElementCenter(enemyChoiceDisplay);
  const clashCenter = {
    x: (playerCenter.x + enemyCenter.x) / 2,
    y: (playerCenter.y + enemyCenter.y) / 2
  };

  // Set particle color palette based on weapon clash
  const colorMap = {
    stone: ['#9c9c9c', '#787878', '#545454', '#ef4444'], // Rock + spark
    paper: ['#22c55e', '#4ade80', '#15803d', '#ffffff'], // Emerald/Paper green
    scissors: ['#22d3ee', '#0891b2', '#d1d5db', '#ffffff'] // Diamond/Steel blue
  };
  const pPalette = colorMap[playerWeapon] || ['#ef4444', '#b91c1c', '#dc2626', '#4b5563'];
  const ePalette = colorMap[enemyWeapon] || ['#ef4444', '#b91c1c', '#dc2626', '#4b5563'];
  const clashPalette = [...pPalette, ...ePalette];

  // Clear previous animation classes
  playerAvatar3D.className = `avatar-blocky skin-${gameState.skin}`;
  const currentBossClass = gameState.mode === 'match' ? BOSSES[gameState.bossIndex].skinClass : 'skin-boss';
  enemyAvatar3D.className = `avatar-blocky ${currentBossClass}`;

  // Force reflow
  void playerAvatar3D.offsetWidth;
  void enemyAvatar3D.offsetWidth;

  if (result === 'draw') {
    // DRAW CASE
    playDrawSound();
    battleStatusMsg.textContent = 'ROUND DRAW!';
    clashText.textContent = 'DRAW';
    clashText.className = 'clash-effect text-yellow';

    printLog(`${pName} chose ${playerWeapon.toUpperCase()}. ${eName} chose ${enemyWeapon.toUpperCase()}. Round is a Draw.`, 'text-white');

    // Spawn neutral sparks in center
    spawnParticles(clashCenter.x, clashCenter.y, ['#e2e8f0', '#94a3b8', '#64748b', '#cbd5e1'], 15);

    setTimeout(() => {
      resetVisualsAfterRound();
    }, 1200);

  } else if (result === 'win') {
    // WIN CASE
    playWinSound();
    battleStatusMsg.textContent = 'PLAYER DEAL DAMAGE!';
    clashText.textContent = 'HIT!';
    clashText.className = 'clash-effect text-green';

    // Adjust State
    gameState.score += 100 + (gameState.streak * 20);
    gameState.streak++;
    if (gameState.streak > gameState.maxStreak) {
      gameState.maxStreak = gameState.streak;
    }

    hudScore.textContent = gameState.score;
    hudStreak.textContent = gameState.streak;

    // Trigger attacking and damage animation
    playerAvatar3D.classList.add('attacker-left');
    enemyAvatar3D.classList.add('hit');

    // Lose Heart
    gameState.enemyHP--;
    renderHearts(enemyHeartsContainer, gameState.enemyHP, gameState.maxHP);

    printLog(`${pName} chose ${playerWeapon.toUpperCase()}. ${eName} chose ${enemyWeapon.toUpperCase()}. CRITICAL HIT!`, 'text-green');
    printLog(`${eName} lost 1 Heart!`, 'text-red');

    // Particles at clash center and at the enemy pedestal
    setTimeout(() => {
      spawnParticles(clashCenter.x, clashCenter.y, clashPalette, 25);
      const enemyPedCoords = getElementCenter(enemyFighter);
      spawnParticles(enemyPedCoords.x, enemyPedCoords.y - 40, ['#ef4444', '#b91c1c', '#dc2626', '#f87171'], 30); // Red damage sparks
    }, 150);

    setTimeout(() => {
      checkGameStatus();
    }, 1300);

  } else {
    // LOSE CASE
    playLoseSound();
    battleStatusMsg.textContent = 'BOSS DEAL DAMAGE!';
    clashText.textContent = 'OOF!';
    clashText.className = 'clash-effect text-red';

    // Adjust State
    gameState.streak = 0;
    hudStreak.textContent = '0';

    // Trigger damage on Player
    enemyAvatar3D.classList.add('attacker-right');
    playerAvatar3D.classList.add('hit');

    gameState.playerHP--;
    renderHearts(playerHeartsContainer, gameState.playerHP, gameState.maxHP);

    if (playerWeapon === 'timeout') {
      printLog(`You timed out! ${eName} dealt damage.`, 'text-red');
    } else {
      printLog(`${pName} chose ${playerWeapon.toUpperCase()}. ${eName} chose ${enemyWeapon.toUpperCase()}. Take damage!`, 'text-red');
    }
    printLog(`${pName} lost 1 Heart!`, 'text-red');

    // Particles at clash center and at player pedestal
    setTimeout(() => {
      spawnParticles(clashCenter.x, clashCenter.y, clashPalette, 25);
      const playerPedCoords = getElementCenter(playerFighter);
      spawnParticles(playerPedCoords.x, playerPedCoords.y - 40, ['#ef4444', '#b91c1c', '#dc2626', '#4b5563'], 30); // Red damage sparks
    }, 150);

    setTimeout(() => {
      checkGameStatus();
    }, 1300);
  }
}

function resetVisualsAfterRound() {
  clashText.textContent = 'VS';
  clashText.className = 'clash-effect';
  battleStatusMsg.textContent = 'CHOOSE WEAPON...';
  gameState.isLocked = false;
  startRoundTimer();
}

// 12. CHECK GAME OVER OR PROGRESSION
function checkGameStatus() {
  const pName = gameState.skin.toUpperCase();
  const eName = hudEnemyName.textContent;

  if (gameState.playerHP <= 0) {
    // Player dies
    playerAvatar3D.className = 'avatar-blocky dead';
    printLog(`${pName} has been defeated!`, 'text-red');

    setTimeout(() => {
      endGame(false);
    }, 1000);

  } else if (gameState.enemyHP <= 0) {
    // Boss dies
    enemyAvatar3D.className = 'avatar-blocky dead';
    printLog(`${eName} has been annihilated!`, 'text-green');

    if (gameState.mode === 'match') {
      gameState.bossIndex++;
      const clearedGauntlet = gameState.bossIndex >= BOSSES.length;
      if (clearedGauntlet) {
        gameState.bossIndex = 0;
      }

      if (clearedGauntlet) {
        printLog(`[CONGRATULATIONS]: You have cleared the Voxel Gauntlet!`, 'text-yellow');
      } else {
        printLog(`[VICTORY]: You have defeated ${eName}!`, 'text-green');
        gameState.score += 500;
        hudScore.textContent = gameState.score;
      }

      setTimeout(() => {
        endGame(true);
      }, 1000);
    } else {
      // Endless mode: Respawn infinite enemies
      gameState.score += 300;
      hudScore.textContent = gameState.score;
      gameState.enemyHP = 3;

      setTimeout(() => {
        // Randomize the next endless enemy name slightly
        const randomTitles = ['Skeleton Archer', 'Zombie Knight', 'Spider Rider', 'Ghast King', 'Iron Golem'];
        const nextBossName = randomTitles[Math.floor(Math.random() * randomTitles.length)];
        hudEnemyName.textContent = nextBossName;

        // Random boss heads
        const randomBossInfo = BOSSES[Math.floor(Math.random() * BOSSES.length)];
        document.querySelector('.hud-avatar.enemy').innerHTML = randomBossInfo.headSvg;
        renderFullBody(randomBossInfo.skinClass, enemyAvatar3D);

        renderHearts(enemyHeartsContainer, gameState.enemyHP, gameState.maxHP);

        printLog(`A new challenger appears: ${nextBossName}!`, 'text-purple');

        resetVisualsAfterRound();
      }, 1000);
    }
  } else {
    resetVisualsAfterRound();
  }
}

// Stage advancement in Match mode
function advanceStage() {
  playVictoryFanfare();

  // Restore health partially/fully on clear
  gameState.playerHP = 3;
  gameState.enemyHP = 3;

  const currentBoss = BOSSES[gameState.bossIndex];
  hudEnemyName.textContent = currentBoss.name;
  document.querySelector('.hud-avatar.enemy').innerHTML = currentBoss.headSvg;
  renderFullBody(currentBoss.skinClass, enemyAvatar3D);

  // Render healths
  renderHearts(playerHeartsContainer, gameState.playerHP, gameState.maxHP);
  renderHearts(enemyHeartsContainer, gameState.enemyHP, gameState.maxHP);

  // Force reset player animation class
  playerAvatar3D.className = `avatar-blocky skin-${gameState.skin}`;

  printLog(`Advancing to STAGE ${gameState.bossIndex + 1}: Facing ${currentBoss.name}!`, 'text-purple');
  printLog(`Your health has been fully restored.`, 'text-green');

  resetVisualsAfterRound();
}

// 13. GAME END HANDLER
function endGame(isUltimateVictory) {
  stopRoundTimer();
  
  // Save High Score for current mode
  let scoreKey = 'voxel_highscore_endless';
  if (gameState.mode === 'match') {
    scoreKey = 'voxel_highscore_match';
  } else if (gameState.mode === 'versus') {
    scoreKey = 'voxel_highscore_versus';
  }

  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    localStorage.setItem(scoreKey, gameState.highScore);
    printLog(`[NEW HIGH SCORE]: ${gameState.highScore} points!`, 'text-yellow');
  }

  // Setup Game Over screen stats
  gameState.roundsPlayed = 1; // 1 match completed
  statFinalScore.textContent = gameState.score;
  statMaxStreak.textContent = gameState.maxStreak;
  statHighScore.textContent = gameState.highScore;
  statRounds.textContent = gameState.roundsPlayed;

  if (isUltimateVictory) {
    gameoverTitle.textContent = "VICTORY!";
    gameoverTitle.className = "pixel-title text-green";
    if (gameState.mode === 'match') {
      const prevIndex = (gameState.bossIndex === 0) ? BOSSES.length - 1 : gameState.bossIndex - 1;
      gameoverSubtitle.textContent = `Defeated ${BOSSES[prevIndex].name}`;
    } else {
      gameoverSubtitle.textContent = "VOXEL CHAMPION";
    }
    gameoverSubtitle.className = "pixel-subtitle text-yellow";
    playVictoryFanfare();
  } else {
    gameoverTitle.textContent = "YOU DIED";
    gameoverTitle.className = "pixel-title text-red";

    if (gameState.mode === 'match') {
      gameoverSubtitle.textContent = `Defeated on Stage ${gameState.bossIndex + 1}`;
    } else {
      gameoverSubtitle.textContent = "Survival Run Completed";
    }
    gameoverSubtitle.className = "pixel-subtitle text-white";
    playLoseSound();
  }

  if (gameState.mode === 'match') {
    restartBtn.style.display = 'none';
    menuBtn.style.display = 'block';
  } else {
    restartBtn.style.display = 'block';
    restartBtn.textContent = 'RESPAWN';
    menuBtn.style.display = '';
  }

  switchScreen('gameover');
}

/* ==========================================================================
   P2P MULTIPLAYER / VERSUS MODE ENGINE (PEERJS)
   ========================================================================== */

let networkHeartbeatInterval = null;

function startNetworkHeartbeat() {
  if (networkHeartbeatInterval) return;
  
  networkHeartbeatInterval = setInterval(() => {
    if (gameState.mode !== 'versus') return;
    
    const now = Date.now();
    
    if (gameState.isHost) {
      // 1. Send ping to all open client connections
      gameState.connections.forEach(conn => {
        if (conn.open) {
          conn.send({ type: 'ping' });
        }
      });
      
      // 2. Check if any client is unresponsive
      gameState.connections.forEach(conn => {
        const pId = getPlayerIndexByConn(conn);
        if (!pId) return;
        
        const player = gameState.players[pId];
        if (!player || !player.isAlive) return;
        
        // Initialize lastActive if not present
        if (!conn.lastActive) {
          conn.lastActive = now;
        }
        
        const elapsed = now - conn.lastActive;
        
        // If client hasn't ponged in > 9 seconds, treat them as lagging/timeout
        if (elapsed > 9000) {
          if (gameState.screen === 'battle' && !gameState.isLocked) {
            // If we are in battle and waiting for their choice
            if (!player.choice) {
              player.choice = 'timeout';
              printLog(`[MULTIPLAYER]: Player ${pId} (${player.skin.toUpperCase()}) is unresponsive. Auto-timing out.`, 'text-yellow');
              
              // Check if all players have chosen now
              let allChosen = true;
              for (let id in gameState.players) {
                if (gameState.players[id].isAlive && !gameState.players[id].choice) {
                  allChosen = false;
                }
              }
              if (allChosen) {
                stopRoundTimer();
                resolveVersusRound();
              }
            }
          }
        }
        
        // If client hasn't ponged in > 20 seconds, assume disconnected
        if (elapsed > 20000) {
          printLog(`[MULTIPLAYER]: Player ${pId} connection timed out.`, 'text-red');
          conn.close();
          handlePeerDisconnect(conn);
        }
      });
    } else {
      // Client monitoring the host
      if (gameState.conn && gameState.conn.open) {
        if (!gameState.hostLastActive) {
          gameState.hostLastActive = now;
        }
        
        const elapsed = now - gameState.hostLastActive;
        if (elapsed > 10000) {
          printLog('[MULTIPLAYER]: Lost connection to host (timeout).', 'text-red');
          gameState.conn.close();
          handlePeerDisconnect(gameState.conn);
        }
      }
    }
  }, 3000);
}

const SKINS = {
  steve: {
    name: "STEVE",
    skinClass: "skin-steve",
    headSvg: `<svg viewBox="0 0 8 8" class="pixel-avatar-svg">
      <rect x="0" y="0" width="8" height="8" fill="#dcb594" />
      <rect x="0" y="0" width="8" height="3" fill="#4a3728" />
      <rect x="0" y="3" width="1" height="1" fill="#4a3728" />
      <rect x="7" y="3" width="1" height="1" fill="#4a3728" />
      <rect x="1" y="4" width="2" height="1" fill="#fff" />
      <rect x="2" y="4" width="1" height="1" fill="#3f51b5" />
      <rect x="5" y="4" width="2" height="1" fill="#fff" />
      <rect x="5" y="4" width="1" height="1" fill="#3f51b5" />
      <rect x="2" y="6" width="4" height="1" fill="#9c5744" />
      <rect x="3" y="5" width="2" height="1" fill="#c68a75" />
    </svg>`
  },
  alex: {
    name: "ALEX",
    skinClass: "skin-alex",
    headSvg: `<svg viewBox="0 0 8 8" class="pixel-avatar-svg">
      <rect x="0" y="0" width="8" height="8" fill="#e2b49a" />
      <rect x="0" y="0" width="8" height="3" fill="#e07a33" />
      <rect x="0" y="3" width="2" height="2" fill="#e07a33" />
      <rect x="6" y="3" width="2" height="2" fill="#e07a33" />
      <rect x="1" y="4" width="2" height="1" fill="#fff" />
      <rect x="1" y="4" width="1" height="1" fill="#4ade80" />
      <rect x="5" y="4" width="2" height="1" fill="#fff" />
      <rect x="6" y="4" width="1" height="1" fill="#4ade80" />
      <rect x="3" y="6" width="2" height="1" fill="#a16155" />
    </svg>`
  },
  noob: {
    name: "NOOB",
    skinClass: "skin-noob",
    headSvg: `<svg viewBox="0 0 8 8" class="pixel-avatar-svg">
      <rect x="0" y="0" width="8" height="8" fill="#facc15" />
      <rect x="2" y="3" width="1" height="1.5" fill="#000" />
      <rect x="5" y="3" width="1" height="1.5" fill="#000" />
      <rect x="2" y="6" width="4" height="1" fill="#000" />
      <rect x="2" y="5" width="1" height="1" fill="#000" />
      <rect x="5" y="5" width="1" height="1" fill="#000" />
    </svg>`
  },
  creeper: {
    name: "CREEPER",
    skinClass: "skin-creeper",
    headSvg: `<svg viewBox="0 0 8 8" class="pixel-avatar-svg">
      <rect x="0" y="0" width="8" height="8" fill="#22c55e" />
      <rect x="1" y="1" width="1" height="1" fill="#166534" />
      <rect x="5" y="0" width="1" height="1" fill="#166534" />
      <rect x="6" y="5" width="1" height="1" fill="#166534" />
      <rect x="0" y="6" width="1" height="1" fill="#166534" />
      <rect x="3" y="2" width="2" height="1" fill="#15803d" />
      <rect x="1" y="3" width="2" height="2" fill="#000" />
      <rect x="5" y="3" width="2" height="2" fill="#000" />
      <rect x="3" y="4" width="2" height="2" fill="#000" />
      <rect x="2" y="5" width="4" height="3" fill="#000" />
    </svg>`
  }
};

function selectVersusMode() {
  modeEndless.classList.remove('active');
  modeMatch.classList.remove('active');
  modeVersus.classList.add('active');
  gameState.mode = 'versus';
  modeDesc.textContent = "Play with friends online! Secretly choose weapons and battle in real-time.";
  
  // Show multiplayer panel
  document.getElementById('multiplayer-panel').style.display = 'block';
  
  // Initialize players structure if not yet done
  if (!gameState.players[1]) {
    gameState.players = {
      1: { skin: gameState.skin, choice: null, hp: 3, name: 'YOU (HOST)', isAlive: true, rematchReady: false }
    };
  }
  
  updateLobbyUI();
  updateLobbyGameTypeUI();
}

function updateLobbyUI() {
  if (gameState.mode !== 'versus') return;

  const connectedCount = Object.keys(gameState.players).length;
  const isFull = connectedCount === gameState.maxPlayers;

  const savedLobbyId = sessionStorage.getItem('voxel_lobby_id');
  const savedPlayerIndex = sessionStorage.getItem('voxel_player_index');
  const reconnectPanel = document.getElementById('lobby-reconnect-controls');
  const btnReconnectLobby = document.getElementById('btn-reconnect-lobby');
  if (reconnectPanel) {
    if (savedLobbyId && savedPlayerIndex && (!gameState.peer || (!gameState.peerId && !gameState.conn))) {
      reconnectPanel.style.display = 'block';
      if (btnReconnectLobby) {
        btnReconnectLobby.textContent = 'RECONNECT TO GAME';
        btnReconnectLobby.removeAttribute('disabled');
      }
    } else {
      reconnectPanel.style.display = 'none';
    }
  }

  if (gameState.peer && (gameState.peerId || gameState.conn)) {
    updateLobbyStatus(`CONNECTED! (${connectedCount}/${gameState.maxPlayers})`, 'green');
    if (gameState.isHost) {
      if (isFull) {
        playBtn.removeAttribute('disabled');
        playBtn.textContent = 'START BATTLE';
      } else {
        playBtn.setAttribute('disabled', 'true');
        playBtn.textContent = `WAITING FOR PLAYERS (${connectedCount}/${gameState.maxPlayers})...`;
      }
    } else {
      playBtn.setAttribute('disabled', 'true');
      playBtn.textContent = `WAITING FOR HOST (${connectedCount}/${gameState.maxPlayers})...`;
    }
  } else {
    updateLobbyStatus('DISCONNECTED', 'red');
    const savedLobbyId = sessionStorage.getItem('voxel_lobby_id');
    if (savedLobbyId) {
      playBtn.removeAttribute('disabled');
      playBtn.textContent = 'CONNECT A FRIEND TO BATTLE';
    } else {
      playBtn.setAttribute('disabled', 'true');
      playBtn.textContent = 'CONNECT A FRIEND TO BATTLE';
    }
  }
  updateLobbyGameTypeUI();
}

function updateLobbyGameTypeUI() {
  const btnNormal = document.getElementById('btn-type-normal');
  const btnDare = document.getElementById('btn-type-dare');
  if (!btnNormal || !btnDare) return;

  btnNormal.classList.remove('active');
  btnDare.classList.remove('active');

  if (gameState.versusGameType === 'dare') {
    btnDare.classList.add('active');
  } else {
    btnNormal.classList.add('active');
  }

  const inLobby = gameState.peer && (gameState.peerId || gameState.conn);
  if (inLobby && !gameState.isHost) {
    btnNormal.setAttribute('disabled', 'true');
    btnDare.setAttribute('disabled', 'true');
  } else {
    btnNormal.removeAttribute('disabled');
    btnDare.removeAttribute('disabled');
  }
}

function initPeer(customId = null) {
  if (gameState.peer) return;

  updateLobbyStatus('CONNECTING...', 'yellow');

  try {
    gameState.peer = new Peer(customId, {
      debug: 1
    });

    gameState.peer.on('open', (id) => {
      gameState.peerId = id;
      gameState.isHost = true;
      gameState.playerIndex = 1;
      gameState.players = {
        1: { skin: gameState.skin, choice: null, hp: 3, name: 'YOU (HOST)', isAlive: true, rematchReady: false }
      };
      
      sessionStorage.setItem('voxel_lobby_id', id);
      sessionStorage.setItem('voxel_player_index', '1');
      
      console.log('PeerJS initialized with ID:', id);
      
      // Generate and display invite link
      const inviteLink = window.location.origin + window.location.pathname + '?join=' + id;
      document.getElementById('invite-link-input').value = inviteLink;
      document.getElementById('invite-link-container').style.display = 'block';
      
      // Auto fill Lobby Code input for helper
      document.getElementById('lobby-code-input').placeholder = id;
      printLog('[MULTIPLAYER]: Lobby created! Share the invite link with friends.', 'text-yellow');
      
      updateLobbyUI();
    });

    gameState.peer.on('connection', (conn) => {
      if (gameState.connections.length + 1 >= gameState.maxPlayers) {
        conn.on('open', () => {
          conn.send({ type: 'rejected', reason: 'Lobby is full!' });
          setTimeout(() => conn.close(), 500);
        });
        return;
      }
      setupConnection(conn);
    });

    gameState.peer.on('error', (err) => {
      console.error('PeerJS client error:', err);
      printLog('[ERROR]: ' + err.message, 'text-red');
      updateLobbyStatus('ERROR', 'red');
    });
  } catch (e) {
    console.error('Failed to create PeerJS client', e);
    updateLobbyStatus('FAILED TO INITIALIZE', 'red');
  }
}

function extractPeerId(inputString) {
  if (!inputString) return '';
  inputString = inputString.trim();
  try {
    if (inputString.includes('?join=')) {
      const url = new URL(inputString);
      const joinParam = url.searchParams.get('join');
      if (joinParam) return joinParam;
    }
  } catch (e) {}
  
  if (inputString.includes('join=')) {
    const parts = inputString.split('join=');
    if (parts.length > 1) {
      return parts[1].split('&')[0].trim();
    }
  }
  return inputString;
}

function joinLobby(hostId) {
  hostId = extractPeerId(hostId);
  if (!hostId) return;
  
  const savedLobbyId = sessionStorage.getItem('voxel_lobby_id');
  const savedPlayerIndex = sessionStorage.getItem('voxel_player_index');
  
  // If we are host and entered our own lobby ID/link, re-host it
  if (savedLobbyId === hostId && savedPlayerIndex === '1') {
    printLog('[MULTIPLAYER]: Re-creating lobby as Host...', 'text-yellow');
    initPeer(hostId);
    return;
  }
  
  updateLobbyStatus('CONNECTING TO SIGNALING...', 'yellow');
  
  try {
    if (!gameState.peer) {
      gameState.peer = new Peer(null, { debug: 1 });
      gameState.peer.on('open', (id) => {
        gameState.peerId = id;
        connectToHost(hostId);
      });
      gameState.peer.on('error', (err) => {
        console.error(err);
        updateLobbyStatus('ERROR', 'red');
      });
    } else {
      connectToHost(hostId);
    }
  } catch (e) {
    console.error(e);
    updateLobbyStatus('FAILED TO INITIALIZE', 'red');
  }
}

function connectToHost(hostId) {
  updateLobbyStatus('CONNECTING TO HOST...', 'yellow');
  const conn = gameState.peer.connect(hostId);
  gameState.isHost = false;
  setupConnection(conn);
}

function setupConnection(conn) {
  conn.lastActive = Date.now();
  gameState.hostLastActive = Date.now();
  if (gameState.isHost) {
    conn.on('open', () => {
      console.log('Client connection opened, waiting for handshake...');
      playClickSound();
    });
  } else {
    gameState.conn = conn;

    conn.on('open', () => {
      console.log('Connected to host successfully!');
      playClickSound();
      printLog('[MULTIPLAYER]: Connected to host lobby! Synchronizing...', 'text-green');

      const savedLobbyId = sessionStorage.getItem('voxel_lobby_id');
      const savedPlayerIndex = sessionStorage.getItem('voxel_player_index');
      
      if (savedLobbyId === conn.peer && savedPlayerIndex) {
        conn.send({
          type: 'reconnect',
          playerIndex: parseInt(savedPlayerIndex, 10),
          skin: gameState.skin
        });
      } else {
        // Send local skin to host
        conn.send({ type: 'skin', skin: gameState.skin });
      }
    });
  }

  conn.on('data', (data) => {
    handlePeerMessage(data, conn);
  });

  conn.on('close', () => {
    handlePeerDisconnect(conn);
  });

  conn.on('error', (err) => {
    console.error('Connection channel error:', err);
    handlePeerDisconnect(conn);
  });
}

function getPlayerIndexByConn(conn) {
  if (!conn) return null;
  return conn.playerIndex || null;
}

function broadcast(msg) {
  if (gameState.isHost) {
    gameState.connections.forEach(c => {
      if (c.open) {
        c.send(msg);
      }
    });
  }
}

function sendPeerMessage(msg) {
  if (gameState.isHost) {
    broadcast(msg);
  } else {
    if (gameState.conn && gameState.conn.open) {
      gameState.conn.send(msg);
    }
  }
}

function getNextAvailablePlayerIndex() {
  for (let i = 2; i <= gameState.maxPlayers; i++) {
    if (!gameState.players[i]) {
      return i;
    }
  }
  return gameState.connections.length + 2;
}

function handlePeerMessage(data, conn) {
  const senderIndex = gameState.isHost ? getPlayerIndexByConn(conn) : 1;

  switch (data.type) {
    case 'ping':
      if (gameState.conn && gameState.conn.open) {
        gameState.conn.send({ type: 'pong' });
      }
      gameState.hostLastActive = Date.now();
      break;

    case 'pong':
      if (gameState.isHost) {
        conn.lastActive = Date.now();
      }
      break;

    case 'reconnect':
      if (gameState.isHost) {
        const reconnectIndex = data.playerIndex;
        if (reconnectIndex && reconnectIndex > 1 && reconnectIndex <= gameState.maxPlayers && gameState.players[reconnectIndex]) {
          conn.playerIndex = reconnectIndex;
          
          // Remove old connection if still in the array
          gameState.connections = gameState.connections.filter(c => c.playerIndex !== reconnectIndex && c !== conn);
          gameState.connections.push(conn);
          
          gameState.players[reconnectIndex].connected = true;
          gameState.players[reconnectIndex].isAlive = (gameState.players[reconnectIndex].hp > 0);
          gameState.players[reconnectIndex].skin = data.skin;
          gameState.players[reconnectIndex].name = `PLAYER ${reconnectIndex} (${data.skin.toUpperCase()})`;

          printLog(`[MULTIPLAYER]: Player ${reconnectIndex} has reconnected!`, 'text-green');

          // Initialize client state
          conn.send({
            type: 'init',
            playerIndex: reconnectIndex,
            maxPlayers: gameState.maxPlayers,
            players: gameState.players,
            reconnect: true,
            versusGameType: gameState.versusGameType
          });

          // Broadcast player updates
          broadcast({
            type: 'players_update',
            players: gameState.players
          });

          updateLobbyUI();

          // If in battle screen, restore the reconnecting player's pedestal visual
          if (gameState.screen === 'battle') {
            // Check if they need to be resolved or if all choices are locked
            let allChosen = true;
            for (let pId in gameState.players) {
              if (gameState.players[pId].isAlive && !gameState.players[pId].choice) {
                allChosen = false;
              }
            }
            if (allChosen) {
              stopRoundTimer();
              resolveVersusRound();
            }
          }
        }
      }
      break;

    case 'rejected':
      printLog(`[MULTIPLAYER]: Rejected from lobby. Reason: ${data.reason}`, 'text-red');
      updateLobbyStatus('LOBBY FULL', 'red');
      break;

    case 'init':
      gameState.playerIndex = data.playerIndex;
      gameState.maxPlayers = data.maxPlayers;
      gameState.players = data.players;
      if (data.versusGameType) {
        gameState.versusGameType = data.versusGameType;
      }
      updateLobbyGameTypeUI();
      
      sessionStorage.setItem('voxel_player_index', data.playerIndex);
      if (gameState.conn && gameState.conn.peer) {
        sessionStorage.setItem('voxel_lobby_id', gameState.conn.peer);
      }
      
      if (data.reconnect) {
        printLog('[MULTIPLAYER]: Successfully reconnected to the active game!', 'text-green');
        switchScreen('battle');
        initMultiplayerPedestals();
        document.querySelector('.battle-stage').classList.add('multiplayer');
        
        const reconnectPanel = document.getElementById('lobby-reconnect-controls');
        if (reconnectPanel) reconnectPanel.style.display = 'none';
        
        gameState.isLocked = (gameState.players[gameState.playerIndex].choice !== null);
        gameState.localChoice = gameState.players[gameState.playerIndex].choice;
        
        if (gameState.isLocked) {
          battleStatusMsg.textContent = 'LOCKED! WAITING FOR FRIEND...';
        } else {
          battleStatusMsg.textContent = 'CHOOSE WEAPON...';
        }
        
        stopRoundTimer();
        if (gameState.timerEnabled && !gameState.isLocked) {
          startRoundTimer();
        }
      } else {
        printLog(`[MULTIPLAYER]: You entered the lobby as PLAYER ${data.playerIndex}`, 'text-yellow');
        sendPeerMessage({ type: 'skin', skin: gameState.skin });
        updateLobbyUI();
      }
      break;

    case 'players_update':
      gameState.players = data.players;
      updateLobbyUI();
      break;

    case 'skin':
      if (gameState.isHost) {
        if (!senderIndex) {
          // New connection joining the lobby
          if (gameState.connections.length + 1 >= gameState.maxPlayers) {
            conn.send({ type: 'rejected', reason: 'Lobby is full!' });
            setTimeout(() => conn.close(), 500);
          } else if (gameState.screen === 'battle') {
            conn.send({ type: 'rejected', reason: 'Game is currently in progress!' });
            setTimeout(() => conn.close(), 500);
          } else {
            const newIndex = getNextAvailablePlayerIndex();
            conn.playerIndex = newIndex;
            gameState.connections.push(conn);
            
            gameState.players[newIndex] = {
              skin: data.skin,
              choice: null,
              hp: 3,
              name: `PLAYER ${newIndex} (${data.skin.toUpperCase()})`,
              isAlive: true,
              rematchReady: false,
              connected: true
            };
            
            printLog(`[MULTIPLAYER]: Player ${newIndex} joined!`, 'text-green');

            conn.send({
              type: 'init',
              playerIndex: newIndex,
              maxPlayers: gameState.maxPlayers,
              players: gameState.players,
              versusGameType: gameState.versusGameType
            });

            broadcast({
              type: 'players_update',
              players: gameState.players
            });

            updateLobbyUI();
          }
        } else {
          // Existing player changing skin
          gameState.players[senderIndex].skin = data.skin;
          gameState.players[senderIndex].name = `PLAYER ${senderIndex} (${data.skin.toUpperCase()})`;
          printLog(`[MULTIPLAYER]: Player ${senderIndex} chose skin: ${data.skin.toUpperCase()}`, 'text-cyan');
          
          broadcast({
            type: 'players_update',
            players: gameState.players
          });
          
          updateLobbyUI();
        }
      }
      break;

    case 'start':
      gameState.players = data.players;
      if (data.versusGameType) {
        gameState.versusGameType = data.versusGameType;
      }
      startVersusBattle();
      break;

    case 'game_type_update':
      if (!gameState.isHost) {
        gameState.versusGameType = data.gameType;
        updateLobbyGameTypeUI();
        printLog(`[MULTIPLAYER]: Host updated game type to ${data.gameType.toUpperCase()}`, 'text-yellow');
      }
      break;

    case 'tod_question':
      gameState.todType = data.qType;
      gameState.todQuestion = data.text;
      
      const displayTitle = document.getElementById('tod-display-title');
      const textDisplay = document.getElementById('tod-text-display');
      
      if (displayTitle) {
        displayTitle.textContent = data.qType === 'truth' ? "THE WINNER'S TRUTH QUESTION:" : "THE WINNER'S DARE:";
      }
      if (textDisplay) {
        textDisplay.textContent = data.text;
      }
      
      const ansInputContainer = document.getElementById('tod-answer-input-container');
      const ansDisplayContainer = document.getElementById('tod-answers-display-container');
      const ansList = document.getElementById('tod-answers-list');
      
      if (ansList) ansList.innerHTML = '';
      if (ansDisplayContainer) ansDisplayContainer.style.display = data.qType === 'truth' ? 'block' : 'none';
      
      // If we are a loser (meaning not the winnerIndex), and it's truth, show answer input
      if (data.qType === 'truth' && gameState.playerIndex != data.winnerIndex) {
        if (ansInputContainer) ansInputContainer.style.display = 'block';
        const ansInput = document.getElementById('tod-answer-input');
        if (ansInput) ansInput.value = '';
      } else {
        if (ansInputContainer) ansInputContainer.style.display = 'none';
      }
      
      playVictoryFanfare();
      printLog(`[MULTIPLAYER]: Winner chose ${data.qType.toUpperCase()}: "${data.text}"`, 'text-red');
      break;

    case 'tod_answer':
      if (gameState.isHost && senderIndex) {
        // Broadcast the answer to all clients
        broadcast({
          type: 'tod_answer',
          senderIndex: senderIndex,
          answerText: data.answerText
        });
      }
      
      const pIndex = data.senderIndex || senderIndex;
      if (pIndex) {
        const pSkin = (gameState.players[pIndex] && gameState.players[pIndex].skin) ? gameState.players[pIndex].skin.toUpperCase() : `P${pIndex}`;
        const answersList = document.getElementById('tod-answers-list');
        const answersDisplay = document.getElementById('tod-answers-display-container');
        
        if (answersList) {
          const div = document.createElement('div');
          div.style.marginBottom = '4px';
          div.innerHTML = `<span class="text-cyan">${pSkin}:</span> <span class="text-white">${data.answerText}</span>`;
          answersList.appendChild(div);
          answersList.scrollTop = answersList.scrollHeight;
        }
        if (answersDisplay) {
          answersDisplay.style.display = 'block';
        }
        printLog(`[MULTIPLAYER]: ${pSkin} answered: "${data.answerText}"`, 'text-green');
        playClickSound();
      }
      break;

    case 'choice':
      if (gameState.isHost && senderIndex) {
        gameState.players[senderIndex].choice = data.choice;
        printLog(`[MULTIPLAYER]: Player ${senderIndex} locked their move!`, 'text-cyan');
        
        let allChosen = true;
        for (let pId in gameState.players) {
          if (gameState.players[pId].isAlive && !gameState.players[pId].choice) {
            allChosen = false;
          }
        }

        if (allChosen) {
          stopRoundTimer();
          resolveVersusRound();
        } else {
          if (!timerInterval) {
            startRoundTimer();
          }
        }
      }
      break;

    case 'resolve':
      resolveVersusRoundFinal(data.choices, data.results, data.hpChanges, data.roundDraw);
      break;

    case 'rematch':
      if (gameState.isHost && senderIndex) {
        gameState.players[senderIndex].rematchReady = true;
        printLog(`[MULTIPLAYER]: Player ${senderIndex} voted for Rematch!`, 'text-yellow');
        
        let allReady = true;
        for (let pId in gameState.players) {
          if (!gameState.players[pId].rematchReady) {
            allReady = false;
          }
        }

        if (allReady) {
          startVersusBattle();
        }
      }
      break;

    case 'chat':
      if (gameState.isHost && senderIndex) {
        broadcast({
          type: 'chat',
          message: data.message,
          senderIndex: senderIndex
        });
        
        const skinName = (gameState.players[senderIndex].skin || 'steve').toUpperCase();
        printChatLog(`${skinName} (P${senderIndex})`, data.message, 'text-yellow');
        playClickSound();
        triggerChatTabNotification();
      } else if (!gameState.isHost) {
        if (data.senderIndex === gameState.playerIndex) {
          break;
        }
        const sender = gameState.players[data.senderIndex];
        if (sender) {
          const skinName = (sender.skin || 'steve').toUpperCase();
          printChatLog(`${skinName} (P${data.senderIndex})`, data.message, 'text-yellow');
          playClickSound();
          triggerChatTabNotification();
        }
      }
      break;
  }
}

function triggerChatTabNotification() {
  const chatTab = document.getElementById('tab-btn-chat');
  if (chatTab && !chatTab.classList.contains('active')) {
    chatTab.style.borderColor = 'var(--color-red)';
    chatTab.textContent = 'CHAT 🔴';
  }
}

function handlePeerDisconnect(closedConn) {
  if (gameState.isHost) {
    const senderIndex = getPlayerIndexByConn(closedConn);
    printLog(`[MULTIPLAYER]: Player ${senderIndex || ''} disconnected.`, 'text-red');
    
    gameState.connections = gameState.connections.filter(c => c !== closedConn);
    
    if (senderIndex && gameState.players[senderIndex]) {
      gameState.players[senderIndex].connected = false;
      gameState.players[senderIndex].choice = 'timeout';
    }
    
    let activeHumanCount = 1; // Host is always active
    for (let pId in gameState.players) {
      if (pId > 1 && gameState.players[pId].connected && gameState.players[pId].isAlive) {
        activeHumanCount++;
      }
    }
    
    if (gameState.screen === 'battle') {
      if (activeHumanCount < 2) {
        // Not enough players to continue, abort
        battleStatusMsg.textContent = 'OPPONENT DISCONNECTED';
        clashText.textContent = 'ABORT';
        clashText.className = 'clash-effect text-red';
        gameState.isLocked = true;
        stopRoundTimer();
        
        gameState.connections.forEach(c => c.close());
        gameState.connections = [];
        gameState.players = {};
        
        setTimeout(() => {
          switchScreen('splash');
          updateLobbyStatus('DISCONNECTED', 'red');
          selectVersusMode();
        }, 2000);
      } else {
        // We have enough players to continue! Mark disconnected player as dead, broadcast, and check if all have chosen
        printLog(`[MULTIPLAYER]: Continuing match with remaining players.`, 'text-yellow');
        
        broadcast({
          type: 'players_update',
          players: gameState.players
        });
        
        const avatar = document.getElementById(`player-avatar-3d-${senderIndex}`);
        if (avatar) {
          avatar.className = 'avatar-blocky dead';
        }
        const bubble = document.getElementById(`choice-bubble-${senderIndex}`);
        if (bubble) {
          bubble.style.display = 'none';
        }
        
        // Check if all remaining players have chosen
        let allChosen = true;
        for (let pId in gameState.players) {
          if (gameState.players[pId].isAlive && !gameState.players[pId].choice) {
            allChosen = false;
          }
        }
        if (allChosen) {
          stopRoundTimer();
          resolveVersusRound();
        }
      }
    } else {
      const newPlayers = {
        1: { skin: gameState.skin, choice: null, hp: 3, name: 'YOU (HOST)', isAlive: true, rematchReady: false, connected: true }
      };
      
      gameState.connections.forEach((c, idx) => {
        const newIdx = idx + 2;
        newPlayers[newIdx] = {
          skin: 'steve',
          choice: null,
          hp: 3,
          name: `PLAYER ${newIdx}`,
          isAlive: true,
          rematchReady: false,
          connected: true
        };
        c.playerIndex = newIdx;
      });
      gameState.players = newPlayers;
      
      broadcast({ type: 'players_update', players: gameState.players });
      updateLobbyUI();
    }
  } else {
    printLog('[MULTIPLAYER]: Disconnected from host lobby.', 'text-red');
    gameState.conn = null;
    gameState.players = {};
    
    if (gameState.screen === 'battle') {
      battleStatusMsg.textContent = 'HOST DISCONNECTED';
      clashText.textContent = 'ABORT';
      clashText.className = 'clash-effect text-red';
      gameState.isLocked = true;
      stopRoundTimer();
      
      setTimeout(() => {
        switchScreen('splash');
        updateLobbyStatus('DISCONNECTED', 'red');
        selectVersusMode();
      }, 2000);
    } else {
      updateLobbyStatus('DISCONNECTED', 'red');
      selectVersusMode();
    }
  }
}

function updateLobbyStatus(text, colorClass) {
  const dot = document.getElementById('lobby-status-dot');
  const txt = document.getElementById('lobby-status-text');
  
  if (!dot || !txt) return;
  
  txt.textContent = `STATUS: ${text}`;
  dot.className = `status-dot ${colorClass}`;
  
  if (colorClass === 'yellow') {
    dot.classList.add('pulse');
  } else {
    dot.classList.remove('pulse');
  }
}

function initMultiplayerPedestals() {
  playerFighter.style.display = 'none';
  enemyFighter.style.display = 'none';
  document.querySelector('.choice-visualizer').style.display = 'none';

  multiplayerPedestalsContainer.innerHTML = '';
  multiplayerPedestalsContainer.style.display = 'flex';

  for (let pId in gameState.players) {
    const player = gameState.players[pId];
    if (player.isAlive === false) {
      continue;
    }
    
    const isSelf = pId == gameState.playerIndex;
    const nameLabel = isSelf ? `YOU (P${pId})` : `PLAYER ${pId}`;

    const pedestalContainer = document.createElement('div');
    pedestalContainer.className = 'pedestal-container';
    pedestalContainer.id = `pedestal-player-${pId}`;
    
    const choiceBubble = document.createElement('div');
    choiceBubble.className = 'choice-bubble';
    choiceBubble.id = `choice-bubble-${pId}`;
    pedestalContainer.appendChild(choiceBubble);

    const avatarBlocky = document.createElement('div');
    avatarBlocky.className = 'avatar-blocky';
    avatarBlocky.id = `player-avatar-3d-${pId}`;
    pedestalContainer.appendChild(avatarBlocky);

    const pedestalBase = document.createElement('div');
    pedestalBase.className = 'pedestal pixel-box-dark';
    pedestalContainer.appendChild(pedestalBase);

    const nameTag = document.createElement('div');
    nameTag.className = 'name-tag';
    nameTag.textContent = nameLabel;
    pedestalContainer.appendChild(nameTag);

    const heartsContainer = document.createElement('div');
    heartsContainer.className = 'hearts-container';
    heartsContainer.id = `player-hearts-${pId}`;
    pedestalContainer.appendChild(heartsContainer);

    multiplayerPedestalsContainer.appendChild(pedestalContainer);

    let skinClass = 'skin-steve';
    if (SKINS[player.skin]) {
      skinClass = SKINS[player.skin].skinClass;
    } else {
      skinClass = player.skin; // Fallback to direct class string for bots
    }
    
    if (player.connected === false) {
      avatarBlocky.className = 'avatar-blocky dead';
      choiceBubble.style.display = 'none';
    } else {
      renderFullBody(skinClass, avatarBlocky);
    }

    renderHearts(heartsContainer, player.hp, 3);
  }
}

function startVersusBattle() {
  gameState.score = 0;
  gameState.streak = 0;
  gameState.maxStreak = 0;
  gameState.roundsPlayed = 0;
  gameState.isLocked = false;
  gameState.localChoice = null;
  gameState.localRematchReady = false;
  gameState.todQuestion = null;
  gameState.todAnswers = [];

  // Load mode-specific high score
  let scoreKey = 'voxel_highscore_endless';
  if (gameState.mode === 'match') {
    scoreKey = 'voxel_highscore_match';
  } else if (gameState.mode === 'versus') {
    scoreKey = 'voxel_highscore_versus';
  }
  gameState.highScore = parseInt(localStorage.getItem(scoreKey) || localStorage.getItem('voxel_highscore') || '0', 10);

  const todSection = document.getElementById('gameover-tod-section');
  if (todSection) {
    todSection.style.display = 'none';
  }

  for (let pId in gameState.players) {
    gameState.players[pId].hp = 3;
    gameState.players[pId].isAlive = true;
    gameState.players[pId].choice = null;
    gameState.players[pId].rematchReady = false;
    gameState.players[pId].connected = true; // Initialize as connected
  }

  restartBtn.removeAttribute('disabled');
  restartBtn.textContent = 'REMATCH';

  if (gameState.isHost && gameState.mode === 'versus') {
    broadcast({ type: 'start', players: gameState.players, versusGameType: gameState.versusGameType });
  }

  initMultiplayerPedestals();

  const choicesContainer = document.querySelector('.choices-container');
  if (choicesContainer) {
    choicesContainer.style.display = '';
  }

  document.querySelector('.battle-stage').classList.add('multiplayer');

  clashText.textContent = 'VS';
  battleStatusMsg.textContent = 'CHOOSE WEAPON...';

  let modeText = 'Online Versus match started!';
  if (gameState.mode === 'endless') modeText = 'Endless Co-op Survival mode started!';
  if (gameState.mode === 'match') modeText = 'Match Play Co-op mode started!';
  
  consoleOutput.innerHTML = `
    <div class="console-line text-yellow">[SYSTEM]: ${modeText} Max Players: ${gameState.maxPlayers}</div>
    <div class="console-line text-white">[SYSTEM]: Select your weapon. Protect your 3 hearts!</div>
  `;
  scrollConsole();

  setupConsoleForMode();
  switchScreen('battle');
  playVictoryFanfare();
}

function resolveVersusRound() {
  
  const choices = {};
  const activePlayers = [];
  
  for (let pId in gameState.players) {
    if (gameState.players[pId].isAlive) {
      choices[pId] = gameState.players[pId].choice || 'timeout';
      activePlayers.push(pId);
    } else {
      choices[pId] = 'dead';
    }
  }

  const hpChanges = {};
  for (let pId in gameState.players) {
    hpChanges[pId] = 0;
  }

  activePlayers.forEach(pId => {
    if (choices[pId] === 'timeout') {
      hpChanges[pId] = -1;
    }
  });

  const validClashPlayers = activePlayers.filter(pId => choices[pId] !== 'timeout');
  const validWeapons = validClashPlayers.map(pId => choices[pId]);
  const uniqueWeapons = [...new Set(validWeapons)];

  let roundDraw = false;
  const results = {};

  if (uniqueWeapons.length <= 1) {
    roundDraw = true;
    for (let pId in gameState.players) {
      if (gameState.players[pId].isAlive) {
        if (choices[pId] === 'timeout') {
          results[pId] = 'timeout';
        } else {
          results[pId] = 'draw';
        }
      } else {
        results[pId] = 'dead';
      }
    }
  } else if (uniqueWeapons.length === 2) {
    const weaponA = uniqueWeapons[0];
    const weaponB = uniqueWeapons[1];
    let winningWeapon = '';
    let losingWeapon = '';

    if (
      (weaponA === 'stone' && weaponB === 'scissors') ||
      (weaponA === 'paper' && weaponB === 'stone') ||
      (weaponA === 'scissors' && weaponB === 'paper')
    ) {
      winningWeapon = weaponA;
      losingWeapon = weaponB;
    } else {
      winningWeapon = weaponB;
      losingWeapon = weaponA;
    }

    validClashPlayers.forEach(pId => {
      if (choices[pId] === losingWeapon) {
        hpChanges[pId] = -1;
      }
    });

    for (let pId in gameState.players) {
      if (gameState.players[pId].isAlive) {
        if (choices[pId] === 'timeout') {
          results[pId] = 'timeout';
        } else if (choices[pId] === winningWeapon) {
          results[pId] = 'win';
        } else {
          results[pId] = 'lose';
        }
      } else {
        results[pId] = 'dead';
      }
    }
  } else if (uniqueWeapons.length === 3) {
    // Count choices for each weapon
    const counts = { stone: 0, paper: 0, scissors: 0 };
    validWeapons.forEach(w => {
      counts[w] = (counts[w] || 0) + 1;
    });

    let maxCount = 0;
    let majorityWeapon = null;
    let isTie = false;

    for (const w in counts) {
      if (counts[w] > maxCount) {
        maxCount = counts[w];
        majorityWeapon = w;
        isTie = false;
      } else if (counts[w] === maxCount && maxCount > 0) {
        isTie = true;
      }
    }

    if (isTie) {
      roundDraw = true;
      for (let pId in gameState.players) {
        if (gameState.players[pId].isAlive) {
          if (choices[pId] === 'timeout') {
            results[pId] = 'timeout';
          } else {
            results[pId] = 'draw';
          }
        } else {
          results[pId] = 'dead';
        }
      }
    } else {
      // Majority wins! Determine what majority beats (losing weapon)
      let losingWeapon = '';
      if (majorityWeapon === 'stone') losingWeapon = 'scissors';
      else if (majorityWeapon === 'paper') losingWeapon = 'stone';
      else if (majorityWeapon === 'scissors') losingWeapon = 'paper';

      const thirdWeapon = ['stone', 'paper', 'scissors'].find(w => w !== majorityWeapon && w !== losingWeapon);

      validClashPlayers.forEach(pId => {
        if (choices[pId] === losingWeapon) {
          hpChanges[pId] = -1;
        }
      });

      for (let pId in gameState.players) {
        if (gameState.players[pId].isAlive) {
          if (choices[pId] === 'timeout') {
            results[pId] = 'timeout';
          } else if (choices[pId] === majorityWeapon) {
            results[pId] = 'win';
          } else if (choices[pId] === losingWeapon) {
            results[pId] = 'lose';
          } else {
            results[pId] = 'draw';
          }
        } else {
          results[pId] = 'dead';
        }
      }
    }
  }

  for (let pId in gameState.players) {
    gameState.players[pId].choice = null;
  }

  if (gameState.mode === 'versus') {
    broadcast({
      type: 'resolve',
      choices: choices,
      results: results,
      hpChanges: hpChanges,
      roundDraw: roundDraw
    });
  }

  resolveVersusRoundFinal(choices, results, hpChanges, roundDraw);
}

function resolveVersusRoundFinal(choices, results, hpChanges, roundDraw) {
  gameState.isLocked = true;
  battleStatusMsg.textContent = 'CHOOSING...';

  let tick = 0;
  const weapons = ['stone', 'paper', 'scissors'];
  
  const rollInterval = setInterval(() => {
    playSelectSound();

    for (let pId in gameState.players) {
      if (gameState.players[pId].isAlive) {
        const bubble = document.getElementById(`choice-bubble-${pId}`);
        if (bubble) {
          const randW = weapons[Math.floor(Math.random() * 3)];
          bubble.innerHTML = weaponSvgs[randW];
          bubble.classList.add('active');
        }
      }
    }

    tick++;
    if (tick >= 8) {
      clearInterval(rollInterval);
      
      for (let pId in gameState.players) {
        const bubble = document.getElementById(`choice-bubble-${pId}`);
        const avatar = document.getElementById(`player-avatar-3d-${pId}`);
        
        if (bubble) {
          const w = choices[pId];
          if (w === 'timeout') {
            bubble.innerHTML = '<div style="font-size:24px; line-height:56px;">⏱️</div>';
          } else if (w === 'dead') {
            bubble.style.display = 'none';
          } else {
            bubble.innerHTML = weaponSvgs[w];
          }
          bubble.classList.add('active');
        }

        if (avatar) {
          avatar.className = `avatar-blocky skin-${gameState.players[pId].skin}`;
        }
      }

      setTimeout(() => {
        executeMulticlientDamageVisuals(choices, results, hpChanges, roundDraw);
      }, 300);
    }
  }, 100);
}

function executeMulticlientDamageVisuals(choices, results, hpChanges, roundDraw) {
  if (roundDraw) {
    playDrawSound();
    battleStatusMsg.textContent = 'ROUND DRAW!';
    clashText.textContent = 'DRAW';
    clashText.className = 'clash-effect text-yellow';
    
    printLog('[SYSTEM]: Draw! No damage dealt.', 'text-white');

    const stage = document.querySelector('.battle-stage');
    const rect = stage.getBoundingClientRect();
    spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, ['#cbd5e1', '#94a3b8', '#64748b'], 25);

    setTimeout(() => {
      resetVersusRoundState();
    }, 1200);
  } else {
    const localResult = results[gameState.playerIndex];
    if (localResult === 'win') {
      playWinSound();
      battleStatusMsg.textContent = 'YOU WIN ROUND!';
      clashText.textContent = 'HIT!';
      clashText.className = 'clash-effect text-green';

      // Update score and streak
      gameState.score += 100 + (gameState.streak * 20);
      gameState.streak++;
      if (gameState.streak > gameState.maxStreak) {
        gameState.maxStreak = gameState.streak;
      }
      hudScore.textContent = gameState.score;
      hudStreak.textContent = gameState.streak;
    } else if (localResult === 'lose' || localResult === 'timeout') {
      playLoseSound();
      battleStatusMsg.textContent = 'YOU TAKE DAMAGE!';
      clashText.textContent = 'OOF!';
      clashText.className = 'clash-effect text-red';

      // Reset streak
      gameState.streak = 0;
      hudStreak.textContent = gameState.streak;
    } else {
      playDrawSound();
      battleStatusMsg.textContent = 'BATTLE RESOLVED!';
      clashText.textContent = 'CLASH';
      clashText.className = 'clash-effect text-cyan';
    }

    for (let pId in gameState.players) {
      const avatar = document.getElementById(`player-avatar-3d-${pId}`);
      const heartsContainer = document.getElementById(`player-hearts-${pId}`);
      const change = hpChanges[pId];

      if (avatar && gameState.players[pId].isAlive) {
        if (results[pId] === 'win') {
          avatar.classList.add(pId % 2 === 0 ? 'attacker-right' : 'attacker-left');
        } else if (results[pId] === 'lose' || choices[pId] === 'timeout') {
          avatar.classList.add('hit');
          const pedCoords = getElementCenter(avatar);
          spawnParticles(pedCoords.x, pedCoords.y - 30, ['#ef4444', '#b91c1c', '#dc2626'], 20);
        }
      }

      if (change < 0) {
        gameState.players[pId].hp += change;
        if (gameState.players[pId].hp < 0) gameState.players[pId].hp = 0;
        
        if (heartsContainer) {
          renderHearts(heartsContainer, gameState.players[pId].hp, 3);
        }

        const skinName = gameState.players[pId].skin.toUpperCase();
        if (choices[pId] === 'timeout') {
          printLog(`Player ${pId} (${skinName}) timed out and lost 1 Heart!`, 'text-red');
        } else {
          printLog(`Player ${pId} (${skinName}) lost 1 Heart!`, 'text-red');
        }
      }
    }

    setTimeout(() => {
      checkVersusGameStatus();
    }, 1300);
  }
}

function resetVersusRoundState() {
  gameState.localChoice = null;
  gameState.isLocked = false;
  clashText.textContent = 'VS';
  clashText.className = 'clash-effect';

  // Redraw pedestals so dead players disappear and alive ones re-center
  initMultiplayerPedestals();

  const localPlayer = gameState.players[gameState.playerIndex];
  const choicesContainer = document.querySelector('.choices-container');
  if (choicesContainer) {
    if (localPlayer && localPlayer.isAlive === false) {
      choicesContainer.style.display = 'none';
      battleStatusMsg.textContent = 'SPECTATING BATTLE...';
    } else {
      choicesContainer.style.display = '';
      battleStatusMsg.textContent = 'CHOOSE WEAPON...';
    }
  } else {
    battleStatusMsg.textContent = 'CHOOSE WEAPON...';
  }

  for (let pId in gameState.players) {
    gameState.players[pId].choice = (gameState.players[pId].connected === false) ? 'timeout' : null;
  }

  for (let pId in gameState.players) {
    const bubble = document.getElementById(`choice-bubble-${pId}`);
    if (bubble) {
      bubble.classList.remove('active');
    }
  }
}

function checkVersusGameStatus() {
  let alivePlayers = [];
  
  for (let pId in gameState.players) {
    const avatar = document.getElementById(`player-avatar-3d-${pId}`);
    
    if (gameState.players[pId].hp <= 0 && gameState.players[pId].isAlive) {
      gameState.players[pId].isAlive = false;
      if (avatar) {
        avatar.className = 'avatar-blocky dead';
      }
      printLog(`PLAYER ${pId} has been eliminated!`, 'text-red');
    }

    if (gameState.players[pId].hp <= 0) {
      if (avatar && !avatar.classList.contains('dead')) {
        avatar.className = 'avatar-blocky dead';
      }
    }

    if (gameState.players[pId].hp > 0) {
      alivePlayers.push(pId);
    }
  }

  updateRulesContent();

  setTimeout(() => {
    if (alivePlayers.length === 1) {
      endVersusGame(alivePlayers[0]);
    } else if (alivePlayers.length === 0) {
      endVersusGame(null);
    } else {
      resetVersusRoundState();
    }
  }, 800);
}

function endVersusGame(winnerIndex) {
  stopRoundTimer();
  
  sessionStorage.removeItem('voxel_player_index');
  sessionStorage.removeItem('voxel_lobby_id');
  
  // Save High Score for current mode
  let scoreKey = 'voxel_highscore_endless';
  if (gameState.mode === 'match') {
    scoreKey = 'voxel_highscore_match';
  } else if (gameState.mode === 'versus') {
    scoreKey = 'voxel_highscore_versus';
  }

  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    localStorage.setItem(scoreKey, gameState.highScore);
    printLog(`[NEW HIGH SCORE]: ${gameState.highScore} points!`, 'text-yellow');
  }

  gameState.roundsPlayed = 1; // 1 match completed
  statFinalScore.textContent = gameState.score;
  statMaxStreak.textContent = gameState.maxStreak;
  statHighScore.textContent = gameState.highScore;
  statRounds.textContent = gameState.roundsPlayed;

  for (let pId in gameState.players) {
    const bubble = document.getElementById(`choice-bubble-${pId}`);
    if (bubble) {
      bubble.classList.remove('active');
    }
    gameState.players[pId].rematchReady = false;
  }
  gameState.localRematchReady = false;

  restartBtn.removeAttribute('disabled');
  restartBtn.textContent = 'REMATCH';

  if (gameState.mode !== 'versus') {
    if (winnerIndex == 1) { // Human won
      if (gameState.mode === 'match') {
        gameState.bossIndex++;
        const clearedGauntlet = gameState.bossIndex >= BOSSES.length;
        if (clearedGauntlet) {
          gameoverTitle.textContent = "YOU BEAT THE GAME!";
          gameoverTitle.className = "pixel-title text-gold";
          gameoverSubtitle.textContent = "CONGRATULATIONS!";
          gameoverSubtitle.className = "pixel-subtitle text-white";
          playVictoryFanfare();
        } else {
          gameState.score += 500;
          gameoverTitle.textContent = "BOSS DEFEATED!";
          gameoverTitle.className = "pixel-title text-green";
          gameoverSubtitle.textContent = "NEXT STAGE LOADING...";
          playVictoryFanfare();
          switchScreen('gameover');
          setTimeout(() => {
            // Restore player HP for next stage
            gameState.playerHP = gameState.players[1].hp;
            startGame();
          }, 2500);
          return;
        }
      } else { // Endless
        gameState.score += 300;
        gameoverTitle.textContent = "SURVIVED ROUND!";
        gameoverTitle.className = "pixel-title text-green";
        gameoverSubtitle.textContent = "NEXT ROUND LOADING...";
        playVictoryFanfare();
        switchScreen('gameover');
        setTimeout(() => {
          gameState.playerHP = gameState.players[1].hp;
          startGame();
        }, 2000);
        return;
      }
    } else {
      gameoverTitle.textContent = "GAME OVER";
      gameoverTitle.className = "pixel-title text-red";
      gameoverSubtitle.textContent = "YOU WERE ELIMINATED";
      gameoverSubtitle.className = "pixel-subtitle text-white";
      playLoseSound();
      restartBtn.textContent = 'RESPAWN';
    }
  } else {
    // Multiplayer Versus Mode Endings
    if (winnerIndex == gameState.playerIndex) {
      gameoverTitle.textContent = "VICTORY!";
      gameoverTitle.className = "pixel-title text-green";
      gameoverSubtitle.textContent = "YOU SURVIVED AND WON";
      gameoverSubtitle.className = "pixel-subtitle text-yellow";
      playVictoryFanfare();
    } else if (winnerIndex === null) {
      gameoverTitle.textContent = "MUTUAL DRAW";
      gameoverTitle.className = "pixel-title text-yellow";
      gameoverSubtitle.textContent = "EVERYONE WAS ELIMINATED";
      gameoverSubtitle.className = "pixel-subtitle text-white";
      playLoseSound();
    } else {
      gameoverTitle.textContent = "DEFEAT";
      gameoverTitle.className = "pixel-title text-red";
      const winnerSkinName = (gameState.players[winnerIndex].skin || '').toUpperCase();
      gameoverSubtitle.textContent = `PLAYER ${winnerIndex} (${winnerSkinName}) WON THE MATCH`;
      gameoverSubtitle.className = "pixel-subtitle text-white";
      playLoseSound();
    }
  }

  // Handle Truth or Dare logic
  const todSection = document.getElementById('gameover-tod-section');
  const todChoiceContainer = document.getElementById('tod-choice-container');
  const todInputContainer = document.getElementById('tod-input-container');
  const todDisplayContainer = document.getElementById('tod-display-container');
  const todTextInput = document.getElementById('tod-text-input');
  const todTextDisplay = document.getElementById('tod-text-display');
  const todDisplayTitle = document.getElementById('tod-display-title');
  const todAnsInputContainer = document.getElementById('tod-answer-input-container');
  const todAnsDisplayContainer = document.getElementById('tod-answers-display-container');
  const todAnsList = document.getElementById('tod-answers-list');

  if (todSection) {
    if (gameState.mode === 'versus' && gameState.versusGameType === 'dare' && winnerIndex !== null) {
      todSection.style.display = 'block';
      if (todTextInput) todTextInput.value = '';
      if (todAnsList) todAnsList.innerHTML = '';
      if (todAnsDisplayContainer) todAnsDisplayContainer.style.display = 'none';
      if (todAnsInputContainer) todAnsInputContainer.style.display = 'none';
      
      if (winnerIndex == gameState.playerIndex) {
        gameState.todType = 'truth';
        updateTodChoiceButtonsUI();
        updateTodInputLabelUI();
        if (todChoiceContainer) todChoiceContainer.style.display = 'block';
        if (todInputContainer) todInputContainer.style.display = 'block';
        if (todDisplayContainer) todDisplayContainer.style.display = 'none';
      } else {
        if (todChoiceContainer) todChoiceContainer.style.display = 'none';
        if (todInputContainer) todInputContainer.style.display = 'none';
        if (todDisplayContainer) {
          todDisplayContainer.style.display = 'block';
          if (todDisplayTitle) todDisplayTitle.textContent = "STATUS:";
          if (todTextDisplay) todTextDisplay.textContent = 'Waiting for the winner to choose Truth or Dare...';
        }
      }
    } else {
      todSection.style.display = 'none';
    }
  }

  switchScreen('gameover');
}

function updateTodChoiceButtonsUI() {
  const btnTruth = document.getElementById('btn-choose-truth');
  const btnDare = document.getElementById('btn-choose-dare');
  if (!btnTruth || !btnDare) return;

  btnTruth.classList.remove('active');
  btnDare.classList.remove('active');

  if (gameState.todType === 'truth') {
    btnTruth.classList.add('active');
  } else {
    btnDare.classList.add('active');
  }
}

function updateTodInputLabelUI() {
  const label = document.getElementById('tod-input-label');
  const input = document.getElementById('tod-text-input');
  if (!label || !input) return;

  if (gameState.todType === 'truth') {
    label.textContent = "WRITE A TRUTH QUESTION FOR THE LOSERS!";
    input.placeholder = "Type question (e.g. What is your biggest secret?)...";
  } else {
    label.textContent = "WRITE A DARE FOR THE LOSERS!";
    input.placeholder = "Type dare (e.g. Sing a song!)...";
  }
}

function submitWinnerTod() {
  const input = document.getElementById('tod-text-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  gameState.todQuestion = text;

  const choiceContainer = document.getElementById('tod-choice-container');
  const inputContainer = document.getElementById('tod-input-container');
  const displayContainer = document.getElementById('tod-display-container');
  const displayTitle = document.getElementById('tod-display-title');
  const textDisplay = document.getElementById('tod-text-display');
  const ansDisplayContainer = document.getElementById('tod-answers-display-container');

  if (choiceContainer) choiceContainer.style.display = 'none';
  if (inputContainer) inputContainer.style.display = 'none';
  if (displayContainer) displayContainer.style.display = 'block';

  if (displayTitle) {
    displayTitle.textContent = gameState.todType === 'truth' ? "THE WINNER'S TRUTH QUESTION:" : "THE WINNER'S DARE:";
  }
  if (textDisplay) textDisplay.textContent = text;
  
  if (ansDisplayContainer) {
    ansDisplayContainer.style.display = gameState.todType === 'truth' ? 'block' : 'none';
  }

  sendPeerMessage({
    type: 'tod_question',
    qType: gameState.todType,
    text: text,
    winnerIndex: gameState.playerIndex
  });

  printLog(`[MULTIPLAYER]: You submitted ${gameState.todType.toUpperCase()}: "${text}"`, 'text-green');
}

function submitLoserAnswer() {
  const input = document.getElementById('tod-answer-input');
  if (!input) return;
  const answer = input.value.trim();
  if (!answer) return;

  const ansInputContainer = document.getElementById('tod-answer-input-container');
  if (ansInputContainer) ansInputContainer.style.display = 'none';

  const answersList = document.getElementById('tod-answers-list');
  const answersDisplay = document.getElementById('tod-answers-display-container');
  
  if (answersList) {
    const div = document.createElement('div');
    div.style.marginBottom = '4px';
    div.innerHTML = `<span class="text-cyan">YOU:</span> <span class="text-white">${answer}</span>`;
    answersList.appendChild(div);
    answersList.scrollTop = answersList.scrollHeight;
  }
  if (answersDisplay) {
    answersDisplay.style.display = 'block';
  }

  sendPeerMessage({
    type: 'tod_answer',
    answerText: answer
  });

  printLog(`[MULTIPLAYER]: You answered: "${answer}"`, 'text-green');
}

// Register Multiplayer DOM Action Handlers
document.getElementById('btn-create-lobby').addEventListener('click', () => {
  playClickSound();
  initPeer();
});

document.getElementById('btn-type-normal').addEventListener('click', () => {
  if (gameState.peer && !gameState.isHost) return; // Client can't click
  playClickSound();
  gameState.versusGameType = 'normal';
  updateLobbyGameTypeUI();
  if (gameState.isHost) {
    broadcast({ type: 'game_type_update', gameType: 'normal' });
    printLog('[MULTIPLAYER]: Game type updated to NORMAL', 'text-yellow');
  }
});

document.getElementById('btn-type-dare').addEventListener('click', () => {
  if (gameState.peer && !gameState.isHost) return; // Client can't click
  playClickSound();
  gameState.versusGameType = 'dare';
  updateLobbyGameTypeUI();
  if (gameState.isHost) {
    broadcast({ type: 'game_type_update', gameType: 'dare' });
    printLog('[MULTIPLAYER]: Game type updated to WITH DARE', 'text-yellow');
  }
});

const btnChooseTruth = document.getElementById('btn-choose-truth');
const btnChooseDare = document.getElementById('btn-choose-dare');
const btnSubmitTod = document.getElementById('btn-submit-tod');
const todTextInput = document.getElementById('tod-text-input');
const btnSubmitTodAnswer = document.getElementById('btn-submit-tod-answer');
const todAnswerInput = document.getElementById('tod-answer-input');

if (btnChooseTruth) {
  btnChooseTruth.addEventListener('click', () => {
    playClickSound();
    gameState.todType = 'truth';
    updateTodChoiceButtonsUI();
    updateTodInputLabelUI();
  });
}
if (btnChooseDare) {
  btnChooseDare.addEventListener('click', () => {
    playClickSound();
    gameState.todType = 'dare';
    updateTodChoiceButtonsUI();
    updateTodInputLabelUI();
  });
}
if (btnSubmitTod && todTextInput) {
  btnSubmitTod.addEventListener('click', () => {
    playClickSound();
    submitWinnerTod();
  });
  todTextInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      playClickSound();
      submitWinnerTod();
    }
  });
}
if (btnSubmitTodAnswer && todAnswerInput) {
  btnSubmitTodAnswer.addEventListener('click', () => {
    playClickSound();
    submitLoserAnswer();
  });
  todAnswerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      playClickSound();
      submitLoserAnswer();
    }
  });
}

const btnReconnectLobby = document.getElementById('btn-reconnect-lobby');
if (btnReconnectLobby) {
  btnReconnectLobby.addEventListener('click', () => {
    playClickSound();
    const savedLobbyId = sessionStorage.getItem('voxel_lobby_id');
    const savedPlayerIndex = sessionStorage.getItem('voxel_player_index');
    if (savedLobbyId) {
      btnReconnectLobby.textContent = 'RECONNECTING...';
      btnReconnectLobby.setAttribute('disabled', 'true');
      if (savedPlayerIndex === '1') {
        initPeer(savedLobbyId);
      } else {
        joinLobby(savedLobbyId);
      }
    }
  });
}

document.getElementById('btn-join-lobby').addEventListener('click', () => {
  playClickSound();
  const codeInput = document.getElementById('lobby-code-input');
  const code = codeInput.value.trim();
  if (code) {
    joinLobby(code);
  } else {
    printLog('[SYSTEM]: Please enter a valid lobby code.', 'text-red');
  }
});

document.getElementById('btn-copy-link').addEventListener('click', () => {
  const input = document.getElementById('invite-link-input');
  input.select();
  input.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(input.value).then(() => {
    printLog('[SYSTEM]: Invite link copied to clipboard!', 'text-yellow');
    const btn = document.getElementById('btn-copy-link');
    const origText = btn.textContent;
    btn.textContent = 'COPIED!';
    playSelectSound();
    setTimeout(() => {
      btn.textContent = origText;
    }, 1500);
  }).catch(err => {
    console.error('Failed to copy', err);
  });
});


/* ==========================================================================
   ROUND TIMER SYSTEM (3-SECOND COUNTDOWN)
   ========================================================================== */

let timerInterval = null;

function startRoundTimer() {
  clearInterval(timerInterval);
  
  if (gameState.screen !== 'battle') return;

  // Skip timer if disabled
  if (!gameState.timerEnabled) {
    const timerEl = document.getElementById('round-timer');
    if (timerEl) {
      timerEl.style.display = 'none';
      timerEl.classList.remove('warning');
    }
    return;
  }

  const timerEl = document.getElementById('round-timer');
  if (!timerEl) return;
  
  gameState.timeLeft = 3;
  timerEl.textContent = `TIME: ${gameState.timeLeft}`;
  timerEl.style.display = 'block';
  timerEl.classList.remove('warning');
  
  timerInterval = setInterval(() => {
    gameState.timeLeft--;
    
    if (gameState.timeLeft > 0) {
      timerEl.textContent = `TIME: ${gameState.timeLeft}`;
      if (gameState.timeLeft <= 1) {
        timerEl.classList.add('warning');
      }
      playTickSound();
    } else {
      clearInterval(timerInterval);
      timerEl.style.display = 'none';
      timerEl.classList.remove('warning');
      handleRoundTimeout();
    }
  }, 1000);
}

function stopRoundTimer() {
  clearInterval(timerInterval);
  const timerEl = document.getElementById('round-timer');
  if (timerEl) {
    timerEl.style.display = 'none';
    timerEl.classList.remove('warning');
  }
}

function handleRoundTimeout() {
  if (gameState.isLocked) return;
  
  printLog("[SYSTEM]: Time's up! Failed to select weapon in time.", 'text-red');
  executeRound('timeout');
}

/* ==========================================================================
   BATTLE CONSOLE CHAT ENGINE & TABS
   ========================================================================== */

const BOSS_CHAT_RESPONSES = {
  HEROBRINE: [
    "I watch you from the shadows.",
    "Your weapons are useless against my magic.",
    "Do you feel the chill? I am near.",
    "Steve cannot save you here.",
    "OOF!",
    "Choose stone, see if I care.",
    "I will claim your last heart!"
  ],
  "ROBLOX KING": [
    "Builderman will hear of this!",
    "Noob power!",
    "It's free country, but my scissors cut everything.",
    "Oof! Oof! Oof!",
    "I have infinite Robux, you cannot defeat me.",
    "Nice skin, did you get it for 0 robux?"
  ],
  "REDSTONE GOLEM": [
    "CLANG! I AM OF METAL.",
    "REDSTONE POWER ACTIVE.",
    "CRUSH YOU WITH MY STONE HANDS.",
    "WARNING: SYSTEM HEATING.",
    "BEEP BOOP DANGER."
  ],
  "ENDER LORD": [
    "Teleporting behind you...",
    "Do not look into my eyes.",
    "The End is near for you.",
    "Endermites, attack!",
    "Sssssilence, mortal."
  ],
  "WITHER CHIEF": [
    "I wither your hope.",
    "Three heads are better than one.",
    "Prepare to decay!",
    "Wither skulls incoming!",
    "I will consume this voxel world."
  ],
  DEFAULT: [
    "I will crush you!",
    "Prepare for defeat!",
    "Nice move, but I am better.",
    "A voxel showdown is mine!",
    "OOF!",
    "Retro victory awaits me!"
  ]
};

function printChatLog(sender, text, colorClass = 'text-white') {
  const chatOutput = document.getElementById('chat-output');
  if (!chatOutput) return;
  
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const line = document.createElement('div');
  line.className = `console-line ${colorClass}`;
  line.textContent = `[${time}] <${sender}>: ${text}`;
  chatOutput.appendChild(line);
  chatOutput.scrollTop = chatOutput.scrollHeight;
}

function sendChatMessage() {
  const input = document.getElementById('console-chat-input');
  if (!input) return;
  const msg = input.value.trim();
  if (!msg) return;
  
  // Clear input
  input.value = '';
  
  // Render locally in the CHAT log
  printChatLog('YOU', msg, 'text-cyan');
  
  // Send to peer if online versus mode
  if (gameState.mode === 'versus') {
    if (gameState.isHost || (gameState.conn && gameState.conn.open)) {
      sendPeerMessage({ type: 'chat', message: msg, senderIndex: gameState.playerIndex });
    }
  } else {
    // Singleplayer mode: trigger funny AI chatbot reply!
    triggerAIChatBotReply(msg);
  }
}

function triggerAIChatBotReply(userMsg) {
  let bossName = "HEROBRINE";
  if (gameState.mode === 'match') {
    bossName = BOSSES[gameState.bossIndex].name;
  } else if (hudEnemyName && hudEnemyName.textContent) {
    bossName = hudEnemyName.textContent.toUpperCase();
  }
  
  const responses = BOSS_CHAT_RESPONSES[bossName] || BOSS_CHAT_RESPONSES.DEFAULT;
  const reply = responses[Math.floor(Math.random() * responses.length)];
  
  setTimeout(() => {
    printChatLog(bossName, reply, 'text-red');
    playClickSound();
  }, 800);
}

// Bind console tab toggles
const tabBtnLog = document.getElementById('tab-btn-log');
const tabBtnChat = document.getElementById('tab-btn-chat');
const consoleOutputWin = document.getElementById('console-output');
const chatOutputWin = document.getElementById('chat-output');
const chatInputRow = document.getElementById('console-chat-input-row');

if (tabBtnLog && tabBtnChat && consoleOutputWin && chatOutputWin && chatInputRow) {
  tabBtnLog.addEventListener('click', () => {
    playClickSound();
    tabBtnLog.classList.add('active');
    tabBtnChat.classList.remove('active');
    consoleOutputWin.style.display = 'block';
    chatOutputWin.style.display = 'none';
    chatInputRow.style.display = 'none';
  });

  tabBtnChat.addEventListener('click', () => {
    playClickSound();
    tabBtnChat.classList.add('active');
    tabBtnLog.classList.remove('active');
    
    // Clear notifications dot
    tabBtnChat.style.borderColor = '';
    tabBtnChat.textContent = 'CHAT';

    consoleOutputWin.style.display = 'none';
    chatOutputWin.style.display = 'block';
    chatInputRow.style.display = 'flex';
  });
}

// Bind Send Button and Enter Key
const chatInput = document.getElementById('console-chat-input');
const chatSend = document.getElementById('console-chat-send');

if (chatInput && chatSend) {
  chatSend.addEventListener('click', () => {
    playClickSound();
    sendChatMessage();
  });

  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  });
}

function setupConsoleForMode() {
  const tabsContainer = document.querySelector('.console-tabs');
  const chatInputRow = document.getElementById('console-chat-input-row');
  const consoleOutputWin = document.getElementById('console-output');
  const chatOutputWin = document.getElementById('chat-output');
  const tabBtnLog = document.getElementById('tab-btn-log');
  const tabBtnChat = document.getElementById('tab-btn-chat');

  if (gameState.mode === 'versus') {
    // Show tabs
    if (tabsContainer) tabsContainer.style.display = 'flex';
    // Reset to LOG tab as default when entering battle
    if (tabBtnLog) tabBtnLog.classList.add('active');
    if (tabBtnChat) {
      tabBtnChat.classList.remove('active');
      tabBtnChat.style.borderColor = '';
      tabBtnChat.textContent = 'CHAT';
    }
    if (consoleOutputWin) consoleOutputWin.style.display = 'block';
    if (chatOutputWin) chatOutputWin.style.display = 'none';
    if (chatInputRow) chatInputRow.style.display = 'none';
  } else {
    // Hide tabs and chat elements
    if (tabsContainer) tabsContainer.style.display = 'none';
    if (chatInputRow) chatInputRow.style.display = 'none';
    if (consoleOutputWin) consoleOutputWin.style.display = 'block';
    if (chatOutputWin) chatOutputWin.style.display = 'none';
  }
}

// Timer Toggle Button Event Handler
const timerToggleBtn = document.getElementById('timer-toggle-btn');
if (timerToggleBtn) {
  // Initialize timer button visual state
  if (!gameState.timerEnabled) {
    timerToggleBtn.classList.add('disabled');
    timerToggleBtn.title = 'Timer: OFF';
  } else {
    timerToggleBtn.classList.remove('disabled');
    timerToggleBtn.title = 'Timer: ON';
  }

  timerToggleBtn.addEventListener('click', () => {
    gameState.timerEnabled = !gameState.timerEnabled;
    localStorage.setItem('voxel_timer_enabled', gameState.timerEnabled);
    playClickSound();

    if (!gameState.timerEnabled) {
      timerToggleBtn.classList.add('disabled');
      timerToggleBtn.title = 'Timer: OFF';
      printLog('[SYSTEM]: Countdown timer disabled.', 'text-yellow');
      stopRoundTimer();
    } else {
      timerToggleBtn.classList.remove('disabled');
      timerToggleBtn.title = 'Timer: ON';
      printLog('[SYSTEM]: Countdown timer enabled.', 'text-yellow');
      if (gameState.screen === 'battle' && !gameState.isLocked) {
        startRoundTimer();
      }
    }
  });
}

// Rules Button Event Handler
if (rulesBtn && rulesDropdown) {
  rulesBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = rulesDropdown.style.display === 'block';
    rulesDropdown.style.display = isVisible ? 'none' : 'block';
    gameState.rulesOpenedManually = !isVisible;
    
    // Clear pulsing animation once manually clicked/opened
    if (!isVisible) {
      rulesBtn.classList.remove('rules-pulse-highlight');
      rulesDropdown.classList.remove('rules-pulse-highlight');
    }
    playClickSound();
  });

  if (rulesCloseBtn) {
    rulesCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      rulesDropdown.style.display = 'none';
      gameState.rulesOpenedManually = false;
      playClickSound();
    });
  }

  document.addEventListener('click', () => {
    rulesDropdown.style.display = 'none';
  });
  
  rulesDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

let autoCloseRulesTimeout = null;

function updateRulesContent() {
  const rulesContent = document.getElementById('rules-content');
  if (!rulesContent) return;

  let currentRulesLabel = '';
  let activeRulesHtml = '';

  if (gameState.screen === 'battle' && gameState.mode === 'versus') {
    let aliveCount = 0;
    for (let pId in gameState.players) {
      if (gameState.players[pId].hp > 0) {
        aliveCount++;
      }
    }

    if (aliveCount === 4) {
      currentRulesLabel = '4-PLAYER';
      activeRulesHtml = `
        <span class="text-cyan" style="font-weight:bold;">[4-PLAYER MATCH]</span><br>
        • 4 players active.<br>
        • Choose Stone/Paper/Scissors.<br>
        • If 3 weapons ➡️ Most-picked wins (Ties=Draw).<br>
        • All same weapon ➡️ Draw.<br>
        • If 2 weapons ➡️ Winner hits losers.<br>
        • Timeouts deal 1 HP loss.
      `;
    } else if (aliveCount === 3) {
      currentRulesLabel = '3-PLAYER';
      activeRulesHtml = `
        <span class="text-cyan" style="font-weight:bold;">[3-PLAYER MATCH]</span><br>
        • 3 players active (1 down!).<br>
        • Choose Stone/Paper/Scissors.<br>
        • If 3 weapons ➡️ Most-picked wins (Ties=Draw).<br>
        • All same weapon ➡️ Draw.<br>
        • If 2 weapons ➡️ Winner hits losers.<br>
        • Timeouts deal 1 HP loss.
      `;
    } else if (aliveCount === 2) {
      currentRulesLabel = '2-PLAYER';
      activeRulesHtml = `
        <span class="text-cyan" style="font-weight:bold;">[2-PLAYER DUEL]</span><br>
        • 2 players active (2 down!).<br>
        • Classic 1v1 rules.<br>
        • Winner deals 1 damage.<br>
        • Timeouts deal 1 HP loss.
      `;
    } else {
      currentRulesLabel = 'RESOLVED';
      activeRulesHtml = `
        <span class="text-green" style="font-weight:bold;">[MATCH RESOLVED]</span><br>
        Match finished.
      `;
    }
  } else if (gameState.mode === 'match') {
    currentRulesLabel = 'MATCH';
    activeRulesHtml = `
      <span class="text-yellow" style="font-weight:bold;">[MATCH PLAY]</span><br>
      • Defeat the boss to win.<br>
      • Single boss fight per run.<br>
      • Game ends win/lose.<br>
      • Progresses to next stage.
    `;
  } else if (gameState.mode === 'endless') {
    currentRulesLabel = 'ENDLESS';
    activeRulesHtml = `
      <span class="text-green" style="font-weight:bold;">[ENDLESS SURVIVAL]</span><br>
      • Fight endless random bosses.<br>
      • Lose 3 hearts ➡️ Game Over.<br>
      • Accumulate score & streaks.<br>
      • Timer can be toggled off.
    `;
  } else {
    currentRulesLabel = 'NONE';
    activeRulesHtml = `Select a game mode.`;
  }

  // Update dropdown content
  rulesContent.innerHTML = activeRulesHtml;

  // Update dynamic button text (concise format next to the timer option)
  if (rulesBtnText) {
    let displayLabel = 'RULES';
    if (currentRulesLabel === '4-PLAYER') displayLabel = 'RULES [4P]';
    else if (currentRulesLabel === '3-PLAYER') displayLabel = 'RULES [3P]';
    else if (currentRulesLabel === '2-PLAYER') displayLabel = 'RULES [DUEL]';
    else if (currentRulesLabel === 'RESOLVED') displayLabel = 'RULES [DONE]';
    else if (currentRulesLabel === 'ENDLESS') displayLabel = 'RULES [ENDLESS]';
    else if (currentRulesLabel === 'MATCH') displayLabel = 'RULES [MATCH]';
    
    rulesBtnText.textContent = displayLabel;
  }

  // Trigger pulse highlight and auto-reveal only if rules actually changed
  if (gameState.lastRulesState && gameState.lastRulesState !== currentRulesLabel) {
    // Apply retro pulse animation to rules button and panel
    if (rulesBtn) {
      rulesBtn.classList.remove('rules-pulse-highlight');
      void rulesBtn.offsetWidth; // Force reflow to restart animation
      rulesBtn.classList.add('rules-pulse-highlight');
    }
    if (rulesDropdown) {
      rulesDropdown.classList.remove('rules-pulse-highlight');
      void rulesDropdown.offsetWidth; // Force reflow
      rulesDropdown.classList.add('rules-pulse-highlight');
      
      // Auto-reveal rules dropdown in battle screen
      if (gameState.screen === 'battle') {
        rulesDropdown.style.display = 'block';
      }
    }

    // Print notice in battle logs
    let consoleMsg = `[SYSTEM]: Active rules shifted to ${currentRulesLabel} rules.`;
    if (currentRulesLabel === '2-PLAYER') consoleMsg = `[SYSTEM]: Active rules shifted to 2-Player DUEL.`;
    printLog(consoleMsg, 'text-yellow');

    // Auto-close after 4 seconds (unless user opened manually)
    if (autoCloseRulesTimeout) {
      clearTimeout(autoCloseRulesTimeout);
    }
    autoCloseRulesTimeout = setTimeout(() => {
      if (rulesDropdown && !gameState.rulesOpenedManually) {
        rulesDropdown.style.display = 'none';
      }
      if (rulesBtn) rulesBtn.classList.remove('rules-pulse-highlight');
      if (rulesDropdown) rulesDropdown.classList.remove('rules-pulse-highlight');
    }, 4000);
  }

  // Track state
  gameState.lastRulesState = currentRulesLabel;
}

// Initial update on load
updateRulesContent();

// Auto-join if '?join=XXX' query param is present on load (handles cached/fast loading states)
function handleAutoJoin() {
  startNetworkHeartbeat();
  const urlParams = new URLSearchParams(window.location.search);
  const joinId = urlParams.get('join');
  if (joinId) {
    // Select versus mode automatically
    selectVersusMode();
    // Connect to peer ID
    joinLobby(joinId);
  }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  handleAutoJoin();
} else {
  window.addEventListener('load', handleAutoJoin);
}





