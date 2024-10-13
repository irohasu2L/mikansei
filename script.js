const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const difficultySelect = document.getElementById('difficultySelect');
const gameOverElement = document.getElementById('gameOver');
const startButton = document.getElementById('startButton');
const endButton = document.getElementById('endButton');
const pauseButton = document.getElementById('pauseButton'); // 中断ボタンの追加

canvas.width = 400;
canvas.height = 600;

let player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 50,
    width: 40,
    height: 40,
    speed: 5
};

let bullets = [];
let enemies = [];
let score = 0;
let gameOver = false;
let bulletSize = 5;
let enemySpeed = 2;
let enemySizeMultiplier = 1;
let enemySpawnInterval = 2000; // 敵の出現間隔
let enemySpawnTimer; // 敵の出現を管理するためのタイマー
let firingInterval; // 弾を自動で発射するタイマー
let firing = false; // 発射状態を管理するフラグ

// 敵の種類を定義
const enemyTypes = [
    { color: 'red', shape: 'circle', size: 30, scoreMultiplier: 1, movement: 'straight' },
    { color: 'blue', shape: 'square', size: 40, scoreMultiplier: 2, movement: 'zigzag' },
    { color: 'green', shape: 'circle', size: 50, scoreMultiplier: 3, movement: 'wavy' },
    { color: 'yellow', shape: 'square', size: 60, scoreMultiplier: 4, movement: 'straight' },
    { color: 'purple', shape: 'circle', size: 20, scoreMultiplier: 1, movement: 'zigzag' },
    { color: 'orange', shape: 'square', size: 70, scoreMultiplier: 5, movement: 'wavy' },
    { color: 'pink', shape: 'circle', size: 35, scoreMultiplier: 1.5, movement: 'straight' },
    { color: 'cyan', shape: 'square', size: 45, scoreMultiplier: 2.5, movement: 'zigzag' },
    { color: 'lime', shape: 'circle', size: 55, scoreMultiplier: 3.5, movement: 'wavy' },
    { color: 'brown', shape: 'square', size: 65, scoreMultiplier: 4.5, movement: 'straight' }
];

// マウスの動きに応じてプレイヤーを移動
canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    player.x = mouseX - player.width / 2;

    // 壁の外に出ないように制御
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
});

// ゲームスタートボタンが押されたときの処理
startButton.addEventListener('click', () => {
    setDifficulty(difficultySelect.value);
});
endButton.addEventListener('click', resetGame);
pauseButton.addEventListener('click', resetGame); // 中断ボタンが押されたときの処理

// 左クリックで弾を発射するイベント
canvas.addEventListener('mousedown', () => {
    firing = true; // 発射フラグを立てる
    firingInterval = setInterval(shootBullet, 100); // 100msごとに弾を発射
});

// マウスボタンを離したときの処理
canvas.addEventListener('mouseup', () => {
    firing = false; // 発射フラグを下げる
    clearInterval(firingInterval); // 発射を停止
});

// 難易度を設定する関数
function setDifficulty(difficulty) {
    if (difficulty === 'easy') {
        bulletSize = 10; // 弾の大きさ2倍
        enemySpeed = 1;  // 敵の速度をゆっくりに
        enemySizeMultiplier = 1.5;  // 敵が大きくなる
        enemySpawnInterval = 2000; // 敵の出現間隔
    } else if (difficulty === 'normal') {
        bulletSize = 5; // 弾のサイズは通常
        enemySpeed = 2;  // 敵の速度は通常
        enemySizeMultiplier = 1; // 敵のサイズは通常
        enemySpawnInterval = 2000; // 敵の出現間隔
    } else if (difficulty === 'hard') {
        bulletSize = 5; // 弾のサイズは通常
        enemySpeed = 4;  // 敵の速度が2倍
        enemySizeMultiplier = 1; // 敵のサイズは通常
        enemySpawnInterval = 1000; // 敵の出現間隔が通常の半分
    } else if (difficulty === 'nightmare') {
        bulletSize = 5; // 弾のサイズは通常
        enemySpeed = 6;  // 敵の速度がHardの1.5倍
        enemySizeMultiplier = 1; // 敵のサイズは通常
        enemySpawnInterval = 500; // 敵の出現間隔が500
    } else if (difficulty === 'inferno') {
        bulletSize = 5; // 弾のサイズは通常
        enemySpeed = 8;  // 敵の速度がHardの2倍
        enemySizeMultiplier = 1; // 敵のサイズは通常
        enemySpawnInterval = 333; // 敵の出現間隔が333
    }

    // ゲームを開始
    difficultySelect.style.display = 'none';
    startButton.style.display = 'none';
    canvas.style.display = 'block';
    scoreElement.style.display = 'block';
    endButton.style.display = 'none'; // 終了ボタンを非表示
    pauseButton.style.display = 'block'; // 中断ボタンを表示
    gameLoop();

    // 敵の出現を開始
    enemySpawnTimer = setInterval(createEnemy, enemySpawnInterval);
}

