// Class definitions for LOCKDOWN LANES
export const CLASSES = {
    assault: {
        id: 'assault',
        name: 'Assault',
        description: 'Balanced fighter with reliable damage',
        icon: '⚔️',
        color: 0x3498db,
        unlockTrophies: 0,
        stats: {
            hp: 100,
            speed: 180,
            damage: 1.0,
            fireRate: 1.0,
            spread: 1.0,
            smokeCharges: 1,
            smokeCooldown: 12000
        },
        ability: {
            name: 'Steady Aim',
            description: 'Reduced spread when stationary',
            passive: true
        }
    },
    rusher: {
        id: 'rusher',
        name: 'Rusher',
        description: 'Fast and aggressive close-range specialist',
        icon: '💨',
        color: 0xe74c3c,
        unlockTrophies: 400,
        stats: {
            hp: 85,
            speed: 220,
            damage: 0.9,
            fireRate: 1.3,
            spread: 1.4,
            smokeCharges: 1,
            smokeCooldown: 10000
        },
        ability: {
            name: 'Sprint Boost',
            description: '+25% sprint speed, -20% sprint drain',
            passive: true
        }
    },
    sniper: {
        id: 'sniper',
        name: 'Sniper',
        description: 'Long-range precision shooter',
        icon: '🎯',
        color: 0x9b59b6,
        unlockTrophies: 800,
        stats: {
            hp: 80,
            speed: 160,
            damage: 1.5,
            fireRate: 0.5,
            spread: 0.4,
            smokeCharges: 1,
            smokeCooldown: 15000
        },
        ability: {
            name: 'Eagle Eye',
            description: '+30% bullet range, headshot bonus',
            passive: true
        }
    },
    tank: {
        id: 'tank',
        name: 'Tank',
        description: 'Heavy armor, slow but durable',
        icon: '🛡️',
        color: 0xf39c12,
        unlockTrophies: 1200,
        stats: {
            hp: 140,
            speed: 145,
            damage: 0.85,
            fireRate: 0.8,
            spread: 1.2,
            smokeCharges: 2,
            smokeCooldown: 14000
        },
        ability: {
            name: 'Fortify',
            description: '-30% damage taken when stationary',
            passive: true
        }
    },
    support: {
        id: 'support',
        name: 'Support',
        description: 'Utility master with extra smokes',
        icon: '💊',
        color: 0x2ecc71,
        unlockTrophies: 1600,
        stats: {
            hp: 95,
            speed: 175,
            damage: 0.9,
            fireRate: 1.0,
            spread: 1.1,
            smokeCharges: 3,
            smokeCooldown: 7000
        },
        ability: {
            name: 'Medic',
            description: 'Regenerate 5 HP per round won',
            passive: true
        }
    }
};

// Get class unlock order
export const CLASS_UNLOCK_ORDER = Object.values(CLASSES).sort((a, b) => a.unlockTrophies - b.unlockTrophies);
