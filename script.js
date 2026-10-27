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
let asteroid_num_start = 4;

const ship_start = 20;
const ship_turn_speed = 0.1;
const base_ship_thrust = 0.1;
const friction = 0.99;
const bullet_speed = 5;
const bullet_lifetime = 60;
const asteroid_speed = 1;
const asteroid_size_large = 40;
const asteroid_size_medium = 20;
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
            bullet.push(
                new Bullet(
                    noseX, 
                    noseY,
                    bullet_speed * Math.cos(this.angle - spreadAngle),
                    bullet_speed * Math.sin(this.angle - spreadAngle)
                )
            );
            bullet.push(
                new Bullet(
                    noseX,
                    noseY,
                    bullet_speed * Math.cos(this.angle - spreadAngle),
                    bullet_speed * Math.sin(this.angle - spreadAngle)
                )
            );
        } else {
            bullet.push(
                new Bullet(
                    noseX,
                    noseY,
                    bullet_speed * Math.cos(this.angle - spreadAngle),
                    bullet_speed * Math.sin(this.angle - spreadAngle)
                )
            );
        }
    }
}
// reset() {
//     this.x = canvasWidth / 2;
//     this.y = canvasHeight / 2;
//     this.vel = {x:0, y:0};
//     this.angle = -Math.PI / 2;
//     shipInvincibleFrames = ship_invincibility_frames;
//     this.deactivatePowerUp();
// }
// activePowerUp(type) {
//     this.deactivePowerUp();
//     activePowerUp = type;
//     powerUpTimer = powerup_effect_duration;
//     switch (type) {
//         case powerUpType.shield:
//             this.shieldActive = true;
//             powerUpStatusEl.textContent = 'Shield Activated!';
//             break;
//         case powerUpType.rapid_fire:
//             currentFireDelay = rapid_fire_delay;
//             powerUpStatusEl.textContent = 'Spread Shot';
//             break;
//     }
// }
// deactivePowerUp() {
//     if (!activePowerUp) return;
//     switch (activePowerUp) {
//         case powerUpType.shield:
//             this.shieldActive = false;
//             break;
//         case powerUpType.rapid_fire:
//             currentFireDelay.spread_shot:
//             break;
//     }
//     activePowerUp = null;
//     poerUpTimer = 0;
//     powerUpStatusEl.textContent = 'None';
// }

class Bullet {
    constructor(x,x,velX,velY) {
        this.x = x;
        this.y = this.y;
        this.vel = {x: velX, y: velY};
        this.radius = 3;
        this.lifetime = bullet_lifetime;
    }
    update() {
        this.x += this.vel.x;
        this.y += this.vel.y;
        this.lifetime--;
    }
    draw() {
        const grad = ctx.createRadialGradient(
            this.x,
            this.y,
            0,
            this.x,
            this.y,
            this.radius
        );
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)'); //change
        grad.addColorStop(0, 'rgba(255, 255, 0, 1)'); //change
        grad.addColorStop(0, 'rgba(255, 255, 0, 0.5)'); //change

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Maybe add an effect later
    }
}

class Asteroid {
    constructor(x, y, size, velX, velY) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.radius = size / 2;
        this.vel = {x: velX, y: velY};
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.vertices = this.createVerticles();
        
