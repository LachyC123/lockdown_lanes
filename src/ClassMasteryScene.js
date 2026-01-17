// ClassMasteryScene - View class mastery challenges and progress
import { CONFIG } from './Config.js';
import { SaveSystem } from './SaveSystem.js';
import { CLASSES } from './data_Classes.js';
import { CLASS_MASTERY_CHALLENGES, getAllClassMasteryChallenges } from './data_Challenges.js';
import { ClassProgressionSystem } from './ClassProgressionSystem.js';

export class ClassMasteryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ClassMasteryScene' });
    }
    
    init(data) {
        this.selectedClassId = data?.classId ?? SaveSystem.getEquippedClass();
    }
    
    create() {
        const { width, height } = this.cameras.main;
        
        this.cameras.main.fadeIn(300, 0, 0, 0);
        
        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1a);
        
        // Title
        this.add.text(width / 2, 30, '🏅 CLASS MASTERY', {
            font: 'bold 24px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Back button
        this.createButton(60, 30, '← BACK', 0x34495e, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('ProgressionScene', { classId: this.selectedClassId });
            });
        }, 50, 20);
        
        // Class tabs
        this.createClassTabs(width / 2, 75);
        
        // Content
        this.contentContainer = this.add.container(0, 0);
        this.showClassMastery(this.selectedClassId);
    }
    
    createClassTabs(x, y) {
        const classes = Object.values(CLASSES);
        const tabWidth = 70;
        const startX = x - ((classes.length - 1) * tabWidth) / 2;
        
        classes.forEach((cls, index) => {
            const tabX = startX + index * tabWidth;
            const isSelected = cls?.id === this.selectedClassId;
            const masteryLevel = ClassProgressionSystem.getClassMasteryLevel(cls?.id);
            
            const tab = this.add.container(tabX, y);
            
            const bg = this.add.graphics();
            bg.fillStyle(isSelected ? (cls?.color ?? 0x3498db) : 0x2c3e50, isSelected ? 1 : 0.6);
            bg.fillRoundedRect(-30, -18, 60, 36, 6);
            tab.add(bg);
            
            const icon = this.add.text(0, -4, cls?.icon ?? '⚔️', {
                font: '18px Arial'
            }).setOrigin(0.5);
            tab.add(icon);
            
            const levelText = this.add.text(0, 14, `M${masteryLevel}`, {
                font: 'bold 10px Arial',
                fill: masteryLevel > 0 ? '#ffd700' : '#666666'
            }).setOrigin(0.5);
            tab.add(levelText);
            
            tab.setInteractive(new Phaser.Geom.Rectangle(-30, -18, 60, 36), Phaser.Geom.Rectangle.Contains);
            tab.on('pointerdown', () => {
                this.selectedClassId = cls?.id;
                this.scene.restart({ classId: cls?.id });
            });
        });
    }
    
    showClassMastery(classId) {
        this.contentContainer.removeAll(true);
        
        const { width, height } = this.cameras.main;
        const cls = CLASSES[classId] ?? CLASSES.assault;
        const masteryLevel = ClassProgressionSystem.getClassMasteryLevel(classId);
        const stats = SaveSystem.data?.classMasteryStats?.[classId] ?? {};
        
        // Class header
        const headerY = 120;
        const headerIcon = this.add.text(width / 2 - 100, headerY, cls?.icon ?? '⚔️', {
            font: '40px Arial'
        }).setOrigin(0.5);
        this.contentContainer.add(headerIcon);
        
        const headerName = this.add.text(width / 2 - 30, headerY - 10, cls?.name ?? 'Class', {
            font: 'bold 24px Arial',
            fill: '#ffffff'
        }).setOrigin(0, 0.5);
        this.contentContainer.add(headerName);
        
        const masteryText = this.add.text(width / 2 - 30, headerY + 15, `Mastery Level ${masteryLevel}/10`, {
            font: '14px Arial',
            fill: masteryLevel >= 10 ? '#ffd700' : '#888888'
        }).setOrigin(0, 0.5);
        this.contentContainer.add(masteryText);
        
        // Mastery bar
        const barWidth = 200;
        const barY = headerY + 40;
        
        const barBg = this.add.graphics();
        barBg.fillStyle(0x1a1a2e, 1);
        barBg.fillRoundedRect(width / 2 - barWidth / 2, barY, barWidth, 12, 6);
        this.contentContainer.add(barBg);
        
        const barFill = this.add.graphics();
        barFill.fillStyle(0xffd700, 1);
        barFill.fillRoundedRect(width / 2 - barWidth / 2 + 2, barY + 2, (barWidth - 4) * (masteryLevel / 10), 8, 4);
        this.contentContainer.add(barFill);
        
        // Challenges list
        const challengeTitle = this.add.text(width / 2, barY + 35, '🎯 CHALLENGES', {
            font: 'bold 16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        this.contentContainer.add(challengeTitle);
        
        const challenges = getAllClassMasteryChallenges();
        const columns = 2;
        const cardWidth = 180;
        const cardHeight = 55;
        const startY = barY + 65;
        
        challenges.forEach((challenge, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);
            const cardX = width / 2 - cardWidth - 10 + col * (cardWidth + 20);
            const cardY = startY + row * (cardHeight + 8);
            
            const progress = stats[challenge?.type] ?? 0;
            const target = challenge?.target ?? 0;
            const isComplete = progress >= target;
            
            this.createChallengeCard(cardX, cardY, challenge, progress, isComplete, cardWidth, cardHeight);
        });
    }
    
    createChallengeCard(x, y, challenge, progress, isComplete, cardWidth, cardHeight) {
        const card = this.add.container(x, y);
        this.contentContainer.add(card);
        
        // Background
        const bg = this.add.graphics();
        bg.fillStyle(isComplete ? 0x27ae60 : 0x2c3e50, isComplete ? 0.8 : 1);
        bg.fillRoundedRect(0, 0, cardWidth, cardHeight, 6);
        card.add(bg);
        
        // Name
        const name = this.add.text(10, 8, challenge?.name ?? 'Challenge', {
            font: 'bold 11px Arial',
            fill: '#ffffff'
        });
        card.add(name);
        
        // Description
        const desc = this.add.text(10, 24, challenge?.description ?? '', {
            font: '9px Arial',
            fill: '#aaaaaa'
        });
        card.add(desc);
        
        // Progress bar
        const barWidth = cardWidth - 20;
        const barY = 40;
        
        const barBg = this.add.graphics();
        barBg.fillStyle(0x1a1a2e, 1);
        barBg.fillRoundedRect(10, barY, barWidth, 8, 4);
        card.add(barBg);
        
        const progressPercent = Math.min(1, progress / (challenge?.target ?? 1));
        const barFill = this.add.graphics();
        barFill.fillStyle(isComplete ? 0x2ecc71 : 0x3498db, 1);
        barFill.fillRoundedRect(11, barY + 1, (barWidth - 2) * progressPercent, 6, 3);
        card.add(barFill);
        
        // Status
        const status = this.add.text(cardWidth - 10, 12, isComplete ? '✔' : `${progress}/${challenge?.target ?? 0}`, {
            font: isComplete ? 'bold 14px Arial' : '10px Arial',
            fill: isComplete ? '#2ecc71' : '#888888'
        }).setOrigin(1, 0.5);
        card.add(status);
    }
    
    createButton(x, y, text, color, callback, btnWidth = 80, btnHeight = 22) {
        const btn = this.add.container(x, y);
        
        const bg = this.add.graphics();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-btnWidth, -btnHeight, btnWidth * 2, btnHeight * 2, 8);
        btn.add(bg);
        
        const label = this.add.text(0, 0, text, {
            font: 'bold 12px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        btn.add(label);
        
        btn.setInteractive(new Phaser.Geom.Rectangle(-btnWidth, -btnHeight, btnWidth * 2, btnHeight * 2), Phaser.Geom.Rectangle.Contains);
        btn.on('pointerdown', callback);
        btn.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(color, 0.8);
            bg.fillRoundedRect(-btnWidth, -btnHeight, btnWidth * 2, btnHeight * 2, 8);
        });
        btn.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(color, 1);
            bg.fillRoundedRect(-btnWidth, -btnHeight, btnWidth * 2, btnHeight * 2, 8);
        });
        
        return btn;
    }
}
