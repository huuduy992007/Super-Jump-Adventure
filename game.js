// ==================== CẤU HÌNH GAME ====================
const CONFIG = {
    GRAVITY: 0.8,
    PLAYER_JUMP: -18,
    PLAYER_SPEED: 6,
    COIN_VALUE: 10,
    DIAMOND_VALUE: 50,
    HEALTH: 3,
    LEVEL_COUNT: 10
};

// ==================== KHỞI TẠO ====================
let canvas, ctx;
let gameActive = false;
let currentLevel = 1;
let coins = 0;
let health = CONFIG.HEALTH;
let currentCharacter = 'leo';
let unlockedLevels = [1];
let unlockedCharacters = ['leo'];
let gameTime = 0;
let timerInterval = null;
let graphicsQuality = 'medium';
let particles = [];
let backgrounds = [];
let parallaxLayers = [];

// ==================== ĐỊNH NGHĨA LỚP ====================
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.velocityY = 0;
        this.velocityX = 0;
        this.jumps = 1;
        this.maxJumps = currentCharacter === 'knight' ? 2 : 1;
        this.jumpPower = currentCharacter === 'ninja' ? -22 : -18;
        this.isGrounded = false;
        this.color = this.getColor();
        this.animationFrame = 0;
        this.facingRight = true;
        this.invincible = false;
        this.invincibleTimer = 0;
    }

    getColor() {
        const colors = {
            'leo': { main: '#37b24d', accent: '#2b8a3e' },
            'ninja': { main: '#333333', accent: '#222222' },
            'knight': { main: '#4dabf7', accent: '#339af0' },
            'wizard': { main: '#9c36b5', accent: '#862e9c' },
            'robot': { main: '#ff922b', accent: '#f76707' },
            'fairy': { main: '#ff6b6b', accent: '#fa5252' },
            'dragon': { main: '#e03131', accent: '#c92a2a' }
        };
        return colors[currentCharacter] || colors.leo;
    }

    jump() {
        if (this.jumps > 0) {
            this.velocityY = this.jumpPower;
            this.jumps--;
            playSound('jumpSound');
            
            // Particle effect
            for (let i = 0; i < 10; i++) {
                particles.push(new Particle(
                    this.x + this.width / 2,
                    this.y + this.height,
                    Math.random() * 4 - 2,
                    Math.random() * -5 - 2,
                    this.color.main
                ));
            }
            return true;
        }
        return false;
    }

    update(platforms, deltaTime) {
        // Update invincibility
        if (this.invincible) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        // Animation
        this.animationFrame += deltaTime * 10;

        // Apply gravity
        this.velocityY += CONFIG.GRAVITY;
        this.y += this.velocityY;
        this.x += this.velocityX;

        // Ground collision
        if (this.y + this.height > canvas.height) {
            this.y = canvas.height - this.height;
            this.velocityY = 0;
            this.jumps = this.maxJumps;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }

        // Platform collision
        this.checkPlatformCollision(platforms);

        // Boundary check
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));

        // Update facing direction
        if (this.velocityX > 0) this.facingRight = true;
        if (this.velocityX < 0) this.facingRight = false;
    }

    checkPlatformCollision(platforms) {
        for (let platform of platforms) {
            if (this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y + this.height > platform.y &&
                this.y < platform.y + platform.height &&
                this.velocityY > 0) {
                
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.jumps = this.maxJumps;
                this.isGrounded = true;
                
                // Landing particles
                if (Math.abs(this.velocityY) > 5) {
                    for (let i = 0; i < 15; i++) {
                        particles.push(new Particle(
                            this.x + Math.random() * this.width,
                            this.y + this.height,
                            Math.random() * 6 - 3,
                            Math.random() * -3 - 2,
                            '#ffffff'
                        ));
                    }
                }
            }
        }
    }

    takeDamage() {
        if (!this.invincible) {
            health--;
            this.invincible = true;
            this.invincibleTimer = 2000; // 2 seconds
            playSound('hurtSound');
            updateUI();
            
            // Damage particles
            for (let i = 0; i < 20; i++) {
                particles.push(new Particle(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    Math.random() * 8 - 4,
                    Math.random() * 8 - 4,
                    '#ff4757'
                ));
            }
            
            return true;
        }
        return false;
    }

    draw() {
        ctx.save();
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x + 5, this.y + 5, this.width, this.height);

        // Draw player with invincibility effect
        if (this.invincible && Math.floor(this.invincibleTimer / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Body
        ctx.fillStyle = this.color.main;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Details
        ctx.fillStyle = this.color.accent;
        
        // Head
        ctx.fillRect(this.x + 10, this.y + 5, this.width - 20, 15);
        
        // Eyes
        ctx.fillStyle = 'white';
        const eyeOffset = this.facingRight ? 10 : -10;
        ctx.fillRect(this.x + this.width/2 + eyeOffset - 8, this.y + 10, 6, 6);
        ctx.fillRect(this.x + this.width/2 + eyeOffset + 2, this.y + 10, 6, 6);
        
        // Animation: bounce effect
        const bounce = Math.sin(this.animationFrame) * 2;
        ctx.fillStyle = this.color.accent;
        ctx.fillRect(this.x, this.y + this.height - 10, this.width, 5 + bounce);

        ctx.restore();

        // Draw character name
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            currentCharacter === 'leo' ? 'Leo' :
            currentCharacter === 'ninja' ? 'Ninja Kai' :
            currentCharacter === 'knight' ? 'Kỵ sĩ Luna' :
            currentCharacter === 'wizard' ? 'Phù thủy Zibo' :
            currentCharacter === 'robot' ? 'Robot Bolt' :
            currentCharacter === 'fairy' ? 'Tiên Lily' : 'Rồng Flame',
            this.x + this.width/2,
            this.y - 10
        );
    }
}

class Platform {
    constructor(x, y, width, height, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.color = this.getColor();
        this.animation = Math.random() * Math.PI * 2;
    }

    getColor() {
        const colors = {
            'normal': { top: '#8B4513', side: '#A0522D' },
            'ice': { top: '#74b9ff', side: '#0984e3' },
            'lava': { top: '#ff7675', side: '#d63031' },
            'grass': { top: '#00b894', side: '#00a085' }
        };
        return colors[this.type] || colors.normal;
    }

