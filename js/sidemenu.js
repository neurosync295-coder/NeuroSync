/**
 * NeuroSync Side Menu Component
 * Handles dynamic injection and active link highlighting across all app pages.
 */

// Capture script base URL for robust relative imports
const SIDEMENU_SCRIPT_SRC = document.currentScript ? document.currentScript.src : '';
const SIDEMENU_SCRIPT_BASE = SIDEMENU_SCRIPT_SRC.substring(0, SIDEMENU_SCRIPT_SRC.lastIndexOf('/') + 1);

// Global Exposure for Sequential Init
window.initSideMenuInteractivity = () => {
    console.log('[SideMenu] Interactivity Setup Triggered');
    setupMobileMenu();
    setupSupabaseProfileUpdate();
};

// Global Sign Out Handler
window.signOut = async () => {
    console.log('[SideMenu] Sign Out Triggered');
    try {
        const { supabase } = await import('/js/supabase.js');
        await supabase.auth.signOut();
    } catch (error) {
        console.error('[SideMenu] Error signing out:', error);
    } finally {
        // Redirect to landing page instead of auth page
        window.location.href = '/index.html';
    }
};

// Core Rendering Logic
const renderSideMenu = () => {
    if (document.getElementById('side-menu')) return; // Already rendered

    const htmlPfx = '/html/';
    const sideMenuHTML = `
        <aside id="side-menu" class="fixed top-0 left-0 h-full w-64 z-50 transition-all duration-300 -translate-x-full">
            <div class="p-6 h-full flex flex-col relative">
                <!-- Close Button -->
                <button id="close-menu-btn" class="absolute top-4 right-4 translucent-button rounded-full size-8 flex items-center justify-center">
                    <span class="material-symbols-outlined text-sm">close</span>
                </button>
                <!-- User Profile Box -->
                <div id="side-profile-box" onclick="window.location.href='/html/profile.html'"
                    class="flex items-center gap-3 mb-8 p-4 bg-[#161618] border border-[#27272A] cursor-pointer transition-all hover:bg-[#1C1C1E] hover:border-[var(--accent-signal,#F97316)]/30">
                    <div class="bg-center bg-no-repeat aspect-square bg-cover rounded-none size-12 border border-[#27272A]"
                        id="side-profile-photo">
                        <span class="material-symbols-outlined text-xl text-[var(--accent-signal,#F97316)] flex items-center justify-center w-full h-full">person</span>
                    </div>
                    <div class="flex flex-col overflow-hidden">
                        <div class="text-[#FAFAFA] text-sm font-medium truncate" id="side-name">Loading...</div>
                        <div class="text-[#A1A1AA] text-xs truncate" id="side-class-role">Student</div>
                    </div>
                </div>

                <!-- Menu Items -->
                <nav class="flex flex-col gap-1 flex-grow overflow-y-auto">
                    <a href="${htmlPfx}dashboard.html" data-path="dashboard.html" class="nav-item">
                        <span class="material-symbols-outlined text-accent">dashboard</span>
                        <span>Dashboard</span>
                    </a>
                    <a href="${htmlPfx}rewards.html" data-path="rewards.html" class="nav-item">
                        <span class="material-symbols-outlined text-accent">emoji_events</span>
                        <span>Rewards</span>
                    </a>
                    <a href="${htmlPfx}profile.html" data-path="profile.html" class="nav-item">
                        <span class="material-symbols-outlined text-accent">person</span>
                        <span>Profile</span>
                    </a>
                    <a href="${htmlPfx}study-library.html" data-path="study-library.html" class="nav-item">
                        <span class="material-symbols-outlined text-accent">library_books</span>
                        <span>Study Library</span>
                    </a>
                    <a href="${htmlPfx}mood-selection.html" data-path="mood-selection.html" class="nav-item">
                        <span class="material-symbols-outlined text-accent">mood</span>
                        <span>Mood Tracker</span>
                    </a>
                    <a href="${htmlPfx}upload-material.html" data-path="upload-material.html" class="nav-item">
                        <span class="material-symbols-outlined text-accent">upload</span>
                        <span>Upload Study Material</span>
                    </a>
                    <a href="${htmlPfx}feedback.html" data-path="feedback.html" class="nav-item">
                        <span class="material-symbols-outlined text-accent">feedback</span>
                        <span>Feedback Us</span>
                    </a>
                </nav>

                <!-- Sign Out Button at Bottom -->
                <div class="mt-auto pt-4 border-t border-[#27272A]">
                    <a href="#" onclick="if(typeof signOut === 'function') { signOut(); } else { window.location.href='${htmlPfx}auth.html'; }" 
                       class="nav-item flex items-center gap-3 px-4 py-3 text-[#A1A1AA] hover:bg-red-500/10 hover:text-red-400 transition-colors group/signout">
                        <span class="material-symbols-outlined text-red-400 group-hover/signout:scale-110 transition-transform">logout</span>
                        <span>Sign Out</span>
                    </a>
                </div>
            </div>
        </aside>
        
        <!-- Mobile Toggle Overlay (Hidden by default) -->
        <div id="menu-overlay" class="fixed inset-0 bg-black/50 backdrop-blur-sm opacity-0 invisible transition-opacity duration-300 z-40"></div>
    `;

    let container = document.getElementById('side-menu-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'side-menu-container';
        document.body.prepend(container);
    }
    container.innerHTML = sideMenuHTML;
    highlightActiveLink();
    
    // Attempt interactivity setup if we have a navbar or after fallback
    if (window.initSideMenuInteractivity) {
        window.initSideMenuInteractivity();
    }
};

