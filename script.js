document.addEventListener("DOMContentLoaded", function () {
    // ---- 中英文切换 ----
    let currentLang = localStorage.getItem('zenith-lang') || 'en';
    const langToggle = document.getElementById('langToggle');

    function applyLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('zenith-lang', lang);
        if (langToggle) langToggle.textContent = lang === 'en' ? 'EN' : '中';

        // Update text content
        document.querySelectorAll('[data-en]').forEach(function(el) {
            var text = el.getAttribute('data-' + lang);
            if (text) el.textContent = text;
        });

        // Update innerHTML (for elements with <br> etc.)
        document.querySelectorAll('[data-en-html]').forEach(function(el) {
            var html = el.getAttribute('data-' + lang + '-html');
            if (html) el.innerHTML = html;
        });

        // Update placeholders
        document.querySelectorAll('[data-en-placeholder]').forEach(function(el) {
            var ph = el.getAttribute('data-' + lang + '-placeholder');
            if (ph) el.placeholder = ph;
        });

        // Update circular text
        var circularEl = document.querySelector('.circular-text');
        if (circularEl) {
            var enText = "Welcome • My Space • UX Designer • Based In China • ";
            var zhText = "欢迎 • 我的空间 • UX 设计师 • 来自中国 • ";
            var t = lang === 'zh' ? zhText : enText;
            var chars = t.split('');
            var deg = 360 / chars.length;
            // Remove old spans
            circularEl.querySelectorAll('span').forEach(function(s) { s.remove(); });
            chars.forEach(function(char, i) {
                var span = document.createElement('span');
                span.innerText = char;
                span.style.transform = 'rotate(' + (deg * i) + 'deg)';
                circularEl.appendChild(span);
            });
        }

        document.documentElement.lang = lang === 'zh' ? 'zh' : 'en';
    }

    if (langToggle) {
        langToggle.addEventListener('click', function() {
            applyLanguage(currentLang === 'en' ? 'zh' : 'en');
        });
    }
    applyLanguage(currentLang);

    // 检查是否为移动设备（基于屏幕宽度或触摸支持）
    const isMobile = window.matchMedia("(max-width: 600px)").matches && "ontouchstart" in window;

    // 只在非移动设备上初始化光标效果
    if (!isMobile) {
        const cursorBig = document.querySelector(".cursor-big-circle");
        const cursorSmall = document.querySelector(".cursor-small-circle");

    if (!cursorBig || !cursorSmall) {
        console.error("未找到光标元素，请检查HTML中的 .cursor-big-circle 和 .cursor-small-circle");
        return;
    }

    let mouseX = 0, mouseY = 0;
    let bigX = 0, bigY = 0;
    let smallX = 0, smallY = 0;

    function lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    document.addEventListener("mousemove", function (e) {
        // 根据当前页面使用不同的光标位置计算逻辑
        const pathname = window.location.pathname;
        if (pathname.includes('vulnerable') || pathname.endsWith('vulnerable fence.html')) {
            // 三级页面使用滚动偏移量
            mouseX = e.clientX + window.pageXOffset;
            mouseY = e.clientY + window.pageYOffset;
        } else {
            // 其他页面直接使用clientX/clientY
            mouseX = e.clientX;
            mouseY = e.clientY;
        }
    });

    // 添加滚动事件监听以确保光标位置在滚动时平滑更新
    window.addEventListener("scroll", function () {
        const pathname = window.location.pathname;
        if (pathname.includes('vulnerable') || pathname.endsWith('vulnerable fence.html')) {
            // 三级页面在滚动时更新光标位置
            if (mouseX !== undefined && mouseY !== undefined) {
                mouseX = mouseX - (window.pageXOffset || 0) + window.pageXOffset;
                mouseY = mouseY - (window.pageYOffset || 0) + window.pageYOffset;
            }
        }
    });

    function animateCursor() {
        // 使用插值函数，调整系数以获得更丝滑的效果
        const pathname = window.location.pathname;
        if (pathname.includes('vulnerable') || pathname.endsWith('vulnerable fence.html')) {
            // 三级页面使用稍大的插值系数以减少延迟
            bigX = lerp(bigX, mouseX, 0.2); // 增加系数以减少延迟
            bigY = lerp(bigY, mouseY, 0.2);
            smallX = lerp(smallX, mouseX, 0.3); // 小光标稍微快一些
            smallY = lerp(smallY, mouseY, 0.3);
        } else {
            // 其他页面使用原来的系数
            bigX = lerp(bigX, mouseX, 0.25); // 调整为中等系数以平衡速度和平滑性
            bigY = lerp(bigY, mouseY, 0.25);
            smallX = lerp(smallX, mouseX, 0.35); // 小光标稍微快一些
            smallY = lerp(smallY, mouseY, 0.35);
        }

        // 更新光标位置
        cursorBig.style.transform = `translate(${bigX}px, ${bigY}px)`;
        cursorSmall.style.transform = `translate(${smallX}px, ${smallY}px)`;

        requestAnimationFrame(animateCursor);
    }

    animateCursor();

    document.querySelectorAll("a, button").forEach((element) => {
        element.addEventListener("mouseenter", () => {
            const pathname = window.location.pathname;
            if (pathname.includes('game-design.html') || pathname.endsWith('game-design.html')) {
                // 二级页面不应用颜色变幻效果
                return;
            }
            cursorBig.style.transform += " scale(1.5)";
            cursorBig.style.opacity = "0.7";
            cursorSmall.style.transform += " scale(0.3)";
        });

        element.addEventListener("mouseleave", () => {
            const pathname = window.location.pathname;
            if (pathname.includes('game-design.html') || pathname.endsWith('game-design.html')) {
                // 二级页面不应用颜色变幻效果
                return;
            }
            cursorBig.style.transform = cursorBig.style.transform.replace(" scale(1.5)", "");
            cursorBig.style.opacity = "1";
            cursorSmall.style.transform = cursorSmall.style.transform.replace(" scale(0.3)", "");
        });
    });

    // 为二级页面和三级页面设置光标颜色为白色
    const pathname = window.location.pathname;
    if (pathname.includes('game-design.html') || pathname.endsWith('game-design.html') || pathname.includes('vulnerable') || pathname.endsWith('vulnerable fence.html')) {
        cursorBig.classList.add('light-mode');
        cursorSmall.classList.add('light-mode');
    } else {
        cursorBig.classList.remove('light-mode');
        cursorSmall.classList.remove('light-mode');
    }

    } else {
        // 移除光标元素
        const cursorElements = document.querySelectorAll(".cursor-big-circle, .cursor-small-circle");
        cursorElements.forEach(el => el.remove());
    }

    // About 部分的选项卡切换功能
    var tablinks = document.getElementsByClassName("tab-links");
    var tabcontents = document.getElementsByClassName("tab-contents");

    window.opentab = function(tabname, event) {
        for (let tablink of tablinks) {
            tablink.classList.remove("active-link");
        }
        for (let tabcontent of tabcontents) {
            tabcontent.classList.remove("active-tab");
        }
        event.currentTarget.classList.add("active-link");
        document.getElementById(tabname).classList.add("active-tab");
    };

    // 移动端菜单控制
    const menuBtn = document.querySelector('.menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navLinksItems = document.querySelectorAll('.nav-links li a');

    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        navLinksItems.forEach(item => {
            item.addEventListener('click', (e) => {
                navLinks.classList.remove('active');
                
                // 添加平滑滚动功能
                const href = item.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const targetElement = document.querySelector(href);
                    if (targetElement) {
                        const targetPosition = targetElement.offsetTop - 60; // 减去header高度
                        smoothScrollTo(targetPosition, 300);
                    }
                }
            });
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar')) {
                navLinks.classList.remove('active');
            }
        });
    } else {
        console.error("未找到 .menu-btn 或 .nav-links 元素");
    }

    // 平滑滚动函数
    function smoothScrollTo(targetPosition, duration) {
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }

        // 缓动函数 - 使用ease-in-out效果
        function ease(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }

        requestAnimationFrame(animation);
    }

    // 初始化3D模型
    init3DModel();

    // 初始化移动端控制（陀螺仪 + 触摸拖拽），独立于3D模型加载
    initMobileControls();

    // 控制滚动文字显示
    const marqueeContainer = document.querySelector('.marquee-container');
    const heroSection = document.querySelector('#hero');
    const aboutSection = document.querySelector('#about');

    function checkMarqueeVisibility() {
        if (!heroSection || !marqueeContainer || !aboutSection) return;

        const aboutRect = aboutSection.getBoundingClientRect();
        const aboutTop = aboutRect.top;

        if (aboutTop > 110) {
            marqueeContainer.classList.remove('hidden');
        } else {
            marqueeContainer.classList.add('hidden');
        }
    }
    
    checkMarqueeVisibility();
    window.addEventListener('scroll', checkMarqueeVisibility);

    // 在DOMContentLoaded事件监听器内添加
    document.querySelectorAll('.game-design-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            // 直接指定路径，确保跳转
            document.body.style.opacity = '0';
            setTimeout(() => {
                window.location.href = 'game-design.html';
            }, 500);
        });
    });

    // 在页面加载时添加过渡效果
    window.addEventListener('load', () => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    });

    // 处理页面加载时的锚点跳转（从其他页面跳转过来）
    function handleInitialAnchor() {
        const hash = window.location.hash;
        if (hash) {
            // 延迟执行，确保页面完全加载
            setTimeout(() => {
                const targetElement = document.querySelector(hash);
                if (targetElement) {
                    const targetPosition = targetElement.offsetTop - 60;
                    smoothScrollTo(targetPosition, 300); // 改为300ms
                }
            }, 100);
        }
    }

    // 页面加载完成后处理初始锚点
    window.addEventListener('load', handleInitialAnchor);

    // 也在DOMContentLoaded时处理，以防页面加载很快
    handleInitialAnchor();

    // ---- Contact form handling ----
    const contactForm = document.querySelector('.wild-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const nameInput = contactForm.querySelector('input[name="Name"]');
            const emailInput = contactForm.querySelector('input[name="email"]');
            const messageInput = contactForm.querySelector('textarea[name="Message"]');
            const submitBtn = contactForm.querySelector('.wild-btn-submit');

            // Basic validation
            if (!nameInput.value.trim()) {
                showFormFeedback(nameInput, 'Please enter your name');
                return;
            }
            if (!emailInput.value.trim()) {
                showFormFeedback(emailInput, 'Please enter your email');
                return;
            }
            if (!isValidEmail(emailInput.value.trim())) {
                showFormFeedback(emailInput, 'Please enter a valid email');
                return;
            }

            // Simulate submission
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'SENDING...';
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.7';

            setTimeout(function() {
                submitBtn.textContent = 'MESSAGE SENT!';
                submitBtn.style.background = '#2ecc71';
                submitBtn.style.opacity = '1';
                submitBtn.disabled = false;

                // Reset form
                contactForm.reset();

                // Reset button after delay
                setTimeout(function() {
                    submitBtn.textContent = originalText;
                    submitBtn.style.background = '';
                }, 3000);
            }, 1500);
        });
    }

    function showFormFeedback(input, message) {
        input.style.borderBottomColor = '#ff004f';
        input.focus();

        // Remove any existing feedback
        const existingFeedback = input.parentElement.querySelector('.form-feedback');
        if (existingFeedback) existingFeedback.remove();

        const feedback = document.createElement('span');
        feedback.className = 'form-feedback';
        feedback.textContent = message;
        feedback.style.cssText = 'color:#ff004f; font-size:11px; letter-spacing:1px; display:block; margin-top:3px;';
        input.parentElement.appendChild(feedback);

        setTimeout(function() {
            feedback.remove();
            input.style.borderBottomColor = '';
        }, 3000);
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
});

