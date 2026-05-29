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
  isLocked: false
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
    ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
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
  });
});

// Mode buttons click handlers
modeEndless.addEventListener('click', () => {
  modeEndless.classList.add('active');
  modeMatch.classList.remove('active');
  gameState.mode = 'endless';
  modeDesc.textContent = "Fight infinitely to stack score and streaks. Lose 3 hearts and the run ends.";
  playClickSound();
});

modeMatch.addEventListener('click', () => {
  modeMatch.classList.add('active');
  modeEndless.classList.remove('active');
  gameState.mode = 'match';
  modeDesc.textContent = "Defeat the Bosses in order! 3 Hearts each. Advancing restores your HP.";
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
  startGame();
});

menuBtn.addEventListener('click', () => {
  playClickSound();
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
  gameState.score = 0;
  gameState.streak = 0;
  gameState.maxStreak = 0;
  gameState.roundsPlayed = 0;
  gameState.playerHP = 3;
  gameState.enemyHP = 3;
  gameState.bossIndex = 0;
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
  
  switchScreen('battle');
  playVictoryFanfare();
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
  playerChoiceDisplay.innerHTML = weaponSvgs[playerWeapon];
  enemyChoiceDisplay.innerHTML = weaponSvgs[enemyWeapon];
  
  // Calculate result
  let result = 'draw'; // draw, win, lose
  
  if (playerWeapon === enemyWeapon) {
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
  const clashPalette = [...colorMap[playerWeapon], ...colorMap[enemyWeapon]];

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
    
    printLog(`${pName} chose ${playerWeapon.toUpperCase()}. ${eName} chose ${enemyWeapon.toUpperCase()}. Take damage!`, 'text-red');
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
      
      if (gameState.bossIndex >= BOSSES.length) {
        // Defeated all bosses
        printLog(`[CONGRATULATIONS]: You have cleared the Voxel Gauntlet!`, 'text-yellow');
        setTimeout(() => {
          endGame(true);
        }, 1000);
      } else {
        // Next Boss Stage!
        gameState.score += 500; // Stage clear bonus
        hudScore.textContent = gameState.score;
        
        setTimeout(() => {
          advanceStage();
        }, 1000);
      }
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
    gameoverSubtitle.textContent = "VOXEL CHAMPION";
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
  
  switchScreen('gameover');
}
