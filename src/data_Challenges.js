// Challenge definitions - Weapon and Class Mastery

// Class mastery challenges
export const CLASS_MASTERY_CHALLENGES = {
    wins_1: { id: 'wins_1', name: 'First Steps', description: 'Win 10 matches', type: 'wins', target: 10, reward: { xp: 100, tier: 1 } },
    wins_2: { id: 'wins_2', name: 'Getting Good', description: 'Win 25 matches', type: 'wins', target: 25, reward: { xp: 250, tier: 2 } },
    wins_3: { id: 'wins_3', name: 'Seasoned', description: 'Win 50 matches', type: 'wins', target: 50, reward: { xp: 500, tier: 3 } },
    wins_4: { id: 'wins_4', name: 'Master', description: 'Win 100 matches', type: 'wins', target: 100, reward: { xp: 1000, tier: 4, skin: true } },
    
    kills_1: { id: 'kills_1', name: 'First Blood', description: 'Get 50 kills', type: 'kills', target: 50, reward: { xp: 100, tier: 1 } },
    kills_2: { id: 'kills_2', name: 'Lethal', description: 'Get 100 kills', type: 'kills', target: 100, reward: { xp: 250, tier: 2 } },
    kills_3: { id: 'kills_3', name: 'Deadly', description: 'Get 250 kills', type: 'kills', target: 250, reward: { xp: 500, tier: 3 } },
    kills_4: { id: 'kills_4', name: 'Executioner', description: 'Get 500 kills', type: 'kills', target: 500, reward: { xp: 1000, tier: 4, emblem: true } },
    
    objectives_1: { id: 'objectives_1', name: 'Objective Player', description: 'Plant/Defuse 25 bombs', type: 'objectives', target: 25, reward: { xp: 150, tier: 1 } },
    objectives_2: { id: 'objectives_2', name: 'Mission Focused', description: 'Plant/Defuse 50 bombs', type: 'objectives', target: 50, reward: { xp: 350, tier: 2 } },
    objectives_3: { id: 'objectives_3', name: 'Specialist', description: 'Plant/Defuse 100 bombs', type: 'objectives', target: 100, reward: { xp: 750, tier: 3, card: true } },
    
    xp_1: { id: 'xp_1', name: 'Grinder', description: 'Earn 1000 XP', type: 'xp', target: 1000, reward: { xp: 100, tier: 1 } },
    xp_2: { id: 'xp_2', name: 'Dedicated', description: 'Earn 2500 XP', type: 'xp', target: 2500, reward: { xp: 250, tier: 2 } },
    xp_3: { id: 'xp_3', name: 'Committed', description: 'Earn 5000 XP', type: 'xp', target: 5000, reward: { xp: 500, tier: 3 } }
};

// Prestige rewards
export const PRESTIGE_REWARDS = [
    { prestige: 1, name: 'Prestige I', rewards: [{ type: 'skin', id: 'gold' }, { type: 'card', id: 'prestige_1' }, { type: 'tokens', amount: 100 }] },
    { prestige: 2, name: 'Prestige II', rewards: [{ type: 'skin', id: 'platinum' }, { type: 'card', id: 'prestige_2' }, { type: 'tokens', amount: 150 }] },
    { prestige: 3, name: 'Prestige III', rewards: [{ type: 'skin', id: 'diamond' }, { type: 'card', id: 'prestige_3' }, { type: 'tokens', amount: 200 }] },
    { prestige: 4, name: 'Prestige IV', rewards: [{ type: 'emblem', id: 'prestige_4' }, { type: 'tokens', amount: 250 }] },
    { prestige: 5, name: 'Prestige V', rewards: [{ type: 'skin', id: 'obsidian' }, { type: 'card', id: 'master' }, { type: 'tokens', amount: 500 }] }
];

// Prestige shop items
export const PRESTIGE_SHOP = [
    { id: 'xp_boost_10', name: '10% XP Boost', description: 'Permanent 10% XP bonus', cost: 100, type: 'boost', effect: { xp: 1.1 } },
    { id: 'xp_boost_25', name: '25% XP Boost', description: 'Permanent 25% XP bonus', cost: 300, type: 'boost', effect: { xp: 1.25 }, requires: 'xp_boost_10' },
    { id: 'prestige_skin_1', name: 'Prestige Gold Trim', description: 'Exclusive gold accent skin', cost: 150, type: 'skin', color: 0xffd700 },
    { id: 'prestige_skin_2', name: 'Prestige Crimson', description: 'Exclusive crimson skin', cost: 200, type: 'skin', color: 0xdc143c },
    { id: 'prestige_skin_3', name: 'Prestige Void', description: 'Exclusive void skin', cost: 400, type: 'skin', color: 0x1a0033 },
    { id: 'prestige_card_1', name: 'Elite Commander', description: 'Exclusive calling card', cost: 100, type: 'card', gradient: ['#ffd700', '#b8860b'] },
    { id: 'prestige_card_2', name: 'Shadow Ops', description: 'Exclusive calling card', cost: 150, type: 'card', gradient: ['#1a1a2e', '#4a4a6e'] },
    { id: 'prestige_emblem_1', name: 'Star Elite', description: 'Prestige emblem', cost: 75, type: 'emblem', icon: '🌟' },
    { id: 'prestige_emblem_2', name: 'Phoenix', description: 'Prestige emblem', cost: 125, type: 'emblem', icon: '🦅' },
    { id: 'kill_effect_1', name: 'Golden Trail', description: 'Gold bullet trails', cost: 200, type: 'effect', effect: 'gold_trail' },
    { id: 'kill_effect_2', name: 'Fire Trail', description: 'Fiery bullet trails', cost: 250, type: 'effect', effect: 'fire_trail' },
    { id: 'loadout_slot_4', name: '4th Loadout Slot', description: 'Unlock 4th loadout for all classes', cost: 150, type: 'loadout' },
    { id: 'loadout_slot_5', name: '5th Loadout Slot', description: 'Unlock 5th loadout for all classes', cost: 250, type: 'loadout', requires: 'loadout_slot_4' }
];

// Helper functions
export function getClassMasteryChallenge(challengeId) {
    return CLASS_MASTERY_CHALLENGES[challengeId] ?? null;
}

export function getAllClassMasteryChallenges() {
    return Object.values(CLASS_MASTERY_CHALLENGES);
}

export function getPrestigeReward(prestigeLevel) {
    return PRESTIGE_REWARDS.find(p => p?.prestige === prestigeLevel) ?? null;
}

export function getPrestigeShopItem(itemId) {
    return PRESTIGE_SHOP.find(i => i?.id === itemId) ?? null;
}

export function calculateMasteryLevel(completedChallenges) {
    // Each challenge tier contributes to mastery
    let level = 0;
    (completedChallenges ?? []).forEach(c => {
        const challenge = CLASS_MASTERY_CHALLENGES[c];
        if (challenge?.reward?.tier) {
            level += challenge.reward.tier;
        }
    });
    return Math.min(10, Math.floor(level / 3));
}
