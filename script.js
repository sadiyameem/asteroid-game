const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContent('2d');
const scoreEl = document.getElementById('score');
const liveEl = document.getElementById('lives');
const messageArea = document.getElementById('message');
const messageText = document.getElementById('messageText');
const restartBtn = document.getElementById('restartBtn');
const powerUpStatusEl = document.getElementById('powerUpStatus');
const thrustLevelEl = document.getElementById('thrustLevel');

const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightbtn');
const thrustBtn = document.getElementById('thrustBtn');
const fireBtn = document.getElementById('fireBtn');

let canvasWidth, canvasHeight;
let ateroid_num_start = 4;

const ship_start = 20;
const ship_turn_speed = 0.1;
const base_ship_thrust = 0.1;
const friction = 0.99;
const bullet_speed = 5;
const bullet_lifetime = 60;
const asteroid_speed = 1;
const asteroid_size_large = 40;
const asteriod_size_medium = 20;
const asteriod_size_small = 10;
const asteriod_points_large = 20;
const asteriod_points_medium = 50;
const asteriod_points_small = 100;
const ship_invincibility_frames = 180;
const fps = 60;
const powerup_chance = 0.15;
const powerup_lifetime = 480;
const powerup_effect_duration = 600;
const base_fire_delay = 15;
const rapid_fire_delay = 5;
const min_thrust_multiplayer = 0.5;
const max_thrust_multiplayer = 2.0;
const thrust_adjust_step = 0.1;
const num_stars = 150;

const powerUpType = {
    shield: 'shield',
    rapid_fire: 'rapid-fire',
    spread_shot: 'spread_shot',
};

let ship;
let bullet = [];
let asteroids = [];
let powerUps = [];
let stars = [];
let score = 0;
let lives = 3;
let keys = {
    left: false,
    right: false,
    up: false,
    space: false,
    minus: false,
    equal: false,
};

let isGameOver = false;
let shipInvincibleFrames = 0;
let gameLoopTimeout;
let timeSinceLastShot = 0;
let currentFireDelay = base_fire_delay;
let activePowerUp = null;
let powerUpTimer = 0;
let thrustMultiplier = 1.0;

class Ship {
    constructor(x,y) {
        this.x = x;
        this.y = y;
        this.angle = -Math.PI / 2;
        this.vel = {x:0, y:0};
        this.radius = ship_size / 2;
        this.isThrusting = false;
        this.shieldActive = false;
        this.boosterFlameLength = 0;
    }
    rotate(direction) {
        this.angle += ship_turn_speed * direction;
    }
    thrust() {
        const currentThrust = base_ship_thrust * thrustMultiplier;
        this.vel.x += currentThrust * Math.cos(this.angle);
        this.vel.y += currentThrust * Math.sin(this.angle);
        this.isThrusting = true;
    }
    update() {
        this.vel.x *= friction;
        this.vel.y *= friction;
        this.x += this.vel.x;
        this.y += this.vel.y;

        if (this.x < -this.radius) this.x = canvasWidth + this.radius;
        if (this.x > canvasWidth + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = canvasHeight + this.radius;
        if (this.y > canvasHeight + this.radius) this.y = -this.radius;

        if (this.isThrusting)
            this.boosterFlameLengthn = Math.min(
        this.boosterFlameLength + 2,
        ship_size * 1.0
    );
    else this.boosterFlameLength = Math.max(this.boosterFlameLength - 1, 0);
    this.isThrusting = false;

    if (shipInvincibleFrames > 0) shipInvincibleFrames--;
    if (powerUpTimer > 0) {
        powerUpTimer--;
        if (powerUpTimer <= 0) this.deactivatePowerUp();
    }
    if (timeSinceLastShot < currentFireDelay) timeSinceLastShot++;
    }
    draw() {
        if (shipInvincibleFrames > 0 && Math.floor(Date.now() / 100) % 2 === 0)
            return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (this.boosterFlameLength > 0) {
            const flicker = Math.random() * 0.2 + 0.9;
            const flameLen = this.boosterFlameLength * flicker;

            const gradOuter = ctx.createRadialGradient(
                -ship_size / 2,
                0,
                flameLen * 0.1,
                -ship_size / 2,
                0,
                flameLen * 0.7
            );
            gradOuter.addColorStop(0, 'rgba(225, 150, 0, 0.8'); //change
            gradOuter.addColorStop(1, 'rgba(225, 0, 0, 0.3'); //change

            const gradInner = ctx.createRadialGradient(
                -ship_size / 2,
                0,
                flameLen * 0.05,
                -ship_size / 2,
                0,
                flameLen * 0.4
            );
            gradInner.addColorStop(0, 'rgba(255, 255, 200, 1'); // change
            gradInner.addColorStop(1, 'rgba(255, 200, 0, 0.7'); // change

            ctx.beginPath();
            ctx.moveTo(-ship_size / 2.5, ship_size / 4);
            ctx.lineTo(-ship_size / 2 - flameLen, 0);
            ctx.lineTo(-ship_size / 2.5, -ship_size / 4);
            ctx.closePath();
            ctx.fillStyle = gradOuter;
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(-ship_size / 2.5, ship_size / 6);
            ctx.lineTo(-ship_size / 2 - flameLen * 0.8, 0);
            ctx.lineTo(-ship_size / 2.5, -ship_size / 6);
            ctx.closePath();
            ctx.fillStyle = gradOuter;
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(-ship_size / 2.5, ship_size / 6);
            ctx.lineTo(-ship_size / 2 - flameLen * 0.8, 0);
            ctx.lineTo(-ship_size / 2.5, -ship_size / 6);
            ctx.closePath();
            ctx.fillStyle = gradInner;
            ctx.fill();
        }

        const shipGrad = ctx.createLinearGradient(
            -ship_size / 2,
            -ship_size / 3,
            ship_size / 2,
            ship_size / 3
        );
        shipGrad.addColorStop(0, 'lightblue'); //change
        shipGrad.addColorStop(1, 'darkblue'); //change

        ctx.beginPath();
        ctx.moveTo(ship_size / 2, 0);
        ctx.lineTo(-ship_size / 2, -ship_size / 3);
        ctx.lineTo(-ship_size / 2, -ship_size / 3);
        ctx.closePath();
        ctx.fillStyle = shipGrad;
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        if (this.shieldActive) {
            const shieldGrad = ctx.createRadialGradient(
                this.x,
                this.y,
                this,radius,
                this.x,
                this.y,
                this.radius + 5
            );
            shieldGrad.addColorStop(0, 'rgba(0, 180, 255, 0.1');
            shieldGrad.addColorStop(0, 'rgba(0, 220, 255, 0.7');
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.strokeStyle = shieldGrad;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
    tryShoot() {
        if (timeSinceLastShot >= currentFireDelay) {
            this.tryShoot();
            timeSinceLastShot = 0;
        }
    }
    shoot() {
        const moseX = this.x + (ship_size / 2) * Math.cos(this.angle);
        const noseY = this.y + (ship_size / 2) * Math.sin(this.angle);
        if (activePowerUp === powerUpType.spread_shot) {
            const spreadAngle = 0.25;
            bullet.push(
                new Bullet(
                    noseX,
                    noseY,
                    bullet_speed + Math.cos(this.angle),
                    bullet_speed * Math.sin(this.angle)
                )
            );
            bullet_speed.push(
                new Bullet(
                    noseX, noseY,
                    bullet_speed * Math.cos(this.angle - spreadAngle),
                    bullet_speed * Math.sin(this.angle - spreadAngle)
                )
            );
        }
    }
}