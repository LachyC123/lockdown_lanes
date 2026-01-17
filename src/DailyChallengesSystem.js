// DailyChallengesSystem - Daily challenges with bonus rewards
import { SaveSystem } from './SaveSystem.js';

const CHALLENGE_TEMPLATES = [
    { id: 'wins', name: 'Win {count} matches', count: [1, 2, 3], reward: [5, 10, 15], icon: '🏆' },
    { id: 'kills', name: 'Get {count} kills', count: [3, 5, 8], reward: [5, 8, 12], icon: '💀' },
    { id: 'plants', name: 'Plant the bomb {count} times', count: [1, 2, 3], reward: [5, 8, 12], icon: '💣' },
    { id: 'defuses', name: 'Defuse the bomb {count} times', count: [1, 2, 3], reward: [5, 8, 12], icon: '🛡️' },
    { id: 'rounds', name: 'Win {count} rounds', count: [3, 5, 8], reward: [5, 8, 12], icon: '⭐' },
    { id: 'damage', name: 'Deal {count} damage', count: [100, 200, 300], reward: [5, 8, 12], icon: '⚔️' },
    { id: 'streak', name: 'Get a {count} win streak', count: [2, 3, 4], reward: [10, 15, 25], icon: '🔥' },
    { id: 'accuracy', name: 'Hit {count} shots', count: [10, 20, 30], reward: [5, 8, 12], icon: '🎯' },
    { id: 'class', name: 'Win with a different class', count: [1, 1, 2], reward: [8, 8, 15], icon: '🌟' },
    { id: 'ranked', name: 'Play {count} ranked matches', count: [1, 3, 5], reward: [5, 10, 15], icon: '🎮' }
];

const CHALLENGE_KEY = 'lockdown_daily_challenges';

export const DailyChallengesSystem = {
    challenges: [],
    lastResetDate: null,
    
    init() {
        this.load();
        this.checkReset();
    },
    
    load() {
        try {
            const saved = localStorage.getItem(CHALLENGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                this.challenges = data?.challenges ?? [];
                this.lastResetDate = data?.lastResetDate ?? null;
            }
        } catch (e) {
            console.warn('Failed to load daily challenges:', e);
        }
    },
    
    save() {
        try {
            localStorage.setItem(CHALLENGE_KEY, JSON.stringify({
                challenges: this.challenges,
                lastResetDate: this.lastResetDate
            }));
        } catch (e) {
            console.warn('Failed to save daily challenges:', e);
        }
    },
    
    checkReset() {
        const today = new Date().toDateString();
        if (this.lastResetDate !== today) {
            this.generateNewChallenges();
            this.lastResetDate = today;
            this.save();
        }
    },
    
    generateNewChallenges() {
        this.challenges = [];
        const usedIds = new Set();
        
        // Generate 3 random challenges
        while (this.challenges.length < 3) {
            const template = CHALLENGE_TEMPLATES[Math.floor(Math.random() * CHALLENGE_TEMPLATES.length)];
            
            if (usedIds.has(template.id)) continue;
            usedIds.add(template.id);
            
            // Random difficulty (0, 1, or 2)
            const difficulty = Math.floor(Math.random() * 3);
            const count = template.count[difficulty];
            const reward = template.reward[difficulty];
            
            this.challenges.push({
                id: template.id,
                name: template.name.replace('{count}', count),
                icon: template.icon,
                targetCount: count,
                currentCount: 0,
                reward: reward,
                completed: false,
                claimed: false
            });
        }
    },
    
    getChallenges() {
        this.checkReset();
        return this.challenges ?? [];
    },
    
    updateProgress(type, amount = 1) {
        let updated = false;
        
        for (const challenge of this.challenges ?? []) {
            if (challenge?.completed || challenge?.claimed) continue;
            
            if (challenge?.id === type) {
                challenge.currentCount = (challenge.currentCount ?? 0) + amount;
                if (challenge.currentCount >= challenge.targetCount) {
                    challenge.completed = true;
                }
                updated = true;
            }
        }
        
        if (updated) this.save();
        return updated;
    },
    
    claimReward(challengeIndex) {
        const challenge = this.challenges?.[challengeIndex];
        if (!challenge?.completed || challenge?.claimed) return 0;
        
        challenge.claimed = true;
        this.save();
        
        // Add bonus trophies
        SaveSystem.addTrophies(challenge.reward);
        
        return challenge.reward;
    },
    
    getCompletedCount() {
        return (this.challenges ?? []).filter(c => c?.completed).length;
    },
    
    getClaimableCount() {
        return (this.challenges ?? []).filter(c => c?.completed && !c?.claimed).length;
    },
    
    // Event handlers for match results
    onMatchEnd(playerWon, stats = {}) {
        if (playerWon) {
            this.updateProgress('wins', 1);
        }
        this.updateProgress('kills', stats?.kills ?? 0);
        this.updateProgress('plants', stats?.plants ?? 0);
        this.updateProgress('defuses', stats?.defuses ?? 0);
        this.updateProgress('rounds', stats?.roundsWon ?? 0);
        this.updateProgress('damage', stats?.damageDealt ?? 0);
        this.updateProgress('accuracy', stats?.shotsHit ?? 0);
        this.updateProgress('ranked', 1);
        
        // Check win streak
        const winStreak = SaveSystem.getWinStreak();
        if (winStreak >= 2) {
            this.updateProgress('streak', 1);
        }
    },
    
    getTimeUntilReset() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow - now;
    },
    
    formatTimeUntilReset() {
        const ms = this.getTimeUntilReset();
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }
};
