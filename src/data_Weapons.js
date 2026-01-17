// Weapon definitions - EXPANDED v2.0
export const WEAPONS = {
    pistol: {
        id: 'pistol',
        name: 'Pistol',
        damage: 22,
        fireRate: 350,
        spread: 0.08,
        range: 400,
        cost: 0,
        color: 0xbdc3c7,
        unlockLevel: 0,
        description: 'Reliable sidearm',
        type: 'pistol'
    },
    smg: {
        id: 'smg',
        name: 'SMG',
        damage: 16,
        fireRate: 100,
        spread: 0.15,
        range: 300,
        cost: 200,
        color: 0x3498db,
        unlockLevel: 0,
        description: 'High fire rate',
        type: 'smg'
    },
    rifle: {
        id: 'rifle',
        name: 'Rifle',
        damage: 32,
        fireRate: 200,
        spread: 0.05,
        range: 500,
        cost: 350,
        color: 0xe74c3c,
        unlockLevel: 0,
        description: 'High damage per shot',
        type: 'rifle'
    },
    burst_rifle: {
        id: 'burst_rifle',
        name: 'Burst Rifle',
        damage: 24,
        fireRate: 80,
        burstCount: 3,
        burstDelay: 400,
        spread: 0.04,
        range: 450,
        cost: 300,
        color: 0x9b59b6,
        unlockLevel: 5,
        description: '3-round burst, high accuracy',
        type: 'rifle'
    },
    heavy_pistol: {
        id: 'heavy_pistol',
        name: 'Heavy Pistol',
        damage: 45,
        fireRate: 600,
        spread: 0.03,
        range: 380,
        cost: 150,
        color: 0xf39c12,
        unlockLevel: 8,
        description: 'High damage, slow fire',
        type: 'pistol'
    },
    tactical_smg: {
        id: 'tactical_smg',
        name: 'Tactical SMG',
        damage: 14,
        fireRate: 90,
        spread: 0.06,
        range: 350,
        cost: 250,
        color: 0x1abc9c,
        unlockLevel: 12,
        suppressed: true,
        description: 'Suppressed, very accurate',
        type: 'smg'
    },
    // NEW WEAPONS
    marksman_rifle: {
        id: 'marksman_rifle',
        name: 'Marksman Rifle',
        damage: 55,
        fireRate: 450,
        spread: 0.02,
        range: 600,
        cost: 400,
        color: 0x8e44ad,
        unlockLevel: 15,
        description: 'Semi-auto, high precision',
        type: 'dmr'
    },
    compact_smg: {
        id: 'compact_smg',
        name: 'Compact SMG',
        damage: 12,
        fireRate: 60,
        spread: 0.18,
        range: 250,
        cost: 180,
        color: 0xe67e22,
        unlockLevel: 18,
        description: 'Very high fire rate',
        type: 'smg'
    },
    shotgun: {
        id: 'shotgun',
        name: 'Shotgun',
        damage: 80,
        fireRate: 900,
        spread: 0.25,
        range: 150,
        pellets: 6,
        cost: 350,
        color: 0xd35400,
        unlockLevel: 22,
        description: 'Devastating at close range',
        type: 'shotgun'
    },
    lmg: {
        id: 'lmg',
        name: 'Light Machine Gun',
        damage: 28,
        fireRate: 120,
        spread: 0.12,
        range: 400,
        magazineSize: 50,
        cost: 450,
        color: 0x2c3e50,
        unlockLevel: 25,
        description: 'Large magazine, sustained fire',
        type: 'lmg'
    }
};

