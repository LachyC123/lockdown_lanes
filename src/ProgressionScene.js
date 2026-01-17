// ProgressionScene - Class progression and perk selection UI - EXPANDED v2.0
import { CONFIG } from './Config.js';
import { SaveSystem } from './SaveSystem.js';
import { CLASSES } from './data_Classes.js';
import { PERKS, getPrimaryPerks, getSecondaryPerks, getUtilityPerks, isUtilitySlotUnlocked } from './data_Perks.js';
import { ClassProgressionSystem } from './ClassProgressionSystem.js';

export class ProgressionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ProgressionScene' });
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
        this.add.text(width / 2, 30, '🎯 CLASS PROGRESSION', {
            font: 'bold 24px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Back button
        this.createButton(60, 30, '← BACK', 0x34495e, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MenuScene');
            });
        }, 50, 20);
        
        // Class tabs
        this.createClassTabs(width / 2, 75);
        
        // Main content area
        this.contentContainer = this.add.container(0, 0);
        
        // Show selected class
        this.showClassProgression(this.selectedClassId);
    }
    
    createClassTabs(x, y) {
        const classes = Object.values(CLASSES);
        const tabWidth = 70;
        const startX = x - ((classes.length - 1) * tabWidth) / 2;
        
        this.classTabs = [];
        
        classes.forEach((cls, index) => {
            const tabX = startX + index * tabWidth;
            const isSelected = cls?.id === this.selectedClassId;
            const level = ClassProgressionSystem.getClassLevel(cls?.id);
            const prestige = ClassProgressionSystem.getPrestigeLevel(cls?.id);
            
            const tab = this.add.container(tabX, y);
            
            const bg = this.add.graphics();
            bg.fillStyle(isSelected ? (cls?.color ?? 0x3498db) : 0x2c3e50, isSelected ? 1 : 0.6);
            bg.fillRoundedRect(-30, -18, 60, 36, 6);
            if (isSelected) {
                bg.lineStyle(2, 0xffffff, 0.5);
                bg.strokeRoundedRect(-30, -18, 60, 36, 6);
            }
            if (prestige > 0) {
                bg.lineStyle(2, 0xffd700, 0.8);
                bg.strokeRoundedRect(-30, -18, 60, 36, 6);
            }
            tab.add(bg);
            
            const icon = this.add.text(0, -4, cls?.icon ?? '⚔️', {
                font: '18px Arial'
            }).setOrigin(0.5);
            tab.add(icon);
            
            // Show prestige stars or level
            let levelDisplay = `Lv.${level}`;
            if (prestige > 0) {
                levelDisplay = `P${prestige} Lv.${level}`;
            }
            const levelText = this.add.text(0, 14, levelDisplay, {
                font: 'bold 9px Arial',
                fill: prestige > 0 ? '#ffd700' : (isSelected ? '#ffffff' : '#aaaaaa')
            }).setOrigin(0.5);
            tab.add(levelText);
            
            tab.setInteractive(new Phaser.Geom.Rectangle(-30, -18, 60, 36), Phaser.Geom.Rectangle.Contains);
            tab.on('pointerdown', () => {
                this.selectedClassId = cls?.id;
                this.scene.restart({ classId: cls?.id });
            });
            
            this.classTabs.push(tab);
        });
    }
    
    showClassProgression(classId) {
        this.contentContainer.removeAll(true);
        
        const { width, height } = this.cameras.main;
        const cls = CLASSES[classId] ?? CLASSES.assault;
        const level = ClassProgressionSystem.getClassLevel(classId);
        const prestige = ClassProgressionSystem.getPrestigeLevel(classId);
        const progress = ClassProgressionSystem.getLevelProgress(classId);
        const currentXP = ClassProgressionSystem.getCurrentLevelXP(classId);
        const neededXP = ClassProgressionSystem.getXPNeededForCurrentLevel(classId);
        const maxLevel = ClassProgressionSystem.getMaxLevel();
        const canPrestige = ClassProgressionSystem.canPrestige(classId);
        
        // Class header
        const header = this.add.container(width / 2, 125);
        this.contentContainer.add(header);
        
        const classIcon = this.add.text(-90, 0, cls?.icon ?? '⚔️', {
            font: '42px Arial'
        }).setOrigin(0.5);
        header.add(classIcon);
        
        const className = this.add.text(-30, -12, cls?.name ?? 'Class', {
            font: 'bold 24px Arial',
            fill: '#ffffff'
        }).setOrigin(0, 0.5);
        header.add(className);
        
        // Prestige stars
        if (prestige > 0) {
            const stars = '⭐'.repeat(Math.min(prestige, 5)) + (prestige > 5 ? `+${prestige - 5}` : '');
            const prestigeText = this.add.text(-30, 8, stars, {
                font: '12px Arial'
            }).setOrigin(0, 0.5);
            header.add(prestigeText);
        }
        
        const levelDisplay = this.add.text(-30, prestige > 0 ? 25 : 12, `Level ${level}${level >= maxLevel ? ' (MAX)' : ''}`, {
            font: '16px Arial',
            fill: `#${(cls?.color ?? 0x3498db).toString(16).padStart(6, '0')}`
        }).setOrigin(0, 0.5);
        header.add(levelDisplay);
        
        // XP Progress bar
        const xpBarY = 170;
        const barWidth = 280;
        
        const xpBg = this.add.graphics();
        xpBg.fillStyle(0x1a1a2e, 1);
        xpBg.fillRoundedRect(width / 2 - barWidth / 2, xpBarY, barWidth, 18, 9);
        this.contentContainer.add(xpBg);
        
        if (level < maxLevel) {
            const xpFill = this.add.graphics();
            xpFill.fillStyle(cls?.color ?? 0x3498db, 1);
            xpFill.fillRoundedRect(width / 2 - barWidth / 2 + 2, xpBarY + 2, (barWidth - 4) * progress, 14, 7);
            this.contentContainer.add(xpFill);
            
            const xpText = this.add.text(width / 2, xpBarY + 9, `${currentXP} / ${neededXP} XP`, {
                font: 'bold 10px Arial',
                fill: '#ffffff'
            }).setOrigin(0.5);
            this.contentContainer.add(xpText);
        } else {
            if (canPrestige) {
                const prestigeBtn = this.createButton(width / 2, xpBarY + 9, '⭐ PRESTIGE AVAILABLE!', 0xf39c12, () => {
                    this.scene.start('PrestigeScene', { classId: classId });
                }, 100, 12);
                this.contentContainer.add(prestigeBtn);
            } else {
                const maxText = this.add.text(width / 2, xpBarY + 9, 'MAX LEVEL', {
                    font: 'bold 12px Arial',
                    fill: '#ffd700'
                }).setOrigin(0.5);
                this.contentContainer.add(maxText);
            }
        }
        
        // Next unlock preview
        const nextUnlock = ClassProgressionSystem.getNextPerkUnlock(classId);
        if (nextUnlock) {
            const unlockText = this.add.text(width / 2, xpBarY + 32, `Next: ${nextUnlock?.icon ?? '🔒'} ${nextUnlock?.name ?? 'Unlock'} (Lv.${nextUnlock?.unlockLevel ?? '?'})`, {
                font: '11px Arial',
                fill: '#888888'
            }).setOrigin(0.5);
            this.contentContainer.add(unlockText);
        }
        
        // Perks section
        this.createPerksSection(width / 2, 235, classId, level);
        
        // Bottom buttons
        const btnY = height - 50;
        this.createButton(width / 2 - 120, btnY, '📋 LOADOUTS', 0x27ae60, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('LoadoutScene', { classId: classId });
            });
        }, 70, 22);
        
        this.createButton(width / 2, btnY, '🏅 MASTERY', 0x9b59b6, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('ClassMasteryScene', { classId: classId });
            });
        }, 70, 22);
        
        this.createButton(width / 2 + 120, btnY, '⭐ PRESTIGE', 0xf39c12, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('PrestigeScene', { classId: classId });
            });
        }, 70, 22);
    }
    
    createPerksSection(x, y, classId, level) {
        const { width } = this.cameras.main;
        const utilityUnlocked = isUtilitySlotUnlocked(level);
        
        // Section title
        const title = this.add.text(x, y, '💪 PERKS', {
            font: 'bold 16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        this.contentContainer.add(title);
        
        const equipped = ClassProgressionSystem.getEquippedPerks(classId);
        
        // Calculate column positions based on utility unlock
        const columnWidth = utilityUnlocked ? 150 : 180;
        const columns = utilityUnlocked ? 3 : 2;
        const startX = x - (columnWidth * (columns - 1)) / 2;
        
        // Primary perks
        const primaryTitle = this.add.text(startX, y + 25, 'PRIMARY', {
            font: 'bold 10px Arial',
            fill: '#e74c3c'
        }).setOrigin(0.5);
        this.contentContainer.add(primaryTitle);
        
        const primaryPerks = getPrimaryPerks().slice(0, 5);
        primaryPerks.forEach((perk, index) => {
            this.createPerkCard(startX, y + 55 + index * 45, perk, classId, level, equipped?.primary === perk?.id, 'primary', columnWidth - 20);
        });
        
        // Secondary perks
        const secondaryTitle = this.add.text(startX + columnWidth, y + 25, 'SECONDARY', {
            font: 'bold 10px Arial',
            fill: '#3498db'
        }).setOrigin(0.5);
        this.contentContainer.add(secondaryTitle);
        
        const secondaryPerks = getSecondaryPerks().slice(0, 5);
        secondaryPerks.forEach((perk, index) => {
            this.createPerkCard(startX + columnWidth, y + 55 + index * 45, perk, classId, level, equipped?.secondary === perk?.id, 'secondary', columnWidth - 20);
        });
        
        // Utility perks (3rd slot, unlocked at Lv.20)
        if (utilityUnlocked) {
            const utilityTitle = this.add.text(startX + columnWidth * 2, y + 25, 'UTILITY', {
                font: 'bold 10px Arial',
                fill: '#9b59b6'
            }).setOrigin(0.5);
            this.contentContainer.add(utilityTitle);
            
            const utilityPerks = getUtilityPerks();
            utilityPerks.forEach((perk, index) => {
                this.createPerkCard(startX + columnWidth * 2, y + 55 + index * 45, perk, classId, level, equipped?.utility === perk?.id, 'utility', columnWidth - 20);
            });
        } else {
            // Show locked utility slot
            const lockedTitle = this.add.text(startX + columnWidth * 2, y + 25, 'UTILITY 🔒', {
                font: 'bold 10px Arial',
                fill: '#666666'
            }).setOrigin(0.5);
            this.contentContainer.add(lockedTitle);
            
            const lockedInfo = this.add.text(startX + columnWidth * 2, y + 100, 'Unlock at\nLevel 20', {
                font: '12px Arial',
                fill: '#666666',
                align: 'center'
            }).setOrigin(0.5);
            this.contentContainer.add(lockedInfo);
        }
    }
    
    createPerkCard(x, y, perk, classId, level, isEquipped, slot, cardWidth) {
        const isUnlocked = (perk?.unlockLevel ?? 99) <= level;
        
        const card = this.add.container(x, y);
        this.contentContainer.add(card);
        
        // Background
        const bg = this.add.graphics();
        bg.fillStyle(isEquipped ? (perk?.color ?? 0x3498db) : (isUnlocked ? 0x2c3e50 : 0x1a1a2e), isUnlocked ? 1 : 0.5);
        bg.fillRoundedRect(-cardWidth / 2, -18, cardWidth, 36, 6);
        if (isEquipped) {
            bg.lineStyle(2, 0xffd700, 1);
            bg.strokeRoundedRect(-cardWidth / 2, -18, cardWidth, 36, 6);
        }
        card.add(bg);
        
        // Icon
        const icon = this.add.text(-cardWidth / 2 + 18, 0, perk?.icon ?? '⭐', {
            font: '16px Arial'
        }).setOrigin(0.5);
        icon.setAlpha(isUnlocked ? 1 : 0.4);
        card.add(icon);
        
        // Name
        const name = this.add.text(-cardWidth / 2 + 35, -6, perk?.name ?? 'Perk', {
            font: 'bold 10px Arial',
            fill: isUnlocked ? '#ffffff' : '#666666'
        }).setOrigin(0, 0.5);
        card.add(name);
        
        // Description or lock info
        if (isUnlocked) {
            const desc = this.add.text(-cardWidth / 2 + 35, 7, perk?.description ?? '', {
                font: '8px Arial',
                fill: '#aaaaaa'
            }).setOrigin(0, 0.5);
            card.add(desc);
        } else {
            const lockText = this.add.text(-cardWidth / 2 + 35, 7, `🔒 Lv.${perk?.unlockLevel ?? '?'}`, {
                font: '8px Arial',
                fill: '#666666'
            }).setOrigin(0, 0.5);
            card.add(lockText);
        }
        
        // Equip indicator
        if (isUnlocked) {
            const equipText = this.add.text(cardWidth / 2 - 5, 0, isEquipped ? '✔' : '', {
                font: 'bold 12px Arial',
                fill: '#ffd700'
            }).setOrigin(1, 0.5);
            card.add(equipText);
            
            // Make interactive
            card.setInteractive(new Phaser.Geom.Rectangle(-cardWidth / 2, -18, cardWidth, 36), Phaser.Geom.Rectangle.Contains);
            card.on('pointerdown', () => {
                if (isEquipped) {
                    ClassProgressionSystem.unequipPerk(classId, slot);
                } else {
                    ClassProgressionSystem.equipPerk(classId, perk?.id, slot);
                }
                this.scene.restart({ classId: classId });
            });
            
            card.on('pointerover', () => {
                bg.clear();
                bg.fillStyle(perk?.color ?? 0x3498db, 0.8);
                bg.fillRoundedRect(-cardWidth / 2, -18, cardWidth, 36, 6);
            });
            
            card.on('pointerout', () => {
                bg.clear();
                bg.fillStyle(isEquipped ? (perk?.color ?? 0x3498db) : 0x2c3e50, 1);
                bg.fillRoundedRect(-cardWidth / 2, -18, cardWidth, 36, 6);
                if (isEquipped) {
                    bg.lineStyle(2, 0xffd700, 1);
                    bg.strokeRoundedRect(-cardWidth / 2, -18, cardWidth, 36, 6);
                }
            });
        }
    }
    
    createButton(x, y, text, color, callback, btnWidth = 80, btnHeight = 22) {
        const btn = this.add.container(x, y);
        
        const bg = this.add.graphics();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-btnWidth, -btnHeight, btnWidth * 2, btnHeight * 2, 8);
        btn.add(bg);
        
        const label = this.add.text(0, 0, text, {
            font: 'bold 11px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        btn.add(label);
        
        btn.setInteractive(new Phaser.Geom.Rectangle(-btnWidth, -btnHeight, btnWidth * 2, btnHeight * 2), Phaser.Geom.Rectangle.Contains);
        btn.on('pointerdown', callback);
        btn.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(color, 0.8);
            bg.fillRoundedRect(-btnWidth, -btnHeight, btnWidth * 2, btnHeight * 2, 8);
            bg.lineStyle(2, 0xffffff, 0.5);
            bg.strokeRoundedRect(-btnWidth, -btnHeight, btnWidth * 2, btnHeight * 2, 8);
        });
        btn.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(color, 1);
            bg.fillRoundedRect(-btnWidth, -btnHeight, btnWidth * 2, btnHeight * 2, 8);
        });
        
        return btn;
    }
}
