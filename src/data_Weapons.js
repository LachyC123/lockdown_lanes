// Weapon definitions
export const WEAPONS = {
    pistol: {
        name: 'Pistol',
        damage: 22,
        fireRate: 350,
        spread: 0.08,
        range: 400,
        cost: 0,
        color: 0xbdc3c7
    },
    smg: {
        name: 'SMG',
        damage: 16,
        fireRate: 100,
        spread: 0.15,
        range: 300,
        cost: 200,
        color: 0x3498db
    },
    rifle: {
        name: 'Rifle',
        damage: 32,
        fireRate: 200,
        spread: 0.05,
        range: 500,
        cost: 350,
        color: 0xe74c3c
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
