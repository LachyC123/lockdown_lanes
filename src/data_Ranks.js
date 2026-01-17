// Rank definitions
export const RANKS = [
    { name: 'Recruit', minTrophies: 0, color: 0x95a5a6, icon: '🔰' },
    { name: 'Rookie', minTrophies: 300, color: 0x3498db, icon: '⭐' },
    { name: 'Enforcer', minTrophies: 600, color: 0x2ecc71, icon: '🛡️' },
    { name: 'Operator', minTrophies: 1000, color: 0x9b59b6, icon: '⚔️' },
    { name: 'Specialist', minTrophies: 1400, color: 0xe67e22, icon: '🎯' },
    { name: 'Veteran', minTrophies: 1800, color: 0xe74c3c, icon: '🏅' },
    { name: 'Elite', minTrophies: 2200, color: 0xf39c12, icon: '👑' },
    { name: 'Legend', minTrophies: 2600, color: 0x1abc9c, icon: '💎' },
    { name: 'Mythic', minTrophies: 3000, color: 0xff00ff, icon: '🔥' }
];

export function getRank(trophies) {
    let rank = RANKS[0];
    for (const r of RANKS) {
        if (trophies >= r.minTrophies) rank = r;
    }
    return rank;
}

export function getNextRank(trophies) {
    for (const r of RANKS) {
        if (trophies < r.minTrophies) return r;
    }
    return null;
}

export function getRankProgress(trophies) {
    const current = getRank(trophies);
    const next = getNextRank(trophies);
    if (!next) return 1;
    const range = next.minTrophies - current.minTrophies;
    const progress = trophies - current.minTrophies;
    return progress / range;
}
