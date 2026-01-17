// DailyChallengesScene - View and claim daily challenges
import { CONFIG } from './Config.js';
import { DailyChallengesSystem } from './DailyChallengesSystem.js';

export class DailyChallengesScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DailyChallengesScene' });
    }
    
    create() {
        const { width, height } = this.cameras.main;
        
        DailyChallengesSystem.init();
        
        this.cameras.main.fadeIn(300, 0, 0, 0);
        
        // Background
        this.add.rectangle(width / 2, height / 2, width, height, CONFIG.COLORS.BG_DARK);
        
        // Title
        this.add.text(width / 2, 40, '📅 DAILY CHALLENGES', {
            font: 'bold 32px Arial',
            fill: '#ffd700'
        }).setOrigin(0.5);
        
        // Reset timer
        const resetText = this.add.text(width / 2, 75, `Resets in: ${DailyChallengesSystem.formatTimeUntilReset()}`, {
            font: '14px Arial',
            fill: '#888888'
        }).setOrigin(0.5);
        
        // Update timer every minute
        this.time.addEvent({
            delay: 60000,
            callback: () => {
                resetText?.setText?.(`Resets in: ${DailyChallengesSystem.formatTimeUntilReset()}`);
            },
            loop: true
        });
        
        // Challenges list
        this.challengeCards = [];
        this.createChallengeCards();
        
        // Back button
        this.createButton(width / 2, height - 50, 'BACK TO MENU', CONFIG.COLORS.SECONDARY, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MenuScene');
            });
        });
    }
    
    createChallengeCards() {
        const { width, height } = this.cameras.main;
        const challenges = DailyChallengesSystem.getChallenges();
        const startY = 130;
        const cardHeight = 100;
        const cardSpacing = 15;
        
        challenges.forEach((challenge, index) => {
            const y = startY + index * (cardHeight + cardSpacing);
            this.createChallengeCard(challenge, index, width / 2, y, width - 60, cardHeight);
        });
    }
    
    createChallengeCard(challenge, index, x, y, w, h) {
        const card = this.add.container(x, y);
        
        // Background
        const bgColor = challenge?.claimed ? 0x1a3d1a : challenge?.completed ? 0x3d3d1a : CONFIG.COLORS.BG_MID;
        const bg = this.add.graphics();
        bg.fillStyle(bgColor, 0.9);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
        
        const borderColor = challenge?.claimed ? 0x2ecc71 : challenge?.completed ? 0xf1c40f : CONFIG.COLORS.PRIMARY;
        bg.lineStyle(2, borderColor, 0.8);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
        card.add(bg);
        
        // Icon
        const icon = this.add.text(-w / 2 + 40, 0, challenge?.icon ?? '⭐', {
            font: '36px Arial'
        }).setOrigin(0.5);
        card.add(icon);
        
        // Challenge name
        const name = this.add.text(-w / 2 + 80, -15, challenge?.name ?? 'Challenge', {
            font: 'bold 18px Arial',
            fill: '#ffffff'
        }).setOrigin(0, 0.5);
        card.add(name);
        
        // Progress bar
        const progressW = 200;
        const progressH = 16;
        const progressX = -w / 2 + 80;
        const progressY = 15;
        
        const progressBg = this.add.graphics();
        progressBg.fillStyle(0x1a1a2e, 1);
        progressBg.fillRoundedRect(progressX, progressY - progressH / 2, progressW, progressH, 8);
        card.add(progressBg);
        
        const progress = Math.min(1, (challenge?.currentCount ?? 0) / (challenge?.targetCount ?? 1));
        const progressFill = this.add.graphics();
        progressFill.fillStyle(challenge?.completed ? 0x2ecc71 : CONFIG.COLORS.PRIMARY, 1);
        progressFill.fillRoundedRect(progressX + 2, progressY - progressH / 2 + 2, (progressW - 4) * progress, progressH - 4, 6);
        card.add(progressFill);
        
        // Progress text
        const progressText = this.add.text(progressX + progressW / 2, progressY, 
            `${challenge?.currentCount ?? 0}/${challenge?.targetCount ?? 1}`, {
            font: 'bold 12px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        card.add(progressText);
        
        // Reward
        const rewardText = this.add.text(w / 2 - 80, -10, `+${challenge?.reward ?? 0}`, {
            font: 'bold 24px Arial',
            fill: '#ffd700'
        }).setOrigin(0.5);
        card.add(rewardText);
        
        const trophyIcon = this.add.text(w / 2 - 80, 15, '🏆', {
            font: '18px Arial'
        }).setOrigin(0.5);
        card.add(trophyIcon);
        
        // Claim button (if completed but not claimed)
        if (challenge?.completed && !challenge?.claimed) {
            const claimBtn = this.add.graphics();
            claimBtn.fillStyle(0x2ecc71, 1);
            claimBtn.fillRoundedRect(w / 2 - 70, -20, 60, 40, 8);
            card.add(claimBtn);
            
            const claimText = this.add.text(w / 2 - 40, 0, 'CLAIM', {
                font: 'bold 12px Arial',
                fill: '#ffffff'
            }).setOrigin(0.5);
            card.add(claimText);
            
            // Make interactive
            const hitArea = this.add.rectangle(w / 2 - 40, 0, 60, 40, 0x000000, 0)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    const reward = DailyChallengesSystem.claimReward(index);
                    if (reward > 0) {
                        this.showClaimAnimation(x + w / 2 - 40, y, reward);
                        // Refresh the scene
                        this.time.delayedCall(500, () => {
                            this.scene.restart();
                        });
                    }
                });
            card.add(hitArea);
        }
        
        // Claimed checkmark
        if (challenge?.claimed) {
            const checkmark = this.add.text(w / 2 - 40, 0, '✓', {
                font: 'bold 32px Arial',
                fill: '#2ecc71'
            }).setOrigin(0.5);
            card.add(checkmark);
        }
        
        // Animate card in
        card.setAlpha(0).setScale(0.9);
        this.tweens.add({
            targets: card,
            alpha: 1,
            scale: 1,
            duration: 300,
            delay: index * 100,
            ease: 'Back.easeOut'
        });
        
        this.challengeCards.push(card);
    }
    
    showClaimAnimation(x, y, reward) {
        const text = this.add.text(x, y, `+${reward} 🏆`, {
            font: 'bold 24px Arial',
            fill: '#ffd700'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: text,
            y: y - 60,
            alpha: 0,
            scale: 1.5,
            duration: 800,
            ease: 'Cubic.easeOut',
            onComplete: () => text?.destroy?.()
        });
        
        // Sparkle effect
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const sparkle = this.add.text(x, y, '✨', {
                font: '16px Arial'
            }).setOrigin(0.5);
            
            this.tweens.add({
                targets: sparkle,
                x: x + Math.cos(angle) * 50,
                y: y + Math.sin(angle) * 50,
                alpha: 0,
                duration: 500,
                delay: i * 30,
                onComplete: () => sparkle?.destroy?.()
            });
        }
    }
    
    createButton(x, y, text, color, callback, width = 200) {
        const btn = this.add.container(x, y);
        
        const bg = this.add.graphics();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-width / 2, -22, width, 44, 10);
        btn.add(bg);
        
        const label = this.add.text(0, 0, text, {
            font: 'bold 16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        btn.add(label);
        
        const hitArea = this.add.rectangle(0, 0, width, 44, 0x000000, 0)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.tweens.add({
                    targets: btn,
                    scale: 0.95,
                    duration: 50,
                    yoyo: true,
                    onComplete: callback
                });
            });
        btn.add(hitArea);
        
        return btn;
    }
}
