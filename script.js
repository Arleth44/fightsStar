const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const msg = document.getElementById("msg");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const levelEl = document.getElementById("level");

let ship, bullets, enemies, ebullets, score, lives, level, running;

function resetGame() {
  ship = { x: canvas.width / 2 - 16, y: canvas.height - 80, w: 32, h: 28, speed: 280, inv: 0 };
  bullets = [];
  enemies = [];
  ebullets = [];
  score = 0;
  lives = 3;
  level = 1;
  running = true;
  spawnEnemies();
  updateHUD();
}

function spawnEnemies() {
  const cols = 7, rows = 3 + Math.min(4, level - 1);
  const gapX = 56, gapY = 46;
  const offX = (canvas.width - (cols - 1) * gapX) / 2 - 14;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      enemies.push({ x: offX + c * gapX, y: 80 + r * gapY, w: 28, h: 22, alive: true, t: 0 });
    }
  }
}

const keys = {};
document.addEventListener("keydown", (e) => (keys[e.key] = true));
document.addEventListener("keyup", (e) => (keys[e.key] = false));

function update(dt) {
  if (!running) return;
  if (ship.inv > 0) ship.inv -= dt;

  // Movimiento nave
  if (keys["ArrowLeft"] || keys["a"]) ship.x -= ship.speed * dt;
  if (keys["ArrowRight"] || keys["d"]) ship.x += ship.speed * dt;
  ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));

  // Disparo
  if ((keys[" "] || keys["Spacebar"]) && bullets.length < 10) {
    bullets.push({ x: ship.x + ship.w / 2, y: ship.y, vy: -400 });
    keys[" "] = false;
  }

  bullets.forEach((b) => (b.y += b.vy * dt));
  bullets = bullets.filter((b) => b.y > -10);

  // Movimiento enemigos
  enemies.forEach((e) => {
    e.t += dt;
    e.x += Math.sin(e.t * 2) * 0.8;
    if (Math.random() < 0.003 * level) ebullets.push({ x: e.x + e.w / 2, y: e.y + e.h, vy: 150 });
  });

  // Disparo enemigo
  ebullets.forEach((b) => (b.y += b.vy * dt));
  ebullets = ebullets.filter((b) => b.y < canvas.height + 10);

  // Colisiones jugador-enemigo
  ebullets.forEach((b) => {
    if (collide(ship, { x: b.x - 3, y: b.y - 3, w: 6, h: 6 }) && ship.inv <= 0) {
      lives--;
      ship.inv = 1.2;
      if (lives <= 0) gameOver();
      updateHUD();
      b.y = canvas.height + 100;
    }
  });

  // Colisiones balas-enemigos
  bullets.forEach((b) => {
    enemies.forEach((e) => {
      if (e.alive && collide({ x: b.x - 2, y: b.y - 6, w: 4, h: 12 }, e)) {
        e.alive = false;
        b.y = -20;
        score += 10;
        updateHUD();
      }
    });
  });

  enemies = enemies.filter((e) => e.alive);
  if (enemies.length === 0) {
    level++;
    spawnEnemies();
    updateHUD();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Nave
  if (ship.inv > 0 && Math.floor(ship.inv * 10) % 2 === 0) return;
  ctx.fillStyle = "#69e6ff";
  ctx.fillRect(ship.x, ship.y, ship.w, ship.h);

  // Balas jugador
  ctx.fillStyle = "#ffffff";
  bullets.forEach((b) => ctx.fillRect(b.x - 2, b.y - 8, 4, 8));

  // Enemigos
  ctx.fillStyle = "#ff5b6b";
  enemies.forEach((e) => ctx.fillRect(e.x, e.y, e.w, e.h));

  // Balas enemigo
  ctx.fillStyle = "#ffa1a1";
  ebullets.forEach((b) => ctx.fillRect(b.x - 2, b.y, 4, 8));
}

function collide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function updateHUD() {
  scoreEl.textContent = score;
  livesEl.textContent = lives;
  levelEl.textContent = level;
}

function gameOver() {
  running = false;
  msg.classList.remove("hidden");
  msg.querySelector(".card").innerHTML = `
    <h2>¡Game Over!</h2>
    <p>Puntuación: ${score} · Nivel: ${level}</p>
    <button id="restartBtn">Reiniciar</button>
  `;
  document.getElementById("restartBtn").addEventListener("click", startGame);
}

let last = 0;
function loop(ts) {
  const now = ts / 1000;
  const dt = now - last;
  last = now;
  update(dt);
  draw();
  if (running) requestAnimationFrame(loop);
}

function startGame() {
  msg.classList.add("hidden");
  resetGame();
  last = 0;
  requestAnimationFrame(loop);
}

startBtn.addEventListener("click", startGame);
msg.classList.remove("hidden");
