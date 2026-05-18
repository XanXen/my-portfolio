(function () {
  const gearsSidebar = document.getElementById("gearsSidebar");
  const dropZone = document.getElementById("dropZone");
  const blueprintFrame = document.getElementById("blueprintFrame");
  const handCursor = document.getElementById("handCursor");
  const statusBanner = document.getElementById("statusBanner");
  const progressBar = document.getElementById("progressBar");
  const toastContainer = document.getElementById("toastContainer");
  const celebration = document.getElementById("celebrationOverlay");
  const particleCanvas = document.getElementById("particleCanvas");
  const ctx2d = particleCanvas.getContext("2d");

  // ==================== 状态 ====================
  const gearImages = [
    "37.png",
    "龙头动态（上）.png",
    "龙头动态工坊1.png",
    "龙头动态齿轮（中）.png",
    "龙头动态（中下）.png",
    "龙头动态工坊（左眼）2.png",
    "龙头动态工坊（右眼）3.png",
  ];
  const gearNames = [
    "底部风轮",
    "上部连杆",
    "龙头框架",
    "中心齿轮",
    "中下传动",
    "左眼机构",
    "右眼机构",
  ];
  const gearZIndex = {
    "37.png": 10,
    "龙头动态（上）.png": 20,
    "龙头动态工坊1.png": 30,
    "龙头动态齿轮（中）.png": 40,
    "龙头动态（中下）.png": 50,
    "龙头动态工坊（左眼）2.png": 60,
    "龙头动态工坊（右眼）3.png": 70,
  };
  const gearOrigins = {
    "37.png": "960px 1034px",
    "龙头动态（上）.png": "962px 334px",
    "龙头动态工坊1.png": "956px 444px",
    "龙头动态齿轮（中）.png": "962px 719px",
    "龙头动态（中下）.png": "962px 856px",
    "龙头动态工坊（左眼）2.png": "737px 504px",
    "龙头动态工坊（右眼）3.png": "1191px 505px",
  };
  // "cw"顺时针 / "ccw"逆时针 / "none"静止 / "eye"眼球摆动
  const gearAnim = {
    "37.png": ["cw", 8],
    "龙头动态（上）.png": ["none"],
    "龙头动态工坊1.png": ["none"],
    "龙头动态齿轮（中）.png": ["ccw", 5],
    "龙头动态（中下）.png": ["cw", 5],
    "龙头动态工坊（左眼）2.png": ["eye", 4],
    "龙头动态工坊（右眼）3.png": ["eye", 4],
  };
  const TOTAL_GEARS = gearImages.length;
  const placedGears = new Set();
  let activeClone = null;
  let isDragging = false;
  let draggedSrc = null;
  let celebrationShown = false;

  let targetX = window.innerWidth / 2,
    targetY = window.innerHeight / 2;
  let cursorX = targetX,
    cursorY = targetY;
  let velX = 0,
    velY = 0;
  const SPRING = 0.28;
  const DAMPING = 0.72;

  // ==================== 粒子系统 ====================
  const particles = [];
  const MAX_PARTICLES = 80;

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
        color, size: Math.random() * 4 + 1.5,
      });
    }
    if (particles.length > MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES);
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

  const ambientParticles = [];
  for (let i = 0; i < 35; i++) {
    ambientParticles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3 - 0.15,
      opacity: Math.random() * 0.5 + 0.15,
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
      ctx2d.fillStyle = `rgba(140,120,200,${flicker})`;
      ctx2d.fill();
    }
  }

  // ==================== Toast ====================
  function showToast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, 3000);
  }

  function updateStatus(msg) {
    statusBanner.innerHTML = msg;
  }

  function updateProgress() {
    const dots = progressBar.querySelectorAll(".progress-dot");
    dots.forEach((dot, i) => {
      if (i < placedGears.size) dot.classList.add("filled");
      else dot.classList.remove("filled");
    });
  }

  // ==================== 庆祝 ====================
  function showCelebration() {
    if (celebrationShown) return;
    celebrationShown = true;
    celebration.classList.add("active");
    spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 60, "#ffd93d", 12, 3);
    spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 40, "#ff6b9d", 10, 2.5);
    spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 40, "#c44dff", 10, 2.5);
    spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 30, "#00d4ff", 11, 3);
    updateStatus('<span class="emoji">🎉</span> 所有零件已就位！龙头机构启动 <span class="emoji">🎉</span>');
    showToast("🎉 太厉害了！龙头动态机构组装完成！");

    const completionBox = document.createElement("div");
    completionBox.className = "completion-box";
    completionBox.innerHTML = `
      <div class="completion-content">
        <div class="completion-image-container">
          <img src="7.png" class="completion-image" alt="动态龙风筝">
          <img src="8.png" class="completion-image" alt="小型动态龙头">
        </div>
        <div class="completion-text">
          <h2 class="completion-title">龙头动态工坊</h2>
          <div class="completion-content-text">
            <p><strong>龙头动态工坊展示了龙头风筝的精密机械结构。</strong></p>
            <p>龙头两腮旁为风动轮，因为风轮转动的太快，在风轮轴上安装了一个小齿轮，然后带动一个大齿轮将速度减慢，并在大齿轮轴的两端弯制了不同半径的曲柄。</p>
            <p>曲柄随大齿轮旋转时带动相应的连杆，各连杆分别连接到龙头的下巴、舌头和龙的双眼球。经过许多巧妙的机构，使龙头的下巴可以开合，龙舌可伸缩并伴有上下运动。</p>
            <p>将传统风吹转眼创造性地改变为左右转动，使龙头活灵活现，赋予了龙风筝新的生命。</p>
            <p>您刚才组装的七个零件，完整还原了这个精密的龙头动态机构——从底部齿轮的动力输入，到中心齿轮的传动，再到左右眼球的灵动转动，每一个环节都巧夺天工。</p>
          </div>
          <a href="index.html" class="completion-back-btn">返回首页</a>
          <div class="key-hint">按 F 键返回</div>
        </div>
      </div>
    `;
    document.body.appendChild(completionBox);
    setTimeout(() => { completionBox.classList.add("active"); }, 3000);
  }

  // ==================== 齿轮卡片创建 ====================
  function createGearCards() {
    gearImages.forEach((src, i) => {
      const card = document.createElement("div");
      card.className = "gear-card";
      card.setAttribute("data-src", src);

      const glow = document.createElement("div");
      glow.className = "card-glow";
      card.appendChild(glow);

      const img = document.createElement("img");
      img.src = src;
      img.className = "gear-thumb";
      img.draggable = false;
      card.appendChild(img);

      const label = document.createElement("span");
      label.className = "gear-label";
      label.textContent = gearNames[i];
      card.appendChild(label);

      gearsSidebar.appendChild(card);
    });
  }

  // ==================== 拖拽逻辑 ====================
  function startDragging(x, y, src) {
    if (activeClone) return;
    activeClone = document.createElement("img");
    activeClone.src = src;
    activeClone.className = "gear-clone";
    document.body.appendChild(activeClone);
    moveClone(x, y);
    spawnParticles(x, y, 12, "#c44dff", 3, 0.8);
    spawnParticles(x, y, 8, "#ff6b9d", 2.5, 0.6);
    updateStatus('<span class="emoji">✊</span> 已抓取零件！移动到图纸上方...');
  }

  function moveClone(x, y) {
    if (!activeClone) return;
    activeClone.style.left = x - 960 + "px";
    activeClone.style.top = y - 672 + "px";
  }

  function checkProximity(x, y) {
    if (!activeClone) return;
    const frameRect = blueprintFrame.getBoundingClientRect();
    const isNear = x > frameRect.left && x < frameRect.right && y > frameRect.top && y < frameRect.bottom;
    if (isNear) {
      activeClone.classList.add("near-blueprint");
      blueprintFrame.classList.add("glow-active");
    } else {
      activeClone.classList.remove("near-blueprint");
      blueprintFrame.classList.remove("glow-active");
    }
  }

  function finishDragging(x, y, src) {
    if (!activeClone) return;

    const dzRect = dropZone.getBoundingClientRect();
    if (x > dzRect.left && x < dzRect.right && y > dzRect.top && y < dzRect.bottom) {
      const fileName = src.split("/").pop();
      if (placedGears.has(fileName)) {
        showToast("⚠️ 这个零件已经放过了！");
      } else {
        const gear = document.createElement("img");
        gear.src = src;
        gear.className = "placed-gear";
        gear.style.left = "0px";
        gear.style.top = "0px";
        gear.style.zIndex = gearZIndex[fileName] || 10;
        gear.draggable = false;

        // 设置旋转中心
        if (gearOrigins[fileName]) {
          gear.style.transformOrigin = gearOrigins[fileName];
        }

        gear.style.animation = "gearSnapIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards";

        const anim = gearAnim[fileName];
        const onSnapEnd = () => {
          gear.style.animation = "";
          if (!anim || anim[0] === "none") {
            // 静止
          } else if (anim[0] === "cw") {
            gear.style.animation = `spin ${anim[1]}s linear infinite normal`;
          } else if (anim[0] === "ccw") {
            gear.style.animation = `spin ${anim[1]}s linear infinite reverse`;
          } else if (anim[0] === "eye") {
            gear.style.animation = `eyeOscillate ${anim[1]}s ease-in-out infinite`;
          }
          gear.removeEventListener("animationend", onSnapEnd);
        };
        gear.addEventListener("animationend", onSnapEnd);

        dropZone.appendChild(gear);

        spawnParticles(x, y, 20, "#00d4ff", 5, 1.2);
        spawnParticles(x, y, 15, "#c44dff", 4, 1);
        spawnParticles(x, y, 10, "#ffd93d", 3, 0.8);

        placedGears.add(fileName);
        updateProgress();

        const count = placedGears.size;
        const remaining = TOTAL_GEARS - count;
        if (remaining > 0) {
          const msg = `第 ${count} 个零件就位！还差 ${remaining} 个`;
          updateStatus(`<span class="emoji">⚙️</span> ${msg}`);
          showToast(msg);
        }

        if (placedGears.size === TOTAL_GEARS) {
          showCelebration();
        }
      }
    }

    activeClone.remove();
    activeClone = null;
    blueprintFrame.classList.remove("glow-active");
    updateStatus('<span class="emoji">👆</span> 点击或拖拽零件 · 放置到图纸上 <span class="emoji">⚙️</span>');
  }

  // ==================== 光标拖尾 ====================
  function spawnTrailRing(x, y) {
    const ring = document.createElement("div");
    ring.className = "cursor-trail-ring";
    ring.style.left = x + "px";
    ring.style.top = y + "px";
    ring.style.width = Math.random() * 8 + 6 + "px";
    ring.style.height = ring.style.width;
    document.body.appendChild(ring);
    setTimeout(() => ring.remove(), 500);
  }

  let lastTrailTime = 0;

  // ==================== 主循环 ====================
  let lastTime = performance.now();

  function loop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    const fx = (targetX - cursorX) * SPRING;
    const fy = (targetY - cursorY) * SPRING;
    velX = (velX + fx) * DAMPING;
    velY = (velY + fy) * DAMPING;
    cursorX += velX;
    cursorY += velY;

    handCursor.style.left = cursorX + "px";
    handCursor.style.top = cursorY + "px";

    if (isDragging && time - lastTrailTime > 40) {
      spawnTrailRing(cursorX, cursorY);
      lastTrailTime = time;
    }

    updateParticles(dt);
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

  // ==================== 高亮最近的齿轮卡片 ====================
  function highlightNearestCard(hx, hy) {
    const cards = gearsSidebar.querySelectorAll(".gear-card");
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
    if (nearest && minDist < 240) nearest.classList.add("highlight");
  }

  // ==================== MediaPipe 手势识别 ====================
  const videoElement = document.getElementById("webcam");

  function isFist(landmarks) {
    const getDist = (p1, p2) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    const wrist = landmarks[0];
    let folded = 0;
    [8, 12, 16, 20].forEach((tipIdx) => {
      const mcpIdx = tipIdx - 3;
      if (getDist(landmarks[tipIdx], wrist) < getDist(landmarks[mcpIdx], wrist)) folded++;
    });
    return folded >= 3;
  }

  function onResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const lm = results.multiHandLandmarks[0];
      const cp = lm[9];
      const rawX = (1 - cp.x) * window.innerWidth;
      const rawY = cp.y * window.innerHeight;
      targetX = rawX;
      targetY = rawY;

      const grabbing = isFist(lm);
      if (grabbing) {
        handCursor.classList.add("grabbing");
        if (!isDragging) {
          handCursor.style.display = "none";
          const elUnder = document.elementFromPoint(cursorX, cursorY);
          handCursor.style.display = "block";
          if (elUnder) {
            const card = elUnder.closest(".gear-card");
            if (card) {
              isDragging = true;
              draggedSrc = card.getAttribute("data-src");
              startDragging(cursorX, cursorY, draggedSrc);
            }
          }
        } else {
          moveClone(cursorX, cursorY);
          checkProximity(cursorX, cursorY);
        }
      } else {
        handCursor.classList.remove("grabbing");
        if (isDragging) {
          finishDragging(cursorX, cursorY, draggedSrc);
          isDragging = false;
          draggedSrc = null;
        }
        highlightNearestCard(cursorX, cursorY);
      }
    }
  }

  // ==================== 启动 ====================
  function init() {
    createGearCards();
    resizeCanvas();
    requestAnimationFrame(loop);

    updateStatus('<span class="emoji">👆</span> 点击或拖拽零件 · 放置到图纸上 <span class="emoji">⚙️</span>');
    setTimeout(() => showToast("💡 点击或拖拽零件卡片放置到图纸上"), 800);
    setupMouseSupport();

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
      updateStatus('<span class="emoji">⚠️</span> 摄像头未启用 — 可使用鼠标模拟体验');
      showToast("⚠️ 摄像头未检测到，请检查权限设置");
    });
  }

  // ==================== 鼠标支持 ====================
  function setupMouseSupport() {
    document.addEventListener("mousemove", (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (isDragging) {
        moveClone(cursorX, cursorY);
        checkProximity(cursorX, cursorY);
      } else {
        highlightNearestCard(cursorX, cursorY);
      }
    });

    gearsSidebar.addEventListener("mousedown", (e) => {
      const card = e.target.closest(".gear-card");
      if (!card || isDragging) return;
      e.preventDefault();
      const src = card.getAttribute("data-src");
      isDragging = true;
      draggedSrc = src;
      handCursor.classList.add("grabbing");
      startDragging(cursorX, cursorY, src);
    });

    document.addEventListener("mouseup", () => {
      if (!isDragging) return;
      handCursor.classList.remove("grabbing");
      finishDragging(cursorX, cursorY, draggedSrc);
      isDragging = false;
      draggedSrc = null;
    });
  }

  // 快捷键 F → 返回首页（仅在完成画面显示时）
  document.addEventListener("keydown", (e) => {
    if ((e.key === "f" || e.key === "F") && celebrationShown) {
      if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
        window.location.href = "index.html";
      }
    }
  });
  window.addEventListener("resize", resizeCanvas);
  document.addEventListener("DOMContentLoaded", init);
})();
