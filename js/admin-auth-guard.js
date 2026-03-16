/**
 * NeuroSync Admin Auth Guard
 * Protects isolated admin routes using sessionStorage tokens.
 */

(function() {
    const session = sessionStorage.getItem('root_admin_session');
    
    // Check if on the login page itself to avoid infinite loop
    const isLoginPage = window.location.pathname.endsWith('admin-login.html');

    if (!session && !isLoginPage) {
        console.warn('NeuroSync Admin: Unauthorized root access attempt. Redirecting to verification.');
        // Adjust path based on directory structure
        const loginPath = window.location.pathname.includes('/html/') ? 'admin-login.html' : 'html/admin-login.html';
        window.location.href = loginPath;
    } else if (session && isLoginPage) {
        // If already logged in, skip login page
        window.location.href = 'admin-dashboard.html';
    }
})();
