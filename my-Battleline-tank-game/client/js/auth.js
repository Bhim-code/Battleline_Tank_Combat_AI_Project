/* ============================================================
   auth.js — Login and Signup page logic
   ============================================================ */

function showError(msg) {
  const box = document.getElementById('errorMsg');
  const txt = document.getElementById('errorText');
  if (txt) txt.textContent = msg; else box.lastElementChild.textContent = msg;
  box.classList.add('show');
  document.getElementById('successMsg').classList.remove('show');
}

function showSuccess(msg) {
  const box = document.getElementById('successMsg');
  const txt = document.getElementById('successText');
  if (txt) txt.textContent = msg; else box.lastElementChild.textContent = msg;
  box.classList.add('show');
  document.getElementById('errorMsg').classList.remove('show');
}

function resetButton(id, label) {
  const btn = document.getElementById(id);
  btn.textContent = label;
  btn.disabled = false;
}

function initLoginPage() {
  if (getToken()) { window.location.replace('game.html'); return; }

  document.getElementById('loginBtn').addEventListener('click', async () => {
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    if (!email || !password) { showError('Please fill in all fields.'); return; }

    const btn = document.getElementById('loginBtn');
    btn.textContent = 'Signing in...';
    btn.disabled = true;

    try {
      const data = await apiLogin(email, password);
      setToken(data.token);
      setUser(data.user);
      window.location.replace('game.html');
    } catch (err) {
      showError(err.message || 'Login failed. Check your credentials.');
      resetButton('loginBtn', 'Sign in');
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('loginBtn').click();
  });
}

function initSignupPage() {
  if (getToken()) { window.location.replace('game.html'); return; }

  document.getElementById('signupBtn').addEventListener('click', async () => {
    const name     = document.getElementById('name').value.trim();
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!name || !email || !password) { showError('Please fill in all fields.'); return; }
    if (password.length < 6) { showError('Password must be at least 6 characters.'); return; }

    const btn = document.getElementById('signupBtn');
    btn.textContent = 'Creating account...';
    btn.disabled = true;

    try {
      const data = await apiSignup(name, email, password);
      setToken(data.token);
      setUser(data.user);
      window.location.replace('game.html');
    } catch (err) {
      showError(err.message || 'Registration failed.');
      resetButton('signupBtn', 'Create account');
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('signupBtn').click();
  });
}
