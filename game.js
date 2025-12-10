// ==================== CẤU HÌNH GAME ====================
const CONFIG = {
    GRAVITY: 0.8,
    PLAYER_JUMP: -15,
    PLAYER_SPEED: 5,
    COIN_VALUE: 10,
    DIAMOND_VALUE: 50
};

// ==================== BIẾN TOÀN CỤC ====================
let canvas, ctx;
let gameActive = false;
let currentLevel = 1;
let coins = 0;
let currentCharacter = 'leo';
let unlockedLevels = [1];
let unlockedCharacters = ['leo'];

// ==================== ĐỐI TƯỢNG TRÒ CHƠI ====================
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
        this.jumpPower = currentCharacter === 'ninja' ? -18 : -15;
        this.color = this.getColor();
        this.isGrounded = false;
    }

    getColor() {
        switch (currentCharacter) {
            case 'ninja': return '#333333';
            case 'knight': return '#4dabf7';
            case 'wizard': return '#9c36b5';
            default: return '#37b24d'; // leo
        }
    }

    jump() {
        if (this.jumps > 0) {
            this.velocityY = this.jumpPower;
            this.jumps--;
            playSound('jumpSound');
            return true;
        }
        return false;
    }

    update(platforms) {
        // Áp dụng trọng lực
        this.velocityY += CONFIG.GRAVITY;
        this.y += this.velocityY;
        this.x += this.velocityX;

        // Kiểm tra va chạm với nền
        if (this.y + this.height > canvas.height) {
            this.y = canvas.height - this.height;
            this.velocityY = 0;
            this.jumps = this.maxJumps;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }

        // Kiểm tra va chạm với platform
        this.checkPlatformCollision(platforms);

        // Giới hạn di chuyển trong canvas
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
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
            }
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Vẽ mắt
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x + 10, this.y + 10, 8, 8);
        ctx.fillRect(this.x + this.width - 18, this.y + 10, 8, 8);

        // Vẽ tên nhân vật
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(
            currentCharacter === 'leo' ? 'Leo' :
                currentCharacter === 'ninja' ? 'Kai' :
                    currentCharacter === 'knight' ? 'Luna' : 'Zibo',
            this.x, this.y - 5
        );
    }
}

class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = '#8B4513';
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Thêm texture
        ctx.fillStyle = '#A0522D';
        for (let i = 0; i < this.width; i += 20) {
            ctx.fillRect(this.x + i, this.y, 10, 5);
        }
    }
}

class Coin {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.type = type;
        this.collected = false;
        this.animation = 0;
    }

    update() {
        this.animation += 0.1;
    }

    draw() {
        if (this.collected) return;

        ctx.save();
        ctx.translate(this.x, this.y + Math.sin(this.animation) * 5);

        // Vẽ đồng xu
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);

        if (this.type === 'diamond') {
            ctx.fillStyle = '#4dabf7';
            ctx.shadowColor = '#4dabf7';
        } else {
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = '#ffd700';
        }

        ctx.shadowBlur = 15;
        ctx.fill();

        // Vẽ ký hiệu
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type === 'diamond' ? '💎' : '$', 0, 0);

        ctx.restore();
    }
}

class Spike {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw() {
        ctx.fillStyle = '#ff4757';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
    }
}

class Flag {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 60;
    }

    draw() {
        // Cột cờ
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, 10, this.height);

        // Lá cờ
        ctx.fillStyle = '#ff4757';
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y + 10);
        ctx.lineTo(this.x + 30, this.y + 20);
        ctx.lineTo(this.x + 10, this.y + 30);
        ctx.closePath();
        ctx.fill();
    }
}

// ==================== DỮ LIỆU CÁC MÀN ====================
const LEVELS = {
    1: {
        platforms: [
            new Platform(0, 400, 200, 20),
            new Platform(250, 350, 150, 20),
            new Platform(450, 300, 150, 20),
            new Platform(650, 400, 150, 20)
        ],
        coins: [
            new Coin(100, 350),
            new Coin(300, 300),
            new Coin(500, 250),
            new Coin(700, 350, 'diamond')
        ],
        spikes: [
            new Spike(200, 380, 30, 20),
            new Spike(400, 280, 30, 20)
        ],
        flag: new Flag(750, 340),
        startX: 50,
        startY: 300
    },
    2: {
        platforms: [
            new Platform(0, 450, 150, 20),
            new Platform(200, 400, 100, 20),
            new Platform(350, 350, 150, 20),
            new Platform(550, 300, 100, 20),
            new Platform(700, 400, 100, 20)
        ],
        coins: [
            new Coin(250, 350),
            new Coin(400, 300),
            new Coin(600, 250),
            new Coin(750, 350, 'diamond')
        ],
        spikes: [
            new Spike(150, 430, 30, 20),
            new Spike(500, 280, 30, 20),
            new Spike(650, 380, 30, 20)
        ],
        flag: new Flag(750, 340),
        startX: 50,
        startY: 400
    },
    3: {
        platforms: [
            new Platform(0, 450, 100, 20),
            new Platform(150, 400, 100, 20),
            new Platform(300, 350, 100, 20),
            new Platform(450, 300, 100, 20),
            new Platform(600, 250, 100, 20),
            new Platform(700, 400, 100, 20)
        ],
        coins: [
            new Coin(175, 350),
            new Coin(325, 300),
            new Coin(475, 250),
            new Coin(625, 200),
            new Coin(750, 350, 'diamond')
        ],
        spikes: [
            new Spike(250, 380, 30, 20),
            new Spike(400, 280, 30, 20),
            new Spike(550, 230, 30, 20)
        ],
        flag: new Flag(750, 340),
        startX: 50,
        startY: 400
    }
};

