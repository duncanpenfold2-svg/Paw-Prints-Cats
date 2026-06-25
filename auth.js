const USERS_KEY = "catTrackerUsers";
const SESSION_KEY = "catTrackerCurrentUser";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function createUserId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `user_${Date.now()}`;
}

function getUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY));
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function registerUser(name, email, password) {
  const users = getUsers();
  const normEmail = normalizeEmail(email);

  if (users.find((u) => normalizeEmail(u.email) === normEmail)) {
    return { ok: false, message: "An account with this email already exists." };
  }

  const user = { id: createUserId(), name: String(name).trim(), email: normEmail, password: String(password) };
  users.push(user);
  saveUsers(users);
  return { ok: true, user };
}

function loginUser(email, password) {
  const users = getUsers();
  const normEmail = normalizeEmail(email);
  const match = users.find(
    (u) => normalizeEmail(u.email) === normEmail && u.password === String(password)
  );
  if (!match) return { ok: false, message: "Email or password is incorrect." };
  return { ok: true, user: match };
}

function getCurrentUser() {
  try {
    const u = JSON.parse(localStorage.getItem(SESSION_KEY));
    return u && u.id ? u : null;
  } catch {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem(SESSION_KEY);
}
