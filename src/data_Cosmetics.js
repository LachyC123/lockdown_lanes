// Cosmetics data - Skins, Calling Cards, Emblems

// Skin rarity tiers
export const SKIN_TIERS = {
    COMMON: { id: 'common', name: 'Common', color: 0xaaaaaa, multiplier: 1 },
    RARE: { id: 'rare', name: 'Rare', color: 0x3498db, multiplier: 1.2 },
    EPIC: { id: 'epic', name: 'Epic', color: 0x9b59b6, multiplier: 1.5 },
    LEGENDARY: { id: 'legendary', name: 'Legendary', color: 0xf39c12, multiplier: 2 },
    MYTHIC: { id: 'mythic', name: 'Mythic', color: 0xe74c3c, multiplier: 3 }
};

// Weapon skins per weapon
export const WEAPON_SKINS = {
    pistol: [
        { id: 'pistol_default', name: 'Default', tier: 'common', color: 0xbdc3c7, unlock: { type: 'default' } },
        { id: 'pistol_tactical', name: 'Tactical Black', tier: 'common', color: 0x2c3e50, unlock: { type: 'kills', weapon: 'pistol', kills: 25 } },
        { id: 'pistol_desert', name: 'Desert Tan', tier: 'rare', color: 0xd4a574, unlock: { type: 'kills', weapon: 'pistol', kills: 50 } },
        { id: 'pistol_chrome', name: 'Chrome', tier: 'epic', color: 0xecf0f1, unlock: { type: 'kills', weapon: 'pistol', kills: 100 } },
        { id: 'pistol_gold', name: 'Gold Plated', tier: 'legendary', color: 0xffd700, unlock: { type: 'kills', weapon: 'pistol', kills: 250 } },
        { id: 'pistol_diamond', name: 'Diamond', tier: 'mythic', color: 0xb9f2ff, unlock: { type: 'kills', weapon: 'pistol', kills: 500 } }
    ],
    smg: [
        { id: 'smg_default', name: 'Default', tier: 'common', color: 0x3498db, unlock: { type: 'default' } },
        { id: 'smg_urban', name: 'Urban Camo', tier: 'common', color: 0x7f8c8d, unlock: { type: 'kills', weapon: 'smg', kills: 25 } },
        { id: 'smg_crimson', name: 'Crimson', tier: 'rare', color: 0xc0392b, unlock: { type: 'kills', weapon: 'smg', kills: 50 } },
        { id: 'smg_neon', name: 'Neon Blue', tier: 'epic', color: 0x00d4ff, unlock: { type: 'kills', weapon: 'smg', kills: 100 } },
        { id: 'smg_obsidian', name: 'Obsidian', tier: 'legendary', color: 0x1a1a2e, unlock: { type: 'kills', weapon: 'smg', kills: 250 } },
        { id: 'smg_plasma', name: 'Plasma', tier: 'mythic', color: 0xff00ff, unlock: { type: 'kills', weapon: 'smg', kills: 500 } }
    ],
    rifle: [
        { id: 'rifle_default', name: 'Default', tier: 'common', color: 0xe74c3c, unlock: { type: 'default' } },
        { id: 'rifle_woodland', name: 'Woodland', tier: 'common', color: 0x27ae60, unlock: { type: 'kills', weapon: 'rifle', kills: 25 } },
        { id: 'rifle_arctic', name: 'Arctic', tier: 'rare', color: 0xecf0f1, unlock: { type: 'kills', weapon: 'rifle', kills: 50 } },
        { id: 'rifle_tiger', name: 'Tiger Stripe', tier: 'epic', color: 0xf39c12, unlock: { type: 'kills', weapon: 'rifle', kills: 100 } },
        { id: 'rifle_dragon', name: 'Dragon Fire', tier: 'legendary', color: 0xff4500, unlock: { type: 'kills', weapon: 'rifle', kills: 250 } },
        { id: 'rifle_void', name: 'Void', tier: 'mythic', color: 0x4a0080, unlock: { type: 'kills', weapon: 'rifle', kills: 500 } }
    ],
    burst_rifle: [
        { id: 'burst_default', name: 'Default', tier: 'common', color: 0x9b59b6, unlock: { type: 'default' } },
        { id: 'burst_stealth', name: 'Stealth', tier: 'rare', color: 0x2c3e50, unlock: { type: 'kills', weapon: 'burst_rifle', kills: 50 } },
        { id: 'burst_royal', name: 'Royal Purple', tier: 'epic', color: 0x8e44ad, unlock: { type: 'kills', weapon: 'burst_rifle', kills: 100 } },
        { id: 'burst_gold', name: 'Gold', tier: 'legendary', color: 0xffd700, unlock: { type: 'kills', weapon: 'burst_rifle', kills: 250 } }
    ],
    heavy_pistol: [
        { id: 'heavy_default', name: 'Default', tier: 'common', color: 0xf39c12, unlock: { type: 'default' } },
        { id: 'heavy_silver', name: 'Silver', tier: 'rare', color: 0xc0c0c0, unlock: { type: 'kills', weapon: 'heavy_pistol', kills: 50 } },
        { id: 'heavy_engraved', name: 'Engraved', tier: 'epic', color: 0xd4af37, unlock: { type: 'kills', weapon: 'heavy_pistol', kills: 100 } },
        { id: 'heavy_executive', name: 'Executive', tier: 'legendary', color: 0x1a1a1a, unlock: { type: 'kills', weapon: 'heavy_pistol', kills: 250 } }
    ],
    tactical_smg: [
        { id: 'tactical_default', name: 'Default', tier: 'common', color: 0x1abc9c, unlock: { type: 'default' } },
        { id: 'tactical_night', name: 'Night Ops', tier: 'rare', color: 0x2c3e50, unlock: { type: 'kills', weapon: 'tactical_smg', kills: 50 } },
        { id: 'tactical_cyber', name: 'Cyber', tier: 'epic', color: 0x00ff88, unlock: { type: 'kills', weapon: 'tactical_smg', kills: 100 } },
        { id: 'tactical_ghost', name: 'Ghost', tier: 'legendary', color: 0xe0e0e0, unlock: { type: 'kills', weapon: 'tactical_smg', kills: 250 } }
    ],
    marksman_rifle: [
        { id: 'marksman_default', name: 'Default', tier: 'common', color: 0x8e44ad, unlock: { type: 'default' } },
        { id: 'marksman_sniper', name: 'Sniper', tier: 'rare', color: 0x27ae60, unlock: { type: 'kills', weapon: 'marksman_rifle', kills: 50 } },
        { id: 'marksman_carbon', name: 'Carbon Fiber', tier: 'epic', color: 0x34495e, unlock: { type: 'kills', weapon: 'marksman_rifle', kills: 100 } },
        { id: 'marksman_elite', name: 'Elite', tier: 'legendary', color: 0xffd700, unlock: { type: 'kills', weapon: 'marksman_rifle', kills: 250 } }
    ],
    compact_smg: [
        { id: 'compact_default', name: 'Default', tier: 'common', color: 0xe67e22, unlock: { type: 'default' } },
        { id: 'compact_street', name: 'Street', tier: 'rare', color: 0x7f8c8d, unlock: { type: 'kills', weapon: 'compact_smg', kills: 50 } },
        { id: 'compact_neon', name: 'Neon Pink', tier: 'epic', color: 0xff1493, unlock: { type: 'kills', weapon: 'compact_smg', kills: 100 } }
    ],
    shotgun: [
        { id: 'shotgun_default', name: 'Default', tier: 'common', color: 0xd35400, unlock: { type: 'default' } },
        { id: 'shotgun_classic', name: 'Classic Wood', tier: 'rare', color: 0x8b4513, unlock: { type: 'kills', weapon: 'shotgun', kills: 50 } },
        { id: 'shotgun_tactical', name: 'Tactical', tier: 'epic', color: 0x2c3e50, unlock: { type: 'kills', weapon: 'shotgun', kills: 100 } },
        { id: 'shotgun_doom', name: 'Doomslayer', tier: 'legendary', color: 0xff0000, unlock: { type: 'kills', weapon: 'shotgun', kills: 250 } }
    ],
    lmg: [
        { id: 'lmg_default', name: 'Default', tier: 'common', color: 0x2c3e50, unlock: { type: 'default' } },
        { id: 'lmg_military', name: 'Military Green', tier: 'rare', color: 0x556b2f, unlock: { type: 'kills', weapon: 'lmg', kills: 50 } },
        { id: 'lmg_devastator', name: 'Devastator', tier: 'epic', color: 0xe74c3c, unlock: { type: 'kills', weapon: 'lmg', kills: 100 } },
        { id: 'lmg_juggernaut', name: 'Juggernaut', tier: 'legendary', color: 0xffd700, unlock: { type: 'kills', weapon: 'lmg', kills: 250 } }
    ]
};