// ==================== KHỞI TẠO GAME ====================
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Tải dữ liệu từ localStorage
    loadGameData();

    // Thiết lập sự kiện
    setupEventListeners();

    // Hiển thị menu chính
    showScreen('mainMenu');

    // Cập nhật UI
    updateUI();
}

function loadGameData() {
    const savedCoins = localStorage.getItem('jumpAdventureCoins');
    const savedLevels = localStorage.getItem('jumpAdventureLevels');
    const savedChars = localStorage.getItem('jumpAdventureChars');

    if (savedCoins) coins = parseInt(savedCoins);
    if (savedLevels) unlockedLevels = JSON.parse(savedLevels);
    if (savedChars) unlockedCharacters = JSON.parse(savedChars);
}

function saveGameData() {
    localStorage.setItem('jumpAdventureCoins', coins.toString());
    localStorage.setItem('jumpAdventureLevels', JSON.stringify(unlockedLevels));
    localStorage.setItem('jumpAdventureChars', JSON.stringify(unlockedCharacters));
}

// ==================== QUẢN LÝ MÀN HÌNH ====================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');

    if (screenId === 'gameScreen') {
        startLevel(currentLevel);
    }
}

// ==================== SỰ KIỆN ====================
function setupEventListeners() {
    // Menu chính
    document.getElementById('playBtn').addEventListener('click', () => {
        startLevel(currentLevel);
        showScreen('gameScreen');
    });

    document.getElementById('levelsBtn').addEventListener('click', () => {
        updateLevelButtons();
        showScreen('levelsMenu');
    });

    document.getElementById('shopBtn').addEventListener('click', () => {
        updateShopItems();
        showScreen('shopMenu');
    });

    document.getElementById('helpBtn').addEventListener('click', () => {
        showScreen('helpMenu');
    });

    // Nút quay lại
    document.getElementById('backFromLevels').addEventListener('click', () => showScreen('mainMenu'));
    document.getElementById('backFromShop').addEventListener('click', () => showScreen('mainMenu'));
    document.getElementById('backFromHelp').addEventListener('click', () => showScreen('mainMenu'));
    document.getElementById('menuBtn').addEventListener('click', () => showScreen('mainMenu'));
    document.getElementById('backToMenuBtn').addEventListener('click', () => showScreen('mainMenu'));

    // Chọn màn
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            if (!this.classList.contains('locked')) {
                currentLevel = parseInt(this.dataset.level);
                showScreen('gameScreen');
            }
        });
    });

    // Cửa hàng
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const price = parseInt(this.dataset.price);
            const item = this.closest('.shop-item');
            const char = item.dataset.char;

            if (coins >= price && !unlockedCharacters.includes(char)) {
                coins -= price;
                unlockedCharacters.push(char);
                currentCharacter = char;
                saveGameData();
                updateUI();
                updateShopItems();
                alert(`Bạn đã mở khóa nhân vật mới!`);
            }
        });
    });

    // Game controls
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);

    // Keyboard controls
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

function updateLevelButtons() {
    document.querySelectorAll('.level-btn').forEach(btn => {
        const level = parseInt(btn.dataset.level);
        btn.classList.toggle('locked', !unlockedLevels.includes(level));
    });
}

function updateShopItems() {
    document.querySelectorAll('.shop-item').forEach(item => {
        const char = item.dataset.char;
        const btn = item.querySelector('.buy-btn');

        if (unlockedCharacters.includes(char)) {
            item.classList.remove('locked');
            btn.textContent = 'ĐÃ MUA';
            btn.disabled = true;
        } else {
            const price = parseInt(btn.dataset.price);
            btn.disabled = coins < price;
        }
    });
}

function updateUI() {
    document.getElementById('coinCount').textContent = coins;
    document.getElementById('gameCoins').textContent = coins;
    document.getElementById('currentChar').textContent =
        currentCharacter === 'leo' ? 'Leo' :
            currentCharacter === 'ninja' ? 'Ninja Kai' :
                currentCharacter === 'knight' ? 'Kỵ sĩ Luna' : 'Phù thủy Zibo';
    document.getElementById('gameChar').textContent =
        currentCharacter === 'leo' ? 'Leo' :
            currentCharacter === 'ninja' ? 'Kai' :
                currentCharacter === 'knight' ? 'Luna' : 'Zibo';
    document.getElementById('currentLevel').textContent = currentLevel;
}

// ==================== ĐIỀU KHIỂN BÀN PHÍM ====================
const keys = {};

