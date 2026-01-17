// SaveSystem - LocalStorage persistence - EXPANDED v2.0
const SAVE_KEY = 'lockdown_lanes_save';

const DEFAULT_SAVE = {
    trophies: 0,
    winStreak: 0,
    lossStreak: 0,
    totalWins: 0,
    totalLosses: 0,
    unlockedItems: ['pistol', 'assault'],
    equippedKit: 'pistol',
    equippedClass: 'assault',
    equippedCosmetics: {
        playerSkin: 'default',
        callingCard: 'default',
        emblem: 'default'
    },
    highestTrophies: 0,
    soundEnabled: true,
    musicEnabled: true,
    // Extended stats
    totalKills: 0,
    totalDeaths: 0,
    bombsPlanted: 0,
    bombsDefused: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    shotsFired: 0,
    shotsHit: 0,
    bestWinStreak: 0,
    // Settings
    screenShake: true,
    showDamageNumbers: true,
    showMinimap: true,
    // Class Progression System
    classLevels: {
        assault: 1,
        rusher: 1,
        sniper: 1,
        tank: 1,
        support: 1
    },
    classXP: {
        assault: 0,
        rusher: 0,
        sniper: 0,
        tank: 0,
        support: 0
    },
    classTotalXP: {
        assault: 0,
        rusher: 0,
        sniper: 0,
        tank: 0,
        support: 0
    },
    equippedPerks: {
        assault: { primary: null, secondary: null, utility: null },
        rusher: { primary: null, secondary: null, utility: null },
        sniper: { primary: null, secondary: null, utility: null },
        tank: { primary: null, secondary: null, utility: null },
        support: { primary: null, secondary: null, utility: null }
    },
    loadouts: {},
    activeLoadouts: {},
    // Prestige System
    prestige: {
        assault: 0,
        rusher: 0,
        sniper: 0,
        tank: 0,
        support: 0
    },
    prestigeTokens: 0,
    prestigeShopPurchased: [],
    // Weapon Challenges
    weaponKills: {},
    weaponSkins: {},
    // Class Mastery
    classMasteryStats: {},
    // Cosmetics
    unlockedCosmetics: ['default'],
    // Daily Challenges
    dailyChallenges: null,
    dailyChallengesLastReset: null
};

