// AIController - Enhanced tactical AI with learning and personality
import { CONFIG } from './Config.js';
import { AILearningSystem } from './AILearningSystem.js';
import { AIPersonality } from './AIPersonality.js';

export class AIController {
    constructor(scene, ai, player, difficulty) {
        this.scene = scene;
        this.ai = ai;
        this.player = player;
        this.difficulty = difficulty;
        
        // State machine
        this.state = 'idle';
        this.targetPos = null;
        this.lastSawPlayer = 0;
        this.lastPlayerPos = null;
        this.lastShot = 0;
        this.thinkTimer = 0;
        this.stuckTimer = 0;
        this.lastPos = { x: 0, y: 0 };
        
        // Role
        this.isAttacker = false;
        
        // Smoke
        this.smokeReady = true;
        this.lastSmoke = 0;
        
        // Waypoints for navigation
        this.waypoints = [];
        this.currentWaypoint = 0;
        
        // Action flags
        this.wantsToPlant = false;
        this.wantsToDefuse = false;
        this.isPlanting = false;
        this.isDefusing = false;
        
        // Combat timing
        this.combatShootTimer = 0;
        
        // === ENHANCED AI PROPERTIES ===
        
        // Combat behavior
        this.strafeDirection = 1;           // 1 or -1
        this.strafeTimer = 0;
        this.lastStrafeChange = 0;
        this.coverPosition = null;          // Position to use as cover
        this.isPeeking = false;
        this.peekTimer = 0;
        this.burstCount = 0;                // Shots in current burst
        this.maxBurstSize = 5;              // Max shots before pause
        
        // Tactical behavior
        this.flankRoute = null;             // Route to flank player
        this.isWaitingInAmbush = false;
        this.ambushTimer = 0;
        this.preAimTarget = null;           // Position to pre-aim
        this.hasCheckedCorner = {};         // Corners already checked
        
        // Adaptive behavior
        this.learningEnabled = true;
        this.useCounterPlay = false;
        this.adaptationLevel = 0;           // Increases with rounds
        
        // Personality/Emotional state
        this.personalityMods = AIPersonality.getBehaviorModifiers();
        
        // Match state awareness
        this.roundNumber = 0;
        this.playerScore = 0;
        this.aiScore = 0;
        this.isWinning = false;
        this.isLosing = false;
        
        // Fake actions
        this.canFakePlant = Math.random() < (difficulty?.aggression ?? 0.5) * 0.4;
        this.canFakeDefuse = Math.random() < (difficulty?.aggression ?? 0.5) * 0.4;
        this.isFaking = false;
        this.fakeTimer = 0;
        
        // Aggression scaling
        this.dynamicAggression = difficulty?.aggression ?? 0.5;
    }
    
    setRole(isAttacker) {
        this.isAttacker = isAttacker;
        this.state = 'idle';
        this.generatePath();
        
        // Check if we should use learned counter-play
        if (this.learningEnabled && AILearningSystem.shouldUseCounterPlay()) {
            this.useCounterPlay = true;
            const recs = AILearningSystem.getRecommendations();
            this.dynamicAggression = recs.aggressionLevel ?? this.difficulty?.aggression ?? 0.5;
            this.flankRoute = recs.flankRoute;
            this.preAimTarget = AILearningSystem.getPreAimPosition(this.ai?.x ?? 0, this.ai?.y ?? 0);
        }
    }
    
    // Update match state for strategic decisions
    updateMatchState(roundNum, playerScore, aiScore) {
        this.roundNumber = roundNum;
        this.playerScore = playerScore;
        this.aiScore = aiScore;
        this.isWinning = aiScore > playerScore;
        this.isLosing = aiScore < playerScore;
        
        // Adjust aggression based on score
        if (this.isLosing && aiScore <= CONFIG.ROUNDS_TO_WIN - 2) {
            // Behind and close to losing - play more aggressive
            this.dynamicAggression = Math.min(1, (this.difficulty?.aggression ?? 0.5) * 1.3);
        } else if (this.isWinning && aiScore >= CONFIG.ROUNDS_TO_WIN - 1) {
            // About to win - play safer
            this.dynamicAggression = Math.max(0.2, (this.difficulty?.aggression ?? 0.5) * 0.7);
        }
        
        // Get personality modifiers
        this.personalityMods = AIPersonality.getBehaviorModifiers();
    }
    
