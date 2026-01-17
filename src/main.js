// LOCKDOWN LANES - Main Entry Point v2.0
import { CONFIG } from './Config.js';
import { BootScene } from './BootScene.js';
import { MenuScene } from './MenuScene.js';
import { MatchScene } from './MatchScene.js';
import { ResultsScene } from './ResultsScene.js';
import { SettingsScene } from './SettingsScene.js';
import { StatsScene } from './StatsScene.js';
import { LoadingScene } from './LoadingScene.js';
import { DailyChallengesScene } from './DailyChallengesScene.js';
import { AchievementsScene } from './AchievementsScene.js';
import { MatchHistoryScene } from './MatchHistoryScene.js';
import { ProgressionScene } from './ProgressionScene.js';
import { LoadoutScene } from './LoadoutScene.js';
// NEW SCENES v2.0
import { WeaponArsenalScene } from './WeaponArsenalScene.js';
import { ClassMasteryScene } from './ClassMasteryScene.js';
import { CosmeticsScene } from './CosmeticsScene.js';
import { PrestigeScene } from './PrestigeScene.js';

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
            width: CONFIG.WIDTH,
            height: CONFIG.HEIGHT,
            min: {
                width: 320,
                height: 240
            },
            max: {
                width: 1920,
                height: 1080
            },
            // Ensure canvas takes full available space
            parent: 'game-container',
            expandParent: true,
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        input: {
            activePointers: 4, // Support more simultaneous touches
            touch: {
                capture: true
            }
        },
        scene: [BootScene, MenuScene, LoadingScene, MatchScene, ResultsScene, SettingsScene, StatsScene, DailyChallengesScene, AchievementsScene, MatchHistoryScene, ProgressionScene, LoadoutScene, WeaponArsenalScene, ClassMasteryScene, CosmeticsScene, PrestigeScene],
        render: {
            pixelArt: false,
            antialias: true,
            roundPixels: true
        }
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