const removeSideMenu = () => {
    const sideMenu = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');
    const trigger = document.getElementById('side-menu-hover-trigger');
    
    if (sideMenu) sideMenu.remove();
    if (overlay) overlay.remove();
    if (trigger) trigger.remove();
};

document.addEventListener('DOMContentLoaded', () => {
    // Initial Auth Check for rendering
    const importPath = '/js/supabase.js';
    import(importPath).then(({ supabase }) => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                console.log('[SideMenu] Session detected. Rendering menu.');
                renderSideMenu();
            } else {
                console.log('[SideMenu] No session. Skipping render.');
            }
        });
    });

    // Fallback trigger for interactivity in case render happens late
    setTimeout(() => {
        if (!window.sideMenuInteractivityInited && document.getElementById('side-menu')) {
            console.log('[SideMenu] Fallback Interactivity Init');
            window.initSideMenuInteractivity();
        }
    }, 1500);
});

function setupMobileMenu() {
    // Re-select buttons to ensure we have the ones injected in index.html
    const mobileMenuBtns = document.querySelectorAll('#mobile-menu-btn');
    const sideMenu = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');
    const closeBtn = document.getElementById('close-menu-btn');

    console.log(`[SideMenu] Mobile Setup: Found ${mobileMenuBtns.length} buttons.`);

    function toggleMenu() {
        // Re-query elements if they are missing (e.g., if called before injection is fully processed)
        const sideMenu = document.getElementById('side-menu');
        const overlay = document.getElementById('menu-overlay');

        if (!sideMenu || !overlay) {
            console.error('[SideMenu] UI Elements missing for toggle. Attempting to re-inject or wait...');
            // Optional: trigger injection if side-menu-container is empty? 
            // For now, just logging is enough as the DOMContentLoaded should handle injection.
            return;
        }
        const isHidden = sideMenu.classList.contains('-translate-x-full');
        if (isHidden) {
            sideMenu.classList.remove('-translate-x-full');
            overlay.classList.remove('invisible', 'opacity-0');
        } else {
            sideMenu.classList.add('-translate-x-full');
            overlay.classList.add('opacity-0');
            setTimeout(() => overlay.classList.add('invisible'), 300);
        }
    }

    // Attach to all found buttons
    if (mobileMenuBtns.length > 0) {
        mobileMenuBtns.forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                toggleMenu();
            };
        });
    }

    if (closeBtn) closeBtn.onclick = toggleMenu;
    if (overlay) overlay.onclick = toggleMenu;

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sideMenu && !sideMenu.classList.contains('-translate-x-full')) {
            toggleMenu();
        }
    });

    // Invisible left edge hover trigger
    if (!document.getElementById('side-menu-hover-trigger')) {
        const hoverTrigger = document.createElement('div');
        hoverTrigger.id = 'side-menu-hover-trigger';
        hoverTrigger.className = 'fixed top-0 left-0 w-5 h-full z-40';
        document.body.appendChild(hoverTrigger);

        hoverTrigger.addEventListener('mouseenter', () => {
            const sideMenu = document.getElementById('side-menu');
            if (sideMenu && sideMenu.classList.contains('-translate-x-full')) {
                toggleMenu();
            }
        });
    }

    window.sideMenuInteractivityInited = true;
}

