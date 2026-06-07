<div align="center">

# ⚔️ Voxel Showdown
### Stone • Paper • Scissors

**A retro pixel-art battle arena inspired by Minecraft & Roblox**

[![Live Demo](https://img.shields.io/badge/🎮%20Play%20Live-Render-6366f1?style=for-the-badge)](https://stonepaperscissor-xo5n.onrender.com)
[![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS](https://img.shields.io/badge/Vanilla%20CSS-264DE4?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)](https://webrtc.org/)

</div>

---

## 🎯 About

**Voxel Showdown** is a fully serverless, browser-based Stone Paper Scissors game dressed up as an epic 8-bit voxel battle arena. Choose your skin, pick your weapon, and fight through AI bosses — or go head-to-head with friends in real-time P2P multiplayer, all with zero backend required.

> Built with **pure HTML, Vanilla CSS & JavaScript** — no frameworks, no servers, no databases.

---

## 🎮 Game Modes

### ♾️ Endless Survival
- Fight an **infinite wave** of randomly chosen voxel enemies (Skeleton Archer, Zombie Knight, Spider Rider & more)
- Build **high-score combos** and win streaks
- You have **3 Hearts** — the run ends when you lose them all

### 🏆 Match Play
- A **progressive boss gauntlet** — fight bosses in order:
  `HEROBRINE` → `ROBLOX KING` → `REDSTONE GOLEM` → `ENDER LORD` → `WITHER CHIEF`
- Each match is **exactly one boss fight** — win or lose, you return to the main menu
- Winning **advances** your progress to the next boss; losing lets you retry the current one
- Mode resets when you re-select "Match Play" from the menu

### 🌐 Online Versus (2–4 Players)
- Real-time **P2P multiplayer** via WebRTC (powered by PeerJS) — no server needed
- Host creates a lobby, shares an **invite link**, friends join instantly
- Supports **2, 3, or 4 player** lobby sizes
- **Simultaneous secret moves** — choices reveal only after all players lock in
- Last player standing wins!

**Multiplayer Battle Rules:**
| Scenario | Result |
|---|---|
| All 3 weapons chosen | Most-picked weapon wins its clash; tie = Draw |
| 2 unique weapons chosen | Winning weapon players deal 1 damage to losers |
| Player times out | Auto 1 HP loss |
| All players same weapon | Draw |

---

## ✨ Features

| Feature | Details |
|---|---|
| 🎨 **4 Playable Skins** | Steve, Alex, Noob, Creeper — each with a unique pixel-art avatar |
| ⏱️ **3-Second Countdown Timer** | High-tension timer with warning beeps; toggleable in singleplayer |
| 🔊 **8-Bit Sound Engine** | Retro synth beeps for clicks, hits, draw, victory & defeat |
| 💬 **Tabbed Battle Console** | **LOG** (round history) + **CHAT** (live P2P chat, ephemeral & serverless) |
| 🤖 **AI Trash Talk** | Each boss responds to your chat messages with personality-tailored taunts |
| 🔗 **Smart Invite Links** | Auto-extracts lobby code even if the full URL is pasted |
| 🔁 **Reconnect System** | Rejoin a lobby mid-game after an accidental disconnect |
| 📊 **Stats Tracking** | Final score, max streak, high score, and rounds played saved to `localStorage` |
| 🔇 **Persistent Preferences** | Mute and timer settings saved across sessions via `localStorage` |

---

## ⚙️ Core Architecture & Function Breakdown

The game logic is modularized inside [script.js](file:///c:/Users/amank/Desktop/SPS/script.js). Below is a breakdown of the functions grouped by system component:

### 🔊 Retro Audio Synthesis Engine
Synthesizes 8-bit sound effects dynamically in the browser utilizing the Web Audio API (no external audio file dependencies).
* [getAudioContext](file:///c:/Users/amank/Desktop/SPS/script.js#L130): Retrieves or resumes the singleton `AudioContext` instance.
* [playClickSound](file:///c:/Users/amank/Desktop/SPS/script.js#L140): Plays a rapid triangle-wave frequency slide-down for button clicks.
* [playTickSound](file:///c:/Users/amank/Desktop/SPS/script.js#L162): Generates a high-pitch sine wave tick for the countdown timer.
* [playSelectSound](file:///c:/Users/amank/Desktop/SPS/script.js#L183): Synthesizes an 8-bit double-note square wave for locking weapon choices.
* [playWinSound](file:///c:/Users/amank/Desktop/SPS/script.js#L205): Arpeggiates a cheerful C-major chord progression on winning a round.
* [playLoseSound](file:///c:/Users/amank/Desktop/SPS/script.js#L229): Sweeps a sawtooth wave downwards to indicate a player defeat.
* [playDrawSound](file:///c:/Users/amank/Desktop/SPS/script.js#L251): Blends two low-frequency sine waves to signal a round tie.
* [playVictoryFanfare](file:///c:/Users/amank/Desktop/SPS/script.js#L273): Executes a complex 8-bit victory tune upon boss defeat or ultimate game win.

### 🎨 Voxel Dust Canvas Particle Engine
Renders customized, blocky explosion effects during battles on an HTML5 canvas layer.
* [resizeCanvas](file:///c:/Users/amank/Desktop/SPS/script.js#L313): Keeps the particle canvas matched to the user's viewport dimensions.
* [spawnParticles](file:///c:/Users/amank/Desktop/SPS/script.js#L320): Spawns multiple square particles at target coordinates with randomized velocities, sizes, gravity, and skin-matching color palettes.
* [updateParticles](file:///c:/Users/amank/Desktop/SPS/script.js#L336): The core requestAnimationFrame loop rendering particle movement, gravity drift, and opacity decay.
* [getElementCenter](file:///c:/Users/amank/Desktop/SPS/script.js#L358): Determines page coordinates of battle figures to center the particle bursts.

### 🖼️ UI Layout & Rendering
Updates screens and dynamically builds isometric voxel UI elements.
* [switchScreen](file:///c:/Users/amank/Desktop/SPS/script.js#L595): Swaps screen visibility (`splash`, `battle`, `gameover`) and manages active subsystems like the camera.
* [renderFullBody](file:///c:/Users/amank/Desktop/SPS/script.js#L617): Generates a multi-div CSS structure to construct 3D-looking, blocky character rigs (head, body, arms, legs) styled with skin classes.
* [renderHearts](file:///c:/Users/amank/Desktop/SPS/script.js#L629): Generates pixel-art hearts representing current vs maximum health.
* [updateMuteIcon](file:///c:/Users/amank/Desktop/SPS/script.js#L511): Updates standard SVG paths on the audio settings icon.

### ⚔️ Singleplayer Game Loop
Controls round execution, boss levels, and game progression.
* [startGame](file:///c:/Users/amank/Desktop/SPS/script.js#L653): Initializes stats, clears records, sets up character skin nodes, triggers music, and activates battle states.
* [executeRound](file:///c:/Users/amank/Desktop/SPS/script.js#L779): Handles entry locking and redirects the round execution flow according to singleplayer vs multiplayer modes.
* [resolveRound](file:///c:/Users/amank/Desktop/SPS/script.js#L865): Computes the rock-paper-scissors outcome, subtracts HP, triggers particle explosions at fighters, and updates streaks.
* [resetVisualsAfterRound](file:///c:/Users/amank/Desktop/SPS/script.js#L1017): Resets avatar positions and clears weapon display panels.
* [checkGameStatus](file:///c:/Users/amank/Desktop/SPS/script.js#L1026): Verifies player/enemy HP status to determine if the fight continues or resolves.
* [advanceStage](file:///c:/Users/amank/Desktop/SPS/script.js#L1092): Restores client health, updates the target boss skin, and prints boss transition warnings.
* [endGame](file:///c:/Users/amank/Desktop/SPS/script.js#L1118): Compiles round statistics, saves high scores to `localStorage`, and reveals the final statistics.
* [printLog](file:///c:/Users/amank/Desktop/SPS/script.js#L765): Formats logs with timestamps and appends them to the active console terminal.
* [scrollConsole](file:///c:/Users/amank/Desktop/SPS/script.js#L774): Handles automatic scroll targeting for the battle logs.

### 🌐 PeerJS WebRTC Multiplayer Networking
Powers the serverless, real-time P2P multiplayer lobbies and synchronizes network events.
* [initPeer](file:///c:/Users/amank/Desktop/SPS/script.js#L1499): Creates the PeerJS instance and configures listeners for connection, open, and error states.
* [handlePeerError](file:///c:/Users/amank/Desktop/SPS/script.js#L1472): Handles network error events, including ID conflicts and timeouts.
* [startNetworkHeartbeat](file:///c:/Users/amank/Desktop/SPS/script.js#L1184): Sends regular ping packets over connection streams to prevent connection timeouts.
* [selectVersusMode](file:///c:/Users/amank/Desktop/SPS/script.js#L1325): Adjusts the landing screen layout for P2P connection configuration.
* [updateLobbyUI](file:///c:/Users/amank/Desktop/SPS/script.js#L1346): Renders lobby information, list of players, and ready status.
* [updateLobbyGameTypeUI](file:///c:/Users/amank/Desktop/SPS/script.js#L1448): Renders UI differences for Normal vs Truth/Dare game types.
* [extractPeerId](file:///c:/Users/amank/Desktop/SPS/script.js#L1552): Isolates the peer hash string from complex URLs or direct code pastes.
* [joinLobby](file:///c:/Users/amank/Desktop/SPS/script.js#L1572): Saves host code variables and initializes client-side P2P handshake handlers.
* [connectToHost](file:///c:/Users/amank/Desktop/SPS/script.js#L1605): Opens a data connection channel to the host client.
* [setupConnection](file:///c:/Users/amank/Desktop/SPS/script.js#L1612): Implements message parsers and state trackers for host-to-client connections.
* [getPlayerIndexByConn](file:///c:/Users/amank/Desktop/SPS/script.js#L1658): Resolves connection references back to player ID integers.
* [broadcast](file:///c:/Users/amank/Desktop/SPS/script.js#L1663): Transmits state changes from the host out to all connected participants.
* [sendPeerMessage](file:///c:/Users/amank/Desktop/SPS/script.js#L1673): Sends direct messages to the target connection.
* [getNextAvailablePlayerIndex](file:///c:/Users/amank/Desktop/SPS/script.js#L1683): Computes open lobby slots (1 through 4) for joining clients.
* [handlePeerMessage](file:///c:/Users/amank/Desktop/SPS/script.js#L1692): The primary deserializer routing incoming network events (joins, moves, ready states, camera shares, chat lines, restart requests).
* [triggerChatTabNotification](file:///c:/Users/amank/Desktop/SPS/script.js#L2133): Highlights the chat tab with a notification dot when a new message is received.
* [handlePeerDisconnect](file:///c:/Users/amank/Desktop/SPS/script.js#L2141): Removes disconnected players, re-allocates host duties, and triggers reconnection states.
* [updateLobbyStatus](file:///c:/Users/amank/Desktop/SPS/script.js#L2256): Changes status texts and visual dots (green/red).
* [initMultiplayerPedestals](file:///c:/Users/amank/Desktop/SPS/script.js#L2272): Dynamically instantiates the requested number of character models on pedestals (2, 3, or 4).
* [updateBattleHUDPresence](file:///c:/Users/amank/Desktop/SPS/script.js#L2337): Manages connectivity indicators inside the live gameplay header.
* [handleAutoJoin](file:///c:/Users/amank/Desktop/SPS/script.js#L3870): Checks URL query parameters on load to trigger auto-lobby join handshakes.

### 👥 Multiplayer Battle Coordination
* [startVersusBattle](file:///c:/Users/amank/Desktop/SPS/script.js#L2368): Syncs start times, randomizes battle maps, and initializes health variables across all P2P nodes.
* [resolveVersusRound](file:///c:/Users/amank/Desktop/SPS/script.js#L2471): Coordinates round results once all active players declare moves. Deals damage based on multi-choice clash priority logic.
* [resolveVersusRoundFinal](file:///c:/Users/amank/Desktop/SPS/script.js#L2637): Processes and prints final multiplayer calculations.
* [executeMulticlientDamageVisuals](file:///c:/Users/amank/Desktop/SPS/script.js#L2690): Triggers targeted particle splashes and animations for players taking damage.
* [resetVersusRoundState](file:///c:/Users/amank/Desktop/SPS/script.js#L2776): Resets the player choices and restarts round timers.
* [checkVersusGameStatus](file:///c:/Users/amank/Desktop/SPS/script.js#L2811): Evaluates remaining alive participants to determine if a victory condition is met.
* [endVersusGame](file:///c:/Users/amank/Desktop/SPS/script.js#L2849): Disables inputs, resolves records, and opens the Truth or Dare dashboard for the winner.

### 📸 Truth or Dare & Camera Capture Engine
Controls the post-match interaction loop and handles camera controls.
* [updateTodChoiceButtonsUI](file:///c:/Users/amank/Desktop/SPS/script.js#L3005): Toggles button visuals on truth vs dare selector items.
* [updateTodInputLabelUI](file:///c:/Users/amank/Desktop/SPS/script.js#L3020): Dynamically re-labels input descriptions.
* [submitWinnerTod](file:///c:/Users/amank/Desktop/SPS/script.js#L3034): Validates and broadcasts winner-defined dares or truth questions.
* [submitLoserAnswer](file:///c:/Users/amank/Desktop/SPS/script.js#L3076): Sends the text-based answer to the winner's question.
* [stopCamera](file:///c:/Users/amank/Desktop/SPS/script.js#L3249): Disables active tracks on user camera devices.
* [capturePhoto](file:///c:/Users/amank/Desktop/SPS/script.js#L3266): Renders current video frames to standard 2D canvas containers, formats them as WebP/PNG data strings, and stops streams.
* [retakePhoto](file:///c:/Users/amank/Desktop/SPS/script.js#L3293): Re-enables the webcam to retry a dare photo capture.
* [sendPhoto](file:///c:/Users/amank/Desktop/SPS/script.js#L3302): Compresses image buffers and distributes them across connections.

### ⏱️ Timers, Chats & Rules Subsystems
* [startRoundTimer](file:///c:/Users/amank/Desktop/SPS/script.js#L3423): Launches a 3-second round countdown timer.
* [stopRoundTimer](file:///c:/Users/amank/Desktop/SPS/script.js#L3464): Halts active countdown timers.
* [handleRoundTimeout](file:///c:/Users/amank/Desktop/SPS/script.js#L3473): Manages players who fail to pick a weapon in time, auto-selecting a move or applying damage penalties.
* [printChatLog](file:///c:/Users/amank/Desktop/SPS/script.js#L3533): Appends custom-colored chat logs to the console window.
* [sendChatMessage](file:///c:/Users/amank/Desktop/SPS/script.js#L3545): Transmits local chat inputs to the lobby connections.
* [triggerAIChatBotReply](file:///c:/Users/amank/Desktop/SPS/script.js#L3568): Evaluates chat strings and returns custom boss-specific responses when playing singleplayer matches.
* [setupConsoleForMode](file:///c:/Users/amank/Desktop/SPS/script.js#L3634): Customizes the visibility and input modes of the Battle Console (LOG vs CHAT).
* [updateRulesContent](file:///c:/Users/amank/Desktop/SPS/script.js#L3733): Displays context-aware rules in the rules panel according to the active game settings.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 (Semantic) |
| Styling | Vanilla CSS (custom pixel-art design system, CSS variables, animations) |
| Logic | Vanilla JavaScript (ES6+, no frameworks) |
| Multiplayer | [PeerJS](https://peerjs.com/) (WebRTC abstraction) |
| Fonts | Google Fonts — Press Start 2P, Silkscreen, Inter |
| Hosting | [Render](https://render.com/) (Static Site, auto-deploys on push) |
| SEO | JSON-LD structured data (WebSite + SoftwareApplication schema), Open Graph, Twitter Cards, sitemap.xml |

---

## 🚀 Run Locally

Since the project is 100% static, no install step is needed.

```bash
# 1. Clone the repo
git clone https://github.com/amankumar26/StonePaperScissor.git
cd StonePaperScissor

# 2. Serve it (pick any method below)

# Option A — Python
python -m http.server 8000

# Option B — Node.js (npx)
npx serve .

# Option C — VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

Then open **`http://localhost:8000`** in your browser.

> ⚠️ **Multiplayer requires HTTPS.** For local P2P testing, use a tunneling tool like [ngrok](https://ngrok.com/) or deploy to Render.

---

## ☁️ Deploy on Render (Free)

1. Log in to [render.com](https://render.com) → **New → Static Site**
2. Connect your GitHub repository
3. Configure:
   | Setting | Value |
   |---|---|
   | Build Command | *(leave empty)* |
   | Publish Directory | `.` |
4. Click **Create Static Site**

Render auto-generates an **HTTPS domain** (required for WebRTC) and **redeploys on every push** to `main`. ✅

---

## 📁 Project Structure

```
StonePaperScissor/
├── index.html          # Main app — all screens (splash, battle, game over)
├── style.css           # Full design system — pixel-art theme, animations, layout
├── script.js           # All game logic — AI, P2P, sound engine, state machine
├── favicon.svg         # Pixel-art isometric stone voxel cube icon (SVG)
├── favicon.png         # PNG favicon fallback + Apple touch icon
├── sitemap.xml         # SEO sitemap
├── robots.txt          # Search engine crawler rules
└── assets/             # Static assets (OG image, etc.)
```

---

## 🗺️ Roadmap

- [ ] Mobile touch gesture support for weapon selection
- [ ] Global leaderboard (serverless via a KV store)
- [ ] More skins (Enderman, Diamond Steve, Zombie)
- [ ] Spectator mode for multiplayer lobbies
- [ ] Tournament bracket mode (4-player elimination)

---

## 👤 Author

**Aman Kumar**
- GitHub: [@amankumar26](https://github.com/amankumar26)
- Live Game: [stonepaperscissor-xo5n.onrender.com](https://stonepaperscissor-xo5n.onrender.com)