// Player skins
export const PLAYER_SKINS = [
    { id: 'default', name: 'Default', color: 0x3498db, unlock: { type: 'default' } },
    { id: 'forest', name: 'Forest Camo', color: 0x27ae60, unlock: { type: 'level', level: 5 } },
    { id: 'desert', name: 'Desert', color: 0xd4a574, unlock: { type: 'level', level: 10 } },
    { id: 'urban', name: 'Urban Gray', color: 0x7f8c8d, unlock: { type: 'level', level: 15 } },
    { id: 'crimson', name: 'Crimson', color: 0xc0392b, unlock: { type: 'level', level: 20 } },
    { id: 'midnight', name: 'Midnight', color: 0x1a1a2e, unlock: { type: 'level', level: 25 } },
    { id: 'arctic', name: 'Arctic', color: 0xecf0f1, unlock: { type: 'level', level: 30 } },
    { id: 'gold', name: 'Gold Elite', color: 0xffd700, unlock: { type: 'prestige', prestige: 1 } },
    { id: 'platinum', name: 'Platinum', color: 0xe5e4e2, unlock: { type: 'prestige', prestige: 2 } },
    { id: 'diamond', name: 'Diamond', color: 0xb9f2ff, unlock: { type: 'prestige', prestige: 3 } },
    { id: 'obsidian', name: 'Obsidian', color: 0x0a0a0a, unlock: { type: 'prestige', prestige: 5 } },
    { id: 'neon_blue', name: 'Neon Blue', color: 0x00d4ff, unlock: { type: 'achievement', achievement: 'veteran' } },
    { id: 'neon_pink', name: 'Neon Pink', color: 0xff1493, unlock: { type: 'achievement', achievement: 'champion' } },
    { id: 'flame', name: 'Flame', color: 0xff4500, unlock: { type: 'class_mastery', class: 'assault', level: 10 } },
    { id: 'shadow', name: 'Shadow', color: 0x2c2c2c, unlock: { type: 'class_mastery', class: 'rusher', level: 10 } }
];

