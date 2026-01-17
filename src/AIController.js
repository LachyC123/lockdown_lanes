// AIController - Tactical AI behavior for 1v1
import { CONFIG } from './Config.js';

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
    }
    
    setRole(isAttacker) {
        this.isAttacker = isAttacker;
        this.state = 'idle';
        this.generatePath();
    }
    
    generatePath() {
        // Simple waypoint generation based on role
        const bombSite = this.scene.bombSite;
        const spawn = { x: this.ai?.x ?? 400, y: this.ai?.y ?? 300 };
        
        if (this.isAttacker) {
            // Path towards bomb site
            const lanes = this.scene.getLanes?.() ?? [];
            if (lanes.length > 0) {
                const lane = lanes[Math.floor(Math.random() * lanes.length)];
                this.waypoints = [...(lane ?? []), { x: bombSite?.x ?? 400, y: bombSite?.y ?? 150 }];
            } else {
                this.waypoints = [{ x: bombSite?.x ?? 400, y: bombSite?.y ?? 150 }];
            }
        } else {
            // Defender: position near bomb site
            const offset = (Math.random() - 0.5) * 100;
            this.waypoints = [{ x: (bombSite?.x ?? 400) + offset, y: (bombSite?.y ?? 150) + 50 }];
        }
        this.currentWaypoint = 0;
    }
    
    update(delta) {
        if (!this.ai?.active || !this.player?.active) return;
        if (this.scene?.roundEnded) return;
        
        this.thinkTimer += delta;
        this.combatShootTimer += delta;
        
        // Check if stuck
        if (this.thinkTimer > 500) {
            const dist = Phaser.Math.Distance.Between(this.ai.x, this.ai.y, this.lastPos?.x ?? 0, this.lastPos?.y ?? 0);
            if (dist < 5) {
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
        
        // Update last seen
        if (canSeePlayer) {
            this.lastSawPlayer = Date.now();
            this.lastPlayerPos = { x: this.player.x, y: this.player.y };
            
            // In combat - face and shoot immediately (not waiting for think timer)
            if (this.state === 'combat' || this.state === 'idle' || this.state === 'moving') {
                this.state = 'combat';
                this.doCombatActions(canSeePlayer);
            }
        }
        
        // Think periodically based on reaction time for state decisions
        if (this.thinkTimer < (this.difficulty?.reactionTime ?? 300)) return;
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
                this.handleCombat(canSeePlayer);
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
        }
    }
    
    doCombatActions(canSeePlayer) {
        if (!canSeePlayer || !this.player?.active || !this.ai?.active) return;
        
        // Face player
        const angle = Phaser.Math.Angle.Between(this.ai.x, this.ai.y, this.player.x, this.player.y);
        this.ai.rotation = angle;
        
        // Shoot based on weapon fire rate
        const weapon = this.ai?.weapon ?? { fireRate: 350 };
        if (this.combatShootTimer >= weapon.fireRate) {
            this.shoot();
            this.combatShootTimer = 0;
        }
    }
    
    handleIdle(canSeePlayer) {
        if (canSeePlayer) {
            this.state = 'combat';
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
            this.state = 'planting';
            this.wantsToPlant = true;
            return;
        }
        
        if (!this.isAttacker && this.scene?.bombPlanted && this.isNearBomb()) {
            this.state = 'defusing';
            this.wantsToDefuse = true;
            return;
        }
        
        // Move towards waypoint
        this.moveToWaypoint();
        
        // Consider using smoke
        if (this.smokeReady && Math.random() < (this.difficulty?.utilityChance ?? 0.5) * 0.1) {
            this.useSmoke();
        }
    }
    
    handleCombat(canSeePlayer) {
        if (!canSeePlayer) {
            // Lost sight, pursue or retreat
            const timeSinceSaw = Date.now() - this.lastSawPlayer;
            if (timeSinceSaw > 2000) {
                this.state = 'moving';
                return;
            }
            // Move towards last known position
            if (this.lastPlayerPos) {
                this.moveTowards(this.lastPlayerPos.x, this.lastPlayerPos.y);
            }
            return;
        }
        
        // Combat actions handled in doCombatActions for responsiveness
        
        // Strafe movement
        const aggression = this.difficulty?.aggression ?? 0.5;
        if (aggression > 0.5 && Math.random() < 0.3) {
            const angle = Phaser.Math.Angle.Between(this.ai.x, this.ai.y, this.player.x, this.player.y);
            const strafeAngle = angle + (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2);
            const speed = CONFIG.PLAYER_SPEED * (this.difficulty?.moveSpeed ?? 0.8) * 0.5;
            this.ai.body?.setVelocity?.(
                Math.cos(strafeAngle) * speed,
                Math.sin(strafeAngle) * speed
            );
        }
        
        // Consider smoke for escape
        if ((this.ai?.hp ?? 100) < 40 && this.smokeReady) {
            this.useSmoke();
            this.state = 'retreat';
        }
    }
    
    handlePlanting() {
        this.ai.body?.setVelocity?.(0, 0);
        this.wantsToPlant = true;
        this.isPlanting = true;
        
        // Callout when starting plant
        if (!this.announcedPlanting) {
            this.scene?.showAICallout?.('Planting the bomb!');
            this.announcedPlanting = true;
        }
        
        // Check if player visible, cancel plant
        if (this.checkLOS(this.ai, this.player)) {
            this.wantsToPlant = false;
            this.isPlanting = false;
            this.announcedPlanting = false;
            this.state = 'combat';
            this.scene?.showAICallout?.('Contact!');
        }
    }
    
    handleDefusing() {
        this.ai.body?.setVelocity?.(0, 0);
        this.wantsToDefuse = true;
        this.isDefusing = true;
        
        // Callout when starting defuse
        if (!this.announcedDefusing) {
            this.scene?.showAICallout?.('Defusing!');
            this.announcedDefusing = true;
        }
        
        // Check if player visible, might need to fight
        if (this.checkLOS(this.ai, this.player)) {
            // Decide: fight or keep defusing based on bomb timer
            const bombTimer = this.scene?.bombTimer ?? 20;
            if (bombTimer < 5 || Math.random() < 0.3) {
                // Keep defusing, risky!
                this.scene?.showAICallout?.('Sticking it!');
            } else {
                this.wantsToDefuse = false;
                this.isDefusing = false;
                this.announcedDefusing = false;
                this.state = 'combat';
                this.scene?.showAICallout?.('Enemy spotted!');
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
    
    moveToWaypoint() {
        if (!this.waypoints?.length) return;
        
        const wp = this.waypoints[this.currentWaypoint];
        if (!wp) return;
        
        const dist = Phaser.Math.Distance.Between(this.ai?.x ?? 0, this.ai?.y ?? 0, wp.x, wp.y);
        
        if (dist < 20) {
            this.currentWaypoint++;
            if (this.currentWaypoint >= this.waypoints.length) {
                this.currentWaypoint = this.waypoints.length - 1;
                // Reached destination, idle or patrol
                this.ai.body?.setVelocity?.(0, 0);
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
        // Random direction to get unstuck
        const angle = Math.random() * Math.PI * 2;
        const speed = CONFIG.PLAYER_SPEED;
        this.ai.body?.setVelocity?.(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        this.stuckTimer = 0;
        
        // Regenerate path
        this.generatePath();
    }
    
    checkLOS(from, to) {
        if (!from || !to || !this.scene?.walls) return false;
        
        // Distance check first
        const distance = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
        if (distance > 600) return false; // Max sight range
        
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
        
        // Fire event for scene to handle
        this.scene?.events?.emit?.('aiSmoke', this.ai);
        
        // Reset cooldown
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
}