function highlightActiveLink() {
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    const page = currentPath.split('/').pop() || 'dashboard.html';
    const navLinks = document.querySelectorAll('#side-menu nav a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        const dataPath = link.getAttribute('data-path');

        link.classList.remove('active-link');

        // Match against href or data-path
        const matchesPage = (href === page || dataPath === page);
        const matchesFull = (href === (page + currentHash) || dataPath === (page + currentHash));

        if (matchesPage || matchesFull) {
            link.classList.add('active-link');
        } else if (href && href.includes('#') && (page + currentHash).startsWith(href)) {
            link.classList.add('active-link');
        }
    });

    // Special case for dashboard root
    if (!page || page === 'index.html') {
        const dashLink = document.querySelector('a[href="dashboard.html"]');
        if (dashLink) dashLink.classList.add('active-link');
    }
}

function setupSupabaseProfileUpdate() {
    // Listen for shared auth events from Navbar to avoid contention
    document.addEventListener('neurosync:auth-update', (e) => {
        const { session, supabase } = e.detail;
        console.log('[SideMenu] Received Auth Update Event');
        if (session?.user) {
            renderSideMenu(); // Ensure menu exists
            updateSidebarFromSupabase(supabase, session.user);
        } else {
            removeSideMenu(); // Remove menu if logged out
        }
    });

    // Fallback import if Navbar is missing
    const importPath = '/js/supabase.js';
    import(importPath).then(({ supabase }) => {
        // Only run if navbar hasn't handled it after 1.5s
        setTimeout(() => {
            const sideName = document.getElementById('side-name');
            // If side-name exists, we are already rendering; if it doesn't, check if we SHOULD render
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session?.user) {
                    renderSideMenu();
                    updateSidebarFromSupabase(supabase, session.user);
                } else {
                    removeSideMenu();
                }
            });
        }, 2000);
    });
}

async function updateSidebarFromSupabase(supabase, user) {
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, class_grade, role, photo_url')
            .eq('id', user.id)
            .single();

        const p = profile || {};
        const displayName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || user.email.split('@')[0] || 'User';

        const sideName = document.getElementById('side-name');
        const sideClass = document.getElementById('side-class-role');
        const sidePhoto = document.getElementById('side-profile-photo');

        if (sideName) sideName.textContent = displayName;
        if (sideClass) sideClass.textContent = p.class_grade || 'Student';

        if (sidePhoto) {
            if (p.photo_url) {
                sidePhoto.style.backgroundImage = `url("${p.photo_url}")`;
                sidePhoto.innerHTML = '';
            } else {
                sidePhoto.style.backgroundImage = 'none';
                sidePhoto.innerHTML = '';
                const icon = document.createElement('span');
                icon.className = 'material-symbols-outlined text-xl text-[var(--primary-color)] flex items-center justify-center w-full h-full';
                icon.textContent = 'person';
                sidePhoto.appendChild(icon);
            }
        }

        // Dynamic Role-based Links
        const nav = document.querySelector('#side-menu nav');
        if (nav) {
            if (p.role === 'Teacher' && !document.querySelector('a[href="teacher-dashboard.html"]')) {
                const teacherLink = document.createElement('a');
                teacherLink.href = 'teacher-dashboard.html';
                teacherLink.className = 'nav-item';

                const icon = document.createElement('span');
                icon.className = 'material-symbols-outlined text-accent';
                icon.textContent = 'school';

                const text = document.createElement('span');
                text.textContent = 'Teacher Dashboard';

                teacherLink.appendChild(icon);
                teacherLink.appendChild(text);

                nav.insertBefore(teacherLink, nav.children[1]);
                highlightActiveLink();
            }
            if (p.role === 'Admin' && !document.querySelector('a[href="admin.html"]')) {
                const adminLink = document.createElement('a');
                adminLink.href = 'admin.html';
                adminLink.className = 'nav-item';

                const icon = document.createElement('span');
                icon.className = 'material-symbols-outlined text-accent';
                icon.textContent = 'admin_panel_settings';

                const text = document.createElement('span');
                text.textContent = 'Admin Hub';

                adminLink.appendChild(icon);
                adminLink.appendChild(text);

                nav.appendChild(adminLink);
                highlightActiveLink();
            }
        }
    } catch (error) {
        console.error('Error updating sidebar profile:', error);
    }
}
