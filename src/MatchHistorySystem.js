// MatchHistorySystem - Track recent matches
const HISTORY_KEY = 'lockdown_match_history';
const MAX_MATCHES = 10;

export const MatchHistorySystem = {
    matches: [],
    
    init() {
        this.load();
    },
    
    load() {
        try {
            const saved = localStorage.getItem(HISTORY_KEY);
            if (saved) {
                this.matches = JSON.parse(saved) ?? [];
            }
        } catch (e) {
            console.warn('Failed to load match history:', e);
            this.matches = [];
        }
    },
    
    save() {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(this.matches));
        } catch (e) {
            console.warn('Failed to save match history:', e);
        }
    },
    
    addMatch(matchData) {
        const match = {
            timestamp: Date.now(),
            won: matchData?.won ?? false,
            playerScore: matchData?.playerScore ?? 0,
            aiScore: matchData?.aiScore ?? 0,
            mode: matchData?.mode ?? 'ranked',
            classUsed: matchData?.classUsed ?? 'assault',
            trophyChange: matchData?.trophyChange ?? 0,
            kills: matchData?.kills ?? 0,
            deaths: matchData?.deaths ?? 0,
            damageDealt: matchData?.damageDealt ?? 0,
            bombsPlanted: matchData?.bombsPlanted ?? 0,
            bombsDefused: matchData?.bombsDefused ?? 0
        };
        
        this.matches.unshift(match);
        
        // Keep only last MAX_MATCHES
        if (this.matches.length > MAX_MATCHES) {
            this.matches = this.matches.slice(0, MAX_MATCHES);
        }
        
        this.save();
        return match;
    },
    
    getMatches() {
        return this.matches ?? [];
    },
    
    getRecentMatches(count = 5) {
        return (this.matches ?? []).slice(0, count);
    },
    
    getWinRate() {
        if ((this.matches?.length ?? 0) === 0) return 0;
        const wins = this.matches.filter(m => m?.won).length;
        return Math.round((wins / this.matches.length) * 100);
    },
    
    getAverageScore() {
        if ((this.matches?.length ?? 0) === 0) return { player: 0, ai: 0 };
        const totals = this.matches.reduce((acc, m) => ({
            player: acc.player + (m?.playerScore ?? 0),
            ai: acc.ai + (m?.aiScore ?? 0)
        }), { player: 0, ai: 0 });
        return {
            player: (totals.player / this.matches.length).toFixed(1),
            ai: (totals.ai / this.matches.length).toFixed(1)
        };
    },
    
    getStreak() {
        let streak = 0;
        let streakType = null;
        
        for (const match of this.matches ?? []) {
            if (streakType === null) {
                streakType = match?.won;
                streak = 1;
            } else if (match?.won === streakType) {
                streak++;
            } else {
                break;
            }
        }
        
        return { count: streak, isWinStreak: streakType ?? false };
    },
    
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
        return date.toLocaleDateString();
    },
    
    clear() {
        this.matches = [];
        this.save();
    }
};
