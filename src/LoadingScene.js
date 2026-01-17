// LoadingScene - Professional loading screen with tips
import { CONFIG } from './Config.js';
import { SaveSystem } from './SaveSystem.js';

const GAME_TIPS = [
    "💡 Use smoke grenades to block enemy vision and escape!",
    "💡 Sprinting reveals your position - walk when sneaking!",
    "💡 Plant the bomb in a position where you can defend it!",
    "💡 Time your defuse - fake defuses can bait out attackers!",
    "💡 Different classes have unique abilities - try them all!",
    "💡 Win streaks multiply your trophy gains!",
    "💡 Headshots deal extra damage - aim carefully!",
    "💡 The pressure ring closes in over time - stay inside!",
    "💡 Use cover and peek to minimize damage taken!",
    "💡 Watch the minimap for enemy movements!",
    "💡 Complete daily challenges for bonus trophies!",
    "💡 Higher ranks unlock better weapons and classes!",
    "💡 Defenders can defuse bombs faster than attackers!",
    "💡 Movement speed decreases while firing!",
    "💡 Stamina regenerates faster when standing still!"
];

export class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
    }
    
    init(data) {
        this.targetScene = data?.targetScene ?? 'MenuScene';
        this.sceneData = data?.sceneData ?? {};
        this.minLoadTime = data?.minLoadTime ?? 1500;
    }
    
    create() {
        const { width, height } = this.cameras.main;
        
        // Background
        this.add.rectangle(width / 2, height / 2, width, height, CONFIG.COLORS.BG_DARK);
        
        // Animated background particles
        this.createParticles();
        
        // Title
        const title = this.add.text(width / 2, height / 3 - 40, 'LOCKDOWN LANES', {
            font: 'bold 42px Arial',
            fill: '#00d4ff',
            stroke: '#003366',
            strokeThickness: 4
        }).setOrigin(0.5).setAlpha(0);
        
        this.tweens.add({
            targets: title,
            alpha: 1,
            y: height / 3 - 30,
            duration: 400,
            ease: 'Back.easeOut'
        });
        
        // Loading bar container
        this.loadBarBg = this.add.graphics();
        this.loadBarBg.fillStyle(0x1a1a2e, 1);
        this.loadBarBg.fillRoundedRect(width / 2 - 150, height / 2 - 10, 300, 20, 10);
        this.loadBarBg.lineStyle(2, CONFIG.COLORS.PRIMARY, 0.5);
        this.loadBarBg.strokeRoundedRect(width / 2 - 150, height / 2 - 10, 300, 20, 10);
        
        // Loading bar fill
        this.loadBar = this.add.graphics();
        this.loadProgress = 0;
        
        // Loading text
        this.loadingText = this.add.text(width / 2, height / 2 + 25, 'LOADING...', {
            font: '14px Arial',
            fill: '#888888'
        }).setOrigin(0.5);
        
        // Random tip
        const tip = GAME_TIPS[Math.floor(Math.random() * GAME_TIPS.length)];
        const tipText = this.add.text(width / 2, height - 80, tip, {
            font: '16px Arial',
            fill: '#ffd700',
            wordWrap: { width: width - 80 },
            align: 'center'
        }).setOrigin(0.5).setAlpha(0);
        
        this.tweens.add({
            targets: tipText,
            alpha: 1,
            duration: 500,
            delay: 300
        });
        
        // Spinner
        this.spinner = this.add.graphics();
        this.spinnerAngle = 0;
        
        // Animate loading
        this.animateLoading();
        
        // Minimum load time then transition
        this.time.delayedCall(this.minLoadTime, () => {
            this.finishLoading();
        });
    }
    
    createParticles() {
        const { width, height } = this.cameras.main;
        this.particles = [];
        
        for (let i = 0; i < 20; i++) {
            const particle = this.add.circle(
                Math.random() * width,
                Math.random() * height,
                2 + Math.random() * 3,
                CONFIG.COLORS.PRIMARY,
                0.2 + Math.random() * 0.3
            );
            this.particles.push({
                obj: particle,
                speed: 0.3 + Math.random() * 0.5
            });
        }
        
        this.time.addEvent({
            delay: 50,
            callback: () => this.updateParticles(),
            loop: true
        });
    }
    
    updateParticles() {
        const { height } = this.cameras.main;
        for (const p of this.particles ?? []) {
            p.obj.y -= p.speed;
            if (p.obj.y < -10) {
                p.obj.y = height + 10;
                p.obj.x = Math.random() * this.cameras.main.width;
            }
        }
    }
    
    animateLoading() {
        const { width, height } = this.cameras.main;
        
        // Smooth loading progress
        this.tweens.add({
            targets: this,
            loadProgress: 1,
            duration: this.minLoadTime - 200,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                this.loadBar?.clear?.();
                this.loadBar?.fillStyle?.(CONFIG.COLORS.PRIMARY, 1);
                this.loadBar?.fillRoundedRect?.(
                    width / 2 - 145,
                    height / 2 - 5,
                    290 * this.loadProgress,
                    10,
                    5
                );
            }
        });
        
        // Spinner animation
        this.time.addEvent({
            delay: 30,
            callback: () => {
                this.spinnerAngle += 0.15;
                this.spinner?.clear?.();
                this.spinner?.lineStyle?.(3, CONFIG.COLORS.PRIMARY, 0.8);
                
                const cx = width / 2;
                const cy = height / 2 - 80;
                const radius = 25;
                const arcLength = Math.PI * 1.5;
                
                this.spinner?.beginPath?.();
                this.spinner?.arc?.(cx, cy, radius, this.spinnerAngle, this.spinnerAngle + arcLength);
                this.spinner?.strokePath?.();
            },
            loop: true
        });
    }
    
    finishLoading() {
        const { width, height } = this.cameras.main;
        
        this.loadingText?.setText?.('READY!');
        this.loadingText?.setFill?.('#00ff88');
        
        this.time.delayedCall(300, () => {
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start(this.targetScene, this.sceneData);
            });
        });
    }
}
