// ResultsScene - Match results with trophy changes
import { CONFIG } from './Config.js';
import { SaveSystem } from './SaveSystem.js';
import { TrophySystem } from './TrophySystem.js';
import { AchievementSystem } from './AchievementSystem.js';
import { ClassProgressionSystem } from './ClassProgressionSystem.js';
import { CLASSES } from './data_Classes.js';

export class ResultsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ResultsScene' });
    }
    
    init(data) {
        this.matchMode = data?.mode ?? 'ranked';
        this.playerWon = data?.playerWon ?? false;
        this.playerScore = data?.playerScore ?? 0;
        this.aiScore = data?.aiScore ?? 0;
        this.objectiveBonus = data?.objectiveBonus ?? false;
        this.selectedClass = data?.selectedClass ?? 'assault';
        this.matchStats = data?.matchStats ?? {};
        this.xpEarned = data?.xpEarned ?? 0;
        this.levelUpResult = data?.levelUpResult ?? null;
    }
    
    create() {
        const { width, height } = this.cameras.main;
        
        // Fade in scene
        this.cameras.main.fadeIn(400, 0, 0, 0);
        
        // Background
        const bgColor = this.playerWon ? 0x1a3d1a : 0x3d1a1a;
        this.add.rectangle(width / 2, height / 2, width, height, bgColor);
        
        // Confetti for wins
        if (this.playerWon) {
            this.createConfetti();
        }
        
        // Result banner with animation
        const resultColor = this.playerWon ? '#00ff88' : '#ff3366';
        const resultText = this.playerWon ? 'VICTORY!' : 'DEFEAT';
        
        const resultLabel = this.add.text(width / 2, 80, resultText, {
            font: 'bold 56px Arial',
            fill: resultColor,
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setScale(0).setAlpha(0);
        
        // Animate result text
        this.tweens.add({
            targets: resultLabel,
            scale: 1,
            alpha: 1,
            duration: 600,
            ease: 'Back.easeOut'
        });
        
        // Score with animation
        const scoreLabel = this.add.text(width / 2, 140, `${this.playerScore} - ${this.aiScore}`, {
            font: 'bold 40px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5).setAlpha(0);
        
        this.tweens.add({
            targets: scoreLabel,
            alpha: 1,
            duration: 400,
            delay: 300
        });
        
        // Match stats summary (small)
        if (this.matchStats?.kills > 0 || this.matchStats?.deaths > 0) {
            const statsStr = `K:${this.matchStats?.kills ?? 0} D:${this.matchStats?.deaths ?? 0}`;
            this.add.text(width / 2, 175, statsStr, {
                font: '14px Arial',
                fill: '#aaaaaa'
            }).setOrigin(0.5);
        }
        
        // XP earned display
        this.showXPEarned(width / 2, 200);
        
        // Trophy changes (ranked only)
        if (this.matchMode === 'ranked') {
            this.showTrophyChanges(width / 2, 280);
        } else {
            this.add.text(width / 2, 280, 'Training Mode - No trophy changes', {
                font: '20px Arial',
                fill: '#888888'
            }).setOrigin(0.5);
        }
        
        // Level up notification
        if (this.levelUpResult?.leveled) {
            this.time.delayedCall(2000, () => {
                this.showLevelUpNotification();
            });
        }
        
        // Buttons
        this.createButton(width / 2, height - 130, 'PLAY AGAIN', CONFIG.COLORS.PRIMARY, () => {
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MatchScene', { 
                    mode: this.matchMode,
                    selectedClass: this.selectedClass 
                });
            });
        });
        
        this.createButton(width / 2, height - 65, 'MAIN MENU', CONFIG.COLORS.SECONDARY, () => {
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MenuScene');
            });
        });
        
        // Check achievements
        AchievementSystem.init();
        this.time.delayedCall(1500, () => {
            const newAchievements = AchievementSystem.checkAll();
            if (newAchievements?.length > 0) {
                this.showAchievementUnlock(newAchievements[0]);
            }
        });
    }
    
    createConfetti() {
        const { width, height } = this.cameras.main;
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffd700];
        
        // Create confetti particles
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * width;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 4 + Math.random() * 6;
            
            const confetti = this.add.rectangle(x, -10, size, size * 2, color)
                .setRotation(Math.random() * Math.PI)
                .setDepth(50);
            
            this.tweens.add({
                targets: confetti,
                y: height + 20,
                x: x + (Math.random() - 0.5) * 200,
                rotation: confetti.rotation + Math.PI * 2 * (Math.random() > 0.5 ? 1 : -1),
                duration: 2000 + Math.random() * 2000,
                delay: Math.random() * 1000,
                ease: 'Sine.easeIn',
                onComplete: () => confetti?.destroy?.()
            });
        }
        
        // More confetti bursts
        this.time.addEvent({
            delay: 500,
            callback: () => {
                for (let i = 0; i < 15; i++) {
                    const x = Math.random() * width;
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    const confetti = this.add.circle(x, -10, 3 + Math.random() * 4, color).setDepth(50);
                    
                    this.tweens.add({
                        targets: confetti,
                        y: height + 20,
                        x: x + (Math.random() - 0.5) * 150,
                        duration: 1500 + Math.random() * 1500,
                        ease: 'Sine.easeIn',
                        onComplete: () => confetti?.destroy?.()
                    });
                }
            },
            repeat: 3
        });
    }
    
    showAchievementUnlock(achievement) {
        const { width, height } = this.cameras.main;
        
        const popup = this.add.container(width / 2, -80).setDepth(200);
        
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e, 0.95);
        bg.fillRoundedRect(-150, -30, 300, 60, 12);
        bg.lineStyle(2, 0xffd700);
        bg.strokeRoundedRect(-150, -30, 300, 60, 12);
        popup.add(bg);
        
        popup.add(this.add.text(-120, 0, achievement?.icon ?? '🏆', { font: '28px Arial' }).setOrigin(0.5));
        popup.add(this.add.text(-80, -8, 'Achievement Unlocked!', { font: '10px Arial', fill: '#ffd700' }).setOrigin(0, 0.5));
        popup.add(this.add.text(-80, 10, achievement?.name ?? 'Achievement', { font: 'bold 16px Arial', fill: '#ffffff' }).setOrigin(0, 0.5));
        
        this.tweens.add({
            targets: popup,
            y: 60,
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
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
    
    showTrophyChanges(x, y) {
        // Apply trophy changes
        const result = TrophySystem.applyMatchResult(this.playerWon, this.objectiveBonus);
        
        // Trophy change display
        const changeText = result.change >= 0 ? `+${result.change}` : `${result.change}`;
        const changeColor = result.change >= 0 ? '#00ff88' : '#ff3366';
        
        // Panel background
        const panel = this.add.graphics();
        panel.fillStyle(CONFIG.COLORS.BG_MID, 0.9);
        panel.fillRoundedRect(x - 180, y - 20, 360, 220, 15);
        panel.lineStyle(2, result.change >= 0 ? CONFIG.COLORS.SUCCESS : CONFIG.COLORS.DANGER, 0.8);
        panel.strokeRoundedRect(x - 180, y - 20, 360, 220, 15);
        
        // Animated trophy change display
        const trophyChangeText = this.add.text(x, y, '🏆', {
            font: 'bold 40px Arial',
            fill: '#ffd700'
        }).setOrigin(0.5).setScale(0);
        
        // Animate trophy icon appearing
        this.tweens.add({
            targets: trophyChangeText,
            scale: 1.2,
            duration: 400,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: trophyChangeText,
                    scale: 1,
                    duration: 200
                });
            }
        });
        
        // Animated counter for trophy change
        const counterText = this.add.text(x + 35, y, '0', {
            font: 'bold 36px Arial',
            fill: changeColor
        }).setOrigin(0, 0.5).setAlpha(0);
        
        // Show counter after icon appears
        this.time.delayedCall(300, () => {
            counterText.setAlpha(1);
            this.animateCounter(counterText, 0, result.change, 800, changeColor);
        });
        
        // "From X to Y" display
        const fromToText = this.add.text(x, y + 50, `${result.oldTrophies} → `, {
            font: '18px Arial',
            fill: '#aaaaaa'
        }).setOrigin(1, 0.5);
        
        // Animated new trophy total
        const newTotalText = this.add.text(x + 5, y + 50, `${result.oldTrophies}`, {
            font: 'bold 18px Arial',
            fill: '#ffd700'
        }).setOrigin(0, 0.5);
        
        // Animate the total counting up/down
        this.time.delayedCall(600, () => {
            this.animateCounter(newTotalText, result.oldTrophies, result.newTrophies, 600, '#ffd700');
        });
        
        // Rank display with animation
        const rankText = this.add.text(x, y + 100, `${result.newRank.icon} ${result.newRank.name}`, {
            font: 'bold 24px Arial',
            fill: '#' + result.newRank.color.toString(16).padStart(6, '0')
        }).setOrigin(0.5).setAlpha(0).setScale(0.5);
        
        this.time.delayedCall(1000, () => {
            this.tweens.add({
                targets: rankText,
                alpha: 1,
                scale: 1,
                duration: 400,
                ease: 'Back.easeOut'
            });
        });
        
        // Streak indicator with glow effect
        if (result.winStreak >= 2) {
            const streakText = this.add.text(x, y + 145, `🔥 ${result.winStreak} Win Streak!`, {
                font: 'bold 18px Arial',
                fill: '#ff9900',
                stroke: '#ff6600',
                strokeThickness: 2
            }).setOrigin(0.5).setAlpha(0);
            
            this.time.delayedCall(1200, () => {
                this.tweens.add({
                    targets: streakText,
                    alpha: 1,
                    scale: { from: 0.5, to: 1.1 },
                    duration: 300,
                    ease: 'Back.easeOut',
                    onComplete: () => {
                        this.tweens.add({
                            targets: streakText,
                            scale: 1,
                            duration: 200
                        });
                    }
                });
            });
        } else if (result.lossStreak >= 3) {
            const protectionText = this.add.text(x, y + 145, '🛡️ Loss Protection Active', {
                font: '16px Arial',
                fill: '#6699ff'
            }).setOrigin(0.5).setAlpha(0);
            
            this.time.delayedCall(1200, () => {
                this.tweens.add({
                    targets: protectionText,
                    alpha: 1,
                    duration: 400
                });
            });
        }
        
        // Rank up/down animation
        if (result.rankUp) {
            this.time.delayedCall(1400, () => {
                this.showRankUp(x, y - 80, result.newRank);
            });
        } else if (result.rankDown) {
            this.time.delayedCall(1400, () => {
                this.showRankDown(x, y - 80, result.newRank);
            });
        }
        
        // New unlocks
        if (result.newUnlocks?.length > 0) {
            this.time.delayedCall(1600, () => {
                this.showNewUnlocks(x, y + 180, result.newUnlocks);
            });
        }
        
        // Create particles on trophy change
        this.time.delayedCall(400, () => {
            this.createTrophyParticles(x, y, result.change >= 0);
        });
    }
    
    animateCounter(textObj, from, to, duration, color) {
        const startTime = Date.now();
        const diff = to - from;
        const prefix = to >= from ? '+' : '';
        
        const updateCounter = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            const current = Math.round(from + diff * eased);
            
            // If this is a change display (starts from 0), show with +/- prefix
            if (from === 0) {
                textObj.setText(current >= 0 ? `+${current}` : `${current}`);
            } else {
                textObj.setText(`${current}`);
            }
            
            if (progress < 1) {
                this.time.delayedCall(16, updateCounter);
            } else {
                // Final value
                if (from === 0) {
                    textObj.setText(to >= 0 ? `+${to}` : `${to}`);
                } else {
                    textObj.setText(`${to}`);
                }
            }
        };
        
        updateCounter();
    }
    
    showXPEarned(x, y) {
        const cls = CLASSES[this.selectedClass] ?? CLASSES.assault;
        const level = ClassProgressionSystem.getClassLevel(this.selectedClass);
        const progress = ClassProgressionSystem.getLevelProgress(this.selectedClass);
        
        const container = this.add.container(x, y);
        
        // Class icon and XP earned
        const xpIcon = this.add.text(-60, 0, cls?.icon ?? '⚔️', {
            font: '24px Arial'
        }).setOrigin(0.5);
        container.add(xpIcon);
        
        const xpText = this.add.text(0, 0, `+${this.xpEarned} XP`, {
            font: 'bold 18px Arial',
            fill: '#9b59b6'
        }).setOrigin(0, 0.5).setAlpha(0);
        container.add(xpText);
        
        const levelText = this.add.text(70, 0, `Lv.${level}`, {
            font: 'bold 14px Arial',
            fill: `#${(cls?.color ?? 0x3498db).toString(16).padStart(6, '0')}`
        }).setOrigin(0, 0.5);
        container.add(levelText);
        
        // XP progress bar
        const barWidth = 140;
        const barBg = this.add.graphics();
        barBg.fillStyle(0x1a1a2e, 1);
        barBg.fillRoundedRect(-70, 18, barWidth, 8, 4);
        container.add(barBg);
        
        const barFill = this.add.graphics();
        barFill.fillStyle(cls?.color ?? 0x9b59b6, 1);
        barFill.fillRoundedRect(-70, 18, barWidth * progress, 8, 4);
        container.add(barFill);
        
        // Animate XP text appearing
        this.time.delayedCall(500, () => {
            this.tweens.add({
                targets: xpText,
                alpha: 1,
                scale: { from: 0.5, to: 1 },
                duration: 300,
                ease: 'Back.easeOut'
            });
        });
    }
    
    showLevelUpNotification() {
        const { width, height } = this.cameras.main;
        const cls = CLASSES[this.selectedClass] ?? CLASSES.assault;
        const newLevel = this.levelUpResult?.newLevel ?? 1;
        const unlocks = this.levelUpResult?.unlocks ?? [];
        
        // Overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7).setDepth(500);
        
        // Level up container
        const container = this.add.container(width / 2, height / 2).setDepth(501);
        
        // Background
        const bg = this.add.graphics();
        bg.fillStyle(cls?.color ?? 0x9b59b6, 0.9);
        bg.fillRoundedRect(-150, -100, 300, 200, 16);
        bg.lineStyle(4, 0xffd700, 1);
        bg.strokeRoundedRect(-150, -100, 300, 200, 16);
        container.add(bg);
        
        // Level up text
        const levelUpText = this.add.text(0, -65, '⬆️ LEVEL UP!', {
            font: 'bold 28px Arial',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        container.add(levelUpText);
        
        // Class icon and new level
        const classText = this.add.text(0, -20, `${cls?.icon ?? '⚔️'} ${cls?.name ?? 'Class'}`, {
            font: '18px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        container.add(classText);
        
        const newLevelText = this.add.text(0, 15, `Level ${newLevel}`, {
            font: 'bold 36px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        container.add(newLevelText);
        
        // Unlocks
        if (unlocks?.length > 0) {
            const unlockText = this.add.text(0, 55, 'New Unlock:', {
                font: '14px Arial',
                fill: '#aaaaaa'
            }).setOrigin(0.5);
            container.add(unlockText);
            
            const unlock = unlocks[0];
            const unlockName = this.add.text(0, 78, `${unlock?.icon ?? '⭐'} ${unlock?.name ?? 'Item'}`, {
                font: 'bold 16px Arial',
                fill: '#ffd700'
            }).setOrigin(0.5);
            container.add(unlockName);
        }
        
        // Animate entrance
        container.setScale(0);
        this.tweens.add({
            targets: container,
            scale: 1,
            duration: 500,
            ease: 'Back.easeOut'
        });
        
        // Tap to dismiss
        overlay.setInteractive();
        overlay.on('pointerdown', () => {
            this.tweens.add({
                targets: [container, overlay],
                alpha: 0,
                scale: 0.8,
                duration: 300,
                onComplete: () => {
                    container?.destroy?.();
                    overlay?.destroy?.();
                }
            });
        });
        
        // Auto dismiss after 4 seconds
        this.time.delayedCall(4000, () => {
            if (container?.active) {
                this.tweens.add({
                    targets: [container, overlay],
                    alpha: 0,
                    duration: 300,
                    onComplete: () => {
                        container?.destroy?.();
                        overlay?.destroy?.();
                    }
                });
            }
        });
        
        // Sparkle particles
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 80 + Math.random() * 60;
            const sparkle = this.add.circle(
                width / 2 + Math.cos(angle) * distance,
                height / 2 + Math.sin(angle) * distance,
                2 + Math.random() * 3,
                0xffd700
            ).setDepth(502).setAlpha(0);
            
            this.tweens.add({
                targets: sparkle,
                alpha: { from: 0, to: 1 },
                scale: { from: 0, to: 1.5 },
                duration: 300,
                delay: Math.random() * 200,
                yoyo: true,
                repeat: 2,
                onComplete: () => sparkle?.destroy?.()
            });
        }
    }
    
    createTrophyParticles(x, y, isPositive) {
        const color = isPositive ? 0x00ff88 : 0xff3366;
        const particleCount = isPositive ? 15 : 8;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.5;
            const distance = 60 + Math.random() * 40;
            const particle = this.add.circle(x, y, 3 + Math.random() * 4, color).setDepth(300);
            
            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance * (isPositive ? -0.8 : 0.8),
                alpha: { from: 1, to: 0 },
                scale: { from: 1, to: 0.3 },
                duration: 600 + Math.random() * 400,
                ease: 'Power2',
                onComplete: () => particle?.destroy?.()
            });
        }
        
        // Add sparkle effect for wins
        if (isPositive) {
            for (let i = 0; i < 5; i++) {
                const sparkle = this.add.text(
                    x + (Math.random() - 0.5) * 80,
                    y + (Math.random() - 0.5) * 60,
                    '✨',
                    { font: '16px Arial' }
                ).setOrigin(0.5).setAlpha(0).setDepth(301);
                
                this.tweens.add({
                    targets: sparkle,
                    alpha: { from: 0, to: 1 },
                    scale: { from: 0.5, to: 1.5 },
                    y: sparkle.y - 30,
                    duration: 400,
                    delay: i * 100,
                    yoyo: true,
                    onComplete: () => sparkle?.destroy?.()
                });
            }
        }
    }
    
    showRankUp(x, y, rank) {
        const text = this.add.text(x, y, `⬆️ RANK UP: ${rank.name}!`, {
            font: 'bold 24px Arial',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setAlpha(0);
        
        this.tweens.add({
            targets: text,
            alpha: 1,
            scale: { from: 0.5, to: 1.2 },
            duration: 500,
            yoyo: true,
            hold: 1000
        });
        
        // Particles effect
        this.createCelebration(x, y);
    }
    
    showRankDown(x, y, rank) {
        this.add.text(x, y, `⬇️ Rank Down: ${rank.name}`, {
            font: '18px Arial',
            fill: '#ff6666'
        }).setOrigin(0.5);
    }
    
    showNewUnlocks(x, y, unlocks) {
        const { width, height } = this.cameras.main;
        
        unlocks.forEach((unlock, i) => {
            const uy = y + i * 60;
            
            // Panel
            const panel = this.add.graphics();
            panel.fillStyle(0x9b59b6, 0.8);
            panel.fillRoundedRect(x - 150, uy - 20, 300, 50, 10);
            
            const text = this.add.text(x, uy, `🎉 NEW UNLOCK: ${unlock.name}!`, {
                font: 'bold 18px Arial',
                fill: '#ffffff'
            }).setOrigin(0.5).setAlpha(0);
            
            // Animate in
            this.tweens.add({
                targets: [panel, text],
                alpha: 1,
                y: '-=20',
                delay: 500 + i * 300,
                duration: 400
            });
        });
        
        this.createCelebration(x, y);
    }
    
    createCelebration(x, y) {
        // Simple particle-like celebration
        for (let i = 0; i < 20; i++) {
            const particle = this.add.circle(
                x + (Math.random() - 0.5) * 100,
                y,
                Math.random() * 5 + 3,
                Phaser.Math.Between(0xffff00, 0xffffff)
            ).setAlpha(0);
            
            this.tweens.add({
                targets: particle,
                alpha: { from: 1, to: 0 },
                x: particle.x + (Math.random() - 0.5) * 200,
                y: particle.y + (Math.random() - 0.5) * 150,
                duration: 1000 + Math.random() * 500,
                delay: Math.random() * 300,
                onComplete: () => particle?.destroy?.()
            });
        }
    }
    
    createButton(x, y, text, color, callback) {
        const btn = this.add.container(x, y);
        
        const bg = this.add.graphics();
        bg.fillStyle(color, 0.9);
        bg.fillRoundedRect(-120, -25, 240, 50, 12);
        
        const label = this.add.text(0, 0, text, {
            font: 'bold 20px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        btn.add([bg, label]);
        btn.setSize(240, 50);
        btn.setInteractive({ useHandCursor: true });
        
        btn.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(color, 1);
            bg.fillRoundedRect(-125, -28, 250, 56, 12);
        });
        
        btn.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(color, 0.9);
            bg.fillRoundedRect(-120, -25, 240, 50, 12);
        });
        
        btn.on('pointerdown', callback);
        
        return btn;
    }
}
