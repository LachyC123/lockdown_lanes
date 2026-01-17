// TrophySystem - Trophy calculations and rank logic
import { CONFIG } from './Config.js';
import { SaveSystem } from './SaveSystem.js';
import { getRank, getNextRank } from './data_Ranks.js';
import { UnlockSystem } from './UnlockSystem.js';

export const TrophySystem = {
    calculateTrophyChange(won, objectiveBonus = false) {
        let change = 0;
        
        if (won) {
            change = CONFIG.WIN_TROPHIES;
            
            // Win streak bonus (after 2 wins)
            const streak = SaveSystem.getWinStreak();
            if (streak >= 2) {
                const bonus = Math.min(streak - 1, 2) * CONFIG.STREAK_BONUS;
                change += Math.min(bonus, CONFIG.STREAK_CAP);
            }
        } else {
            // Loss protection after 3 consecutive losses
            const lossStreak = SaveSystem.getLossStreak();
            if (lossStreak >= CONFIG.LOSS_PROTECTION_AFTER) {
                change = -CONFIG.PROTECTED_LOSS;
            } else {
                change = -CONFIG.LOSE_TROPHIES;
            }
        }
        
        // Objective bonus (plant or defuse)
        if (objectiveBonus) {
            change += CONFIG.OBJECTIVE_BONUS;
        }
        
        return change;
    },
    
    applyMatchResult(won, objectiveBonus = false) {
        const oldTrophies = SaveSystem.getTrophies();
        const oldRank = getRank(oldTrophies);
        
        // Record win/loss first (affects streak calculations)
        if (won) {
            SaveSystem.recordWin();
        } else {
            SaveSystem.recordLoss();
        }
        
        // Calculate and apply trophy change
        const change = this.calculateTrophyChange(won, objectiveBonus);
        SaveSystem.addTrophies(change);
        
        const newTrophies = SaveSystem.getTrophies();
        const newRank = getRank(newTrophies);
        
        // Check for new unlocks
        const newUnlocks = UnlockSystem.checkAndUnlock(newTrophies);
        
        return {
            oldTrophies,
            newTrophies,
            change,
            oldRank,
            newRank,
            rankUp: newRank.minTrophies > oldRank.minTrophies,
            rankDown: newRank.minTrophies < oldRank.minTrophies,
            newUnlocks,
            winStreak: won ? SaveSystem.getWinStreak() : 0,
            lossStreak: won ? 0 : SaveSystem.getLossStreak()
        };
    },
    
    getCurrentRankInfo() {
        const trophies = SaveSystem.getTrophies();
        const rank = getRank(trophies);
        const nextRank = getNextRank(trophies);
        
        let progress = 0;
        let toNext = 0;
        
        if (nextRank) {
            const range = nextRank.minTrophies - rank.minTrophies;
            const current = trophies - rank.minTrophies;
            progress = current / range;
            toNext = nextRank.minTrophies - trophies;
        } else {
            progress = 1;
        }
        
        return {
            trophies,
            rank,
            nextRank,
            progress,
            toNext
        };
    }
};
