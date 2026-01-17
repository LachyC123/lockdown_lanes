// MatchHistoryScene - View recent match history
import { CONFIG } from './Config.js';
import { MatchHistorySystem } from './MatchHistorySystem.js';
import { CLASSES } from './data_Classes.js';

export class MatchHistoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MatchHistoryScene' });
    }
    
    create() {
        const { width, height } = this.cameras.main;
        
        MatchHistorySystem.init();
        
        this.cameras.main.fadeIn(300, 0, 0, 0);
        
        // Background
        this.add.rectangle(width / 2, height / 2, width, height, CONFIG.COLORS.BG_DARK);
        
        // Title
        this.add.text(width / 2, 40, '📜 MATCH HISTORY', {
            font: 'bold 32px Arial',
            fill: '#00d4ff'
        }).setOrigin(0.5);
        
        // Stats summary
        this.createStatsSummary();
        
        // Match list
        this.createMatchList();
        
        // Back button
        this.createButton(width / 2, height - 50, 'BACK TO MENU', CONFIG.COLORS.SECONDARY, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MenuScene');
            });
        });
    }
    
    createStatsSummary() {
        const { width } = this.cameras.main;
        const matches = MatchHistorySystem.getMatches();
        const winRate = MatchHistorySystem.getWinRate();
        const streak = MatchHistorySystem.getStreak();
        const avgScore = MatchHistorySystem.getAverageScore();
        
        const summaryY = 85;
        const boxW = 100;
        const boxH = 50;
        const gap = 15;
        const startX = width / 2 - (boxW * 2 + gap * 1.5);
        
        const stats = [
            { label: 'Matches', value: matches.length.toString(), color: '#00d4ff' },
            { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 50 ? '#2ecc71' : '#e74c3c' },
            { label: 'Streak', value: `${streak.count}${streak.isWinStreak ? 'W' : 'L'}`, color: streak.isWinStreak ? '#ffd700' : '#888888' },
            { label: 'Avg Score', value: `${avgScore.player}-${avgScore.ai}`, color: '#ffffff' }
        ];
        
        stats.forEach((stat, i) => {
            const x = startX + i * (boxW + gap) + boxW / 2;
            
            const bg = this.add.graphics();
            bg.fillStyle(CONFIG.COLORS.BG_MID, 0.8);
            bg.fillRoundedRect(x - boxW / 2, summaryY - boxH / 2, boxW, boxH, 8);
            
            this.add.text(x, summaryY - 8, stat.value, {
                font: 'bold 18px Arial',
                fill: stat.color
            }).setOrigin(0.5);
            
            this.add.text(x, summaryY + 15, stat.label, {
                font: '10px Arial',
                fill: '#888888'
            }).setOrigin(0.5);
        });
    }
    
    createMatchList() {
        const { width, height } = this.cameras.main;
        const matches = MatchHistorySystem.getMatches();
        const startY = 140;
        const rowH = 55;
        const maxVisible = 6;
        
        if (matches.length === 0) {
            this.add.text(width / 2, startY + 100, 'No matches played yet!\nPlay some ranked games to see your history.', {
                font: '16px Arial',
                fill: '#666666',
                align: 'center'
            }).setOrigin(0.5);
            return;
        }
        
        matches.slice(0, maxVisible).forEach((match, i) => {
            const y = startY + i * rowH + rowH / 2;
            this.createMatchRow(match, y, width - 60, rowH - 8, i);
        });
    }
    
    createMatchRow(match, y, w, h, index) {
        const { width } = this.cameras.main;
        const x = width / 2;
        
        const row = this.add.container(x, y);
        
        // Background
        const bgColor = match?.won ? 0x1a3d1a : 0x3d1a1a;
        const bg = this.add.graphics();
        bg.fillStyle(bgColor, 0.8);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
        
        const borderColor = match?.won ? 0x2ecc71 : 0xe74c3c;
        bg.lineStyle(2, borderColor, 0.6);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
        row.add(bg);
        
        // Result icon
        const resultIcon = match?.won ? '✅' : '❌';
        const icon = this.add.text(-w / 2 + 25, 0, resultIcon, {
            font: '20px Arial'
        }).setOrigin(0.5);
        row.add(icon);
        
        // Class icon
        const classData = CLASSES[match?.classUsed] ?? CLASSES.assault;
        const classIcon = this.add.text(-w / 2 + 55, 0, classData?.icon ?? '⚔️', {
            font: '18px Arial'
        }).setOrigin(0.5);
        row.add(classIcon);
        
        // Score
        const scoreText = this.add.text(-w / 2 + 110, 0, `${match?.playerScore ?? 0} - ${match?.aiScore ?? 0}`, {
            font: 'bold 18px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        row.add(scoreText);
        
        // Trophy change
        const change = match?.trophyChange ?? 0;
        const changeColor = change >= 0 ? '#2ecc71' : '#e74c3c';
        const changeText = change >= 0 ? `+${change}` : `${change}`;
        const trophyText = this.add.text(w / 2 - 60, -8, `${changeText} 🏆`, {
            font: 'bold 14px Arial',
            fill: changeColor
        }).setOrigin(0.5);
        row.add(trophyText);
        
        // Time ago
        const timeText = this.add.text(w / 2 - 60, 12, MatchHistorySystem.formatTimestamp(match?.timestamp), {
            font: '10px Arial',
            fill: '#888888'
        }).setOrigin(0.5);
        row.add(timeText);
        
        // Stats
        const statsText = this.add.text(0, 0, `K:${match?.kills ?? 0} D:${match?.deaths ?? 0}`, {
            font: '12px Arial',
            fill: '#aaaaaa'
        }).setOrigin(0.5);
        row.add(statsText);
        
        // Animate in
        row.setAlpha(0).setX(x - 30);
        this.tweens.add({
            targets: row,
            alpha: 1,
            x: x,
            duration: 300,
            delay: index * 50,
            ease: 'Cubic.easeOut'
        });
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