export const SaveSystem = {
    data: null,
    
    init() {
        this.load();
    },
    
    load() {
        try {
            const saved = localStorage.getItem(SAVE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.data = this.deepMerge(DEFAULT_SAVE, parsed);
                // Ensure assault class is always unlocked
                if (!this.data.unlockedItems?.includes?.('assault')) {
                    this.data.unlockedItems.push('assault');
                }
            } else {
                this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
            }
        } catch (e) {
            console.warn('Failed to load save:', e);
            this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
        }
        return this.data;
    },
    
    // Deep merge helper to preserve nested objects
    deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] ?? {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        return result;
    },
    
    save() {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn('Failed to save:', e);
        }
    },
    
    getTrophies() {
        return this.data?.trophies ?? 0;
    },
    
    setTrophies(amount) {
        this.data.trophies = Math.max(0, amount);
        if (this.data.trophies > (this.data.highestTrophies ?? 0)) {
            this.data.highestTrophies = this.data.trophies;
        }
        this.save();
    },
    
    addTrophies(amount) {
        this.setTrophies(this.getTrophies() + amount);
    },
    
    getWinStreak() {
        return this.data?.winStreak ?? 0;
    },
    
    getLossStreak() {
        return this.data?.lossStreak ?? 0;
    },
    
    recordWin() {
        if (!this.data) this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
        this.data.winStreak = (this.data.winStreak ?? 0) + 1;
        this.data.lossStreak = 0;
        this.data.totalWins = (this.data.totalWins ?? 0) + 1;
        if ((this.data.winStreak ?? 0) > (this.data.bestWinStreak ?? 0)) {
            this.data.bestWinStreak = this.data.winStreak;
        }
        this.save();
    },
    
    recordLoss() {
        if (!this.data) this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
        this.data.lossStreak = (this.data.lossStreak ?? 0) + 1;
        this.data.winStreak = 0;
        this.data.totalLosses = (this.data.totalLosses ?? 0) + 1;
        this.save();
    },
    
    resetStreaks() {
        if (!this.data) this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
        this.data.winStreak = 0;
        this.data.lossStreak = 0;
        this.save();
    },
    
    isUnlocked(itemId) {
        return this.data?.unlockedItems?.includes?.(itemId) ?? false;
    },
    
    unlock(itemId) {
        if (!this.data) this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
        if (!this.isUnlocked(itemId)) {
            if (!this.data.unlockedItems) this.data.unlockedItems = ['pistol', 'assault'];
            this.data.unlockedItems.push(itemId);
            this.save();
            return true;
        }
        return false;
    },
    
    getUnlockedItems() {
        return this.data?.unlockedItems ?? ['pistol', 'assault'];
    },
    
    getEquippedKit() {
        return this.data?.equippedKit ?? 'pistol';
    },
    
    setEquippedKit(kitId) {
        if (this.isUnlocked(kitId)) {
            if (!this.data) this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
            this.data.equippedKit = kitId;
            this.save();
        }
    },
    
    getEquippedClass() {
        return this.data?.equippedClass ?? 'assault';
    },
    
    setEquippedClass(classId) {
        if (this.isUnlocked(classId)) {
            if (!this.data) this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
            this.data.equippedClass = classId;
            this.save();
        }
    },
    
    getSoundEnabled() {
        return this.data?.soundEnabled ?? true;
    },
    
    setSoundEnabled(enabled) {
        if (!this.data) this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
        this.data.soundEnabled = enabled;
        this.save();
    },
    
    // Extended stats tracking
    recordKill() {
        if (!this.data) this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
        this.data.totalKills = (this.data.totalKills ?? 0) + 1;
        this.save();
    },
    
    recordDeath() {
        if (!this.data) this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
        this.data.totalDeaths = (this.data.totalDeaths ?? 0) + 1;
        this.save();
    },
    
    recordBombPlanted() {
        if (!this.data) this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
        this.data.bombsPlanted = (this.data.bombsPlanted ?? 0) + 1;
        this.save();
    },
    
    recordBombDefused() {
        if (!this.data) this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
        this.data.bombsDefused = (this.data.bombsDefused ?? 0) + 1;
        this.save();
    },
    
    recordDamageDealt(amount) {
        if (!this.data) this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
        this.data.totalDamageDealt = (this.data.totalDamageDealt ?? 0) + amount;
        this.save();
    },
    
    recordDamageTaken(amount) {
        if (!this.data) this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
        this.data.totalDamageTaken = (this.data.totalDamageTaken ?? 0) + amount;
        this.save();
    },
    
    recordShotFired() {
        if (!this.data) this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
        this.data.shotsFired = (this.data.shotsFired ?? 0) + 1;
    },
    
    recordShotHit() {
        if (!this.data) this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
        this.data.shotsHit = (this.data.shotsHit ?? 0) + 1;
    },
    
    updateBestWinStreak() {
        if (!this.data) this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
        if ((this.data.winStreak ?? 0) > (this.data.bestWinStreak ?? 0)) {
            this.data.bestWinStreak = this.data.winStreak;
            this.save();
        }
    },
    
    getScreenShake() {
        return this.data?.screenShake ?? true;
    },
    
    getShowDamageNumbers() {
        return this.data?.showDamageNumbers ?? true;
    },
    
    getShowMinimap() {
        return this.data?.showMinimap ?? true;
    },
    
    // Get all stats for display
    getAllStats() {
        return {
            trophies: this.data?.trophies ?? 0,
            highestTrophies: this.data?.highestTrophies ?? 0,
            totalWins: this.data?.totalWins ?? 0,
            totalLosses: this.data?.totalLosses ?? 0,
            winStreak: this.data?.winStreak ?? 0,
            bestWinStreak: this.data?.bestWinStreak ?? 0,
            totalKills: this.data?.totalKills ?? 0,
            totalDeaths: this.data?.totalDeaths ?? 0,
            bombsPlanted: this.data?.bombsPlanted ?? 0,
            bombsDefused: this.data?.bombsDefused ?? 0,
            totalDamageDealt: this.data?.totalDamageDealt ?? 0,
            shotsFired: this.data?.shotsFired ?? 0,
            shotsHit: this.data?.shotsHit ?? 0
        };
    }
};