// Shared rotation state (used by both 3D model and input controls)
var targetRotationX = 0;
var targetRotationY = 0;

// Mobile gyroscope + touch controls (independent of 3D model loading)
function initMobileControls() {
    var gyroActive = false;
    var initialBeta = null;
    var initialGamma = null;

    function handleOrientation(event) {
        if (event.beta === null || event.gamma === null) return;
        gyroActive = true;
        var gyroBtn = document.getElementById('gyro-enable-btn');
        if (gyroBtn) gyroBtn.style.display = 'none';
        if (initialBeta === null) {
            initialBeta = event.beta;
            initialGamma = event.gamma;
        }
        var deltaBeta = event.beta - initialBeta;
        var deltaGamma = event.gamma - initialGamma;
        deltaBeta = Math.max(-45, Math.min(45, deltaBeta));
        deltaGamma = Math.max(-45, Math.min(45, deltaGamma));
        targetRotationX = (deltaBeta / 45) * 0.5;
        targetRotationY = (deltaGamma / 45) * 0.7;
    }

    function requestGyroPermission() {
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission().then(function(state) {
                if (state === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation);
                }
            }).catch(function(err) {
                console.warn('Gyro permission error:', err);
            });
        } else if ('DeviceOrientationEvent' in window) {
            window.addEventListener('deviceorientation', handleOrientation);
        }
    }

    // Desktop: mouse control
    document.addEventListener('mousemove', function(event) {
        var mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        var mouseY = (event.clientY / window.innerHeight) * 2 - 1;
        targetRotationY = mouseX * 0.5;
        targetRotationX = mouseY * 0.3;
    });

    // Mobile: gyro + touch
    var isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice || window.matchMedia("(max-width: 600px)").matches) {
        var needsPermission = (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function');

        if (needsPermission) {
            // iOS: show a visible button (requestPermission requires user gesture + HTTPS)
            var gyroBtn = document.createElement('button');
            gyroBtn.id = 'gyro-enable-btn';
            gyroBtn.innerHTML = '&#x1F30D; Enable Gyroscope';
            gyroBtn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:10000;' +
                'padding:12px 20px;background:rgba(0,0,0,0.8);color:#fff;border:1px solid rgba(255,255,255,0.3);' +
                'border-radius:25px;font-size:14px;font-family:Poppins,Arial,sans-serif;' +
                'cursor:pointer;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);';
            gyroBtn.addEventListener('click', function() {
                requestGyroPermission();
                gyroBtn.textContent = 'Requesting...';
                setTimeout(function() {
                    if (!gyroActive) gyroBtn.innerHTML = '&#x1F30D; Tap to Retry';
                }, 2000);
            });
            document.body.appendChild(gyroBtn);
        } else {
            // Android: no permission needed
            requestGyroPermission();
        }

        // Touch drag fallback
        var touchStartX = 0, touchStartY = 0;
        var touchRotX = 0, touchRotY = 0;
        var heroEl = document.getElementById('hero');
        var touchTarget = heroEl || document;

        touchTarget.addEventListener('touchstart', function(e) {
            if (gyroActive) return;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchRotX = targetRotationX;
            touchRotY = targetRotationY;
        }, { passive: true });

        touchTarget.addEventListener('touchmove', function(e) {
            if (gyroActive) return;
            var dx = e.touches[0].clientX - touchStartX;
            var dy = e.touches[0].clientY - touchStartY;
            targetRotationY = touchRotY + dx * 0.008;
            targetRotationX = touchRotX + dy * 0.008;
        }, { passive: true });
    }
}