export const KITS = {
    pistol: {
        id: 'pistol',
        name: 'Pistol Kit',
        description: 'Accurate sidearm',
        cost: 0,
        weapon: 'pistol',
        smokeCharges: 1,
        smokeCooldown: 12000,
        unlockTrophies: 0
    },
    smg: {
        id: 'smg',
        name: 'SMG Kit',
        description: 'High fire rate',
        cost: 200,
        weapon: 'smg',
        smokeCharges: 1,
        smokeCooldown: 12000,
        unlockTrophies: 300
    },
    rifle: {
        id: 'rifle',
        name: 'Rifle Kit',
        description: 'High damage',
        cost: 350,
        weapon: 'rifle',
        smokeCharges: 1,
        smokeCooldown: 12000,
        unlockTrophies: 600
    },
    utility: {
        id: 'utility',
        name: 'Utility Kit',
        description: '+1 smoke, -4s CD',
        cost: 150,
        weapon: 'pistol',
        smokeCharges: 2,
        smokeCooldown: 8000,
        unlockTrophies: 1000
    },
    burst: {
        id: 'burst',
        name: 'Burst Kit',
        description: '3-round burst rifle',
        cost: 300,
        weapon: 'burst_rifle',
        smokeCharges: 1,
        smokeCooldown: 12000,
        unlockLevel: 5
    },
    heavy: {
        id: 'heavy',
        name: 'Heavy Kit',
        description: 'High damage pistol',
        cost: 150,
        weapon: 'heavy_pistol',
        smokeCharges: 1,
        smokeCooldown: 12000,
        unlockLevel: 8
    },
    tactical: {
        id: 'tactical',
        name: 'Tactical Kit',
        description: 'Suppressed SMG',
        cost: 250,
        weapon: 'tactical_smg',
        smokeCharges: 1,
        smokeCooldown: 11000,
        unlockLevel: 12
    },
    marksman: {
        id: 'marksman',
        name: 'Marksman Kit',
        description: 'DMR precision',
        cost: 400,
        weapon: 'marksman_rifle',
        smokeCharges: 1,
        smokeCooldown: 12000,
        unlockLevel: 15
    },
    compact: {
        id: 'compact',
        name: 'Compact Kit',
        description: 'Rapid fire SMG',
        cost: 180,
        weapon: 'compact_smg',
        smokeCharges: 1,
        smokeCooldown: 11000,
        unlockLevel: 18
    },
    shotgunner: {
        id: 'shotgunner',
        name: 'Shotgun Kit',
        description: 'Close quarters',
        cost: 350,
        weapon: 'shotgun',
        smokeCharges: 2,
        smokeCooldown: 10000,
        unlockLevel: 22
    },
    heavy_support: {
        id: 'heavy_support',
        name: 'LMG Kit',
        description: 'Suppressive fire',
        cost: 450,
        weapon: 'lmg',
        smokeCharges: 1,
        smokeCooldown: 15000,
        unlockLevel: 25
    }
};

// Unlockables at trophy milestones
export const UNLOCKS = [
    { trophies: 0, type: 'kit', id: 'pistol', name: 'Pistol Kit', description: 'Your starter weapon' },
    { trophies: 300, type: 'kit', id: 'smg', name: 'SMG Kit', description: 'Unlock rapid-fire SMG!' },
    { trophies: 600, type: 'kit', id: 'rifle', name: 'Rifle Kit', description: 'Unlock powerful Rifle!' },
    { trophies: 1000, type: 'kit', id: 'utility', name: 'Utility Kit', description: 'Extra smoke grenade!' },
    { trophies: 1400, type: 'cosmetic', id: 'gold_trail', name: 'Gold Trail', description: 'Golden bullet trails' },
    { trophies: 1800, type: 'cosmetic', id: 'elite_skin', name: 'Elite Skin', description: 'Elite player skin' },
    { trophies: 2200, type: 'cosmetic', id: 'fire_smoke', name: 'Fire Smoke', description: 'Fiery smoke effect' },
    { trophies: 2600, type: 'cosmetic', id: 'legend_aura', name: 'Legend Aura', description: 'Legendary glow effect' },
    { trophies: 3000, type: 'title', id: 'mythic_title', name: 'Mythic Champion', description: 'Ultimate bragging rights!' }
];

// Weapon challenge tiers
export const WEAPON_CHALLENGE_TIERS = {
    bronze: { kills: 25, name: 'Bronze', color: 0xcd7f32, icon: '🥉' },
    silver: { kills: 50, name: 'Silver', color: 0xc0c0c0, icon: '🥈' },
    gold: { kills: 100, name: 'Gold', color: 0xffd700, icon: '🥇' },
    platinum: { kills: 250, name: 'Platinum', color: 0xe5e4e2, icon: '💎' },
    diamond: { kills: 500, name: 'Diamond', color: 0xb9f2ff, icon: '💠' }
};

// Get weapon by ID
export function getWeapon(weaponId) {
    return WEAPONS[weaponId] ?? WEAPONS.pistol;
}

// Get all weapons sorted by unlock level
export function getAllWeaponsSorted() {
    return Object.values(WEAPONS).sort((a, b) => (a?.unlockLevel ?? 0) - (b?.unlockLevel ?? 0));
}

// Get weapon challenge tier based on kills
export function getWeaponChallengeTier(kills) {
    if (kills >= WEAPON_CHALLENGE_TIERS.diamond.kills) return 'diamond';
    if (kills >= WEAPON_CHALLENGE_TIERS.platinum.kills) return 'platinum';
    if (kills >= WEAPON_CHALLENGE_TIERS.gold.kills) return 'gold';
    if (kills >= WEAPON_CHALLENGE_TIERS.silver.kills) return 'silver';
    if (kills >= WEAPON_CHALLENGE_TIERS.bronze.kills) return 'bronze';
    return null;
}

// Get next tier for weapon
export function getNextWeaponTier(currentTier) {
    const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const idx = tiers.indexOf(currentTier);
    if (idx === -1) return 'bronze';
    if (idx >= tiers.length - 1) return null;
    return tiers[idx + 1];
}
