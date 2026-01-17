// MatchScene - Main gameplay
import { CONFIG } from './Config.js';
import { SaveSystem } from './SaveSystem.js';
import { MatchmakerAI } from './MatchmakerAI.js';
import { AIController } from './AIController.js';
import { WEAPONS, KITS } from './data_Weapons.js';
import { CLASSES } from './data_Classes.js';
import { UnlockSystem } from './UnlockSystem.js';
import { TrophySystem } from './TrophySystem.js';
import { getRank } from './data_Ranks.js';
import { DailyChallengesSystem } from './DailyChallengesSystem.js';
import { AchievementSystem } from './AchievementSystem.js';
import { MatchHistorySystem } from './MatchHistorySystem.js';
import { ClassProgressionSystem } from './ClassProgressionSystem.js';
import { PERKS } from './data_Perks.js';
import { AILearningSystem } from './AILearningSystem.js';
import { AIPersonality } from './AIPersonality.js';

export class MatchScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MatchScene' });
    }
    
    init(data) {
        this.matchMode = data?.mode ?? 'ranked';
        this.trainingDifficulty = data?.difficulty ?? 'normal';
        this.selectedClass = data?.selectedClass ?? 'assault';
        
        // Match state
        this.playerScore = 0;
        this.aiScore = 0;
        this.roundNumber = 0;
        this.playerIsAttacker = true;
        
        // Round state
        this.roundTime = CONFIG.ROUND_TIME;
        this.buyPhaseTime = CONFIG.BUY_PHASE_TIME;
        this.inBuyPhase = true;
        this.roundActive = false;
        this.bombPlanted = false;
        this.bombTimer = CONFIG.BOMB_TIMER;
        this.roundEnded = false;
        this.roundEndProcessed = false;
        
        // Get class stats
        this.playerClass = CLASSES[this.selectedClass] ?? CLASSES.assault;
        
        // Player stats (modified by class)
        this.basePlayerHP = Math.floor(CONFIG.PLAYER_HP * (this.playerClass?.stats?.hp ?? 100) / 100);
        this.playerHP = this.basePlayerHP;
        this.playerCredits = CONFIG.START_CREDITS;
        this.playerStamina = CONFIG.MAX_STAMINA;
        this.playerSmokeReady = true;
        this.playerSmokeCharges = this.playerClass?.stats?.smokeCharges ?? 1;
        this.playerSmokeCooldown = this.playerClass?.stats?.smokeCooldown ?? CONFIG.SMOKE_COOLDOWN;
        this.playerSpeed = Math.floor(CONFIG.PLAYER_SPEED * (this.playerClass?.stats?.speed ?? 180) / 180);
        
        // AI stats
        this.aiHP = CONFIG.PLAYER_HP;
        
        // Pressure ring
        this.ringRadius = 600;
        this.ringActive = false;
        
        // Actions
        this.plantProgress = 0;
        this.defuseProgress = 0;
        this.isPlanting = false;
        this.isDefusing = false;
        
        // Objective bonuses
        this.playerPlanted = false;
        this.playerDefused = false;
        
        // Input
        this.joystickActive = false;
        this.joystickVector = { x: 0, y: 0 };
        this.aimAngle = 0;
        this.isSprinting = false;
        this.isFiring = false;
        this.lastFireTime = 0;
        
        // Smokes array
        this.smokes = [];
        
        // Visual feedback
        this.hitMarkers = [];
        this.damageNumbers = [];
        
        // Kill feed system
        this.killFeed = [];
        
        // Round statistics
        this.roundStats = {
            damageDealt: 0,
            damageTaken: 0,
            shotsFired: 0,
            shotsHit: 0
        };
        
        // Match statistics for history
        this.matchStats = {
            kills: 0,
            deaths: 0,
            damageDealt: 0,
            bombsPlanted: 0,
            bombsDefused: 0,
            roundsWon: 0
        };
        
        // AI callout timer
        this.lastAICallout = 0;
        
        // Match intro shown flag
        this.introShown = false;
        
        // Exciting moment tracking
        this.clutchMode = false;
        this.slowMoActive = false;
        this.lastClutchCheck = 0;
        this.dramaticMusicPlaying = false;
        
        // Combat feedback
        this.consecutiveHits = 0;
        this.lastHitTime = 0;
        
        // Round start tracking for learning
        this.roundStartTime = 0;
        this.roundStartPos = null;
    }
    
    create() {
        const { width, height } = this.cameras.main;
        
        // Get AI difficulty
        if (this.matchMode === 'ranked') {
            this.aiDifficulty = MatchmakerAI.getRankedDifficulty();
        } else {
            this.aiDifficulty = MatchmakerAI.getTrainingDifficulty(this.trainingDifficulty);
        }
        
        // Initialize AI systems
        AILearningSystem.reset();
        AIPersonality.reset(SaveSystem.getTrophies());
        this.aiName = AIPersonality.name;
        
        // Get player kit
        this.setupPlayerKit();
        
        // Create map
        this.createMap();
        
        // Create entities
        this.createPlayer();
        this.createAI();
        this.createBullets();
        
        // Create UI
        this.createHUD();
        this.createTouchControls();
        
        // Setup input
        this.setupInput();
        
        // Setup AI controller
        this.aiController = new AIController(this, this.ai, this.player, this.aiDifficulty);
        
        // Setup events
        this.setupEvents();
        
        // Fade in scene
        this.cameras.main.fadeIn(400, 0, 0, 0);
        
        // Start first round
        this.startRound();
        
        // Play sound
        this.playSound('roundStart');
    }
    
    setupPlayerKit() {
        const kitId = SaveSystem.getEquippedKit();
        const kit = KITS[kitId] ?? KITS.pistol;
        const baseWeapon = { ...WEAPONS[kit.weapon], ...kit };
        
        // Apply class modifiers to weapon
        const classStats = this.playerClass?.stats ?? {};
        
        // Get equipped perks and their effects
        const equippedPerks = ClassProgressionSystem.getEquippedPerks(this.selectedClass);
        this.equippedPerks = equippedPerks;
        
        // Calculate perk bonuses
        let damageMultiplier = 1;
        let spreadMultiplier = 1;
        let speedMultiplier = 1;
        let extraSmokes = 0;
        this.healOnKill = 0;
        this.plantDefuseSpeedMultiplier = 1;
        this.aiDetectionMultiplier = 1;
        
        // Apply primary perk
        if (equippedPerks?.primary) {
            const perk = PERKS[equippedPerks.primary];
            if (perk?.effect) {
                if (perk.effect.type === 'damage') damageMultiplier = perk.effect.value;
                if (perk.effect.type === 'spread' || perk.effect.type === 'accuracy') spreadMultiplier = perk.effect.value;
            }
        }
        
        // Apply secondary perk
        if (equippedPerks?.secondary) {
            const perk = PERKS[equippedPerks.secondary];
            if (perk?.effect) {
                if (perk.effect.type === 'heal_on_kill') this.healOnKill = perk.effect.value;
                if (perk.effect.type === 'smoke_charges') extraSmokes = perk.effect.value;
                if (perk.effect.type === 'move_speed') speedMultiplier = perk.effect.value;
                if (perk.effect.type === 'plant_defuse_speed') this.plantDefuseSpeedMultiplier = perk.effect.value;
                if (perk.effect.type === 'ai_detection') this.aiDetectionMultiplier = perk.effect.value;
            }
        }
        
        // Apply to weapon stats
        this.playerWeapon = {
            ...baseWeapon,
            damage: Math.floor(baseWeapon.damage * (classStats.damage ?? 1) * damageMultiplier),
            fireRate: Math.floor(baseWeapon.fireRate / (classStats.fireRate ?? 1)),
            spread: baseWeapon.spread * (classStats.spread ?? 1) * spreadMultiplier
        };
        
        // Apply to player stats
        this.playerSmokeCharges = (classStats.smokeCharges ?? kit.smokeCharges) + extraSmokes;
        this.playerSmokeCooldown = classStats.smokeCooldown ?? kit.smokeCooldown;
        this.playerSpeed = Math.floor(CONFIG.PLAYER_SPEED * (classStats.speed ?? 180) / 180 * speedMultiplier);
        
        console.log('[Perks] Equipped:', equippedPerks, 'Damage:', this.playerWeapon.damage, 'Speed:', this.playerSpeed, 'HealOnKill:', this.healOnKill);
    }
    
    createMap() {
        const { width, height } = this.cameras.main;
        
        // ===== WORLD BOUNDS SETUP =====
        // Set up world bounds larger than camera for camera follow to work
        const worldWidth = width * 1.5;
        const worldHeight = height * 1.5;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
        
        // Store world dimensions for reference
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        
        // Background with gradient effect - make it bigger for the expanded world
        this.add.rectangle(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, CONFIG.COLORS.BG_DARK);
        
        // Floor pattern - use world dimensions
        const floor = this.add.graphics();
        floor.fillStyle(CONFIG.COLORS.BG_MID, 1);
        floor.fillRect(50, 50, worldWidth - 100, worldHeight - 100);
        
        // Grid lines
        floor.lineStyle(1, 0x333333, 0.3);
        for (let x = 50; x < worldWidth - 50; x += 40) {
            floor.lineBetween(x, 50, x, worldHeight - 50);
        }
        for (let y = 50; y < worldHeight - 50; y += 40) {
            floor.lineBetween(50, y, worldWidth - 50, y);
        }
        
        // Bomb site with improved visuals - center of world
        this.bombSite = { x: worldWidth / 2, y: 200 };
        
        // Bomb site glow
        const siteGlow = this.add.graphics();
        siteGlow.fillStyle(CONFIG.COLORS.BOMB_SITE, 0.15);
        siteGlow.fillCircle(this.bombSite.x, this.bombSite.y, 60);
        
        this.add.image(this.bombSite.x, this.bombSite.y, 'bombsite');
        this.add.text(this.bombSite.x, this.bombSite.y, 'A', {
            font: 'bold 24px Arial',
            fill: '#fdcb6e'
        }).setOrigin(0.5);
        
        // Walls (static collision)
        this.walls = this.physics.add.staticGroup();
        
        // Map layout: 3 lanes with walls - use world center
        const cx = worldWidth / 2;
        this.walls.add(this.add.rectangle(cx - 250, 350, 200, 20, CONFIG.COLORS.WALL));
        this.walls.add(this.add.rectangle(cx + 250, 350, 200, 20, CONFIG.COLORS.WALL));
        
        // Middle dividers
        this.walls.add(this.add.rectangle(cx - 100, 450, 20, 150, CONFIG.COLORS.WALL));
        this.walls.add(this.add.rectangle(cx + 100, 450, 20, 150, CONFIG.COLORS.WALL));
        
        // Additional walls for world edges (to prevent walking off)
        this.walls.add(this.add.rectangle(worldWidth / 2, 30, worldWidth - 60, 20, CONFIG.COLORS.WALL)); // Top
        this.walls.add(this.add.rectangle(worldWidth / 2, worldHeight - 30, worldWidth - 60, 20, CONFIG.COLORS.WALL)); // Bottom
        this.walls.add(this.add.rectangle(30, worldHeight / 2, 20, worldHeight - 60, CONFIG.COLORS.WALL)); // Left
        this.walls.add(this.add.rectangle(worldWidth - 30, worldHeight / 2, 20, worldHeight - 60, CONFIG.COLORS.WALL)); // Right
        
        // Cover boxes
        this.cover = this.physics.add.staticGroup();
        this.cover.add(this.add.rectangle(cx - 200, 280, 48, 48, CONFIG.COLORS.COVER));
        this.cover.add(this.add.rectangle(cx + 200, 280, 48, 48, CONFIG.COLORS.COVER));
        this.cover.add(this.add.rectangle(cx, 400, 48, 48, CONFIG.COLORS.COVER));
        this.cover.add(this.add.rectangle(cx - 150, 550, 48, 48, CONFIG.COLORS.COVER));
        this.cover.add(this.add.rectangle(cx + 150, 550, 48, 48, CONFIG.COLORS.COVER));
        
        // Refresh physics bodies for static groups
        this.walls.children.iterate(wall => {
            if (wall?.body) wall.body.updateFromGameObject();
        });
        this.cover.children.iterate(c => {
            if (c?.body) c.body.updateFromGameObject();
        });
        
        // Spawn points - use world dimensions
        this.attackerSpawn = { x: worldWidth / 2, y: worldHeight - 100 };
        this.defenderSpawn = { x: worldWidth / 2, y: 280 };
        
        // Lanes for AI navigation - use world center
        this.lanes = [
            [{ x: cx - 250, y: 500 }, { x: cx - 250, y: 300 }],
            [{ x: cx, y: 550 }, { x: cx, y: 350 }],
            [{ x: cx + 250, y: 500 }, { x: cx + 250, y: 300 }]
        ];
        
        // Pressure ring visual
        this.ringGraphics = this.add.graphics();
        
        // ===== CAMERA SETUP =====
        // Set camera bounds to world bounds
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        
        // Set zoom for more immersive feel (1.5x zoom)
        this.cameras.main.setZoom(1.5);
    }
    
    getLanes() {
        return this.lanes ?? [];
    }
    
    createPlayer() {
        const spawn = this.playerIsAttacker ? this.attackerSpawn : this.defenderSpawn;
        
        this.player = this.physics.add.sprite(spawn.x, spawn.y, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.player.hp = this.playerHP;
        this.player.weapon = this.playerWeapon;
        
        // Apply class color tint
        this.player.setTint(this.playerClass?.color ?? CONFIG.COLORS.DEFENDER);
        
        // Collision with walls and cover
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.player, this.cover);
        
        // ===== CAMERA FOLLOW =====
        // Smooth camera follow with lerp for buttery movement
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    }
    
    createAI() {
        const spawn = this.playerIsAttacker ? this.defenderSpawn : this.attackerSpawn;
        
        this.ai = this.physics.add.sprite(spawn.x, spawn.y, 'ai');
        this.ai.setCollideWorldBounds(true);
        this.ai.setDepth(10);
        this.ai.hp = this.aiHP;
        this.ai.weapon = { ...WEAPONS.pistol };
        this.ai.smokeCooldown = CONFIG.SMOKE_COOLDOWN;
        
        // Collision
        this.physics.add.collider(this.ai, this.walls);
        this.physics.add.collider(this.ai, this.cover);
    }
    
    createBullets() {
        this.playerBullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 20
        });
        
        this.aiBullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 20
        });
        
        // Bullet vs AI collision
        this.physics.add.overlap(this.playerBullets, this.ai, (bullet, ai) => {
            this.hitAI(bullet);
        });
        
        // Bullet vs Player collision - CRITICAL: This must trigger hitPlayer
        this.physics.add.overlap(this.aiBullets, this.player, (bullet, player) => {
            console.log('[DEBUG] AI bullet hit player! Bullet:', bullet?.active, 'Player HP before:', this.playerHP);
            this.hitPlayer(bullet);
            console.log('[DEBUG] After hitPlayer - Player HP:', this.playerHP, 'Round Ended:', this.roundEnded);
        });
        
        // Bullets vs walls
        this.physics.add.collider(this.playerBullets, this.walls, (bullet) => {
            bullet?.destroy();
        });
        this.physics.add.collider(this.aiBullets, this.walls, (bullet) => {
            bullet?.destroy();
        });
        this.physics.add.collider(this.playerBullets, this.cover, (bullet) => {
            bullet?.destroy();
        });
        this.physics.add.collider(this.aiBullets, this.cover, (bullet) => {
            bullet?.destroy();
        });
    }
    
    createHUD() {
        const { width, height } = this.cameras.main;
        
        // Top bar with gradient - FIXED TO CAMERA
        this.hudBg = this.add.graphics();
        this.hudBg.fillStyle(0x000000, 0.85);
        this.hudBg.fillRect(0, 0, width, 55);
        this.hudBg.setDepth(100).setScrollFactor(0);
        
        // Score with better styling - FIXED TO CAMERA
        this.scoreText = this.add.text(width / 2, 28, '0 - 0', {
            font: 'bold 32px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
        
        // Timer - FIXED TO CAMERA
        this.timerText = this.add.text(width / 2, 8, '0:45', {
            font: 'bold 14px Arial',
            fill: '#ffcc00'
        }).setOrigin(0.5, 0).setDepth(100).setScrollFactor(0);
        
        // Player HP bar - FIXED TO CAMERA
        this.hpBarBg = this.add.graphics().setDepth(100).setScrollFactor(0);
        this.hpBarBg.fillStyle(0x333333, 0.8);
        this.hpBarBg.fillRoundedRect(10, 10, 120, 20, 4);
        
        this.hpBar = this.add.graphics().setDepth(101).setScrollFactor(0);
        this.updateHPBar();
        
        this.hpText = this.add.text(15, 20, `❤️ ${this.playerHP}`, {
            font: 'bold 14px Arial',
            fill: '#ffffff'
        }).setOrigin(0, 0.5).setDepth(102).setScrollFactor(0);
        
        // Credits - FIXED TO CAMERA
        this.creditsText = this.add.text(width - 10, 20, '💰 500', {
            font: 'bold 16px Arial',
            fill: '#ffd700'
        }).setOrigin(1, 0.5).setDepth(100).setScrollFactor(0);
        
        // Class indicator - FIXED TO CAMERA
        this.classText = this.add.text(10, 38, `${this.playerClass?.icon ?? '⚔️'} ${this.playerClass?.name ?? 'Assault'}`, {
            font: 'bold 12px Arial',
            fill: '#' + (this.playerClass?.color ?? 0x3498db).toString(16).padStart(6, '0')
        }).setOrigin(0, 0.5).setDepth(100).setScrollFactor(0);
        
        // Role indicator - FIXED TO CAMERA
        this.roleText = this.add.text(width - 10, 38, 'ATTACKER', {
            font: 'bold 12px Arial',
            fill: '#ff6b35'
        }).setOrigin(1, 0.5).setDepth(100).setScrollFactor(0);
        
        // Bomb status - FIXED TO CAMERA
        this.bombStatusText = this.add.text(width / 2, 48, '', {
            font: 'bold 12px Arial',
            fill: '#fdcb6e'
        }).setOrigin(0.5, 0.5).setDepth(100).setScrollFactor(0);
        
        // Center messages - FIXED TO CAMERA
        this.centerText = this.add.text(width / 2, height / 2, '', {
            font: 'bold 36px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(200).setAlpha(0).setScrollFactor(0);
        
        // Progress bar for plant/defuse - FIXED TO CAMERA
        this.progressBar = this.add.graphics().setDepth(150).setScrollFactor(0);
        
        // Smoke cooldown indicator - FIXED TO CAMERA (positioned to avoid touch controls)
        this.smokeCDText = this.add.text(width / 2, height - 20, '💨 Ready', {
            font: '14px Arial',
            fill: '#00ff88'
        }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
        
        // Ring warning - FIXED TO CAMERA
        this.ringWarning = this.add.text(width / 2, 70, '⚠️ PRESSURE RING ACTIVE!', {
            font: 'bold 16px Arial',
            fill: '#ff0000'
        }).setOrigin(0.5).setDepth(100).setAlpha(0).setScrollFactor(0);
        
        // Buy menu (hidden initially) - will be fixed in createBuyMenu
        this.buyMenu = this.createBuyMenu();
        
        // Kill notification - FIXED TO CAMERA
        this.killNotification = this.add.text(width / 2, height / 2 - 80, '', {
            font: 'bold 24px Arial',
            fill: '#ff3366',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(200).setAlpha(0).setScrollFactor(0);
        
        // Kill feed container (top right) - FIXED TO CAMERA
        this.killFeedContainer = this.add.container(width - 10, 60).setDepth(150).setScrollFactor(0);
        
        // Minimap (bottom left corner) - FIXED TO CAMERA
        this.createMinimap();
        
        // AI callout text - FIXED TO CAMERA
        this.aiCalloutText = this.add.text(width / 2, 90, '', {
            font: 'bold 14px Arial',
            fill: '#ff6b35',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(100).setAlpha(0).setScrollFactor(0);
        
        // Trophy indicators (ranked mode only) - FIXED TO CAMERA
        if (this.matchMode === 'ranked') {
            this.createTrophyIndicators();
        }
    }
    
    createTrophyIndicators() {
        const { width, height } = this.cameras.main;
        
        // Get current trophy info
        const trophies = SaveSystem.getTrophies();
        const rank = getRank(trophies);
        
        // Calculate opponent's estimated trophies (based on matchmaker)
        const opponentTrophyRange = this.getOpponentTrophyRange(trophies);
        
        // Calculate win/lose stakes
        const winStakes = TrophySystem.calculateTrophyChange(true, false);
        const loseStakes = TrophySystem.calculateTrophyChange(false, false);
        
        // Trophy info panel - top left corner below HP bar
        this.trophyPanel = this.add.container(10, 60).setDepth(100).setScrollFactor(0);
        
        // Panel background
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x000000, 0.7);
        panelBg.fillRoundedRect(0, 0, 160, 55, 6);
        
        // Current rank and trophies
        const rankDisplay = this.add.text(5, 5, `${rank.icon} ${rank.name}`, {
            font: 'bold 12px Arial',
            fill: '#' + rank.color.toString(16).padStart(6, '0')
        });
        
        // Trophy count
        const trophyDisplay = this.add.text(5, 22, `🏆 ${trophies}`, {
            font: '11px Arial',
            fill: '#ffd700'
        });
        
        // Stakes display (Win/Lose)
        const stakesDisplay = this.add.text(5, 38, `Win: +${winStakes} | Lose: ${loseStakes}`, {
            font: '10px Arial',
            fill: winStakes > 0 ? '#00ff88' : '#ffffff'
        });
        
        this.trophyPanel.add([panelBg, rankDisplay, trophyDisplay, stakesDisplay]);
        
        // Opponent info - top right corner below credits
        this.opponentPanel = this.add.container(width - 10, 60).setDepth(100).setScrollFactor(0);
        
        // Panel background
        const oppBg = this.add.graphics();
        oppBg.fillStyle(0x000000, 0.7);
        oppBg.fillRoundedRect(-130, 0, 130, 40, 6);
        
        // Opponent label
        const oppLabel = this.add.text(-125, 5, '🤖 Opponent', {
            font: 'bold 11px Arial',
            fill: '#ff6b35'
        });
        
        // Opponent trophy estimate
        const oppRank = getRank(opponentTrophyRange.avg);
        const oppTrophyText = this.add.text(-125, 22, `${oppRank.icon} ~${opponentTrophyRange.avg} 🏆`, {
            font: '10px Arial',
            fill: '#' + oppRank.color.toString(16).padStart(6, '0')
        });
        
        this.opponentPanel.add([oppBg, oppLabel, oppTrophyText]);
    }
    
    getOpponentTrophyRange(playerTrophies) {
        // AI difficulty affects the estimated trophy range
        const variance = this.aiDifficulty?.trophyVariance ?? 50;
        const base = playerTrophies + (Math.random() - 0.5) * variance * 2;
        return {
            min: Math.max(0, Math.floor(base - variance / 2)),
            max: Math.floor(base + variance / 2),
            avg: Math.floor(base)
        };
    }
    
    createMinimap() {
        if (!SaveSystem.getShowMinimap()) return;
        
        const { width, height } = this.cameras.main;
        const mapSize = 90;
        const mapX = 55;
        const mapY = height - 175; // Positioned above touch controls
        
        this.minimapContainer = this.add.container(mapX, mapY).setDepth(90).setScrollFactor(0);
        
        // Background
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.7);
        bg.fillRoundedRect(-mapSize/2, -mapSize/2, mapSize, mapSize, 8);
        bg.lineStyle(2, CONFIG.COLORS.PRIMARY, 0.5);
        bg.strokeRoundedRect(-mapSize/2, -mapSize/2, mapSize, mapSize, 8);
        
        // Bomb site indicator
        const siteX = 0;
        const siteY = -30;
        const site = this.add.graphics();
        site.fillStyle(CONFIG.COLORS.BOMB_SITE, 0.6);
        site.fillCircle(siteX, siteY, 10);
        
        // Player dot
        this.minimapPlayer = this.add.circle(0, 20, 5, CONFIG.COLORS.DEFENDER).setDepth(2);
        
        // AI dot
        this.minimapAI = this.add.circle(0, -20, 5, CONFIG.COLORS.ATTACKER).setDepth(2);
        
        // Bomb indicator (when planted)
        this.minimapBomb = this.add.circle(siteX, siteY, 4, 0xff3366).setVisible(false).setDepth(3);
        
        this.minimapContainer.add([bg, site, this.minimapPlayer, this.minimapAI, this.minimapBomb]);
    }
    
    updateMinimap() {
        if (!this.minimapContainer) return;
        
        const mapScale = 100 / this.worldWidth;
        const centerX = this.worldWidth / 2;
        const centerY = this.worldHeight / 2;
        
        // Update player position on minimap
        if (this.player?.active) {
            const px = (this.player.x - centerX) * mapScale;
            const py = (this.player.y - centerY) * mapScale;
            this.minimapPlayer?.setPosition?.(px, py);
        }
        
        // Update AI position on minimap
        if (this.ai?.active) {
            const ax = (this.ai.x - centerX) * mapScale;
            const ay = (this.ai.y - centerY) * mapScale;
            this.minimapAI?.setPosition?.(ax, ay);
        }
        
        // Update bomb indicator
        this.minimapBomb?.setVisible?.(this.bombPlanted);
    }
    
    updateHPBar() {
        this.hpBar?.clear?.();
        const hpPercent = Math.max(0, this.playerHP / this.basePlayerHP);
        const barColor = hpPercent > 0.5 ? 0x00ff88 : (hpPercent > 0.25 ? 0xffcc00 : 0xff3366);
        this.hpBar?.fillStyle?.(barColor, 1);
        this.hpBar?.fillRoundedRect?.(10, 10, 120 * hpPercent, 20, 4);
    }
    
    createBuyMenu() {
        const { width, height } = this.cameras.main;
        const menu = this.add.container(width / 2, height / 2).setDepth(150).setVisible(false).setScrollFactor(0);
        
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.9);
        bg.fillRoundedRect(-220, -220, 440, 440, 20);
        bg.lineStyle(3, CONFIG.COLORS.PRIMARY);
        bg.strokeRoundedRect(-220, -220, 440, 440, 20);
        
        const title = this.add.text(0, -190, '🛒 BUY PHASE', {
            font: 'bold 28px Arial',
            fill: '#ffd700'
        }).setOrigin(0.5);
        
        menu.add([bg, title]);
        
        // Kit buttons
        const trophies = SaveSystem.getTrophies();
        const { available, locked } = UnlockSystem.getAvailableKits(trophies);
        
        let yPos = -120;
        
        available.forEach(kit => {
            const canAfford = this.playerCredits >= kit.cost;
            const btn = this.createKitButton(0, yPos, kit, canAfford, true);
            menu.add(btn);
            yPos += 75;
        });
        
        locked.forEach(kit => {
            const btn = this.createKitButton(0, yPos, kit, false, false);
            menu.add(btn);
            yPos += 75;
        });
        
        return menu;
    }
    
    createKitButton(x, y, kit, canAfford, unlocked) {
        const btn = this.add.container(x, y);
        
        const bgColor = !unlocked ? 0x2d2d2d : (canAfford ? 0x1a5f7a : 0x444444);
        const bg = this.add.graphics();
        bg.fillStyle(bgColor, 0.95);
        bg.fillRoundedRect(-190, -28, 380, 60, 10);
        if (unlocked && canAfford) {
            bg.lineStyle(2, CONFIG.COLORS.PRIMARY);
            bg.strokeRoundedRect(-190, -28, 380, 60, 10);
        }
        
        const nameText = this.add.text(-170, -12, kit.name, {
            font: 'bold 18px Arial',
            fill: unlocked ? '#ffffff' : '#666666'
        }).setOrigin(0, 0.5);
        
        const descText = this.add.text(-170, 12, kit.description, {
            font: '13px Arial',
            fill: unlocked ? '#aaaaaa' : '#444444'
        }).setOrigin(0, 0.5);
        
        let costText;
        if (!unlocked) {
            costText = this.add.text(170, 0, `🔒 ${kit.requiredTrophies}🏆`, {
                font: '14px Arial',
                fill: '#ff6666'
            }).setOrigin(1, 0.5);
        } else {
            costText = this.add.text(170, 0, kit.cost > 0 ? `💰 ${kit.cost}` : 'FREE', {
                font: 'bold 16px Arial',
                fill: canAfford ? '#ffd700' : '#ff6666'
            }).setOrigin(1, 0.5);
        }
        
        btn.add([bg, nameText, descText, costText]);
        btn.setSize(380, 60);
        
        if (unlocked && canAfford) {
            btn.setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => this.buyKit(kit));
            btn.on('pointerover', () => {
                bg.clear();
                bg.fillStyle(0x2a7f9f, 0.95);
                bg.fillRoundedRect(-190, -28, 380, 60, 10);
                bg.lineStyle(2, 0x00d4ff);
                bg.strokeRoundedRect(-190, -28, 380, 60, 10);
            });
            btn.on('pointerout', () => {
                bg.clear();
                bg.fillStyle(0x1a5f7a, 0.95);
                bg.fillRoundedRect(-190, -28, 380, 60, 10);
                bg.lineStyle(2, CONFIG.COLORS.PRIMARY);
                bg.strokeRoundedRect(-190, -28, 380, 60, 10);
            });
        }
        
        return btn;
    }
    
    buyKit(kit) {
        if (this.playerCredits >= kit.cost) {
            this.playerCredits -= kit.cost;
            const baseWeapon = { ...WEAPONS[kit.weapon], ...kit };
            const classStats = this.playerClass?.stats ?? {};
            this.playerWeapon = {
                ...baseWeapon,
                damage: Math.floor(baseWeapon.damage * (classStats.damage ?? 1)),
                fireRate: Math.floor(baseWeapon.fireRate / (classStats.fireRate ?? 1)),
                spread: baseWeapon.spread * (classStats.spread ?? 1)
            };
            this.player.weapon = this.playerWeapon;
            this.playerSmokeCharges = classStats.smokeCharges ?? kit.smokeCharges;
            this.playerSmokeCooldown = classStats.smokeCooldown ?? kit.smokeCooldown;
            this.updateHUD();
            this.playSound('buy');
            
            this.showMessage(`Equipped ${kit.name}!`, 1000);
        }
    }
    
    createTouchControls() {
        const { width, height } = this.cameras.main;
        
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Safe margins for mobile (percentage-based)
        const safeMarginX = Math.max(20, width * 0.03);
        const safeMarginY = Math.max(20, height * 0.05);
        
        // Touch controls container - FIXED TO CAMERA
        this.touchControls = this.add.container(0, 0).setDepth(90).setScrollFactor(0);
        
        // Joystick (left side) - percentage-based positioning
        const joystickX = safeMarginX + 70;
        const joystickY = height - safeMarginY - 90;
        this.joystickBase = this.add.image(joystickX, joystickY, 'joystick_base').setAlpha(0.6).setScrollFactor(0);
        this.joystickThumb = this.add.image(joystickX, joystickY, 'joystick_thumb').setAlpha(0.8).setScrollFactor(0);
        
        // Store joystick position for input calculations
        this.joystickBaseX = joystickX;
        this.joystickBaseY = joystickY;
        
        // Action buttons (right side) - percentage-based positioning with safe margins
        const btnSize = 55;
        const btnMargin = 15;
        const rightBtnX = width - safeMarginX - btnSize / 2;
        const bottomBtnY = height - safeMarginY - btnSize / 2;
        
        // SHOOT BUTTON - Large and prominently placed at bottom-right
        this.shootBtn = this.createActionButton(rightBtnX, bottomBtnY, '🔫', null);
        this.shootBtn.setScale(1.3); // Make shoot button bigger
        
        // Other action buttons above and to the left of shoot
        this.smokeBtn = this.createActionButton(rightBtnX - btnSize - btnMargin, bottomBtnY - btnSize - btnMargin, '💨', () => this.useSmoke());
        this.actionBtn = this.createActionButton(rightBtnX, bottomBtnY - btnSize - btnMargin - 10, '🚩', () => this.startAction());
        this.sprintBtn = this.createActionButton(rightBtnX - btnSize - btnMargin, bottomBtnY, '🏃', null);
        
        this.touchControls.add([this.joystickBase, this.joystickThumb, this.smokeBtn, this.actionBtn, this.sprintBtn, this.shootBtn]);
        
        // Aim zone (right half) - FIXED TO CAMERA
        this.aimZone = this.add.rectangle(width * 0.6, height / 2, width * 0.4, height, 0x000000, 0);
        this.aimZone.setInteractive();
        this.aimZone.setDepth(5).setScrollFactor(0);
        
        this.setupTouchInput();
    }
    
    createActionButton(x, y, icon, callback) {
        const btn = this.add.container(x, y).setScrollFactor(0);
        
        const bg = this.add.image(0, 0, 'button');
        const text = this.add.text(0, 0, icon, { font: '24px Arial' }).setOrigin(0.5);
        
        btn.add([bg, text]);
        btn.setSize(60, 60);
        btn.setInteractive();
        
        if (callback) {
            btn.on('pointerdown', callback);
        }
        
        return btn;
    }
    
    setupTouchInput() {
        const { width, height } = this.cameras.main;
        
        // Get stored joystick base position
        const jBaseX = this.joystickBaseX ?? 90;
        const jBaseY = this.joystickBaseY ?? (height - 120);
        
        // Shoot button press handling
        if (this.shootBtn) {
            this.shootBtn.setInteractive();
            this.shootBtn.on('pointerdown', () => {
                this.isFiring = true;
            });
            this.shootBtn.on('pointerup', () => {
                this.isFiring = false;
            });
            this.shootBtn.on('pointerout', () => {
                this.isFiring = false;
            });
        }
        
        // Sprint button handling
        if (this.sprintBtn) {
            this.sprintBtn.on('pointerdown', () => {
                this.isSprinting = true;
            });
            this.sprintBtn.on('pointerup', () => {
                this.isSprinting = false;
            });
            this.sprintBtn.on('pointerout', () => {
                this.isSprinting = false;
            });
        }
        
        this.input.on('pointerdown', (pointer) => {
            // Check if touch is in left third of screen for joystick
            if (pointer.x < width / 3 && pointer.y > height / 2) {
                this.joystickActive = true;
                this.joystickPointerId = pointer.id;
            }
        });
        
        this.input.on('pointermove', (pointer) => {
            if (this.joystickActive && pointer.id === this.joystickPointerId) {
                const dx = pointer.x - jBaseX;
                const dy = pointer.y - jBaseY;
                const dist = Math.min(40, Math.sqrt(dx * dx + dy * dy));
                const angle = Math.atan2(dy, dx);
                
                this.joystickThumb.x = jBaseX + Math.cos(angle) * dist;
                this.joystickThumb.y = jBaseY + Math.sin(angle) * dist;
                
                this.joystickVector = {
                    x: dist > 10 ? Math.cos(angle) : 0,
                    y: dist > 10 ? Math.sin(angle) : 0
                };
            }
            
            // ONLY set firing on touch devices during touch-aim
            // Convert screen coordinates to world coordinates for aiming
            if (this.isTouchDevice && pointer.x > width / 2 && pointer.isDown) {
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                const dx = worldPoint.x - (this.player?.x ?? 0);
                const dy = worldPoint.y - (this.player?.y ?? 0);
                this.aimAngle = Math.atan2(dy, dx);
                this.isFiring = true;
            }
        });
        
        this.input.on('pointerup', (pointer) => {
            if (pointer.id === this.joystickPointerId) {
                this.joystickActive = false;
                this.joystickVector = { x: 0, y: 0 };
                // Reset joystick thumb to stored base position
                this.joystickThumb.x = jBaseX;
                this.joystickThumb.y = jBaseY;
            }
            // Reset firing when pointer is released on right side (aim zone)
            if (this.isTouchDevice && pointer.x > width / 2) {
                this.isFiring = false;
            }
        });
    }
    
    setupInput() {
        this.cursors = this.input.keyboard?.createCursorKeys?.();
        this.wasd = this.input.keyboard?.addKeys?.('W,A,S,D,SPACE,SHIFT,E');
        
        this.input.on('pointermove', (pointer) => {
            if (!this.isTouchDevice && pointer.x > 0) {
                // Convert screen coordinates to world coordinates for aiming
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                this.aimAngle = Phaser.Math.Angle.Between(
                    this.player?.x ?? 0, this.player?.y ?? 0,
                    worldPoint.x, worldPoint.y
                );
            }
        });
        
        this.input.on('pointerdown', (pointer) => {
            if (!this.isTouchDevice && pointer.leftButtonDown()) {
                this.isFiring = true;
            }
        });
        
        this.input.on('pointerup', (pointer) => {
            if (!this.isTouchDevice) {
                this.isFiring = false;
            }
        });
    }
    
    setupEvents() {
        this.events.on('aiShoot', (ai) => {
            this.fireAIWeapon(ai);
        });
        
        this.events.on('aiSmoke', (ai) => {
            this.deploySmoke(ai?.x ?? 400, ai?.y ?? 300);
        });
        
        // Handle targeted smoke deployment from learning system
        this.events.on('aiSmokeAt', (target) => {
            if (target?.x !== undefined && target?.y !== undefined) {
                this.deploySmoke(target.x, target.y);
            }
        });
    }
    
    update(time, delta) {
        // CRITICAL GUARD: If round ended, STOP ALL GAME LOGIC
        if (this.roundEnded) {
            // Ensure everything is stopped
            this.player?.body?.setVelocity?.(0, 0);
            this.ai?.body?.setVelocity?.(0, 0);
            this.isFiring = false;
            this.isPlanting = false;
            this.isDefusing = false;
            // Only update HUD for visual feedback
            this.updateHUD();
            return;
        }
        
        // Secondary guard: If not round active (buy phase), limit logic
        if (!this.roundActive && !this.inBuyPhase) {
            this.updateHUD();
            return;
        }
        
        if (!this.player?.active) return;
        
        this.updateTimers(delta);
        
        // Only handle input if round is active
        if (this.roundActive) {
            this.handleInput(delta);
        }
        
        // AI only updates during active round
        if (this.roundActive && !this.roundEnded) {
            this.aiController?.update?.(delta);
            this.handleAIActions();
        }
        
        this.updatePressureRing(delta);
        this.updateSmokes(delta);
        
        // Only auto-fire if round is active
        if (this.roundActive && !this.roundEnded) {
            this.handleAutoFire(time);
        }
        
        this.updateHUD();
        this.updateMinimap();
        
        // Only rotate player if active and round not ended
        if (this.player?.active && !this.roundEnded && this.roundActive) {
            this.player.rotation = this.aimAngle;
        }
        
        // Check for clutch/exciting moments
        if (this.roundActive && !this.roundEnded) {
            this.checkExcitingMoments(delta);
        }
    }
    
    // Check for clutch/dramatic moments
    checkExcitingMoments(delta) {
        // Throttle checks
        this.lastClutchCheck += delta;
        if (this.lastClutchCheck < 500) return;
        this.lastClutchCheck = 0;
        
        const lowTime = this.roundTime < 10;
        const lowHP = this.playerHP < 30;
        const aiLowHP = this.aiHP < 30;
        const bombTense = this.bombPlanted && this.bombTimer < 8;
        
        // Clutch mode: low time or low HP
        const wasClutch = this.clutchMode;
        this.clutchMode = (lowTime || lowHP || bombTense) && this.roundActive;
        
        // Entering clutch - show indicator
        if (this.clutchMode && !wasClutch) {
            this.showClutchIndicator();
        }
        
        // Low time warning
        if (lowTime && !this.bombPlanted && this.roundTime > 5) {
            this.timerText?.setColor?.('#ff6666');
        }
        
        // Bomb tension effect
        if (bombTense) {
            this.bombStatusText?.setScale?.(1 + Math.sin(Date.now() * 0.01) * 0.1);
        }
    }
    
    showClutchIndicator() {
        const { width, height } = this.cameras.main;
        
        const clutchText = this.add.text(width / 2, 110, '⚡ CLUTCH MODE ⚡', {
            font: 'bold 18px Arial',
            fill: '#ff3366',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(150).setScrollFactor(0).setAlpha(0);
        
        this.tweens.add({
            targets: clutchText,
            alpha: 1,
            duration: 200,
            yoyo: true,
            repeat: 2,
            onComplete: () => clutchText?.destroy?.()
        });
    }
    
    // Show slow-mo effect for final kill
    showSlowMoKill(killerX, killerY, victimX, victimY) {
        if (this.slowMoActive) return;
        this.slowMoActive = true;
        
        // Slow down time briefly
        this.time.timeScale = 0.3;
        this.physics.world.timeScale = 0.3;
        
        // Dramatic camera effect
        this.cameras.main.zoomTo(2, 400);
        
        // Reset after delay
        this.time.delayedCall(600, () => {
            this.time.timeScale = 1;
            this.physics.world.timeScale = 1;
            this.cameras.main.zoomTo(1.5, 300);
            this.slowMoActive = false;
        }, [], this);
    }
    
    updateTimers(delta) {
        if (this.inBuyPhase) {
            this.buyPhaseTime -= delta / 1000;
            if (this.buyPhaseTime <= 0) {
                this.endBuyPhase();
            }
        } else if (this.roundActive && !this.roundEnded) {
            this.roundTime -= delta / 1000;
            
            if (this.bombPlanted) {
                this.bombTimer -= delta / 1000;
                if (this.bombTimer <= 0) {
                    this.bombExplodes();
                }
            } else if (this.roundTime <= 0) {
                this.roundTimeUp();
            }
            
            if (CONFIG.ROUND_TIME - this.roundTime >= CONFIG.RING_START_TIME) {
                this.ringActive = true;
            }
        }
    }
    
    handleInput(delta) {
        if (!this.roundActive || this.roundEnded || !this.player?.body) return;
        
        let vx = 0, vy = 0;
        const baseSpeed = this.playerSpeed;
        
        if (this.wasd?.A?.isDown) vx -= 1;
        if (this.wasd?.D?.isDown) vx += 1;
        if (this.wasd?.W?.isDown) vy -= 1;
        if (this.wasd?.S?.isDown) vy += 1;
        
        if (this.joystickActive) {
            vx += this.joystickVector?.x ?? 0;
            vy += this.joystickVector?.y ?? 0;
        }
        
        const len = Math.sqrt(vx * vx + vy * vy);
        if (len > 0) {
            vx /= len;
            vy /= len;
        }
        
        let speed = baseSpeed;
        const sprintKey = this.wasd?.SHIFT?.isDown || this.isSprinting;
        
        // Rusher class sprint bonus
        let sprintMult = CONFIG.SPRINT_MULTIPLIER;
        let sprintDrain = CONFIG.SPRINT_DRAIN;
        if (this.playerClass?.id === 'rusher') {
            sprintMult *= 1.25;
            sprintDrain *= 0.8;
        }
        
        if (sprintKey && this.playerStamina > 0 && len > 0) {
            speed *= sprintMult;
            this.playerStamina -= sprintDrain * (delta / 1000);
        } else if (this.playerStamina < CONFIG.MAX_STAMINA) {
            this.playerStamina += CONFIG.SPRINT_REGEN * (delta / 1000);
        }
        this.playerStamina = Phaser.Math.Clamp(this.playerStamina, 0, CONFIG.MAX_STAMINA);
        
        this.player.body.setVelocity(vx * speed, vy * speed);
        
        // Tank class fortify - reduced damage when stationary
        this.isStationary = len < 0.1;
        
        if (len > 0.1 && (this.isPlanting || this.isDefusing)) {
            this.cancelAction();
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.wasd?.SPACE)) {
            this.startAction();
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.wasd?.E)) {
            this.useSmoke();
        }
        
        this.updateActionProgress(delta);
    }
    
    handleAutoFire(time) {
        if (!this.roundActive || this.roundEnded) return;
        
        if (!this.isTouchDevice && this.isFiring) {
            this.firePlayerWeapon(time);
            return;
        }
        
        if (this.isTouchDevice && this.isFiring && this.ai?.active) {
            const angleToAI = Phaser.Math.Angle.Between(this.player?.x ?? 0, this.player?.y ?? 0, this.ai.x, this.ai.y);
            const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(this.aimAngle - angleToAI));
            
            if (angleDiff < 0.5 && this.checkPlayerLOS()) {
                this.firePlayerWeapon(time);
            }
        }
    }
    
    checkPlayerLOS() {
        if (!this.player || !this.ai) return false;
        
        const ray = new Phaser.Geom.Line(this.player.x, this.player.y, this.ai.x, this.ai.y);
        
        for (const wall of this.walls?.getChildren?.() ?? []) {
            if (!wall?.active) continue;
            const rect = new Phaser.Geom.Rectangle(
                wall.x - (wall.displayWidth ?? 0) / 2,
                wall.y - (wall.displayHeight ?? 0) / 2,
                wall.displayWidth ?? 0,
                wall.displayHeight ?? 0
            );
            if (Phaser.Geom.Intersects.LineToRectangle(ray, rect)) return false;
        }
        
        for (const smoke of this.smokes ?? []) {
            if (!smoke?.active) continue;
            const circle = new Phaser.Geom.Circle(smoke.x, smoke.y, CONFIG.SMOKE_RADIUS);
            if (Phaser.Geom.Intersects.LineToCircle(ray, circle)) return false;
        }
        
        return true;
    }
    
    firePlayerWeapon(time) {
        if (this.roundEnded) return;
        
        const weapon = this.playerWeapon ?? WEAPONS.pistol;
        if (time - this.lastFireTime < weapon.fireRate) return;
        this.lastFireTime = time;
        
        // Assault class steady aim when stationary
        let spreadMod = 1;
        if (this.playerClass?.id === 'assault' && this.isStationary) {
            spreadMod = 0.5;
        }
        
        const spread = (Math.random() - 0.5) * weapon.spread * spreadMod;
        const angle = this.aimAngle + spread;
        
        const bullet = this.playerBullets?.get?.(this.player?.x ?? 0, this.player?.y ?? 0, 'bullet');
        if (bullet) {
            bullet.setActive(true).setVisible(true);
            bullet.damage = weapon.damage;
            
            // Sniper class range bonus
            let range = weapon.range;
            if (this.playerClass?.id === 'sniper') {
                range *= 1.3;
            }
            
            const speed = 600;
            bullet.body?.setVelocity?.(Math.cos(angle) * speed, Math.sin(angle) * speed);
            
            this.time.delayedCall(range / speed * 1000, () => {
                bullet?.destroy?.();
            });
        }
        
        // Muzzle flash effect
        this.createMuzzleFlash(this.player?.x ?? 0, this.player?.y ?? 0, angle);
        
        this.playSound('shoot');
    }
    
    createMuzzleFlash(x, y, angle) {
        const flashX = x + Math.cos(angle) * 20;
        const flashY = y + Math.sin(angle) * 20;
        
        const flash = this.add.graphics().setDepth(15);
        flash.fillStyle(0xffff00, 0.9);
        flash.fillCircle(flashX, flashY, 8);
        flash.fillStyle(0xffffff, 1);
        flash.fillCircle(flashX, flashY, 4);
        
        // Quick fade
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 50,
            onComplete: () => flash?.destroy?.()
        });
    }
    
    fireAIWeapon(ai) {
        if (!ai?.active || !this.player?.active || this.roundEnded) return;
        
        const weapon = ai?.weapon ?? WEAPONS.pistol;
        const accuracy = this.aiDifficulty?.accuracy ?? 0.7;
        const spread = (Math.random() - 0.5) * weapon.spread * (2.5 - accuracy);
        const angle = (ai?.rotation ?? 0) + spread;
        
        const bullet = this.aiBullets?.get?.(ai?.x ?? 0, ai?.y ?? 0, 'bullet');
        if (bullet) {
            bullet.setActive(true).setVisible(true);
            bullet.damage = weapon.damage;
            bullet.setTint(0xff6600);
            const speed = 550;
            bullet.body?.setVelocity?.(Math.cos(angle) * speed, Math.sin(angle) * speed);
            
            this.time.delayedCall((weapon.range ?? 400) / speed * 1000, () => {
                bullet?.destroy?.();
            });
        }
        
        // Muzzle flash for AI
        this.createMuzzleFlash(ai?.x ?? 0, ai?.y ?? 0, angle);
        
        this.playSound('shoot');
    }
    
    hitPlayer(bullet) {
        console.log('[CRITICAL] hitPlayer called - roundEnded:', this.roundEnded, 'roundActive:', this.roundActive, 'player.active:', this.player?.active, 'playerHP:', this.playerHP);
        
        // CRITICAL GUARD: Don't process if round already ended or player is dead
        if (this.roundEnded) {
            console.log('[CRITICAL] hitPlayer BLOCKED - roundEnded is true');
            bullet?.destroy?.();
            return;
        }
        if (!this.player?.active) {
            console.log('[CRITICAL] hitPlayer BLOCKED - player not active');
            bullet?.destroy?.();
            return;
        }
        if (this.playerHP <= 0) {
            console.log('[CRITICAL] hitPlayer BLOCKED - playerHP already <= 0');
            bullet?.destroy?.();
            return;
        }
        
        let damage = bullet?.damage ?? 20;
        console.log('[CRITICAL] Processing damage:', damage, 'Current HP:', this.playerHP);
        bullet?.destroy?.();
        
        // Tank class fortify - reduced damage when stationary
        if (this.playerClass?.id === 'tank' && this.isStationary) {
            damage = Math.floor(damage * 0.7);
        }
        
        this.playerHP -= damage;
        this.player.hp = this.playerHP;
        console.log('[CRITICAL] HP after damage:', this.playerHP);
        
        // CHECK FOR DEATH IMMEDIATELY - BEFORE any visual effects
        if (this.playerHP <= 0) {
            console.log('[CRITICAL] *** PLAYER HP <= 0! CALLING playerDied() IMMEDIATELY ***');
            this.playerDied();
            return; // Exit immediately - don't do visual effects after death
        }
        
        // Visual feedback - flash red (only if still alive)
        this.player?.setTint?.(0xff0000);
        this.time.delayedCall(100, () => {
            if (!this.roundEnded && this.player?.active) {
                this.player?.setTint?.(this.playerClass?.color ?? CONFIG.COLORS.DEFENDER);
            }
        });
        
        // Camera shake when hit (if enabled)
        if (SaveSystem.getScreenShake()) {
            this.cameras.main.shake(100, 0.008);
        }
        
        // Screen red flash overlay
        const redFlash = this.add.rectangle(
            this.cameras.main.width / 2, 
            this.cameras.main.height / 2, 
            this.cameras.main.width, 
            this.cameras.main.height, 
            0xff0000, 0.2
        ).setDepth(500).setScrollFactor(0);
        this.tweens.add({
            targets: redFlash,
            alpha: 0,
            duration: 200,
            onComplete: () => redFlash?.destroy?.()
        });
        
        // Show damage number (if enabled)
        if (SaveSystem.getShowDamageNumbers()) {
            this.showDamageNumber(this.player?.x ?? 0, this.player?.y ?? 0, damage, true);
        }
        
        // Show hit marker on attacker's side
        this.showHitMarker(this.ai?.x ?? 0, this.ai?.y ?? 0);
        
        // Track damage stat
        SaveSystem.recordDamageTaken(damage);
        this.roundStats.damageTaken += damage;
        
        if (this.isPlanting || this.isDefusing) {
            this.cancelAction();
        }
        
        this.updateHPBar();
        this.playSound('hit');
    }
    
    hitAI(bullet) {
        console.log('[CRITICAL] hitAI called - roundEnded:', this.roundEnded, 'roundActive:', this.roundActive, 'ai.active:', this.ai?.active, 'aiHP:', this.aiHP);
        
        // CRITICAL GUARD: Don't process if round already ended or AI is dead
        if (this.roundEnded) {
            console.log('[CRITICAL] hitAI BLOCKED - roundEnded is true');
            bullet?.destroy?.();
            return;
        }
        if (!this.ai?.active) {
            console.log('[CRITICAL] hitAI BLOCKED - AI not active');
            bullet?.destroy?.();
            return;
        }
        if (this.aiHP <= 0) {
            console.log('[CRITICAL] hitAI BLOCKED - aiHP already <= 0');
            bullet?.destroy?.();
            return;
        }
        
        const damage = bullet?.damage ?? 20;
        console.log('[CRITICAL] Processing AI damage:', damage, 'Current AI HP:', this.aiHP);
        bullet?.destroy?.();
        
        this.aiHP -= damage;
        this.ai.hp = this.aiHP;
        console.log('[CRITICAL] AI HP after damage:', this.aiHP);
        
        // CHECK FOR DEATH IMMEDIATELY - BEFORE any visual effects
        if (this.aiHP <= 0) {
            console.log('[CRITICAL] *** AI HP <= 0! CALLING aiDied() IMMEDIATELY ***');
            this.aiDied();
            return; // Exit immediately - don't do visual effects after death
        }
        
        // Visual feedback - flash red (only if still alive)
        this.ai?.setTint?.(0xff0000);
        this.time.delayedCall(100, () => {
            if (!this.roundEnded && this.ai?.active) {
                this.ai?.setTint?.(CONFIG.COLORS.ATTACKER);
            }
        });
        
        // Show damage number (if enabled)
        if (SaveSystem.getShowDamageNumbers()) {
            this.showDamageNumber(this.ai?.x ?? 0, this.ai?.y ?? 0, damage, false);
        }
        
        // Show hit marker
        this.showHitMarker(this.player?.x ?? 0, this.player?.y ?? 0);
        
        // Track damage stat
        SaveSystem.recordDamageDealt(damage);
        SaveSystem.recordShotHit();
        this.roundStats.damageDealt += damage;
        this.roundStats.shotsHit++;
        
        this.aiController?.cancelAction?.();
        this.playSound('hit');
    }
    
    showDamageNumber(x, y, damage, isPlayer) {
        const dmgText = this.add.text(x, y - 20, `-${damage}`, {
            font: 'bold 18px Arial',
            fill: isPlayer ? '#ff3366' : '#ffcc00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(150);
        
        this.tweens.add({
            targets: dmgText,
            y: y - 60,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => dmgText?.destroy?.()
        });
    }
    
    showHitMarker(x, y) {
        const marker = this.add.text(x, y - 30, '✖', {
            font: 'bold 20px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(150);
        
        this.tweens.add({
            targets: marker,
            scale: 1.5,
            alpha: 0,
            duration: 200,
            onComplete: () => marker?.destroy?.()
        });
    }
    
    showKillNotification(text, color) {
        this.killNotification?.setText?.(text);
        this.killNotification?.setColor?.(color);
        this.killNotification?.setAlpha?.(1);
        
        this.tweens.add({
            targets: this.killNotification,
            alpha: 0,
            duration: 2000,
            delay: 1000
        });
    }
    
    addToKillFeed(killer, victim, method) {
        const feedText = `${killer} ${method} ${victim}`;
        const isPlayerKill = killer === 'YOU';
        
        const entry = this.add.container(0, 0).setScrollFactor(0);
        
        const bg = this.add.graphics();
        bg.fillStyle(isPlayerKill ? 0x00ff88 : 0xff3366, 0.3);
        bg.fillRoundedRect(-180, -12, 180, 24, 4);
        
        const text = this.add.text(-10, 0, feedText, {
            font: 'bold 11px Arial',
            fill: isPlayerKill ? '#00ff88' : '#ff3366'
        }).setOrigin(1, 0.5);
        
        entry.add([bg, text]);
        
        // Add to container
        this.killFeedContainer?.add?.(entry);
        this.killFeed.push(entry);
        
        // Reposition all entries
        this.killFeed.forEach((e, i) => {
            e?.setPosition?.(0, i * 28);
        });
        
        // Animate in
        entry.setAlpha(0);
        this.tweens.add({
            targets: entry,
            alpha: 1,
            x: 0,
            duration: 200
        });
        
        // Remove after delay
        this.time.delayedCall(4000, () => {
            this.tweens.add({
                targets: entry,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    const idx = this.killFeed.indexOf(entry);
                    if (idx > -1) this.killFeed.splice(idx, 1);
                    entry?.destroy?.();
                    // Reposition remaining
                    this.killFeed.forEach((e, i) => {
                        e?.setPosition?.(0, i * 28);
                    });
                }
            });
        });
    }
    
    showAICallout(message) {
        const now = Date.now();
        if (now - this.lastAICallout < 3000) return; // Throttle callouts
        this.lastAICallout = now;
        
        this.aiCalloutText?.setText?.(`🤖 AI: "${message}"`);
        this.aiCalloutText?.setAlpha?.(1);
        
        this.tweens.add({
            targets: this.aiCalloutText,
            alpha: 0,
            duration: 500,
            delay: 2000
        });
    }
    
    startAction() {
        if (!this.roundActive || this.roundEnded) return;
        
        if (this.playerIsAttacker) {
            if (!this.bombPlanted && this.isNearBombSite()) {
                this.isPlanting = true;
                this.plantProgress = 0;
            }
        } else {
            if (this.bombPlanted && this.isNearBomb()) {
                this.isDefusing = true;
                this.defuseProgress = 0;
            }
        }
    }
    
    cancelAction() {
        this.isPlanting = false;
        this.isDefusing = false;
        this.plantProgress = 0;
        this.defuseProgress = 0;
    }
    
    updateActionProgress(delta) {
        if (this.isPlanting) {
            this.plantProgress += delta / 1000;
            if (this.plantProgress >= CONFIG.PLANT_TIME) {
                this.plantBomb();
            }
        }
        
        if (this.isDefusing) {
            this.defuseProgress += delta / 1000;
            if (this.defuseProgress >= CONFIG.DEFUSE_TIME) {
                this.defuseBomb();
            }
        }
        
        if (this.aiController?.getWantsToPlant?.() && !this.bombPlanted) {
            this.aiPlantProgress = (this.aiPlantProgress ?? 0) + delta / 1000;
            if (this.aiPlantProgress >= CONFIG.PLANT_TIME) {
                this.aiBombPlant();
            }
        } else {
            this.aiPlantProgress = 0;
        }
        
        if (this.aiController?.getWantsToDefuse?.() && this.bombPlanted) {
            this.aiDefuseProgress = (this.aiDefuseProgress ?? 0) + delta / 1000;
            if (this.aiDefuseProgress >= CONFIG.DEFUSE_TIME) {
                this.aiBombDefuse();
            }
        } else {
            this.aiDefuseProgress = 0;
        }
    }
    
    isNearBombSite() {
        return Phaser.Math.Distance.Between(
            this.player?.x ?? 0, this.player?.y ?? 0,
            this.bombSite?.x ?? 0, this.bombSite?.y ?? 0
        ) < 70;
    }
    
    isNearBomb() {
        return this.plantedBomb && Phaser.Math.Distance.Between(
            this.player?.x ?? 0, this.player?.y ?? 0,
            this.plantedBomb?.x ?? 0, this.plantedBomb?.y ?? 0
        ) < 50;
    }
    
    plantBomb() {
        this.isPlanting = false;
        this.bombPlanted = true;
        this.playerPlanted = true;
        this.bombTimer = CONFIG.BOMB_TIMER;
        
        this.plantedBomb = this.add.image(this.bombSite?.x ?? 400, this.bombSite?.y ?? 120, 'bomb').setDepth(5);
        
        this.tweens.add({
            targets: this.plantedBomb,
            alpha: 0.3,
            yoyo: true,
            repeat: -1,
            duration: 500
        });
        
        this.showMessage('💣 BOMB PLANTED!', 1500);
        this.playSound('plant');
        
        // Record stat and add to kill feed
        SaveSystem.recordBombPlanted();
        this.addToKillFeed('YOU', 'BOMB', '💣');
    }
    
    aiBombPlant() {
        if (this.aiController) {
            this.aiController.wantsToPlant = false;
            this.aiController.isPlanting = false;
            this.aiController.state = 'moving';
        }
        this.aiPlantProgress = 0;
        
        this.bombPlanted = true;
        this.bombTimer = CONFIG.BOMB_TIMER;
        
        this.plantedBomb = this.add.image(this.bombSite?.x ?? 400, this.bombSite?.y ?? 120, 'bomb').setDepth(5);
        this.tweens.add({
            targets: this.plantedBomb,
            alpha: 0.3,
            yoyo: true,
            repeat: -1,
            duration: 500
        });
        
        this.showMessage('💣 BOMB PLANTED!', 1500);
        this.playSound('plant');
        
        // Add to kill feed and AI callout
        this.addToKillFeed('AI', 'BOMB', '💣');
        this.showAICallout('Bomb planted! Defend!');
    }
    
    defuseBomb() {
        this.isDefusing = false;
        this.bombPlanted = false;
        this.playerDefused = true;
        
        this.plantedBomb?.destroy?.();
        this.showMessage('✅ BOMB DEFUSED!', 1500);
        this.playSound('defuse');
        
        // Record stat and add to kill feed
        SaveSystem.recordBombDefused();
        this.addToKillFeed('YOU', 'BOMB', '🛡️');
        
        this.endRound(true, 'defuse');
    }
    
    aiBombDefuse() {
        if (this.aiController) {
            this.aiController.wantsToDefuse = false;
            this.aiController.isDefusing = false;
            this.aiController.state = 'idle';
        }
        this.aiDefuseProgress = 0;
        
        this.bombPlanted = false;
        this.plantedBomb?.destroy?.();
        
        this.showMessage('❌ BOMB DEFUSED!', 1500);
        this.playSound('defuse');
        
        // Add to kill feed and AI callout
        this.addToKillFeed('AI', 'BOMB', '🛡️');
        this.showAICallout('Bomb defused!');
        
        this.endRound(false, 'ai_defuse');
    }
    
    bombExplodes() {
        if (this.roundEnded) return;
        
        // Create explosion effect
        this.createExplosion(this.plantedBomb?.x ?? this.bombSite?.x ?? 400, this.plantedBomb?.y ?? this.bombSite?.y ?? 200);
        
        this.plantedBomb?.destroy?.();
        this.showMessage('💥 BOMB EXPLODED!', 1500);
        this.playSound('explode');
        
        // Add to kill feed
        this.addToKillFeed('BOMB', 'SITE', '💥');
        
        // Camera shake on explosion
        if (SaveSystem.getScreenShake()) {
            this.cameras.main.shake(500, 0.03);
        }
        
        this.endRound(this.playerIsAttacker, 'explode');
    }
    
    createExplosion(x, y) {
        // Multiple explosion circles
        for (let i = 0; i < 3; i++) {
            const circle = this.add.circle(x, y, 20, 0xff6600, 0.8).setDepth(50);
            this.tweens.add({
                targets: circle,
                scale: { from: 1, to: 4 + i },
                alpha: { from: 0.8, to: 0 },
                duration: 400 + i * 100,
                delay: i * 50,
                ease: 'Power2',
                onComplete: () => circle?.destroy?.()
            });
        }
        
        // Particle-like debris
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 200;
            const particle = this.add.circle(
                x, y,
                2 + Math.random() * 4,
                Phaser.Math.Between(0xff3300, 0xffff00),
                1
            ).setDepth(51);
            
            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0.2,
                duration: 500 + Math.random() * 300,
                ease: 'Power2',
                onComplete: () => particle?.destroy?.()
            });
        }
        
        // Screen flash
        const { width, height } = this.cameras.main;
        const flash = this.add.rectangle(width / 2, height / 2, width, height, 0xff6600, 0.4)
            .setDepth(500).setScrollFactor(0);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 300,
            onComplete: () => flash?.destroy?.()
        });
    }
    
    roundTimeUp() {
        if (this.roundEnded) return;
        
        this.showMessage('⏰ TIME UP!', 1500);
        this.endRound(!this.playerIsAttacker, 'timeout');
    }
    
    playerDied() {
        console.log('[DEBUG] >>> playerDied() CALLED! roundEnded was:', this.roundEnded);
        
        if (this.roundEnded) {
            console.log('[DEBUG] playerDied BLOCKED - round already ended');
            return;
        }
        
        console.log('[DEBUG] >>> ENDING ROUND - Player died! Setting all flags...');
        
        // IMMEDIATELY end the round - SET THESE FIRST
        this.roundEnded = true;
        this.roundActive = false;
        this.isFiring = false;
        this.isPlanting = false;
        this.isDefusing = false;
        
        console.log('[DEBUG] Flags set: roundEnded=', this.roundEnded, 'roundActive=', this.roundActive);
        
        // Stop all movement immediately
        this.player?.body?.setVelocity?.(0, 0);
        this.ai?.body?.setVelocity?.(0, 0);
        
        // Disable player physics body to prevent further collisions
        if (this.player?.body) {
            this.player.body.enable = false;
        }
        
        console.log('[DEBUG] Player and AI velocities stopped, player body disabled');
        
        // Death animation
        this.tweens.add({
            targets: this.player,
            alpha: 0,
            scale: 0.3,
            rotation: (this.player?.rotation ?? 0) + Math.PI,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
                this.player?.setActive?.(false)?.setVisible?.(false);
            }
        });
        
        // Camera shake (if enabled)
        if (SaveSystem.getScreenShake()) {
            this.cameras.main.shake(300, 0.02);
        }
        
        this.showMessage('💀 YOU DIED!', 1500);
        this.showKillNotification('ELIMINATED', '#ff3366');
        
        // Add to kill feed with AI name
        this.addToKillFeed(this.aiName ?? 'AI', 'YOU', '🔫');
        
        // Record death stat
        SaveSystem.recordDeath();
        
        // Notify AI systems
        this.aiController?.onKill?.();
        
        // AI callout with personality
        const callout = AIPersonality.getCallout('gotKill', AIPersonality.shouldTaunt());
        this.showAICallout(callout ?? 'Target neutralized!');
        
        console.log('[DEBUG] Calling endRound(false, "eliminated")');
        this.endRound(false, 'eliminated');
        console.log('[DEBUG] endRound completed for player death');
    }
    
    aiDied() {
        if (this.roundEnded) return;
        
        // IMMEDIATELY end the round
        this.roundEnded = true;
        this.roundActive = false;
        this.isFiring = false;
        this.isPlanting = false;
        this.isDefusing = false;
        
        // Stop all movement immediately
        this.player?.body?.setVelocity?.(0, 0);
        this.ai?.body?.setVelocity?.(0, 0);
        
        // Notify AI systems of death
        this.aiController?.onDeath?.();
        
        // Show slow-mo for final kill (if clutch or close fight)
        if (this.clutchMode || (this.playerHP < 50)) {
            this.showSlowMoKill(
                this.player?.x ?? 0, this.player?.y ?? 0,
                this.ai?.x ?? 0, this.ai?.y ?? 0
            );
        }
        
        // Death animation
        this.tweens.add({
            targets: this.ai,
            alpha: 0,
            scale: 0.3,
            rotation: (this.ai?.rotation ?? 0) + Math.PI,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
                this.ai?.setActive?.(false)?.setVisible?.(false);
            }
        });
        
        // Camera shake (smaller for AI death, if enabled)
        if (SaveSystem.getScreenShake()) {
            this.cameras.main.shake(150, 0.01);
        }
        
        this.showMessage('🎯 ENEMY ELIMINATED!', 1500);
        this.showKillNotification('+1 KILL', '#00ff88');
        
        // Add to kill feed with AI name
        this.addToKillFeed('YOU', this.aiName ?? 'AI', '🔫');
        
        // Record kill stat
        SaveSystem.recordKill();
        this.matchStats.kills = (this.matchStats.kills ?? 0) + 1;
        
        // Apply heal on kill perk
        if (this.healOnKill > 0 && this.playerHP < this.basePlayerHP) {
            const healAmount = Math.min(this.healOnKill, this.basePlayerHP - this.playerHP);
            this.playerHP += healAmount;
            this.showHealEffect(healAmount);
        }
        
        this.endRound(true, 'eliminated');
    }
    
    showHealEffect(amount) {
        if (!this.player?.x) return;
        
        const healText = this.add.text(this.player.x, this.player.y - 30, `+${amount} HP`, {
            font: 'bold 16px Arial',
            fill: '#2ecc71',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(150);
        
        this.tweens.add({
            targets: healText,
            y: this.player.y - 60,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => healText?.destroy?.()
        });
    }
    
    handleAIActions() {
        if (!this.ai?.active) return;
        
        const aiIsAttacker = !this.playerIsAttacker;
        this.aiController?.setRole?.(aiIsAttacker);
    }
    
    useSmoke() {
        if (!this.playerSmokeReady || this.playerSmokeCharges <= 0) return;
        if (!this.roundActive || this.roundEnded) return;
        
        this.playerSmokeCharges--;
        this.deploySmoke(
            (this.player?.x ?? 400) + Math.cos(this.aimAngle) * 80, 
            (this.player?.y ?? 300) + Math.sin(this.aimAngle) * 80
        );
        
        if (this.playerSmokeCharges <= 0) {
            this.playerSmokeReady = false;
            this.time.delayedCall(this.playerSmokeCooldown, () => {
                this.playerSmokeReady = true;
                this.playerSmokeCharges = this.playerClass?.stats?.smokeCharges ?? 1;
            });
        }
    }
    
    deploySmoke(x, y) {
        const smoke = this.add.image(x, y, 'smoke').setDepth(8).setAlpha(0);
        smoke.active = true;
        this.smokes.push(smoke);
        
        this.tweens.add({
            targets: smoke,
            alpha: 0.8,
            scale: 1.2,
            duration: 400
        });
        
        this.time.delayedCall(CONFIG.SMOKE_DURATION - 500, () => {
            this.tweens.add({
                targets: smoke,
                alpha: 0,
                scale: 0.5,
                duration: 500,
                onComplete: () => {
                    smoke.active = false;
                    smoke?.destroy?.();
                    const idx = this.smokes.indexOf(smoke);
                    if (idx > -1) this.smokes.splice(idx, 1);
                }
            });
        });
        
        this.playSound('smoke');
    }
    
    updateSmokes(delta) {
        // Smokes handled by timed events
    }
    
    updatePressureRing(delta) {
        if (!this.ringActive) {
            this.ringGraphics?.clear?.();
            return;
        }
        
        this.ringRadius -= CONFIG.RING_SHRINK_RATE * (delta / 1000);
        this.ringRadius = Math.max(100, this.ringRadius);
        
        const cx = this.bombSite?.x ?? 400;
        const cy = this.bombSite?.y ?? 120;
        
        this.ringGraphics?.clear?.();
        this.ringGraphics?.lineStyle?.(4, 0xff0000, 0.6);
        this.ringGraphics?.strokeCircle?.(cx, cy, this.ringRadius);
        
        // Add pulsing danger zone outside ring
        this.ringGraphics?.lineStyle?.(2, 0xff0000, 0.3);
        this.ringGraphics?.strokeCircle?.(cx, cy, this.ringRadius + 10);
        
        if (this.player?.active && !this.roundEnded) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, cx, cy);
            if (dist > this.ringRadius) {
                this.playerHP -= CONFIG.RING_DAMAGE * (delta / 1000);
                this.player.hp = this.playerHP;
                this.updateHPBar();
                if (this.playerHP <= 0) {
                    this.playerDied();
                }
            }
        }
        
        if (this.ai?.active && !this.roundEnded) {
            const dist = Phaser.Math.Distance.Between(this.ai.x, this.ai.y, cx, cy);
            if (dist > this.ringRadius) {
                this.aiHP -= CONFIG.RING_DAMAGE * (delta / 1000);
                this.ai.hp = this.aiHP;
                if (this.aiHP <= 0) {
                    this.aiDied();
                }
            }
        }
        
        this.ringWarning?.setAlpha?.(1);
    }
    
    updateHUD() {
        const mins = Math.floor(Math.max(0, this.roundTime) / 60);
        const secs = Math.floor(Math.max(0, this.roundTime) % 60);
        this.timerText?.setText?.(`${mins}:${secs.toString().padStart(2, '0')}`);
        
        this.scoreText?.setText?.(`${this.playerScore} - ${this.aiScore}`);
        this.hpText?.setText?.(`❤️ ${Math.ceil(Math.max(0, this.playerHP))}`);
        this.creditsText?.setText?.(`💰 ${this.playerCredits}`);
        
        this.roleText?.setText?.(this.playerIsAttacker ? '⚔️ ATTACKER' : '🛡️ DEFENDER');
        this.roleText?.setColor?.(this.playerIsAttacker ? '#ff6b35' : '#00d4ff');
        
        if (this.bombPlanted) {
            this.bombStatusText?.setText?.(`💣 ${Math.ceil(this.bombTimer)}s`);
            this.bombStatusText?.setColor?.('#ff3366');
        } else {
            this.bombStatusText?.setText?.(this.playerIsAttacker ? 'Plant the bomb!' : 'Defend the site!');
            this.bombStatusText?.setColor?.('#fdcb6e');
        }
        
        if (this.playerSmokeReady && this.playerSmokeCharges > 0) {
            this.smokeCDText?.setText?.(`💨 x${this.playerSmokeCharges}`);
            this.smokeCDText?.setColor?.('#00ff88');
        } else {
            this.smokeCDText?.setText?.('💨 ...');
            this.smokeCDText?.setColor?.('#ff6666');
        }
        
        this.progressBar?.clear?.();
        if (this.isPlanting || this.isDefusing) {
            const progress = this.isPlanting ? 
                this.plantProgress / CONFIG.PLANT_TIME : 
                this.defuseProgress / CONFIG.DEFUSE_TIME;
            const { width, height } = this.cameras.main;
            
            this.progressBar?.fillStyle?.(0x000000, 0.8);
            this.progressBar?.fillRoundedRect?.(width / 2 - 102, height - 62, 204, 24, 6);
            this.progressBar?.fillStyle?.(this.isPlanting ? 0xff6b35 : 0x00d4ff, 1);
            this.progressBar?.fillRoundedRect?.(width / 2 - 100, height - 60, 200 * progress, 20, 4);
        }
        
        if (this.inBuyPhase) {
            this.timerText?.setText?.(`🛒 BUY: ${Math.ceil(this.buyPhaseTime)}s`);
        }
    }
    
    showMessage(text, duration) {
        this.centerText?.setText?.(text);
        this.centerText?.setAlpha?.(1);
        this.centerText?.setScale?.(0.5);
        
        this.tweens.add({
            targets: this.centerText,
            scale: 1,
            duration: 200,
            ease: 'Back.easeOut'
        });
        
        this.time.delayedCall(duration, () => {
            this.tweens.add({
                targets: this.centerText,
                alpha: 0,
                scale: 0.8,
                duration: 300
            });
        });
    }
    
    startRound() {
        console.log('[ROUND] startRound called - starting round', this.roundNumber + 1);
        
        this.roundNumber++;
        this.roundTime = CONFIG.ROUND_TIME;
        this.buyPhaseTime = CONFIG.BUY_PHASE_TIME;
        this.inBuyPhase = true;
        this.roundActive = false;
        this.roundEnded = false;
        this.roundEndProcessed = false; // CRITICAL: Reset this for new round
        this.bombPlanted = false;
        this.bombTimer = CONFIG.BOMB_TIMER;
        this.ringActive = false;
        this.ringRadius = 600;
        this.isPlanting = false;
        this.isDefusing = false;
        this.plantProgress = 0;
        this.defuseProgress = 0;
        this.aiPlantProgress = 0;
        this.aiDefuseProgress = 0;
        
        // Reset HP
        this.playerHP = this.basePlayerHP;
        this.aiHP = CONFIG.PLAYER_HP;
        this.updateHPBar();
        
        // Reset positions
        const playerSpawn = this.playerIsAttacker ? this.attackerSpawn : this.defenderSpawn;
        const aiSpawn = this.playerIsAttacker ? this.defenderSpawn : this.attackerSpawn;
        
        this.player?.setPosition?.(playerSpawn?.x ?? 400, playerSpawn?.y ?? 520);
        this.player?.setActive?.(true)?.setVisible?.(true);
        this.player?.setAlpha?.(1);
        this.player?.setScale?.(1);
        this.player?.setRotation?.(0);
        this.player?.body?.setVelocity?.(0, 0);
        this.player?.setTint?.(this.playerClass?.color ?? CONFIG.COLORS.DEFENDER);
        this.player.hp = this.playerHP;
        
        // Re-enable player physics body (it was disabled on death)
        if (this.player?.body) {
            this.player.body.enable = true;
        }
        
        this.ai?.setPosition?.(aiSpawn?.x ?? 400, aiSpawn?.y ?? 180);
        this.ai?.setActive?.(true)?.setVisible?.(true);
        this.ai?.setAlpha?.(1);
        this.ai?.setScale?.(1);
        this.ai?.setRotation?.(0);
        this.ai?.body?.setVelocity?.(0, 0);
        this.ai?.setTint?.(CONFIG.COLORS.ATTACKER);
        this.ai.hp = this.aiHP;
        
        // Re-enable AI physics body
        if (this.ai?.body) {
            this.ai.body.enable = true;
        }
        
        // Re-start camera follow
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        
        // Reset AI controller
        this.aiController = new AIController(this, this.ai, this.player, this.aiDifficulty);
        this.aiController?.setRole?.(!this.playerIsAttacker);
        this.aiController?.updateMatchState?.(this.roundNumber, this.playerScore, this.aiScore);
        
        // Track round start for learning system
        this.roundStartTime = Date.now();
        this.roundStartPos = { x: this.player?.x ?? 0, y: this.player?.y ?? 0 };
        
        // Reset clutch mode
        this.clutchMode = false;
        
        // Show match intro on first round
        if (this.roundNumber === 1 && !this.introShown) {
            this.introShown = true;
            this.showMatchIntro();
        } else {
            // Show round transition
            this.showRoundTransition();
        }
    }
    
    showMatchIntro() {
        const { width, height } = this.cameras.main;
        
        // Darken screen
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9)
            .setDepth(200).setScrollFactor(0);
        
        // Match mode text
        const modeText = this.add.text(width / 2, height / 3 - 60, 
            this.matchMode === 'ranked' ? '⚔️ RANKED MATCH' : '🎮 TRAINING MODE', {
            font: 'bold 28px Arial',
            fill: this.matchMode === 'ranked' ? '#ffd700' : '#2ecc71'
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0).setAlpha(0);
        
        // Class display
        const classText = this.add.text(width / 2, height / 3, 
            `${this.playerClass?.icon ?? '⚔️'} ${this.playerClass?.name ?? 'Assault'}`, {
            font: 'bold 24px Arial',
            fill: '#' + ((this.playerClass?.color ?? 0x3498db).toString(16).padStart(6, '0'))
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0).setAlpha(0);
        
        // Role display
        const roleText = this.add.text(width / 2, height / 3 + 40, 
            this.playerIsAttacker ? '💣 ATTACKING' : '🛡️ DEFENDING', {
            font: 'bold 20px Arial',
            fill: this.playerIsAttacker ? '#ff6b35' : '#00d4ff'
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0).setAlpha(0);
        
        // Animate in sequence
        this.tweens.add({ targets: modeText, alpha: 1, y: height / 3 - 50, duration: 400, ease: 'Back.easeOut' });
        this.tweens.add({ targets: classText, alpha: 1, duration: 400, delay: 200, ease: 'Cubic.easeOut' });
        this.tweens.add({ targets: roleText, alpha: 1, duration: 400, delay: 400, ease: 'Cubic.easeOut' });
        
        // Countdown
        const countdownY = height / 2 + 40;
        this.time.delayedCall(1000, () => {
            const countText = this.add.text(width / 2, countdownY, '3', {
                font: 'bold 72px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5).setDepth(202).setScrollFactor(0);
            
            this.tweens.add({
                targets: countText,
                scale: 1.3,
                alpha: 0,
                duration: 800,
                onComplete: () => {
                    countText.setText('2').setScale(1).setAlpha(1);
                    this.tweens.add({
                        targets: countText,
                        scale: 1.3,
                        alpha: 0,
                        duration: 800,
                        onComplete: () => {
                            countText.setText('1').setScale(1).setAlpha(1);
                            this.tweens.add({
                                targets: countText,
                                scale: 1.3,
                                alpha: 0,
                                duration: 800,
                                onComplete: () => {
                                    countText.setText('GO!').setScale(1).setAlpha(1).setFill('#00ff88');
                                    this.playSound('roundStart');
                                    this.tweens.add({
                                        targets: [countText, modeText, classText, roleText, overlay],
                                        alpha: 0,
                                        duration: 400,
                                        onComplete: () => {
                                            countText?.destroy?.();
                                            modeText?.destroy?.();
                                            classText?.destroy?.();
                                            roleText?.destroy?.();
                                            overlay?.destroy?.();
                                            
                                            // Show buy menu
                                            this.buyMenu?.setVisible?.(true);
                                            this.refreshBuyMenu();
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
    }
    
    showRoundTransition() {
        const { width, height } = this.cameras.main;
        
        // Round number with role
        const roleStr = this.playerIsAttacker ? '💣 ATTACK' : '🛡️ DEFEND';
        
        const roundText = this.add.text(width / 2, height / 2 - 30, `ROUND ${this.roundNumber}`, {
            font: 'bold 42px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(150).setScrollFactor(0).setAlpha(0).setScale(0.5);
        
        const roleText = this.add.text(width / 2, height / 2 + 20, roleStr, {
            font: 'bold 24px Arial',
            fill: this.playerIsAttacker ? '#ff6b35' : '#00d4ff'
        }).setOrigin(0.5).setDepth(150).setScrollFactor(0).setAlpha(0);
        
        // Animate
        this.tweens.add({
            targets: roundText,
            alpha: 1,
            scale: 1,
            duration: 400,
            ease: 'Back.easeOut'
        });
        
        this.tweens.add({
            targets: roleText,
            alpha: 1,
            duration: 300,
            delay: 200
        });
        
        // Fade out
        this.time.delayedCall(1500, () => {
            this.tweens.add({
                targets: [roundText, roleText],
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    roundText?.destroy?.();
                    roleText?.destroy?.();
                }
            });
            
            // Show buy menu
            this.buyMenu?.setVisible?.(true);
            this.refreshBuyMenu();
        });
    }
    
    refreshBuyMenu() {
        this.buyMenu?.destroy?.();
        this.buyMenu = this.createBuyMenu();
        this.buyMenu?.setVisible?.(true);
    }
    
    endBuyPhase() {
        console.log('[ROUND] endBuyPhase called - activating round', this.roundNumber);
        
        this.inBuyPhase = false;
        this.roundActive = true;
        this.roundEnded = false; // Ensure round is not ended
        this.roundEndProcessed = false; // Ensure round end not processed
        this.buyMenu?.setVisible?.(false);
        
        // Re-enable physics bodies for the new round
        if (this.player?.body) {
            this.player.body.enable = true;
        }
        if (this.ai?.body) {
            this.ai.body.enable = true;
        }
        
        console.log('[ROUND] Round', this.roundNumber, 'is now ACTIVE - roundActive:', this.roundActive, 'roundEnded:', this.roundEnded);
        
        this.showMessage('🚀 ROUND START!', 1000);
        this.playSound('roundStart');
    }
    
    endRound(playerWon, reason) {
        console.log('[ROUND] endRound called - playerWon:', playerWon, 'reason:', reason, 'wasRoundEnded:', this.roundEnded, 'score:', this.playerScore, '-', this.aiScore);
        
        // Prevent duplicate endRound calls - but allow 'eliminated' reason even if roundEnded
        // because playerDied/aiDied set roundEnded=true before calling endRound
        if (this.roundEnded && reason !== 'eliminated') {
            console.log('[ROUND] endRound BLOCKED - already ended');
            return;
        }
        
        // Prevent processing if we already processed this round's end
        if (this.roundEndProcessed) {
            console.log('[ROUND] endRound BLOCKED - already processed');
            return;
        }
        this.roundEndProcessed = true;
        
        // CRITICAL: Set flags first
        this.roundEnded = true;
        this.roundActive = false;
        this.inBuyPhase = false;
        this.isPlanting = false;
        this.isDefusing = false;
        this.isFiring = false;
        
        console.log('[ROUND] Flags set - roundEnded:', this.roundEnded, 'roundActive:', this.roundActive);
        
        // Stop all movement IMMEDIATELY
        if (this.player?.body) {
            this.player.body.setVelocity(0, 0);
            this.player.body.enable = false;
        }
        if (this.ai?.body) {
            this.ai.body.setVelocity(0, 0);
            this.ai.body.enable = false;
        }
        
        // Update scores BEFORE anything else
        const oldPlayerScore = this.playerScore;
        const oldAIScore = this.aiScore;
        
        if (playerWon) {
            this.playerScore++;
            this.playerCredits += CONFIG.WIN_CREDITS;
            this.matchStats.roundsWon = (this.matchStats.roundsWon ?? 0) + 1;
            
            // Support class regen on round win
            if (this.playerClass?.id === 'support') {
                this.basePlayerHP = Math.min(this.basePlayerHP + 5, 120);
            }
        } else {
            this.aiScore++;
            this.playerCredits += CONFIG.LOSE_CREDITS;
        }
        
        console.log('[ROUND] Score updated: ' + oldPlayerScore + '-' + oldAIScore + ' -> ' + this.playerScore + '-' + this.aiScore);
        
        if (this.playerPlanted) {
            this.playerCredits += CONFIG.PLANT_BONUS;
        }
        
        // Show round result
        this.showRoundResult(playerWon, reason);
        
        // Notify AI controller of round end for learning
        this.aiController?.onRoundEnd?.(!playerWon);
        
        // AI personality reaction
        const aiReaction = AIPersonality.getCallout(playerWon ? 'roundLose' : 'roundWin');
        if (aiReaction && Math.random() < 0.5) {
            this.time.delayedCall(1000, () => {
                this.showAICallout(aiReaction);
            });
        }
        
        // Clean up
        this.plantedBomb?.destroy?.();
        this.smokes?.forEach?.(s => s?.destroy?.());
        this.smokes = [];
        this.ringWarning?.setAlpha?.(0);
        this.ringGraphics?.clear?.();
        
        this.playSound(playerWon ? 'win' : 'lose');
        
        // Check match end - CRITICAL: Check AFTER score update
        const matchOver = this.playerScore >= CONFIG.ROUNDS_TO_WIN || this.aiScore >= CONFIG.ROUNDS_TO_WIN;
        console.log('[ROUND] Match over check: playerScore=' + this.playerScore + ', aiScore=' + this.aiScore + ', ROUNDS_TO_WIN=' + CONFIG.ROUNDS_TO_WIN + ', matchOver=' + matchOver);
        
        if (matchOver) {
            console.log('[MATCH] Match is OVER! Transitioning to results in 2500ms');
            this.time.delayedCall(2500, () => {
                console.log('[MATCH] Calling endMatch now');
                this.endMatch();
            });
        } else {
            console.log('[ROUND] Match continues, starting next round in 2500ms');
            // Swap sides
            this.playerIsAttacker = !this.playerIsAttacker;
            this.playerPlanted = false;
            this.playerDefused = false;
            
            this.time.delayedCall(2500, () => {
                console.log('[ROUND] Starting next round now');
                this.startRound();
            });
        }
    }
    
    showRoundResult(playerWon, reason) {
        const { width, height } = this.cameras.main;
        
        // Result text
        const resultStr = playerWon ? '✓ ROUND WON' : '✗ ROUND LOST';
        const resultColor = playerWon ? '#00ff88' : '#ff3366';
        
        const resultText = this.add.text(width / 2, height / 2 - 20, resultStr, {
            font: 'bold 36px Arial',
            fill: resultColor,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(150).setScrollFactor(0).setAlpha(0).setScale(0.5);
        
        // Reason text
        const reasonMap = {
            'eliminated': playerWon ? 'Enemy Eliminated' : 'You were eliminated',
            'defuse': 'Bomb Defused',
            'ai_defuse': 'Enemy Defused',
            'explode': 'Bomb Exploded',
            'timeout': 'Time Ran Out'
        };
        
        const reasonText = this.add.text(width / 2, height / 2 + 25, reasonMap[reason] ?? reason, {
            font: '18px Arial',
            fill: '#aaaaaa'
        }).setOrigin(0.5).setDepth(150).setScrollFactor(0).setAlpha(0);
        
        // Animate
        this.tweens.add({
            targets: resultText,
            alpha: 1,
            scale: 1,
            duration: 400,
            ease: 'Back.easeOut'
        });
        
        this.tweens.add({
            targets: reasonText,
            alpha: 1,
            duration: 300,
            delay: 200
        });
        
        // Fade out
        this.time.delayedCall(2000, () => {
            this.tweens.add({
                targets: [resultText, reasonText],
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    resultText?.destroy?.();
                    reasonText?.destroy?.();
                }
            });
        });
    }
    
    endMatch() {
        const playerWon = this.playerScore >= CONFIG.ROUNDS_TO_WIN;
        const objectiveBonus = this.playerPlanted || this.playerDefused;
        
        // Initialize systems if needed
        MatchHistorySystem.init();
        DailyChallengesSystem.init();
        
        // Calculate XP earned
        const xpData = {
            won: playerWon,
            kills: this.matchStats?.kills ?? 0,
            bombsPlanted: this.matchStats?.bombsPlanted ?? 0,
            bombsDefused: this.matchStats?.bombsDefused ?? 0,
            roundsWon: this.matchStats?.roundsWon ?? 0
        };
        const xpEarned = ClassProgressionSystem.calculateMatchXP(xpData);
        
        // Add XP to class and check for level up
        const levelUpResult = ClassProgressionSystem.addXP(this.selectedClass, xpEarned);
        
        // Save match to history (for ranked only)
        if (this.matchMode === 'ranked') {
            // Calculate trophy change (will be applied in ResultsScene)
            const trophyChange = playerWon ? 
                TrophySystem.calculateWinTrophies(objectiveBonus) : 
                TrophySystem.calculateLossTrophies();
            
            MatchHistorySystem.addMatch({
                won: playerWon,
                playerScore: this.playerScore,
                aiScore: this.aiScore,
                mode: this.matchMode,
                classUsed: this.selectedClass,
                trophyChange: trophyChange,
                kills: this.matchStats?.kills ?? 0,
                deaths: this.matchStats?.deaths ?? 0,
                damageDealt: this.matchStats?.damageDealt ?? 0,
                bombsPlanted: this.matchStats?.bombsPlanted ?? 0,
                bombsDefused: this.matchStats?.bombsDefused ?? 0,
                xpEarned: xpEarned
            });
            
            // Update daily challenges
            DailyChallengesSystem.onMatchEnd(playerWon, {
                kills: this.matchStats?.kills ?? 0,
                plants: this.matchStats?.bombsPlanted ?? 0,
                defuses: this.matchStats?.bombsDefused ?? 0,
                roundsWon: this.matchStats?.roundsWon ?? 0,
                damageDealt: this.matchStats?.damageDealt ?? 0,
                shotsHit: this.roundStats?.shotsHit ?? 0
            });
        }
        
        // Fade out before transitioning
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('ResultsScene', {
                mode: this.matchMode,
                playerWon,
                playerScore: this.playerScore,
                aiScore: this.aiScore,
                objectiveBonus,
                selectedClass: this.selectedClass,
                matchStats: this.matchStats,
                xpEarned: xpEarned,
                levelUpResult: levelUpResult
            });
        });
    }
    
    playSound(type) {
        if (!SaveSystem.getSoundEnabled()) return;
        
        try {
            const ctx = window.gameAudioCtx;
            if (!ctx) return;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            const sounds = {
                shoot: { freq: 800, dur: 0.05, type: 'square' },
                hit: { freq: 200, dur: 0.1, type: 'sawtooth' },
                plant: { freq: 440, dur: 0.3, type: 'sine' },
                defuse: { freq: 880, dur: 0.4, type: 'sine' },
                explode: { freq: 100, dur: 0.5, type: 'sawtooth' },
                smoke: { freq: 300, dur: 0.2, type: 'sine' },
                buy: { freq: 600, dur: 0.1, type: 'sine' },
                win: { freq: 523, dur: 0.5, type: 'sine' },
                lose: { freq: 200, dur: 0.5, type: 'sine' },
                roundStart: { freq: 660, dur: 0.2, type: 'square' }
            };
            
            const s = sounds[type] ?? sounds.shoot;
            osc.type = s.type;
            osc.frequency.value = s.freq;
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + s.dur);
            
            osc.start();
            osc.stop(ctx.currentTime + s.dur);
        } catch (e) {
            // Audio error - ignore
        }
    }
}
