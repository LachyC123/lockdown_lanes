// Perk definitions for class progression system - EXPANDED v2.0

export const PERK_CATEGORIES = {
    PRIMARY: 'primary',    // Combat perks
    SECONDARY: 'secondary', // Tactical perks
    UTILITY: 'utility'     // Utility perks (3rd slot)
};

export const PERKS = {
    // PRIMARY PERKS (Combat) - 9 Total
    fast_hands: {
        id: 'fast_hands',
        name: 'Fast Hands',
        description: '20% faster reload speed',
        icon: '🖐️',
        category: PERK_CATEGORIES.PRIMARY,
        unlockLevel: 3,
        effect: { type: 'reload_speed', value: 0.8 },
        color: 0x3498db
    },
    steady_aim: {
        id: 'steady_aim',
        name: 'Steady Aim',
        description: '25% less weapon spread',
        icon: '🎯',
        category: PERK_CATEGORIES.PRIMARY,
        unlockLevel: 5,
        effect: { type: 'spread', value: 0.75 },
        color: 0x9b59b6
    },
    heavy_hitter: {
        id: 'heavy_hitter',
        name: 'Heavy Hitter',
        description: '+15% weapon damage',
        icon: '💥',
        category: PERK_CATEGORIES.PRIMARY,
        unlockLevel: 10,
        effect: { type: 'damage', value: 1.15 },
        color: 0xe74c3c
    },
    quick_draw: {
        id: 'quick_draw',
        name: 'Quick Draw',
        description: '30% faster weapon switch',
        icon: '⚡',
        category: PERK_CATEGORIES.PRIMARY,
        unlockLevel: 15,
        effect: { type: 'weapon_switch', value: 0.7 },
        color: 0xf1c40f
    },
    sharpshooter: {
        id: 'sharpshooter',
        name: 'Sharpshooter',
        description: '+20% accuracy (less spread)',
        icon: '🏹',
        category: PERK_CATEGORIES.PRIMARY,
        unlockLevel: 18,
        effect: { type: 'accuracy', value: 0.8 },
        color: 0x1abc9c
    },
    // NEW PRIMARY PERKS
    marksman: {
        id: 'marksman',
        name: 'Marksman',
        description: '+30% damage at long range',
        icon: '🔭',
        category: PERK_CATEGORIES.PRIMARY,
        unlockLevel: 22,
        effect: { type: 'long_range_damage', value: 1.3 },
        color: 0x8e44ad
    },
    spray_master: {
        id: 'spray_master',
        name: 'Spray Master',
        description: '+40% hip-fire accuracy',
        icon: '🔥',
        category: PERK_CATEGORIES.PRIMARY,
        unlockLevel: 26,
        effect: { type: 'hipfire_accuracy', value: 0.6 },
        color: 0xd35400
    },
    lightweight: {
        id: 'lightweight',
        name: 'Lightweight',
        description: '+10% speed while aiming',
        icon: '🪶',
        category: PERK_CATEGORIES.PRIMARY,
        unlockLevel: 28,
        effect: { type: 'ads_speed', value: 1.1 },
        color: 0x16a085
    },
    scavenger: {
        id: 'scavenger',
        name: 'Scavenger',
        description: 'Regain ammo from kills',
        icon: '🎒',
        category: PERK_CATEGORIES.PRIMARY,
        unlockLevel: 30,
        effect: { type: 'scavenge_ammo', value: 10 },
        color: 0x7f8c8d
    },
    
    // SECONDARY PERKS (Tactical) - 9 Total
    quick_fix: {
        id: 'quick_fix',
        name: 'Quick Fix',
        description: 'Regenerate 20 HP on kill',
        icon: '💊',
        category: PERK_CATEGORIES.SECONDARY,
        unlockLevel: 3,
        effect: { type: 'heal_on_kill', value: 20 },
        color: 0x2ecc71
    },
    extra_utility: {
        id: 'extra_utility',
        name: 'Extra Utility',
        description: '+1 smoke grenade charge',
        icon: '💨',
        category: PERK_CATEGORIES.SECONDARY,
        unlockLevel: 7,
        effect: { type: 'smoke_charges', value: 1 },
        color: 0x95a5a6
    },
    speed_demon: {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: '+15% movement speed',
        icon: '🏃',
        category: PERK_CATEGORIES.SECONDARY,
        unlockLevel: 10,
        effect: { type: 'move_speed', value: 1.15 },
        color: 0xe67e22
    },
    bomb_expert: {
        id: 'bomb_expert',
        name: 'Bomb Expert',
        description: '25% faster plant/defuse',
        icon: '💣',
        category: PERK_CATEGORIES.SECONDARY,
        unlockLevel: 12,
        effect: { type: 'plant_defuse_speed', value: 0.75 },
        color: 0xc0392b
    },
    ghost: {
        id: 'ghost',
        name: 'Ghost',
        description: 'AI takes longer to detect you',
        icon: '👻',
        category: PERK_CATEGORIES.SECONDARY,
        unlockLevel: 16,
        effect: { type: 'ai_detection', value: 1.5 },
        color: 0x34495e
    },
    // NEW SECONDARY PERKS
    hardline: {
        id: 'hardline',
        name: 'Hardline',
        description: 'Earn 15% more XP',
        icon: '💰',
        category: PERK_CATEGORIES.SECONDARY,
        unlockLevel: 20,
        effect: { type: 'xp_bonus', value: 1.15 },
        color: 0xf39c12
    },
    tactical_mask: {
        id: 'tactical_mask',
        name: 'Tactical Mask',
        description: '50% reduced smoke effect',
        icon: '😷',
        category: PERK_CATEGORIES.SECONDARY,
        unlockLevel: 24,
        effect: { type: 'smoke_resist', value: 0.5 },
        color: 0x27ae60
    },
    awareness: {
        id: 'awareness',
        name: 'Awareness',
        description: 'See enemy on minimap when they shoot',
        icon: '👁️',
        category: PERK_CATEGORIES.SECONDARY,
        unlockLevel: 27,
        effect: { type: 'enemy_reveal', value: 3 },
        color: 0xe91e63
    },
    last_stand: {
        id: 'last_stand',
        name: 'Last Stand',
        description: 'Survive with 1 HP once per round',
        icon: '💀',
        category: PERK_CATEGORIES.SECONDARY,
        unlockLevel: 29,
        effect: { type: 'last_stand', value: 1 },
        color: 0x2c3e50
    },
    
    // UTILITY PERKS (3rd Slot, unlocked at Lv.20) - 4 Total
    engineer: {
        id: 'engineer',
        name: 'Engineer',
        description: 'See bomb through walls',
        icon: '🔧',
        category: PERK_CATEGORIES.UTILITY,
        unlockLevel: 20,
        effect: { type: 'bomb_vision', value: true },
        color: 0x9b59b6
    },
    tracker: {
        id: 'tracker',
        name: 'Tracker',
        description: 'See enemy footsteps for 3s',
        icon: '👣',
        category: PERK_CATEGORIES.UTILITY,
        unlockLevel: 23,
        effect: { type: 'footstep_vision', value: 3 },
        color: 0xe74c3c
    },
    resilience: {
        id: 'resilience',
        name: 'Resilience',
        description: 'Take 10% less damage',
        icon: '🛡️',
        category: PERK_CATEGORIES.UTILITY,
        unlockLevel: 25,
        effect: { type: 'damage_resist', value: 0.9 },
        color: 0x3498db
    },
    clutch: {
        id: 'clutch',
        name: 'Clutch',
        description: '+20% accuracy when last alive',
        icon: '🎖️',
        category: PERK_CATEGORIES.UTILITY,
        unlockLevel: 28,
        effect: { type: 'clutch_accuracy', value: 0.8 },
        color: 0xf1c40f
    }
};

// Get perks by category
export function getPerksByCategory(category) {
    return Object.values(PERKS).filter(p => p?.category === category);
}

// Get primary perks
export function getPrimaryPerks() {
    return getPerksByCategory(PERK_CATEGORIES.PRIMARY);
}

// Get secondary perks
export function getSecondaryPerks() {
    return getPerksByCategory(PERK_CATEGORIES.SECONDARY);
}

// Get utility perks
export function getUtilityPerks() {
    return getPerksByCategory(PERK_CATEGORIES.UTILITY);
}

// Get perk by ID
export function getPerk(perkId) {
    return PERKS[perkId] ?? null;
}

// Check if perk is unlocked at level
export function isPerkUnlockedAtLevel(perkId, level) {
    const perk = PERKS[perkId];
    return (perk?.unlockLevel ?? 99) <= level;
}

// Get all perks sorted by unlock level
export function getAllPerksSorted() {
    return Object.values(PERKS).sort((a, b) => (a?.unlockLevel ?? 0) - (b?.unlockLevel ?? 0));
}

// Check if utility slot is unlocked
export function isUtilitySlotUnlocked(level) {
    return level >= 20;
}
