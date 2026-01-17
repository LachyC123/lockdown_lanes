// LOCKDOWN LANES - Main Entry Point
import { CONFIG } from './Config.js';
import { BootScene } from './BootScene.js';
import { MenuScene } from './MenuScene.js';
import { MatchScene } from './MatchScene.js';
import { ResultsScene } from './ResultsScene.js';
import { SettingsScene } from './SettingsScene.js';
import { StatsScene } from './StatsScene.js';

// Wait for DOM and Phaser to be ready
window.addEventListener('load', () => {
    // Phaser game configuration
    const config = {
        type: Phaser.AUTO,
        parent: 'game-container',
        width: CONFIG.WIDTH,
        height: CONFIG.HEIGHT,
        backgroundColor: CONFIG.COLORS.BG_DARK,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            min: {
                width: 320,
                height: 240
            },
            max: {
                width: 1600,
                height: 1200
            }
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        input: {
            activePointers: 3
        },
        scene: [BootScene, MenuScene, MatchScene, ResultsScene, SettingsScene, StatsScene]
    };
    
    // Create game instance
    const game = new Phaser.Game(config);
    
    // Resume audio context on first interaction (required for mobile)
    const resumeAudio = () => {
        if (window.gameAudioCtx?.state === 'suspended') {
            window.gameAudioCtx.resume();
        }
        document.removeEventListener('touchstart', resumeAudio);
        document.removeEventListener('click', resumeAudio);
    };
    
    document.addEventListener('touchstart', resumeAudio, { once: true });
    document.addEventListener('click', resumeAudio, { once: true });
    
    // Handle visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            game.scene.scenes.forEach(scene => {
                if (scene.scene.isActive()) {
                    scene.scene.pause();
                }
            });
        } else {
            game.scene.scenes.forEach(scene => {
                if (scene.scene.isPaused()) {
                    scene.scene.resume();
                }
            });
        }
    });
    
    console.log('LOCKDOWN LANES initialized!');
});
