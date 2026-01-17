// StatsScene - Player statistics display
import { CONFIG } from './Config.js';
import { SaveSystem } from './SaveSystem.js';
import { TrophySystem } from './TrophySystem.js';

export class StatsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StatsScene' });
    }
    
    create() {
        const { width, height } = this.cameras.main;
        
        // Fade in
        this.cameras.main.fadeIn(300, 0, 0, 0);
        
        // Background
        this.add.rectangle(width / 2, height / 2, width, height, CONFIG.COLORS.BG_DARK);
        
        // Title
        this.add.text(width / 2, 40, '📊 STATISTICS', {
            font: 'bold 32px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Get stats
        const stats = SaveSystem.data ?? {};
        const rankInfo = TrophySystem.getCurrentRankInfo();
        
        // Stats panel
        const panel = this.add.graphics();
        panel.fillStyle(CONFIG.COLORS.BG_MID, 0.95);
        panel.fillRoundedRect(width / 2 - 220, 80, 440, 450, 20);
        panel.lineStyle(2, CONFIG.COLORS.PRIMARY);
        panel.strokeRoundedRect(width / 2 - 220, 80, 440, 450, 20);
        
        // Current rank display
        this.add.text(width / 2, 110, `${rankInfo.rank?.icon ?? '🏆'} ${rankInfo.rank?.name ?? 'Bronze'}`, {
            font: 'bold 28px Arial',
            fill: '#' + ((rankInfo.rank?.color ?? 0xcd7f32).toString(16).padStart(6, '0'))
        }).setOrigin(0.5);
        
        this.add.text(width / 2, 145, `${stats.trophies ?? 0} Trophies (Peak: ${stats.highestTrophies ?? 0})`, {
            font: '16px Arial',
            fill: '#ffd700'
        }).setOrigin(0.5);
        
        // Stats grid
        const statsList = [
            ['Total Matches', (stats.totalWins ?? 0) + (stats.totalLosses ?? 0)],
            ['Wins', stats.totalWins ?? 0],
            ['Losses', stats.totalLosses ?? 0],
            ['Win Rate', this.calcWinRate(stats.totalWins ?? 0, stats.totalLosses ?? 0)],
            ['───────────', '───────────'],
            ['Total Kills', stats.totalKills ?? 0],
            ['Total Deaths', stats.totalDeaths ?? 0],
            ['K/D Ratio', this.calcKD(stats.totalKills ?? 0, stats.totalDeaths ?? 0)],
            ['───────────', '───────────'],
            ['Bombs Planted', stats.bombsPlanted ?? 0],
            ['Bombs Defused', stats.bombsDefused ?? 0],
            ['───────────', '───────────'],
            ['Current Win Streak', stats.winStreak ?? 0],
            ['Current Loss Streak', stats.lossStreak ?? 0],
            ['Best Win Streak', stats.bestWinStreak ?? 0]
        ];
        
        let y = 190;
        for (const [label, value] of statsList) {
            if (label.includes('───')) {
                this.add.text(width / 2, y, '━━━━━━━━━━━━━━━━━━━━━━━━━━', {
                    font: '12px Arial',
                    fill: '#333333'
                }).setOrigin(0.5);
            } else {
                this.add.text(width / 2 - 180, y, label, {
                    font: '16px Arial',
                    fill: '#aaaaaa'
                }).setOrigin(0, 0.5);
                
                this.add.text(width / 2 + 180, y, String(value), {
                    font: 'bold 16px Arial',
                    fill: '#ffffff'
                }).setOrigin(1, 0.5);
            }
            y += 28;
        }
        
        // Back button
        this.createButton(width / 2, height - 50, '← Back to Menu', CONFIG.COLORS.SECONDARY, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MenuScene');
            });
        });
    }
    
    calcWinRate(wins, losses) {
        const total = wins + losses;
        if (total === 0) return '0%';
        return Math.round((wins / total) * 100) + '%';
    }
    
    calcKD(kills, deaths) {
        if (deaths === 0) return kills > 0 ? kills.toFixed(1) : '0.0';
        return (kills / deaths).toFixed(2);
    }
    
    createButton(x, y, text, color, callback) {
        const btn = this.add.container(x, y);
        
        const bg = this.add.graphics();
        bg.fillStyle(color, 0.9);
        bg.fillRoundedRect(-120, -22, 240, 44, 10);
        
        const label = this.add.text(0, 0, text, {
            font: 'bold 16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        btn.add([bg, label]);
        btn.setSize(240, 44);
        btn.setInteractive({ useHandCursor: true });
        
        btn.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(color, 1);
            bg.fillRoundedRect(-125, -25, 250, 50, 12);
        });
        
        btn.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(color, 0.9);
            bg.fillRoundedRect(-120, -22, 240, 44, 10);
        });
        
        btn.on('pointerdown', callback);
        
        return btn;
    }
}
