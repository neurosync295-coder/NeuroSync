/**
 * NeuroSync Auth Guard
 * Protects restricted routes and redirects unauthenticated users to the index page.
 */

import { supabase } from '/js/supabase.js';

const PUBLIC_PATHS = [
    '/',
    '/index.html',
    '/html/auth.html'
];

async function checkAuth() {
    let session = null;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            session = data.session;
            break; // Success
        } catch (err) {
            console.warn(`NeuroSync Guard: Session fetch attempt ${retries + 1} failed:`, err.message);
            if (err.message.includes('Lock')) {
                retries++;
                await new Promise(r => setTimeout(r, 500)); // Wait for lock
            } else {
                break; // Non-lock error, stop retrying
            }
        }
    }

    const currentPath = window.location.pathname;
    
    // Normalize path to handle root and .html variations
    let normalizedPath = currentPath;
    if (normalizedPath === '' || normalizedPath === '/') {
        normalizedPath = '/index.html';
    }

    const isPublic = PUBLIC_PATHS.some(path => {
        if (path === '/') return normalizedPath === '/index.html' || normalizedPath === '/';
        // Check if path ends with any public paths
        return normalizedPath.endsWith(path);
    });

    if (!session && !isPublic) {
        console.warn('NeuroSync Guard: Unauthorized access attempt. Redirecting to core sector.');
        // Robust redirect to root index.html
        const isSubdir = normalizedPath.includes('/html/');
        window.location.href = isSubdir ? '../index.html' : 'index.html';
        return;
    }

    if (session) {
        console.log('NeuroSync Guard: Sync active. Session verified for UID:', session.user.id.substring(0, 8));
    }
}

// Run check immediately
checkAuth();

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    console.log(`[AuthGuard] Event: ${event}`);
    if (event === 'SIGNED_OUT') {
        const isSubdir = window.location.pathname.includes('/html/');
        window.location.href = isSubdir ? '../index.html' : 'index.html';
    }
});
