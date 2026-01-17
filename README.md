# LOCKDOWN LANES

A mobile-first 2D top-down tactical shooter web game built with Phaser 3.

## 🎮 Game Features

- **1v1 Plant/Defuse Format**: Player vs AI in tactical rounds
- **Best-of-7 Matches**: First to 4 round wins
- **Trophy & Rank System**: Clash Royale-style progression with 9 ranks
- **Unlock System**: Unlock weapons and items at trophy milestones
- **Pressure Ring**: Anti-stall mechanic that shrinks the play area
- **Buy Phase**: Economy system with weapon kits
- **Mobile-First**: Touch controls with virtual joystick and auto-fire

## 🏆 Ranks

| Rank | Trophies |
|------|----------|
| Recruit | 0-299 |
| Rookie | 300-599 |
| Enforcer | 600-999 |
| Operator | 1000-1399 |
| Specialist | 1400-1799 |
| Veteran | 1800-2199 |
| Elite | 2200-2599 |
| Legend | 2600-2999 |
| Mythic | 3000+ |

## 🔓 Unlocks

- 0🏆 Pistol Kit (starter)
- 300🏆 SMG Kit
- 600🏆 Rifle Kit
- 1000🏆 Utility Kit
- And more cosmetics at higher trophies!

## 🎮 Controls

### Mobile
- **Left Side**: Virtual joystick for movement
- **Right Side**: Drag to aim (auto-fire when enemy in sight)
- **Buttons**: Smoke, Plant/Defuse, Sprint

### Desktop
- **WASD**: Move
- **Mouse**: Aim
- **Left Click**: Shoot
- **Space**: Plant/Defuse (context action)
- **Shift**: Sprint
- **E**: Deploy smoke

## 🚀 Deploying to GitHub Pages

### Step 1: Create a GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Name it something like `lockdown-lanes`
3. Make it public

### Step 2: Upload Files
1. Clone the repository to your computer
2. Copy all game files into the repository folder:
   - `index.html`
   - `style.css`
   - `src/` folder with all JS files
   - `README.md`
3. Commit and push:
   ```bash
   git add .
   git commit -m "Initial commit - LOCKDOWN LANES"
   git push origin main
   ```

### Step 3: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** (top menu)
3. Click **Pages** (left sidebar)
4. Under "Source", select **Deploy from a branch**
5. Choose **main** branch and **/ (root)** folder
6. Click **Save**

### Step 4: Access Your Game
- Your game will be available at: `https://<your-username>.github.io/<repo-name>/`
- Example: `https://johndoe.github.io/lockdown-lanes/`
- It may take 1-2 minutes for the initial deployment

## 🔧 Troubleshooting

### Game not loading?
1. **Check case sensitivity**: GitHub Pages is case-sensitive. Make sure all file paths match exactly.
2. **Clear browser cache**: Do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. **Check console**: Open browser DevTools (F12) and check for errors
4. **Wait for deployment**: GitHub Pages can take a few minutes to update

### Touch controls not working?
- Make sure you're testing on an actual touch device or using browser DevTools mobile simulation
- Audio requires a user interaction first (tap anywhere to enable sounds)

### Trophies not saving?
- Trophies are saved in localStorage (browser storage)
- Each browser/device has its own separate save
- Private/Incognito mode may not persist saves

## 📁 File Structure

```
/
├── index.html          # Main HTML file
├── style.css           # Global styles
├── README.md           # This file
└── src/
    ├── main.js         # Game entry point
    ├── Config.js       # Game configuration
    ├── BootScene.js    # Loading and initialization
    ├── MenuScene.js    # Main menu
    ├── MatchScene.js   # Gameplay
    ├── ResultsScene.js # Match results
    ├── SaveSystem.js   # localStorage persistence
    ├── TrophySystem.js # Trophy calculations
    ├── UnlockSystem.js # Trophy-based unlocks
    ├── AIController.js # AI behavior
    ├── MatchmakerAI.js # Difficulty scaling
    ├── data_Ranks.js   # Rank definitions
    └── data_Weapons.js # Weapon and kit data
```

## 📝 Notes

- No build tools required - just static files!
- Uses Phaser 3 via CDN
- All paths are relative for GitHub Pages compatibility
- Saves progress in browser localStorage

## 🎯 Future Plans

- Online multiplayer (coming soon)
- More maps
- Additional weapons and utilities
- Seasonal events and rewards

---

Enjoy the game! 🎮
