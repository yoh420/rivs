// RIVS Business Solutions — client portal auth (PROTOTYPE ONLY)
//
// This is not real authentication. There is no server, so account data
// lives only in this browser's localStorage: it isn't shared across
// devices, can be read via dev tools, and the "gate" on dashboard.html
// can be bypassed by anyone who edits localStorage directly. Treat this
// purely as a UI placeholder for a future real client portal.

const USERS_KEY = 'rivs_portal_users';
const SESSION_KEY = 'rivs_portal_session';

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function showStatus(form, message, isError) {
  const status = form.querySelector('.form-status');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('is-error', !!isError);
  status.classList.toggle('is-success', !isError);
}

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname.split('/').pop() || 'index.html';

  // Dashboard guard — bounce to login if there's no active session.
  if (path === 'dashboard.html' && !getSession()) {
    window.location.href = 'login.html';
    return;
  }

  // Sign up
  const signupForm = document.querySelector('#signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new FormData(signupForm);
      const name = (data.get('name') || '').toString().trim();
      const email = (data.get('email') || '').toString().trim().toLowerCase();
      const password = (data.get('password') || '').toString();
      const confirm = (data.get('confirm') || '').toString();

      if (!name || !email || !password) {
        showStatus(signupForm, 'Please fill in all fields.', true);
        return;
      }
      if (password.length < 8) {
        showStatus(signupForm, 'Password must be at least 8 characters.', true);
        return;
      }
      if (password !== confirm) {
        showStatus(signupForm, 'Passwords do not match.', true);
        return;
      }

      const users = getUsers();
      if (users.some((u) => u.email === email)) {
        showStatus(signupForm, 'An account with that email already exists.', true);
        return;
      }

      const passwordHash = await hashPassword(password);
      users.push({ name, email, passwordHash, createdAt: new Date().toISOString() });
      saveUsers(users);
      setSession({ name, email, signedInAt: new Date().toISOString() });
      window.location.href = 'dashboard.html';
    });
  }

  // Sign in
  const signinForm = document.querySelector('#signin-form');
  if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new FormData(signinForm);
      const email = (data.get('email') || '').toString().trim().toLowerCase();
      const password = (data.get('password') || '').toString();

      const users = getUsers();
      const user = users.find((u) => u.email === email);
      const passwordHash = await hashPassword(password);

      if (!user || user.passwordHash !== passwordHash) {
        showStatus(signinForm, 'Incorrect email or password.', true);
        return;
      }

      setSession({ name: user.name, email: user.email, signedInAt: new Date().toISOString() });
      window.location.href = 'dashboard.html';
    });
  }

  // Sign out
  const signoutBtn = document.querySelector('#signout-btn');
  if (signoutBtn) {
    signoutBtn.addEventListener('click', () => {
      clearSession();
      window.location.href = 'login.html';
    });
  }

  // Dashboard welcome message
  const welcomeEl = document.querySelector('#portal-welcome');
  if (welcomeEl) {
    const session = getSession();
    if (session) {
      welcomeEl.textContent = `Welcome back, ${session.name}.`;
    }
  }
});
