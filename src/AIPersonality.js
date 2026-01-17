// AIPersonality - Gives AI character with reactions, taunts, and emotions

// AI names by trophy bracket
const AI_NAMES = {
    recruit: ['Newbie Bot', 'Trainee', 'Rookie AI', 'Beginner'],
    rookie: ['Private Zero', 'Cadet', 'Junior Op', 'Greenhorn'],
    enforcer: ['Sergeant Aim', 'Tactical Bot', 'Enforcer', 'Hunter'],
    operator: ['Lt. Precision', 'Operator X', 'Elite AI', 'Veteran'],
    specialist: ['Major Threat', 'Specialist', 'Apex', 'Shadow'],
    legend: ['Commander', 'Legend Bot', 'Terminator', 'Omega']
};

// Reactions and callouts
const CALLOUTS = {
    // Combat reactions
    gotKill: [
        'Target eliminated.',
        'One down.',
        'Neutralized.',
        'Got you!',
        'Too easy.',
        'Nice try.',
        "You're done."
    ],
    gotKillBM: [ // Bad manner / taunting
        'Get rekt!',
        'Outplayed.',
        'Maybe try camping?',
        'Need more practice?',
        'GG EZ.',
        "That's tough."
    ],
    tookDamage: [
        'Contact!',
        'Taking fire!',
        'Ouch!',
        "That one hurt.",
        'Engaging.',
        'Found them!'
    ],
    lowHP: [
        'Low health...',
        'Need to retreat.',
        "I'm hit bad.",
        'Critical damage!',
        'Falling back.'
    ],
    
    // Objective reactions
    planting: [
        'Planting!',
        'Setting the bomb.',
        'Bomb going down.',
        'Cover me!',
        'Securing site.'
    ],
    defusing: [
        'Defusing!',
        'On the bomb.',
        "I've got it.",
        'Disarming now.',
        'Clearing the bomb.'
    ],
    bombPlanted: [
        'Bomb is live!',
        'Site secured.',
        'Now defend!',
        "It's planted!",
        'Tick tock...'
    ],
    bombDefused: [
        'Bomb defused!',
        'Site cleared.',
        'Crisis averted.',
        'Too slow!',
        'Nice try with that plant.'
    ],
    
    // Round reactions
    roundWin: [
        'Round secured.',
        'Good work.',
        'One step closer.',
        'Easy round.',
        'Keep it up.'
    ],
    roundLose: [
        "I'll get the next one.",
        'Adjusting strategy...',
        'Not bad.',
        'Close round.',
        'Minor setback.'
    ],
    
    // Emotional states
    confident: [
        "You can't win this.",
        'Victory is certain.',
        "I've got this.",
        'Too predictable.',
        'Reading you like a book.'
    ],
    frustrated: [
        'Lucky shot.',
        'How did that hit?',
        "Won't happen again.",
        'Recalibrating...',
        'Unexpected.'
    ],
    respectful: [
        'Good shot!',
        'Nice play.',
        'Well done.',
        'Impressive.',
        "You're skilled."
    ],
    
    // Tactical callouts
    seePlayer: [
        'Enemy spotted!',
        'Contact!',
        'Visual on target.',
        'There you are.',
        'Found you.'
    ],
    lostSight: [
        'Lost visual.',
        'Where did they go?',
        'Searching...',
        'Target lost.',
        'Reacquiring.'
    ],
    usingSmoke: [
        'Smoking!',
        'Throwing smoke.',
        'Cover deployed.',
        'Smoke out!',
        'Creating cover.'
    ]
};

