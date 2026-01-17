// SettingsScene - Game settings menu
import { CONFIG } from './Config.js';
import { SaveSystem } from './SaveSystem.js';

export class SettingsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SettingsScene' });
    }
    
    init(data) {
        this.returnScene = data?.returnScene ?? 'MenuScene';
    }
    
    create() {
        const { width, height } = this.cameras.main;
        
        // Fade in
        this.cameras.main.fadeIn(300, 0, 0, 0);
        
        // Background
        this.add.rectangle(width / 2, height / 2, width, height, CONFIG.COLORS.BG_DARK);
        
        // Title
        this.add.text(width / 2, 50, '⚙️ SETTINGS', {
            font: 'bold 36px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Settings panel
        const panel = this.add.graphics();
        panel.fillStyle(CONFIG.COLORS.BG_MID, 0.95);
        panel.fillRoundedRect(width / 2 - 200, 100, 400, 400, 20);
        panel.lineStyle(2, CONFIG.COLORS.PRIMARY);
        panel.strokeRoundedRect(width / 2 - 200, 100, 400, 400, 20);
        
        // Sound toggle
        this.createToggle(width / 2, 160, '🔊 Sound Effects', SaveSystem.getSoundEnabled(), (enabled) => {
            SaveSystem.setSoundEnabled(enabled);
        });
        
        // Music toggle (placeholder for future)
        this.createToggle(width / 2, 230, '🎵 Music', SaveSystem.data?.musicEnabled ?? true, (enabled) => {
            SaveSystem.data.musicEnabled = enabled;
            SaveSystem.save();
        });
        
        // Screen shake toggle
        this.createToggle(width / 2, 300, '📳 Screen Shake', SaveSystem.data?.screenShake ?? true, (enabled) => {
            SaveSystem.data.screenShake = enabled;
            SaveSystem.save();
        });
        
        // Show damage numbers toggle
        this.createToggle(width / 2, 370, '🔢 Damage Numbers', SaveSystem.data?.showDamageNumbers ?? true, (enabled) => {
            SaveSystem.data.showDamageNumbers = enabled;
            SaveSystem.save();
        });
        
        // Show minimap toggle
        this.createToggle(width / 2, 440, '🗺️ Show Minimap', SaveSystem.data?.showMinimap ?? true, (enabled) => {
            SaveSystem.data.showMinimap = enabled;
            SaveSystem.save();
        });
        
        // Reset progress button
        this.createButton(width / 2, 520, '🗑️ Reset All Progress', 0xe74c3c, () => {
            this.showResetConfirm();
        });
        
        // Back button
        this.createButton(width / 2, height - 50, '← Back', CONFIG.COLORS.SECONDARY, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start(this.returnScene);
            });
        });
    }
    
    createToggle(x, y, label, initialValue, onChange) {
        const container = this.add.container(x, y);
        
        // Label
        const labelText = this.add.text(-150, 0, label, {
            font: '18px Arial',
            fill: '#ffffff'
        }).setOrigin(0, 0.5);
        
        // Toggle background
        let isOn = initialValue;
        const toggleBg = this.add.graphics();
        const drawToggle = () => {
            toggleBg.clear();
            toggleBg.fillStyle(isOn ? 0x27ae60 : 0x7f8c8d, 1);
            toggleBg.fillRoundedRect(100, -15, 60, 30, 15);
            toggleBg.fillStyle(0xffffff, 1);
            toggleBg.fillCircle(isOn ? 145 : 115, 0, 12);
        };
        drawToggle();
        
        // Interactive zone
        const hitZone = this.add.rectangle(130, 0, 60, 30, 0x000000, 0);
        hitZone.setInteractive({ useHandCursor: true });
        hitZone.on('pointerdown', () => {
            isOn = !isOn;
            drawToggle();
            onChange(isOn);
        });
        
        container.add([labelText, toggleBg, hitZone]);
        return container;
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
    
    showResetConfirm() {
        const { width, height } = this.cameras.main;
        
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
        overlay.setInteractive();
        overlay.setDepth(100);
        
        const panel = this.add.graphics().setDepth(101);
        panel.fillStyle(CONFIG.COLORS.BG_MID, 1);
        panel.fillRoundedRect(width / 2 - 180, height / 2 - 100, 360, 200, 20);
        panel.lineStyle(3, 0xe74c3c);
        panel.strokeRoundedRect(width / 2 - 180, height / 2 - 100, 360, 200, 20);
        
        const warning = this.add.text(width / 2, height / 2 - 60, '⚠️ WARNING', {
            font: 'bold 24px Arial',
            fill: '#e74c3c'
        }).setOrigin(0.5).setDepth(102);
        
        const msg = this.add.text(width / 2, height / 2 - 20, 'This will delete ALL progress!\nTrophies, unlocks, everything.', {
            font: '14px Arial',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5).setDepth(102);
        
        // Confirm button
        const confirmBtn = this.add.container(width / 2 - 70, height / 2 + 50).setDepth(102);
        const confirmBg = this.add.graphics();
        confirmBg.fillStyle(0xe74c3c, 1);
        confirmBg.fillRoundedRect(-60, -18, 120, 36, 8);
        const confirmText = this.add.text(0, 0, 'DELETE', {
            font: 'bold 14px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        confirmBtn.add([confirmBg, confirmText]);
        confirmBtn.setSize(120, 36);
        confirmBtn.setInteractive({ useHandCursor: true });
        confirmBtn.on('pointerdown', () => {
            localStorage.removeItem('lockdown_lanes_save');
            SaveSystem.init();
            this.scene.restart();
        });
        
        // Cancel button
        const cancelBtn = this.add.container(width / 2 + 70, height / 2 + 50).setDepth(102);
        const cancelBg = this.add.graphics();
        cancelBg.fillStyle(0x7f8c8d, 1);
        cancelBg.fillRoundedRect(-60, -18, 120, 36, 8);
        const cancelText = this.add.text(0, 0, 'CANCEL', {
            font: 'bold 14px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        cancelBtn.add([cancelBg, cancelText]);
        cancelBtn.setSize(120, 36);
        cancelBtn.setInteractive({ useHandCursor: true });
        cancelBtn.on('pointerdown', () => {
            overlay?.destroy?.();
            panel?.destroy?.();
            warning?.destroy?.();
            msg?.destroy?.();
            confirmBtn?.destroy?.();
            cancelBtn?.destroy?.();
        });
    }
}
