// Language toggle — lightweight version of the i18n logic from script.js
// Load this on pages that have their own cursor/animation code to avoid conflicts.
(function () {
    var currentLang = localStorage.getItem('zenith-lang') || 'en';
    var langToggle = document.getElementById('langToggle');

    function applyLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('zenith-lang', lang);
        if (langToggle) langToggle.textContent = lang === 'en' ? 'EN' : '中';

        // Update text content
        document.querySelectorAll('[data-en]').forEach(function (el) {
            var text = el.getAttribute('data-' + lang);
            if (text) el.textContent = text;
        });

        // Update innerHTML (for elements with <br> etc.)
        document.querySelectorAll('[data-en-html]').forEach(function (el) {
            var html = el.getAttribute('data-' + lang + '-html');
            if (html) el.innerHTML = html;
        });

        // Update placeholders
        document.querySelectorAll('[data-en-placeholder]').forEach(function (el) {
            var ph = el.getAttribute('data-' + lang + '-placeholder');
            if (ph) el.placeholder = ph;
        });

        document.documentElement.lang = lang === 'zh' ? 'zh' : 'en';
    }

    if (langToggle) {
        langToggle.addEventListener('click', function () {
            applyLanguage(currentLang === 'en' ? 'zh' : 'en');
        });
    }
    applyLanguage(currentLang);
})();
