// Game Configuration
export const CONFIG = {
    // Screen
    WIDTH: 800,
    HEIGHT: 600,
    
    // Match
    ROUNDS_TO_WIN: 4,
    ROUND_TIME: 45,
    BUY_PHASE_TIME: 4,
    
    // Plant/Defuse
    PLANT_TIME: 1.6,
    DEFUSE_TIME: 1.8,
    BOMB_TIMER: 20,
    
    // Pressure Ring
    RING_START_TIME: 15,
    RING_SHRINK_RATE: 8,
    RING_DAMAGE: 2,
    
    // Combat
    PLAYER_HP: 100,
    PLAYER_SPEED: 180,
    SPRINT_MULTIPLIER: 1.5,
    SPRINT_DRAIN: 15,
    SPRINT_REGEN: 8,
    MAX_STAMINA: 100,
    
    // Smoke
    SMOKE_COOLDOWN: 12000,
    SMOKE_DURATION: 6000,
    SMOKE_RADIUS: 60,
    
    // Economy
    START_CREDITS: 500,
    WIN_CREDITS: 260,
    LOSE_CREDITS: 200,
    PLANT_BONUS: 80,
    
    // Trophies
    WIN_TROPHIES: 22,
    LOSE_TROPHIES: 18,
    OBJECTIVE_BONUS: 2,
    STREAK_BONUS: 2,
    STREAK_CAP: 4,
    LOSS_PROTECTION_AFTER: 3,
    PROTECTED_LOSS: 8,
    
    // Colors
    COLORS: {
        PRIMARY: 0x00d4ff,
        SECONDARY: 0xff6b35,
        SUCCESS: 0x00ff88,
        DANGER: 0xff3366,
        WARNING: 0xffcc00,
        BG_DARK: 0x1a1a2e,
        BG_MID: 0x16213e,
        BG_LIGHT: 0x0f3460,
        ATTACKER: 0xff6b35,
        DEFENDER: 0x00d4ff,
        WALL: 0x2d3436,
        COVER: 0x636e72,
        BOMB_SITE: 0xfdcb6e
    }
};
