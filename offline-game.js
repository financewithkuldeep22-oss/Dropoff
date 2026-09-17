// Offline Runner Mini-Game for Drop-off Operations Dashboard
(function() {
  const canvas = document.getElementById('offline-game-canvas');
  const overlay = document.getElementById('offline-overlay');
  const startScreen = document.getElementById('offline-game-start');
  const scoreEl = document.getElementById('offline-game-score');

  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let isPlaying = false;
  let score = 0;
  let animationId = null;
  let speed = 4;
  let obstacles = [];
  let nextObstacleCounter = 60;

  const player = {
    x: 40,
    y: 140,
    width: 24,
    height: 32,
    dy: 0,
    gravity: 0.7,
    jumpPower: -11,
    groundY: 140,
    isJumping: false
  };

  function resetGame() {
    score = 0;
    speed = 4;
    obstacles = [];
    nextObstacleCounter = 40;
    player.y = player.groundY;
    player.dy = 0;
    player.isJumping = false;
    if (scoreEl) scoreEl.textContent = '0';
  }

  function jump() {
    if (!isPlaying) {
      startGame();
      return;
    }
    if (!player.isJumping) {
      player.dy = player.jumpPower;
      player.isJumping = true;
    }
  }

  function startGame() {
    if (isPlaying) return;
    resetGame();
    isPlaying = true;
    if (startScreen) startScreen.style.display = 'none';
    loop();
  }

  function stopGame() {
    isPlaying = false;
    if (animationId) cancelAnimationFrame(animationId);
    if (startScreen) {
      startScreen.style.display = 'flex';
      const label = startScreen.querySelector('span:last-child');
      if (label) label.textContent = `Game Over! Score: ${score} - Press SPACE to Retry`;
    }
  }

  function loop() {
    if (!isPlaying) return;
    update();
    draw();
    animationId = requestAnimationFrame(loop);
  }

  function update() {
    // Player physics
    player.dy += player.gravity;
    player.y += player.dy;
    if (player.y >= player.groundY) {
      player.y = player.groundY;
      player.dy = 0;
      player.isJumping = false;
    }

    // Score & speed progression
    score++;
    if (scoreEl && score % 5 === 0) {
      scoreEl.textContent = Math.floor(score / 5);
    }
    if (score % 400 === 0 && speed < 9) {
      speed += 0.5;
    }

    // Obstacle generation
    nextObstacleCounter--;
    if (nextObstacleCounter <= 0) {
      const h = 20 + Math.random() * 25;
      obstacles.push({
        x: canvas.width + 20,
        y: 172 - h,
        width: 16,
        height: h
      });
      nextObstacleCounter = Math.floor(55 + Math.random() * 45);
    }

    // Move obstacles & check collision
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      ob.x -= speed;

      // Collision detection (AABB)
      if (
        player.x + 4 < ob.x + ob.width &&
        player.x + player.width - 4 > ob.x &&
        player.y + 2 < ob.y + ob.height &&
        player.y + player.height > ob.y
      ) {
        stopGame();
        return;
      }

      // Cleanup off-screen
      if (ob.x + ob.width < -10) {
        obstacles.splice(i, 1);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background gradient
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ground line
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 172);
    ctx.lineTo(canvas.width, 172);
    ctx.stroke();

    // Player (Diagnostic Blood Sample Tube)
    // Tube glass
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y + 6, player.width, player.height - 6, [0, 0, 8, 8]);
    ctx.fill();

    // Tube red blood fill
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(player.x + 2, player.y + 14, player.width - 4, player.height - 18, [0, 0, 6, 6]);
    ctx.fill();

    // Tube purple vacutainer cap
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(player.x - 1, player.y, player.width + 2, 7);

    // Draw Obstacles (Hazard cones / coolers)
    ctx.fillStyle = '#f59e0b';
    obstacles.forEach(ob => {
      ctx.beginPath();
      ctx.roundRect(ob.x, ob.y, ob.width, ob.height, 3);
      ctx.fill();

      // Cone stripes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ob.x, ob.y + Math.floor(ob.height * 0.4), ob.width, 4);
      ctx.fillStyle = '#f59e0b';
    });
  }

  // Event Listeners
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      if (overlay && overlay.style.display !== 'none') {
        e.preventDefault();
        jump();
      }
    }
  });

  if (startScreen) {
    startScreen.addEventListener('click', () => jump());
  }
  canvas.addEventListener('click', () => jump());

  // Online / Offline monitor
  function checkNetworkState() {
    if (!navigator.onLine) {
      if (overlay) {
        overlay.style.display = 'flex';
        setTimeout(() => { overlay.style.opacity = '1'; }, 10);
      }
    } else {
      if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => { overlay.style.display = 'none'; }, 300);
      }
      if (isPlaying) stopGame();
    }
  }

  window.addEventListener('offline', checkNetworkState);
  window.addEventListener('online', checkNetworkState);
  // Initial check (in case page loaded without internet)
  if (!navigator.onLine) checkNetworkState();
})();
