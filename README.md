# Voxel Showdown - Stone Paper Scissors

An epic, retro 8-bit voxel combat arena built with HTML, Vanilla CSS, and JavaScript. Battle the AI gauntlet, unlock skins, or invite a friend to clash in real-time Peer-to-Peer (P2P) multiplayer with a live battle console and interactive chat!

---

## 🎮 Game Modes

### 1. Endless Survival
* Fight an infinite wave of random voxel enemies (Skeleton Archer, Zombie Knight, Spider Rider, and more).
* Build high-score combos and win streaks.
* 3 Hearts max — the run ends when you lose all hearts.

### 2. Match Play
* A structured progressive gauntlet where you fight bosses in order (`HEROBRINE` ➡️ `ROBLOX KING` ➡️ `REDSTONE GOLEM` ➡️ `ENDER LORD` ➡️ `WITHER CHIEF`).
* **Single Match Limitation**: Each match is exactly one boss fight. Win or lose, the match ends and returns you to the **Main Menu (Home Page)**.
* **Progressive Tracking**: Winning a match advances your progress to the next boss. If you lose, you can retry the current boss from the splash screen.
* Mode resets back to Boss 0 when explicitly re-selecting "Match Play" from the menu.

### 3. Online Versus (P2P Multiplayer)
* Battle 2, 3, or 4 players in real-time over the internet using WebRTC (powered by PeerJS).
* **Lobby Configuration**: The host can configure the lobby size limit (2, 3, or 4 players). Clients join using the invite link.
* **Mesh-Free Host Authority**: The host coordinates the lobby state, routes chat messages, and resolves rules, avoiding mesh network lag.
* **Invite System**: Generate a lobby, copy a shareable invite link, and send it to your friends.
* **Smart Parsing**: The join box automatically cleans and extracts the lobby code even if users copy-paste the entire URL.
* **Simultaneous Moves**: Players choose their weapons in secret. The battle animation executes only after all active players lock in their moves.
* **Simple Multiplayer Rules**:
  - Timeouts result in auto-damage (1 HP loss).
  - If all 3 weapons are chosen (Stone, Paper, and Scissors) or if all players choose the same weapon, it is a **Draw** (no damage is dealt).
  - If only 2 unique weapons are chosen (e.g. Stone vs Scissors), the winning weapon players deal 1 damage to the losing weapon players.
  - Battle is resolved dynamically with side-by-side player pedestals and floatable choice bubbles. The last player standing wins!

---

## ⚡ Features & Audio System

* **3-Second Countdown Timer**: A high-tension countdown with warning beeps that triggers auto-loss on timeout.
  * In singleplayer, it can be toggled on/off in the header bar.
  * In multiplayer, it is choice-activated (starts only after one player makes a choice to prevent stalling).
* **Tabbed Battle Console**: 
  * **LOG Tab**: Tracks system messages, choices, and round results.
  * **CHAT Tab**: Interactive chatroom. Chats peer-to-peer (no databases, 100% ephemeral and serverless). Shows chosen skin names (e.g. `STEVE`, `ALEX`, `NOOB`, `CREEPER`) instead of generic user handles.
* **Trash-Talking AI Bosses**: Sending a chat message in singleplayer triggers a custom, personality-tailored response from the voxel boss you are fighting!
* **8-Bit Sound Engine**: Retro synth-beeps for clicks, draw, selection, hits, defeat, and victory.
* **Header Controls**: Quick controls for muting audio and toggling the round timer (saves preference to `localStorage`).

---

## 🚀 Setup & Local Running

Since the project uses purely static front-end assets, running it is simple:

1. Clone this repository:
   ```bash
   git clone <your-repository-url>
   ```
2. Open `index.html` directly in your browser, or serve it using a lightweight local server (e.g., Live Server in VS Code, or Python):
   ```bash
   # Python 3
   python -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser.

---

## 🌐 Deployment (e.g., Render)

To deploy this project for free on **Render**:

1. Log in to [Render](https://render.com/) and click **New > Static Site**.
2. Connect your GitHub repository.
3. Configure the settings:
   * **Build Command**: (Leave empty)
   * **Publish Directory**: `.` (or the folder containing `index.html`)
4. Click **Create Static Site**. Render will automatically generate an `HTTPS` domain (required for WebRTC/PeerJS functionality) and redeploy on every new commit!