    generatePath() {
        const bombSite = this.scene?.bombSite;
        const spawn = { x: this.ai?.x ?? 400, y: this.ai?.y ?? 300 };
        const worldWidth = this.scene?.worldWidth ?? 800;
        const centerX = worldWidth / 2;
        
        if (this.isAttacker) {
            // Use learned flank route if available
            if (this.useCounterPlay && this.flankRoute) {
                this.generateFlankPath(this.flankRoute, bombSite, centerX);
            } else {
                // Standard path with some randomness
                const lanes = this.scene?.getLanes?.() ?? [];
                if (lanes.length > 0) {
                    const lane = lanes[Math.floor(Math.random() * lanes.length)];
                    this.waypoints = [...(lane ?? []), { x: bombSite?.x ?? 400, y: bombSite?.y ?? 150 }];
                } else {
                    this.waypoints = [{ x: bombSite?.x ?? 400, y: bombSite?.y ?? 150 }];
                }
            }
        } else {
            // Defender: position near bomb site, maybe ambush
            const offset = (Math.random() - 0.5) * 100;
            const ambushChance = this.dynamicAggression > 0.6 ? 0.4 : 0.2;
            
            if (Math.random() < ambushChance) {
                // Set up ambush position
                this.isWaitingInAmbush = true;
                this.waypoints = [{ x: (bombSite?.x ?? 400) + offset * 2, y: (bombSite?.y ?? 150) + 80 }];
            } else {
                this.waypoints = [{ x: (bombSite?.x ?? 400) + offset, y: (bombSite?.y ?? 150) + 50 }];
            }
        }
        this.currentWaypoint = 0;
    }
    
    generateFlankPath(direction, bombSite, centerX) {
        const flankOffset = direction === 'left' ? -200 : 200;
        this.waypoints = [
            { x: centerX + flankOffset, y: 500 },
            { x: centerX + flankOffset, y: 350 },
            { x: bombSite?.x ?? 400, y: bombSite?.y ?? 150 }
        ];
    }
    
    update(delta) {
        if (!this.ai?.active || !this.player?.active) return;
        if (this.scene?.roundEnded) return;
        
        this.thinkTimer += delta;
        this.combatShootTimer += delta;
        this.strafeTimer += delta;
        this.peekTimer += delta;
        
        // Update ambush timer
        if (this.isWaitingInAmbush) {
            this.ambushTimer += delta;
        }
        
        // Check if stuck
        if (this.thinkTimer > 500) {
            const dist = Phaser.Math.Distance.Between(this.ai.x, this.ai.y, this.lastPos?.x ?? 0, this.lastPos?.y ?? 0);
            if (dist < 5 && this.state !== 'ambush' && !this.isWaitingInAmbush) {
                this.stuckTimer += 500;
                if (this.stuckTimer > 2000) {
                    this.unstuck();
                }
            } else {
                this.stuckTimer = 0;
            }
            this.lastPos = { x: this.ai.x, y: this.ai.y };
        }
        
        // Always check LOS and attempt shooting in combat (more responsive)
        const canSeePlayer = this.checkLOS(this.ai, this.player);
        
        // Track player position for learning
        if (this.learningEnabled && this.player?.active) {
            AILearningSystem.trackPosition(
                this.player.x, 
                this.player.y, 
                this.scene?.worldWidth ?? 800
            );
        }
        
        // Update last seen
        if (canSeePlayer) {
            this.lastSawPlayer = Date.now();
            this.lastPlayerPos = { x: this.player.x, y: this.player.y };
            this.isWaitingInAmbush = false; // End ambush when spotted
            
            // In combat - face and shoot immediately
            if (this.state === 'combat' || this.state === 'idle' || this.state === 'moving') {
                this.state = 'combat';
                this.doCombatActions(canSeePlayer, delta);
            }
        }
        
        // Pre-aim at learned positions
        if (!canSeePlayer && this.preAimTarget && this.useCounterPlay) {
            this.preAimAtPosition(this.preAimTarget);
        }
        
        // Calculate adjusted reaction time
        let reactionTime = this.difficulty?.reactionTime ?? 300;
        reactionTime /= (this.personalityMods?.accuracy ?? 1);
        
        // Think periodically based on reaction time for state decisions
        if (this.thinkTimer < reactionTime) return;
        this.thinkTimer = 0;
        
        // State machine
        switch (this.state) {
            case 'idle':
                this.handleIdle(canSeePlayer);
                break;
            case 'moving':
                this.handleMoving(canSeePlayer);
                break;
            case 'combat':
                this.handleCombat(canSeePlayer, delta);
                break;
            case 'planting':
                this.handlePlanting();
                break;
            case 'defusing':
                this.handleDefusing();
                break;
            case 'retreat':
                this.handleRetreat(canSeePlayer);
                break;
            case 'ambush':
                this.handleAmbush(canSeePlayer);
                break;
            case 'flanking':
                this.handleFlanking(canSeePlayer);
                break;
            case 'holding':
                this.handleHolding(canSeePlayer);
                break;
        }
    }
    
