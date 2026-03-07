import { supabase } from './supabase.js';

// DOM elements
const authForm = document.getElementById('auth-form');
const googleSignInButton = document.getElementById('google-signin');

// Google Sign-In functionality (Supabase OAuth)
if (googleSignInButton) {
  googleSignInButton.addEventListener('click', async () => {
    try {
      if (window.authPage) window.authPage.clearError();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/html/dashboard.html'
        }
      });

      if (error) throw error;
      // Supabase OAuth redirects the browser
    } catch (error) {
      console.error('Google sign-in error:', error);
      if (window.authPage) window.authPage.showError(error.message);
    }
  });
}

// Map custom UI error strings
function mapAuthError(error) {
  const message = error.message.toLowerCase();
  if (message.includes('invalid format')) return 'Invalid email address format.';
  if (message.includes('invalid login credentials')) return 'Invalid email or password.';
  if (message.includes('already registered')) return 'This email is already registered.';
  if (message.includes('at least 6 characters')) return 'Password should be at least 6 characters.';
  return 'Authentication failed. Please try again.';
}

// Email/Password Submit Handler
if (authForm) {
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (window.authPage) window.authPage.clearError();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const nameInput = document.getElementById('name');

    // UI state tracks whether we're on sign up or sign in
    const isSignUp = window.authPage && window.authPage.isSignUp ? window.authPage.isSignUp.val : false;

    if (!email || !password) {
      if (window.authPage) window.authPage.showError('Please fill in all required fields.');
      return;
    }

    if (window.authPage) window.authPage.setLoading(true);

    try {
      if (isSignUp) {
        // Handle Sign Up
        const fullName = nameInput ? nameInput.value.trim() : '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              full_name: fullName
            }
          }
        });

        if (error) throw error;

        if (data.session) {
          window.location.href = 'profile.html';
        } else {
          if (window.authPage) window.authPage.showError('Please check your email for confirmation.');
        }

      } else {
        // Handle Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        // Redirect to dashboard
        window.location.href = 'dashboard.html';
      }
    } catch (error) {
      console.error('Auth error:', error);
      if (window.authPage) window.authPage.showError(mapAuthError(error));
    } finally {
      if (window.authPage) window.authPage.setLoading(false);
    }
  });
}