    update(deltaTime) {
        this.animation += deltaTime;
    }

    draw() {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x + 5, this.y + 5, this.width, this.height);

        // Top surface
        const colors = this.color;
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, colors.top);
        gradient.addColorStop(1, colors.side);
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Texture based on type
        ctx.fillStyle = this.getTextureColor();
        for(let i = 0; i < this.width; i += 20) {
            if (this.type === 'ice') {
                // Ice sparkles
                ctx.beginPath();
                ctx.arc(this.x + i + 10, this.y + 8, 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Normal texture
                ctx.fillRect(this.x + i, this.y, 10, 5);
            }
        }

        // Decorative edge
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    getTextureColor() {
        const colors = {
            'normal': '#CD853F',
            'ice': '#ffffff',
            'lava': '#ffd700',
            'grass': '#55efc4'
        };
        return colors[this.type] || colors.normal;
    }
}

class Coin {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.type = type;
        this.collected = false;
        this.animation = Math.random() * Math.PI * 2;
        this.spinSpeed = 0.05;
        this.floatOffset = Math.random() * Math.PI * 2;
    }

    update(deltaTime) {
        this.animation += deltaTime * this.spinSpeed;
    }

    draw() {
        if (this.collected) return;
        
        ctx.save();
        ctx.translate(this.x, this.y + Math.sin(this.animation + this.floatOffset) * 8);
        ctx.rotate(this.animation);
        
        // Glow effect
        if (graphicsQuality === 'high') {
            ctx.shadowColor = this.type === 'diamond' ? '#4dabf7' : '#ffd700';
            ctx.shadowBlur = 20;
        }

        // Coin body
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        if (this.type === 'diamond') {
            gradient.addColorStop(0, '#4dabf7');
            gradient.addColorStop(0.7, '#1864ab');
            gradient.addColorStop(1, '#0c4080');
        } else {
            gradient.addColorStop(0, '#ffd700');
            gradient.addColorStop(0.7, '#ff9500');
            gradient.addColorStop(1, '#ff6b00');
        }
        
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Detail
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        if (this.type === 'diamond') {
            // Diamond shape
            ctx.moveTo(0, -this.radius * 0.6);
            ctx.lineTo(this.radius * 0.6, 0);
            ctx.lineTo(0, this.radius * 0.6);
            ctx.lineTo(-this.radius * 0.6, 0);
            ctx.closePath();
        } else {
            // Coin hole
            ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2);
        }
        ctx.fill();

        ctx.restore();
    }
}

class Spike {
    constructor(x, y, width = 30, height = 30) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.animation = Math.random() * Math.PI * 2;
    }

    update(deltaTime) {
        this.animation += deltaTime;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Glow effect
        if (graphicsQuality === 'high') {
            ctx.shadowColor = '#ff4757';
            ctx.shadowBlur = 15;
        }

        // Spike body
        const gradient = ctx.createLinearGradient(0, -this.height/2, 0, this.height/2);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(1, '#ff4757');
        
        ctx.beginPath();
        ctx.moveTo(0, -this.height/2);
        ctx.lineTo(this.width/2, this.height/2);
        ctx.lineTo(-this.width/2, this.height/2);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Animation: pulse effect
        const scale = 1 + Math.sin(this.animation) * 0.1;
        ctx.scale(scale, scale);

        ctx.restore();
    }
}

