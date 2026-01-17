// AchievementsScene - View all achievements
import { CONFIG } from './Config.js';
import { AchievementSystem } from './AchievementSystem.js';

export class AchievementsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AchievementsScene' });
    }
    
    create() {
        const { width, height } = this.cameras.main;
        
        AchievementSystem.init();
        
        this.cameras.main.fadeIn(300, 0, 0, 0);
        
        // Background
        this.add.rectangle(width / 2, height / 2, width, height, CONFIG.COLORS.BG_DARK);
        
        // Title
        this.add.text(width / 2, 40, '🏅 ACHIEVEMENTS', {
            font: 'bold 32px Arial',
            fill: '#ffd700'
        }).setOrigin(0.5);
        
        // Progress
        const progress = AchievementSystem.getProgress();
        const unlocked = AchievementSystem.getUnlockedCount();
        const total = AchievementSystem.getTotalCount();
        
        this.add.text(width / 2, 75, `${unlocked}/${total} Unlocked (${progress}%)`, {
            font: '16px Arial',
            fill: '#888888'
        }).setOrigin(0.5);
        
        // Progress bar
        const barW = width - 100;
        const barH = 12;
        const barX = 50;
        const barY = 100;
        
        const barBg = this.add.graphics();
        barBg.fillStyle(0x1a1a2e, 1);
        barBg.fillRoundedRect(barX, barY, barW, barH, 6);
        
        const barFill = this.add.graphics();
        barFill.fillStyle(0xffd700, 1);
        barFill.fillRoundedRect(barX + 2, barY + 2, (barW - 4) * (progress / 100), barH - 4, 4);
        
        // Create scrollable container for achievements
        this.createAchievementGrid();
        
        // Back button
        this.createButton(width / 2, height - 50, 'BACK TO MENU', CONFIG.COLORS.SECONDARY, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MenuScene');
            });
        });
    }
    
    createAchievementGrid() {
        const { width, height } = this.cameras.main;
        const achievements = AchievementSystem.getVisibleAchievements();
        
        const cols = 3;
        const cardW = (width - 80) / cols - 10;
        const cardH = 100;
        const startX = 50;
        const startY = 130;
        const gapX = 10;
        const gapY = 10;
        
        achievements.forEach((achievement, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * (cardW + gapX) + cardW / 2;
            const y = startY + row * (cardH + gapY) + cardH / 2;
            
            // Only show if within visible area
            if (y < height - 100) {
                this.createAchievementCard(achievement, x, y, cardW, cardH, index);
            }
        });
    }
    
    createAchievementCard(achievement, x, y, w, h, index) {
        const card = this.add.container(x, y);
        const isUnlocked = achievement?.unlocked;
        
        // Background
        const bg = this.add.graphics();
        const bgColor = isUnlocked ? 0x2d4a3d : CONFIG.COLORS.BG_MID;
        bg.fillStyle(bgColor, isUnlocked ? 1 : 0.5);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
        
        const borderColor = isUnlocked ? 0xffd700 : 0x444444;
        bg.lineStyle(2, borderColor, isUnlocked ? 1 : 0.5);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
        card.add(bg);
        
        // Icon
        const iconText = isUnlocked ? (achievement?.icon ?? '⭐') : '🔒';
        const icon = this.add.text(0, -15, iconText, {
            font: '28px Arial'
        }).setOrigin(0.5).setAlpha(isUnlocked ? 1 : 0.5);
        card.add(icon);
        
        // Name
        const nameColor = isUnlocked ? '#ffffff' : '#666666';
        const name = this.add.text(0, 15, achievement?.name ?? 'Achievement', {
            font: 'bold 11px Arial',
            fill: nameColor,
            wordWrap: { width: w - 10 },
            align: 'center'
        }).setOrigin(0.5, 0);
        card.add(name);
        
        // Secret badge if applicable
        if (achievement?.secret && !isUnlocked) {
            const secretBadge = this.add.text(w / 2 - 10, -h / 2 + 10, '🕵️', {
                font: '12px Arial'
            }).setOrigin(0.5);
            card.add(secretBadge);
        }
        
        // Glow effect for unlocked
        if (isUnlocked) {
            const glow = this.add.graphics();
            glow.fillStyle(0xffd700, 0.1);
            glow.fillRoundedRect(-w / 2 - 5, -h / 2 - 5, w + 10, h + 10, 12);
            card.addAt(glow, 0);
        }
        
        // Animate in
        card.setAlpha(0).setScale(0.8);
        this.tweens.add({
            targets: card,
            alpha: 1,
            scale: 1,
            duration: 300,
            delay: index * 30,
            ease: 'Back.easeOut'
        });
        
        // Show description on hover/tap
        card.setSize(w, h).setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.showTooltip(x, y + h / 2 + 10, achievement))
            .on('pointerout', () => this.hideTooltip())
            .on('pointerdown', () => this.showTooltip(x, y + h / 2 + 10, achievement));
    }
    
    showTooltip(x, y, achievement) {
        this.hideTooltip();
        
        const desc = achievement?.desc ?? 'Complete this achievement';
        const padding = 10;
        
        this.tooltip = this.add.container(x, y);
        
        const text = this.add.text(0, 0, desc, {
            font: '12px Arial',
            fill: '#ffffff',
            wordWrap: { width: 180 },
            align: 'center'
        }).setOrigin(0.5, 0);
        
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.9);
        bg.fillRoundedRect(
            -text.width / 2 - padding,
            -5,
            text.width + padding * 2,
            text.height + padding,
            6
        );
        
        this.tooltip.add(bg);
        this.tooltip.add(text);
        this.tooltip.setDepth(100);
    }
    
    hideTooltip() {
        this.tooltip?.destroy?.();
        this.tooltip = null;
    }
    
    createButton(x, y, text, color, callback, width = 200) {
        const btn = this.add.container(x, y);
        
        const bg = this.add.graphics();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-width / 2, -22, width, 44, 10);
        btn.add(bg);
        
        const label = this.add.text(0, 0, text, {
            font: 'bold 16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        btn.add(label);
        
        const hitArea = this.add.rectangle(0, 0, width, 44, 0x000000, 0)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.tweens.add({
                    targets: btn,
                    scale: 0.95,
                    duration: 50,
                    yoyo: true,
                    onComplete: callback
                });
            });
        btn.add(hitArea);
        
        return btn;
    }
}
