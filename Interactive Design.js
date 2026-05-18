// Interactive Design - Page Interactions
// Hero panel hover, cursor, navigation

document.addEventListener("DOMContentLoaded", function () {
    var isMobile = window.matchMedia("(max-width: 600px)").matches && "ontouchstart" in window;

    // ---- Entrance animation ----
    document.body.style.opacity = '0';
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            document.body.style.transition = 'opacity 0.4s ease';
            document.body.style.opacity = '1';
            setTimeout(function () { document.body.style.transition = ''; }, 500);
        });
    });

    // ---- Navigation ----
    function navigateTo(url) {
        document.body.style.transition = 'opacity 0.3s ease';
        document.body.style.opacity = '0';
        setTimeout(function () { window.location.href = url; }, 300);
    }

    document.querySelectorAll('.nav-links a').forEach(function (link) {
        link.addEventListener('click', function (e) {
            var href = this.getAttribute('href');
            if (href && href.startsWith('index.html')) {
                e.preventDefault();
                navigateTo(href);
            }
        });
    });

    var brandLink = document.querySelector('.brand');
    if (brandLink) {
        brandLink.addEventListener('click', function (e) {
            e.preventDefault();
            navigateTo('index.html');
        });
    }

    document.querySelectorAll('.hero-arrow-link').forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            navigateTo(this.getAttribute('href'));
        });
    });

    // ---- Hero Panel Hover (JS-managed) ----
    var heroContainer = document.querySelector('.hero-split-container');
    var heroLeft = document.querySelector('.hero-left');
    var heroRight = document.querySelector('.hero-right');
    var infoDaoist = document.getElementById('info-daoist');   // right-side overlay
    var infoPlant = document.getElementById('info-plant');     // left-side overlay
    var currentSide = null; // 'left', 'right', or null

    if (heroContainer && heroLeft && heroRight && isMobile) {
        // Mobile: tap panel to toggle info
        heroLeft.addEventListener('click', function () {
            heroLeft.classList.toggle('tapped');
            infoDaoist.classList.toggle('mobile-open');
            // Close the other
            heroRight.classList.remove('tapped');
            infoPlant.classList.remove('mobile-open');
        });
        heroRight.addEventListener('click', function () {
            heroRight.classList.toggle('tapped');
            infoPlant.classList.toggle('mobile-open');
            // Close the other
            heroLeft.classList.remove('tapped');
            infoDaoist.classList.remove('mobile-open');
        });
    }

    if (heroContainer && heroLeft && heroRight && !isMobile) {
        heroContainer.addEventListener('mousemove', function (e) {
            var rect = heroContainer.getBoundingClientRect();
            var relX = e.clientX - rect.left;
            var halfWidth = rect.width / 2;
            var side = relX <= halfWidth ? 'left' : 'right';

            if (side === currentSide) return;
            currentSide = side;

            if (side === 'left') {
                // Mouse on LEFT (Daoist Doctrine) →
                // Left panel slides RIGHT to cover right panel
                // Daoist info appears on RIGHT side
                heroLeft.className = 'hero-panel hero-left sliding';
                heroLeft.style.transform = 'translateX(100%)';
                heroRight.className = 'hero-panel hero-right static';
                heroRight.style.transform = '';

                infoDaoist.classList.add('active');
                infoPlant.classList.remove('active');
            } else {
                // Mouse on RIGHT (Plant Sense Party) →
                // Right panel slides LEFT to cover left panel
                // Plant info appears on LEFT side
                heroRight.className = 'hero-panel hero-right sliding';
                heroRight.style.transform = 'translateX(-100%)';
                heroLeft.className = 'hero-panel hero-left static';
                heroLeft.style.transform = '';

                infoPlant.classList.add('active');
                infoDaoist.classList.remove('active');
            }
        });

        heroContainer.addEventListener('mouseleave', function () {
            currentSide = null;

            // Smooth return to initial state
            heroLeft.className = 'hero-panel hero-left returning';
            heroLeft.style.transform = 'translateX(0)';
            heroRight.className = 'hero-panel hero-right returning';
            heroRight.style.transform = 'translateX(0)';

            infoDaoist.classList.remove('active');
            infoPlant.classList.remove('active');

            // Clean up after transition
            setTimeout(function () {
                if (currentSide === null) {
                    heroLeft.className = 'hero-panel hero-left';
                    heroLeft.style.transform = '';
                    heroRight.className = 'hero-panel hero-right';
                    heroRight.style.transform = '';
                }
            }, 650);
        });
    }

    // ---- Cursor effects (non-mobile only) ----
    if (!isMobile) {
        var cursorBig = document.querySelector(".cursor-big-circle");
        var cursorSmall = document.querySelector(".cursor-small-circle");

        if (cursorBig && cursorSmall) {
            var styleEl = document.createElement('style');
            styleEl.textContent = '* { cursor: none !important; }';
            document.head.appendChild(styleEl);

            var mouseX = 0, mouseY = 0;
            var bigX = 0, bigY = 0;
            var smallX = 0, smallY = 0;
            var isFirstMove = true;

            document.addEventListener("mousemove", function (e) {
                mouseX = e.clientX;
                mouseY = e.clientY;
                if (isFirstMove) {
                    bigX = mouseX; bigY = mouseY;
                    smallX = mouseX; smallY = mouseY;
                    isFirstMove = false;
                }
            });

            function animateCursor() {
                bigX += (mouseX - bigX) * 0.15;
                bigY += (mouseY - bigY) * 0.15;
                smallX += (mouseX - smallX) * 0.25;
                smallY += (mouseY - smallY) * 0.25;
                cursorBig.style.left = bigX + "px";
                cursorBig.style.top = bigY + "px";
                cursorSmall.style.left = smallX + "px";
                cursorSmall.style.top = smallY + "px";
                requestAnimationFrame(animateCursor);
            }
            animateCursor();

            document.querySelectorAll("a, button").forEach(function (el) {
                el.addEventListener("mouseenter", function () {
                    cursorBig.style.width = "60px";
                    cursorBig.style.height = "60px";
                    cursorBig.style.margin = "-30px 0 0 -30px";
                    cursorBig.style.opacity = "0.7";
                    cursorSmall.style.width = "10px";
                    cursorSmall.style.height = "10px";
                    cursorSmall.style.margin = "-5px 0 0 -5px";
                });
                el.addEventListener("mouseleave", function () {
                    cursorBig.style.width = "40px";
                    cursorBig.style.height = "40px";
                    cursorBig.style.margin = "-20px 0 0 -20px";
                    cursorBig.style.opacity = "1";
                    cursorSmall.style.width = "28.28px";
                    cursorSmall.style.height = "28.28px";
                    cursorSmall.style.margin = "-14.14px 0 0 -14.14px";
                });
            });
        }
    } else {
        document.querySelectorAll(".cursor-big-circle, .cursor-small-circle").forEach(function (el) {
            el.remove();
        });
    }

    // ---- Mobile menu ----
    var menuBtn = document.querySelector('.menu-btn');
    var navLinks = document.querySelector('.nav-links');
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', function () { navLinks.classList.toggle('active'); });
        document.querySelectorAll('.nav-links li a').forEach(function (item) {
            item.addEventListener('click', function () { navLinks.classList.remove('active'); });
        });
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.navbar')) navLinks.classList.remove('active');
        });
    }
});
