// WeaponArsenalScene - View weapons, challenges, and skins
import { CONFIG } from './Config.js';
import { WEAPONS, WEAPON_CHALLENGE_TIERS, getAllWeaponsSorted } from './data_Weapons.js';
import { WEAPON_SKINS, getSkinTier } from './data_Cosmetics.js';
import { ClassProgressionSystem } from './ClassProgressionSystem.js';

export class WeaponArsenalScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WeaponArsenalScene' });
    }
    
    init(data) {
        this.selectedWeapon = data?.weaponId ?? 'pistol';
    }
    
    create() {
        const { width, height } = this.cameras.main;
        
        this.cameras.main.fadeIn(300, 0, 0, 0);
        
        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1a);
        
        // Title
        this.add.text(width / 2, 30, '🔫 WEAPON ARSENAL', {
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
        
        // Weapon list (left side)
        this.createWeaponList(120, 100);
        
        // Weapon details (right side)
        this.detailsContainer = this.add.container(0, 0);
        this.showWeaponDetails(this.selectedWeapon);
    }
    
    createWeaponList(x, y) {
        const weapons = getAllWeaponsSorted();
        
        weapons.forEach((weapon, index) => {
            const itemY = y + index * 48;
            const isSelected = weapon?.id === this.selectedWeapon;
            const isUnlocked = ClassProgressionSystem.isWeaponUnlocked(weapon?.id);
            const kills = ClassProgressionSystem.getWeaponKills(weapon?.id);
            const tier = ClassProgressionSystem.getWeaponMasteryTier(weapon?.id);
            
            const item = this.add.container(x, itemY);
            
            // Background
            const bg = this.add.graphics();
            bg.fillStyle(isSelected ? (weapon?.color ?? 0x3498db) : 0x2c3e50, isUnlocked ? 1 : 0.5);
            bg.fillRoundedRect(-100, -20, 200, 40, 6);
            if (isSelected) {
                bg.lineStyle(2, 0xffffff, 0.5);
                bg.strokeRoundedRect(-100, -20, 200, 40, 6);
            }
            item.add(bg);
            
            // Weapon name
            const name = this.add.text(-80, -8, weapon?.name ?? 'Weapon', {
                font: 'bold 12px Arial',
                fill: isUnlocked ? '#ffffff' : '#666666'
            }).setOrigin(0, 0.5);
            item.add(name);
            
            // Tier badge or lock
            if (isUnlocked) {
                if (tier) {
                    const tierInfo = WEAPON_CHALLENGE_TIERS[tier];
                    const badge = this.add.text(80, -8, tierInfo?.icon ?? '⭐', {
                        font: '14px Arial'
                    }).setOrigin(0.5);
                    item.add(badge);
                }
                const killText = this.add.text(-80, 8, `${kills} kills`, {
                    font: '10px Arial',
                    fill: '#888888'
                }).setOrigin(0, 0.5);
                item.add(killText);
            } else {
                const lockText = this.add.text(-80, 8, `🔒 Lv.${weapon?.unlockLevel ?? '?'}`, {
                    font: '10px Arial',
                    fill: '#666666'
                }).setOrigin(0, 0.5);
                item.add(lockText);
            }
            
            // Interactive
            if (isUnlocked) {
                item.setInteractive(new Phaser.Geom.Rectangle(-100, -20, 200, 40), Phaser.Geom.Rectangle.Contains);
                item.on('pointerdown', () => {
                    this.selectedWeapon = weapon?.id;
                    this.scene.restart({ weaponId: weapon?.id });
                });
            }
        });
    }
    
    showWeaponDetails(weaponId) {
        this.detailsContainer.removeAll(true);
        
        const { width, height } = this.cameras.main;
        const weapon = WEAPONS[weaponId];
        if (!weapon) return;
        
        const centerX = width / 2 + 100;
        
        // Weapon name and icon
        const nameText = this.add.text(centerX, 80, `🔫 ${weapon.name}`, {
            font: 'bold 22px Arial',
            fill: `#${(weapon.color ?? 0xffffff).toString(16).padStart(6, '0')}`
        }).setOrigin(0.5);
        this.detailsContainer.add(nameText);
        
        // Description
        const descText = this.add.text(centerX, 110, weapon.description ?? '', {
            font: '14px Arial',
            fill: '#aaaaaa'
        }).setOrigin(0.5);
        this.detailsContainer.add(descText);
        
        // Stats
        const stats = [
            { label: 'Damage', value: weapon.damage ?? 0, max: 100 },
            { label: 'Fire Rate', value: Math.max(0, 100 - (weapon.fireRate ?? 0) / 10), max: 100 },
            { label: 'Accuracy', value: Math.round((1 - (weapon.spread ?? 0.1)) * 100), max: 100 },
            { label: 'Range', value: (weapon.range ?? 0) / 6, max: 100 }
        ];
        
        stats.forEach((stat, index) => {
            const statY = 150 + index * 35;
            
            const label = this.add.text(centerX - 100, statY, stat.label, {
                font: '12px Arial',
                fill: '#888888'
            }).setOrigin(0, 0.5);
            this.detailsContainer.add(label);
            
            // Bar background
            const barBg = this.add.graphics();
            barBg.fillStyle(0x1a1a2e, 1);
            barBg.fillRoundedRect(centerX - 30, statY - 8, 150, 16, 4);
            this.detailsContainer.add(barBg);
            
            // Bar fill
            const barFill = this.add.graphics();
            barFill.fillStyle(weapon.color ?? 0x3498db, 1);
            barFill.fillRoundedRect(centerX - 28, statY - 6, Math.min(146, stat.value * 1.46), 12, 3);
            this.detailsContainer.add(barFill);
        });
        
        // Challenge progress
        const kills = ClassProgressionSystem.getWeaponKills(weaponId);
        const currentTier = ClassProgressionSystem.getWeaponMasteryTier(weaponId);
        
        const challengeTitle = this.add.text(centerX, 310, '🏆 WEAPON MASTERY', {
            font: 'bold 16px Arial',
            fill: '#ffd700'
        }).setOrigin(0.5);
        this.detailsContainer.add(challengeTitle);
        
        // Show all tiers
        const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
        tiers.forEach((tier, index) => {
            const tierInfo = WEAPON_CHALLENGE_TIERS[tier];
            const tierY = 345 + index * 30;
            const isCompleted = kills >= (tierInfo?.kills ?? Infinity);
            const isCurrent = currentTier === tier || (!currentTier && index === 0);
            
            const tierBg = this.add.graphics();
            tierBg.fillStyle(isCompleted ? (tierInfo?.color ?? 0x888888) : 0x2c3e50, isCompleted ? 0.8 : 0.5);
            tierBg.fillRoundedRect(centerX - 120, tierY - 12, 240, 24, 4);
            this.detailsContainer.add(tierBg);
            
            const icon = this.add.text(centerX - 100, tierY, tierInfo?.icon ?? '★', {
                font: '14px Arial'
            }).setOrigin(0.5);
            this.detailsContainer.add(icon);
            
            const tierName = this.add.text(centerX - 70, tierY, tierInfo?.name ?? tier, {
                font: 'bold 11px Arial',
                fill: isCompleted ? '#ffffff' : '#888888'
            }).setOrigin(0, 0.5);
            this.detailsContainer.add(tierName);
            
            const progress = this.add.text(centerX + 100, tierY, 
                isCompleted ? '✔ Complete' : `${kills}/${tierInfo?.kills ?? 0}`, {
                font: '11px Arial',
                fill: isCompleted ? '#2ecc71' : '#888888'
            }).setOrigin(1, 0.5);
            this.detailsContainer.add(progress);
        });
        
        // Skins section
        const skins = WEAPON_SKINS[weaponId] ?? [];
        if (skins.length > 0) {
            const skinsTitle = this.add.text(centerX, 510, '🎨 WEAPON SKINS', {
                font: 'bold 14px Arial',
                fill: '#9b59b6'
            }).setOrigin(0.5);
            this.detailsContainer.add(skinsTitle);
            
            skins.slice(0, 4).forEach((skin, index) => {
                const skinX = centerX - 80 + (index % 4) * 55;
                const skinY = 545;
                const isUnlocked = skin?.unlock?.type === 'default' || kills >= (skin?.unlock?.kills ?? 0);
                
                const skinBg = this.add.graphics();
                skinBg.fillStyle(skin?.color ?? 0x888888, isUnlocked ? 1 : 0.3);
                skinBg.fillRoundedRect(skinX - 20, skinY - 15, 40, 30, 4);
                this.detailsContainer.add(skinBg);
                
                if (!isUnlocked) {
                    const lock = this.add.text(skinX, skinY, '🔒', {
                        font: '12px Arial'
                    }).setOrigin(0.5);
                    this.detailsContainer.add(lock);
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
