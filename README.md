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

---

<div align="center">
  Made with ❤️ and retro pixels · MIT License
</div>
