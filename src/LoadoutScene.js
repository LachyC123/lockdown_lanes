// LoadoutScene - Loadout editing interface - EXPANDED v2.0
import { CONFIG } from './Config.js';
import { SaveSystem } from './SaveSystem.js';
import { CLASSES } from './data_Classes.js';
import { WEAPONS, KITS, getWeapon } from './data_Weapons.js';
import { PERKS, getPrimaryPerks, getSecondaryPerks, getUtilityPerks, isUtilitySlotUnlocked } from './data_Perks.js';
import { WEAPON_SKINS } from './data_Cosmetics.js';
import { ClassProgressionSystem } from './ClassProgressionSystem.js';

export class LoadoutScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadoutScene' });
    }
    
    init(data) {
        this.selectedClassId = data?.classId ?? SaveSystem.getEquippedClass();
        this.selectedLoadoutIndex = ClassProgressionSystem.getActiveLoadoutIndex(this.selectedClassId);
        this.editingField = null;
    }
    
    create() {
        const { width, height } = this.cameras.main;
        
        this.cameras.main.fadeIn(300, 0, 0, 0);
        
        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1a);
        
        // Title
        const cls = CLASSES[this.selectedClassId] ?? CLASSES.assault;
        this.add.text(width / 2, 30, `📋 ${cls?.icon ?? '⚔️'} ${cls?.name ?? 'Class'} LOADOUTS`, {
            font: 'bold 20px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Back button
        this.createButton(60, 30, '← BACK', 0x34495e, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('ProgressionScene', { classId: this.selectedClassId });
            });
        }, 50, 20);
        
        // Loadout slots (up to 5)
        this.createLoadoutSlots(width / 2, 80);
        
        // Main content
        this.contentContainer = this.add.container(0, 0);
        this.selectorPanel = null;
        
        this.showLoadoutEditor();
    }
    
    createLoadoutSlots(x, y) {
        const loadouts = ClassProgressionSystem.getLoadouts(this.selectedClassId);
        const maxSlots = ClassProgressionSystem.getMaxLoadoutSlots(this.selectedClassId);
        const slotWidth = maxSlots <= 3 ? 120 : 90;
        const totalWidth = (maxSlots - 1) * slotWidth;
        const startX = x - totalWidth / 2;
        
        this.loadoutSlots = [];
        
        for (let i = 0; i < maxSlots; i++) {
            const slotX = startX + i * slotWidth;
            const isSelected = i === this.selectedLoadoutIndex;
            const loadout = loadouts[i] ?? { name: `Loadout ${i + 1}` };
            
            const slot = this.add.container(slotX, y);
            
            const bg = this.add.graphics();
            bg.fillStyle(isSelected ? 0x27ae60 : 0x2c3e50, 1);
            bg.fillRoundedRect(-40, -20, 80, 40, 6);
            if (isSelected) {
                bg.lineStyle(2, 0xffffff, 0.5);
                bg.strokeRoundedRect(-40, -20, 80, 40, 6);
            }
            slot.add(bg);
            
            const name = this.add.text(0, -5, loadout?.name ?? `Loadout ${i + 1}`, {
                font: 'bold 10px Arial',
                fill: '#ffffff'
            }).setOrigin(0.5);
            slot.add(name);
            
            const activeText = this.add.text(0, 10, isSelected ? '✔ ACTIVE' : 'SELECT', {
                font: '9px Arial',
                fill: isSelected ? '#ffffff' : '#888888'
            }).setOrigin(0.5);
            slot.add(activeText);
            
            slot.setInteractive(new Phaser.Geom.Rectangle(-40, -20, 80, 40), Phaser.Geom.Rectangle.Contains);
            slot.on('pointerdown', () => {
                this.selectedLoadoutIndex = i;
                ClassProgressionSystem.setActiveLoadout(this.selectedClassId, i);
                this.scene.restart({ classId: this.selectedClassId });
            });
            
            this.loadoutSlots.push(slot);
        }
    }
    
    showLoadoutEditor() {
        this.contentContainer.removeAll(true);
        if (this.selectorPanel) {
            this.selectorPanel.destroy();
            this.selectorPanel = null;
        }
        
        const { width, height } = this.cameras.main;
        const loadouts = ClassProgressionSystem.getLoadouts(this.selectedClassId);
        const loadout = loadouts[this.selectedLoadoutIndex] ?? { 
            name: 'Loadout', 
            weapon: 'pistol', 
            primaryPerk: null, 
            secondaryPerk: null,
            utilityPerk: null,
            weaponSkin: null
        };
        const level = ClassProgressionSystem.getClassLevel(this.selectedClassId);
        const utilityUnlocked = isUtilitySlotUnlocked(level);
        
        // Weapon section
        this.createEditorRow(width / 2, 140, '🔫 WEAPON', loadout?.weapon, 'weapon', level);
        
        // Primary perk section
        this.createEditorRow(width / 2, 200, '⚔️ PRIMARY PERK', loadout?.primaryPerk, 'primary', level);
        
        // Secondary perk section
        this.createEditorRow(width / 2, 260, '🛡️ SECONDARY PERK', loadout?.secondaryPerk, 'secondary', level);
        
        // Utility perk section
        if (utilityUnlocked) {
            this.createEditorRow(width / 2, 320, '🔧 UTILITY PERK', loadout?.utilityPerk, 'utility', level);
        } else {
            this.createLockedRow(width / 2, 320, '🔧 UTILITY PERK', 'Unlock at Level 20');
        }
        
        // Weapon skin section
        this.createEditorRow(width / 2, utilityUnlocked ? 380 : 320, '🎨 WEAPON SKIN', loadout?.weaponSkin, 'skin', level);
        
        // Stats preview
        const statsY = utilityUnlocked ? 450 : 390;
        this.createStatsPreview(width / 2, statsY, loadout);
        
        // Save button
        this.createButton(width / 2, height - 45, '✔ SAVE & EQUIP', 0x27ae60, () => {
            // Apply perks to equipped perks
            if (loadout?.primaryPerk) {
                ClassProgressionSystem.equipPerk(this.selectedClassId, loadout.primaryPerk, 'primary');
            }
            if (loadout?.secondaryPerk) {
                ClassProgressionSystem.equipPerk(this.selectedClassId, loadout.secondaryPerk, 'secondary');
            }
            if (loadout?.utilityPerk && utilityUnlocked) {
                ClassProgressionSystem.equipPerk(this.selectedClassId, loadout.utilityPerk, 'utility');
            }
            
            this.showSaveConfirmation();
        }, 90, 22);
    }
    
    createEditorRow(x, y, label, currentValue, field, level) {
        const row = this.add.container(x, y);
        this.contentContainer.add(row);
        
        // Label
        const labelText = this.add.text(-170, -18, label, {
            font: 'bold 12px Arial',
            fill: '#888888'
        }).setOrigin(0, 0.5);
        row.add(labelText);
        
        // Current selection box
        const boxBg = this.add.graphics();
        boxBg.fillStyle(0x2c3e50, 1);
        boxBg.fillRoundedRect(-170, -5, 340, 40, 6);
        boxBg.lineStyle(2, 0x3498db, 0.5);
        boxBg.strokeRoundedRect(-170, -5, 340, 40, 6);
        row.add(boxBg);
        
        // Get display info
        let displayIcon = '➖';
        let displayName = 'None Selected';
        let displayDesc = 'Click to select';
        
        if (field === 'weapon' && currentValue) {
            const weapon = WEAPONS[currentValue];
            displayIcon = '🔫';
            displayName = weapon?.name ?? currentValue;
            displayDesc = weapon?.description ?? '';
        } else if ((field === 'primary' || field === 'secondary' || field === 'utility') && currentValue) {
            const perk = PERKS[currentValue];
            displayIcon = perk?.icon ?? '⭐';
            displayName = perk?.name ?? currentValue;
            displayDesc = perk?.description ?? '';
        } else if (field === 'skin') {
            if (currentValue) {
                displayIcon = '🎨';
                displayName = currentValue;
                displayDesc = 'Equipped skin';
            } else {
                displayName = 'Default';
                displayDesc = 'No custom skin';
            }
        }
        
        const icon = this.add.text(-150, 15, displayIcon, {
            font: '20px Arial'
        }).setOrigin(0.5);
        row.add(icon);
        
        const name = this.add.text(-125, 8, displayName, {
            font: 'bold 12px Arial',
            fill: '#ffffff'
        }).setOrigin(0, 0.5);
        row.add(name);
        
        const desc = this.add.text(-125, 24, displayDesc, {
            font: '10px Arial',
            fill: '#aaaaaa'
        }).setOrigin(0, 0.5);
        row.add(desc);
        
        // Change button
        const changeBtn = this.add.text(150, 15, 'CHANGE ▼', {
            font: 'bold 10px Arial',
            fill: '#3498db'
        }).setOrigin(0.5);
        row.add(changeBtn);
        
        // Make interactive
        row.setInteractive(new Phaser.Geom.Rectangle(-170, -5, 340, 40), Phaser.Geom.Rectangle.Contains);
        row.on('pointerdown', () => {
            this.showSelector(field, currentValue, level);
        });
        row.on('pointerover', () => {
            boxBg.clear();
            boxBg.fillStyle(0x34495e, 1);
            boxBg.fillRoundedRect(-170, -5, 340, 40, 6);
            boxBg.lineStyle(2, 0x3498db, 1);
            boxBg.strokeRoundedRect(-170, -5, 340, 40, 6);
        });
        row.on('pointerout', () => {
            boxBg.clear();
            boxBg.fillStyle(0x2c3e50, 1);
            boxBg.fillRoundedRect(-170, -5, 340, 40, 6);
            boxBg.lineStyle(2, 0x3498db, 0.5);
            boxBg.strokeRoundedRect(-170, -5, 340, 40, 6);
        });
    }
    
    createLockedRow(x, y, label, lockText) {
        const row = this.add.container(x, y);
        this.contentContainer.add(row);
        
        // Label
        const labelText = this.add.text(-170, -18, label + ' 🔒', {
            font: 'bold 12px Arial',
            fill: '#666666'
        }).setOrigin(0, 0.5);
        row.add(labelText);
        
        // Locked box
        const boxBg = this.add.graphics();
        boxBg.fillStyle(0x1a1a2e, 0.5);
        boxBg.fillRoundedRect(-170, -5, 340, 40, 6);
        row.add(boxBg);
        
        const lock = this.add.text(0, 15, `🔒 ${lockText}`, {
            font: '12px Arial',
            fill: '#666666'
        }).setOrigin(0.5);
        row.add(lock);
    }
    
    showSelector(field, currentValue, level) {
        if (this.selectorPanel) {
            this.selectorPanel.destroy();
        }
        
        const { width, height } = this.cameras.main;
        
        this.selectorPanel = this.add.container(width / 2, height / 2);
        
        // Overlay
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
        overlay.setInteractive();
        this.selectorPanel.add(overlay);
        
        // Panel
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x1a1a2e, 1);
        panelBg.fillRoundedRect(-200, -230, 400, 460, 12);
        panelBg.lineStyle(2, 0x3498db, 1);
        panelBg.strokeRoundedRect(-200, -230, 400, 460, 12);
        this.selectorPanel.add(panelBg);
        
        // Title
        let title = 'SELECT';
        let options = [];
        
        if (field === 'weapon') {
            title = 'SELECT WEAPON';
            Object.values(WEAPONS).forEach(weapon => {
                const isUnlocked = ClassProgressionSystem.isWeaponUnlocked(weapon?.id);
                options.push({
                    id: weapon?.id,
                    icon: '🔫',
                    name: weapon?.name ?? 'Weapon',
                    desc: weapon?.description ?? '',
                    unlocked: isUnlocked,
                    unlockLevel: weapon?.unlockLevel ?? 0,
                    color: weapon?.color ?? 0x888888
                });
            });
        } else if (field === 'primary') {
            title = 'SELECT PRIMARY PERK';
            getPrimaryPerks().forEach(perk => {
                const isUnlocked = (perk?.unlockLevel ?? 99) <= level;
                options.push({
                    id: perk?.id,
                    icon: perk?.icon ?? '⭐',
                    name: perk?.name ?? 'Perk',
                    desc: perk?.description ?? '',
                    unlocked: isUnlocked,
                    unlockLevel: perk?.unlockLevel ?? 0,
                    color: perk?.color ?? 0x888888
                });
            });
            options.unshift({ id: null, icon: '➖', name: 'None', desc: 'No perk equipped', unlocked: true, unlockLevel: 0, color: 0x888888 });
        } else if (field === 'secondary') {
            title = 'SELECT SECONDARY PERK';
            getSecondaryPerks().forEach(perk => {
                const isUnlocked = (perk?.unlockLevel ?? 99) <= level;
                options.push({
                    id: perk?.id,
                    icon: perk?.icon ?? '⭐',
                    name: perk?.name ?? 'Perk',
                    desc: perk?.description ?? '',
                    unlocked: isUnlocked,
                    unlockLevel: perk?.unlockLevel ?? 0,
                    color: perk?.color ?? 0x888888
                });
            });
            options.unshift({ id: null, icon: '➖', name: 'None', desc: 'No perk equipped', unlocked: true, unlockLevel: 0, color: 0x888888 });
        } else if (field === 'utility') {
            title = 'SELECT UTILITY PERK';
            getUtilityPerks().forEach(perk => {
                const isUnlocked = (perk?.unlockLevel ?? 99) <= level;
                options.push({
                    id: perk?.id,
                    icon: perk?.icon ?? '⭐',
                    name: perk?.name ?? 'Perk',
                    desc: perk?.description ?? '',
                    unlocked: isUnlocked,
                    unlockLevel: perk?.unlockLevel ?? 0,
                    color: perk?.color ?? 0x888888
                });
            });
            options.unshift({ id: null, icon: '➖', name: 'None', desc: 'No perk equipped', unlocked: true, unlockLevel: 0, color: 0x888888 });
        } else if (field === 'skin') {
            title = 'SELECT WEAPON SKIN';
            const loadouts = ClassProgressionSystem.getLoadouts(this.selectedClassId);
            const loadout = loadouts[this.selectedLoadoutIndex] ?? {};
            const weaponId = loadout?.weapon ?? 'pistol';
            const skins = WEAPON_SKINS[weaponId] ?? [];
            const kills = ClassProgressionSystem.getWeaponKills(weaponId);
            
            skins.forEach(skin => {
                const isUnlocked = skin?.unlock?.type === 'default' || kills >= (skin?.unlock?.kills ?? 999);
                options.push({
                    id: skin?.id,
                    icon: '🎨',
                    name: skin?.name ?? 'Skin',
                    desc: isUnlocked ? skin?.tier ?? 'common' : `${skin?.unlock?.kills ?? 0} kills needed`,
                    unlocked: isUnlocked,
                    unlockLevel: 0,
                    color: skin?.color ?? 0x888888
                });
            });
        }
        
        const titleText = this.add.text(0, -205, title, {
            font: 'bold 16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        this.selectorPanel.add(titleText);
        
        // Scrollable options
        const maxVisible = 8;
        const optionHeight = 45;
        options.slice(0, maxVisible).forEach((opt, index) => {
            const optY = -160 + index * optionHeight;
            this.createSelectorOption(0, optY, opt, field, currentValue);
        });
        
        // Close button
        const closeBtn = this.add.text(175, -205, '✖', {
            font: 'bold 18px Arial',
            fill: '#e74c3c'
        }).setOrigin(0.5);
        closeBtn.setInteractive();
        closeBtn.on('pointerdown', () => {
            this.selectorPanel.destroy();
            this.selectorPanel = null;
        });
        this.selectorPanel.add(closeBtn);
    }
    
    createSelectorOption(x, y, option, field, currentValue) {
        const isSelected = option?.id === currentValue;
        const opt = this.add.container(x, y);
        this.selectorPanel.add(opt);
        
        const bg = this.add.graphics();
        bg.fillStyle(isSelected ? (option?.color ?? 0x3498db) : (option?.unlocked ? 0x2c3e50 : 0x1a1a2e), option?.unlocked ? 1 : 0.5);
        bg.fillRoundedRect(-175, -18, 350, 36, 6);
        if (isSelected) {
            bg.lineStyle(2, 0xffd700, 1);
            bg.strokeRoundedRect(-175, -18, 350, 36, 6);
        }
        opt.add(bg);
        
        const icon = this.add.text(-155, 0, option?.icon ?? '⭐', {
            font: '18px Arial'
        }).setOrigin(0.5);
        icon.setAlpha(option?.unlocked ? 1 : 0.4);
        opt.add(icon);
        
        const name = this.add.text(-125, -6, option?.name ?? 'Option', {
            font: 'bold 11px Arial',
            fill: option?.unlocked ? '#ffffff' : '#666666'
        }).setOrigin(0, 0.5);
        opt.add(name);
        
        if (option?.unlocked) {
            const desc = this.add.text(-125, 8, option?.desc ?? '', {
                font: '9px Arial',
                fill: '#aaaaaa'
            }).setOrigin(0, 0.5);
            opt.add(desc);
        } else {
            const lockText = this.add.text(-125, 8, `🔒 Level ${option?.unlockLevel ?? '?'}`, {
                font: '9px Arial',
                fill: '#666666'
            }).setOrigin(0, 0.5);
            opt.add(lockText);
        }
        
        if (isSelected) {
            const checkmark = this.add.text(155, 0, '✔', {
                font: 'bold 16px Arial',
                fill: '#ffd700'
            }).setOrigin(0.5);
            opt.add(checkmark);
        }
        
        if (option?.unlocked) {
            opt.setInteractive(new Phaser.Geom.Rectangle(-175, -18, 350, 36), Phaser.Geom.Rectangle.Contains);
            opt.on('pointerdown', () => {
                this.selectOption(field, option?.id);
            });
        }
    }
    
    selectOption(field, value) {
        const loadouts = ClassProgressionSystem.getLoadouts(this.selectedClassId);
        const loadout = { ...(loadouts[this.selectedLoadoutIndex] ?? { 
            name: `Loadout ${this.selectedLoadoutIndex + 1}`, 
            weapon: 'pistol', 
            primaryPerk: null, 
            secondaryPerk: null,
            utilityPerk: null,
            weaponSkin: null
        }) };
        
        if (field === 'weapon') {
            loadout.weapon = value || 'pistol';
            loadout.weaponSkin = null; // Reset skin when weapon changes
        } else if (field === 'primary') {
            loadout.primaryPerk = value;
        } else if (field === 'secondary') {
            loadout.secondaryPerk = value;
        } else if (field === 'utility') {
            loadout.utilityPerk = value;
        } else if (field === 'skin') {
            loadout.weaponSkin = value;
        }
        
        ClassProgressionSystem.saveLoadout(this.selectedClassId, this.selectedLoadoutIndex, loadout);
        
        if (this.selectorPanel) {
            this.selectorPanel.destroy();
            this.selectorPanel = null;
        }
        
        this.showLoadoutEditor();
    }
    
    createStatsPreview(x, y, loadout) {
        const preview = this.add.container(x, y);
        this.contentContainer.add(preview);
        
        const title = this.add.text(0, -25, '📊 STATS PREVIEW', {
            font: 'bold 12px Arial',
            fill: '#888888'
        }).setOrigin(0.5);
        preview.add(title);
        
        // Calculate stats with perks
        let damageBonus = 1;
        let speedBonus = 1;
        let spreadBonus = 1;
        let extraSmoke = 0;
        let healOnKill = 0;
        let damageResist = 1;
        
        if (loadout?.primaryPerk) {
            const perk = PERKS[loadout.primaryPerk];
            if (perk?.effect?.type === 'damage') damageBonus = perk.effect.value;
            if (perk?.effect?.type === 'spread' || perk?.effect?.type === 'accuracy') spreadBonus = perk.effect.value;
        }
        
        if (loadout?.secondaryPerk) {
            const perk = PERKS[loadout.secondaryPerk];
            if (perk?.effect?.type === 'move_speed') speedBonus = perk.effect.value;
            if (perk?.effect?.type === 'smoke_charges') extraSmoke = perk.effect.value;
            if (perk?.effect?.type === 'heal_on_kill') healOnKill = perk.effect.value;
        }
        
        if (loadout?.utilityPerk) {
            const perk = PERKS[loadout.utilityPerk];
            if (perk?.effect?.type === 'damage_resist') damageResist = perk.effect.value;
        }
        
        const weapon = WEAPONS[loadout?.weapon] ?? WEAPONS.pistol;
        const cls = CLASSES[this.selectedClassId] ?? CLASSES.assault;
        
        const stats = [
            { label: 'Damage', value: `${Math.round((weapon?.damage ?? 20) * (cls?.stats?.damage ?? 1) * damageBonus)}`, color: '#e74c3c' },
            { label: 'Speed', value: `${Math.round((cls?.stats?.speed ?? 180) * speedBonus)}`, color: '#3498db' },
            { label: 'Accuracy', value: `${Math.round((1 - (weapon?.spread ?? 0.1) * spreadBonus) * 100)}%`, color: '#9b59b6' },
            { label: 'Smokes', value: `${(cls?.stats?.smokeCharges ?? 1) + extraSmoke}`, color: '#95a5a6' }
        ];
        
        stats.forEach((stat, index) => {
            const statX = -120 + index * 80;
            const statText = this.add.text(statX, 0, stat.label, {
                font: '9px Arial',
                fill: '#888888'
            }).setOrigin(0.5);
            preview.add(statText);
            
            const valueText = this.add.text(statX, 15, stat.value, {
                font: 'bold 14px Arial',
                fill: stat.color
            }).setOrigin(0.5);
            preview.add(valueText);
        });
        
        // Show special effects
        const effects = [];
        if (healOnKill > 0) effects.push(`💚 +${healOnKill} HP on kill`);
        if (damageResist < 1) effects.push(`🛡️ ${Math.round((1 - damageResist) * 100)}% damage resist`);
        
        if (effects.length > 0) {
            const effectText = this.add.text(0, 38, effects.join('  '), {
                font: '10px Arial',
                fill: '#2ecc71'
            }).setOrigin(0.5);
            preview.add(effectText);
        }
    }
    
    showSaveConfirmation() {
        const { width, height } = this.cameras.main;
        
        const confirm = this.add.container(width / 2, height / 2);
        
        const bg = this.add.graphics();
        bg.fillStyle(0x27ae60, 1);
        bg.fillRoundedRect(-100, -30, 200, 60, 12);
        confirm.add(bg);
        
        const text = this.add.text(0, 0, '✔ Loadout Saved!', {
            font: 'bold 18px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        confirm.add(text);
        
        this.tweens.add({
            targets: confirm,
            scale: { from: 0.5, to: 1 },
            alpha: { from: 0, to: 1 },
            duration: 200,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.time.delayedCall(1000, () => {
                    this.tweens.add({
                        targets: confirm,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => confirm.destroy()
                    });
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