class Enemy {
    constructor(x, y, width, height, type = 'basic') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.velocityX = type === 'flying' ? 2 : 0;
        this.velocityY = 0;
        this.animation = Math.random() * Math.PI * 2;
        this.direction = Math.random() > 0.5 ? 1 : -1;
    }

    update(deltaTime) {
        this.animation += deltaTime;
        
        if (this.type === 'flying') {
            this.x += this.velocityX * this.direction;
            this.y += Math.sin(this.animation) * 0.5;
            
            // Boundary check
            if (this.x < 0 || this.x + this.width > canvas.width) {
                this.direction *= -1;
            }
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Glow effect
        if (graphicsQuality === 'high') {
            ctx.shadowColor = '#e84118';
            ctx.shadowBlur = 10;
        }

        // Enemy body
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.min(this.width, this.height)/2);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(1, '#e84118');
        
        if (this.type === 'flying') {
            // Bat shape
            ctx.beginPath();
            ctx.moveTo(0, -this.height/2);
            ctx.bezierCurveTo(this.width/2, -this.height/4, this.width/2, this.height/4, 0, this.height/2);
            ctx.bezierCurveTo(-this.width/2, this.height/4, -this.width/2, -this.height/4, 0, -this.height/2);
            ctx.closePath();
        } else {
            // Basic enemy
            ctx.beginPath();
            ctx.arc(0, 0, Math.min(this.width, this.height)/2, 0, Math.PI * 2);
        }
        
        ctx.fillStyle = gradient;
        ctx.fill();

        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-this.width/6, -this.height/6, this.width/10, 0, Math.PI * 2);
        ctx.arc(this.width/6, -this.height/6, this.width/10, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#2d3436';
        ctx.beginPath();
        ctx.arc(-this.width/6, -this.height/6, this.width/20, 0, Math.PI * 2);
        ctx.arc(this.width/6, -this.height/6, this.width/20, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class Flag {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 80;
        this.animation = 0;
        this.waving = false;
    }

    update(deltaTime) {
        this.animation += deltaTime;
        if (this.waving) {
            this.animation += deltaTime * 3;
        }
    }

    draw() {
        // Pole
        const poleGradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        poleGradient.addColorStop(0, '#bdc3c7');
        poleGradient.addColorStop(1, '#7f8c8d');
        
        ctx.fillStyle = poleGradient;
        ctx.fillRect(this.x, this.y, 8, this.height);
        
        // Flag
        ctx.save();
        ctx.translate(this.x + 4, this.y + 10);
        
        // Wave animation
        const wave = Math.sin(this.animation) * 5;
        ctx.rotate(wave * Math.PI / 180);
        
        const flagGradient = ctx.createLinearGradient(0, 0, 30, 0);
        flagGradient.addColorStop(0, '#ff6b6b');
        flagGradient.addColorStop(0.5, '#ffffff');
        flagGradient.addColorStop(1, '#4dabf7');
        
        ctx.fillStyle = flagGradient;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(25, 10);
        ctx.lineTo(0, 20);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();

        // Pole top
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(this.x + 4, this.y, 6, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Particle {
    constructor(x, y, velocityX, velocityY, color) {
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.color = color;
        this.size = Math.random() * 4 + 2;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
    }

    update(deltaTime) {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += 0.1; // Gravity
        this.life -= this.decay;
        return this.life > 0;
    }

    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class BackgroundLayer {
    constructor(image, speed, y) {
        this.image = image;
        this.speed = speed;
        this.y = y;
        this.x1 = 0;
        this.x2 = canvas.width;
    }

    update(deltaTime, playerVelocityX) {
        const move = playerVelocityX * this.speed * deltaTime;
        this.x1 -= move;
        this.x2 -= move;

        if (this.x1 <= -canvas.width) {
            this.x1 = canvas.width;
        }
        if (this.x2 <= -canvas.width) {
            this.x2 = canvas.width;
        }
    }

    draw() {
        ctx.drawImage(this.image, this.x1, this.y, canvas.width, canvas.height);
        ctx.drawImage(this.image, this.x2, this.y, canvas.width, canvas.height);
    }
}

// ==================== DỮ LIỆU 10 MÀN CHƠI ====================
const LEVELS = {
    1: {
        name: "Đồng Cỏ Xanh",
        platforms: [
            new Platform(0, 450, 200, 30, 'grass'),
            new Platform(250, 380, 150, 30),
            new Platform(450, 320, 150, 30),
            new Platform(650, 400, 150, 30),
            new Platform(300, 250, 100, 20, 'grass')
        ],
        coins: [
            new Coin(100, 410),
            new Coin(300, 340),
            new Coin(320, 340),
            new Coin(340, 340),
            new Coin(500, 280),
            new Coin(700, 360),
            new Coin(350, 210, 'diamond')
        ],
        spikes: [
            new Spike(200, 420),
            new Spike(400, 290)
        ],
        enemies: [
            new Enemy(550, 290, 40, 40)
        ],
        flag: new Flag(780, 370),
        startX: 50,
        startY: 400,
        theme: 'grass'
    },
    2: {
        name: "Hang Động Tối",
        platforms: [
            new Platform(0, 500, 150, 40),
            new Platform(200, 440, 120, 30),
            new Platform(350, 380, 120, 30),
            new Platform(500, 320, 120, 30),
            new Platform(650, 400, 150, 30),
            new Platform(400, 250, 100, 20)
        ],
        coins: [
            new Coin(75, 460),
            new Coin(260, 400),
            new Coin(410, 340),
            new Coin(560, 280),
            new Coin(720, 360),
            new Coin(450, 210, 'diamond')
        ],
        spikes: [
            new Spike(150, 470),
            new Spike(320, 350),
            new Spike(600, 290)
        ],
        enemies: [
            new Enemy(300, 330, 40, 40, 'flying'),
            new Enemy(600, 350, 40, 40)
        ],
        flag: new Flag(780, 370),
        startX: 50,
        startY: 440,
        theme: 'cave'
    },
    3: {
        name: "Rừng Gió Cuồn",
        platforms: [
            new Platform(0, 500, 120, 30),
            new Platform(150, 450, 120, 30),
            new Platform(300, 400, 120, 30),
            new Platform(450, 350, 120, 30),
            new Platform(600, 300, 120, 30),
            new Platform(750, 400, 120, 30),
            new Platform(200, 280, 100, 20, 'grass')
        ],
        coins: [
            new Coin(60, 470),
            new Coin(210, 420),
            new Coin(360, 370),
            new Coin(510, 320),
            new Coin(660, 270),
            new Coin(810, 370),
            new Coin(250, 240, 'diamond')
        ],
        spikes: [
            new Spike(120, 470),
            new Spike(270, 370),
            new Spike(420, 320),
            new Spike(570, 270),
            new Spike(720, 370)
        ],
        enemies: [
            new Enemy(400, 320, 40, 40),
            new Enemy(650, 270, 40, 40, 'flying')
        ],
        flag: new Flag(830, 370),
        startX: 50,
        startY: 440,
        theme: 'forest'
    },
    4: {
        name: "Lâu Đài Băng",
        platforms: [
            new Platform(0, 480, 180, 30, 'ice'),
            new Platform(220, 420, 140, 30, 'ice'),
            new Platform(400, 360, 140, 30, 'ice'),
            new Platform(580, 300, 140, 30, 'ice'),
            new Platform(750, 420, 150, 30, 'ice'),
            new Platform(300, 240, 100, 20, 'ice')
        ],
        coins: [
            new Coin(90, 450),
            new Coin(290, 390),
            new Coin(470, 330),
            new Coin(650, 270),
            new Coin(820, 390),
            new Coin(350, 200, 'diamond')
        ],
        spikes: [
            new Spike(180, 450),
            new Spike(360, 330),
            new Spike(540, 270),
            new Spike(700, 390)
        ],
        enemies: [
            new Enemy(250, 390, 40, 40),
            new Enemy(500, 330, 40, 40, 'flying'),
            new Enemy(700, 390, 40, 40)
        ],
        flag: new Flag(850, 390),
        startX: 50,
        startY: 440,
        theme: 'ice'
    },
    5: {
        name: "Núi Lửa",
        platforms: [
            new Platform(0, 460, 160, 30, 'lava'),
            new Platform(200, 400, 140, 30, 'lava'),
            new Platform(380, 340, 140, 30, 'lava'),
            new Platform(560, 280, 140, 30, 'lava'),
            new Platform(740, 400, 160, 30, 'lava'),
            new Platform(450, 200, 120, 20, 'lava')
        ],
        coins: [
            new Coin(80, 430),
            new Coin(270, 370),
            new Coin(450, 310),
            new Coin(630, 250),
            new Coin(810, 370),
            new Coin(510, 160, 'diamond')
        ],
        spikes: [
            new Spike(160, 430),
            new Spike(340, 310),
            new Spike(520, 250),
            new Spike(680, 370)
        ],
        enemies: [
            new Enemy(300, 370, 40, 40),
            new Enemy(550, 310, 40, 40),
            new Enemy(700, 370, 40, 40, 'flying')
        ],
        flag: new Flag(860, 370),
        startX: 50,
        startY: 420,
        theme: 'lava'
    },
    6: {
        name: "Thung Lũng Mây",
        platforms: [
            new Platform(0, 500, 140, 30),
            new Platform(180, 440, 140, 30),
            new Platform(360, 380, 140, 30),
            new Platform(540, 320, 140, 30),
            new Platform(720, 260, 140, 30),
            new Platform(250, 220, 100, 20, 'grass')
        ],
        coins: [
            new Coin(70, 470),
            new Coin(250, 410),
            new Coin(430, 350),
            new Coin(610, 290),
            new Coin(790, 230),
            new Coin(300, 180, 'diamond')
        ],
        spikes: [
            new Spike(140, 470),
            new Spike(320, 350),
            new Spike(500, 290),
            new Spike(680, 230)
        ],
        enemies: [
            new Enemy(220, 410, 40, 40, 'flying'),
            new Enemy(480, 350, 40, 40),
            new Enemy(650, 290, 40, 40, 'flying')
        ],
        flag: new Flag(820, 230),
        startX: 50,
        startY: 440,
        theme: 'cloud'
    },
    7: {
        name: "Rừng Ma",
        platforms: [
            new Platform(0, 480, 150, 30),
            new Platform(200, 420, 130, 30),
            new Platform(370, 360, 130, 30),
            new Platform(540, 420, 130, 30),
            new Platform(710, 480, 150, 30),
            new Platform(400, 240, 120, 20)
        ],
        coins: [
            new Coin(75, 450),
            new Coin(265, 390),
            new Coin(435, 330),
            new Coin(605, 390),
            new Coin(775, 450),
            new Coin(460, 200, 'diamond')
        ],
        spikes: [
            new Spike(150, 450),
            new Spike(330, 330),
            new Spike(500, 390),
            new Spike(670, 450)
        ],
        enemies: [
            new Enemy(280, 390, 40, 40),
            new Enemy(450, 330, 40, 40, 'flying'),
            new Enemy(620, 390, 40, 40),
            new Enemy(750, 450, 40, 40, 'flying')
        ],
        flag: new Flag(820, 450),
        startX: 50,
        startY: 440,
        theme: 'haunted'
    },
    8: {
        name: "Thành Phố Cổ",
        platforms: [
            new Platform(0, 500, 180, 40),
            new Platform(220, 440, 160, 40),
            new Platform(420, 380, 160, 40),
            new Platform(620, 320, 160, 40),
            new Platform(300, 260, 120, 30),
            new Platform(500, 200, 120, 30)
        ],
        coins: [
            new Coin(90, 460),
            new Coin(300, 400),
            new Coin(500, 340),
            new Coin(700, 280),
            new Coin(360, 220),
            new Coin(560, 160),
            new Coin(450, 100, 'diamond')
        ],
        spikes: [
            new Spike(180, 460),
            new Spike(380, 340),
            new Spike(580, 280),
            new Spike(340, 220),
            new Spike(540, 160)
        ],
        enemies: [
            new Enemy(260, 400, 40, 40),
            new Enemy(460, 340, 40, 40, 'flying'),
            new Enemy(660, 280, 40, 40),
            new Enemy(320, 220, 40, 40, 'flying')
        ],
        flag: new Flag(750, 280),
        startX: 50,
        startY: 420,
        theme: 'ruins'
    },
    9: {
        name: "Đền Thờ Cổ",
        platforms: [
            new Platform(0, 520, 200, 50),
            new Platform(250, 460, 180, 40),
            new Platform(470, 400, 180, 40),
            new Platform(690, 340, 180, 40),
            new Platform(400, 280, 140, 30),
            new Platform(600, 220, 140, 30)
        ],
        coins: [
            new Coin(100, 490),
            new Coin(340, 430),
            new Coin(560, 370),
            new Coin(780, 310),
            new Coin(470, 250),
            new Coin(670, 190),
            new Coin(550, 130, 'diamond')
        ],
        spikes: [
            new Spike(200, 490),
            new Spike(430, 370),
            new Spike(650, 310),
            new Spike(470, 250),
            new Spike(670, 190)
        ],
        enemies: [
            new Enemy(300, 430, 40, 40),
            new Enemy(520, 370, 40, 40),
            new Enemy(740, 310, 40, 40, 'flying'),
            new Enemy(440, 250, 40, 40, 'flying'),
            new Enemy(640, 190, 40, 40)
        ],
        flag: new Flag(830, 310),
        startX: 50,
        startY: 440,
        theme: 'temple'
    },
    10: {
        name: "Đỉnh Vinh Quang",
        platforms: [
            new Platform(0, 540, 220, 60),
            new Platform(270, 480, 200, 50),
            new Platform(510, 420, 200, 50),
            new Platform(750, 360, 200, 50),
            new Platform(350, 320, 160, 40),
            new Platform(550, 260, 160, 40),
            new Platform(450, 180, 120, 30)
        ],
        coins: [
            new Coin(110, 510),
            new Coin(370, 450),
            new Coin(610, 390),
            new Coin(850, 330),
            new Coin(430, 290),
            new Coin(630, 230),
            new Coin(510, 150),
            new Coin(600, 80, 'diamond')
        ],
        spikes: [
            new Spike(220, 510),
            new Spike(470, 390),
            new Spike(710, 330),
            new Spike(430, 290),
            new Spike(630, 230),
            new Spike(510, 150)
        ],
        enemies: [
            new Enemy(320, 450, 40, 40),
            new Enemy(560, 390, 40, 40),
            new Enemy(800, 330, 40, 40, 'flying'),
            new Enemy(390, 290, 40, 40),
            new Enemy(590, 230, 40, 40, 'flying'),
            new Enemy(470, 150, 40, 40)
        ],
        flag: new Flag(900, 330),
        startX: 50,
        startY: 440,
        theme: 'final'
    }
};

// ==================== CHARACTER DATA ====================
const CHARACTERS = [
    {
        id: 'leo',
        name: 'Leo',
        type: 'Cơ Bản',
        price: 0,
        owned: true,
        stats: {
            jump: 'Bình thường',
            speed: 'Bình thường',
            ability: 'Không có'
        },
        color: '#37b24d'
    },
    {
        id: 'ninja',
        name: 'Ninja Kai',
        type: 'Tốc Độ',
        price: 500,
        owned: false,
        stats: {
            jump: 'Cao +20%',
            speed: 'Nhanh +15%',
            ability: 'Nhảy cao hơn'
        },
        color: '#333333'
    },
    {
        id: 'knight',
        name: 'Kỵ sĩ Luna',
        type: 'Phòng Thủ',
        price: 1200,
        owned: false,
        stats: {
            jump: 'Bình thường',
            speed: 'Bình thường',
            ability: 'Double Jump'
        },
        color: '#4dabf7'
    },
    {
        id: 'wizard',
        name: 'Phù thủy Zibo',
        type: 'Ma Thuật',
        price: 2500,
        owned: false,
        stats: {
            jump: 'Trung bình',
            speed: 'Chậm',
            ability: 'Lượn trong không trung'
        },
        color: '#9c36b5'
    },
    {
        id: 'robot',
        name: 'Robot Bolt',
        type: 'Công Nghệ',
        price: 4000,
        owned: false,
        stats: {
            jump: 'Thấp',
            speed: 'Rất nhanh',
            ability: 'Tăng tốc độ'
        },
        color: '#ff922b'
    },
    {
        id: 'fairy',
        name: 'Tiên Lily',
        type: 'Hỗ Trợ',
        price: 6000,
        owned: false,
        stats: {
            jump: 'Rất cao',
            speed: 'Trung bình',
            ability: 'Thu hút xu tự động'
        },
        color: '#ff6b6b'
    },
    {
        id: 'dragon',
        name: 'Rồng Flame',
        type: 'Huyền Thoại',
        price: 10000,
        owned: false,
        stats: {
            jump: 'Tuyệt vời',
            speed: 'Nhanh',
            ability: 'Vô địch + Bay lượn'
        },
        color: '#e03131'
    }
];

// ==================== BIẾN GAME ====================
let player, platforms, coinsList, spikes, enemies, flag;
let levelCoins = 0;
let gamePaused = false;
let lastTime = 0;
let loadingProgress = 0;

// ==================== HÀM KHỞI TẠO ====================
async function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Kiểm tra canvas
    if (!canvas || !ctx) {
        alert('Lỗi: Không thể khởi tạo canvas!');
        return;
    }
    
    // Tải dữ liệu từ localStorage
    loadGameData();
    
    // Thiết lập sự kiện
    setupEventListeners();
    
    // Tạo nội dung động
    createLevelsGrid();
    createCharactersGrid();
    
    // Tải tài nguyên
    await loadResources();
    
    // Hiển thị menu chính
    showScreen('mainMenu');
    
    // Cập nhật UI
    updateUI();
    
    // Bắt đầu nhạc nền
    const bgMusic = document.getElementById('bgMusic');
    bgMusic.volume = 0.3;
    bgMusic.play().catch(e => console.log("Autoplay blocked:", e));
}

async function loadResources() {
    const totalResources = 10;
    let loaded = 0;
    
    const updateProgress = () => {
        loaded++;
        loadingProgress = (loaded / totalResources) * 100;
        document.getElementById('loadingProgress').style.width = `${loadingProgress}%`;
        
        if (loaded >= totalResources) {
            setTimeout(() => {
                document.getElementById('loadingScreen').classList.remove('active');
                showScreen('mainMenu');
            }, 500);
        }
    };
    
    // Load âm thanh
    const sounds = [
        { id: 'jumpSound', src: 'https://assets.mixkit.co/sfx/preview/mixkit-jump-arcade-game-166.mp3' },
        { id: 'coinSound', src: 'https://assets.mixkit.co/sfx/preview/mixkit-coin-win-notification-199.mp3' },
        { id: 'hurtSound', src: 'https://assets.mixkit.co/sfx/preview/mixkit-retro-arcade-game-hit-2187.mp3' },
        { id: 'winSound', src: 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3' }
    ];
    
    for (let sound of sounds) {
        const audio = document.getElementById(sound.id);
        audio.src = sound.src;
        audio.load();
        updateProgress();
    }
    
    // Load các resource khác
    for (let i = 0; i < 6; i++) {
        setTimeout(updateProgress, 100 * i);
    }
}

function loadGameData() {
    try {
        const savedCoins = localStorage.getItem('jumpAdventureCoins');
        const savedLevels = localStorage.getItem('jumpAdventureLevels');
        const savedChars = localStorage.getItem('jumpAdventureChars');
        const savedChar = localStorage.getItem('jumpAdventureCurrentChar');
        const savedGraphics = localStorage.getItem('jumpAdventureGraphics');
        
        if (savedCoins) coins = parseInt(savedCoins);
        if (savedLevels) unlockedLevels = JSON.parse(savedLevels);
        if (savedChars) unlockedCharacters = JSON.parse(savedChars);
        if (savedChar) currentCharacter = savedChar;
        if (savedGraphics) graphicsQuality = savedGraphics;
        
        // Đảm bảo luôn có màn 1
        if (!unlockedLevels.includes(1)) {
            unlockedLevels.push(1);
        }
        
        // Đảm bảo luôn có nhân vật Leo
        if (!unlockedCharacters.includes('leo')) {
            unlockedCharacters.push('leo');
        }
        
        // Cập nhật trạng thái sở hữu nhân vật
        CHARACTERS.forEach(char => {
            char.owned = unlockedCharacters.includes(char.id);
        });
        
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        // Khởi tạo giá trị mặc định
        coins = 0;
        unlockedLevels = [1];
        unlockedCharacters = ['leo'];
        currentCharacter = 'leo';
        graphicsQuality = 'medium';
    }
}

function saveGameData() {
    try {
        localStorage.setItem('jumpAdventureCoins', coins.toString());
        localStorage.setItem('jumpAdventureLevels', JSON.stringify(unlockedLevels));
        localStorage.setItem('jumpAdventureChars', JSON.stringify(unlockedCharacters));
        localStorage.setItem('jumpAdventureCurrentChar', currentCharacter);
        localStorage.setItem('jumpAdventureGraphics', graphicsQuality);
    } catch (error) {
        console.error('Lỗi khi lưu dữ liệu:', error);
    }
}

// ==================== QUẢN LÝ MÀN HÌNH ====================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
    }
    
    if (screenId === 'gameScreen') {
        startLevel(currentLevel);
    } else if (screenId === 'mainMenu') {
        updateUI();
        createLevelsGrid();
        createCharactersGrid();
    }
}

// ==================== TẠO NỘI DUNG ĐỘNG ====================
function createLevelsGrid() {
    const grid = document.getElementById('levelsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    for (let i = 1; i <= CONFIG.LEVEL_COUNT; i++) {
        const level = LEVELS[i];
        if (!level) continue;
        
        const isUnlocked = unlockedLevels.includes(i);
        const isCurrent = i === currentLevel;
        
        const levelCard = document.createElement('div');
        levelCard.className = `level-card ${isUnlocked ? 'unlocked' : 'locked'}`;
        levelCard.dataset.level = i;
        levelCard.innerHTML = `
            <div class="level-number">${i}</div>
            <div class="level-name">${level.name}</div>
            <div class="level-status">${isUnlocked ? 'ĐÃ MỞ' : 'KHÓA'}</div>
            ${isCurrent ? '<div class="level-current">ĐANG CHƠI</div>' : ''}
        `;
        
        if (isUnlocked) {
            levelCard.addEventListener('click', () => {
                currentLevel = i;
                showScreen('gameScreen');
            });
        }
        
        grid.appendChild(levelCard);
    }
}

function createCharactersGrid() {
    const grid = document.getElementById('charactersGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    CHARACTERS.forEach(character => {
        const isOwned = character.owned || character.price === 0;
        const isCurrent = currentCharacter === character.id;
        
        const charCard = document.createElement('div');
        charCard.className = `character-card ${isOwned ? 'owned' : ''} ${isCurrent ? 'current' : ''}`;
        charCard.dataset.char = character.id;
        charCard.innerHTML = `
            <div class="character-header">
                <div class="character-icon" style="background: ${character.color};">
                    <i class="fas fa-user"></i>
                </div>
                <div class="character-info">
                    <div class="character-name">${character.name}</div>
                    <div class="character-type">${character.type}</div>
                </div>
            </div>
            <div class="character-stats">
                <div class="stat">
                    <i class="fas fa-arrow-up"></i>
                    <span>${character.stats.jump}</span>
                </div>
                <div class="stat">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>${character.stats.speed}</span>
                </div>
                <div class="stat">
                    <i class="fas fa-star"></i>
                    <span>${character.stats.ability}</span>
                </div>
            </div>
            <div class="character-price">
                <div class="price-tag">
                    <i class="fas fa-coins"></i>
                    <span>${character.price.toLocaleString()}</span>
                </div>
                <button class="buy-btn" 
                        data-char="${character.id}" 
                        data-price="${character.price}"
                        ${isOwned ? 'disabled' : ''}
                        ${coins >= character.price ? '' : 'disabled'}>
                    ${isOwned ? 'ĐÃ SỞ HỮU' : 'MUA'}
                </button>
            </div>
        `;
        
        grid.appendChild(charCard);
    });
    
    // Cập nhật số xu trong shop
    document.getElementById('shopCoinCount').textContent = coins.toLocaleString();
}

// ==================== SỰ KIỆN ====================
function setupEventListeners() {
    // Menu chính
    document.getElementById('playBtn')?.addEventListener('click', () => {
        showScreen('gameScreen');
    });
    
    document.getElementById('levelsBtn')?.addEventListener('click', () => {
        showScreen('levelsMenu');
    });
    
    document.getElementById('shopBtn')?.addEventListener('click', () => {
        showScreen('shopMenu');
    });
    
    document.getElementById('helpBtn')?.addEventListener('click', () => {
        showScreen('helpMenu');
    });
    
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
        showScreen('settingsMenu');
    });
    
    // Nút quay lại
    const backButtons = [
        'backFromLevels', 'backFromShop', 'backFromHelp', 'backFromSettings',
        'quitToMenuBtn', 'quitAfterFailBtn', 'backToMenuBtn'
    ];
    
    backButtons.forEach(id => {
        document.getElementById(id)?.addEventListener('click', () => {
            showScreen('mainMenu');
            gamePaused = false;
        });
    });
    
    // Game controls
    document.getElementById('resumeBtn')?.addEventListener('click', () => {
        togglePause();
    });
    
    document.getElementById('restartLevelBtn')?.addEventListener('click', () => {
        restartLevel();
    });
    
    document.getElementById('retryBtn')?.addEventListener('click', () => {
        restartLevel();
    });
    
    document.getElementById('playAgainBtn')?.addEventListener('click', () => {
        restartLevel();
    });
    
    document.getElementById('nextLevelBtn')?.addEventListener('click', () => {
        nextLevel();
    });
    
    // Cửa hàng - mua nhân vật
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('buy-btn')) {
            const charId = e.target.dataset.char;
            const price = parseInt(e.target.dataset.price);
            
            if (coins >= price && !unlockedCharacters.includes(charId)) {
                coins -= price;
                unlockedCharacters.push(charId);
                currentCharacter = charId;
                
                // Cập nhật trạng thái nhân vật
                CHARACTERS.forEach(char => {
                    if (char.id === charId) {
                        char.owned = true;
                    }
                });
                
                saveGameData();
                updateUI();
                createCharactersGrid();
                
                // Hiệu ứng mua thành công
                playSound('coinSound');
                alert(`Chúc mừng! Bạn đã mở khóa ${CHARACTERS.find(c => c.id === charId).name}!`);
            }
        }
    });
    
    // Cài đặt
    const musicSlider = document.getElementById('musicVolume');
    const soundSlider = document.getElementById('soundVolume');
    const difficultySelect = document.getElementById('difficulty');
    const graphicsSelect = document.getElementById('graphics');
    const resetBtn = document.getElementById('resetBtn');
    
    if (musicSlider) {
        musicSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('musicValue').textContent = `${value}%`;
            document.getElementById('bgMusic').volume = value / 100;
        });
    }
    
    if (soundSlider) {
        soundSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('soundValue').textContent = `${value}%`;
        });
    }
    
    if (difficultySelect) {
        difficultySelect.addEventListener('change', (e) => {
            const difficulty = e.target.value;
            switch(difficulty) {
                case 'easy':
                    CONFIG.GRAVITY = 0.6;
                    CONFIG.PLAYER_JUMP = -16;
                    CONFIG.HEALTH = 5;
                    break;
                case 'hard':
                    CONFIG.GRAVITY = 1.0;
                    CONFIG.PLAYER_JUMP = -20;
                    CONFIG.HEALTH = 2;
                    break;
                default:
                    CONFIG.GRAVITY = 0.8;
                    CONFIG.PLAYER_JUMP = -18;
                    CONFIG.HEALTH = 3;
            }
        });
    }
    
    if (graphicsSelect) {
        graphicsSelect.addEventListener('change', (e) => {
            graphicsQuality = e.target.value;
            saveGameData();
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu? Hành động này không thể hoàn tác!')) {
                localStorage.clear();
                location.reload();
            }
        });
    }
    
    // Keyboard controls
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

