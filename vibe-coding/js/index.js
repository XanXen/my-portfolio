(function () {
  // ==================== DOM ====================
  const cardsRow = document.getElementById("cardsRow");
  const handCursor = document.getElementById("handCursor");
  const statusBanner = document.getElementById("statusBanner");
  const toastContainer = document.getElementById("toastContainer");
  const particleCanvas = document.getElementById("particleCanvas");
  const ctx2d = particleCanvas.getContext("2d");

  // ==================== 弹簧光标 ====================
  let targetX = window.innerWidth / 2,
    targetY = window.innerHeight / 2;
  let cursorX = targetX,
    cursorY = targetY;
  let velX = 0,
    velY = 0;
  const SPRING = 0.28;
  const DAMPING = 0.72;

  let isGrabbing = false;
  let navigationLocked = false;

  // ==================== Toast ====================
  function showToast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, 3000);
  }

  // ==================== 粒子 ====================
  const particles = [];
  const MAX_PARTICLES = 60;

  function spawnParticles(x, y, count, color, spread, life) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 0.7 + 0.3) * spread;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 2,
        life: life * (0.6 + Math.random() * 0.4),
        maxLife: life,
        color, size: Math.random() * 3 + 1.5,
      });
    }
    if (particles.length > MAX_PARTICLES) {
      particles.splice(0, particles.length - MAX_PARTICLES);
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawParticles() {
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx2d.beginPath();
      ctx2d.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx2d.fillStyle = p.color.replace("1)", `${alpha})`).replace("rgb", "rgba");
      if (p.color.startsWith("#")) {
        ctx2d.fillStyle = p.color;
        ctx2d.globalAlpha = alpha;
      }
      ctx2d.fill();
      ctx2d.globalAlpha = 1;
    }
  }

  // 环境粒子
  const ambientParticles = [];
  for (let i = 0; i < 30; i++) {
    ambientParticles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3 - 0.15,
      opacity: Math.random() * 0.4 + 0.1,
      phase: Math.random() * Math.PI * 2,
    });
  }

  function drawAmbientParticles(time) {
    for (const ap of ambientParticles) {
      ap.x += ap.speedX;
      ap.y += ap.speedY;
      if (ap.x < -10) ap.x = window.innerWidth + 10;
      if (ap.x > window.innerWidth + 10) ap.x = -10;
      if (ap.y < -10) ap.y = window.innerHeight + 10;
      if (ap.y > window.innerHeight + 10) ap.y = -10;
      const flicker = ap.opacity * (0.6 + 0.4 * Math.sin(time * 0.002 + ap.phase));
      ctx2d.beginPath();
      ctx2d.arc(ap.x, ap.y, ap.size, 0, Math.PI * 2);
      ctx2d.fillStyle = `rgba(140,160,220,${flicker})`;
      ctx2d.fill();
    }
  }

  // ==================== 卡片高亮 ====================
  function highlightNearestCard(hx, hy) {
    const cards = cardsRow.querySelectorAll(".card");
    let nearest = null;
    let minDist = Infinity;

    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(hx - cx, hy - cy);
      if (dist < minDist) { minDist = dist; nearest = card; }
    });

    cards.forEach((c) => c.classList.remove("highlight"));
    if (nearest && minDist < 200) {
      nearest.classList.add("highlight");
    }
  }

  // ==================== 获取光标下的卡片 ====================
  function getCardUnder(x, y) {
    handCursor.style.display = "none";
    const el = document.elementFromPoint(x, y);
    handCursor.style.display = "block";
    if (el) {
      const card = el.closest(".card");
      return card;
    }
    return null;
  }

  // ==================== 导航 ====================
  function navigateTo(target) {
    if (navigationLocked) return;
    if (target === "#" || !target) return;

    navigationLocked = true;

    // 爆发粒子
    spawnParticles(cursorX, cursorY, 40, "#8cb4ff", 8, 2);
    spawnParticles(cursorX, cursorY, 30, "#c8a0ff", 6, 1.5);

    statusBanner.innerHTML = "✨ 正在进入...";
    showToast("🚀 进入动态风筝的数字工坊实践");

    setTimeout(() => {
      window.location.href = target;
    }, 600);
  }

  // ==================== 主循环 ====================
  let lastTime = performance.now();

  function loop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    // 弹簧物理
    const fx = (targetX - cursorX) * SPRING;
    const fy = (targetY - cursorY) * SPRING;
    velX = (velX + fx) * DAMPING;
    velY = (velY + fy) * DAMPING;
    cursorX += velX;
    cursorY += velY;

    handCursor.style.left = cursorX + "px";
    handCursor.style.top = cursorY + "px";

    updateParticles(dt);

    // 渲染
    resizeCanvas();
    ctx2d.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    drawAmbientParticles(time);
    drawParticles();

    requestAnimationFrame(loop);
  }

  function resizeCanvas() {
    if (particleCanvas.width !== window.innerWidth || particleCanvas.height !== window.innerHeight) {
      particleCanvas.width = window.innerWidth;
      particleCanvas.height = window.innerHeight;
    }
  }

  // ==================== MediaPipe 手势识别 ====================
  const videoElement = document.getElementById("webcam");

  function isFist(landmarks) {
    const getDist = (p1, p2) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    const wrist = landmarks[0];
    let folded = 0;
    [8, 12, 16, 20].forEach((tipIdx) => {
      const mcpIdx = tipIdx - 3;
      if (getDist(landmarks[tipIdx], wrist) < getDist(landmarks[mcpIdx], wrist)) {
        folded++;
      }
    });
    return folded >= 3;
  }

  function onResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const lm = results.multiHandLandmarks[0];
      const cp = lm[9]; // 中指 MCP

      const rawX = (1 - cp.x) * window.innerWidth;
      const rawY = cp.y * window.innerHeight;
      targetX = rawX;
      targetY = rawY;

      const grabbing = isFist(lm);

      if (grabbing) {
        handCursor.classList.add("grabbing");
        if (!isGrabbing) {
          isGrabbing = true;
          // 检查光标下的卡片
          const card = getCardUnder(cursorX, cursorY);
          if (card) {
            const target = card.getAttribute("data-target");
            spawnParticles(cursorX, cursorY, 15, "#8cb4ff", 4, 0.8);
            statusBanner.innerHTML = "✊ 握拳！正在进入...";
            if (target && target.endsWith(".html")) {
              navigateTo(target);
            } else {
              showToast("🔧 该功能即将上线，敬请期待！");
            }
          }
        }
      } else {
        handCursor.classList.remove("grabbing");
        if (isGrabbing) {
          isGrabbing = false;
          statusBanner.innerHTML = "👋 将手移到卡片上方 · 握拳进入";
        }
        highlightNearestCard(cursorX, cursorY);
      }
    }
  }

  // ==================== 鼠标支持 ====================
  function setupMouseSupport() {
    document.addEventListener("mousemove", (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isGrabbing) {
        highlightNearestCard(cursorX, cursorY);
      }
    });

    // 鼠标点击卡片 → 模拟握拳抓取
    cardsRow.addEventListener("click", (e) => {
      const card = e.target.closest(".card");
      if (!card) return;
      const target = card.getAttribute("data-target");
      if (target && target.endsWith(".html")) {
        handCursor.classList.add("grabbing");
        statusBanner.innerHTML = "✊ 握拳！正在进入...";
        navigateTo(target);
        setTimeout(() => {
          handCursor.classList.remove("grabbing");
        }, 600);
      } else {
        showToast("🔧 该功能即将上线，敬请期待！");
      }
    });
  }

  // ==================== 启动 ====================
  function init() {
    resizeCanvas();
    requestAnimationFrame(loop);

    statusBanner.innerHTML = "👋 将手移到卡片上方 · 握拳进入";
    setTimeout(() => showToast("💡 将手移到卡片上方，握拳即可进入"), 800);

    // MediaPipe
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });
    hands.onResults(onResults);

    const camera = new Camera(videoElement, {
      onFrame: async () => { await hands.send({ image: videoElement }); },
      width: 640,
      height: 480,
    });
    camera.start().catch(() => {
      statusBanner.innerHTML = "⚠️ 摄像头未启用 — 点击卡片即可进入";
      showToast("⚠️ 摄像头未检测到，可使用鼠标点击");
    });
  }

  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("resize", resizeCanvas);
})();
