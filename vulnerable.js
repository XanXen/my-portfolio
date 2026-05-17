// Vulnerable Fence Page - Cursor effects
document.addEventListener("DOMContentLoaded", function () {
    const isMobile = window.matchMedia("(max-width: 600px)").matches || "ontouchstart" in window;

    if (!isMobile) {
        const cursorBig = document.querySelector(".cursor-big-circle");
        const cursorSmall = document.querySelector(".cursor-small-circle");

        if (!cursorBig || !cursorSmall) return;

        let mouseX = 0, mouseY = 0;
        let bigX = 0, bigY = 0;
        let smallX = 0, smallY = 0;

        function lerp(start, end, factor) {
            return start + (end - start) * factor;
        }

        document.addEventListener("mousemove", function (e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        function animateCursor() {
            bigX = lerp(bigX, mouseX, 0.2);
            bigY = lerp(bigY, mouseY, 0.2);
            smallX = lerp(smallX, mouseX, 0.3);
            smallY = lerp(smallY, mouseY, 0.3);

            cursorBig.style.transform = `translate(${bigX}px, ${bigY}px)`;
            cursorSmall.style.transform = `translate(${smallX}px, ${smallY}px)`;

            requestAnimationFrame(animateCursor);
        }

        animateCursor();

        // Light mode cursor for dark background
        cursorBig.classList.add('light-mode');
        cursorSmall.classList.add('light-mode');

        // Hover effects
        document.querySelectorAll("a, button, .back-btn").forEach(function (el) {
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
        const cursorElements = document.querySelectorAll(".cursor-big-circle, .cursor-small-circle");
        cursorElements.forEach(function (el) { el.remove(); });
    }
});
