// AILearningSystem - Tracks player patterns and adapts AI behavior

export const AILearningSystem = {
    // Player behavior profile (resets each match)
    playerProfile: {
        // Position tracking
        commonPositions: [],       // {x, y, count} - where player frequents
        deathPositions: [],        // where player died
        killPositions: [],         // where player got kills
        
        // Route tracking
        preferredLane: null,       // 'left', 'mid', 'right'
        laneUsage: { left: 0, mid: 0, right: 0 },
        
        // Playstyle analysis
        aggressionScore: 0.5,      // 0 = camper, 1 = rusher
        rushFrequency: 0,          // how often player rushes site
        campFrequency: 0,          // how often player camps
        peekFrequency: 0,          // how often player peeks
        
        // Timing patterns
        averagePlantTime: 0,       // when they typically plant
        averagePushTime: 0,        // when they typically push
        roundStartBehavior: 'unknown', // 'rush', 'slow', 'camp'
        
        // Combat patterns
        shotsFiredPerRound: [],
        averageAccuracy: 0,
        prefersLongRange: false,
        prefersCloseRange: false,
        strafeWhileShooting: false,
        
        // Utility usage
        smokesUsed: 0,
        smokePositions: [],        // where they throw smokes
        usesSmokesAggressively: false,
        usesSmokesDefensively: false,
        
        // Objective behavior
        plantsImmediately: false,  // rushes to plant
        plantsLate: false,         // waits to plant
        defusesRisky: false,       // defuses under fire
        
        // Counter-play tracking
        fellForFake: 0,            // times fell for fake plant/defuse
        peekedSameAngle: 0,        // times peeked same angle
        gotFlanked: 0,             // times got flanked
    },
    
    // Learning state
    learningEnabled: true,
    analysisInterval: 2,           // analyze every N rounds
    roundsAnalyzed: 0,
    lastAnalysis: null,
    
    // Counter-strategies generated from analysis
    counterStrategies: {
        preAimPositions: [],       // positions to pre-aim
        avoidPositions: [],        // dangerous positions
        flankRoute: null,          // route to flank player
        recommendedPlaystyle: 'balanced',
        aggressionLevel: 0.5,
        utilityTargets: [],        // where to throw utility
        timingAdjustment: 0,       // +/- seconds to adjust timing
    },
    
    // Reset for new match
    reset() {
        this.playerProfile = {
            commonPositions: [],
            deathPositions: [],
            killPositions: [],
            preferredLane: null,
            laneUsage: { left: 0, mid: 0, right: 0 },
            aggressionScore: 0.5,
            rushFrequency: 0,
            campFrequency: 0,
            peekFrequency: 0,
            averagePlantTime: 0,
            averagePushTime: 0,
            roundStartBehavior: 'unknown',
            shotsFiredPerRound: [],
            averageAccuracy: 0,
            prefersLongRange: false,
            prefersCloseRange: false,
            strafeWhileShooting: false,
            smokesUsed: 0,
            smokePositions: [],
            usesSmokesAggressively: false,
            usesSmokesDefensively: false,
            plantsImmediately: false,
            plantsLate: false,
            defusesRisky: false,
            fellForFake: 0,
            peekedSameAngle: 0,
            gotFlanked: 0,
        };
        
        this.counterStrategies = {
            preAimPositions: [],
            avoidPositions: [],
            flankRoute: null,
            recommendedPlaystyle: 'balanced',
            aggressionLevel: 0.5,
            utilityTargets: [],
            timingAdjustment: 0,
        };
        
        this.roundsAnalyzed = 0;
        this.lastAnalysis = null;
    },
    
    // Track player position (called frequently during match)
    trackPosition(x, y, worldWidth) {
        if (!this.learningEnabled) return;
        
        // Quantize position to grid
        const gridX = Math.floor(x / 50) * 50;
        const gridY = Math.floor(y / 50) * 50;
        
        // Find existing position or add new
        const existing = this.playerProfile.commonPositions.find(
            p => p.x === gridX && p.y === gridY
        );
        
        if (existing) {
            existing.count++;
        } else {
            this.playerProfile.commonPositions.push({ x: gridX, y: gridY, count: 1 });
        }
        
        // Track lane usage
        const centerX = worldWidth / 2;
        if (x < centerX - 100) {
            this.playerProfile.laneUsage.left++;
        } else if (x > centerX + 100) {
            this.playerProfile.laneUsage.right++;
        } else {
            this.playerProfile.laneUsage.mid++;
        }
    },
    
    // Track player death
    trackDeath(x, y) {
        if (!this.learningEnabled) return;
        this.playerProfile.deathPositions.push({ x, y, round: this.roundsAnalyzed });
    },
    
    // Track player kill
    trackKill(x, y) {
        if (!this.learningEnabled) return;
        this.playerProfile.killPositions.push({ x, y, round: this.roundsAnalyzed });
    },
    
    // Track combat behavior
    trackCombat(data) {
        if (!this.learningEnabled) return;
        
        const { distance, wasMoving, shotsFired, shotsHit } = data ?? {};
        
        // Track range preference
        if (distance !== undefined) {
            if (distance > 300) {
                this.playerProfile.prefersLongRange = true;
            } else if (distance < 150) {
                this.playerProfile.prefersCloseRange = true;
            }
        }
        
        // Track strafing
        if (wasMoving) {
            this.playerProfile.strafeWhileShooting = true;
        }
        
        // Track accuracy
        if (shotsFired !== undefined) {
            this.playerProfile.shotsFiredPerRound.push(shotsFired);
        }
        
        if (shotsHit !== undefined && shotsFired > 0) {
            const accuracy = shotsHit / shotsFired;
            const prevAccuracy = this.playerProfile.averageAccuracy;
            const count = this.playerProfile.shotsFiredPerRound.length;
            this.playerProfile.averageAccuracy = (prevAccuracy * (count - 1) + accuracy) / count;
        }
    },
    
    // Track smoke usage
    trackSmoke(x, y, wasAggressive) {
        if (!this.learningEnabled) return;
        
        this.playerProfile.smokesUsed++;
        this.playerProfile.smokePositions.push({ x, y });
        
        if (wasAggressive) {
            this.playerProfile.usesSmokesAggressively = true;
        } else {
            this.playerProfile.usesSmokesDefensively = true;
        }
    },
    
    // Track plant timing
    trackPlant(timeIntoRound) {
        if (!this.learningEnabled) return;
        
        if (timeIntoRound < 10) {
            this.playerProfile.plantsImmediately = true;
        } else if (timeIntoRound > 30) {
            this.playerProfile.plantsLate = true;
        }
        
        // Update average
        const prev = this.playerProfile.averagePlantTime;
        const count = this.roundsAnalyzed + 1;
        this.playerProfile.averagePlantTime = (prev * (count - 1) + timeIntoRound) / count;
    },
    
    // Track round start behavior
    trackRoundStart(distanceMoved, timeElapsed) {
        if (!this.learningEnabled) return;
        
        // Calculate movement speed at round start
        const movementRate = distanceMoved / Math.max(1, timeElapsed);
        
        if (movementRate > 150) {
            this.playerProfile.rushFrequency++;
        } else if (movementRate < 50) {
            this.playerProfile.campFrequency++;
        }
        
        // Determine behavior
        const total = this.playerProfile.rushFrequency + this.playerProfile.campFrequency + 1;
        const rushRatio = this.playerProfile.rushFrequency / total;
        
        if (rushRatio > 0.6) {
            this.playerProfile.roundStartBehavior = 'rush';
        } else if (rushRatio < 0.3) {
            this.playerProfile.roundStartBehavior = 'camp';
        } else {
            this.playerProfile.roundStartBehavior = 'slow';
        }
    },
    
    // Analyze patterns and generate counter-strategies
    analyzePatterns() {
        if (!this.learningEnabled) return;
        
        this.roundsAnalyzed++;
        
        // Only analyze every N rounds
        if (this.roundsAnalyzed % this.analysisInterval !== 0) return;
        
        const profile = this.playerProfile;
        const strategies = this.counterStrategies;
        
        // === POSITION ANALYSIS ===
        // Find most common positions for pre-aiming
        const sortedPositions = [...profile.commonPositions].sort((a, b) => b.count - a.count);
        strategies.preAimPositions = sortedPositions.slice(0, 5).map(p => ({ x: p.x, y: p.y }));
        
        // Mark death positions as dangerous (for AI to exploit)
        strategies.avoidPositions = profile.killPositions.slice(-3); // Last 3 kill positions = dangerous for AI
        
        // === LANE ANALYSIS ===
        const lanes = profile.laneUsage;
        const totalLaneUsage = lanes.left + lanes.mid + lanes.right + 1;
        
        if (lanes.left / totalLaneUsage > 0.5) {
            profile.preferredLane = 'left';
            strategies.flankRoute = 'right'; // Flank from opposite side
        } else if (lanes.right / totalLaneUsage > 0.5) {
            profile.preferredLane = 'right';
            strategies.flankRoute = 'left';
        } else {
            profile.preferredLane = 'mid';
            strategies.flankRoute = Math.random() > 0.5 ? 'left' : 'right';
        }
        
        // === AGGRESSION ANALYSIS ===
        const aggressionIndicators = [
            profile.rushFrequency > profile.campFrequency ? 0.7 : 0.3,
            profile.prefersCloseRange ? 0.8 : 0.4,
            profile.plantsImmediately ? 0.7 : 0.4,
            profile.usesSmokesAggressively ? 0.6 : 0.4
        ];
        
        profile.aggressionScore = aggressionIndicators.reduce((a, b) => a + b, 0) / aggressionIndicators.length;
        
        // Counter aggressive players with defensive play, and vice versa
        if (profile.aggressionScore > 0.65) {
            strategies.recommendedPlaystyle = 'defensive';
            strategies.aggressionLevel = 0.3; // Hold angles, wait for them
        } else if (profile.aggressionScore < 0.35) {
            strategies.recommendedPlaystyle = 'aggressive';
            strategies.aggressionLevel = 0.8; // Push hard, don't let them set up
        } else {
            strategies.recommendedPlaystyle = 'adaptive';
            strategies.aggressionLevel = 0.5;
        }
        
        // === TIMING ADJUSTMENT ===
        if (profile.plantsImmediately) {
            strategies.timingAdjustment = -5; // AI should push faster
        } else if (profile.plantsLate) {
            strategies.timingAdjustment = 5; // AI can take time
        }
        
        // === UTILITY TARGETS ===
        if (profile.smokePositions.length > 0) {
            // Target areas they like to smoke (wait them out or push through)
            strategies.utilityTargets = profile.smokePositions.slice(-3);
        }
        
        this.lastAnalysis = {
            round: this.roundsAnalyzed,
            playerAggression: profile.aggressionScore,
            preferredLane: profile.preferredLane,
            recommendedCounter: strategies.recommendedPlaystyle
        };
        
        console.log('[AILearning] Pattern analysis complete:', this.lastAnalysis);
    },
    
    // Get counter-strategy recommendations for AI
    getRecommendations() {
        return {
            ...this.counterStrategies,
            playerAggression: this.playerProfile.aggressionScore,
            playerLane: this.playerProfile.preferredLane,
            playerBehavior: this.playerProfile.roundStartBehavior,
            shouldPreAim: this.counterStrategies.preAimPositions.length > 0,
            shouldFlank: this.playerProfile.preferredLane !== 'mid',
            confidence: Math.min(1, this.roundsAnalyzed / 4) // Confidence grows with rounds
        };
    },
    
    // Get specific pre-aim position
    getPreAimPosition(aiX, aiY) {
        const positions = this.counterStrategies.preAimPositions;
        if (positions.length === 0) return null;
        
        // Return closest pre-aim position
        let closest = positions[0];
        let minDist = Infinity;
        
        for (const pos of positions) {
            const dist = Math.sqrt((pos.x - aiX) ** 2 + (pos.y - aiY) ** 2);
            if (dist < minDist && dist > 50) { // Not too close
                minDist = dist;
                closest = pos;
            }
        }
        
        return closest;
    },
    
    // Check if AI should use learned counter-play
    shouldUseCounterPlay() {
        const confidence = Math.min(1, this.roundsAnalyzed / 4);
        return Math.random() < confidence * 0.7; // Up to 70% chance based on confidence
    }
};
