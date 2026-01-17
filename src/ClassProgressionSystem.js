// Class Progression System - EXPANDED v2.0
// Handles XP, leveling, prestige, perks, challenges, cosmetics
import { SaveSystem } from './SaveSystem.js';
import { CLASSES } from './data_Classes.js';
import { PERKS, isPerkUnlockedAtLevel, isUtilitySlotUnlocked } from './data_Perks.js';
import { WEAPONS, WEAPON_CHALLENGE_TIERS, getWeaponChallengeTier } from './data_Weapons.js';
import { CLASS_MASTERY_CHALLENGES, calculateMasteryLevel } from './data_Challenges.js';

// XP required for each level (cumulative) - Extended to 30
const XP_TABLE = [
    0,      // Level 1
    100,    // Level 2
    250,    // Level 3
    450,    // Level 4
    700,    // Level 5
    1000,   // Level 6
    1350,   // Level 7
    1750,   // Level 8
    2200,   // Level 9
    2700,   // Level 10
    3300,   // Level 11
    4000,   // Level 12
    4800,   // Level 13
    5700,   // Level 14
    6700,   // Level 15
    7800,   // Level 16
    9000,   // Level 17
    10300,  // Level 18
    11700,  // Level 19
    13200,  // Level 20
    // Extended levels (21-30) - More XP required
    15000,  // Level 21
    17000,  // Level 22
    19500,  // Level 23
    22500,  // Level 24
    26000,  // Level 25
    30000,  // Level 26
    35000,  // Level 27
    41000,  // Level 28
    48000,  // Level 29
    56000   // Level 30 (max before prestige)
];

const MAX_LEVEL = 30;
const MAX_PRESTIGE = 10;
const MAX_LOADOUTS = 5;

// XP rewards
const XP_REWARDS = {
    BASE_MATCH: 50,
    WIN_BONUS: 30,
    KILL_BONUS: 10,
    OBJECTIVE_BONUS: 20,
    ROUND_WIN_BONUS: 5
};