// ==================== ĐIỀU KHIỂN BÀN PHÍM ====================
const keys = {};

function handleKeyDown(e) {
    keys[e.key.toLowerCase()] = true;
    
    switch(e.code) {
        case 'Space':
            e.preventDefault();
            if (gameActive && !gamePaused) {
                player.jump();
            }
            break;
        case 'KeyP':
            togglePause();
            break;
        case 'KeyR':
            if (gameActive) {
                restartLevel();
            }
            break;
        case 'Escape':
            if (gameActive && !gamePaused) {
                togglePause();
            }
            break;
    }
}

function handleKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
}

// ==================== GAME LOOP ====================
function startLevel(level) {
    const levelData = LEVELS[level];
    if (!levelData) {
        alert('Màn chơi không tồn tại!');
        showScreen('mainMenu');
        return;
    }
    
    // Khởi tạo đối tượng
    player = new Player(levelData.startX, levelData.startY);
    platforms = levelData.platforms;
    coinsList = levelData.coins;
    spikes = levelData.spikes;
    enemies = levelData.enemies || [];
    flag = levelData.flag;
    
    // Reset biến
    levelCoins = 0;
    gameTime = 0;
    health = CONFIG.HEALTH;
    particles = [];
    
    gameActive = true;
    gamePaused = false;
    
    // Ẩn overlay
    document.getElementById('pauseOverlay').classList.add('hidden');
    document.getElementById('gameOverOverlay').classList.add('hidden');
    
    // Bắt đầu timer
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (gameActive && !gamePaused) {
            gameTime++;
            updateTimer();
        }
    }, 1000);
    
    // Cập nhật UI
    updateUI();
    
    // Bắt đầu game loop
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function gameLoop(currentTime) {
    if (!gameActive || gamePaused) return;
    
    const deltaTime = (currentTime - lastTime) / 16.67; // Normalize to ~60fps
    lastTime = currentTime;
    
    update(deltaTime);
    draw();
    
    if (gameActive) {
        requestAnimationFrame(gameLoop);
    }
}