    preAimAtPosition(target) {
        if (!target || !this.ai) return;
        const angle = Phaser.Math.Angle.Between(this.ai.x, this.ai.y, target.x, target.y);
        this.ai.rotation = angle;
    }
    
    doCombatActions(canSeePlayer, delta) {
        if (!canSeePlayer || !this.player?.active || !this.ai?.active) return;
        
        // Face player with slight prediction
        const playerVel = this.player?.body?.velocity ?? { x: 0, y: 0 };
        const leadAmount = (this.difficulty?.accuracy ?? 0.6) * 0.15; // Higher accuracy = better prediction
        const targetX = this.player.x + (playerVel?.x ?? 0) * leadAmount;
        const targetY = this.player.y + (playerVel?.y ?? 0) * leadAmount;
        const angle = Phaser.Math.Angle.Between(this.ai.x, this.ai.y, targetX, targetY);
        this.ai.rotation = angle;
        
        // Shoot based on weapon fire rate and burst behavior
        const weapon = this.ai?.weapon ?? { fireRate: 350 };
        if (this.combatShootTimer >= weapon.fireRate) {
            // Burst fire behavior for harder difficulties
            if (this.burstCount < this.maxBurstSize || (this.difficulty?.accuracy ?? 0.6) < 0.5) {
                this.shoot();
                this.burstCount++;
                this.combatShootTimer = 0;
            } else {
                // Pause between bursts
                if (this.combatShootTimer > weapon.fireRate * 3) {
                    this.burstCount = 0;
                }
            }
        }
        
        // Strafe while shooting (based on difficulty)
        this.updateCombatMovement(delta);
    }
    
    updateCombatMovement(delta) {
        const aggression = this.dynamicAggression * (this.personalityMods?.aggression ?? 1);
        const moveSpeed = CONFIG.PLAYER_SPEED * (this.difficulty?.moveSpeed ?? 0.8);
        const distToPlayer = Phaser.Math.Distance.Between(
            this.ai?.x ?? 0, this.ai?.y ?? 0,
            this.player?.x ?? 0, this.player?.y ?? 0
        );
        
        // Change strafe direction periodically
        if (this.strafeTimer - this.lastStrafeChange > 500 + Math.random() * 500) {
            this.strafeDirection *= -1;
            this.lastStrafeChange = this.strafeTimer;
        }
        
        // Decide movement based on situation
        if ((this.ai?.hp ?? 100) < 30) {
            // Low HP - retreat to cover
            this.moveToNearestCover();
        } else if (distToPlayer < 100 && aggression < 0.6) {
            // Too close and not aggressive - back up
            this.moveAwayFromPlayer(moveSpeed * 0.7);
        } else if (distToPlayer > 350 && aggression > 0.5) {
            // Far away and aggressive - close in
            this.moveTowardsPlayer(moveSpeed * 0.5);
        } else {
            // Strafe
            const angleToPlayer = Phaser.Math.Angle.Between(
                this.ai?.x ?? 0, this.ai?.y ?? 0,
                this.player?.x ?? 0, this.player?.y ?? 0
            );
            const strafeAngle = angleToPlayer + (Math.PI / 2) * this.strafeDirection;
            const strafeSpeed = moveSpeed * 0.5;
            
            this.ai.body?.setVelocity?.(
                Math.cos(strafeAngle) * strafeSpeed,
                Math.sin(strafeAngle) * strafeSpeed
            );
        }
    }
    
