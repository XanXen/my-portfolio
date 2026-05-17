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
  const TOTAL_GEARS = 7; // 左右眼合并为一组，共7组
  const gearImages = [
    "37.png",
    "龙头动态（上）.png",
    "龙头动态工坊1.png",
    "8e42d139c9fddbd2415dc55639c63998.png",
    "龙头动态齿轮（中）.png",
    "龙头动态（中下）.png",
    "eyes", // 左右眼合并
  ];
  const gearNames = [
    "底部风轮",
    "上部连杆",
    "龙头框架",
    "上部齿轮",
    "中心齿轮",
    "中下传动",
    "龙眼机构",
  ];
  const gearZIndex = {
    "37.png": 10,
    "龙头动态（上）.png": 20,
    "龙头动态工坊1.png": 30,
    "8e42d139c9fddbd2415dc55639c63998.png": 35,
    "龙头动态齿轮（中）.png": 40,
    "龙头动态（中下）.png": 50,
    "龙头动态工坊（左眼）2.png": 60,
    "龙头动态工坊（右眼）3.png": 60,
  };
  // 每个组件的旋转中心 — 精确定位到图形几何中心 (1920x1344画布坐标)
  const gearOrigins = {
    "37.png": "960px 1034px",
    "龙头动态（上）.png": "962px 334px",
    "龙头动态工坊1.png": "956px 444px",
    "8e42d139c9fddbd2415dc55639c63998.png": "962px 337px",
    "龙头动态齿轮（中）.png": "962px 719px",
    "龙头动态（中下）.png": "962px 856px",
    "龙头动态工坊（左眼）2.png": "737px 504px",
    "龙头动态工坊（右眼）3.png": "1191px 505px",
  };
  // 动画类型: "cw"顺时针 / "ccw"逆时针 / "wave"波浪 / "none"静止 / "eye"眼球摆动
  const gearAnim = {
    "37.png": ["cw", 8],
    "龙头动态（上）.png": ["none"],
    "龙头动态工坊1.png": ["flow", 4],
    "8e42d139c9fddbd2415dc55639c63998.png": ["ccw", 6],
    "龙头动态齿轮（中）.png": ["ccw", 5],
    "龙头动态（中下）.png": ["cw", 5],
    "龙头动态工坊（左眼）2.png": ["eye", 4],
    "龙头动态工坊（右眼）3.png": ["eye", 4],
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
      '<span class="emoji">🎉</span> 所有零件已就位！龙头机构启动 <span class="emoji">🎉</span>',
    );
    showToast("🎉 太厉害了！龙头动态机构组装完成！");

    const completionBox = document.createElement("div");
    completionBox.className = "completion-box";
    completionBox.innerHTML = `
      <div class="completion-content">
        <div class="completion-image-container">
          <img src="龙头动态工坊完成后.jpg" class="completion-image completion-image-single" alt="九动态龙头风筝">
        </div>
        <div class="completion-text">
          <h2 class="completion-title">九动态龙头的设计制作</h2>
          <div class="completion-content-text">
            <p><strong>1988年潍坊第三届全国风筝邀请赛时，我带去了全国首创的有三处部位会活动的中型龙风筝：动力是依靠龙腮旁的一对风动轮，经齿轮传动，带动龙双眼球左右转动，下巴开合，舌可伸缩并伴有上下运动。在当时引起空前轰动，并以工艺，放飞绝对第一的成绩领先第二名11.2分，为西安队夺得中型龙金牌。</strong></p>
            <p>竞赛结束后，这件龙风筝随即被加拿大朋友收藏，后被印制成加拿大邮票。</p>
            <p>随后，我不断对龙头进行改进，将三处部位会变化活动增加到4~5处会动：眼，眉，舌，下巴，龙须等。</p>
            <p>但是龙腿旁的风动轮影响到龙头的造型，我又巧妙地采用了球形风动轮含在龙口中作为动力源，不仅实现了之前的5部位动态，而且将动态部位增加到9处，其动态部位如下：</p>
            <p>1，双眼珠同步左右转动：2，双眉竖起落下；3，下巴开合；4，龙舌不仅前后，上下运动，而且同时左右舔动；5，龙耳前后扇动；6，长须大幅度摆动；7，龙两腮扇动；8，鼻毛伸出缩回；9，龙口中球珠。</p>
            <p>由于采用了三级齿轮减速，球珠每转约21转时，其它所有动作就完成了一个循环，在2.5至3级风力下，所有动作快慢比较适中，非常协调。</p>
            <p>这件龙头除去齿轮是薄胶木板制作，齿轮轴等处采用不锈钢丝，薄铝皮，细铜丝外，整体骨架全部用竹条弯制。</p>
            <p>为了照顾龙头的造型，同时满足龙口内球形风轮的转动，还不防碍舌头，下巴的活动。为此，竹制的齿轮夹板采用了水平弯曲的结构。</p>
            <p>受到龙头造型外壳的限制，为满足9处部位会活动，专门设计了上下双曲轴及异形连杆的特殊多层结构。</p>
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

  // ==================== 齿轮卡片定位 ====================
  // 根据 gearOrigins 里的组件中心坐标，把图片的指定点位对准卡片/槽位的中心
  function setGearPosition(img, key, zoomPct, targetCX, targetCY) {
    const origin = gearOrigins[key];
    if (!origin) return;
    const [ox, oy] = origin.split(" ").map(v => parseInt(v));
    const cxPct = ox / 1920; // 组件中心在图片中的横向百分比
    const cyPct = oy / 1344; // 纵向百分比

    const cardW = 130;  // 卡片宽度 (px)，与 CSS .gear-card 同步
    const cardH = 100;  // 卡片高度 (px)
    const imgW = cardW * (zoomPct / 100);   // 图片实际渲染宽度
    const imgH = imgW * (2481 / 3544);      // 保持原始宽高比

    const componentX = cxPct * imgW; // 组件中心在渲染图片上的 X
    const componentY = cyPct * imgH; // 组件中心在渲染图片上的 Y

    const leftPx = targetCX - componentX;
    const topPx  = targetCY - componentY;
    const leftPct = (leftPx / cardW) * 100;
    const topPct  = (topPx / cardH) * 100;

    img.style.left = `${leftPct.toFixed(1)}%`;
    img.style.top  = `${topPct.toFixed(1)}%`;
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

      // 不同组件在画布中的占比差异很大，按需调缩放
      const gearZoom = {
        "37.png": 200,
        "龙头动态（上）.png": 180,
      };

      if (src === "eyes") {
        // 龙眼卡片：左右眼各占半区，分别定位到眼眶中心
        const leftEye = document.createElement("img");
        leftEye.src = "龙头动态工坊（左眼）2.png";
        leftEye.className = "gear-thumb eye-left";
        leftEye.draggable = false;
        setGearPosition(leftEye, "龙头动态工坊（左眼）2.png", 250, 32.5, 50);
        card.appendChild(leftEye);

        const rightEye = document.createElement("img");
        rightEye.src = "龙头动态工坊（右眼）3.png";
        rightEye.className = "gear-thumb eye-right";
        rightEye.draggable = false;
        setGearPosition(rightEye, "龙头动态工坊（右眼）3.png", 250, 97.5, 50);
        card.appendChild(rightEye);
      } else {
        const zoom = gearZoom[src] || 300;
        const img = document.createElement("img");
        img.src = src;
        img.className = "gear-thumb";
        img.draggable = false;
        setGearPosition(img, src, zoom, 65, 50);
        card.appendChild(img);
      }

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
    activeClone.src = src === "eyes" ? "龙头动态工坊（左眼）2.png" : src;
    activeClone.className = "gear-clone";
    document.body.appendChild(activeClone);
    moveClone(x, y);
    spawnParticles(x, y, 12, "#c44dff", 3, 0.8);
    spawnParticles(x, y, 8, "#ff6b9d", 2.5, 0.6);
    updateStatus(
      '<span class="emoji">✊</span> 已抓取零件！移动到图纸上方...',
    );
  }

  function moveClone(x, y) {
    if (!activeClone) return;
    activeClone.style.left = x - 960 + "px";
    activeClone.style.top = y - 672 + "px";
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

  // 放置单个齿轮到图纸上
  function placeOneGear(imgSrc) {
    const gear = document.createElement("img");
    gear.src = imgSrc;
    gear.className = "placed-gear";
    gear.style.left = "0px";
    gear.style.top = "-20px";
    gear.style.zIndex = gearZIndex[imgSrc] || 10;
    gear.draggable = false;

    // 设置该组件的旋转中心
    if (gearOrigins[imgSrc]) {
      gear.style.transformOrigin = gearOrigins[imgSrc];
    }

    // 入场动画
    gear.style.animation =
      "gearSnapIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards";

    const anim = gearAnim[imgSrc];
    const onSnapEnd = () => {
      gear.style.animation = "";
      if (!anim || anim[0] === "none") {
        // 静止，不添加任何动画
      } else if (anim[0] === "cw") {
        gear.style.animation = `spin ${anim[1]}s linear infinite normal`;
      } else if (anim[0] === "ccw") {
        gear.style.animation = `spin ${anim[1]}s linear infinite reverse`;
      } else if (anim[0] === "wave") {
        gear.style.animation = `wave ${anim[1]}s ease-in-out infinite`;
      } else if (anim[0] === "eye") {
        gear.style.animation = `eyeOscillate ${anim[1]}s ease-in-out infinite`;
      } else if (anim[0] === "flow") {
        gear.classList.add("flow-active");
      }
      gear.removeEventListener("animationend", onSnapEnd);
    };
    gear.addEventListener("animationend", onSnapEnd);

    dropZone.appendChild(gear);
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
      const fileName = src.split("/").pop();
      if (placedGears.has(fileName)) {
        showToast("⚠️ 这个零件已经放过了！");
      } else {
        // 龙眼卡片：同时放置左眼和右眼
        if (fileName === "eyes") {
          placeOneGear("龙头动态工坊（左眼）2.png");
          placeOneGear("龙头动态工坊（右眼）3.png");
        } else {
          placeOneGear(fileName);
        }

        // 放置粒子爆发
        spawnParticles(x, y, 20, "#00d4ff", 5, 1.2);
        spawnParticles(x, y, 15, "#c44dff", 4, 1);
        spawnParticles(x, y, 10, "#ffd93d", 3, 0.8);

        placedGears.add(fileName);
        updateProgress();

        // 进度反馈
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

    // 清理
    activeClone.remove();
    activeClone = null;
    blueprintFrame.classList.remove("glow-active");
    updateStatus(
      '<span class="emoji">👋</span> 握拳抓取零件 · 松手放置图纸 <span class="emoji">👋</span>',
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
      '<span class="emoji">👋</span> 握拳抓取零件 · 松手放置图纸 <span class="emoji">👋</span>',
    );
    setTimeout(
      () => showToast("💡 将手移到左侧零件上方，握拳即可抓取"),
      800,
    );
    setupMouseSupport();

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
