(function () {
  // ==================== DOM 引用 ====================
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
  const gearImages = ["1.png", "2.png", "3.png", "4.png"];
  const gearNames = ["星轨齿轮", "核心齿轮", "流光齿轮", "辉光齿轮"];
  // 图层z-index：严格按照总.png的叠加顺序（从底到顶）
  const gearZIndex = {
    "1.png": 10,
    "3.png": 20,
    "2.png": 30,
    "4.png": 40,
  };
  const placedGears = new Set(); // 记录已放置的齿轮
  let activeClone = null;
  let isDragging = false;
  let draggedSrc = null;
  let celebrationShown = false;

  // 弹簧光标物理
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
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 2,
        life: life * (0.6 + Math.random() * 0.4),
        maxLife: life,
        color,
        size: Math.random() * 4 + 1.5,
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
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  function drawParticles() {
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx2d.beginPath();
      ctx2d.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx2d.fillStyle = p.color
        .replace("1)", `${alpha})`)
        .replace("rgb", "rgba");
      if (p.color.startsWith("#")) {
        ctx2d.fillStyle = p.color;
        ctx2d.globalAlpha = alpha;
      }
      ctx2d.fill();
      ctx2d.globalAlpha = 1;
    }
  }

  // 背景环境粒子
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

      const flicker =
        ap.opacity * (0.6 + 0.4 * Math.sin(time * 0.002 + ap.phase));
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
    setTimeout(() => {
      if (el.parentNode) el.remove();
    }, 3000);
  }

  // ==================== 状态更新 ====================
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
    // 全屏粒子爆发
    spawnParticles(
      window.innerWidth / 2,
      window.innerHeight / 2,
      60,
      "#ffd93d",
      12,
      3,
    );
    spawnParticles(
      window.innerWidth / 2,
      window.innerHeight / 2,
      40,
      "#ff6b9d",
      10,
      2.5,
    );
    spawnParticles(
      window.innerWidth / 2,
      window.innerHeight / 2,
      40,
      "#c44dff",
      10,
      2.5,
    );
    spawnParticles(
      window.innerWidth / 2,
      window.innerHeight / 2,
      30,
      "#00d4ff",
      11,
      3,
    );
    updateStatus(
      '<span class="emoji">🎉</span> 所有齿轮已就位！机械共鸣启动 <span class="emoji">🎉</span>',
    );
    showToast("🎉 太厉害了！全部齿轮已就位！");

    // 添加完成后的长方形动画
    const completionBox = document.createElement("div");
    completionBox.className = "completion-box";
    completionBox.innerHTML = `
      <div class="completion-content">
        <div class="completion-image-container">
          <img src="7.png" class="completion-image" alt="动态龙风筝">
          <img src="8.png" class="completion-image" alt="小型动态龙头">
        </div>
        <div class="completion-text">
          <h2 class="completion-title">四动态龙头风筝</h2>
          <div class="completion-content-text">
            <p><strong>这个动态龙风筝，是我于1987年首创的有三处部位会动的中型龙风筝。</strong></p>
            <p>龙头两腮旁为风动轮，因为风轮转动的太快，我在风轮轴上安装了一个小齿轮，然后带动一个大齿轮将速度减慢，并在大齿轮轴的两端弯制了不同半径的曲柄，曲柄随大齿轮旋转时带动相应的三个连杆，各连杆分别连接到龙头的下巴、舌头和龙的双眼球。经过许多巧妙的机构，使龙头的下巴可以开合，龙舌可伸缩并伴有上下运动。</p>
            <p>尤其是将传统风吹转眼创造性地改变为左右转动，使龙头一下活灵话现，首次赋与了龙风筝新的生命。</p>
            <p>这件动态龙风筝，1988年参加第三届全国风筝邀请赛期间，获得工艺、放飞两项第一，随即被加拿大朋友收藏，后被印制成加拿大邮票。</p>
            <p>下面介绍的小型动态龙头，是在原三个动作的基础上又增加了一个龙的双眉可竖起落下共四处部位会活动的龙头。</p>
          </div>
          <a href="index.html" class="completion-back-btn">返回首页</a>
          <div class="key-hint">按 F 键返回</div>
        </div>
      </div>
    `;
    document.body.appendChild(completionBox);

    // 停顿3秒后再触发动画
    setTimeout(() => {
      completionBox.classList.add("active");
    }, 3000);
  }

  function hideCelebration() {
    celebrationShown = false;
    celebration.classList.remove("active");
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
    // 抓取粒子
    spawnParticles(x, y, 12, "#c44dff", 3, 0.8);
    spawnParticles(x, y, 8, "#ff6b9d", 2.5, 0.6);
    updateStatus(
      '<span class="emoji">✊</span> 已抓取齿轮！移动到图纸上方...',
    );
  }

  function moveClone(x, y) {
    if (!activeClone) return;
    activeClone.style.left = x - 960 + "px";
    activeClone.style.top = y - 540 + "px";
  }

  function checkProximity(x, y) {
    if (!activeClone) return;
    const frameRect = blueprintFrame.getBoundingClientRect();
    const isNear =
      x > frameRect.left &&
      x < frameRect.right &&
      y > frameRect.top &&
      y < frameRect.bottom;
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
    if (
      x > dzRect.left &&
      x < dzRect.right &&
      y > dzRect.top &&
      y < dzRect.bottom
    ) {
      // 同一个齿轮不重复放置
      const fileName = src.split("/").pop();
      if (placedGears.has(fileName)) {
        showToast("⚠️ 这个齿轮已经放过了！");
      } else {
        const gear = document.createElement("img");
        gear.src = src;
        gear.className = "placed-gear";
        gear.style.left = "0px";
        gear.style.top = "0px";
        gear.style.zIndex = gearZIndex[fileName] || 10;
        gear.draggable = false;

        // 先播放入场动画
        gear.style.animation =
          "gearSnapIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards";

        // 动画结束后切换为旋转动画
        const onSnapEnd = () => {
          gear.style.animation = "";
          if (src.includes("1.png") || src.includes("2.png")) {
            gear.classList.add("rotating");
          }
          if (src.includes("3.png")) {
            gear.classList.add("rotating-reverse");
            gear.style.transformOrigin = "890px 250px";
          }
          gear.removeEventListener("animationend", onSnapEnd);
        };
        gear.addEventListener("animationend", onSnapEnd);

        dropZone.appendChild(gear);

        // 放置粒子爆发
        spawnParticles(x, y, 20, "#00d4ff", 5, 1.2);
        spawnParticles(x, y, 15, "#c44dff", 4, 1);
        spawnParticles(x, y, 10, "#ffd93d", 3, 0.8);

        placedGears.add(fileName);
        updateProgress();

        // 进度反馈
        const count = placedGears.size;
        const remaining = 4 - count;
        if (remaining > 0) {
          const msg = `第 ${count} 个齿轮就位！还差 ${remaining} 个`;
          updateStatus(`<span class="emoji">⚙️</span> ${msg}`);
          showToast(msg);
        }

        // 4个齿轮全部就位才触发庆祝
        if (placedGears.size === 4) {
          showCelebration();
        }
      }
    }

    // 清理
    activeClone.remove();
    activeClone = null;
    blueprintFrame.classList.remove("glow-active");
    updateStatus(
      '<span class="emoji">👋</span> 握拳抓取齿轮 · 松手放置图纸 <span class="emoji">👋</span>',
    );
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

    // 弹簧光标物理
    const fx = (targetX - cursorX) * SPRING;
    const fy = (targetY - cursorY) * SPRING;
    velX = (velX + fx) * DAMPING;
    velY = (velY + fy) * DAMPING;
    cursorX += velX;
    cursorY += velY;

    // 更新光标 DOM
    handCursor.style.left = cursorX + "px";
    handCursor.style.top = cursorY + "px";

    // 光标拖尾
    if (isDragging && time - lastTrailTime > 40) {
      spawnTrailRing(cursorX, cursorY);
      lastTrailTime = time;
    }

    // 粒子物理
    updateParticles(dt);

    // 渲染
    resizeCanvas();
    ctx2d.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    drawAmbientParticles(time);
    drawParticles();

    requestAnimationFrame(loop);
  }

  function resizeCanvas() {
    if (
      particleCanvas.width !== window.innerWidth ||
      particleCanvas.height !== window.innerHeight
    ) {
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
      if (dist < minDist) {
        minDist = dist;
        nearest = card;
      }
    });

    cards.forEach((c) => c.classList.remove("highlight"));
    if (nearest && minDist < 240) {
      nearest.classList.add("highlight");
    }
  }

  // ==================== MediaPipe 手势识别 ====================
  const videoElement = document.getElementById("webcam");

  function isFist(landmarks) {
    const getDist = (p1, p2) =>
      Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    const wrist = landmarks[0];
    let folded = 0;
    [8, 12, 16, 20].forEach((tipIdx) => {
      const mcpIdx = tipIdx - 3;
      if (
        getDist(landmarks[tipIdx], wrist) <
        getDist(landmarks[mcpIdx], wrist)
      ) {
        folded++;
      }
    });
    return folded >= 3;
  }

  function onResults(results) {
    if (
      results.multiHandLandmarks &&
      results.multiHandLandmarks.length > 0
    ) {
      const lm = results.multiHandLandmarks[0];
      const cp = lm[9]; // 中指 MCP

      // 镜像映射
      const rawX = (1 - cp.x) * window.innerWidth;
      const rawY = cp.y * window.innerHeight;

      targetX = rawX;
      targetY = rawY;

      const grabbing = isFist(lm);

      if (grabbing) {
        handCursor.classList.add("grabbing");
        if (!isDragging) {
          // 检测手指下方的齿轮卡片
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
        // 非抓取时高亮最近卡片
        highlightNearestCard(cursorX, cursorY);
      }
    }
  }

  // ==================== 启动 ====================
  function init() {
    createGearCards();
    resizeCanvas();
    requestAnimationFrame(loop);

    // 入场动画
    updateStatus(
      '<span class="emoji">👋</span> 握拳抓取齿轮 · 松手放置图纸 <span class="emoji">👋</span>',
    );
    setTimeout(
      () => showToast("💡 将手移到右侧齿轮上方，握拳即可抓取"),
      800,
    );

    // MediaPipe
    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });
    hands.onResults(onResults);

    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 640,
      height: 480,
    });
    camera.start().catch(() => {
      updateStatus(
        '<span class="emoji">⚠️</span> 摄像头未启用 — 可使用鼠标模拟体验',
      );
      showToast("⚠️ 摄像头未检测到，请检查权限设置");
    });
  }

  // ==================== 鼠标支持 ====================
  function setupMouseSupport() {
    // 鼠标移动 → 更新弹簧光标目标位置
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

    // 鼠标按下齿轮卡片 → 开始拖拽
    gearsSidebar.addEventListener("mousedown", (e) => {
      const card = e.target.closest(".gear-card");
      if (!card || isDragging) return;
      e.preventDefault();

      const src = card.getAttribute("data-src");
      isDragging = true;
      draggedSrc = src;
      handCursor.classList.add("grabbing");
      startDragging(cursorX, cursorY, src);
      updateStatus(
        '<span class="emoji">✊</span> 已抓取齿轮！移动到图纸上方...',
      );
    });

    // 鼠标释放 → 放置齿轮
    document.addEventListener("mouseup", () => {
      if (!isDragging) return;

      handCursor.classList.remove("grabbing");
      finishDragging(cursorX, cursorY, draggedSrc);
      isDragging = false;
      draggedSrc = null;
    });
  }

  // ==================== 键盘快捷键 ====================
  window.addEventListener("keydown", (e) => {
  });

  // ==================== 窗口事件 ====================
  window.addEventListener("resize", resizeCanvas);

  // 快捷键 F → 返回首页（仅在完成画面显示时）
  document.addEventListener("keydown", (e) => {
    if ((e.key === "f" || e.key === "F") && celebrationShown) {
      if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
        window.location.href = "index.html";
      }
    }
  });

  document.addEventListener("DOMContentLoaded", init);
})();
