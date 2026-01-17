// SaveSystem - LocalStorage persistence
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
    equippedCosmetics: [],
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
    showMinimap: true
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
                this.data = { ...DEFAULT_SAVE, ...JSON.parse(saved) };
                // Ensure assault class is always unlocked
                if (!this.data.unlockedItems?.includes?.('assault')) {
                    this.data.unlockedItems.push('assault');
                }
            } else {
                this.data = { ...DEFAULT_SAVE };
            }
        } catch (e) {
            console.warn('Failed to load save:', e);
            this.data = { ...DEFAULT_SAVE };
        }
        return this.data;
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
        if (!this.data) this.data = { ...DEFAULT_SAVE };
        this.data.winStreak = (this.data.winStreak ?? 0) + 1;
        this.data.lossStreak = 0;
        this.data.totalWins = (this.data.totalWins ?? 0) + 1;
        // Update best win streak
        if ((this.data.winStreak ?? 0) > (this.data.bestWinStreak ?? 0)) {
            this.data.bestWinStreak = this.data.winStreak;
        }
        this.save();
    },
    
    recordLoss() {
        if (!this.data) this.data = { ...DEFAULT_SAVE };
        this.data.lossStreak = (this.data.lossStreak ?? 0) + 1;
        this.data.winStreak = 0;
        this.data.totalLosses = (this.data.totalLosses ?? 0) + 1;
        this.save();
    },
    
    resetStreaks() {
        if (!this.data) this.data = { ...DEFAULT_SAVE };
        this.data.winStreak = 0;
        this.data.lossStreak = 0;
        this.save();
    },
    
    isUnlocked(itemId) {
        return this.data?.unlockedItems?.includes?.(itemId) ?? false;
    },
    
    unlock(itemId) {
        if (!this.data) this.data = { ...DEFAULT_SAVE };
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
            if (!this.data) this.data = { ...DEFAULT_SAVE };
            this.data.equippedKit = kitId;
            this.save();
        }
    },
    
    getEquippedClass() {
        return this.data?.equippedClass ?? 'assault';
    },
    
    setEquippedClass(classId) {
        if (this.isUnlocked(classId)) {
            if (!this.data) this.data = { ...DEFAULT_SAVE };
            this.data.equippedClass = classId;
            this.save();
        }
    },
    
    getSoundEnabled() {
        return this.data?.soundEnabled ?? true;
    },
    
    setSoundEnabled(enabled) {
        if (!this.data) this.data = { ...DEFAULT_SAVE };
        this.data.soundEnabled = enabled;
        this.save();
    },
    
    // Extended stats tracking
    recordKill() {
        if (!this.data) this.data = { ...DEFAULT_SAVE };
        this.data.totalKills = (this.data.totalKills ?? 0) + 1;
        this.save();
    },
    
    recordDeath() {
        if (!this.data) this.data = { ...DEFAULT_SAVE };
        this.data.totalDeaths = (this.data.totalDeaths ?? 0) + 1;
        this.save();
    },
    
    recordBombPlanted() {
        if (!this.data) this.data = { ...DEFAULT_SAVE };
        this.data.bombsPlanted = (this.data.bombsPlanted ?? 0) + 1;
        this.save();
    },
    
    recordBombDefused() {
        if (!this.data) this.data = { ...DEFAULT_SAVE };
        this.data.bombsDefused = (this.data.bombsDefused ?? 0) + 1;
        this.save();
    },
    
    recordDamageDealt(amount) {
        if (!this.data) this.data = { ...DEFAULT_SAVE };
        this.data.totalDamageDealt = (this.data.totalDamageDealt ?? 0) + amount;
        this.save();
    },
    
    recordDamageTaken(amount) {
        if (!this.data) this.data = { ...DEFAULT_SAVE };
        this.data.totalDamageTaken = (this.data.totalDamageTaken ?? 0) + amount;
        this.save();
    },
    
    recordShotFired() {
        if (!this.data) this.data = { ...DEFAULT_SAVE };
        this.data.shotsFired = (this.data.shotsFired ?? 0) + 1;
        // Don't save on every shot - too frequent
    },
    
    recordShotHit() {
        if (!this.data) this.data = { ...DEFAULT_SAVE };
        this.data.shotsHit = (this.data.shotsHit ?? 0) + 1;
        // Don't save on every hit - too frequent
    },
    
    updateBestWinStreak() {
        if (!this.data) this.data = { ...DEFAULT_SAVE };
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
    }
};
