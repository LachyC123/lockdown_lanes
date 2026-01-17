// MatchmakerAI - Difficulty scaling based on trophies
import { SaveSystem } from './SaveSystem.js';

export const AI_DIFFICULTIES = {
    easy: {
        name: 'Easy',
        reactionTime: 800,
        accuracy: 0.4,
        aggression: 0.3,
        utilityChance: 0.2,
        moveSpeed: 0.7
    },
    normal: {
        name: 'Normal',
        reactionTime: 500,
        accuracy: 0.6,
        aggression: 0.5,
        utilityChance: 0.4,
        moveSpeed: 0.85
    },
    hard: {
        name: 'Hard',
        reactionTime: 300,
        accuracy: 0.75,
        aggression: 0.65,
        utilityChance: 0.6,
        moveSpeed: 1.0
    },
    insane: {
        name: 'Insane',
        reactionTime: 150,
        accuracy: 0.9,
        aggression: 0.8,
        utilityChance: 0.8,
        moveSpeed: 1.1
    }
};

// Trophy brackets for ranked difficulty
const TROPHY_BRACKETS = [
    { min: 0, max: 299, difficulty: 'easy' },
    { min: 300, max: 599, difficulty: 'easy', blend: 0.3 },
    { min: 600, max: 999, difficulty: 'normal' },
    { min: 1000, max: 1399, difficulty: 'normal', blend: 0.3 },
    { min: 1400, max: 1799, difficulty: 'hard' },
    { min: 1800, max: 2199, difficulty: 'hard', blend: 0.3 },
    { min: 2200, max: 2599, difficulty: 'hard', blend: 0.6 },
    { min: 2600, max: 2999, difficulty: 'insane', blend: -0.2 },
    { min: 3000, max: 99999, difficulty: 'insane' }
];

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
        
        // Blend towards next difficulty if specified
        if (bracket.blend) {
            const difficulties = Object.keys(AI_DIFFICULTIES);
            const idx = difficulties.indexOf(bracket.difficulty);
            const nextIdx = bracket.blend > 0 ? Math.min(idx + 1, difficulties.length - 1) : Math.max(idx - 1, 0);
            const next = AI_DIFFICULTIES[difficulties[nextIdx]];
            const blend = Math.abs(bracket.blend);
            
            return {
                name: `${base.name}+`,
                reactionTime: base.reactionTime + (next.reactionTime - base.reactionTime) * blend,
                accuracy: base.accuracy + (next.accuracy - base.accuracy) * blend,
                aggression: base.aggression + (next.aggression - base.aggression) * blend,
                utilityChance: base.utilityChance + (next.utilityChance - base.utilityChance) * blend,
                moveSpeed: base.moveSpeed + (next.moveSpeed - base.moveSpeed) * blend
            };
        }
        
        return { ...base };
    },
    
    getRankedDifficulty() {
        const trophies = SaveSystem.getTrophies();
        return this.getDifficultyForTrophies(trophies);
    },
    
    getTrainingDifficulty(level) {
        return AI_DIFFICULTIES[level] ?? AI_DIFFICULTIES.normal;
    }
};