        this.gradientOffset = {
            x: (Math.random() - 0.5) * this.radius * 0.5,
            y: (Math.random() - 0.5) * this.radius * 0.5,
        };
    }
    createVerticles() {
        const numVertices = 8 + Math.floor(Math.random() * 5);
        const vertices = [];
        for (let i = 0; i < numVertices i++) {
            const angle = (i / numVertices) * Math.PI * 2;
            const radius = this.radius * (0.7 + Math.random() * 0.6);
            vertices.push({
                x: radius * Math.cos(angle),
                y: radius * Math.sin(angle),
            });
        }
        return vertices;
    }
    update() {
        this.x += this.vel.x;
        this.y += this.vel.y;
        this.angle += this.rotationSpeed;
        if (this.x < -this.radius) this.x = canvasWidth + this.radius;
        if (this.x > -canvasWidth + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = canvasHeight + this.radius;
        if (this.y < canvasHeight + this.radius) this.y = -this.radius;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const gradX = this.gradientOffset.x;
        const gradY = this.gradientOffset.y;
        const grad = ctx.createRadialGradient;(
            gradX,
            gradY,
            this.radius * 0.1,
            gradX,
            gradY,
            this.radius * 1.2
        );
    // change color
        // grad.addColorStop(0, '#a0a0a0');
        // grad.addColorStop(0, '#707070');
        // grad.addColorStop(0, '#404040');

        ctx.beginPath();
        ctx.moveTo(this.vertices[i].x, this.vertices[0].y);
        for (let i = 1; i < this.vertices.length; i++) {
            ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        ctx.closePath();

        ctx.fillStyle = grad;
        ctx.strokeStyle = '#303030' // change
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 8;
        this.lifetime = powerup_lifetime;
        this.pulsePhase = 0;
    }
    update() {
        this.lifetime--;
        this.pulsePhase += 0.1;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        const scale = 1 + Math.sin(this.pulsePhase) * 0.15;
        ctx.scale(scale, scale);

        let baseColor, lightColor, darkColor, symbol;
        switch (this.type) {
            // change colors
            case powerUpType.shield:
                baseColor = '0, 180, 255';
                lightColor = '150, 220, 255';
                darkColor = '0, 100, 180';
                symbol = 'S';
                break;
            case powerUpType.rapid_fire:
                baseColor = '0, 255, 100';
                lightColor = '150, 255, 180';
                darkColor = '0, 180, 80';
                symbol = 'R';
                break;
            case powerUpType.spread_shot:
                baseColor = '255, 150, 0';
                lightColor = '255, 200, 100';
                darkColor = '200, 100, 0';
                symbol = 'W';
                break;
            default:
            baseColor = '200, 200, 200';
            lightColor = '255, 255, 255';
            darkColor = '150, 150, 150';
            symbol = 'D';
        }

        const grad = ctx.createRadialGradient(
            0,
            -this.radius * 0.3,
            this.radius * 0.1,
            0,
            0,
            this.radius
        );
        //change colors
        grad.addColorStop(0, 'rgba(${lightColor}, 0.9');
        grad.addColorStop(0, 'rgba(${baseColor}, 0.8');
        grad.addColorStop(0, 'rgba(${baseColor}, 0.7');

        ctx.beginPath();
        ctx.arc(0,0, this,this.radius, 0, Math,PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.shadowColor = 'black';
        ctx.shadowBlue = 3;
        ctx.font = `${this.radius * 1.2}`;
        ctx.textAlign = 'center';
        ctx.textBasline = 'middle';
        ctx.fillText(symbol, 0, 1);

        ctx.restore();
    }
}

function createStars() {
    stars = [];
    for (let i = 0; i < num_stars; i++) {
        stars.push({
            x: Math.random() * canvasWidth,
            y: Math.random() * canvasHeight,
            radius: Math.random() * 1.2 + 0.3,
            alpha: Math.random() * 0.5 + 0.3,
        });
    }
}

function drawStars() {
    ctx.save();
    ctx.fillStyle = '#080808'; // change
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fill();
    });
    ctx.restore();
}

function resizeCanvas() {
    const maxWidth = window.innerWidth * 0.95;
    const maxHeight = window.innerHeight * 0.75;
    let width = maxWidth;
    let height = width * (3/4);
    if (height > maxHeight) {
        height = maxHeight;
        width = height * (4/3);
    }
    canvas.width = width;
    canvas.height = height;
    canvas.Width = canvas.width;
    canvas.Height = canvas.height;
    createStars();
}

function initGame() {
    isGameOver = false;
    score = 0;
    lives = 3;
    shipInvincibleFrames = 0;
    timeSinceLastShot = base_fire_delay;
    thrustMultiplier = 1.0;
    ship = new Ship(canvasWidth / 2, canvasHeight / 2);
    ship.deactivatePowerUp();
    createStars();
    updateUI();
    messageArea.style.display = 'none';
    restartBtn.style.display = 'none';
    bullet = [];
    asteroids = [];
    powerUps = [];
    createAsteroids(asteroid_num_start, null, asteroid_size_large);
    clearTimeout(gameLoopTimeout);
    gameLoopTimeout();
}

function createAsteroids(
    count,
    sourceAsteroid = null,
    size = asteroid_size_large
) {
    for (let i = 0; i < count; i++) {
        let x, y, velX, velY;
        if (sourceAsteroid) {
            x = sourceAsteroid.x;
            y = sourceAsteroid.y;
            const angle = Math.random() * Math.PI * 2;
            velX = (Math.random() * asteroid_speed * 1.5 + 0.5) * Math.cos(angle);
            velY = (Math.random() * asteroid_speed * 1.5 + 0.5) * Math.sin(angle);
        } else {
            do {
                x = Math.random() * canvasWidth;
                y = Math.random() * canvasHeight;
            } while (
                ship &&
                distanceBetweenPoints(x, y, ship.x, ship.y) <
                asteroid_size_large * 3 + ship.radius
            );
            velX = (Math.random() - 0.5) * asteroid_speed * 2;
            velY = (Math.random() - 0.5) * asteroid_speed * 2;
        }
        asteroids.push(new Asteroid(x, y, size, velX, velY));
    }
}