function shootBullet() {
    bullets.push({
        x: player.x + player.width / 2 - bulletSize / 2,
        y: player.y,
        width: bulletSize,
        height: bulletSize * 2,
        speed: 5
    });
}

function updatePlayer() {
    // マウスの位置で移動
    player.x = player.x;

    // 壁の外に出ないように制御
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

function updateBullets() {
    for (let i = 0; i < bullets.length; i++) {
        bullets[i].y -= bullets[i].speed;
        // 画面外に出た弾を削除
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
            i--;
        }
    }
}

// 敵を生成する関数
function createEnemy() {
    const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    let x = Math.random() * (canvas.width - randomType.size * enemySizeMultiplier);
    enemies.push({
        x: x,
        y: 0,
        width: randomType.size * enemySizeMultiplier,
        height: randomType.size * enemySizeMultiplier,
        speed: enemySpeed,
        color: randomType.color,
        shape: randomType.shape,
        movement: randomType.movement,
        scoreMultiplier: randomType.scoreMultiplier
    });
}

// 敵の動きを更新する関数
function updateEnemies() {
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        enemy.y += enemy.speed;

        // 敵の移動パターンを処理
        if (enemy.movement === 'zigzag') {
            enemy.x += Math.sin(enemy.y / 20) * 2; // ジグザグに動く
        } else if (enemy.movement === 'wavy') {
            enemy.x += Math.cos(enemy.y / 20) * 2; // 波のように動く
        }

        // 画面外に出た敵を削除
        if (enemy.y > canvas.height) {
            enemies.splice(i, 1);
            i--;
            triggerGameOver(); // プレイヤーが破裂する処理を呼ぶ
        }
    }
}

function handleCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                // スコアの更新
                score += enemy.scoreMultiplier;
                scoreElement.innerText = 'Score: ' + score;
                bullets.splice(bulletIndex, 1);
                enemies.splice(enemyIndex, 1);
            }
        });
    });
}

function checkPlayerCollisions() {
    enemies.forEach(enemy => {
        if (
            enemy.x < player.x + player.width &&
            enemy.x + enemy.width > player.x &&
            enemy.y < player.y + player.height &&
            enemy.y + enemy.height > player.y
        ) {
            triggerGameOver();
        }
    });
}

function drawPlayer() {
    ctx.fillStyle = 'black'; // プレイヤーの色を黒に設定
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();
}

function drawBullets() {
    ctx.fillStyle = 'red';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        if (enemy.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
    });
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function triggerGameOver() {
    gameOver = true;
    clearInterval(enemySpawnTimer); // 敵の出現を止める
    clearInterval(firingInterval); // 弾の発射を止める
    gameOverElement.style.display = 'block';
    endButton.style.display = 'block'; // 終了ボタンを表示
    pauseButton.style.display = 'none'; // 中断ボタンを非表示
    difficultySelect.style.display = 'block';
    startButton.style.display = 'none'; // ゲームスタートボタンを非表示
    canvas.style.display = 'none';
}

function resetGame() {
    // ゲームの状態をリセット
    player.x = canvas.width / 2 - 20;
    player.y = canvas.height - 50;
    bullets = [];
    enemies = [];
    score = 0;
    scoreElement.innerText = 'Score: ' + score;
    gameOver = false;
    gameOverElement.style.display = 'none';
    difficultySelect.style.display = 'block';
    startButton.style.display = 'block';
    canvas.style.display = 'none';
    endButton.style.display = 'none'; // 終了ボタンを非表示
    pauseButton.style.display = 'none'; // 中断ボタンを非表示

    // すべてのタイマーをクリア
    clearInterval(enemySpawnTimer);
    clearInterval(firingInterval);

    // ゲームの設定を初期化
    bulletSize = 5; // 弾のサイズを初期化
    enemySpeed = 2; // 敵の速度を初期化
    enemySpawnInterval = 2000; // 敵の出現間隔を初期化
}

// ゲームループを開始する関数
function gameLoop() {
    clearCanvas();
    updatePlayer();
    updateBullets();
    updateEnemies();
    handleCollisions();
    checkPlayerCollisions();
    drawPlayer();
    drawBullets();
    drawEnemies();

    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }
}
