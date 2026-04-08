const API_BASE = '/api';

function getToken()  { return localStorage.getItem('tf_token'); }
function setToken(t) { localStorage.setItem('tf_token', t); }
function clearToken(){ localStorage.removeItem('tf_token'); }

function getUser() {
  const raw = localStorage.getItem('tf_user');
  return raw ? JSON.parse(raw) : null;
}
function setUser(user) { localStorage.setItem('tf_user', JSON.stringify(user)); }
function clearUser() { localStorage.removeItem('tf_user'); }

async function readJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Request failed.');
    err.status = res.status;
    throw err;
  }
  return data;
}

async function apiSignup(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  return readJson(res);
}

async function apiLogin(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return readJson(res);
}

function logout() {
  clearToken();
  clearUser();
  window.location.replace('login.html');
}

function requireAuth() {
  if (!getToken()) {
    window.location.replace('login.html');
    return false;
  }
  return true;
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  };
}

async function apiGetProfile() {
  const res = await fetch(`${API_BASE}/users/profile`, { headers: authHeaders() });
  return readJson(res);
}