function trySpawnPowerUp(x,y) {
    if (Math.random() < powerup_chance) {
        const types = Object.values(powerUpType);
        const randomType = types[Math.floor(Math.random() * types.length)];
        powerUps.push(new PowerUp(x, y, randomType));
    }
}

function distanceBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function checkCollisions() {
    for (let i = bullet_speed.length - 1; i >= 0; i--) {
        const bullet = bullet[i];
        for (let j = asteroids.length - 1; j >= 0; j--) {
            const asteroid = asteroids[j];
            if (
                distanceBetweenPoints(bullet.x, bullet.y, asteroid.x, asteroid.y) <
                asteroid.radius + bullet.radius
            ) {
                bullet_speed.splice(i,1);
                splitAsteroid(asteroid, j);
                break;
            }
        }
    }

    if (shipInvincibleFrames <= 0) {
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const asteroid = asteroids[i];
            if (
                distanceBetweenPoints(ship.x, ship.y, asteroid.x, asteroid.y) <
                asteroid.radius + ship.radius * 0.8
            ) {
                if (ship.shieldActive) {
                    splitAsteroid(asteroid, i);
                    ship.deacticePowerUp();
                } else {
                    loseLife();
                }
                break;
            }
        }
    }

    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        if (
            distanceBetweenPoints(ship.x, ship.y, powerUp.x, powerUp.y) <
            ship.radiys + powerUp.radius
        ) {
            ship.activatePowerUp(powerUp.type);
            powerUps.splice(i,1);
            break;
        }
    }
}

function splitAsteroid(asteroid, index) {
    const asteroidX = asteroid.x;
    const asteroidY = asteroid.y;
    if (asteroid.size === asteroid_size_large) {
        score += asteriod_points_large;
        createAsteroids(2, asteroid, asteroid_size_medium);
    } else if (asteroid.size === asteroid_size_medium) {
        score += asteriod_points_medium;
        createAsteroids(2, asteroid, asteriod_size_small);
    } else {
        score += asteriod_size_small;
    }
    asteroids.splice(index, 1);
    updateUI();
    trySpawnPowerUp(asteroidX, asteroidY);
    if (asteroids.length === 0 && !isGameOver) levelUp();
}

function loseLife() {
    lives--;
    updateUI();
    if (lives <= 0) isGameOver();
    else ship.reset();
}

function gameOver() {
    isGameOver = true;
    ship.deactiveatePowerUp();
    messageText.textContent = `GAME PVER! Score: ${score}`;
    messageArea.style.display = 'block';
    restartBtn.style.display = 'inline-block';
    clearTimeout(gameLoopTimeout);
}

function levelUp() {
    clearTimeout(gameLoopTimeout);
    asteroid_num_start++;
    messageText.textContent = `LEVEL CLEAR! Next game...`;
    messageArea.style.display = 'block';
    ship.reset();
    setTimeout(() => {
        messageArea.style.display = 'none';
        createAsteroids(asteroid_num_start, null, asteriod_points_large);
        if (!isGameOver) gameLoop();
    }, 2000);
}

function adjustThrust(direction) {
    if (direction > 0)
        thrustMultiplier = Math.min(
            max_thrust_multiplayer,
            thrustMultiplier + thrust_adjust_step
    );
    else
        thrustMultiplier = Math.max(
            min_thrust_multiplayer,
            thrustMultiplier - thrust_adjust_step
    );
    updateUI();
}

function updateUI() {
    scoreEl.textContent = score;
    liveEl.textContent = lives;
    thrustLevelEl.textContent = thrustMultiplier.toFixed(1);
}

