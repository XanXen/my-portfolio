// Branding Design Page - Scale, cursor effects, and navigation

const navStyle = document.createElement('style');
navStyle.textContent = `
    @keyframes moveOut {
        from { opacity: 1; }
        to   { opacity: 0; }
    }
`;
document.head.appendChild(navStyle);

document.addEventListener("DOMContentLoaded", function () {
    const isMobile = window.matchMedia("(max-width: 600px)").matches && "ontouchstart" in window;

    // ---- Responsive scaling: fit 1512×982 canvas into viewport ----
    var canvas = document.querySelector('.branding-canvas');
    function updateScale() {
        if (!canvas) return;
        var w = window.innerWidth;
        var h = window.innerHeight - 60;
        var scale = Math.min(w / 1512, h / 982);
        canvas.style.transform = 'scale(' + scale + ')';
        canvas.style.left = (w - 1512 * scale) / 2 + 'px';
        canvas.style.top = (h - 982 * scale) / 2 + 'px';
    }
    window.addEventListener('resize', updateScale);
    updateScale();

    // Helper: navigate with exit animation
    function navigateTo(url) {
        document.body.style.animation = 'moveOut 300ms ease-in-out forwards';
        setTimeout(function () {
            window.location.href = url;
        }, 300);
    }

    // Navigation link handlers
    document.querySelectorAll('.nav-links a').forEach(function (link) {
        link.addEventListener('click', function (e) {
            var href = this.getAttribute('href');
            if (href && href.startsWith('index.html#')) {
                e.preventDefault();
                navigateTo(href);
            }
        });
    });

    // Brand link
    var brandLink = document.querySelector('.brand');
    if (brandLink) {
        brandLink.addEventListener('click', function (e) {
            e.preventDefault();
            navigateTo('index.html');
        });
    }

    // Back link
    var backLink = document.querySelector('.branding-back');
    if (backLink) {
        backLink.addEventListener('click', function (e) {
            e.preventDefault();
            navigateTo('index.html#services');
        });
    }

    // ---- Detail overlay ----
    var overlay = document.getElementById('detail-overlay');
    var detailImg = document.getElementById('detail-img');
    var closeBtn = document.querySelector('.detail-close');

    var detailImages = {
        xiaohongqi: 'images/branding-detail-xiaohongqi.png',
        heritage: 'images/branding-detail-heritage.png'
    };

    // Click on card-back (flipped state) opens detail
    document.querySelectorAll('.card-back[data-detail]').forEach(function (back) {
        back.addEventListener('click', function (e) {
            e.stopPropagation();
            var key = this.getAttribute('data-detail');
            if (detailImg && detailImages[key]) {
                detailImg.src = detailImages[key];
            }
            if (overlay) {
                overlay.querySelector('.detail-scroll').scrollTop = 0;
                overlay.classList.add('active');
            }
        });
    });

    // Close overlay
    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            overlay.classList.remove('active');
        });
    }

    // Click outside detail image closes overlay
    if (overlay) {
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay || e.target.classList.contains('detail-scroll')) {
                overlay.classList.remove('active');
            }
        });
    }

    // ESC key closes overlay
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay && overlay.classList.contains('active')) {
            overlay.classList.remove('active');
        }
    });

    // ---- Mobile: tap to flip cards ----
    if (isMobile) {
        document.querySelectorAll('.branding-card').forEach(function (card) {
            card.addEventListener('click', function (e) {
                // If card-back was tapped while flipped, let the detail handler run
                if (card.classList.contains('flipped') && e.target.closest('.card-back')) return;
                card.classList.toggle('flipped');
            });
        });
    }

    // ---- Cursor effects (non-mobile only) ----
    if (!isMobile) {
        var cursorBig = document.querySelector(".cursor-big-circle");
        var cursorSmall = document.querySelector(".cursor-small-circle");

        if (!cursorBig || !cursorSmall) return;

        var mouseX = 0, mouseY = 0;
        var bigX = 0, bigY = 0;
        var smallX = 0, smallY = 0;

        function lerp(start, end, factor) {
            return start + (end - start) * factor;
        }

        document.addEventListener("mousemove", function (e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        function animateCursor() {
            bigX = lerp(bigX, mouseX, 0.15);
            bigY = lerp(bigY, mouseY, 0.15);
            smallX = lerp(smallX, mouseX, 0.2);
            smallY = lerp(smallY, mouseY, 0.2);

            cursorBig.style.transform = 'translate(' + bigX + 'px, ' + bigY + 'px)';
            cursorSmall.style.transform = 'translate(' + smallX + 'px, ' + smallY + 'px)';

            requestAnimationFrame(animateCursor);
        }

        animateCursor();

        // Hover effects on interactive elements
        document.querySelectorAll("a, button, .branding-card").forEach(function (el) {
            el.addEventListener("mouseenter", function () {
                cursorBig.style.transform += " scale(1.5)";
                cursorBig.style.opacity = "0.7";
                cursorSmall.style.transform += " scale(0.3)";
            });

            el.addEventListener("mouseleave", function () {
                cursorBig.style.transform = cursorBig.style.transform.replace(" scale(1.5)", "");
                cursorBig.style.opacity = "1";
                cursorSmall.style.transform = cursorSmall.style.transform.replace(" scale(0.3)", "");
            });
        });
    } else {
        var cursorElements = document.querySelectorAll(".cursor-big-circle, .cursor-small-circle");
        cursorElements.forEach(function (el) { el.remove(); });
    }

    // ---- Mobile menu ----
    var menuBtn = document.querySelector('.menu-btn');
    var navLinks = document.querySelector('.nav-links');
    var navLinksItems = document.querySelectorAll('.nav-links li a');

    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', function () {
            navLinks.classList.toggle('active');
        });

        navLinksItems.forEach(function (item) {
            item.addEventListener('click', function () {
                navLinks.classList.remove('active');
            });
        });

        document.addEventListener('click', function (e) {
            if (!e.target.closest('.navbar')) {
                navLinks.classList.remove('active');
            }
        });
    }
});