function handleKeyDown(e) {
    if (!gameActive) return;

    keys[e.key.toLowerCase()] = true;

    if (e.code === 'Space') {
        e.preventDefault();
        player.jump();
    }
}

function handleKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
}

// ==================== GAME LOOP ====================
let player, platforms, coinsList, spikes, flag;
let levelCoins = 0;
let gamePaused = false;

function startLevel(level) {
    const levelData = LEVELS[level];
    if (!levelData) {
        alert('Màn chơi đang phát triển!');
        showScreen('mainMenu');
        return;
    }

    player = new Player(levelData.startX, levelData.startY);
    platforms = levelData.platforms;
    coinsList = levelData.coins;
    spikes = levelData.spikes;
    flag = levelData.flag;
    levelCoins = 0;

    gameActive = true;
    gamePaused = false;
    gameLoop();
}

function gameLoop() {
    if (!gameActive || gamePaused) return;

    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    // Cập nhật player movement
    player.velocityX = 0;
    if (keys['arrowleft'] || keys['a']) player.velocityX = -CONFIG.PLAYER_SPEED;
    if (keys['arrowright'] || keys['d']) player.velocityX = CONFIG.PLAYER_SPEED;

    // Cập nhật player
    player.update(platforms);

    // Cập nhật coins
    coinsList.forEach(coin => {
        coin.update();

        // Kiểm tra thu thập coin
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
        }
    });

    // Kiểm tra va chạm với gai
    for (let spike of spikes) {
        if (player.x < spike.x + spike.width &&
            player.x + player.width > spike.x &&
            player.y < spike.y + spike.height &&
            player.y + player.height > spike.y) {

            gameOver();
            return;
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
    // Xóa màn hình
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Vẽ nền
    drawBackground();

    // Vẽ các đối tượng
    platforms.forEach(p => p.draw());
    spikes.forEach(s => s.draw());
    coinsList.forEach(c => c.draw());
    flag.draw();
    player.draw();

    // Vẽ thông tin
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 80);
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`Màn: ${currentLevel}`, 20, 35);
    ctx.fillText(`Xu: ${coins}`, 20, 60);
    ctx.fillText(`Xu màn: ${levelCoins}`, 20, 85);
}

function drawBackground() {
    // Gradient sky
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98D8C8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clouds
    ctx.fillStyle = 'white';
    for (let i = 0; i < 3; i++) {
        const x = (Date.now() * 0.01 + i * 150) % (canvas.width + 200) - 100;
        const y = 50 + i * 40;
        drawCloud(x, y, 60, 30);
    }

    // Ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
}

function drawCloud(x, y, width, height) {
    ctx.beginPath();
    ctx.arc(x, y, height, 0, Math.PI * 2);
    ctx.arc(x + width / 3, y - height / 2, height * 0.8, 0, Math.PI * 2);
    ctx.arc(x + width * 2 / 3, y, height * 0.7, 0, Math.PI * 2);
    ctx.arc(x + width, y, height, 0, Math.PI * 2);
    ctx.fill();
}

// ==================== TRẠNG THÁI GAME ====================
function levelComplete() {
    gameActive = false;

    // Mở khóa màn tiếp theo
    if (!unlockedLevels.includes(currentLevel + 1) && currentLevel < 5) {
        unlockedLevels.push(currentLevel + 1);
    }

    saveGameData();

    // Hiển thị màn kết thúc
    document.getElementById('endTitle').textContent = 'CHÚC MỪNG!';
    document.getElementById('endMessage').textContent = `Bạn đã hoàn thành Màn ${currentLevel}!`;
    document.getElementById('endCoins').textContent = levelCoins;
    document.getElementById('totalCoins').textContent = coins;

    // Ẩn nút next nếu là màn cuối
    document.getElementById('nextLevelBtn').style.display =
        currentLevel < 3 ? 'block' : 'none';

    showScreen('endScreen');
}

function gameOver() {
    gameActive = false;

    document.getElementById('endTitle').textContent = 'THẤT BẠI!';
    document.getElementById('endMessage').textContent = 'Hãy thử lại!';
    document.getElementById('endCoins').textContent = levelCoins;
    document.getElementById('totalCoins').textContent = coins;
    document.getElementById('nextLevelBtn').style.display = 'none';

    showScreen('endScreen');
}

function togglePause() {
    gamePaused = !gamePaused;
    const btn = document.getElementById('pauseBtn');
    btn.innerHTML = gamePaused ?
        '<i class="fas fa-play"></i> Tiếp tục' :
        '<i class="fas fa-pause"></i> Tạm dừng';

    if (!gamePaused && gameActive) {
        gameLoop();
    }
}

function nextLevel() {
    if (currentLevel < 5) {
        currentLevel++;
        showScreen('gameScreen');
    }
}

// ==================== TIỆN ÍCH ====================
function playSound(soundId) {
    const sound = document.getElementById(soundId);
    sound.currentTime = 0;
    sound.play().catch(e => console.log("Lỗi phát âm thanh:", e));
}

// ==================== KHỞI CHẠY GAME ====================
// Chờ trang tải xong
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}