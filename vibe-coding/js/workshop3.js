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
  const TOTAL_GEARS = 5; // 仙鹤风筝共5个组件
  const gearImages = [
    "二动态仙鹤风筝1.png",
    "二动态仙鹤风筝2.png",
    "二动态仙鹤风筝3.png",
    "二动态仙鹤风筝4.png",
    "25.png",
  ];
  const gearNames = [
    "仙鹤主体",
    "仙鹤右翅",
    "仙鹤左翅",
    "仙鹤尾羽",
    "联动机构",
  ];
  const gearZIndex = {
    "二动态仙鹤风筝1.png": 10,
    "二动态仙鹤风筝2.png": 20,
    "二动态仙鹤风筝3.png": 30,
    "二动态仙鹤风筝4.png": 40,
    "25.png": 50,
  };
  // 每个组件的旋转中心 — PNG alpha 通道实测几何中心 (1920x1344画布坐标)
  const gearOrigins = {
    "二动态仙鹤风筝1.png": "996px 587px",
    "二动态仙鹤风筝2.png": "994px 765px",
    "二动态仙鹤风筝3.png": "993px 1028px",
    "二动态仙鹤风筝4.png": "1026px 564px",
    "25.png": "916px 550px",
  };
  // 动画类型: "cw"顺时针 / "ccw"逆时针 / "flap"翅膀扑动 / "none"静止
  const gearAnim = {
    "二动态仙鹤风筝1.png": ["cw", 8],
    "二动态仙鹤风筝2.png": ["cw", 4],
    "二动态仙鹤风筝3.png": ["cw", 4],
    "二动态仙鹤风筝4.png": ["none"],
    "25.png": ["none"],
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
      '<span class="emoji">🎉</span> 所有零件已就位！仙鹤风筝组装完成 <span class="emoji">🎉</span>',
    );
    showToast("🎉 太厉害了！二动态仙鹤风筝组装完成！");

    const completionBox = document.createElement("div");
    completionBox.className = "completion-box";
    completionBox.innerHTML = `
      <div class="completion-content">
        <div class="completion-image-container">
          <img src="二动态仙鹤风筝.jpg" class="completion-image" alt="二动态仙鹤风筝">
          <img src="二动态仙鹤风筝 原图‘.jpg" class="completion-image" alt="二动态仙鹤风筝原图">
        </div>
        <div class="completion-text">
          <h2 class="completion-title">二动态仙鹤风筝的设计制作</h2>
          <div class="completion-content-text">
            <p><strong>动态仙鹤风筝的灵感源自于上世纪五十年代中期，当时我们街巷每年春节都要耍"社火"，而所有"社火"的道具都由我父亲在自家院内制作。</strong></p>
            <p>我父亲曾毕业于"上海艺专"，多才多艺，精通音乐、美术、摄影、钟表、无线电等，擅长制作超大型硬翅风筝，是二三十年代西安风筝圈的"名人"。</p>
            <p>记得大约是1956年有一个"鹬蚌相争，渔翁得利"的社火项目，这套道具是我协助父亲完成的，虽说这些都是由人装扮操纵的，但那个"鹬"（仙鹤）不仅可扇动翅膀，还可转脖张嘴，受此启发，我就设想能否做一个会转脖张嘴的"仙鹤"风筝？！由于当时年令小，虽有这个想法，却没有能力，具体怎么做？还真不知道。</p>
            <p>而真正将这个想法付诸实现的，是从1986年参加潍坊第一届全国风筝邀请赛后开始的。</p>
            <p>继1988年我创制的全国第一只三动态龙之后，1989年我带去了不仅会转脖张嘴，而且还会不时发出鸣叫声的大型硬翅"仙鹤风筝"。随即被美国朋友斯考特收藏，他形象地比喻："风力不仅使这只大鸟升空飞翔，而且赋予了它的生命"。</p>
            <p>也就是在那仙鹤风筝上，我使用了五级齿轮减速装置，最慢的齿轮大约1转/分，并在这个齿轮轴上安装了一个"桃"形的凸轮，凸轮慢速转动时，逐渐拉开一个火柴盒大小的用绝缘纸做的类似手风琴的微型"风箱"，当凸轮旋转到顶点时，依靠皮筋的拉力快速压缩风箱，吹响一个玩具哨子，使仙鹤在转脖张咀的过程中，会间断发出鸣叫声，形象非常生动逼真，活灵活现。</p>
            <p>由于上述结构比较复杂，为便于大家制作，下面介绍简化版的"仙鹤风筝"，采用了两级齿轮传动及电子模拟叫声，效果不亚于上述结构。</p>
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
        "二动态仙鹤风筝1.png": 140,
        "二动态仙鹤风筝2.png": 220,
        "二动态仙鹤风筝3.png": 220,
        "二动态仙鹤风筝4.png": 180,
        "25.png": 210,
      };

      const zoom = gearZoom[src] || 300;
      const img = document.createElement("img");
      img.src = src;
      img.className = "gear-thumb";
      img.draggable = false;
      setGearPosition(img, src, zoom, 65, 50);
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
    gear.style.left = "-40px";
    gear.style.top = "-10px";
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
      } else if (anim[0] === "flap") {
        gear.style.animation = `wingFlap ${anim[1]}s ease-in-out infinite`;
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

  // 直接放置零件（tap-to-place）
  function tapToPlace(src) {
    const fileName = src.split("/").pop();
    if (placedGears.has(fileName)) {
      showToast("⚠️ 这个零件已经放过了！");
      return false;
    }

    placeOneGear(fileName);

    const dzRect = dropZone.getBoundingClientRect();
    const cx = dzRect.left + dzRect.width / 2;
    const cy = dzRect.top + dzRect.height / 2;
    spawnParticles(cx, cy, 20, "#00d4ff", 5, 1.2);
    spawnParticles(cx, cy, 15, "#c44dff", 4, 1);
    spawnParticles(cx, cy, 10, "#ffd93d", 3, 0.8);

    placedGears.add(fileName);
    updateProgress();

    const count = placedGears.size;
    const remaining = TOTAL_GEARS - count;
    if (remaining > 0) {
      const msg = "第 " + count + " 个零件就位！还差 " + remaining + " 个";
      updateStatus('<span class="emoji">⚙️</span> ' + msg);
      showToast(msg);
    }

    if (placedGears.size === TOTAL_GEARS) {
      showCelebration();
    }
    return true;
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
      tapToPlace(src);
    }

    // 清理
    activeClone.remove();
    activeClone = null;
    blueprintFrame.classList.remove("glow-active");
    updateStatus(
      '<span class="emoji">👆</span> 点击或拖拽零件 · 放置到图纸上 <span class="emoji">⚙️</span>',
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
      '<span class="emoji">👆</span> 点击或拖拽零件 · 放置到图纸上 <span class="emoji">⚙️</span>',
    );
    setTimeout(
      () => showToast("💡 点击或拖拽零件卡片放置到图纸上"),
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

    // ======== 触摸 / 点击直接放置（移动端交互） ========
    gearsSidebar.addEventListener("touchstart", function(e) {
      const card = e.target.closest(".gear-card");
      if (!card) return;
      e.preventDefault();

      const src = card.getAttribute("data-src");
      const placed = tapToPlace(src);
      if (placed) {
        card.style.transform = "scale(0.9)";
        setTimeout(function() { card.style.transform = ""; }, 150);
      } else {
        card.style.transform = "translateX(-6px)";
        setTimeout(function() {
          card.style.transform = "translateX(6px)";
          setTimeout(function() { card.style.transform = ""; }, 100);
        }, 100);
      }
    });

    gearsSidebar.addEventListener("click", function(e) {
      const card = e.target.closest(".gear-card");
      if (!card) return;
      if (isDragging) return;
      const src = card.getAttribute("data-src");
      tapToPlace(src);
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