// 3D Model Initialization
function init3DModel() {
    const container = document.getElementById('model-container');
    if (!container) {
        console.error('找不到 model-container 元素');
        return;
    }

    if (typeof THREE === 'undefined') {
        console.error('Three.js 未正确加载');
        // Hide loading indicator on failure
        var loadingEl = document.getElementById('model-loading');
        if (loadingEl) loadingEl.style.display = 'none';
        return;
    }

    // Mobile slow network detection: skip 3D on Save-Data or slow connection
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var isMobileDevice = window.matchMedia("(max-width: 600px)").matches;
    if (conn && conn.saveData) {
        console.log('Save-Data enabled, skipping 3D model');
        var loadingEl = document.getElementById('model-loading');
        if (loadingEl) loadingEl.style.display = 'none';
        return;
    }
    if (isMobileDevice && conn && conn.effectiveType && (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g')) {
        console.log('Slow mobile connection, skipping 3D model');
        var loadingEl = document.getElementById('model-loading');
        if (loadingEl) loadingEl.style.display = 'none';
        return;
    }

    // Set a loading timeout - if model doesn't load in 15s on mobile, give up
    var modelLoadTimeout = null;
    if (isMobileDevice) {
        modelLoadTimeout = setTimeout(function() {
            console.warn('3D model loading timeout on mobile');
            var loadingEl = document.getElementById('model-loading');
            if (loadingEl) loadingEl.style.display = 'none';
        }, 15000);
    }

    const scene = new THREE.Scene();
    const containerWidth = container.clientWidth || 520;
    const containerHeight = container.clientHeight || 520;
    const camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000);
    camera.position.set(0, 0, 16);

    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    });
    renderer.setSize(containerWidth, containerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.physicallyCorrectLights = true;
    renderer.toneMappingExposure = 2.0;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);
    
    const mainLight = new THREE.SpotLight(0xffffff, 2.0);
    mainLight.position.set(5, 10, 7);
    mainLight.angle = Math.PI / 3;
    mainLight.penumbra = 0.5;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);
    fillLight.position.set(-5, 5, 5);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 1.0);
    backLight.position.set(0, -5, -5);
    scene.add(backLight);

    const leftLight = new THREE.PointLight(0xffffff, 0.7);
    leftLight.position.set(-5, 0, 2);
    scene.add(leftLight);

    const rightLight = new THREE.PointLight(0xffffff, 0.7);
    rightLight.position.set(5, 0, 2);
    scene.add(rightLight);

    const loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = function(url, loaded, total) {
        // Loading progress handled by UI progress bar
    };
    loadingManager.onLoad = function() {
        if (modelLoadTimeout) clearTimeout(modelLoadTimeout);
        var loadingEl = document.getElementById('model-loading');
        if (loadingEl) loadingEl.style.display = 'none';
    };
    loadingManager.onError = function(url) {
        console.error('Error loading ' + url);
    };

    const loader = new THREE.GLTFLoader(loadingManager);
    
    let baseScale = 1;
    let modelGroup = null;
    let animationId;
    let currentRotationX = 0;
    let currentRotationY = 0;

    function animate() {
        animationId = requestAnimationFrame(animate);

        if (!modelGroup) return;

        currentRotationX += (targetRotationX - currentRotationX) * 0.05;
        currentRotationY += (targetRotationY - currentRotationY) * 0.05;

        modelGroup.rotation.x = currentRotationX;
        modelGroup.rotation.y = currentRotationY;

        modelGroup.rotation.y += 0.001;

        modelGroup.position.y = Math.sin(Date.now() * 0.0008) * 0.03 - 0.7;

        renderer.render(scene, camera);
    }

    loader.load(
        './images/scene.glb',
        function(gltf) {
            const model = gltf.scene;

            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 17.8 / maxDim;
            baseScale = scale;
            model.scale.set(scale, scale, scale);

            box.setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);
            model.position.y -= 0.7;

            model.traverse((node) => {
                if (node.isMesh) {
                    if (node.material) {
                        node.material.emissive = new THREE.Color(0x222222);
                        node.material.emissiveIntensity = 0.2;
                        if (node.material.roughness !== undefined) {
                            node.material.roughness = 0.4;
                        }
                        if (node.material.metalness !== undefined) {
                            node.material.metalness = 0.6;
                        }
                        node.material.receiveShadow = true;
                        node.material.castShadow = true;
                    }
                }
            });

            modelGroup = new THREE.Group();
            scene.add(modelGroup);
            modelGroup.add(model);

            modelGroup.position.set(0, 0, 0);

            animate();
        },
        function(xhr) {
            if (xhr.total) {
                var pct = Math.round(xhr.loaded / xhr.total * 100);
                var bar = document.getElementById('model-progress-bar');
                var txt = document.getElementById('model-progress-text');
                if (bar) bar.style.width = pct + '%';
                if (txt) txt.textContent = 'LOADING ' + pct + '%';
            }
        },
        function(error) {
            console.error('加载GLB模型时出错:', error);
        }
    );

    // Function to handle resizing and scaling for both load and resize events
    function updateScaling() {
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        if (!cw || !ch) return;

        camera.aspect = cw / ch;
        camera.updateProjectionMatrix();
        renderer.setSize(cw, ch);
    }

    // Observe container size changes for responsive scaling
    if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(() => {
            updateScaling();
        });
        resizeObserver.observe(container);
    } else {
        // Fallback to window resize
        window.addEventListener('resize', debounce(function() {
            updateScaling();
        }, 100));
    }

    // Apply scaling on page load
    window.addEventListener('load', function() {
        updateScaling();
    });
}

