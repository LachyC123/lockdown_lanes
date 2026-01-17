// AchievementSystem - Achievements and badges
import { SaveSystem } from './SaveSystem.js';

const ACHIEVEMENTS = [
    // Combat achievements
    { id: 'first_blood', name: 'First Blood', desc: 'Get your first kill', icon: '🩸', secret: false, check: (s) => s.totalKills >= 1 },
    { id: 'serial_killer', name: 'Serial Killer', desc: 'Get 50 kills', icon: '💀', secret: false, check: (s) => s.totalKills >= 50 },
    { id: 'massacre', name: 'Massacre', desc: 'Get 200 kills', icon: '☠️', secret: false, check: (s) => s.totalKills >= 200 },
    { id: 'sharpshooter', name: 'Sharpshooter', desc: '50% accuracy over 100 shots', icon: '🎯', secret: false, check: (s) => s.shotsFired >= 100 && (s.shotsHit / s.shotsFired) >= 0.5 },
    
    // Match achievements
    { id: 'first_win', name: 'First Victory', desc: 'Win your first match', icon: '🏆', secret: false, check: (s) => s.totalWins >= 1 },
    { id: 'veteran', name: 'Veteran', desc: 'Win 25 matches', icon: '🎖️', secret: false, check: (s) => s.totalWins >= 25 },
    { id: 'champion', name: 'Champion', desc: 'Win 100 matches', icon: '👑', secret: false, check: (s) => s.totalWins >= 100 },
    { id: 'unbeatable', name: 'Unbeatable', desc: 'Win 5 matches in a row', icon: '🔥', secret: false, check: (s) => s.bestWinStreak >= 5 },
    { id: 'unstoppable', name: 'Unstoppable', desc: 'Win 10 matches in a row', icon: '⚡', secret: false, check: (s) => s.bestWinStreak >= 10 },
    
    // Objective achievements
    { id: 'bomber', name: 'Bomber', desc: 'Plant 10 bombs', icon: '💣', secret: false, check: (s) => s.bombsPlanted >= 10 },
    { id: 'demolition_expert', name: 'Demolition Expert', desc: 'Plant 50 bombs', icon: '🧨', secret: false, check: (s) => s.bombsPlanted >= 50 },
    { id: 'defuser', name: 'Defuser', desc: 'Defuse 10 bombs', icon: '🛡️', secret: false, check: (s) => s.bombsDefused >= 10 },
    { id: 'bomb_squad', name: 'Bomb Squad', desc: 'Defuse 50 bombs', icon: '🚨', secret: false, check: (s) => s.bombsDefused >= 50 },
    
    // Trophy achievements
    { id: 'bronze_warrior', name: 'Bronze Warrior', desc: 'Reach 100 trophies', icon: '🥉', secret: false, check: (s) => s.highestTrophies >= 100 },
    { id: 'silver_elite', name: 'Silver Elite', desc: 'Reach 300 trophies', icon: '🥈', secret: false, check: (s) => s.highestTrophies >= 300 },
    { id: 'gold_legend', name: 'Gold Legend', desc: 'Reach 600 trophies', icon: '🥇', secret: false, check: (s) => s.highestTrophies >= 600 },
    { id: 'platinum_god', name: 'Platinum God', desc: 'Reach 1000 trophies', icon: '💎', secret: false, check: (s) => s.highestTrophies >= 1000 },
    
    // Secret achievements
    { id: 'comeback_kid', name: 'Comeback Kid', desc: 'Win after being down 0-3', icon: '🌟', secret: true, check: (s) => s.comebackWins >= 1 },
    { id: 'flawless', name: 'Flawless Victory', desc: 'Win 4-0 without taking damage', icon: '✨', secret: true, check: (s) => s.flawlessWins >= 1 },
    { id: 'survivor', name: 'Survivor', desc: 'Win a round with less than 10 HP', icon: '💪', secret: true, check: (s) => s.clutchWins >= 1 }
];

const ACHIEVEMENT_KEY = 'lockdown_achievements';

export const AchievementSystem = {
    unlockedAchievements: [],
    pendingNotifications: [],
    
    init() {
        this.load();
    },
    
    load() {
        try {
            const saved = localStorage.getItem(ACHIEVEMENT_KEY);
            if (saved) {
                this.unlockedAchievements = JSON.parse(saved) ?? [];
            }
        } catch (e) {
            console.warn('Failed to load achievements:', e);
            this.unlockedAchievements = [];
        }
    },
    
    save() {
        try {
            localStorage.setItem(ACHIEVEMENT_KEY, JSON.stringify(this.unlockedAchievements));
        } catch (e) {
            console.warn('Failed to save achievements:', e);
        }
    },
    
    checkAll() {
        const stats = SaveSystem.data ?? {};
        const newUnlocks = [];
        
        for (const achievement of ACHIEVEMENTS) {
            if (this.isUnlocked(achievement.id)) continue;
            
            try {
                if (achievement.check(stats)) {
                    this.unlock(achievement.id);
                    newUnlocks.push(achievement);
                }
            } catch (e) {
                // Skip if check fails
            }
        }
        
        return newUnlocks;
    },
    
    isUnlocked(achievementId) {
        return this.unlockedAchievements?.includes?.(achievementId) ?? false;
    },
    
    unlock(achievementId) {
        if (!this.isUnlocked(achievementId)) {
            this.unlockedAchievements.push(achievementId);
            this.pendingNotifications.push(achievementId);
            this.save();
            return true;
        }
        return false;
    },
    
    getAchievement(achievementId) {
        return ACHIEVEMENTS.find(a => a.id === achievementId);
    },
    
    getAllAchievements() {
        return ACHIEVEMENTS.map(a => ({
            ...a,
            unlocked: this.isUnlocked(a.id)
        }));
    },
    
    getVisibleAchievements() {
        return ACHIEVEMENTS.filter(a => !a.secret || this.isUnlocked(a.id)).map(a => ({
            ...a,
            unlocked: this.isUnlocked(a.id)
        }));
    },
    
    getUnlockedCount() {
        return this.unlockedAchievements?.length ?? 0;
    },
    
    getTotalCount() {
        return ACHIEVEMENTS.length;
    },
    
    getProgress() {
        return Math.round((this.getUnlockedCount() / this.getTotalCount()) * 100);
    },
    
    getPendingNotification() {
        const id = this.pendingNotifications?.shift?.();
        return id ? this.getAchievement(id) : null;
    },
    
    hasPendingNotifications() {
        return (this.pendingNotifications?.length ?? 0) > 0;
    },
    
    // Record special events for secret achievements
    recordComebackWin() {
        if (!SaveSystem.data) SaveSystem.data = {};
        SaveSystem.data.comebackWins = (SaveSystem.data.comebackWins ?? 0) + 1;
        SaveSystem.save();
    },
    
    recordFlawlessWin() {
        if (!SaveSystem.data) SaveSystem.data = {};
        SaveSystem.data.flawlessWins = (SaveSystem.data.flawlessWins ?? 0) + 1;
        SaveSystem.save();
    },
    
    recordClutchWin() {
        if (!SaveSystem.data) SaveSystem.data = {};
        SaveSystem.data.clutchWins = (SaveSystem.data.clutchWins ?? 0) + 1;
        SaveSystem.save();
    }
};

export { ACHIEVEMENTS };