// Calling cards
export const CALLING_CARDS = [
    { id: 'default', name: 'Recruit', gradient: ['#2c3e50', '#3498db'], unlock: { type: 'default' } },
    { id: 'warrior', name: 'Warrior', gradient: ['#e74c3c', '#c0392b'], unlock: { type: 'wins', wins: 10 } },
    { id: 'strategist', name: 'Strategist', gradient: ['#9b59b6', '#8e44ad'], unlock: { type: 'wins', wins: 25 } },
    { id: 'veteran', name: 'Veteran', gradient: ['#27ae60', '#2ecc71'], unlock: { type: 'wins', wins: 50 } },
    { id: 'elite', name: 'Elite Operative', gradient: ['#f39c12', '#e67e22'], unlock: { type: 'wins', wins: 100 } },
    { id: 'legend', name: 'Legend', gradient: ['#ffd700', '#ff8c00'], unlock: { type: 'wins', wins: 200 } },
    { id: 'bomb_squad', name: 'Bomb Squad', gradient: ['#c0392b', '#e74c3c'], unlock: { type: 'plants', plants: 50 } },
    { id: 'defuser', name: 'The Defuser', gradient: ['#3498db', '#2980b9'], unlock: { type: 'defuses', defuses: 50 } },
    { id: 'assassin', name: 'Assassin', gradient: ['#1a1a2e', '#4a0080'], unlock: { type: 'kills', kills: 500 } },
    { id: 'unstoppable', name: 'Unstoppable', gradient: ['#ff4500', '#ff0000'], unlock: { type: 'streak', streak: 10 } },
    { id: 'prestige_1', name: 'Prestige I', gradient: ['#ffd700', '#ffec8b'], unlock: { type: 'prestige', prestige: 1 } },
    { id: 'prestige_2', name: 'Prestige II', gradient: ['#e5e4e2', '#c0c0c0'], unlock: { type: 'prestige', prestige: 2 } },
    { id: 'prestige_3', name: 'Prestige III', gradient: ['#b9f2ff', '#87ceeb'], unlock: { type: 'prestige', prestige: 3 } },
    { id: 'master', name: 'Master', gradient: ['#8e44ad', '#9b59b6'], unlock: { type: 'prestige', prestige: 5 } },
    { id: 'assault_master', name: 'Assault Master', gradient: ['#e74c3c', '#ff6b6b'], unlock: { type: 'class_mastery', class: 'assault', level: 10 } },
    { id: 'rusher_master', name: 'Rusher Master', gradient: ['#f39c12', '#ffd93d'], unlock: { type: 'class_mastery', class: 'rusher', level: 10 } },
    { id: 'sniper_master', name: 'Sniper Master', gradient: ['#9b59b6', '#be90d4'], unlock: { type: 'class_mastery', class: 'sniper', level: 10 } },
    { id: 'tank_master', name: 'Tank Master', gradient: ['#27ae60', '#58d68d'], unlock: { type: 'class_mastery', class: 'tank', level: 10 } },
    { id: 'support_master', name: 'Support Master', gradient: ['#3498db', '#5dade2'], unlock: { type: 'class_mastery', class: 'support', level: 10 } }
];

