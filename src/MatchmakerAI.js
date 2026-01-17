// MatchmakerAI - Enhanced difficulty scaling with distinct behaviors per bracket
import { SaveSystem } from './SaveSystem.js';

export const AI_DIFFICULTIES = {
    easy: {
        name: 'Easy',
        reactionTime: 800,
        accuracy: 0.35,
        aggression: 0.25,
        utilityChance: 0.15,
        moveSpeed: 0.65,
        // New enhanced properties
        strafeChance: 0.2,          // Chance to strafe during combat
        preFire: false,             // Pre-fires angles
        checksCorners: false,       // Systematically checks corners
        usesCovers: 0.3,            // Uses cover effectively
        flankChance: 0.1,           // Chance to attempt flanks
        fakeActions: false,         // Fake plant/defuse
        adaptToPlayer: false,       // Uses learning system
        headshotChance: 0.1,        // Chance for extra damage
        retreatSmartly: false,      // Retreats to cover vs random
        trophyVariance: 50          // Matchmaking variance
    },
    normal: {
        name: 'Normal',
        reactionTime: 500,
        accuracy: 0.55,
        aggression: 0.45,
        utilityChance: 0.35,
        moveSpeed: 0.85,
        strafeChance: 0.4,
        preFire: false,
        checksCorners: true,
        usesCovers: 0.5,
        flankChance: 0.25,
        fakeActions: false,
        adaptToPlayer: false,
        headshotChance: 0.15,
        retreatSmartly: true,
        trophyVariance: 75
    },
    hard: {
        name: 'Hard',
        reactionTime: 320,
        accuracy: 0.72,
        aggression: 0.6,
        utilityChance: 0.55,
        moveSpeed: 0.95,
        strafeChance: 0.65,
        preFire: true,
        checksCorners: true,
        usesCovers: 0.7,
        flankChance: 0.4,
        fakeActions: true,
        adaptToPlayer: true,
        headshotChance: 0.2,
        retreatSmartly: true,
        trophyVariance: 100
    },
    veryHard: {
        name: 'Very Hard',
        reactionTime: 220,
        accuracy: 0.82,
        aggression: 0.7,
        utilityChance: 0.7,
        moveSpeed: 1.02,
        strafeChance: 0.8,
        preFire: true,
        checksCorners: true,
        usesCovers: 0.85,
        flankChance: 0.55,
        fakeActions: true,
        adaptToPlayer: true,
        headshotChance: 0.25,
        retreatSmartly: true,
        trophyVariance: 120
    },
    insane: {
        name: 'Insane',
        reactionTime: 150,
        accuracy: 0.9,
        aggression: 0.75,
        utilityChance: 0.85,
        moveSpeed: 1.08,
        strafeChance: 0.9,
        preFire: true,
        checksCorners: true,
        usesCovers: 0.95,
        flankChance: 0.7,
        fakeActions: true,
        adaptToPlayer: true,
        headshotChance: 0.3,
        retreatSmartly: true,
        trophyVariance: 150
    },
    expert: {
        name: 'Expert',
        reactionTime: 100,
        accuracy: 0.95,
        aggression: 0.8,
        utilityChance: 0.9,
        moveSpeed: 1.12,
        strafeChance: 0.95,
        preFire: true,
        checksCorners: true,
        usesCovers: 1.0,
        flankChance: 0.8,
        fakeActions: true,
        adaptToPlayer: true,
        headshotChance: 0.35,
        retreatSmartly: true,
        trophyVariance: 200
    }
};

// Trophy brackets for ranked difficulty - Updated with new difficulty tiers
const TROPHY_BRACKETS = [
    // Recruit: 0-299 (Easy)
    { min: 0, max: 149, difficulty: 'easy', blend: 0 },
    { min: 150, max: 299, difficulty: 'easy', blend: 0.4 },
    
    // Rookie: 300-599 (Easy -> Normal)
    { min: 300, max: 449, difficulty: 'normal', blend: -0.3 },
    { min: 450, max: 599, difficulty: 'normal', blend: 0 },
    
    // Enforcer: 600-999 (Normal -> Hard)
    { min: 600, max: 749, difficulty: 'normal', blend: 0.4 },
    { min: 750, max: 999, difficulty: 'hard', blend: -0.2 },
    
    // Operator: 1000-1399 (Hard)
    { min: 1000, max: 1199, difficulty: 'hard', blend: 0 },
    { min: 1200, max: 1399, difficulty: 'hard', blend: 0.4 },
    
    // Specialist: 1400-1799 (Hard -> Very Hard)
    { min: 1400, max: 1599, difficulty: 'veryHard', blend: -0.2 },
    { min: 1600, max: 1799, difficulty: 'veryHard', blend: 0.2 },
    
    // Commander: 1800-2199 (Very Hard -> Insane)
    { min: 1800, max: 1999, difficulty: 'veryHard', blend: 0.5 },
    { min: 2000, max: 2199, difficulty: 'insane', blend: -0.2 },
    
    // Master: 2200-2599 (Insane)
    { min: 2200, max: 2399, difficulty: 'insane', blend: 0 },
    { min: 2400, max: 2599, difficulty: 'insane', blend: 0.3 },
    
    // Legend: 2600-2999 (Insane -> Expert)
    { min: 2600, max: 2799, difficulty: 'insane', blend: 0.6 },
    { min: 2800, max: 2999, difficulty: 'expert', blend: -0.2 },
    
    // Champion: 3000+ (Expert)
    { min: 3000, max: 99999, difficulty: 'expert', blend: 0 }
];

