/**
 * NeuroSync Global Theme Handler
 * Manages dark/light mode transitions and persistence.
 * Matches the Obsidian Stream design system.
 */

const DARK_VARS = {
    '--bg-primary': '#0D0D0E',
    '--bg-secondary': '#111112',
    '--bg-tertiary': '#161618',
    '--bg-obsidian': '#0D0D0E',
    '--bg-graphite': '#161618',
    '--text-primary': '#FAFAFA',
    '--text-secondary': '#A1A1AA',
    '--text-muted': '#52525B',
    '--border-primary': '#27272A',
    '--border-raw': '#27272A',
    '--accent-signal': '#F97316',
    '--accent-signal-dim': 'rgba(249,115,22,0.15)',
    '--bg-primary-legacy': '#0D0D0E',
    '--bg-secondary-legacy': '#111112',
    '--bg-tertiary-legacy': '#1C1C1E',
    '--text-primary-legacy': '#FAFAFA',
    '--text-secondary-legacy': '#A1A1AA',
    '--border-primary-legacy': '#27272A',
};

const LIGHT_VARS = {
    '--bg-primary': '#FAFAFA',
    '--bg-secondary': '#F4F4F5',
    '--bg-tertiary': '#E4E4E7',
    '--bg-obsidian': '#FFFFFF',
    '--bg-graphite': '#F4F4F5',
    '--text-primary': '#09090B',
    '--text-secondary': '#52525B',
    '--text-muted': '#71717A',
    '--border-primary': '#D4D4D8',
    '--border-raw': '#D4D4D8',
    '--accent-signal': '#EA580C',
    '--accent-signal-dim': 'rgba(234,88,12,0.10)',
    '--bg-primary-legacy': '#FAFAFA',
    '--bg-secondary-legacy': '#F4F4F5',
    '--bg-tertiary-legacy': '#E4E4E7',
    '--text-primary-legacy': '#09090B',
    '--text-secondary-legacy': '#52525B',
    '--border-primary-legacy': '#D4D4D8',
};

function applyTheme(theme) {
    const isLight = theme === 'light';
    const vars = isLight ? LIGHT_VARS : DARK_VARS;
    const root = document.documentElement;

    // Apply CSS variables
    Object.entries(vars).forEach(([key, val]) => root.style.setProperty(key, val));

    // Toggle body class
    document.body.classList.toggle('dark', !isLight);
    document.body.classList.toggle('light', isLight);

    // Update icon on ALL toggle buttons (pages sometimes have more than one)
    document.querySelectorAll('#theme-toggle .material-symbols-outlined').forEach(icon => {
        icon.textContent = isLight ? 'light_mode' : 'dark_mode';
    });
}

// Apply immediately from localStorage to prevent flash
(function () {
    const saved = localStorage.getItem('ns-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);

    // Minimal early-apply (no DOM icons yet, just class)
    if (saved === 'light') {
        document.documentElement.classList.add('theme-light');
        document.documentElement.classList.remove('theme-dark');
    } else {
        document.documentElement.classList.add('theme-dark');
        document.documentElement.classList.remove('theme-light');
    }

    // === Global NeuroSync Loader Injection ===
    const injectLoader = () => {
        const loaderHTML = `
            <div id="ns-global-loader" class="ns-loader-overlay">
                <div class="ns-loader-brain-container">
                    <span class="material-symbols-outlined ns-loader-brain">psychology</span>
                    <div class="ns-loader-scan"></div>
                </div>
                <div class="ns-loader-telemetry">
                    <span class="ns-loader-label">Init_NeuroSync_Protocol</span>
                    <div class="ns-loader-status" id="ns-loader-status-text">INITIALIZING_UPLINK...</div>
                </div>
                <div class="ns-loader-progress-wrap">
                    <div class="ns-loader-progress-bar"></div>
                </div>
            </div>
        `;
        const div = document.createElement('div');
        div.innerHTML = loaderHTML;
        document.body.prepend(div.firstElementChild);

        // Status text cycling
        const statusText = document.getElementById('ns-loader-status-text');
        const phrases = [
            "INITIALIZING_NEURAL_LINK...",
            "BUFFERING_SYNAPTIC_DATA...",
            "ESTABLISHING_LNR_CONNECTION...",
            "SYNCING_COLLECTIVE_ARCHIVE...",
            "READY_FOR_NEURAL_UPLINK"
        ];
        let i = 0;
        const interval = setInterval(() => {
            if (statusText) {
                statusText.textContent = phrases[i];
                i = (i + 1) % phrases.length;
            }
        }, 800);

        // Window load listener to hide loader
        window.addEventListener('load', () => {
            setTimeout(() => {
                const loader = document.getElementById('ns-global-loader');
                if (loader) {
                    loader.classList.add('hidden');
                    clearInterval(interval);
                    setTimeout(() => loader.remove(), 1000);
                }
            }, 1500); // Minimum visibility time for aesthetic impact
        });
    };

    if (document.body) {
        injectLoader();
    } else {
        document.addEventListener('DOMContentLoaded', injectLoader);
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Full variable + class apply once DOM is ready
        applyTheme(saved);

        // Wire ALL toggle buttons
        document.querySelectorAll('#theme-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const newTheme = document.body.classList.contains('light') ? 'dark' : 'light';
                localStorage.setItem('ns-theme', newTheme);
                // Migrate old key too
                localStorage.setItem('theme', newTheme);
                applyTheme(newTheme);
            });
        });
    });
})();