export const ClassProgressionSystem = {
    // Get class level
    getClassLevel(classId) {
        const levels = SaveSystem.data?.classLevels ?? {};
        return Math.min(MAX_LEVEL, Math.max(1, levels[classId] ?? 1));
    },
    
    // Get class XP
    getClassXP(classId) {
        const xp = SaveSystem.data?.classXP ?? {};
        return Math.max(0, xp[classId] ?? 0);
    },
    
    // Get prestige level for a class
    getPrestigeLevel(classId) {
        const prestige = SaveSystem.data?.prestige ?? {};
        return Math.min(MAX_PRESTIGE, Math.max(0, prestige[classId] ?? 0));
    },
    
    // Get total prestige tokens
    getPrestigeTokens() {
        return SaveSystem.data?.prestigeTokens ?? 0;
    },
    
    // Add prestige tokens
    addPrestigeTokens(amount) {
        if (!SaveSystem.data) return;
        SaveSystem.data.prestigeTokens = (SaveSystem.data.prestigeTokens ?? 0) + amount;
        SaveSystem.save();
    },
    
    // Can prestige (at max level)
    canPrestige(classId) {
        const level = this.getClassLevel(classId);
        const prestige = this.getPrestigeLevel(classId);
        return level >= MAX_LEVEL && prestige < MAX_PRESTIGE;
    },
    
    // Perform prestige
    prestige(classId) {
        if (!this.canPrestige(classId)) return null;
        if (!SaveSystem.data) return null;
        
        const oldPrestige = this.getPrestigeLevel(classId);
        const newPrestige = oldPrestige + 1;
        
        // Initialize if needed
        if (!SaveSystem.data.prestige) SaveSystem.data.prestige = {};
        
        // Set new prestige level
        SaveSystem.data.prestige[classId] = newPrestige;
        
        // Reset level and XP
        SaveSystem.data.classLevels[classId] = 1;
        SaveSystem.data.classXP[classId] = 0;
        
        // Award prestige tokens (100 base + 25 per prestige level)
        const tokensEarned = 100 + (newPrestige * 25);
        SaveSystem.data.prestigeTokens = (SaveSystem.data.prestigeTokens ?? 0) + tokensEarned;
        
        SaveSystem.save();
        
        return {
            oldPrestige,
            newPrestige,
            tokensEarned,
            classId
        };
    },
    
    // Get XP for next level
    getXPForNextLevel(classId) {
        const level = this.getClassLevel(classId);
        if (level >= MAX_LEVEL) return 0;
        return XP_TABLE[level] ?? XP_TABLE[MAX_LEVEL - 1];
    },
    
    // Get current level progress (0-1)
    getLevelProgress(classId) {
        const level = this.getClassLevel(classId);
        if (level >= MAX_LEVEL) return 1;
        
        const currentXP = this.getClassXP(classId);
        const prevLevelXP = level > 1 ? XP_TABLE[level - 1] : 0;
        const nextLevelXP = XP_TABLE[level] ?? XP_TABLE[MAX_LEVEL - 1];
        
        const progress = (currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP);
        return Math.max(0, Math.min(1, progress));
    },
    
    // Get XP to show (current level progress)
    getCurrentLevelXP(classId) {
        const level = this.getClassLevel(classId);
        const currentXP = this.getClassXP(classId);
        const prevLevelXP = level > 1 ? XP_TABLE[level - 1] : 0;
        return currentXP - prevLevelXP;
    },
    
    // Get XP needed for current level
    getXPNeededForCurrentLevel(classId) {
        const level = this.getClassLevel(classId);
        if (level >= MAX_LEVEL) return 0;
        const prevLevelXP = level > 1 ? XP_TABLE[level - 1] : 0;
        const nextLevelXP = XP_TABLE[level] ?? XP_TABLE[MAX_LEVEL - 1];
        return nextLevelXP - prevLevelXP;
    },
    
    // Add XP to a class, returns level up info if leveled
    addXP(classId, amount) {
        if (!SaveSystem.data) return null;
        
        // Apply XP bonuses from perks/prestige shop
        const xpMultiplier = this.getXPMultiplier(classId);
        amount = Math.floor(amount * xpMultiplier);
        
        // Initialize if needed
        if (!SaveSystem.data.classLevels) SaveSystem.data.classLevels = {};
        if (!SaveSystem.data.classXP) SaveSystem.data.classXP = {};
        
        const oldLevel = this.getClassLevel(classId);
        const oldXP = this.getClassXP(classId);
        const newXP = oldXP + amount;
        
        SaveSystem.data.classXP[classId] = newXP;
        
        // Also track total XP for class mastery
        if (!SaveSystem.data.classTotalXP) SaveSystem.data.classTotalXP = {};
        SaveSystem.data.classTotalXP[classId] = (SaveSystem.data.classTotalXP[classId] ?? 0) + amount;
        
        // Check for level up
        let newLevel = oldLevel;
        while (newLevel < MAX_LEVEL && newXP >= XP_TABLE[newLevel]) {
            newLevel++;
        }
        
        SaveSystem.data.classLevels[classId] = newLevel;
        SaveSystem.save();
        
        if (newLevel > oldLevel) {
            const newUnlocks = this.getUnlocksForLevel(newLevel, classId);
            return {
                leveled: true,
                oldLevel,
                newLevel,
                xpGained: amount,
                totalXP: newXP,
                unlocks: newUnlocks,
                canPrestige: newLevel >= MAX_LEVEL && this.getPrestigeLevel(classId) < MAX_PRESTIGE
            };
        }
        
        return {
            leveled: false,
            xpGained: amount,
            totalXP: newXP,
            level: newLevel
        };
    },
    
    // Get XP multiplier from perks and prestige shop
    getXPMultiplier(classId) {
        let multiplier = 1.0;
        
        // Check for Hardline perk
        const equipped = this.getEquippedPerks(classId);
        if (equipped?.secondary === 'hardline') {
            const perk = PERKS['hardline'];
            multiplier *= perk?.effect?.value ?? 1;
        }
        
        // Check prestige shop boosts
        const shopItems = SaveSystem.data?.prestigeShopPurchased ?? [];
        if (shopItems.includes('xp_boost_10')) multiplier *= 1.1;
        if (shopItems.includes('xp_boost_25')) multiplier *= 1.25;
        
        // Prestige bonus (2% per prestige level)
        const prestige = this.getPrestigeLevel(classId);
        multiplier *= (1 + prestige * 0.02);
        
        return multiplier;
    },
    
    // Get unlocks for reaching a level
    getUnlocksForLevel(level, classId) {
        const unlocks = [];
        
        // Check perks
        Object.values(PERKS).forEach(perk => {
            if (perk?.unlockLevel === level) {
                unlocks.push({
                    type: 'perk',
                    id: perk.id,
                    name: perk.name,
                    icon: perk.icon,
                    category: perk.category
                });
            }
        });
        
        // Check weapons
        Object.values(WEAPONS).forEach(weapon => {
            if (weapon?.unlockLevel === level) {
                unlocks.push({
                    type: 'weapon',
                    id: weapon.id,
                    name: weapon.name,
                    icon: '🔫'
                });
            }
        });
        
        // Special unlocks
        if (level === 15) unlocks.push({ type: 'loadout', name: '4th Loadout Slot', icon: '📋' });
        if (level === 20) unlocks.push({ type: 'slot', name: 'Utility Perk Slot', icon: '🔧' });
        if (level === 25) unlocks.push({ type: 'loadout', name: '5th Loadout Slot', icon: '📋' });
        if (level === 30) unlocks.push({ type: 'prestige', name: 'Prestige Available!', icon: '⭐' });
        
        return unlocks;
    },
    
    // Calculate XP earned from a match
    calculateMatchXP(matchData) {
        let xp = XP_REWARDS.BASE_MATCH;
        
        if (matchData?.won) {
            xp += XP_REWARDS.WIN_BONUS;
        }
        
        xp += (matchData?.kills ?? 0) * XP_REWARDS.KILL_BONUS;
        xp += (matchData?.bombsPlanted ?? 0) * XP_REWARDS.OBJECTIVE_BONUS;
        xp += (matchData?.bombsDefused ?? 0) * XP_REWARDS.OBJECTIVE_BONUS;
        xp += (matchData?.roundsWon ?? 0) * XP_REWARDS.ROUND_WIN_BONUS;
        
        return xp;
    },
    
    // Get equipped perks for a class (including utility slot)
    getEquippedPerks(classId) {
        const equipped = SaveSystem.data?.equippedPerks ?? {};
        const classPerks = equipped[classId] ?? { primary: null, secondary: null, utility: null };
        return classPerks;
    },
    
    // Equip a perk
    equipPerk(classId, perkId, slot) {
        if (!SaveSystem.data) return false;
        
        const perk = PERKS[perkId];
        if (!perk) return false;
        
        const level = this.getClassLevel(classId);
        if (!isPerkUnlockedAtLevel(perkId, level)) return false;
        
        // Validate slot matches perk category
        if (slot === 'primary' && perk.category !== 'primary') return false;
        if (slot === 'secondary' && perk.category !== 'secondary') return false;
        if (slot === 'utility' && perk.category !== 'utility') return false;
        
        // Check if utility slot is unlocked
        if (slot === 'utility' && !isUtilitySlotUnlocked(level)) return false;
        
        if (!SaveSystem.data.equippedPerks) SaveSystem.data.equippedPerks = {};
        if (!SaveSystem.data.equippedPerks[classId]) {
            SaveSystem.data.equippedPerks[classId] = { primary: null, secondary: null, utility: null };
        }
        
        SaveSystem.data.equippedPerks[classId][slot] = perkId;
        SaveSystem.save();
        return true;
    },
    
    // Unequip a perk
    unequipPerk(classId, slot) {
        if (!SaveSystem.data?.equippedPerks?.[classId]) return false;
        
        SaveSystem.data.equippedPerks[classId][slot] = null;
        SaveSystem.save();
        return true;
    },
    
    // Get unlocked perks for a class
    getUnlockedPerks(classId) {
        const level = this.getClassLevel(classId);
        return Object.values(PERKS).filter(perk => isPerkUnlockedAtLevel(perk?.id, level));
    },
    
    // Get next perk unlock for a class
    getNextPerkUnlock(classId) {
        const level = this.getClassLevel(classId);
        const locked = Object.values(PERKS)
            .filter(p => (p?.unlockLevel ?? 99) > level)
            .sort((a, b) => (a?.unlockLevel ?? 0) - (b?.unlockLevel ?? 0));
        return locked[0] ?? null;
    },
    
    // Get total level across all classes
    getTotalLevel() {
        let total = 0;
        Object.keys(CLASSES).forEach(classId => {
            total += this.getClassLevel(classId);
        });
        return total;
    },
    
    // Get total prestige across all classes
    getTotalPrestige() {
        let total = 0;
        Object.keys(CLASSES).forEach(classId => {
            total += this.getPrestigeLevel(classId);
        });
        return total;
    },
    
    // Get max loadout slots based on level
    getMaxLoadoutSlots(classId) {
        const level = this.getClassLevel(classId);
        const shopItems = SaveSystem.data?.prestigeShopPurchased ?? [];
        
        let slots = 3;
        if (level >= 15 || shopItems.includes('loadout_slot_4')) slots = 4;
        if (level >= 25 || shopItems.includes('loadout_slot_5')) slots = 5;
        
        return slots;
    },
    
    // Get loadouts for a class (5 slots max)
    getLoadouts(classId) {
        const loadouts = SaveSystem.data?.loadouts ?? {};
        const maxSlots = this.getMaxLoadoutSlots(classId);
        const defaultLoadouts = [];
        
        for (let i = 0; i < maxSlots; i++) {
            defaultLoadouts.push({
                name: `Loadout ${i + 1}`,
                weapon: 'pistol',
                primaryPerk: null,
                secondaryPerk: null,
                utilityPerk: null,
                weaponSkin: null
            });
        }
        
        const existing = loadouts[classId] ?? [];
        for (let i = 0; i < maxSlots; i++) {
            if (existing[i]) {
                defaultLoadouts[i] = { ...defaultLoadouts[i], ...existing[i] };
            }
        }
        
        return defaultLoadouts;
    },
    
    // Save loadout
    saveLoadout(classId, slotIndex, loadoutData) {
        if (!SaveSystem.data) return false;
        const maxSlots = this.getMaxLoadoutSlots(classId);
        if (slotIndex < 0 || slotIndex >= maxSlots) return false;
        
        if (!SaveSystem.data.loadouts) SaveSystem.data.loadouts = {};
        if (!SaveSystem.data.loadouts[classId]) {
            SaveSystem.data.loadouts[classId] = [];
        }
        
        // Ensure array is long enough
        while (SaveSystem.data.loadouts[classId].length <= slotIndex) {
            SaveSystem.data.loadouts[classId].push(null);
        }
        
        SaveSystem.data.loadouts[classId][slotIndex] = { ...loadoutData };
        SaveSystem.save();
        return true;
    },
    
    // Get active loadout index
    getActiveLoadoutIndex(classId) {
        const active = SaveSystem.data?.activeLoadouts ?? {};
        return active[classId] ?? 0;
    },
    
    // Set active loadout
    setActiveLoadout(classId, index) {
        if (!SaveSystem.data) return;
        if (!SaveSystem.data.activeLoadouts) SaveSystem.data.activeLoadouts = {};
        SaveSystem.data.activeLoadouts[classId] = index;
        SaveSystem.save();
    },
    
    // Check if weapon is unlocked (based on highest class level)
    isWeaponUnlocked(weaponId) {
        const weapon = WEAPONS[weaponId];
        if (!weapon || (weapon.unlockLevel ?? 0) === 0) return true;
        
        let maxLevel = 1;
        Object.keys(CLASSES).forEach(classId => {
            const level = this.getClassLevel(classId);
            if (level > maxLevel) maxLevel = level;
        });
        
        return maxLevel >= (weapon.unlockLevel ?? 0);
    },
    
    // Weapon kills tracking
    recordWeaponKill(weaponId) {
        if (!SaveSystem.data) return null;
        if (!SaveSystem.data.weaponKills) SaveSystem.data.weaponKills = {};
        
        const oldKills = SaveSystem.data.weaponKills[weaponId] ?? 0;
        const newKills = oldKills + 1;
        SaveSystem.data.weaponKills[weaponId] = newKills;
        
        // Check for tier up
        const oldTier = getWeaponChallengeTier(oldKills);
        const newTier = getWeaponChallengeTier(newKills);
        
        SaveSystem.save();
        
        if (newTier && newTier !== oldTier) {
            return { weaponId, newTier, kills: newKills };
        }
        return null;
    },
    
    // Get weapon kills
    getWeaponKills(weaponId) {
        return SaveSystem.data?.weaponKills?.[weaponId] ?? 0;
    },
    
    // Get weapon mastery tier
    getWeaponMasteryTier(weaponId) {
        const kills = this.getWeaponKills(weaponId);
        return getWeaponChallengeTier(kills);
    },
    
    // Class mastery tracking
    getClassMasteryProgress(classId, challengeType) {
        const stats = SaveSystem.data?.classMasteryStats?.[classId] ?? {};
        return stats[challengeType] ?? 0;
    },
    
    // Record class mastery progress
    recordClassMasteryProgress(classId, type, amount = 1) {
        if (!SaveSystem.data) return;
        if (!SaveSystem.data.classMasteryStats) SaveSystem.data.classMasteryStats = {};
        if (!SaveSystem.data.classMasteryStats[classId]) SaveSystem.data.classMasteryStats[classId] = {};
        
        SaveSystem.data.classMasteryStats[classId][type] = 
            (SaveSystem.data.classMasteryStats[classId][type] ?? 0) + amount;
        SaveSystem.save();
    },
    
    // Get completed class mastery challenges
    getCompletedMasteryChallenges(classId) {
        const stats = SaveSystem.data?.classMasteryStats?.[classId] ?? {};
        const completed = [];
        
        Object.entries(CLASS_MASTERY_CHALLENGES).forEach(([id, challenge]) => {
            const progress = stats[challenge?.type] ?? 0;
            if (progress >= (challenge?.target ?? Infinity)) {
                completed.push(id);
            }
        });
        
        return completed;
    },
    
    // Get class mastery level (1-10)
    getClassMasteryLevel(classId) {
        const completed = this.getCompletedMasteryChallenges(classId);
        return calculateMasteryLevel(completed);
    },
    
    // Cosmetics management
    getEquippedCosmetics() {
        return SaveSystem.data?.equippedCosmetics ?? {
            playerSkin: 'default',
            callingCard: 'default',
            emblem: 'default'
        };
    },
    
    setEquippedCosmetic(type, id) {
        if (!SaveSystem.data) return;
        if (!SaveSystem.data.equippedCosmetics) {
            SaveSystem.data.equippedCosmetics = {
                playerSkin: 'default',
                callingCard: 'default',
                emblem: 'default'
            };
        }
        SaveSystem.data.equippedCosmetics[type] = id;
        SaveSystem.save();
    },
    
    // Get unlocked cosmetics
    getUnlockedCosmetics() {
        return SaveSystem.data?.unlockedCosmetics ?? ['default'];
    },
    
    // Unlock a cosmetic
    unlockCosmetic(id) {
        if (!SaveSystem.data) return false;
        if (!SaveSystem.data.unlockedCosmetics) SaveSystem.data.unlockedCosmetics = ['default'];
        if (!SaveSystem.data.unlockedCosmetics.includes(id)) {
            SaveSystem.data.unlockedCosmetics.push(id);
            SaveSystem.save();
            return true;
        }
        return false;
    },
    
    // Prestige shop
    getPrestigeShopPurchased() {
        return SaveSystem.data?.prestigeShopPurchased ?? [];
    },
    
    purchasePrestigeItem(itemId, cost) {
        if (!SaveSystem.data) return false;
        const tokens = this.getPrestigeTokens();
        if (tokens < cost) return false;
        
        if (!SaveSystem.data.prestigeShopPurchased) SaveSystem.data.prestigeShopPurchased = [];
        if (SaveSystem.data.prestigeShopPurchased.includes(itemId)) return false;
        
        SaveSystem.data.prestigeTokens = tokens - cost;
        SaveSystem.data.prestigeShopPurchased.push(itemId);
        SaveSystem.save();
        return true;
    },
    
    // Get XP rewards info
    getXPRewardsInfo() {
        return { ...XP_REWARDS };
    },
    
    // Get max level
    getMaxLevel() {
        return MAX_LEVEL;
    },
    
    // Get max prestige
    getMaxPrestige() {
        return MAX_PRESTIGE;
    }
};
