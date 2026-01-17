// PrestigeScene - Prestige system and shop
import { CONFIG } from './Config.js';
import { SaveSystem } from './SaveSystem.js';
import { CLASSES } from './data_Classes.js';
import { PRESTIGE_REWARDS, PRESTIGE_SHOP } from './data_Challenges.js';
import { ClassProgressionSystem } from './ClassProgressionSystem.js';

export class PrestigeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PrestigeScene' });
    }
    
    init(data) {
        this.selectedTab = data?.tab ?? 'prestige';
        this.selectedClassId = data?.classId ?? SaveSystem.getEquippedClass();
    }
    
    create() {
        const { width, height } = this.cameras.main;
        
        this.cameras.main.fadeIn(300, 0, 0, 0);
        
        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1a);
        
        // Title
        this.add.text(width / 2, 30, '⭐ PRESTIGE', {
            font: 'bold 24px Arial',
            fill: '#ffd700'
        }).setOrigin(0.5);
        
        // Back button
        this.createButton(60, 30, '← BACK', 0x34495e, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MenuScene');
            });
        }, 50, 20);
        
        // Token display
        const tokens = ClassProgressionSystem.getPrestigeTokens();
        this.add.text(width - 30, 30, `🪙 ${tokens}`, {
            font: 'bold 16px Arial',
            fill: '#ffd700'
        }).setOrigin(1, 0.5);
        
        // Tabs
        this.createTabs(width / 2, 75);
        
        // Content
        this.contentContainer = this.add.container(0, 0);
        this.showTab(this.selectedTab);
    }
    
    createTabs(x, y) {
        const tabs = [
            { id: 'prestige', name: 'Prestige Classes', icon: '⭐' },
            { id: 'shop', name: 'Prestige Shop', icon: '🛍️' }
        ];
        
        const tabWidth = 150;
        const startX = x - tabWidth / 2;
        
        tabs.forEach((tab, index) => {
            const tabX = startX + index * tabWidth;
            const isSelected = tab.id === this.selectedTab;
            
            const tabContainer = this.add.container(tabX, y);
            
            const bg = this.add.graphics();
            bg.fillStyle(isSelected ? 0xf39c12 : 0x2c3e50, 1);
            bg.fillRoundedRect(-65, -18, 130, 36, 6);
            tabContainer.add(bg);
            
            const text = this.add.text(0, 0, `${tab.icon} ${tab.name}`, {
                font: 'bold 12px Arial',
                fill: '#ffffff'
            }).setOrigin(0.5);
            tabContainer.add(text);
            
            tabContainer.setInteractive(new Phaser.Geom.Rectangle(-65, -18, 130, 36), Phaser.Geom.Rectangle.Contains);
            tabContainer.on('pointerdown', () => {
                this.selectedTab = tab.id;
                this.scene.restart({ tab: tab.id, classId: this.selectedClassId });
            });
        });
    }
    
    showTab(tabId) {
        this.contentContainer.removeAll(true);
        
        if (tabId === 'prestige') {
            this.showPrestigeClasses();
        } else if (tabId === 'shop') {
            this.showPrestigeShop();
        }
    }
    
    showPrestigeClasses() {
        const { width, height } = this.cameras.main;
        const classes = Object.values(CLASSES);
        
        // Total prestige display
        const totalPrestige = ClassProgressionSystem.getTotalPrestige();
        const totalTitle = this.add.text(width / 2, 115, `Total Prestige: ${totalPrestige}`, {
            font: 'bold 16px Arial',
            fill: '#ffd700'
        }).setOrigin(0.5);
        this.contentContainer.add(totalTitle);
        
        // Class cards
        const cardWidth = 140;
        const cardHeight = 180;
        const startX = width / 2 - ((classes.length - 1) * (cardWidth + 15)) / 2;
        const startY = 160;
        
        classes.forEach((cls, index) => {
            const x = startX + index * (cardWidth + 15);
            this.createPrestigeClassCard(x, startY, cls, cardWidth, cardHeight);
        });
        
        // Prestige rewards info
        const rewardsTitle = this.add.text(width / 2, 370, '🎁 PRESTIGE REWARDS', {
            font: 'bold 14px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        this.contentContainer.add(rewardsTitle);
        
        PRESTIGE_REWARDS.slice(0, 3).forEach((reward, index) => {
            const rewardY = 400 + index * 45;
            const rewardText = this.add.text(width / 2, rewardY, 
                `Prestige ${reward?.prestige}: ${reward?.rewards?.map(r => r?.type)?.join(', ') ?? ''}`, {
                font: '12px Arial',
                fill: '#aaaaaa'
            }).setOrigin(0.5);
            this.contentContainer.add(rewardText);
        });
    }
    
    createPrestigeClassCard(x, y, cls, cardWidth, cardHeight) {
        const classId = cls?.id;
        const level = ClassProgressionSystem.getClassLevel(classId);
        const prestige = ClassProgressionSystem.getPrestigeLevel(classId);
        const canPrestige = ClassProgressionSystem.canPrestige(classId);
        const maxLevel = ClassProgressionSystem.getMaxLevel();
        
        const card = this.add.container(x, y);
        this.contentContainer.add(card);
        
        // Background
        const bg = this.add.graphics();
        bg.fillStyle(canPrestige ? 0xf39c12 : 0x2c3e50, 1);
        bg.fillRoundedRect(0, 0, cardWidth, cardHeight, 10);
        if (prestige > 0) {
            bg.lineStyle(2, 0xffd700, 1);
            bg.strokeRoundedRect(0, 0, cardWidth, cardHeight, 10);
        }
        card.add(bg);
        
        // Icon
        const icon = this.add.text(cardWidth / 2, 30, cls?.icon ?? '⚔️', {
            font: '32px Arial'
        }).setOrigin(0.5);
        card.add(icon);
        
        // Name
        const name = this.add.text(cardWidth / 2, 60, cls?.name ?? 'Class', {
            font: 'bold 14px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        card.add(name);
        
        // Level
        const levelText = this.add.text(cardWidth / 2, 85, `Level ${level}/${maxLevel}`, {
            font: '12px Arial',
            fill: level >= maxLevel ? '#ffd700' : '#aaaaaa'
        }).setOrigin(0.5);
        card.add(levelText);
        
        // Prestige stars
        if (prestige > 0) {
            const stars = '⭐'.repeat(Math.min(prestige, 5));
            const starsText = this.add.text(cardWidth / 2, 110, stars, {
                font: '14px Arial'
            }).setOrigin(0.5);
            card.add(starsText);
            
            if (prestige > 5) {
                const extraText = this.add.text(cardWidth / 2, 130, `P${prestige}`, {
                    font: 'bold 12px Arial',
                    fill: '#ffd700'
                }).setOrigin(0.5);
                card.add(extraText);
            }
        }
        
        // Prestige button
        if (canPrestige) {
            const btnY = cardHeight - 30;
            const btnBg = this.add.graphics();
            btnBg.fillStyle(0x27ae60, 1);
            btnBg.fillRoundedRect(10, btnY - 15, cardWidth - 20, 30, 6);
            card.add(btnBg);
            
            const btnText = this.add.text(cardWidth / 2, btnY, 'PRESTIGE!', {
                font: 'bold 11px Arial',
                fill: '#ffffff'
            }).setOrigin(0.5);
            card.add(btnText);
            
            const btnHitArea = this.add.rectangle(cardWidth / 2, btnY, cardWidth - 20, 30);
            btnHitArea.setInteractive();
            btnHitArea.on('pointerdown', () => {
                this.performPrestige(classId);
            });
            card.add(btnHitArea);
        } else if (level < maxLevel) {
            const infoText = this.add.text(cardWidth / 2, cardHeight - 25, `Reach Lv.${maxLevel}`, {
                font: '10px Arial',
                fill: '#666666'
            }).setOrigin(0.5);
            card.add(infoText);
        } else if (prestige >= ClassProgressionSystem.getMaxPrestige()) {
            const maxText = this.add.text(cardWidth / 2, cardHeight - 25, 'MAX PRESTIGE', {
                font: 'bold 10px Arial',
                fill: '#ffd700'
            }).setOrigin(0.5);
            card.add(maxText);
        }
    }
    
    performPrestige(classId) {
        const result = ClassProgressionSystem.prestige(classId);
        if (result) {
            this.showPrestigeAnimation(result);
        }
    }
    
    showPrestigeAnimation(result) {
        const { width, height } = this.cameras.main;
        
        // Overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
        
        // Prestige text
        const prestigeText = this.add.text(width / 2, height / 2 - 50, '⭐ PRESTIGE UP! ⭐', {
            font: 'bold 32px Arial',
            fill: '#ffd700'
        }).setOrigin(0.5);
        
        const levelText = this.add.text(width / 2, height / 2, `Prestige ${result?.newPrestige}`, {
            font: '24px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        const tokensText = this.add.text(width / 2, height / 2 + 50, `+${result?.tokensEarned} Prestige Tokens!`, {
            font: '18px Arial',
            fill: '#ffd700'
        }).setOrigin(0.5);
        
        // Animate
        this.tweens.add({
            targets: [prestigeText, levelText, tokensText],
            scale: { from: 0, to: 1 },
            duration: 500,
            ease: 'Back.easeOut'
        });
        
        // Particles
        for (let i = 0; i < 20; i++) {
            const particle = this.add.text(
                width / 2 + (Math.random() - 0.5) * 200,
                height / 2,
                '⭐',
                { font: '20px Arial' }
            );
            this.tweens.add({
                targets: particle,
                y: height / 2 - 150 - Math.random() * 100,
                x: particle.x + (Math.random() - 0.5) * 100,
                alpha: 0,
                duration: 1500,
                ease: 'Quad.easeOut',
                onComplete: () => particle.destroy()
            });
        }
        
        // Auto close
        this.time.delayedCall(2500, () => {
            this.scene.restart({ tab: 'prestige', classId: result?.classId });
        });
    }
    
    showPrestigeShop() {
        const { width, height } = this.cameras.main;
        const tokens = ClassProgressionSystem.getPrestigeTokens();
        const purchased = ClassProgressionSystem.getPrestigeShopPurchased();
        
        // Shop items
        const columns = 3;
        const cardWidth = 150;
        const cardHeight = 100;
        const startX = width / 2 - ((columns - 1) * (cardWidth + 15)) / 2;
        const startY = 130;
        
        PRESTIGE_SHOP.forEach((item, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);
            const x = startX + col * (cardWidth + 15);
            const y = startY + row * (cardHeight + 15);
            
            const isPurchased = purchased?.includes?.(item?.id);
            const canAfford = tokens >= (item?.cost ?? 0);
            const requirementMet = !item?.requires || purchased?.includes?.(item?.requires);
            
            this.createShopItem(x, y, item, isPurchased, canAfford, requirementMet, cardWidth, cardHeight);
        });
    }
    
    createShopItem(x, y, item, isPurchased, canAfford, requirementMet, cardWidth, cardHeight) {
        const card = this.add.container(x, y);
        this.contentContainer.add(card);
        
        // Background
        const bg = this.add.graphics();
        bg.fillStyle(isPurchased ? 0x27ae60 : (canAfford && requirementMet ? 0x2c3e50 : 0x1a1a2e), 1);
        bg.fillRoundedRect(0, 0, cardWidth, cardHeight, 8);
        card.add(bg);
        
        // Name
        const name = this.add.text(cardWidth / 2, 15, item?.name ?? 'Item', {
            font: 'bold 11px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        card.add(name);
        
        // Description
        const desc = this.add.text(cardWidth / 2, 35, item?.description ?? '', {
            font: '9px Arial',
            fill: '#aaaaaa',
            wordWrap: { width: cardWidth - 20 },
            align: 'center'
        }).setOrigin(0.5, 0);
        card.add(desc);
        
        // Cost or status
        if (isPurchased) {
            const status = this.add.text(cardWidth / 2, cardHeight - 20, '✔ OWNED', {
                font: 'bold 11px Arial',
                fill: '#2ecc71'
            }).setOrigin(0.5);
            card.add(status);
        } else if (!requirementMet) {
            const reqText = this.add.text(cardWidth / 2, cardHeight - 20, 'Requires previous', {
                font: '9px Arial',
                fill: '#e74c3c'
            }).setOrigin(0.5);
            card.add(reqText);
        } else {
            const cost = this.add.text(cardWidth / 2, cardHeight - 20, `🪙 ${item?.cost ?? 0}`, {
                font: 'bold 12px Arial',
                fill: canAfford ? '#ffd700' : '#e74c3c'
            }).setOrigin(0.5);
            card.add(cost);
            
            // Interactive
            if (canAfford) {
                card.setInteractive(new Phaser.Geom.Rectangle(0, 0, cardWidth, cardHeight), Phaser.Geom.Rectangle.Contains);
                card.on('pointerdown', () => {
                    this.purchaseItem(item);
                });
                card.on('pointerover', () => {
                    bg.clear();
                    bg.fillStyle(0x3498db, 1);
                    bg.fillRoundedRect(0, 0, cardWidth, cardHeight, 8);
                });
                card.on('pointerout', () => {
                    bg.clear();
                    bg.fillStyle(0x2c3e50, 1);
                    bg.fillRoundedRect(0, 0, cardWidth, cardHeight, 8);
                });
            }
        }
    }
    
    purchaseItem(item) {
        const success = ClassProgressionSystem.purchasePrestigeItem(item?.id, item?.cost ?? 0);
        if (success) {
            this.showPurchaseConfirmation(item);
        }
    }
    
    showPurchaseConfirmation(item) {
        const { width, height } = this.cameras.main;
        
        const popup = this.add.container(width / 2, height / 2);
        
        const bg = this.add.graphics();
        bg.fillStyle(0x27ae60, 1);
        bg.fillRoundedRect(-100, -30, 200, 60, 12);
        popup.add(bg);
        
        const text = this.add.text(0, 0, `✔ ${item?.name} Purchased!`, {
            font: 'bold 14px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        popup.add(text);
        
        this.tweens.add({
            targets: popup,
            scale: { from: 0.5, to: 1 },
            alpha: { from: 0, to: 1 },
            duration: 200,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.time.delayedCall(1000, () => {
                    popup.destroy();
                    this.scene.restart({ tab: 'shop' });
                });
            }
        });
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
        
        return btn;
    }
}