export const AIPersonality = {
    // Current AI state
    name: 'AI',
    mood: 'neutral', // 'confident', 'frustrated', 'neutral', 'aggressive'
    consecutiveWins: 0,
    consecutiveLosses: 0,
    respectForPlayer: 0.5, // 0 = low respect, 1 = high respect
    
    // Get AI name based on trophy bracket
    getNameForBracket(trophies) {
        let bracket = 'recruit';
        
        if (trophies >= 3000) bracket = 'legend';
        else if (trophies >= 2200) bracket = 'specialist';
        else if (trophies >= 1400) bracket = 'operator';
        else if (trophies >= 600) bracket = 'enforcer';
        else if (trophies >= 300) bracket = 'rookie';
        
        const names = AI_NAMES[bracket] ?? AI_NAMES.recruit;
        this.name = names[Math.floor(Math.random() * names.length)];
        return this.name;
    },
    
    // Reset for new match
    reset(trophies) {
        this.getNameForBracket(trophies ?? 0);
        this.mood = 'neutral';
        this.consecutiveWins = 0;
        this.consecutiveLosses = 0;
        this.respectForPlayer = 0.5;
    },
    
    // Update mood based on events
    onRoundWin() {
        this.consecutiveWins++;
        this.consecutiveLosses = 0;
        
        if (this.consecutiveWins >= 3) {
            this.mood = 'confident';
        } else {
            this.mood = 'neutral';
        }
        
        // Slightly decrease respect on wins
        this.respectForPlayer = Math.max(0.1, this.respectForPlayer - 0.05);
    },
    
    onRoundLose() {
        this.consecutiveLosses++;
        this.consecutiveWins = 0;
        
        if (this.consecutiveLosses >= 2) {
            this.mood = 'frustrated';
        } else {
            this.mood = 'neutral';
        }
        
        // Increase respect when losing
        this.respectForPlayer = Math.min(1, this.respectForPlayer + 0.1);
    },
    
    onGotKilled() {
        this.respectForPlayer = Math.min(1, this.respectForPlayer + 0.15);
        if (this.consecutiveLosses > 0) {
            this.mood = 'frustrated';
        }
    },
    
    onGotKill() {
        this.respectForPlayer = Math.max(0.1, this.respectForPlayer - 0.05);
        if (this.consecutiveWins > 0) {
            this.mood = 'confident';
        }
    },
    
    // Get a random callout for an event
    getCallout(event, useBM = false) {
        let pool = CALLOUTS[event];
        
        // Use BM callouts when confident and got kill
        if (event === 'gotKill' && useBM && this.mood === 'confident') {
            pool = CALLOUTS.gotKillBM;
        }
        
        // Add mood-based reactions
        if (event === 'roundWin' && this.mood === 'confident') {
            pool = [...pool, ...CALLOUTS.confident];
        }
        
        if (event === 'roundLose' && this.respectForPlayer > 0.7) {
            pool = [...pool, ...CALLOUTS.respectful];
        }
        
        if (!pool || pool.length === 0) return null;
        
        return pool[Math.floor(Math.random() * pool.length)];
    },
    
    // Determine if AI should taunt based on mood
    shouldTaunt() {
        if (this.mood === 'confident') return Math.random() < 0.4;
        if (this.mood === 'frustrated') return Math.random() < 0.1;
        return Math.random() < 0.15;
    },
    
    // Get emotional modifier for AI behavior
    getBehaviorModifiers() {
        switch (this.mood) {
            case 'confident':
                return {
                    aggression: 1.2,   // More aggressive
                    riskTaking: 1.3,   // Takes more risks
                    patience: 0.7,     // Less patient
                    accuracy: 1.05     // Slightly better
                };
            case 'frustrated':
                return {
                    aggression: 1.1,   // Slightly more aggressive
                    riskTaking: 0.8,   // More cautious
                    patience: 0.9,     // Less patient
                    accuracy: 0.95     // Slightly worse
                };
            case 'neutral':
            default:
                return {
                    aggression: 1.0,
                    riskTaking: 1.0,
                    patience: 1.0,
                    accuracy: 1.0
                };
        }
    },
    
    // Get AI "thought" for dramatic moments
    getThought(situation) {
        const thoughts = {
            lowTime: [
                "Time's running out...",
                'Need to move fast!',
                'No time to waste.'
            ],
            lowHP: [
                'Taking a risk here.',
                'One hit and done...',
                'Play smart.'
            ],
            clutch: [
                "It's all on me.",
                '1v1, let\'s go.',
                'Focus time.'
            ],
            winning: [
                'Almost there.',
                'Stay focused.',
                "Don't get cocky."
            ],
            losing: [
                'Comeback time.',
                "It's not over yet.",
                'Turn this around.'
            ]
        };
        
        const pool = thoughts[situation] ?? [];
        if (pool.length === 0) return null;
        return pool[Math.floor(Math.random() * pool.length)];
    }
};
