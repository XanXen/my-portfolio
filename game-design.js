// Game Design Page - Cursor effects and navigation

// Add moveOut keyframe for page transitions
const navStyle = document.createElement('style');
navStyle.textContent = `
    @keyframes moveOut {
        from {
            transform: translateY(0);
            opacity: 1;
        }
        to {
            transform: translateY(-100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(navStyle);

document.addEventListener("DOMContentLoaded", function () {
    // Check for mobile device
    const isMobile = window.matchMedia("(max-width: 600px)").matches && "ontouchstart" in window;

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
            const href = this.getAttribute('href');
            if (href && href.startsWith('index.html#')) {
                e.preventDefault();
                navigateTo(href);
            }
        });
    });

    // Brand link
    const brandLink = document.querySelector('.brand');
    if (brandLink) {
        brandLink.addEventListener('click', function (e) {
            e.preventDefault();
            navigateTo('index.html');
        });
    }

    // VulnerableFence link
    const vfLink = document.querySelector('.VulnerableFence');
    if (vfLink) {
        vfLink.addEventListener('click', function (e) {
            e.preventDefault();
            navigateTo('vulnerable fence.html');
        });
    }

    // BoardGameDesign link
    const bgLink = document.querySelector('.BoardGameDesign');
    if (bgLink) {
        bgLink.addEventListener('click', function (e) {
            e.preventDefault();
            navigateTo('board game.html');
        });
    }

    // ---- Cursor effects (non-mobile only) ----
    if (!isMobile) {
        const cursorBig = document.querySelector(".cursor-big-circle");
        const cursorSmall = document.querySelector(".cursor-small-circle");

        if (!cursorBig || !cursorSmall) {
            console.error("Cursor elements not found on Game Design page");
            return;
        }

        let mouseX = 0, mouseY = 0;
        let bigX = 0, bigY = 0;
        let smallX = 0, smallY = 0;

        function lerp(start, end, factor) {
            return start + (end - start) * factor;
        }

        document.addEventListener("mousemove", function (e) {
            mouseX = e.clientX;
            mouseY = e.clientY;

            // Detect header area for cursor color
            const elementUnderMouse = document.elementFromPoint(e.clientX, e.clientY);
            if (elementUnderMouse) {
                const isInHeader = elementUnderMouse.closest('#header, .navbar, .nav-links, .brand');
                if (isInHeader) {
                    cursorBig.classList.add('dark-mode');
                    cursorSmall.classList.add('dark-mode');
                    cursorBig.classList.remove('light-mode');
                    cursorSmall.classList.remove('light-mode');
                } else {
                    cursorBig.classList.add('light-mode');
                    cursorSmall.classList.add('light-mode');
                    cursorBig.classList.remove('dark-mode');
                    cursorSmall.classList.remove('dark-mode');
                }
            }
        });

        function animateCursor() {
            bigX = lerp(bigX, mouseX, 0.15);
            bigY = lerp(bigY, mouseY, 0.15);
            smallX = lerp(smallX, mouseX, 0.2);
            smallY = lerp(smallY, mouseY, 0.2);

            cursorBig.style.transform = `translate(${bigX}px, ${bigY}px)`;
            cursorSmall.style.transform = `translate(${smallX}px, ${smallY}px)`;

            requestAnimationFrame(animateCursor);
        }

        animateCursor();

        // Hover effects on interactive elements
        document.querySelectorAll("a, button, .VulnerableFence, .BoardGameDesign").forEach(function (el) {
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
        // Remove cursor elements on mobile
        const cursorElements = document.querySelectorAll(".cursor-big-circle, .cursor-small-circle");
        cursorElements.forEach(function (el) { el.remove(); });
    }

    // ---- Mobile menu ----
    const menuBtn = document.querySelector('.menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navLinksItems = document.querySelectorAll('.nav-links li a');

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