    moveToNearestCover() {
        // Find nearest cover object
        const covers = this.scene?.cover?.getChildren?.() ?? [];
        if (covers.length === 0) return;
        
        let nearest = null;
        let minDist = Infinity;
        
        for (const cover of covers) {
            if (!cover?.active) continue;
            const dist = Phaser.Math.Distance.Between(
                this.ai?.x ?? 0, this.ai?.y ?? 0,
                cover?.x ?? 0, cover?.y ?? 0
            );
            // Prefer cover that's away from player
            const distToPlayer = Phaser.Math.Distance.Between(
                cover?.x ?? 0, cover?.y ?? 0,
                this.player?.x ?? 0, this.player?.y ?? 0
            );
            const score = dist - distToPlayer * 0.5;
            if (score < minDist) {
                minDist = score;
                nearest = cover;
            }
        }
        
        if (nearest) {
            this.coverPosition = { x: nearest.x, y: nearest.y };
            this.moveTowards(nearest.x, nearest.y);
        }
    }
    
    moveAwayFromPlayer(speed) {
        if (!this.player || !this.ai) return;
        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            this.ai.x, this.ai.y
        );
        this.ai.body?.setVelocity?.(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
    }
    
    moveTowardsPlayer(speed) {
        if (!this.player || !this.ai) return;
        const angle = Phaser.Math.Angle.Between(
            this.ai.x, this.ai.y,
            this.player.x, this.player.y
        );
        this.ai.body?.setVelocity?.(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
    }
    
    handleIdle(canSeePlayer) {
        if (canSeePlayer) {
            this.state = 'combat';
            return;
        }
        
        // Check for ambush opportunity (defenders)
        if (!this.isAttacker && this.isWaitingInAmbush && this.ambushTimer < 10000) {
            this.state = 'ambush';
            return;
        }
        
        // Start moving towards objective
        this.state = 'moving';
    }
    
    handleMoving(canSeePlayer) {
        if (canSeePlayer) {
            this.state = 'combat';
            this.ai.body?.setVelocity?.(0, 0);
            return;
        }
        
        // Check if should plant/defuse
        if (this.isAttacker && this.isNearBombSite() && !this.scene?.bombPlanted) {
            // Consider fake plant
            if (this.canFakePlant && Math.random() < 0.3 && !this.isFaking) {
                this.startFakePlant();
            } else {
                this.state = 'planting';
                this.wantsToPlant = true;
            }
            return;
        }
        
        if (!this.isAttacker && this.scene?.bombPlanted && this.isNearBomb()) {
            // Consider fake defuse
            if (this.canFakeDefuse && Math.random() < 0.2 && !this.isFaking) {
                this.startFakeDefuse();
            } else {
                this.state = 'defusing';
                this.wantsToDefuse = true;
            }
            return;
        }
        
        // Move towards waypoint
        this.moveToWaypoint();
        
        // Consider using smoke (based on difficulty and situation)
        const utilityChance = (this.difficulty?.utilityChance ?? 0.5) * 0.1;
        if (this.smokeReady && Math.random() < utilityChance) {
            // Smart smoke usage - smoke towards common player positions
            if (this.useCounterPlay) {
                const targets = AILearningSystem.counterStrategies.utilityTargets ?? [];
                if (targets.length > 0) {
                    const target = targets[Math.floor(Math.random() * targets.length)];
                    this.useSmokeAt(target.x, target.y);
                } else {
                    this.useSmoke();
                }
            } else {
                this.useSmoke();
            }
        }
    }
    
    handleCombat(canSeePlayer, delta) {
        if (!canSeePlayer) {
            // Lost sight, pursue or retreat
            const timeSinceSaw = Date.now() - this.lastSawPlayer;
            if (timeSinceSaw > 2000) {
                this.state = 'moving';
                return;
            }
            // Move towards last known position (or pre-aim spot if learned)
            if (this.lastPlayerPos) {
                this.moveTowards(this.lastPlayerPos.x, this.lastPlayerPos.y);
            }
            return;
        }
        
        // Combat actions handled in doCombatActions for responsiveness
        
        // Consider smoke for escape when low HP
        if ((this.ai?.hp ?? 100) < 40 && this.smokeReady) {
            this.useSmoke();
            this.state = 'retreat';
        }
        
        // Consider switching to flanking if losing engagement
        if ((this.ai?.hp ?? 100) < 60 && (this.player?.hp ?? 100) > 80) {
            if (Math.random() < 0.2 && this.smokeReady) {
                this.useSmoke();
                this.state = 'flanking';
            }
        }
    }
    
    handleAmbush(canSeePlayer) {
        this.ai.body?.setVelocity?.(0, 0);
        
        // Look towards likely player approach
        const bombSite = this.scene?.bombSite;
        const attackerSpawn = this.scene?.attackerSpawn;
        if (attackerSpawn) {
            const angle = Phaser.Math.Angle.Between(
                this.ai?.x ?? 0, this.ai?.y ?? 0,
                attackerSpawn.x, attackerSpawn.y
            );
            this.ai.rotation = angle;
        }
        
        if (canSeePlayer) {
            this.isWaitingInAmbush = false;
            this.state = 'combat';
            this.scene?.showAICallout?.('Surprise!');
            return;
        }
        
        // End ambush after timeout
        if (this.ambushTimer > 12000) {
            this.isWaitingInAmbush = false;
            this.state = 'moving';
        }
    }
    
    handleFlanking(canSeePlayer) {
        if (canSeePlayer) {
            this.state = 'combat';
            return;
        }
        
        // Generate new flank path if needed
        if (!this.flankRoute || this.waypoints.length === 0) {
            const direction = Math.random() > 0.5 ? 'left' : 'right';
            this.generateFlankPath(direction, this.scene?.bombSite, (this.scene?.worldWidth ?? 800) / 2);
            this.flankRoute = direction;
        }
        
        this.moveToWaypoint();
        
        // Once we complete the flank, go back to moving state
        if (this.currentWaypoint >= this.waypoints.length - 1) {
            this.state = 'moving';
            this.flankRoute = null;
        }
    }
    
    handleHolding(canSeePlayer) {
        // Hold angle and wait for player
        this.ai.body?.setVelocity?.(0, 0);
        
        // Pre-aim at common position if learned
        if (this.preAimTarget) {
            this.preAimAtPosition(this.preAimTarget);
        }
        
        if (canSeePlayer) {
            this.state = 'combat';
            return;
        }
        
        // Timeout and start moving
        // (holding time varies by aggression)
        const holdTime = 5000 / (this.dynamicAggression + 0.5);
        if (this.peekTimer > holdTime) {
            this.peekTimer = 0;
            this.state = 'moving';
        }
    }
    
    handlePlanting() {
        this.ai.body?.setVelocity?.(0, 0);
        this.wantsToPlant = true;
        this.isPlanting = true;
        
        if (!this.announcedPlanting) {
            this.scene?.showAICallout?.(AIPersonality.getCallout('planting') ?? 'Planting!');
            this.announcedPlanting = true;
        }
        
        // Check if player visible, cancel plant
        if (this.checkLOS(this.ai, this.player)) {
            this.wantsToPlant = false;
            this.isPlanting = false;
            this.announcedPlanting = false;
            this.state = 'combat';
            this.scene?.showAICallout?.(AIPersonality.getCallout('seePlayer') ?? 'Contact!');
        }
    }
    
    handleDefusing() {
        this.ai.body?.setVelocity?.(0, 0);
        this.wantsToDefuse = true;
        this.isDefusing = true;
        
        if (!this.announcedDefusing) {
            this.scene?.showAICallout?.(AIPersonality.getCallout('defusing') ?? 'Defusing!');
            this.announcedDefusing = true;
        }
        
        // Check if player visible, decide to fight or keep defusing
        if (this.checkLOS(this.ai, this.player)) {
            const bombTimer = this.scene?.bombTimer ?? 20;
            const riskThreshold = (this.personalityMods?.riskTaking ?? 1) * 5;
            
            if (bombTimer < riskThreshold || Math.random() < 0.3) {
                // Keep defusing, risky!
                this.scene?.showAICallout?.('Sticking it!');
            } else {
                this.wantsToDefuse = false;
                this.isDefusing = false;
                this.announcedDefusing = false;
                this.state = 'combat';
                this.scene?.showAICallout?.(AIPersonality.getCallout('seePlayer') ?? 'Enemy spotted!');
            }
        }
    }
    
    handleRetreat(canSeePlayer) {
        // Move away from player
        if (this.player) {
            const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.ai.x, this.ai.y);
            const speed = CONFIG.PLAYER_SPEED * (this.difficulty?.moveSpeed ?? 0.8);
            this.ai.body?.setVelocity?.(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
        }
        
        // Return to combat if recovered or lost sight
        if (!canSeePlayer || (this.ai?.hp ?? 0) > 50) {
            this.state = 'moving';
        }
    }
    
    startFakePlant() {
        this.isFaking = true;
        this.fakeTimer = 0;
        this.ai.body?.setVelocity?.(0, 0);
        this.scene?.showAICallout?.('Planting!');
        
        // Fake for a moment then stop
        this.scene?.time?.delayedCall?.(800 + Math.random() * 400, () => {
            this.isFaking = false;
            this.canFakePlant = false; // Don't fake again this match
            this.state = 'moving';
        });
    }
    
    startFakeDefuse() {
        this.isFaking = true;
        this.fakeTimer = 0;
        this.ai.body?.setVelocity?.(0, 0);
        this.scene?.showAICallout?.('Defusing!');
        
        // Fake for a moment then look for player
        this.scene?.time?.delayedCall?.(600 + Math.random() * 300, () => {
            this.isFaking = false;
            this.canFakeDefuse = false;
            this.state = 'combat';
        });
    }
    
    moveToWaypoint() {
        if (!this.waypoints?.length) return;
        
        const wp = this.waypoints[this.currentWaypoint];
        if (!wp) return;
        
        const dist = Phaser.Math.Distance.Between(this.ai?.x ?? 0, this.ai?.y ?? 0, wp.x, wp.y);
        
        if (dist < 20) {
            this.currentWaypoint++;
            if (this.currentWaypoint >= this.waypoints.length) {
                this.currentWaypoint = this.waypoints.length - 1;
                this.ai.body?.setVelocity?.(0, 0);
                
                // Consider holding angle when reaching destination
                if (!this.isAttacker && Math.random() < 0.4) {
                    this.state = 'holding';
                    this.peekTimer = 0;
                }
                return;
            }
        }
        
        this.moveTowards(wp.x, wp.y);
    }
    
    moveTowards(x, y) {
        if (!this.ai) return;
        const angle = Phaser.Math.Angle.Between(this.ai.x, this.ai.y, x, y);
        const speed = CONFIG.PLAYER_SPEED * (this.difficulty?.moveSpeed ?? 0.8);
        
        this.ai.rotation = angle;
        this.ai.body?.setVelocity?.(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
    }
    
    unstuck() {
        const angle = Math.random() * Math.PI * 2;
        const speed = CONFIG.PLAYER_SPEED;
        this.ai.body?.setVelocity?.(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        this.stuckTimer = 0;
        this.generatePath();
    }
    
    checkLOS(from, to) {
        if (!from || !to || !this.scene?.walls) return false;
        
        // Distance check first
        const distance = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
        if (distance > 600) return false;
        
        // Ray cast from AI to target
        const ray = new Phaser.Geom.Line(from.x, from.y, to.x, to.y);
        
        // Check walls
        for (const wall of this.scene.walls?.getChildren?.() ?? []) {
            if (!wall?.active) continue;
            const rect = new Phaser.Geom.Rectangle(
                wall.x - (wall.displayWidth ?? 0) / 2,
                wall.y - (wall.displayHeight ?? 0) / 2,
                wall.displayWidth ?? 0,
                wall.displayHeight ?? 0
            );
            if (Phaser.Geom.Intersects.LineToRectangle(ray, rect)) {
                return false;
            }
        }
        
        // Check smokes
        for (const smoke of this.scene?.smokes ?? []) {
            if (!smoke?.active) continue;
            const circle = new Phaser.Geom.Circle(smoke.x, smoke.y, CONFIG.SMOKE_RADIUS);
            if (Phaser.Geom.Intersects.LineToCircle(ray, circle)) {
                return false;
            }
        }
        
        return true;
    }
    
    shoot() {
        const now = Date.now();
        const weapon = this.ai?.weapon ?? { fireRate: 350 };
        
        if (now - this.lastShot < weapon.fireRate) return;
        this.lastShot = now;
        
        // Fire event for scene to handle
        this.scene?.events?.emit?.('aiShoot', this.ai);
    }
    
    useSmoke() {
        if (!this.smokeReady) return;
        
        this.smokeReady = false;
        this.lastSmoke = Date.now();
        
        this.scene?.events?.emit?.('aiSmoke', this.ai);
        this.scene?.showAICallout?.(AIPersonality.getCallout('usingSmoke') ?? 'Smoke out!');
        
        this.scene?.time?.delayedCall?.(this.ai?.smokeCooldown ?? CONFIG.SMOKE_COOLDOWN, () => {
            this.smokeReady = true;
        });
    }
    
    useSmokeAt(x, y) {
        if (!this.smokeReady) return;
        
        this.smokeReady = false;
        this.lastSmoke = Date.now();
        
        this.scene?.events?.emit?.('aiSmokeAt', { x, y });
        this.scene?.showAICallout?.(AIPersonality.getCallout('usingSmoke') ?? 'Smoke out!');
        
        this.scene?.time?.delayedCall?.(this.ai?.smokeCooldown ?? CONFIG.SMOKE_COOLDOWN, () => {
            this.smokeReady = true;
        });
    }
    
    isNearBombSite() {
        const site = this.scene?.bombSite;
        if (!site || !this.ai) return false;
        return Phaser.Math.Distance.Between(this.ai.x, this.ai.y, site.x, site.y) < 60;
    }
    
    isNearBomb() {
        const bomb = this.scene?.plantedBomb;
        if (!bomb || !this.ai) return false;
        return Phaser.Math.Distance.Between(this.ai.x, this.ai.y, bomb.x, bomb.y) < 40;
    }
    
    getWantsToPlant() {
        return this.wantsToPlant && this.isNearBombSite();
    }
    
    getWantsToDefuse() {
        return this.wantsToDefuse && this.isNearBomb();
    }
    
    cancelAction() {
        this.wantsToPlant = false;
        this.wantsToDefuse = false;
        this.isPlanting = false;
        this.isDefusing = false;
        this.state = 'combat';
    }
    
    // Called when AI dies - for learning system
    onDeath() {
        if (this.learningEnabled && this.ai) {
            AILearningSystem.trackKill(this.ai.x, this.ai.y);
        }
        AIPersonality.onGotKilled();
    }
    
    // Called when AI kills player - for learning system
    onKill() {
        if (this.learningEnabled && this.player) {
            AILearningSystem.trackDeath(this.player.x, this.player.y);
        }
        AIPersonality.onGotKill();
    }
    
    // Called at end of round - for analysis
    onRoundEnd(aiWon) {
        if (aiWon) {
            AIPersonality.onRoundWin();
        } else {
            AIPersonality.onRoundLose();
        }
        AILearningSystem.analyzePatterns();
    }
}