// 添加防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

let lastScrollTop = 0;
let isScrolling = false;

const modelContainer = document.getElementById('model-container');
const circularText = document.querySelector('.circular-text');
const circularTextSpans = document.querySelectorAll('.circular-text span');
const marqueeContainer = document.querySelector('.marquee-container');
const heroSection = document.querySelector('#hero');
const aboutTitle = document.querySelector('#about');

function handleScroll() {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    // 动态获取"About"部分的位置
    let transitionStartPosition = 0;
    let transitionEndPosition = 0;

    if (aboutTitle) {
        const aboutTitleRect = aboutTitle.getBoundingClientRect();
        const aboutMePosition = currentScroll + aboutTitleRect.top;
        transitionStartPosition = aboutMePosition - window.innerHeight;
        transitionEndPosition = aboutMePosition - window.innerHeight * 0.75;
    }

    // 控制3D模型和圆环文字
    const accentCircle = document.querySelector('.hero-accent-circle');

    // 控制色差圆的显示（当看到 About 时显示）
    if (currentScroll > transitionStartPosition) {
        if (accentCircle) accentCircle.classList.add('visible');
    } else {
        if (accentCircle) accentCircle.classList.remove('visible');
    }

    // 圆环和 3D 模型在 Hero 内部，随页面滚动，无需控制隐显

    // 控制圆环文字颜色渐变
    const progress = Math.min(currentScroll / 1200, 1);
    const colorValue = Math.floor(255 * progress);
    circularTextSpans.forEach(span => {
        span.style.color = `rgb(${colorValue}, ${colorValue}, ${colorValue})`;
    });

    // 控制滚动文字显示
    if (heroSection && marqueeContainer && aboutTitle) {
        const aboutTitleRect = aboutTitle.getBoundingClientRect();
        if (aboutTitleRect.top > 110) {
            marqueeContainer.classList.remove('hidden');
        } else {
            marqueeContainer.classList.add('hidden');
        }
    }

    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
}

// 优化滚动性能
window.addEventListener('scroll', () => {
    if (!isScrolling) {
        window.requestAnimationFrame(() => {
            handleScroll();
            isScrolling = false;
        });
        isScrolling = true;
    }
});

// 初始化检测 - 模型 + 圆环文字状态
window.addEventListener('load', () => {
    const accentCircle = document.querySelector('.hero-accent-circle');

    if (aboutTitle) {
        const aboutTitleRect = aboutTitle.getBoundingClientRect();
        const aboutMePosition = window.pageYOffset + aboutTitleRect.top;
        const transitionStartPosition = aboutMePosition - window.innerHeight;

        if (window.pageYOffset > transitionStartPosition) {
            if (accentCircle) accentCircle.classList.add('visible');
        } else {
            if (accentCircle) accentCircle.classList.remove('visible');
        }
    }
});

// updateBlackLineHeight removed - old layout elements no longer exist
function updateBlackLineHeight() {}