// Helper to blend difficulty values
function blendDifficulty(base, next, blend) {
    const result = { ...base };
    const absBlend = Math.abs(blend);
    
    // Numeric properties to blend
    const numericProps = [
        'reactionTime', 'accuracy', 'aggression', 'utilityChance', 'moveSpeed',
        'strafeChance', 'usesCovers', 'flankChance', 'headshotChance', 'trophyVariance'
    ];
    
    for (const prop of numericProps) {
        if (base[prop] !== undefined && next[prop] !== undefined) {
            result[prop] = base[prop] + (next[prop] - base[prop]) * absBlend;
        }
    }
    
    // Boolean properties - take from higher difficulty if blending up
    const boolProps = [
        'preFire', 'checksCorners', 'fakeActions', 'adaptToPlayer', 'retreatSmartly'
    ];
    
    for (const prop of boolProps) {
        if (blend > 0.5) {
            result[prop] = next[prop];
        }
    }
    
    result.name = `${base.name}+`;
    
    return result;
}

export const MatchmakerAI = {
    getDifficultyForTrophies(trophies) {
        let bracket = TROPHY_BRACKETS[0];
        
        for (const b of TROPHY_BRACKETS) {
            if (trophies >= b.min && trophies <= b.max) {
                bracket = b;
                break;
            }
        }
        
        const base = AI_DIFFICULTIES[bracket.difficulty];
        
        // Blend towards next/prev difficulty if specified
        if (bracket.blend && bracket.blend !== 0) {
            const difficulties = Object.keys(AI_DIFFICULTIES);
            const idx = difficulties.indexOf(bracket.difficulty);
            const nextIdx = bracket.blend > 0 ? 
                Math.min(idx + 1, difficulties.length - 1) : 
                Math.max(idx - 1, 0);
            const next = AI_DIFFICULTIES[difficulties[nextIdx]];
            
            return blendDifficulty(base, next, bracket.blend);
        }
        
        return { ...base };
    },
    
    getRankedDifficulty() {
        const trophies = SaveSystem.getTrophies();
        const difficulty = this.getDifficultyForTrophies(trophies);
        
        // Add small random variance for unpredictability
        difficulty.reactionTime += (Math.random() - 0.5) * 50;
        difficulty.accuracy += (Math.random() - 0.5) * 0.05;
        
        console.log(`[Matchmaker] Trophies: ${trophies}, Difficulty: ${difficulty.name}`);
        return difficulty;
    },
    
    getTrainingDifficulty(level) {
        return AI_DIFFICULTIES[level] ?? AI_DIFFICULTIES.normal;
    },
    
    // Get description of difficulty for UI
    getDifficultyDescription(trophies) {
        const diff = this.getDifficultyForTrophies(trophies);
        const descriptions = {
            'Easy': 'Slow reactions, low accuracy, predictable movement',
            'Easy+': 'Slightly improved reactions and accuracy',
            'Normal': 'Average reactions, fair aim, uses cover',
            'Normal+': 'Better reactions, starts checking corners',
            'Hard': 'Fast reactions, good aim, uses tactics',
            'Hard+': 'Very fast, learns from your patterns',
            'Very Hard': 'Excellent reactions, flanks and fakes',
            'Very Hard+': 'Near-perfect aim, adaptive strategies',
            'Insane': 'Lightning fast, predicts your movement',
            'Insane+': 'Almost unbeatable, counters everything',
            'Expert': 'The ultimate AI challenge',
            'Expert+': 'Peak performance, no weaknesses'
        };
        return descriptions[diff.name] ?? 'Unknown difficulty';
    },
    
    // Get bracket name for display
    getBracketName(trophies) {
        if (trophies >= 3000) return 'Champion';
        if (trophies >= 2600) return 'Legend';
        if (trophies >= 2200) return 'Master';
        if (trophies >= 1800) return 'Commander';
        if (trophies >= 1400) return 'Specialist';
        if (trophies >= 1000) return 'Operator';
        if (trophies >= 600) return 'Enforcer';
        if (trophies >= 300) return 'Rookie';
        return 'Recruit';
    }
};