function update(deltaTime) {
    // Cập nhật input
    player.velocityX = 0;
    if (keys['arrowleft'] || keys['a']) player.velocityX = -CONFIG.PLAYER_SPEED;
    if (keys['arrowright'] || keys['d']) player.velocityX = CONFIG.PLAYER_SPEED;
    
    // Cập nhật player
    player.update(platforms, deltaTime);
    
    // Cập nhật platform
    platforms.forEach(p => p.update(deltaTime));
    
    // Cập nhật coin
    coinsList.forEach(c => c.update(deltaTime));
    
    // Cập nhật spike
    spikes.forEach(s => s.update(deltaTime));
    
    // Cập nhật enemy
    enemies.forEach(e => e.update(deltaTime));
    
    // Cập nhật flag
    flag.update(deltaTime);
    
    // Cập nhật particles
    particles = particles.filter(p => p.update(deltaTime));
    
    // Kiểm tra thu thập coin
    coinsList.forEach(coin => {
        if (!coin.collected && 
            player.x < coin.x + coin.radius &&
            player.x + player.width > coin.x - coin.radius &&
            player.y < coin.y + coin.radius &&
            player.y + player.height > coin.y - coin.radius) {
            
            coin.collected = true;
            const value = coin.type === 'diamond' ? CONFIG.DIAMOND_VALUE : CONFIG.COIN_VALUE;
            coins += value;
            levelCoins += value;
            playSound('coinSound');
            updateUI();
            
            // Coin collection particles
            for (let i = 0; i < 15; i++) {
                particles.push(new Particle(
                    coin.x,
                    coin.y,
                    Math.random() * 6 - 3,
                    Math.random() * -6 - 2,
                    coin.type === 'diamond' ? '#4dabf7' : '#ffd700'
                ));
            }
        }
    });
    
    // Kiểm tra va chạm với spike
    for (let spike of spikes) {
        if (player.x < spike.x + spike.width &&
            player.x + player.width > spike.x &&
            player.y < spike.y + spike.height &&
            player.y + player.height > spike.y) {
            
            if (player.takeDamage()) {
                if (health <= 0) {
                    gameOver();
                    return;
                }
            }
        }
    }
    
    // Kiểm tra va chạm với enemy
    for (let enemy of enemies) {
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            
            if (player.takeDamage()) {
                if (health <= 0) {
                    gameOver();
                    return;
                }
            }
        }
    }
    
    // Kiểm tra chạm cờ
    if (player.x < flag.x + flag.width &&
        player.x + player.width > flag.x &&
        player.y < flag.y + flag.height &&
        player.y + player.height > flag.y) {
        
        levelComplete();
    }
}