// Emblems
export const EMBLEMS = [
    { id: 'default', name: 'Recruit', icon: '🎖️', unlock: { type: 'default' } },
    { id: 'skull', name: 'Skull', icon: '💀', unlock: { type: 'kills', kills: 100 } },
    { id: 'crosshair', name: 'Crosshair', icon: '🎯', unlock: { type: 'kills', kills: 250 } },
    { id: 'bomb', name: 'Bomb', icon: '💣', unlock: { type: 'plants', plants: 25 } },
    { id: 'shield', name: 'Shield', icon: '🛡️', unlock: { type: 'defuses', defuses: 25 } },
    { id: 'star', name: 'Star', icon: '⭐', unlock: { type: 'wins', wins: 25 } },
    { id: 'crown', name: 'Crown', icon: '👑', unlock: { type: 'wins', wins: 100 } },
    { id: 'lightning', name: 'Lightning', icon: '⚡', unlock: { type: 'streak', streak: 5 } },
    { id: 'fire', name: 'Fire', icon: '🔥', unlock: { type: 'streak', streak: 10 } },
    { id: 'diamond', name: 'Diamond', icon: '💎', unlock: { type: 'prestige', prestige: 1 } },
    { id: 'trophy', name: 'Trophy', icon: '🏆', unlock: { type: 'trophies', trophies: 2000 } },
    { id: 'medal', name: 'Medal', icon: '🎖️', unlock: { type: 'level', level: 30 } },
    { id: 'sword', name: 'Sword', icon: '⚔️', unlock: { type: 'class_mastery', class: 'assault', level: 5 } },
    { id: 'runner', name: 'Runner', icon: '🏃', unlock: { type: 'class_mastery', class: 'rusher', level: 5 } },
    { id: 'scope', name: 'Scope', icon: '🔭', unlock: { type: 'class_mastery', class: 'sniper', level: 5 } },
    { id: 'fortress', name: 'Fortress', icon: '🏰', unlock: { type: 'class_mastery', class: 'tank', level: 5 } },
    { id: 'heart', name: 'Heart', icon: '❤️', unlock: { type: 'class_mastery', class: 'support', level: 5 } }
];

// Helper functions
export function getWeaponSkins(weaponId) {
    return WEAPON_SKINS[weaponId] ?? [];
}

export function getPlayerSkin(skinId) {
    return PLAYER_SKINS.find(s => s?.id === skinId) ?? PLAYER_SKINS[0];
}

export function getCallingCard(cardId) {
    return CALLING_CARDS.find(c => c?.id === cardId) ?? CALLING_CARDS[0];
}

export function getEmblem(emblemId) {
    return EMBLEMS.find(e => e?.id === emblemId) ?? EMBLEMS[0];
}

export function getSkinTier(tierId) {
    return SKIN_TIERS[tierId?.toUpperCase?.()] ?? SKIN_TIERS.COMMON;
}
