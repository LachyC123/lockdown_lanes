// CosmeticsScene - Browse and equip cosmetics
import { CONFIG } from './Config.js';
import { PLAYER_SKINS, CALLING_CARDS, EMBLEMS, getPlayerSkin, getCallingCard, getEmblem } from './data_Cosmetics.js';
import { ClassProgressionSystem } from './ClassProgressionSystem.js';
import { SaveSystem } from './SaveSystem.js';
import { CLASSES } from './data_Classes.js';

export class CosmeticsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CosmeticsScene' });
    }
    
    init(data) {
        this.selectedTab = data?.tab ?? 'skins';
    }
    
    create() {
        const { width, height } = this.cameras.main;
        
        this.cameras.main.fadeIn(300, 0, 0, 0);
        
        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1a);
        
        // Title
        this.add.text(width / 2, 30, '🎨 COSMETICS', {
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
        
        // Tabs
        this.createTabs(width / 2, 75);
        
        // Content
        this.contentContainer = this.add.container(0, 0);
        this.showTab(this.selectedTab);
    }
    
    createTabs(x, y) {
        const tabs = [
            { id: 'skins', name: 'Player Skins', icon: '👤' },
            { id: 'cards', name: 'Calling Cards', icon: '🃏' },
            { id: 'emblems', name: 'Emblems', icon: '🎖️' }
        ];
        
        const tabWidth = 130;
        const startX = x - tabWidth;
        
        tabs.forEach((tab, index) => {
            const tabX = startX + index * tabWidth;
            const isSelected = tab.id === this.selectedTab;
            
            const tabContainer = this.add.container(tabX, y);
            
            const bg = this.add.graphics();
            bg.fillStyle(isSelected ? 0x9b59b6 : 0x2c3e50, 1);
            bg.fillRoundedRect(-55, -18, 110, 36, 6);
            tabContainer.add(bg);
            
            const text = this.add.text(0, 0, `${tab.icon} ${tab.name}`, {
                font: 'bold 11px Arial',
                fill: '#ffffff'
            }).setOrigin(0.5);
            tabContainer.add(text);
            
            tabContainer.setInteractive(new Phaser.Geom.Rectangle(-55, -18, 110, 36), Phaser.Geom.Rectangle.Contains);
            tabContainer.on('pointerdown', () => {
                this.selectedTab = tab.id;
                this.scene.restart({ tab: tab.id });
            });
        });
    }
    
    showTab(tabId) {
        this.contentContainer.removeAll(true);
        
        if (tabId === 'skins') {
            this.showSkins();
        } else if (tabId === 'cards') {
            this.showCallingCards();
        } else if (tabId === 'emblems') {
            this.showEmblems();
        }
    }
    
    showSkins() {
        const { width, height } = this.cameras.main;
        const equipped = ClassProgressionSystem.getEquippedCosmetics();
        const unlocked = ClassProgressionSystem.getUnlockedCosmetics();
        
        const columns = 4;
        const cardWidth = 80;
        const cardHeight = 100;
        const startX = width / 2 - ((columns - 1) * (cardWidth + 15)) / 2;
        const startY = 130;
        
        PLAYER_SKINS.forEach((skin, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);
            const x = startX + col * (cardWidth + 15);
            const y = startY + row * (cardHeight + 15);
            
            const isUnlocked = this.isSkinUnlocked(skin);
            const isEquipped = equipped?.playerSkin === skin?.id;
            
            this.createSkinCard(x, y, skin, isUnlocked, isEquipped, cardWidth, cardHeight);
        });
    }
    
    isSkinUnlocked(skin) {
        if (!skin?.unlock) return false;
        if (skin.unlock.type === 'default') return true;
        
        const unlocked = ClassProgressionSystem.getUnlockedCosmetics();
        if (unlocked?.includes?.(skin.id)) return true;
        
        // Check unlock conditions
        if (skin.unlock.type === 'level') {
            const maxLevel = Math.max(...Object.keys(CLASSES ?? {}).map(c => ClassProgressionSystem.getClassLevel(c)));
            return maxLevel >= (skin.unlock.level ?? 99);
        }
        if (skin.unlock.type === 'prestige') {
            const totalPrestige = ClassProgressionSystem.getTotalPrestige();
            return totalPrestige >= (skin.unlock.prestige ?? 99);
        }
        
        return false;
    }
    
    createSkinCard(x, y, skin, isUnlocked, isEquipped, cardWidth, cardHeight) {
        const card = this.add.container(x, y);
        this.contentContainer.add(card);
        
        // Background
        const bg = this.add.graphics();
        bg.fillStyle(isEquipped ? 0x27ae60 : (isUnlocked ? 0x2c3e50 : 0x1a1a2e), 1);
        bg.fillRoundedRect(0, 0, cardWidth, cardHeight, 8);
        if (isEquipped) {
            bg.lineStyle(2, 0xffd700, 1);
            bg.strokeRoundedRect(0, 0, cardWidth, cardHeight, 8);
        }
        card.add(bg);
        
        // Color preview
        const preview = this.add.graphics();
        preview.fillStyle(skin?.color ?? 0x888888, isUnlocked ? 1 : 0.3);
        preview.fillCircle(cardWidth / 2, 35, 25);
        card.add(preview);
        
        // Name
        const name = this.add.text(cardWidth / 2, 75, skin?.name ?? 'Skin', {
            font: 'bold 10px Arial',
            fill: isUnlocked ? '#ffffff' : '#666666'
        }).setOrigin(0.5);
        card.add(name);
        
        // Lock or equip indicator
        if (!isUnlocked) {
            const lock = this.add.text(cardWidth / 2, 35, '🔒', {
                font: '20px Arial'
            }).setOrigin(0.5);
            card.add(lock);
            
            const unlockText = this.add.text(cardWidth / 2, 90, this.getUnlockText(skin?.unlock), {
                font: '8px Arial',
                fill: '#666666'
            }).setOrigin(0.5);
            card.add(unlockText);
        } else if (isEquipped) {
            const equipped = this.add.text(cardWidth / 2, 90, '✔ EQUIPPED', {
                font: 'bold 9px Arial',
                fill: '#2ecc71'
            }).setOrigin(0.5);
            card.add(equipped);
        }
        
        // Interactive
        if (isUnlocked && !isEquipped) {
            card.setInteractive(new Phaser.Geom.Rectangle(0, 0, cardWidth, cardHeight), Phaser.Geom.Rectangle.Contains);
            card.on('pointerdown', () => {
                ClassProgressionSystem.setEquippedCosmetic('playerSkin', skin?.id);
                this.scene.restart({ tab: 'skins' });
            });
        }
    }
    
    getUnlockText(unlock) {
        if (!unlock) return '';
        if (unlock.type === 'level') return `Lv.${unlock.level}`;
        if (unlock.type === 'prestige') return `P${unlock.prestige}`;
        if (unlock.type === 'wins') return `${unlock.wins} wins`;
        if (unlock.type === 'kills') return `${unlock.kills} kills`;
        if (unlock.type === 'achievement') return 'Achievement';
        return '';
    }
    
    showCallingCards() {
        const { width, height } = this.cameras.main;
        const equipped = ClassProgressionSystem.getEquippedCosmetics();
        
        const columns = 3;
        const cardWidth = 150;
        const cardHeight = 70;
        const startX = width / 2 - ((columns - 1) * (cardWidth + 15)) / 2;
        const startY = 130;
        
        CALLING_CARDS.forEach((card, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);
            const x = startX + col * (cardWidth + 15);
            const y = startY + row * (cardHeight + 15);
            
            const isUnlocked = this.isCardUnlocked(card);
            const isEquipped = equipped?.callingCard === card?.id;
            
            this.createCallingCardItem(x, y, card, isUnlocked, isEquipped, cardWidth, cardHeight);
        });
    }
    
    isCardUnlocked(card) {
        if (!card?.unlock) return false;
        if (card.unlock.type === 'default') return true;
        
        if (card.unlock.type === 'wins') {
            return (SaveSystem.data?.totalWins ?? 0) >= (card.unlock.wins ?? 999);
        }
        if (card.unlock.type === 'prestige') {
            return ClassProgressionSystem.getTotalPrestige() >= (card.unlock.prestige ?? 99);
        }
        if (card.unlock.type === 'kills') {
            return (SaveSystem.data?.totalKills ?? 0) >= (card.unlock.kills ?? 999);
        }
        if (card.unlock.type === 'plants') {
            return (SaveSystem.data?.bombsPlanted ?? 0) >= (card.unlock.plants ?? 999);
        }
        if (card.unlock.type === 'defuses') {
            return (SaveSystem.data?.bombsDefused ?? 0) >= (card.unlock.defuses ?? 999);
        }
        if (card.unlock.type === 'streak') {
            return (SaveSystem.data?.bestWinStreak ?? 0) >= (card.unlock.streak ?? 999);
        }
        
        return false;
    }
    
    createCallingCardItem(x, y, card, isUnlocked, isEquipped, cardWidth, cardHeight) {
        const container = this.add.container(x, y);
        this.contentContainer.add(container);
        
        // Background with gradient simulation
        const bg = this.add.graphics();
        if (isUnlocked && card?.gradient) {
            // Simple solid color fallback
            bg.fillStyle(parseInt(card.gradient[0]?.replace?.('#', '') ?? 'ffffff', 16), 1);
        } else {
            bg.fillStyle(0x1a1a2e, isUnlocked ? 1 : 0.5);
        }
        bg.fillRoundedRect(0, 0, cardWidth, cardHeight, 8);
        if (isEquipped) {
            bg.lineStyle(2, 0xffd700, 1);
            bg.strokeRoundedRect(0, 0, cardWidth, cardHeight, 8);
        }
        container.add(bg);
        
        // Name
        const name = this.add.text(cardWidth / 2, cardHeight / 2 - 10, card?.name ?? 'Card', {
            font: 'bold 12px Arial',
            fill: isUnlocked ? '#ffffff' : '#666666'
        }).setOrigin(0.5);
        container.add(name);
        
        // Status
        if (!isUnlocked) {
            const lock = this.add.text(cardWidth / 2, cardHeight / 2 + 10, '🔒 ' + this.getCardUnlockText(card?.unlock), {
                font: '9px Arial',
                fill: '#666666'
            }).setOrigin(0.5);
            container.add(lock);
        } else if (isEquipped) {
            const equipped = this.add.text(cardWidth / 2, cardHeight / 2 + 15, '✔ EQUIPPED', {
                font: 'bold 9px Arial',
                fill: '#2ecc71'
            }).setOrigin(0.5);
            container.add(equipped);
        }
        
        // Interactive
        if (isUnlocked && !isEquipped) {
            container.setInteractive(new Phaser.Geom.Rectangle(0, 0, cardWidth, cardHeight), Phaser.Geom.Rectangle.Contains);
            container.on('pointerdown', () => {
                ClassProgressionSystem.setEquippedCosmetic('callingCard', card?.id);
                this.scene.restart({ tab: 'cards' });
            });
        }
    }
    
    getCardUnlockText(unlock) {
        if (!unlock) return '';
        if (unlock.type === 'wins') return `${unlock.wins} wins`;
        if (unlock.type === 'kills') return `${unlock.kills} kills`;
        if (unlock.type === 'prestige') return `Prestige ${unlock.prestige}`;
        if (unlock.type === 'plants') return `${unlock.plants} plants`;
        if (unlock.type === 'defuses') return `${unlock.defuses} defuses`;
        if (unlock.type === 'streak') return `${unlock.streak} streak`;
        return '';
    }
    
    showEmblems() {
        const { width, height } = this.cameras.main;
        const equipped = ClassProgressionSystem.getEquippedCosmetics();
        
        const columns = 6;
        const cardSize = 70;
        const startX = width / 2 - ((columns - 1) * (cardSize + 10)) / 2;
        const startY = 130;
        
        EMBLEMS.forEach((emblem, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);
            const x = startX + col * (cardSize + 10);
            const y = startY + row * (cardSize + 10);
            
            const isUnlocked = this.isEmblemUnlocked(emblem);
            const isEquipped = equipped?.emblem === emblem?.id;
            
            this.createEmblemItem(x, y, emblem, isUnlocked, isEquipped, cardSize);
        });
    }
    
    isEmblemUnlocked(emblem) {
        if (!emblem?.unlock) return false;
        if (emblem.unlock.type === 'default') return true;
        
        if (emblem.unlock.type === 'kills') {
            return (SaveSystem.data?.totalKills ?? 0) >= (emblem.unlock.kills ?? 999);
        }
        if (emblem.unlock.type === 'wins') {
            return (SaveSystem.data?.totalWins ?? 0) >= (emblem.unlock.wins ?? 999);
        }
        if (emblem.unlock.type === 'prestige') {
            return ClassProgressionSystem.getTotalPrestige() >= (emblem.unlock.prestige ?? 99);
        }
        if (emblem.unlock.type === 'level') {
            const maxLevel = Math.max(...Object.keys(CLASSES ?? {}).map(c => ClassProgressionSystem.getClassLevel(c)));
            return maxLevel >= (emblem.unlock.level ?? 99);
        }
        if (emblem.unlock.type === 'trophies') {
            return (SaveSystem.data?.highestTrophies ?? 0) >= (emblem.unlock.trophies ?? 9999);
        }
        if (emblem.unlock.type === 'plants') {
            return (SaveSystem.data?.bombsPlanted ?? 0) >= (emblem.unlock.plants ?? 999);
        }
        if (emblem.unlock.type === 'defuses') {
            return (SaveSystem.data?.bombsDefused ?? 0) >= (emblem.unlock.defuses ?? 999);
        }
        if (emblem.unlock.type === 'streak') {
            return (SaveSystem.data?.bestWinStreak ?? 0) >= (emblem.unlock.streak ?? 999);
        }
        
        return false;
    }
    
    createEmblemItem(x, y, emblem, isUnlocked, isEquipped, size) {
        const container = this.add.container(x, y);
        this.contentContainer.add(container);
        
        // Background
        const bg = this.add.graphics();
        bg.fillStyle(isEquipped ? 0x27ae60 : (isUnlocked ? 0x2c3e50 : 0x1a1a2e), 1);
        bg.fillRoundedRect(0, 0, size, size, 8);
        if (isEquipped) {
            bg.lineStyle(2, 0xffd700, 1);
            bg.strokeRoundedRect(0, 0, size, size, 8);
        }
        container.add(bg);
        
        // Icon
        const icon = this.add.text(size / 2, size / 2 - 8, emblem?.icon ?? '⭐', {
            font: '24px Arial'
        }).setOrigin(0.5);
        icon.setAlpha(isUnlocked ? 1 : 0.3);
        container.add(icon);
        
        // Name
        const name = this.add.text(size / 2, size - 12, emblem?.name ?? '', {
            font: '8px Arial',
            fill: isUnlocked ? '#ffffff' : '#666666'
        }).setOrigin(0.5);
        container.add(name);
        
        // Lock
        if (!isUnlocked) {
            const lock = this.add.text(size - 10, 10, '🔒', {
                font: '10px Arial'
            }).setOrigin(0.5);
            container.add(lock);
        }
        
        // Interactive
        if (isUnlocked && !isEquipped) {
            container.setInteractive(new Phaser.Geom.Rectangle(0, 0, size, size), Phaser.Geom.Rectangle.Contains);
            container.on('pointerdown', () => {
                ClassProgressionSystem.setEquippedCosmetic('emblem', emblem?.id);
                this.scene.restart({ tab: 'emblems' });
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
            font: 'bold 12px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        btn.add(label);
        
        btn.setInteractive(new Phaser.Geom.Rectangle(-btnWidth, -btnHeight, btnWidth * 2, btnHeight * 2), Phaser.Geom.Rectangle.Contains);
        btn.on('pointerdown', callback);
        
        return btn;
    }
}
