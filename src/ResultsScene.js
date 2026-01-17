// ResultsScene - Match results with trophy changes
import { CONFIG } from './Config.js';
import { SaveSystem } from './SaveSystem.js';
import { TrophySystem } from './TrophySystem.js';

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
    }
    
    create() {
        const { width, height } = this.cameras.main;
        
        // Fade in scene
        this.cameras.main.fadeIn(400, 0, 0, 0);
        
        // Background
        const bgColor = this.playerWon ? 0x1a3d1a : 0x3d1a1a;
        this.add.rectangle(width / 2, height / 2, width, height, bgColor);
        
        // Result banner
        const resultColor = this.playerWon ? '#00ff88' : '#ff3366';
        const resultText = this.playerWon ? 'VICTORY!' : 'DEFEAT';
        
        this.add.text(width / 2, 80, resultText, {
            font: 'bold 56px Arial',
            fill: resultColor,
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        // Score
        this.add.text(width / 2, 150, `${this.playerScore} - ${this.aiScore}`, {
            font: 'bold 40px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Trophy changes (ranked only)
        if (this.matchMode === 'ranked') {
            this.showTrophyChanges(width / 2, 220);
        } else {
            this.add.text(width / 2, 220, 'Training Mode - No trophy changes', {
                font: '20px Arial',
                fill: '#888888'
            }).setOrigin(0.5);
        }
        
        // Buttons
        this.createButton(width / 2, height - 140, 'PLAY AGAIN', CONFIG.COLORS.PRIMARY, () => {
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MatchScene', { 
                    mode: this.matchMode,
                    selectedClass: this.selectedClass 
                });
            });
        });
        
        this.createButton(width / 2, height - 70, 'MAIN MENU', CONFIG.COLORS.SECONDARY, () => {
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MenuScene');
            });
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
        panel.fillRoundedRect(x - 180, y - 20, 360, 200, 15);
        
        // Trophy icon and change
        this.add.text(x, y + 10, `🏆 ${changeText}`, {
            font: 'bold 36px Arial',
            fill: changeColor
        }).setOrigin(0.5);
        
        // New trophy count
        this.add.text(x, y + 60, `Total: ${result.newTrophies} Trophies`, {
            font: '20px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Rank display
        this.add.text(x, y + 100, `${result.newRank.icon} ${result.newRank.name}`, {
            font: 'bold 24px Arial',
            fill: '#' + result.newRank.color.toString(16).padStart(6, '0')
        }).setOrigin(0.5);
        
        // Streak indicator
        if (result.winStreak >= 2) {
            this.add.text(x, y + 140, `🔥 ${result.winStreak} Win Streak!`, {
                font: 'bold 16px Arial',
                fill: '#ff9900'
            }).setOrigin(0.5);
        } else if (result.lossStreak >= 3) {
            this.add.text(x, y + 140, '🛡️ Loss Protection Active', {
                font: '16px Arial',
                fill: '#6699ff'
            }).setOrigin(0.5);
        }
        
        // Rank up/down animation
        if (result.rankUp) {
            this.showRankUp(x, y - 80, result.newRank);
        } else if (result.rankDown) {
            this.showRankDown(x, y - 80, result.newRank);
        }
        
        // New unlocks
        if (result.newUnlocks?.length > 0) {
            this.showNewUnlocks(x, y + 180, result.newUnlocks);
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
