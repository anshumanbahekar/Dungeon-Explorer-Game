const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const tileSize = 32;
const mapSize = 20;

const TILE = {
  FLOOR: 0,
  WALL: 1,
  COIN: 2,
  KEY: 3,
  DOOR: 4
};

let map = generateMap();
let player = createPlayer();
let enemies = [createEnemy(15, 15)];
let loopId;

function createPlayer() {
  return { x: 1, y: 1, health: 3, keys: 0, score: 0 };
}

function generateMap() {
  const map = [];
  for (let y = 0; y < mapSize; y++) {
    const row = [];
    for (let x = 0; x < mapSize; x++) {
      let tile = Math.random() < 0.1 ? TILE.WALL : TILE.FLOOR;
      if (Math.random() < 0.05) tile = TILE.COIN;
      if (Math.random() < 0.02) tile = TILE.KEY;
      if (Math.random() < 0.02) tile = TILE.DOOR;
      row.push(tile);
    }
    map.push(row);
  }
  for (let i = 0; i < mapSize; i++) {
    map[0][i] = map[mapSize - 1][i] = TILE.WALL;
    map[i][0] = map[i][mapSize - 1] = TILE.WALL;
  }
  return map;
}

function createEnemy(x, y) {
  return { x, y };
}

function canMove(x, y) {
  return map[y] && map[y][x] !== TILE.WALL;
}

function moveEnemies() {
  for (let enemy of enemies) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const stepX = dx === 0 ? 0 : dx / Math.abs(dx);
    const stepY = dy === 0 ? 0 : dy / Math.abs(dy);

    if (Math.abs(dx) > Math.abs(dy)) {
      if (canMove(enemy.x + stepX, enemy.y)) enemy.x += stepX;
    } else {
      if (canMove(enemy.x, enemy.y + stepY)) enemy.y += stepY;
    }

    if (enemy.x === player.x && enemy.y === player.y) {
      player.health--;
      playSound('damage');
      updateStats();
      if (player.health <= 0) gameOver(false);
    }
  }
}

document.addEventListener('keydown', handleMove);
function handleMove(e) {
  const dir = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0]
  }[e.key];

  if (!dir) return;

  const nx = player.x + dir[0];
  const ny = player.y + dir[1];

  if (!canMove(nx, ny)) return;

  const tile = map[ny][nx];

  if (tile === TILE.COIN) {
    player.score += 10;
    map[ny][nx] = TILE.FLOOR;
    playSound('coin');
  } else if (tile === TILE.KEY) {
    player.keys++;
    map[ny][nx] = TILE.FLOOR;
    playSound('key');
  } else if (tile === TILE.DOOR) {
    if (player.keys > 0) {
      player.keys--;
      map[ny][nx] = TILE.FLOOR;
      playSound('door');
    } else return;
  }

  player.x = nx;
  player.y = ny;

  updateStats();
}

function drawTile(x, y, tile, fogged = false) {
  if (fogged) {
    ctx.fillStyle = '#000';
    ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
    return;
  }

  switch (tile) {
    case TILE.FLOOR: ctx.fillStyle = '#444'; break;
    case TILE.WALL: ctx.fillStyle = '#999'; break;
    case TILE.COIN: ctx.fillStyle = 'gold'; break;
    case TILE.KEY: ctx.fillStyle = 'lightblue'; break;
    case TILE.DOOR: ctx.fillStyle = 'brown'; break;
  }
  ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < mapSize; y++) {
    for (let x = 0; x < mapSize; x++) {
      const distance = Math.abs(x - player.x) + Math.abs(y - player.y);
      drawTile(x, y, map[y][x], distance > 3);
    }
  }

  for (let enemy of enemies) {
    if (Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y) <= 3) {
      ctx.fillStyle = 'red';
      ctx.fillRect(enemy.x * tileSize, enemy.y * tileSize, tileSize, tileSize);
    }
  }

  ctx.fillStyle = 'lime';
  ctx.fillRect(player.x * tileSize, player.y * tileSize, tileSize, tileSize);
}

function updateStats() {
  document.getElementById('health').textContent = player.health;
  document.getElementById('score').textContent = player.score;
  document.getElementById('keys').textContent = player.keys;

  if (player.score >= 100) {
    gameOver(true);
  }
}

function playSound(type) {
  const sounds = {
    coin: 'coin.wav',
    damage: 'damage.wav',
    key: 'key.wav',
    door: 'door.wav',
    win: 'win.wav',
    gameover: 'gameover.wav'
  };

  const audio = new Audio(`assets/${sounds[type]}`);
  audio.volume = 0.3;
  audio.play();
}

function saveGame() {
  const data = {
    map,
    player,
    enemies
  };
  localStorage.setItem('dungeonGameSave', JSON.stringify(data));
  alert('Game saved!');
}

function loadGame() {
  const data = localStorage.getItem('dungeonGameSave');
  if (!data) return alert('No saved game.');
  const parsed = JSON.parse(data);
  map = parsed.map;
  player = parsed.player;
  enemies = parsed.enemies;
  updateStats();
}

function gameOver(won) {
  document.removeEventListener('keydown', handleMove);
  document.getElementById('overlay').style.display = 'block';
  document.getElementById('overlay').textContent = won ? '🎉 You Win!' : '💀 Game Over';
  playSound(won ? 'win' : 'gameover');
  cancelAnimationFrame(loopId);
}

function gameLoop() {
  draw();
  moveEnemies();
  loopId = requestAnimationFrame(gameLoop);
}

updateStats();
gameLoop();
