// MenuScene - Main menu with mode selection and class selection
import { CONFIG } from './Config.js';
import { SaveSystem } from './SaveSystem.js';
import { TrophySystem } from './TrophySystem.js';
import { UnlockSystem } from './UnlockSystem.js';
import { AI_DIFFICULTIES } from './MatchmakerAI.js';
import { CLASSES, CLASS_UNLOCK_ORDER } from './data_Classes.js';
import { DailyChallengesSystem } from './DailyChallengesSystem.js';
import { AchievementSystem } from './AchievementSystem.js';
import { ClassProgressionSystem } from './ClassProgressionSystem.js';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }
    
    create() {
        const { width, height } = this.cameras.main;
        
        // Initialize systems
        DailyChallengesSystem.init();
        AchievementSystem.init();
        
        // Fade in scene
        this.cameras.main.fadeIn(400, 0, 0, 0);
        
        // Animated background
        this.createBackground();
        
        // Title with animation and glow
        this.createTitle();
        
        // Version number
        this.add.text(width - 10, 10, 'v2.1.1', {
            font: '12px Arial',
            fill: '#444444'
        }).setOrigin(1, 0);
        
        // Prestige tokens display
        const prestigeTokens = ClassProgressionSystem.getPrestigeTokens();
        if (prestigeTokens > 0) {
            this.add.text(width - 10, 28, `🪙 ${prestigeTokens}`, {
                font: 'bold 12px Arial',
                fill: '#ffd700'
            }).setOrigin(1, 0);
        }
        
        // Trophy display
        this.createTrophyDisplay(width / 2, 155);
        
        // Daily challenges indicator
        this.createChallengesIndicator(width / 2, 195);
        
        // Class indicator
        this.createClassIndicator(width / 2, 230);
        
        // Main buttons - Row 1
        this.createButton(width / 2 - 105, 280, '⚔️ RANKED', CONFIG.COLORS.PRIMARY, () => {
            this.showClassSelection('ranked');
        }, 95);
        
        this.createButton(width / 2 + 105, 280, '🎮 TRAINING', CONFIG.COLORS.SUCCESS, () => {
            this.showTrainingMenu();
        }, 95);
        
        // Row 2 - Progression and Arsenal
        this.createButton(width / 2 - 105, 340, '🎯 PROGRESS', 0x9b59b6, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('ProgressionScene');
            });
        }, 95);
        
        this.createButton(width / 2 + 105, 340, '🔫 ARSENAL', 0x34495e, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('WeaponArsenalScene');
            });
        }, 95);
        
        // Row 3 - Cosmetics and Prestige
        this.createButton(width / 2 - 105, 400, '🎨 COSMETICS', 0xe91e63, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('CosmeticsScene');
            });
        }, 95);
        
        this.createButton(width / 2 + 105, 400, '⭐ PRESTIGE', 0xf39c12, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('PrestigeScene');
            });
        }, 95);
        
        // Row 4 - Daily and Achievements
        this.createButton(width / 2 - 105, 460, '📅 DAILY', 0xe67e22, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('DailyChallengesScene');
            });
        }, 95);
        
        this.createButton(width / 2 + 105, 460, '🏅 ACHIEVE', 0x27ae60, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('AchievementsScene');
            });
        }, 95);
        
        // Row 5 - Stats and History
        this.createButton(width / 2 - 105, 520, '📊 STATS', 0x2980b9, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('StatsScene');
            });
        }, 95);
        
        this.createButton(width / 2 + 105, 520, '📜 HISTORY', 0x16a085, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MatchHistoryScene');
            });
        }, 95);
        
        // Row 6 - Guide and Settings
        this.createButton(width / 2 - 105, 565, '📖 GUIDE', CONFIG.COLORS.WARNING, () => {
            this.showHowToPlay();
        }, 95);
        
        this.createButton(width / 2 + 105, 565, '⚙️ SETTINGS', 0x7f8c8d, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('SettingsScene');
            });
        }, 95);
        
        // Panels
        this.trainingMenu = null;
        this.howToPlayPanel = null;
        this.unlocksPanel = null;
        this.classPanel = null;
        this.pendingMode = null;
        
        // Check for achievement unlocks
        this.checkAchievements();
    }
    
    createChallengesIndicator(x, y) {
        const claimable = DailyChallengesSystem.getClaimableCount();
        const completed = DailyChallengesSystem.getCompletedCount();
        
        if (claimable > 0) {
            const indicator = this.add.container(x, y);
            
            const bg = this.add.graphics();
            bg.fillStyle(0xf39c12, 0.3);
            bg.fillRoundedRect(-100, -12, 200, 24, 12);
            indicator.add(bg);
            
            const text = this.add.text(0, 0, `🎁 ${claimable} Challenge Reward${claimable > 1 ? 's' : ''} Ready!`, {
                font: 'bold 12px Arial',
                fill: '#ffd700'
            }).setOrigin(0.5);
            indicator.add(text);
            
            // Pulse animation
            this.tweens.add({
                targets: indicator,
                scale: 1.05,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        } else if (completed > 0) {
            this.add.text(x, y, `✅ ${completed}/3 Challenges Done`, {
                font: '11px Arial',
                fill: '#2ecc71'
            }).setOrigin(0.5);
        }
    }
    
    checkAchievements() {
        const newAchievements = AchievementSystem.checkAll();
        if (newAchievements.length > 0) {
            this.time.delayedCall(500, () => {
                this.showAchievementPopup(newAchievements[0]);
            });
        }
    }
    
    showAchievementPopup(achievement) {
        const { width, height } = this.cameras.main;
        
        const popup = this.add.container(width / 2, -80);
        
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e, 0.95);
        bg.fillRoundedRect(-150, -30, 300, 60, 12);
        bg.lineStyle(2, 0xffd700);
        bg.strokeRoundedRect(-150, -30, 300, 60, 12);
        popup.add(bg);
        
        const icon = this.add.text(-120, 0, achievement?.icon ?? '🏆', {
            font: '28px Arial'
        }).setOrigin(0.5);
        popup.add(icon);
        
        const title = this.add.text(-80, -8, 'Achievement Unlocked!', {
            font: '10px Arial',
            fill: '#ffd700'
        }).setOrigin(0, 0.5);
        popup.add(title);
        
        const name = this.add.text(-80, 10, achievement?.name ?? 'Achievement', {
            font: 'bold 16px Arial',
            fill: '#ffffff'
        }).setOrigin(0, 0.5);
        popup.add(name);
        
        // Slide in
        this.tweens.add({
            targets: popup,
            y: 60,
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Stay then slide out
                this.time.delayedCall(3000, () => {
                    this.tweens.add({
                        targets: popup,
                        y: -80,
                        duration: 400,
                        ease: 'Cubic.easeIn',
                        onComplete: () => popup?.destroy?.()
                    });
                });
            }
        });
    }
    
    createBackground() {
        const { width, height } = this.cameras.main;
        
        // Gradient background
        this.add.rectangle(width / 2, height / 2, width, height, CONFIG.COLORS.BG_DARK);
        
        // Animated particles
        const particles = this.add.graphics();
        this.particleData = [];
        
        for (let i = 0; i < 30; i++) {
            this.particleData.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: 2 + Math.random() * 3,
                speed: 0.3 + Math.random() * 0.5,
                alpha: 0.2 + Math.random() * 0.3
            });
        }
        
        this.particles = particles;
        this.updateParticles();
    }
    
    updateParticles() {
        const { width, height } = this.cameras.main;
        this.particles?.clear?.();
        
        for (const p of this.particleData ?? []) {
            p.y -= p.speed;
            if (p.y < 0) {
                p.y = height;
                p.x = Math.random() * width;
            }
            this.particles?.fillStyle?.(CONFIG.COLORS.PRIMARY, p.alpha);
            this.particles?.fillCircle?.(p.x, p.y, p.size);
        }
        
        this.time?.delayedCall?.(50, () => this.updateParticles());
    }
    
    createTitle() {
        const { width } = this.cameras.main;
        
        // Glow effect behind title
        const glow = this.add.graphics();
        glow.fillStyle(0x00d4ff, 0.1);
        glow.fillCircle(width / 2, 70, 100);
        
        // Animate glow pulse
        this.tweens.add({
            targets: glow,
            alpha: 0.3,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        const titleTop = this.add.text(width / 2, 55, 'LOCKDOWN', {
            font: 'bold 48px Arial',
            fill: '#00d4ff',
            stroke: '#003366',
            strokeThickness: 5
        }).setOrigin(0.5).setAlpha(0);
        
        const titleBottom = this.add.text(width / 2, 95, 'LANES', {
            font: 'bold 36px Arial',
            fill: '#ff6b35',
            stroke: '#662200',
            strokeThickness: 4
        }).setOrigin(0.5).setAlpha(0);
        
        // Animate in
        this.tweens.add({
            targets: titleTop,
            alpha: 1,
            y: 45,
            duration: 600,
            ease: 'Back.easeOut'
        });
        
        this.tweens.add({
            targets: titleBottom,
            alpha: 1,
            y: 90,
            duration: 600,
            delay: 200,
            ease: 'Back.easeOut'
        });
    }
    
    createTrophyDisplay(x, y) {
        const info = TrophySystem.getCurrentRankInfo();
        
        const badge = this.add.graphics();
        badge.fillStyle(CONFIG.COLORS.BG_MID, 0.9);
        badge.fillRoundedRect(x - 160, y - 35, 320, 55, 12);
        badge.lineStyle(2, info.rank?.color ?? 0xffffff);
        badge.strokeRoundedRect(x - 160, y - 35, 320, 55, 12);
        
        this.add.text(x - 140, y - 10, info.rank?.icon ?? '🏆', { font: '28px Arial' }).setOrigin(0, 0.5);
        this.add.text(x - 100, y - 10, info.rank?.name ?? 'Bronze', {
            font: 'bold 20px Arial',
            fill: '#' + ((info.rank?.color ?? 0xcd7f32).toString(16).padStart(6, '0'))
        }).setOrigin(0, 0.5);
        
        this.add.text(x + 140, y - 10, `🏆 ${info.trophies ?? 0}`, {
            font: 'bold 18px Arial',
            fill: '#ffd700'
        }).setOrigin(1, 0.5);
        
        // Progress bar
        const barWidth = 280;
        const barHeight = 8;
        const barX = x - barWidth / 2;
        const barY = y + 12;
        
        this.add.rectangle(x, barY, barWidth, barHeight, 0x333333, 0.8).setOrigin(0.5, 0);
        
        if ((info.progress ?? 0) > 0) {
            const fillWidth = barWidth * info.progress;
            this.add.rectangle(barX + fillWidth / 2, barY, fillWidth, barHeight, info.rank?.color ?? 0xcd7f32).setOrigin(0.5, 0);
        }
    }
    
    createClassIndicator(x, y) {
        const classId = SaveSystem.getEquippedClass();
        const playerClass = CLASSES[classId] ?? CLASSES.assault;
        const level = ClassProgressionSystem.getClassLevel(classId);
        const progress = ClassProgressionSystem.getLevelProgress(classId);
        
        const bg = this.add.graphics();
        bg.fillStyle(playerClass.color ?? 0x3498db, 0.3);
        bg.fillRoundedRect(x - 120, y - 18, 240, 36, 8);
        bg.lineStyle(1, playerClass.color ?? 0x3498db);
        bg.strokeRoundedRect(x - 120, y - 18, 240, 36, 8);
        
        // XP progress bar at bottom
        bg.fillStyle(0x1a1a2e, 1);
        bg.fillRoundedRect(x - 115, y + 10, 230, 5, 2);
        bg.fillStyle(playerClass.color ?? 0x3498db, 1);
        bg.fillRoundedRect(x - 115, y + 10, 230 * progress, 5, 2);
        
        this.add.text(x, y - 2, `${playerClass.icon ?? '⚔️'} ${playerClass.name ?? 'Assault'} - Lv.${level}`, {
            font: 'bold 14px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
    }
    
    createButton(x, y, text, color, callback, customWidth = null) {
        const btn = this.add.container(x, y);
        const halfW = customWidth ?? 130;
        const w = halfW * 2;
        
        const bg = this.add.graphics();
        bg.fillStyle(color, 0.85);
        bg.fillRoundedRect(-halfW, -25, w, 50, 12);
        bg.lineStyle(2, 0xffffff, 0.2);
        bg.strokeRoundedRect(-halfW, -25, w, 50, 12);
        
        const label = this.add.text(0, 0, text, {
            font: customWidth && customWidth < 130 ? 'bold 15px Arial' : 'bold 18px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        btn.add([bg, label]);
        btn.setSize(w, 50);
        btn.setInteractive({ useHandCursor: true });
        
        btn.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(color, 1);
            bg.fillRoundedRect(-halfW - 5, -28, w + 10, 56, 14);
            bg.lineStyle(2, 0xffffff, 0.4);
            bg.strokeRoundedRect(-halfW - 5, -28, w + 10, 56, 14);
            this.tweens.add({ targets: btn, scale: 1.02, duration: 100 });
        });
        
        btn.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(color, 0.85);
            bg.fillRoundedRect(-halfW, -25, w, 50, 12);
            bg.lineStyle(2, 0xffffff, 0.2);
            bg.strokeRoundedRect(-halfW, -25, w, 50, 12);
            this.tweens.add({ targets: btn, scale: 1, duration: 100 });
        });
        
        btn.on('pointerdown', callback);
        
        return btn;
    }
    
    showClassSelection(mode) {
        if (this.classPanel) return;
        
        this.pendingMode = mode;
        const { width, height } = this.cameras.main;
        const trophies = SaveSystem.getTrophies();
        const currentClass = SaveSystem.getEquippedClass();
        
        this.classPanel = this.add.container(width / 2, height / 2);
        
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8);
        overlay.setInteractive();
        
        const panel = this.add.graphics();
        panel.fillStyle(CONFIG.COLORS.BG_MID, 0.98);
        panel.fillRoundedRect(-240, -270, 480, 540, 20);
        panel.lineStyle(3, 0x9b59b6);
        panel.strokeRoundedRect(-240, -270, 480, 540, 20);
        
        const titleText = mode ? 'SELECT CLASS & START' : 'SELECT CLASS';
        const title = this.add.text(0, -240, `🌟 ${titleText}`, {
            font: 'bold 24px Arial',
            fill: '#9b59b6'
        }).setOrigin(0.5);
        
        this.classPanel.add([overlay, panel, title]);
        
        // Class buttons
        CLASS_UNLOCK_ORDER.forEach((cls, i) => {
            const y = -170 + i * 85;
            const isUnlocked = trophies >= cls.unlockTrophies || SaveSystem.isUnlocked(cls.id);
            const isSelected = currentClass === cls.id;
            
            const btn = this.createClassButton(0, y, cls, isUnlocked, isSelected);
            this.classPanel.add(btn);
        });
        
        // Close button
        const closeBtn = this.add.text(220, -250, '✕', {
            font: 'bold 28px Arial',
            fill: '#ff3366'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        closeBtn.on('pointerdown', () => {
            this.classPanel?.destroy?.();
            this.classPanel = null;
            this.pendingMode = null;
        });
        
        this.classPanel.add(closeBtn);
    }
    
    createClassButton(x, y, cls, isUnlocked, isSelected) {
        const btn = this.add.container(x, y);
        const trophies = SaveSystem.getTrophies();
        
        const bgColor = !isUnlocked ? 0x2d2d2d : (isSelected ? cls.color : 0x1a3a4a);
        const bg = this.add.graphics();
        bg.fillStyle(bgColor, isUnlocked ? 0.9 : 0.5);
        bg.fillRoundedRect(-210, -35, 420, 75, 12);
        if (isSelected && isUnlocked) {
            bg.lineStyle(3, cls.color);
            bg.strokeRoundedRect(-210, -35, 420, 75, 12);
        }
        
        const icon = this.add.text(-185, -5, cls.icon ?? '⚔️', { 
            font: '32px Arial' 
        }).setOrigin(0, 0.5).setAlpha(isUnlocked ? 1 : 0.4);
        
        const name = this.add.text(-140, -15, cls.name ?? 'Class', {
            font: 'bold 18px Arial',
            fill: isUnlocked ? '#ffffff' : '#666666'
        }).setOrigin(0, 0.5);
        
        const desc = this.add.text(-140, 8, cls.description ?? '', {
            font: '12px Arial',
            fill: isUnlocked ? '#aaaaaa' : '#444444'
        }).setOrigin(0, 0.5);
        
        const ability = this.add.text(-140, 26, `✨ ${cls.ability?.name ?? 'Ability'}: ${cls.ability?.description ?? ''}`, {
            font: '10px Arial',
            fill: isUnlocked ? '#00d4ff' : '#333333'
        }).setOrigin(0, 0.5);
        
        let statusText;
        if (!isUnlocked) {
            statusText = this.add.text(190, -5, `🔒 ${cls.unlockTrophies}🏆`, {
                font: 'bold 14px Arial',
                fill: '#ff6666'
            }).setOrigin(1, 0.5);
        } else if (isSelected) {
            statusText = this.add.text(190, -5, '✅ EQUIPPED', {
                font: 'bold 12px Arial',
                fill: '#00ff88'
            }).setOrigin(1, 0.5);
        } else {
            statusText = this.add.text(190, -5, 'SELECT', {
                font: 'bold 14px Arial',
                fill: '#00d4ff'
            }).setOrigin(1, 0.5);
        }
        
        btn.add([bg, icon, name, desc, ability, statusText]);
        btn.setSize(420, 75);
        
        if (isUnlocked) {
            btn.setInteractive({ useHandCursor: true });
            
            btn.on('pointerover', () => {
                if (!isSelected) {
                    bg.clear();
                    bg.fillStyle(cls.color, 0.6);
                    bg.fillRoundedRect(-210, -35, 420, 75, 12);
                }
            });
            
            btn.on('pointerout', () => {
                bg.clear();
                bg.fillStyle(isSelected ? cls.color : 0x1a3a4a, 0.9);
                bg.fillRoundedRect(-210, -35, 420, 75, 12);
                if (isSelected) {
                    bg.lineStyle(3, cls.color);
                    bg.strokeRoundedRect(-210, -35, 420, 75, 12);
                }
            });
            
            btn.on('pointerdown', () => {
                // Unlock if needed
                if (!SaveSystem.isUnlocked(cls.id)) {
                    SaveSystem.unlock(cls.id);
                }
                SaveSystem.setEquippedClass(cls.id);
                
                this.classPanel?.destroy?.();
                this.classPanel = null;
                
                if (this.pendingMode) {
                    this.startMatch(this.pendingMode, null, cls.id);
                    this.pendingMode = null;
                } else {
                    // Refresh menu to show new class
                    this.scene.restart();
                }
            });
        }
        
        return btn;
    }
    
    showTrainingMenu() {
        if (this.trainingMenu) return;
        
        const { width, height } = this.cameras.main;
        this.trainingMenu = this.add.container(width / 2, height / 2);
        
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8);
        overlay.setInteractive();
        
        const panel = this.add.graphics();
        panel.fillStyle(CONFIG.COLORS.BG_MID, 0.98);
        panel.fillRoundedRect(-180, -200, 360, 400, 20);
        panel.lineStyle(3, CONFIG.COLORS.SUCCESS);
        panel.strokeRoundedRect(-180, -200, 360, 400, 20);
        
        const title = this.add.text(0, -170, '🎮 SELECT DIFFICULTY', {
            font: 'bold 22px Arial',
            fill: '#00ff88'
        }).setOrigin(0.5);
        
        this.trainingMenu.add([overlay, panel, title]);
        
        const difficulties = Object.keys(AI_DIFFICULTIES ?? {});
        difficulties.forEach((diff, i) => {
            const btn = this.createDifficultyButton(0, -90 + i * 80, diff, AI_DIFFICULTIES[diff]);
            this.trainingMenu.add(btn);
        });
        
        const closeBtn = this.add.text(160, -180, '✕', {
            font: 'bold 28px Arial',
            fill: '#ff3366'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        closeBtn.on('pointerdown', () => this.closeTrainingMenu());
        this.trainingMenu.add(closeBtn);
    }
    
    createDifficultyButton(x, y, difficulty, config) {
        const btn = this.add.container(x, y);
        
        const colors = {
            easy: 0x2ecc71,
            normal: 0x3498db,
            hard: 0xe67e22,
            insane: 0xe74c3c
        };
        
        const icons = {
            easy: '🌱',
            normal: '⚔️',
            hard: '🔥',
            insane: '💀'
        };
        
        const bg = this.add.graphics();
        bg.fillStyle(colors[difficulty] ?? 0x666666, 0.85);
        bg.fillRoundedRect(-150, -28, 300, 56, 12);
        
        const label = this.add.text(0, 0, `${icons[difficulty] ?? ''} ${(config?.name ?? difficulty).toUpperCase()}`, {
            font: 'bold 20px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        btn.add([bg, label]);
        btn.setSize(300, 56);
        btn.setInteractive({ useHandCursor: true });
        
        btn.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(colors[difficulty] ?? 0x666666, 1);
            bg.fillRoundedRect(-155, -31, 310, 62, 14);
        });
        
        btn.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(colors[difficulty] ?? 0x666666, 0.85);
            bg.fillRoundedRect(-150, -28, 300, 56, 12);
        });
        
        btn.on('pointerdown', () => {
            this.closeTrainingMenu();
            this.showClassSelection('training');
            this.pendingDifficulty = difficulty;
        });
        
        return btn;
    }
    
    closeTrainingMenu() {
        if (this.trainingMenu) {
            this.trainingMenu?.destroy?.();
            this.trainingMenu = null;
        }
    }
    
    showHowToPlay() {
        if (this.howToPlayPanel) return;
        
        const { width, height } = this.cameras.main;
        this.howToPlayPanel = this.add.container(width / 2, height / 2);
        
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8);
        overlay.setInteractive();
        
        const panel = this.add.graphics();
        panel.fillStyle(CONFIG.COLORS.BG_MID, 0.98);
        panel.fillRoundedRect(-220, -260, 440, 520, 20);
        panel.lineStyle(3, CONFIG.COLORS.WARNING);
        panel.strokeRoundedRect(-220, -260, 440, 520, 20);
        
        const title = this.add.text(0, -230, '📖 HOW TO PLAY', {
            font: 'bold 26px Arial',
            fill: '#ffcc00'
        }).setOrigin(0.5);
        
        const instructions = [
            '🎯 OBJECTIVE',
            'Attackers: Plant the bomb at site A',
            'Defenders: Stop the plant or defuse the bomb',
            '',
            '📱 MOBILE CONTROLS',
            'Left side: Joystick to move',
            'Right side: Drag to aim (auto-fires at enemies)',
            'Buttons: Smoke 💨 | Action 🚩 | Sprint 🏃',
            '',
            '⌨️ DESKTOP CONTROLS',
            'WASD: Move | Mouse: Aim | Click: Shoot',
            'Space: Plant/Defuse | Shift: Sprint | E: Smoke',
            '',
            '⚠️ PRESSURE RING',
            'After 15 seconds, a ring shrinks toward the site.',
            'Stay inside or take damage!',
            '',
            '🏆 CLASS ABILITIES',
            'Each class has unique stats and passive abilities.',
            'Unlock more classes by earning trophies!'
        ];
        
        const text = this.add.text(0, 30, instructions.join('\n'), {
            font: '13px Arial',
            fill: '#ffffff',
            align: 'center',
            lineSpacing: 5
        }).setOrigin(0.5);
        
        const closeBtn = this.add.text(200, -240, '✕', {
            font: 'bold 28px Arial',
            fill: '#ff3366'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        closeBtn.on('pointerdown', () => {
            this.howToPlayPanel?.destroy?.();
            this.howToPlayPanel = null;
        });
        
        this.howToPlayPanel.add([overlay, panel, title, text, closeBtn]);
    }
    
    showUnlocks() {
        if (this.unlocksPanel) return;
        
        const { width, height } = this.cameras.main;
        const trophies = SaveSystem.getTrophies();
        const unlocks = UnlockSystem.getAllUnlocks(trophies);
        
        this.unlocksPanel = this.add.container(width / 2, height / 2);
        
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8);
        overlay.setInteractive();
        
        const panel = this.add.graphics();
        panel.fillStyle(CONFIG.COLORS.BG_MID, 0.98);
        panel.fillRoundedRect(-230, -270, 460, 540, 20);
        panel.lineStyle(3, 0x34495e);
        panel.strokeRoundedRect(-230, -270, 460, 540, 20);
        
        const title = this.add.text(0, -240, '🔓 TROPHY UNLOCKS', {
            font: 'bold 24px Arial',
            fill: '#ecf0f1'
        }).setOrigin(0.5);
        
        this.unlocksPanel.add([overlay, panel, title]);
        
        (unlocks ?? []).forEach((unlock, i) => {
            const y = -185 + i * 50;
            const isUnlocked = unlock?.unlocked ?? false;
            
            const itemBg = this.add.graphics();
            itemBg.fillStyle(isUnlocked ? 0x27ae60 : 0x2c3e50, 0.7);
            itemBg.fillRoundedRect(-210, y - 18, 420, 42, 8);
            
            const icon = isUnlocked ? '✅' : '🔒';
            const iconText = this.add.text(-190, y + 3, icon, { font: '18px Arial' }).setOrigin(0, 0.5);
            
            const nameText = this.add.text(-155, y - 5, unlock?.name ?? 'Item', {
                font: 'bold 14px Arial',
                fill: isUnlocked ? '#ffffff' : '#7f8c8d'
            }).setOrigin(0, 0.5);
            
            const descText = this.add.text(-155, y + 12, unlock?.description ?? '', {
                font: '11px Arial',
                fill: isUnlocked ? '#bdc3c7' : '#566573'
            }).setOrigin(0, 0.5);
            
            const trophyText = this.add.text(190, y + 3, `🏆 ${unlock?.trophies ?? 0}`, {
                font: '13px Arial',
                fill: trophies >= (unlock?.trophies ?? 0) ? '#f1c40f' : '#7f8c8d'
            }).setOrigin(1, 0.5);
            
            this.unlocksPanel.add([itemBg, iconText, nameText, descText, trophyText]);
        });
        
        const closeBtn = this.add.text(210, -250, '✕', {
            font: 'bold 28px Arial',
            fill: '#ff3366'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        closeBtn.on('pointerdown', () => {
            this.unlocksPanel?.destroy?.();
            this.unlocksPanel = null;
        });
        
        this.unlocksPanel.add(closeBtn);
    }
    
    startMatch(mode, difficulty = null, selectedClass = null) {
        const classId = selectedClass ?? SaveSystem.getEquippedClass();
        const diff = difficulty ?? this.pendingDifficulty ?? null;
        this.pendingDifficulty = null;
        
        // Fade out before transitioning
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MatchScene', { 
                mode, 
                difficulty: diff,
                selectedClass: classId
            });
        });
    }
}
