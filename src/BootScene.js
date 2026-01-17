// BootScene - Initialize game systems with improved graphics
import { CONFIG } from './Config.js';
import { SaveSystem } from './SaveSystem.js';
import { UnlockSystem } from './UnlockSystem.js';
import { CLASSES } from './data_Classes.js';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }
    
    preload() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.add.rectangle(width / 2, height / 2, width, height, CONFIG.COLORS.BG_DARK);
        
        const progressBox = this.add.graphics();
        const progressBar = this.add.graphics();
        
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 25, 320, 50, 12);
        
        const loadingText = this.add.text(width / 2, height / 2 - 60, 'LOCKDOWN LANES', {
            font: 'bold 36px Arial',
            fill: '#00d4ff'
        }).setOrigin(0.5);
        
        const subText = this.add.text(width / 2, height / 2 + 45, 'Loading...', {
            font: '14px Arial',
            fill: '#888888'
        }).setOrigin(0.5);
        
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00d4ff, 1);
            progressBar.fillRoundedRect(width / 2 - 150, height / 2 - 15, 300 * value, 30, 8);
        });
        
        this.load.on('complete', () => {
            progressBar?.destroy?.();
            progressBox?.destroy?.();
            loadingText?.destroy?.();
            subText?.destroy?.();
        });
        
        this.createTextures();
    }
    
    createTextures() {
        const g = this.make.graphics({ add: false });
        
        // Player texture - Improved detailed sprite
        g.clear();
        // Body
        g.fillStyle(CONFIG.COLORS.DEFENDER);
        g.fillCircle(16, 16, 13);
        // Inner highlight
        g.fillStyle(0xffffff, 0.3);
        g.fillCircle(12, 12, 5);
        // Direction indicator (arrow/gun)
        g.fillStyle(0xffffff);
        g.fillTriangle(28, 16, 16, 10, 16, 22);
        // Outline
        g.lineStyle(2, 0x003366);
        g.strokeCircle(16, 16, 13);
        g.generateTexture('player', 32, 32);
        
        // AI texture - Distinct enemy look
        g.clear();
        // Body with diamond shape inside
        g.fillStyle(CONFIG.COLORS.ATTACKER);
        g.fillCircle(16, 16, 13);
        // Inner pattern
        g.fillStyle(0x000000, 0.3);
        g.fillRect(12, 12, 8, 8);
        // Direction indicator
        g.fillStyle(0xffffff);
        g.fillTriangle(28, 16, 16, 10, 16, 22);
        // Outline
        g.lineStyle(2, 0x662200);
        g.strokeCircle(16, 16, 13);
        g.generateTexture('ai', 32, 32);
        
        // Bullet - Glowing effect
        g.clear();
        g.fillStyle(0xffff00, 0.5);
        g.fillCircle(5, 5, 5);
        g.fillStyle(0xffffff);
        g.fillCircle(5, 5, 3);
        g.generateTexture('bullet', 10, 10);
        
        // Wall - 3D-ish look
        g.clear();
        g.fillStyle(CONFIG.COLORS.WALL);
        g.fillRect(0, 0, 64, 64);
        g.fillStyle(0x3d4d4d);
        g.fillRect(2, 2, 60, 4);
        g.fillRect(2, 2, 4, 60);
        g.fillStyle(0x1a2424);
        g.fillRect(58, 2, 4, 60);
        g.fillRect(2, 58, 60, 4);
        g.generateTexture('wall', 64, 64);
        
        // Cover - Crate style
        g.clear();
        g.fillStyle(CONFIG.COLORS.COVER);
        g.fillRoundedRect(0, 0, 48, 48, 4);
        // Crate details
        g.lineStyle(2, 0x4a5a5a);
        g.strokeRoundedRect(2, 2, 44, 44, 3);
        g.lineBetween(24, 4, 24, 44);
        g.lineBetween(4, 24, 44, 24);
        g.generateTexture('cover', 48, 48);
        
        // Bomb site - Glowing area
        g.clear();
        // Outer glow
        g.fillStyle(CONFIG.COLORS.BOMB_SITE, 0.15);
        g.fillRoundedRect(0, 0, 100, 80, 8);
        // Inner area
        g.fillStyle(CONFIG.COLORS.BOMB_SITE, 0.25);
        g.fillRoundedRect(10, 10, 80, 60, 6);
        // Border
        g.lineStyle(3, CONFIG.COLORS.BOMB_SITE, 0.8);
        g.strokeRoundedRect(5, 5, 90, 70, 6);
        // Corner markers
        g.fillStyle(CONFIG.COLORS.BOMB_SITE);
        g.fillRect(0, 0, 15, 3);
        g.fillRect(0, 0, 3, 15);
        g.fillRect(85, 0, 15, 3);
        g.fillRect(97, 0, 3, 15);
        g.fillRect(0, 77, 15, 3);
        g.fillRect(0, 65, 3, 15);
        g.fillRect(85, 77, 15, 3);
        g.fillRect(97, 65, 3, 15);
        g.generateTexture('bombsite', 100, 80);
        
        // Bomb - Detailed C4 style
        g.clear();
        // Body
        g.fillStyle(0x2d2d2d);
        g.fillRoundedRect(0, 0, 28, 18, 3);
        // Panel
        g.fillStyle(0x1a1a1a);
        g.fillRect(3, 3, 14, 12);
        // LED light (blinking indicator)
        g.fillStyle(0xff0000);
        g.fillCircle(22, 6, 4);
        g.fillStyle(0xff6666, 0.5);
        g.fillCircle(22, 6, 6);
        // Wires
        g.lineStyle(2, 0xff0000);
        g.lineBetween(5, 3, 5, 0);
        g.lineStyle(2, 0x00ff00);
        g.lineBetween(10, 3, 10, 0);
        g.generateTexture('bomb', 28, 18);
        
        // Smoke - Layered cloud effect
        g.clear();
        g.fillStyle(0x888888, 0.3);
        g.fillCircle(60, 60, 60);
        g.fillStyle(0x999999, 0.4);
        g.fillCircle(50, 55, 45);
        g.fillCircle(70, 65, 45);
        g.fillStyle(0xaaaaaa, 0.5);
        g.fillCircle(60, 60, 35);
        g.generateTexture('smoke', 120, 120);
        
        // Joystick base - Better visual
        g.clear();
        g.fillStyle(0x222222, 0.6);
        g.fillCircle(50, 50, 50);
        g.lineStyle(3, 0x444444);
        g.strokeCircle(50, 50, 48);
        g.lineStyle(1, 0x555555);
        g.strokeCircle(50, 50, 30);
        g.generateTexture('joystick_base', 100, 100);
        
        // Joystick thumb - Glowing
        g.clear();
        g.fillStyle(0x00d4ff, 0.3);
        g.fillCircle(25, 25, 25);
        g.fillStyle(0x00d4ff, 0.8);
        g.fillCircle(25, 25, 18);
        g.fillStyle(0xffffff, 0.3);
        g.fillCircle(20, 20, 8);
        g.generateTexture('joystick_thumb', 50, 50);
        
        // Button - Modern style
        g.clear();
        g.fillStyle(0x333333, 0.8);
        g.fillRoundedRect(0, 0, 60, 60, 12);
        g.lineStyle(2, 0x555555);
        g.strokeRoundedRect(2, 2, 56, 56, 10);
        // Inner highlight
        g.fillStyle(0x444444, 0.5);
        g.fillRoundedRect(5, 5, 50, 25, 8);
        g.generateTexture('button', 60, 60);
        
        // Pressure ring
        g.clear();
        g.lineStyle(4, 0xff0000, 0.6);
        g.strokeCircle(200, 200, 198);
        g.lineStyle(2, 0xff0000, 0.3);
        g.strokeCircle(200, 200, 190);
        g.generateTexture('ring', 400, 400);
        
        g.destroy();
    }
    
    create() {
        // Initialize save system
        SaveSystem.init();
        
        // Initialize unlocks including classes
        UnlockSystem.initializeUnlocks();
        this.initializeClassUnlocks();
        
        // Create audio context
        this.createAudioContext();
        
        // Go to menu
        this.scene.start('MenuScene');
    }
    
    initializeClassUnlocks() {
        const trophies = SaveSystem.getTrophies();
        
        // Check and unlock classes based on trophies
        for (const [classId, classData] of Object.entries(CLASSES ?? {})) {
            if (trophies >= (classData?.unlockTrophies ?? 0)) {
                SaveSystem.unlock(classId);
            }
        }
    }
    
    createAudioContext() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            window.gameAudioCtx = new AudioContext();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }
}