function draw() {
    // Xóa canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Vẽ nền theo theme
    drawBackground();
    
    // Vẽ các đối tượng
    platforms.forEach(p => p.draw());
    spikes.forEach(s => s.draw());
    enemies.forEach(e => e.draw());
    coinsList.forEach(c => c.draw());
    flag.draw();
    particles.forEach(p => p.draw());
    player.draw();
    
    // Vẽ overlay nếu cần
    if (player.invincible) {
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
    }
}

function drawBackground() {
    const theme = LEVELS[currentLevel]?.theme || 'grass';
    
    // Gradient nền theo theme
    let gradient;
    switch(theme) {
        case 'cave':
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#2c3e50');
            gradient.addColorStop(1, '#34495e');
            break;
        case 'ice':
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#74b9ff');
            gradient.addColorStop(1, '#0984e3');
            break;
        case 'lava':
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#ff7675');
            gradient.addColorStop(1, '#d63031');
            break;
        case 'forest':
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#00b894');
            gradient.addColorStop(1, '#00a085');
            break;
        case 'cloud':
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#dfe6e9');
            gradient.addColorStop(1, '#b2bec3');
            break;
        case 'haunted':
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#2d3436');
            gradient.addColorStop(1, '#000000');
            break;
        case 'ruins':
        case 'temple':
        case 'final':
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#fdcb6e');
            gradient.addColorStop(1, '#e17055');
            break;
        default: // grass
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#98D8C8');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Vẽ mây
    if (theme !== 'cave' && theme !== 'haunted') {
        drawClouds();
    }
    
    // Vẽ mặt trời/mặt trăng
    if (theme === 'haunted') {
        drawMoon();
    } else if (theme !== 'cave') {
        drawSun();
    }
}

function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for(let i = 0; i < 5; i++) {
        const x = (Date.now() * 0.01 + i * 200) % (canvas.width + 300) - 150;
        const y = 50 + i * 40;
        drawCloud(x, y, 80 + i * 20, 30 + i * 5);
    }
}

