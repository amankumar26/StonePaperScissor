


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
  highScore: parseInt(localStorage.getItem('voxel_highscore') || '0', 10),
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
  conn: null,
  isHost: false,
  peerId: null,
  opponentSkin: 'steve',
  opponentChoice: null,
  localChoice: null,
  opponentConnected: false,
  localRematchReady: false,
  opponentRematchReady: false
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
});

modeVersus.addEventListener('click', () => {
  selectVersusMode();
  playClickSound();
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
  startGame();
});

// Restart buttons
restartBtn.addEventListener('click', () => {
  playClickSound();
  if (gameState.mode === 'versus') {
    if (gameState.localRematchReady) return;
    gameState.localRematchReady = true;
    restartBtn.setAttribute('disabled', 'true');
    restartBtn.textContent = 'WAITING FOR FRIEND...';
    sendPeerMessage({ type: 'rematch' });
    
    if (gameState.opponentRematchReady) {
      restartBtn.removeAttribute('disabled');
      restartBtn.textContent = 'REMATCH';
      startVersusBattle();
    }
  } else {
    restartBtn.textContent = 'RESPAWN';
    startGame();
  }
});

menuBtn.addEventListener('click', () => {
  playClickSound();
  stopRoundTimer();
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

  if (gameState.mode === 'versus') {
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

  if (gameState.mode === 'versus') {
    gameState.isLocked = true;
    gameState.localChoice = playerWeapon;
    battleStatusMsg.textContent = 'LOCKED! WAITING FOR FRIEND...';
    printLog('[MULTIPLAYER]: Move locked. Waiting for opponent...', 'text-yellow');
    
    sendPeerMessage({ type: 'choice', choice: playerWeapon });

    if (gameState.opponentChoice) {
      stopRoundTimer();
      resolveVersusRound();
    } else {
      startRoundTimer();
    }
    return;
  }

  gameState.isLocked = true;
  gameState.roundsPlayed++;

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
  // Save High Score
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    localStorage.setItem('voxel_highscore', gameState.highScore);
    printLog(`[NEW HIGH SCORE]: ${gameState.highScore} points!`, 'text-yellow');
  }

  // Setup Game Over screen stats
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
  modeDesc.textContent = "Play with a friend online! Secretly choose weapons and battle in real-time.";
  
  // Show multiplayer panel
  document.getElementById('multiplayer-panel').style.display = 'block';
  
  // Update play button state
  if (gameState.opponentConnected) {
    if (gameState.isHost) {
      playBtn.removeAttribute('disabled');
      playBtn.textContent = 'START BATTLE';
    } else {
      playBtn.setAttribute('disabled', 'true');
      playBtn.textContent = 'WAITING FOR HOST...';
    }
  } else {
    playBtn.setAttribute('disabled', 'true');
    playBtn.textContent = 'CONNECT A FRIEND TO BATTLE';
  }
}

function initPeer() {
  if (gameState.peer) return;

  updateLobbyStatus('CONNECTING...', 'yellow');

  try {
    gameState.peer = new Peer(null, {
      debug: 1
    });

    gameState.peer.on('open', (id) => {
      gameState.peerId = id;
      console.log('PeerJS initialized with ID:', id);
      updateLobbyStatus('WAITING FOR FRIEND...', 'yellow');
      
      // Generate and display invite link
      const inviteLink = window.location.origin + window.location.pathname + '?join=' + id;
      document.getElementById('invite-link-input').value = inviteLink;
      document.getElementById('invite-link-container').style.display = 'block';
      
      // Auto fill Lobby Code input for helper
      document.getElementById('lobby-code-input').placeholder = id;
      printLog('[MULTIPLAYER]: Lobby created! Share the invite link with a friend.', 'text-yellow');
    });

    gameState.peer.on('connection', (conn) => {
      if (gameState.conn) {
        // Reject extra connections
        conn.close();
        return;
      }
      gameState.isHost = true;
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
  
  updateLobbyStatus('CONNECTING TO SIGNALING...', 'yellow');
  
  try {
    if (!gameState.peer) {
      gameState.peer = new Peer(null, { debug: 1 });
      gameState.peer.on('open', () => {
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
  gameState.conn = conn;
  
  conn.on('open', () => {
    console.log('Connected to peer successfully!');
    gameState.opponentConnected = true;
    updateLobbyStatus('CONNECTED!', 'green');
    playClickSound();

    if (gameState.isHost) {
      playBtn.removeAttribute('disabled');
      playBtn.textContent = 'START BATTLE';
      printLog('[MULTIPLAYER]: Friend joined! Ready to fight.', 'text-green');
      // Send host skin to guest
      sendPeerMessage({ type: 'skin', skin: gameState.skin });
    } else {
      playBtn.setAttribute('disabled', 'true');
      playBtn.textContent = 'WAITING FOR HOST...';
      printLog('[MULTIPLAYER]: Connected to host lobby! Waiting for host to start.', 'text-green');
      // Send guest skin to host
      sendPeerMessage({ type: 'skin', skin: gameState.skin });
    }
  });

  conn.on('data', (data) => {
    handlePeerMessage(data);
  });

  conn.on('close', () => {
    printLog('[MULTIPLAYER]: Opponent disconnected.', 'text-red');
    handlePeerDisconnect();
  });

  conn.on('error', (err) => {
    console.error('Connection channel error:', err);
    handlePeerDisconnect();
  });
}

function sendPeerMessage(msg) {
  if (gameState.conn && gameState.conn.open) {
    gameState.conn.send(msg);
  }
}

function handlePeerMessage(data) {
  switch (data.type) {
    case 'skin':
      gameState.opponentSkin = data.skin;
      printLog(`[MULTIPLAYER]: Opponent chose skin: ${data.skin.toUpperCase()}`, 'text-cyan');
      if (gameState.screen === 'battle') {
        const currentOpponentClass = SKINS[gameState.opponentSkin].skinClass;
        renderFullBody(currentOpponentClass, enemyAvatar3D);
        document.querySelector('.hud-avatar.enemy').innerHTML = SKINS[gameState.opponentSkin].headSvg;
        hudEnemyName.textContent = "OPPONENT (" + gameState.opponentSkin.toUpperCase() + ")";
      }
      break;

    case 'start':
      startVersusBattle();
      break;

    case 'choice':
      gameState.opponentChoice = data.choice;
      printLog('[MULTIPLAYER]: Opponent locked their move!', 'text-cyan');
      if (gameState.localChoice) {
        stopRoundTimer();
        resolveVersusRound();
      } else {
        startRoundTimer();
      }
      break;

    case 'rematch':
      printLog('[MULTIPLAYER]: Opponent is ready for a rematch!', 'text-yellow');
      gameState.opponentRematchReady = true;
      if (gameState.localRematchReady) {
        startVersusBattle();
      }
      break;

    case 'chat':
      const oppName = (gameState.opponentSkin || 'steve').toUpperCase();
      printChatLog(oppName, data.message, 'text-yellow');
      playClickSound();
      const chatTab = document.getElementById('tab-btn-chat');
      if (chatTab && !chatTab.classList.contains('active')) {
        chatTab.style.borderColor = 'var(--color-red)';
        chatTab.textContent = 'CHAT 🔴';
      }
      break;
  }
}

function handlePeerDisconnect() {
  gameState.opponentConnected = false;
  gameState.conn = null;
  
  if (gameState.screen === 'battle') {
    printLog('[SYSTEM]: Opponent disconnected. Ending match...', 'text-red');
    battleStatusMsg.textContent = 'FRIEND DISCONNECTED';
    clashText.textContent = 'LOST';
    clashText.className = 'clash-effect text-red';
    gameState.isLocked = true;
    
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

function startVersusBattle() {
  gameState.score = 0;
  gameState.streak = 0;
  gameState.maxStreak = 0;
  gameState.roundsPlayed = 0;
  gameState.playerHP = 3;
  gameState.enemyHP = 3;
  gameState.isLocked = false;
  gameState.localChoice = null;
  gameState.opponentChoice = null;
  gameState.localRematchReady = false;
  gameState.opponentRematchReady = false;

  restartBtn.removeAttribute('disabled');
  restartBtn.textContent = 'REMATCH';

  if (gameState.isHost) {
    sendPeerMessage({ type: 'start' });
  }

  // Set up player skin SVG in HUD
  const activeSkinCard = document.querySelector('.skin-card.active');
  hudPlayerAvatar.innerHTML = activeSkinCard.querySelector('.skin-avatar').innerHTML;
  hudPlayerName.textContent = "YOU (" + gameState.skin.toUpperCase() + ")";

  // Set up opponent skin SVG in HUD
  const oppSkin = gameState.opponentSkin || 'steve';
  document.querySelector('.hud-avatar.enemy').innerHTML = SKINS[oppSkin].headSvg;
  hudEnemyName.textContent = "OPPONENT (" + oppSkin.toUpperCase() + ")";

  // Render blocky avatars on pedestals
  renderFullBody(gameState.skin, playerAvatar3D);
  renderFullBody(SKINS[oppSkin].skinClass, enemyAvatar3D);

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
  battleStatusMsg.textContent = 'CHOOSE WEAPON...';

  consoleOutput.innerHTML = `
    <div class="console-line text-yellow">[SYSTEM]: Online Versus match started!</div>
    <div class="console-line text-white">[SYSTEM]: You face ${hudEnemyName.textContent}! Select your weapon.</div>
  `;
  scrollConsole();

  setupConsoleForMode();
  switchScreen('battle');
  playVictoryFanfare();
}

function resolveVersusRound() {
  gameState.roundsPlayed++;
  
  // Clear displays
  playerChoiceDisplay.classList.remove('active');
  enemyChoiceDisplay.classList.remove('active');
  battleStatusMsg.textContent = 'CHOOSING...';

  const playerWeapon = gameState.localChoice;
  const enemyWeapon = gameState.opponentChoice;

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
      resolveVersusRoundFinal(playerWeapon, enemyWeapon);
    }
  }, 100);
}

function resolveVersusRoundFinal(playerWeapon, enemyWeapon) {
  // Update visualizer displays
  if (playerWeapon === 'timeout') {
    playerChoiceDisplay.innerHTML = '<div style="font-size:32px; line-height:72px;">⏱️</div>';
  } else {
    playerChoiceDisplay.innerHTML = weaponSvgs[playerWeapon];
  }
  
  if (enemyWeapon === 'timeout') {
    enemyChoiceDisplay.innerHTML = '<div style="font-size:32px; line-height:72px;">⏱️</div>';
  } else {
    enemyChoiceDisplay.innerHTML = weaponSvgs[enemyWeapon];
  }

  // Calculate result
  let result = 'draw'; // draw, win, lose

  if (playerWeapon === 'timeout' && enemyWeapon === 'timeout') {
    result = 'draw';
  } else if (playerWeapon === 'timeout') {
    result = 'lose';
  } else if (enemyWeapon === 'timeout') {
    result = 'win';
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

  const playerCenter = getElementCenter(playerChoiceDisplay);
  const enemyCenter = getElementCenter(enemyChoiceDisplay);
  const clashCenter = {
    x: (playerCenter.x + enemyCenter.x) / 2,
    y: (playerCenter.y + enemyCenter.y) / 2
  };

  const colorMap = {
    stone: ['#9c9c9c', '#787878', '#545454', '#ef4444'],
    paper: ['#22c55e', '#4ade80', '#15803d', '#ffffff'],
    scissors: ['#22d3ee', '#0891b2', '#d1d5db', '#ffffff']
  };
  const pPalette = colorMap[playerWeapon] || ['#ef4444', '#b91c1c', '#dc2626', '#4b5563'];
  const ePalette = colorMap[enemyWeapon] || ['#ef4444', '#b91c1c', '#dc2626', '#4b5563'];
  const clashPalette = [...pPalette, ...ePalette];

  // Clear previous animation classes
  playerAvatar3D.className = `avatar-blocky skin-${gameState.skin}`;
  const oppSkin = gameState.opponentSkin || 'steve';
  enemyAvatar3D.className = `avatar-blocky skin-${oppSkin}`;

  // Force reflow
  void playerAvatar3D.offsetWidth;
  void enemyAvatar3D.offsetWidth;

  if (result === 'draw') {
    playDrawSound();
    battleStatusMsg.textContent = 'ROUND DRAW!';
    clashText.textContent = 'DRAW';
    clashText.className = 'clash-effect text-yellow';

    if (playerWeapon === 'timeout' && enemyWeapon === 'timeout') {
      printLog(`Both players timed out! Round is a Draw.`, 'text-white');
    } else {
      printLog(`You chose ${playerWeapon.toUpperCase()}. Opponent chose ${enemyWeapon.toUpperCase()}. Round is a Draw.`, 'text-white');
    }

    spawnParticles(clashCenter.x, clashCenter.y, ['#e2e8f0', '#94a3b8', '#64748b', '#cbd5e1'], 15);

    setTimeout(() => {
      resetVersusRoundState();
    }, 1200);

  } else if (result === 'win') {
    playWinSound();
    battleStatusMsg.textContent = 'YOU DEALT DAMAGE!';
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

    playerAvatar3D.classList.add('attacker-left');
    enemyAvatar3D.classList.add('hit');

    // Opponent loses Heart
    gameState.enemyHP--;
    renderHearts(enemyHeartsContainer, gameState.enemyHP, gameState.maxHP);

    if (enemyWeapon === 'timeout') {
      printLog(`Opponent timed out! You deal damage.`, 'text-green');
    } else {
      printLog(`You chose ${playerWeapon.toUpperCase()}. Opponent chose ${enemyWeapon.toUpperCase()}. Opponent takes damage!`, 'text-green');
    }

    setTimeout(() => {
      spawnParticles(clashCenter.x, clashCenter.y, clashPalette, 25);
      const enemyPedCoords = getElementCenter(enemyFighter);
      spawnParticles(enemyPedCoords.x, enemyPedCoords.y - 40, ['#ef4444', '#b91c1c', '#dc2626', '#f87171'], 30);
    }, 150);

    setTimeout(() => {
      checkVersusGameStatus();
    }, 1300);

  } else {
    playLoseSound();
    battleStatusMsg.textContent = 'OPPONENT DEALT DAMAGE!';
    clashText.textContent = 'OOF!';
    clashText.className = 'clash-effect text-red';

    // Adjust State
    gameState.streak = 0;
    hudStreak.textContent = '0';

    enemyAvatar3D.classList.add('attacker-right');
    playerAvatar3D.classList.add('hit');

    // Player loses Heart
    gameState.playerHP--;
    renderHearts(playerHeartsContainer, gameState.playerHP, gameState.maxHP);

    if (playerWeapon === 'timeout') {
      printLog(`You timed out! Opponent deals damage.`, 'text-red');
    } else {
      printLog(`You chose ${playerWeapon.toUpperCase()}. Opponent chose ${enemyWeapon.toUpperCase()}. You take damage!`, 'text-red');
    }

    setTimeout(() => {
      spawnParticles(clashCenter.x, clashCenter.y, clashPalette, 25);
      const playerPedCoords = getElementCenter(playerFighter);
      spawnParticles(playerPedCoords.x, playerPedCoords.y - 40, ['#ef4444', '#b91c1c', '#dc2626', '#4b5563'], 30);
    }, 150);

    setTimeout(() => {
      checkVersusGameStatus();
    }, 1300);
  }
}

function resetVersusRoundState() {
  gameState.localChoice = null;
  gameState.opponentChoice = null;
  clashText.textContent = 'VS';
  clashText.className = 'clash-effect';
  battleStatusMsg.textContent = 'CHOOSE WEAPON...';
  gameState.isLocked = false;
}

function checkVersusGameStatus() {
  if (gameState.playerHP <= 0) {
    playerAvatar3D.className = 'avatar-blocky dead';
    printLog('You have been defeated by your friend!', 'text-red');
    setTimeout(() => {
      endVersusGame(false);
    }, 1000);
  } else if (gameState.enemyHP <= 0) {
    enemyAvatar3D.className = 'avatar-blocky dead';
    printLog('You have defeated your friend!', 'text-green');
    setTimeout(() => {
      endVersusGame(true);
    }, 1000);
  } else {
    resetVersusRoundState();
  }
}

function endVersusGame(isVictory) {
  stopRoundTimer();
  statFinalScore.textContent = gameState.score;
  statMaxStreak.textContent = gameState.maxStreak;
  statHighScore.textContent = gameState.highScore;
  statRounds.textContent = gameState.roundsPlayed;

  if (isVictory) {
    gameoverTitle.textContent = "VICTORY!";
    gameoverTitle.className = "pixel-title text-green";
    gameoverSubtitle.textContent = "YOU DEFEATED YOUR FRIEND";
    gameoverSubtitle.className = "pixel-subtitle text-yellow";
    playVictoryFanfare();
  } else {
    gameoverTitle.textContent = "DEFEAT";
    gameoverTitle.className = "pixel-title text-red";
    gameoverSubtitle.textContent = "YOUR FRIEND WON THE MATCH";
    gameoverSubtitle.className = "pixel-subtitle text-white";
    playLoseSound();
  }

  restartBtn.textContent = 'REMATCH';
  switchScreen('gameover');
}

// Register Multiplayer DOM Action Handlers
document.getElementById('btn-create-lobby').addEventListener('click', () => {
  playClickSound();
  initPeer();
});

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

// Auto-join if '?join=XXX' query param is present on load
window.addEventListener('load', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const joinId = urlParams.get('join');
  if (joinId) {
    // Select versus mode automatically
    selectVersusMode();
    // Connect to peer ID
    joinLobby(joinId);
  }
});

/* ==========================================================================
   ROUND TIMER SYSTEM (3-SECOND COUNTDOWN)
   ========================================================================== */

let timerInterval = null;

function startRoundTimer() {
  clearInterval(timerInterval);
  
  if (gameState.screen !== 'battle') return;

  // Skip timer if disabled for singleplayer modes
  if (!gameState.timerEnabled && gameState.mode !== 'versus') {
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
  if (gameState.mode === 'versus' && gameState.conn && gameState.conn.open) {
    sendPeerMessage({ type: 'chat', message: msg });
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
      if (gameState.screen === 'battle' && gameState.mode !== 'versus' && !gameState.isLocked) {
        startRoundTimer();
      }
    }
  });
}




