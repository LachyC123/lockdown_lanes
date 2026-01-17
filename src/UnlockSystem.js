// UnlockSystem - Trophy-based unlocks (Clash Royale style)
import { SaveSystem } from './SaveSystem.js';
import { UNLOCKS, KITS } from './data_Weapons.js';
import { CLASSES } from './data_Classes.js';

export const UnlockSystem = {
    // Check what should be unlocked at current trophy count
    checkAndUnlock(trophies) {
        const newUnlocks = [];
        
        // Check kit/weapon unlocks
        for (const unlock of UNLOCKS ?? []) {
            if (trophies >= (unlock?.trophies ?? 0) && !SaveSystem.isUnlocked(unlock?.id)) {
                SaveSystem.unlock(unlock.id);
                newUnlocks.push(unlock);
            }
        }
        
        // Check class unlocks
        for (const [classId, classData] of Object.entries(CLASSES ?? {})) {
            if (trophies >= (classData?.unlockTrophies ?? 0) && !SaveSystem.isUnlocked(classId)) {
                SaveSystem.unlock(classId);
                newUnlocks.push({
                    id: classId,
                    type: 'class',
                    name: classData.name,
                    description: classData.description,
                    trophies: classData.unlockTrophies
                });
            }
        }
        
        return newUnlocks;
    },
    
    // Get all unlocks with their status
    getAllUnlocks(trophies) {
        const allUnlocks = [];
        
        // Add kit unlocks
        for (const unlock of UNLOCKS ?? []) {
            allUnlocks.push({
                ...unlock,
                unlocked: SaveSystem.isUnlocked(unlock?.id),
                canUnlock: trophies >= (unlock?.trophies ?? 0)
            });
        }
        
        // Add class unlocks
        for (const [classId, classData] of Object.entries(CLASSES ?? {})) {
            allUnlocks.push({
                id: classId,
                type: 'class',
                name: `${classData.icon} ${classData.name}`,
                description: classData.description,
                trophies: classData.unlockTrophies,
                unlocked: SaveSystem.isUnlocked(classId),
                canUnlock: trophies >= (classData?.unlockTrophies ?? 0)
            });
        }
        
        // Sort by trophy requirement
        return allUnlocks.sort((a, b) => (a?.trophies ?? 0) - (b?.trophies ?? 0));
    },
    
    // Get available kits for buy menu
    getAvailableKits(trophies) {
        const available = [];
        const locked = [];
        
        for (const [id, kit] of Object.entries(KITS ?? {})) {
            const kitInfo = { ...kit, id };
            if (SaveSystem.isUnlocked(id)) {
                available.push(kitInfo);
            } else {
                kitInfo.requiredTrophies = kit?.unlockTrophies ?? 0;
                locked.push(kitInfo);
            }
        }
        
        return { available, locked };
    },
    
    // Get available classes
    getAvailableClasses(trophies) {
        const available = [];
        const locked = [];
        
        for (const [id, cls] of Object.entries(CLASSES ?? {})) {
            const classInfo = { ...cls, id };
            if (SaveSystem.isUnlocked(id) || trophies >= (cls?.unlockTrophies ?? 0)) {
                available.push(classInfo);
            } else {
                locked.push(classInfo);
            }
        }
        
        // Sort by unlock trophies
        available.sort((a, b) => (a?.unlockTrophies ?? 0) - (b?.unlockTrophies ?? 0));
        locked.sort((a, b) => (a?.unlockTrophies ?? 0) - (b?.unlockTrophies ?? 0));
        
        return { available, locked };
    },
    
    // Get next unlock milestone
    getNextUnlock(trophies) {
        const allUnlocks = this.getAllUnlocks(trophies);
        
        for (const unlock of allUnlocks) {
            if (trophies < (unlock?.trophies ?? 0)) {
                return {
                    ...unlock,
                    trophiesNeeded: (unlock.trophies ?? 0) - trophies
                };
            }
        }
        return null;
    },
    
    // Initialize unlocks on game start
    initializeUnlocks() {
        const trophies = SaveSystem.getTrophies();
        this.checkAndUnlock(trophies);
    }
};