function drawCloud(x, y, width, height) {
    ctx.beginPath();
    ctx.arc(x, y, height, 0, Math.PI * 2);
    ctx.arc(x + width/3, y - height/2, height*0.8, 0, Math.PI * 2);
    ctx.arc(x + width*2/3, y, height*0.7, 0, Math.PI * 2);
    ctx.arc(x + width, y, height, 0, Math.PI * 2);
    ctx.fill();
}

function drawSun() {
    ctx.fillStyle = '#fdcb6e';
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 80, 40, 0, Math.PI * 2);
    ctx.fill();
    
    // Tia nắng
    ctx.strokeStyle = '#fdcb6e';
    ctx.lineWidth = 3;
    for(let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const x1 = canvas.width - 100 + Math.cos(angle) * 45;
        const y1 = 80 + Math.sin(angle) * 45;
        const x2 = canvas.width - 100 + Math.cos(angle) * 60;
        const y2 = 80 + Math.sin(angle) * 60;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}

function drawMoon() {
    ctx.fillStyle = '#dfe6e9';
    ctx.beginPath();
    ctx.arc(100, 80, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Chi tiết mặt trăng
    ctx.fillStyle = '#b2bec3';
    ctx.beginPath();
    ctx.arc(115, 70, 10, 0, Math.PI * 2);
    ctx.fill();
}

// ==================== TRẠNG THÁI GAME ====================
function levelComplete() {
    gameActive = false;
    clearInterval(timerInterval);
    
    // Mở khóa màn tiếp theo
    if (!unlockedLevels.includes(currentLevel + 1) && currentLevel < CONFIG.LEVEL_COUNT) {
        unlockedLevels.push(currentLevel + 1);
    }
    
    // Cờ vẫy
    flag.waving = true;
    
    saveGameData();
    playSound('winSound');
    
    // Hiển thị màn kết thúc
    document.getElementById('endTitle').textContent = 'HOÀN THÀNH!';
    document.getElementById('endMessage').textContent = `Bạn đã hoàn thành ${LEVELS[currentLevel].name}!`;
    document.getElementById('endLevel').textContent = currentLevel;
    document.getElementById('endTime').textContent = formatTime(gameTime);
    document.getElementById('endCoins').textContent = levelCoins;
    document.getElementById('totalCoins').textContent = coins;
    
    // Ẩn nút next nếu là màn cuối
    document.getElementById('nextLevelBtn').style.display = 
        currentLevel < CONFIG.LEVEL_COUNT ? 'flex' : 'none';
    
    showScreen('endScreen');
}

function gameOver() {
    gameActive = false;
    clearInterval(timerInterval);
    
    // Hiển thị overlay game over
    document.getElementById('failLevel').textContent = currentLevel;
    document.getElementById('failCoins').textContent = levelCoins;
    document.getElementById('failTime').textContent = formatTime(gameTime);
    document.getElementById('gameOverOverlay').classList.remove('hidden');
}

function restartLevel() {
    gamePaused = false;
    document.getElementById('pauseOverlay').classList.add('hidden');
    document.getElementById('gameOverOverlay').classList.add('hidden');
    startLevel(currentLevel);
}

function nextLevel() {
    if (currentLevel < CONFIG.LEVEL_COUNT) {
        currentLevel++;
        showScreen('gameScreen');
    } else {
        showScreen('mainMenu');
    }
}

function togglePause() {
    if (!gameActive) return;
    
    gamePaused = !gamePaused;
    const overlay = document.getElementById('pauseOverlay');
    
    if (gamePaused) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
}

// ==================== TIỆN ÍCH ====================
function updateUI() {
    document.getElementById('coinCount').textContent = coins.toLocaleString();
    document.getElementById('unlockedCount').textContent = `${unlockedLevels.length}/${CONFIG.LEVEL_COUNT}`;
    
    const currentCharName = CHARACTERS.find(c => c.id === currentCharacter)?.name || 'Leo';
    document.getElementById('currentChar').textContent = currentCharName;
    
    if (gameActive) {
        document.getElementById('gameCoins').textContent = coins.toLocaleString();
        document.getElementById('gameChar').textContent = currentCharName;
        document.getElementById('currentLevel').textContent = currentLevel;
        document.getElementById('healthCount').textContent = health;
    }
}

function updateTimer() {
    if (!gameActive) return;
    document.getElementById('timeCount').textContent = formatTime(gameTime);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function playSound(soundId) {
    try {
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log("Lỗi phát âm thanh:", e));
        }
    } catch (error) {
        console.error("Lỗi khi phát âm thanh:", error);
    }
}

// ==================== KHỞI CHẠY ====================
// Chờ trang tải xong
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Xử lý lỗi chung
window.addEventListener('error', function(e) {
    console.error('Lỗi trong game:', e.error);
    alert('Có lỗi xảy ra trong game. Vui lòng tải lại trang.');
});