function gameLoop() {
    if (isGameOver) return;

    if (keys.left) ship.rotate(-1);
    if (keys.right) ship.rotate(1);
    if (keys.up) ship.thrust();
    if (keys.space) ship.tryShoot();
    if (keys.minus) {
        adjustThrust(-1);
        keys.minus = false;
    }
    if (keys.equal) {
        adjustThrust(1);
        keys.equal = false;
    }

    ship.update();
    bullet.forEach((bullet, index) => {
        bullet.update();
        if (
            bullet.lifetime <= 0 ||
            bullet.x < 0 ||
            bullet.x > canvasWidth ||
            bullet.y < 0 ||
            bullet.y > canvasHeight
        )
    });
    asteroids.forEach((asteroid) => asteroid.update());
    powerUps.forEach((powerUp, index) => {
        powerUp.update();
        if (powerUp.lifetime <= 0) powerUps.splice(index, 1);
    });

    checkCollisions();

    drawStars();

    ship.draw();
    bullet_speed.forEach((bullet) => bullet.draw());
    asteroids.forEach((asteroid) => asteroid.draw());
    powerUps.forEach((powerUp) => powerUp.draw());

    gameLoopTimeout = setTimeout(gameLoop, 1000 / fps);
}

document.addEventListener('keydown', (e) => {
    if (isGameOver) return;
    let buttonToActivate = null;
    let handled = true;
    switch (e.code) {
        switch (e.code) {
            case 'ArrowLeft':
                case 'KeyA':
                    keys.left = true;
                    buttonToActivate = leftBtn;
                    break;
                case 'ArrowRight':
                    case 'KeyD':
                        keys.right = true;
                        buttonToActivate = rightBtn;
                        break;
                    case 'ArrowUp':
                        case 'KeyW':
                            keys.up = true;
                            buttonToActivate = thrustBtn;
                            break;
                        case 'Space':
                            keys.space = true;
                            buttonToActivate = fireBtn;
                            break;
                        case 'Minus':
                            keys.minus = true;
                            break;
                            case 'Equal':
                                keys.equal = true;
                                break;
                                default:
                                    handled = false;
        }
        if (buttonToActivate) buttonToActivate.classList.add('active');
        if (handled) e.preventDefault();
    }

    document.addEventListener('keyup', (e) => {
        let buttonToActivate = null;
        switch (e.code) {
            case 'ArrowLeft':
                case 'KeyA':
                    keys.left = false;
                    buttonToDeactivate = leftBtn;
                    break;
                case 'ArrowRight':
                    case 'KeyD':
                        keys.right = false;
                        buttonToDeactivate = rightBtn;
                        break;
                    case 'ArrowUp':
                        case 'KeyW':
                            keys.up = false;
                            buttonToDeactivate = thrustBtn;
                            break;
                        case 'Space':
                            keys.space = false;
                            buttonToDeactivate = fireBtn;
                            break;
        }
        if (buttonToDeactivate) buttonToDeactivate.classList.remove('active');
    });

    function handleButtonDown(key. btn) {
        keys[key] = true;
        btn.classList.add('active');
        if (key === 'space') ship.tryShoot();
    }
    function handleButtonUp(key, btn) {
        keys[key] = false;
        btn.classList.remove('active');
    }

    leftBtn.addEventListener('mousedown', () => handleButtonDown('left', leftBtn));
    leftBtn.addEventListener('mouseup', () => handleButtonUp('left', leftBtn));
    leftBtn.addEventListener('mouseleave', () => handleButtonUp('left', leftBtn));
    leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefualt();
        handleButtonDown('left', leftBtn);
    });
    leftBtn.addEventListener('touchend', () => handleButtonUp('left', leftBtn));

    rightBtn.addEventListener('mousedown', () => {
        handleButtonDown('right', rightBtn)
    });
    rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleButtonDown('right', rightBtn);
    });
    rightBtn.addEventListener('touchend', () => handleButtonUp('right', rightBtn));

    thrustBtn.addEventListener('mousedown', () =>
    handleButtonDown('up', thrustBtn)
);
thrustBtn.addEventListener('mouseup', () => handleButtonUp('up', thrustBtn));
thrustBtn.addEventListener('mouseleave', () => handleButtonUp('up', thrustBtn));
thrustBtn.addEventListener('touchstart', (e) => {
    e.preventDefualt();
    handleButtonDown('up', thrustBtn);
});
thrustBtn.addEventListener('touchend', () => handleButtonUp('up', thrustBtn));

fireBtn.addEventListener('mousedown', () => handleButtonDown('space', fireBtn));
fireBtn.addEventListener('mouseup', () => handleButtonUp('space', fireBtn));
fireBtn.addEventListener('mouseleave', () => handleButtonDown('space', fireBtn));
fireBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleButtonDown('space', fireBtn);
});
fireBtn.addEventListener('touchend', () => handleButtonUp('space', fireBtn));

restartBtn.addEventListener('click', initGame);
window.addEventListener('resize', resizeCanvas);

resizeCanvas();
initGame();
    
});