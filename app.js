// ── State ──────────────────────────────────────────────────────────────────

let currentUser = getCurrentUser();
let calendarDate = new Date();

const CAT_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#ef4444"];

function buildDateStr(day, month, year) {
  const y = String(year || "").trim();
  const m = String(month || "").trim();
  const d = String(day || "").trim();
  if (!d || !m || y.length < 4) return "";
  return `${y.padStart(4, "0")}-${m}-${d.padStart(2, "0")}`;
}

function splitDateStr(str) {
  if (!str) return { day: "", month: "", year: "" };
  const [y, m, d] = str.split("-");
  return { day: String(parseInt(d, 10)), month: m, year: y };
}

// ── Storage helpers ─────────────────────────────────────────────────────────

function catsKey()  { return `cats_${currentUser.id}`; }
function apptsKey() { return `appts_${currentUser.id}`; }

function loadCats() {
  try {
    const d = JSON.parse(localStorage.getItem(catsKey()));
    return Array.isArray(d) ? d : [];
  } catch { return []; }
}

function saveCats(cats) {
  try {
    localStorage.setItem(catsKey(), JSON.stringify(cats));
  } catch {
    setAppStatus("Could not save — storage full. Try removing a photo.");
  }
}

function loadAppts() {
  try {
    const a = JSON.parse(localStorage.getItem(apptsKey()));
    return Array.isArray(a) ? a : [];
  } catch { return []; }
}

function saveAppts(appts) {
  try {
    localStorage.setItem(apptsKey(), JSON.stringify(appts));
  } catch {
    setAppStatus("Could not save appointment — storage full.");
  }
}

function newId() {
  return window.crypto && window.crypto.randomUUID
    ? window.crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// ── Boot ────────────────────────────────────────────────────────────────────

setupAuthUI();
setupAppUI();
renderByAuthState();

// ── Auth UI ─────────────────────────────────────────────────────────────────

function setupAuthUI() {
  const tabLogin    = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");
  const panelLogin  = document.getElementById("panelLogin");
  const panelReg    = document.getElementById("panelRegister");

  if (getUsers().length === 0) {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    panelReg.classList.remove("hidden");
    panelLogin.classList.add("hidden");
  }

  tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    panelLogin.classList.remove("hidden");
    panelReg.classList.add("hidden");
    setAuthStatus("");
  });

  tabRegister.addEventListener("click", () => {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    panelReg.classList.remove("hidden");
    panelLogin.classList.add("hidden");
    setAuthStatus("");
  });

  document.querySelectorAll(".eye-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input     = document.getElementById(btn.dataset.target);
      const eyeOpen   = btn.querySelector(".eye-open");
      const eyeClosed = btn.querySelector(".eye-closed");
      const labelShow = btn.querySelector(".eye-label-show");
      const labelHide = btn.querySelector(".eye-label-hide");
      if (!input) return;
      if (input.type === "password") {
        input.type = "text";
        if (eyeOpen)   eyeOpen.classList.add("hidden");
        if (eyeClosed) eyeClosed.classList.remove("hidden");
        if (labelShow) labelShow.classList.add("hidden");
        if (labelHide) labelHide.classList.remove("hidden");
        btn.setAttribute("aria-label", "Hide password");
      } else {
        input.type = "password";
        if (eyeOpen)   eyeOpen.classList.remove("hidden");
        if (eyeClosed) eyeClosed.classList.add("hidden");
        if (labelShow) labelShow.classList.remove("hidden");
        if (labelHide) labelHide.classList.add("hidden");
        btn.setAttribute("aria-label", "Show password");
      }
    });
  });

  document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email    = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const result   = loginUser(email, password);
    if (!result.ok) { setAuthStatus(result.message); return; }
    currentUser = result.user;
    setCurrentUser(currentUser);
    renderByAuthState();
  });

  document.getElementById("registerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name     = document.getElementById("regName").value.trim();
    const email    = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    if (!name)     { setAuthStatus("Please enter your name."); return; }
    if (password.length < 6) { setAuthStatus("Password must be at least 6 characters."); return; }
    const result = registerUser(name, email, password);
    if (!result.ok) { setAuthStatus(result.message); return; }
    currentUser = result.user;
    setCurrentUser(currentUser);
    renderByAuthState();
  });
}

// ── App UI setup ─────────────────────────────────────────────────────────────

function setupAppUI() {
  document.getElementById("logoutBtn").addEventListener("click", () => {
    currentUser = null;
    clearCurrentUser();
    renderByAuthState();
  });

  document.getElementById("addCatBtn").addEventListener("click", () => showCatForm(null));
  document.getElementById("backFromCatBtn").addEventListener("click", showDashboard);
  document.getElementById("backFromApptBtn").addEventListener("click", showDashboard);

  document.getElementById("addApptBtn").addEventListener("click", () => showApptForm(null, null));

  document.getElementById("catPhoto").addEventListener("change", handlePhotoChange);
  document.getElementById("catForm").addEventListener("submit", saveCat);
  document.getElementById("deleteCatBtn").addEventListener("click", deleteCat);

  document.getElementById("apptForm").addEventListener("submit", saveAppt);
  document.getElementById("deleteApptBtn").addEventListener("click", deleteAppt);

  document.getElementById("calPrevBtn").addEventListener("click", () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
  });
  document.getElementById("calNextBtn").addEventListener("click", () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
  });
}

// ── Auth state ──────────────────────────────────────────────────────────────

function renderByAuthState() {
  const authSection = document.getElementById("authSection");
  const appSection  = document.getElementById("appSection");

  if (!currentUser) {
    authSection.classList.remove("hidden");
    appSection.classList.add("hidden");
    document.body.classList.add("auth-page");
    setAuthStatus("");
    return;
  }

  authSection.classList.add("hidden");
  appSection.classList.remove("hidden");
  document.body.classList.remove("auth-page");
  document.getElementById("welcomeText").textContent = `Hi ${currentUser.name}`;

  requestNotificationPermission();
  checkUpcomingNotifications();
  showDashboard();
}

// ── Views ────────────────────────────────────────────────────────────────────

function showDashboard() {
  setView("viewDashboard");
  renderCatGrid();
  renderCalendar();
  renderUpcoming();
}

function showCatForm(catId) {
  setView("viewCatForm");
  const cats = loadCats();
  const cat  = catId ? cats.find((c) => c.id === catId) : null;

  document.getElementById("catFormTitle").textContent = cat ? "Edit Cat" : "Add Cat";
  document.getElementById("catId").value      = cat ? cat.id : "";
  document.getElementById("catName").value    = cat ? cat.name : "";
  const dobParts = splitDateStr(cat ? (cat.dateOfBirth || "") : "");
  document.getElementById("catDobDay").value   = dobParts.day;
  document.getElementById("catDobMonth").value = dobParts.month;
  document.getElementById("catDobYear").value  = dobParts.year;
  document.getElementById("catWeight").value  = cat ? (cat.weight || "") : "";
  document.getElementById("vetName").value    = cat ? (cat.vetName || "") : "";
  document.getElementById("vetAddress").value = cat ? (cat.vetAddress || "") : "";
  document.getElementById("vetPhone").value   = cat ? (cat.vetPhone || "") : "";

  const preview = document.getElementById("photoPreview");
  preview.innerHTML = "";
  if (cat && cat.photo) {
    const img = document.createElement("img");
    img.src = cat.photo;
    img.alt = cat.name;
    preview.appendChild(img);
  } else {
    preview.innerHTML = `<span class="photo-placeholder">
      <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
        <path d="M12 2C9.5 2 8 3.5 8 5c0 .8.3 1.5.7 2.1C7.1 7.7 6 9.2 6 11c0 2.8 2.5 5 6 5s6-2.2 6-5c0-1.8-1.1-3.3-2.7-3.9C15.7 6.5 16 5.8 16 5c0-1.5-1.5-3-4-3zM9 15.5c-.8.4-1.5 1-2 1.8C6.4 18.4 6 19.6 6 21h12c0-1.4-.4-2.6-1-3.7-.5-.8-1.2-1.4-2-1.8C14.3 16.2 13.2 17 12 17s-2.3-.8-3-1.5z"/>
      </svg></span>`;
  }
  document.getElementById("catPhoto").value = "";

  const deleteBtn = document.getElementById("deleteCatBtn");
  if (cat) {
    deleteBtn.classList.remove("hidden");
    deleteBtn.dataset.catId = cat.id;
  } else {
    deleteBtn.classList.add("hidden");
  }
}

function showApptForm(apptId, prefillCatId) {
  setView("viewApptForm");
  const appts = loadAppts();
  const cats  = loadCats();
  const appt  = apptId ? appts.find((a) => a.id === apptId) : null;

  document.getElementById("apptFormTitle").textContent = appt ? "Edit Appointment" : "Add Appointment";
  document.getElementById("apptId").value    = appt ? appt.id : "";
  const apptDateParts = splitDateStr(appt ? appt.date : "");
  document.getElementById("apptDateDay").value   = apptDateParts.day;
  document.getElementById("apptDateMonth").value = apptDateParts.month;
  document.getElementById("apptDateYear").value  = apptDateParts.year;
  document.getElementById("apptTime").value  = appt ? (appt.time || "") : "";
  document.getElementById("apptNotes").value = appt ? (appt.notes || "") : "";

  const catSelect = document.getElementById("apptCat");
  catSelect.innerHTML = "";
  if (cats.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No cats added yet — add a cat first";
    catSelect.appendChild(opt);
  } else {
    cats.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      if (appt ? appt.catId === c.id : prefillCatId === c.id) opt.selected = true;
      catSelect.appendChild(opt);
    });
  }

  const typeSelect = document.getElementById("apptType");
  if (appt) {
    Array.from(typeSelect.options).forEach((o) => {
      o.selected = o.value === appt.type;
    });
  }

  const deleteBtn = document.getElementById("deleteApptBtn");
  if (appt) {
    deleteBtn.classList.remove("hidden");
    deleteBtn.dataset.apptId = appt.id;
  } else {
    deleteBtn.classList.add("hidden");
  }
}

function setView(viewId) {
  ["viewDashboard", "viewCatForm", "viewApptForm"].forEach((id) => {
    document.getElementById(id).classList.toggle("hidden", id !== viewId);
  });
  setAppStatus("");
}

// ── Cat CRUD ─────────────────────────────────────────────────────────────────

function renderCatGrid() {
  const grid = document.getElementById("catGrid");
  const cats = loadCats();
  grid.innerHTML = "";

  cats.forEach((cat, i) => {
    const card = document.createElement("div");
    card.className = "dog-card";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `Edit ${cat.name}`);

    const age    = cat.dateOfBirth ? calcAge(cat.dateOfBirth) : "";
    const weight = cat.weight ? `${cat.weight} kg` : "";
    const meta   = [age, weight].filter(Boolean).join(" · ");

    const color = CAT_COLORS[i % CAT_COLORS.length];

    const photoHTML = cat.photo
      ? `<img class="dog-card-photo" src="${cat.photo}" alt="${cat.name}" style="border-color: ${color}" />`
      : `<div class="dog-card-photo-placeholder" style="border-color: ${color}; color: ${color}">
          <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
            <path d="M12 2C9.5 2 8 3.5 8 5c0 .8.3 1.5.7 2.1C7.1 7.7 6 9.2 6 11c0 2.8 2.5 5 6 5s6-2.2 6-5c0-1.8-1.1-3.3-2.7-3.9C15.7 6.5 16 5.8 16 5c0-1.5-1.5-3-4-3z"/>
          </svg>
        </div>`;

    card.innerHTML = `
      ${photoHTML}
      <p class="dog-card-name">${cat.name}</p>
      ${meta ? `<p class="dog-card-meta">${meta}</p>` : ""}
      <p class="dog-card-vet">${cat.vetName || "No vet saved"}</p>`;

    card.addEventListener("click", () => showCatForm(cat.id));
    card.addEventListener("keydown", (e) => { if (e.key === "Enter") showCatForm(cat.id); });
    grid.appendChild(card);
  });

  const sizes = [null, "120px", "100px", "90px", "80px", "72px", "64px"];
  grid.style.setProperty("--dog-photo-size", sizes[cats.length] ?? "64px");
}

function handlePhotoChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const source = new Image();
    source.onload = () => {
      const MAX = 320;
      const scale = Math.min(1, MAX / Math.max(source.width, source.height));
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(source.width  * scale);
      canvas.height = Math.round(source.height * scale);
      canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
      const preview = document.getElementById("photoPreview");
      preview.innerHTML = "";
      const img = document.createElement("img");
      img.src = canvas.toDataURL("image/jpeg", 0.75);
      img.alt = "Preview";
      preview.appendChild(img);
    };
    source.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function saveCat(e) {
  e.preventDefault();
  const cats = loadCats();
  const id   = document.getElementById("catId").value;
  const name = document.getElementById("catName").value.trim();

  if (!name) { setAppStatus("Please enter the cat's name."); return; }

  const preview = document.getElementById("photoPreview");
  const imgEl   = preview.querySelector("img");
  const photo   = imgEl ? imgEl.src : (id ? (cats.find((c) => c.id === id) || {}).photo || "" : "");

  const catData = {
    id: id || newId(),
    name,
    photo,
    dateOfBirth: buildDateStr(
      document.getElementById("catDobDay").value,
      document.getElementById("catDobMonth").value,
      document.getElementById("catDobYear").value
    ),
    weight:      document.getElementById("catWeight").value,
    vetName:     document.getElementById("vetName").value.trim(),
    vetAddress:  document.getElementById("vetAddress").value.trim(),
    vetPhone:    document.getElementById("vetPhone").value.trim(),
  };

  if (id) {
    const idx = cats.findIndex((c) => c.id === id);
    if (idx !== -1) cats[idx] = catData;
    else cats.push(catData);
  } else {
    if (cats.length >= 6) { setAppStatus("Maximum of 6 cats reached."); return; }
    cats.push(catData);
  }

  saveCats(cats);
  showDashboard();
  setAppStatus(`${catData.name} saved.`);
}

function deleteCat() {
  const id = document.getElementById("deleteCatBtn").dataset.catId;
  if (!id) return;
  const cats  = loadCats().filter((c) => c.id !== id);
  const appts = loadAppts().filter((a) => a.catId !== id);
  saveCats(cats);
  saveAppts(appts);
  showDashboard();
  setAppStatus("Cat removed.");
}

// ── Appointment CRUD ─────────────────────────────────────────────────────────

function renderUpcoming() {
  const list  = document.getElementById("upcomingList");
  const appts = loadAppts();
  const cats  = loadCats();
  const today = todayStr();

  const upcoming = appts
    .filter((a) => a.date >= today)
    .sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")))
    .slice(0, 10);

  list.innerHTML = "";

  if (upcoming.length === 0) {
    list.innerHTML = `<p class="upcoming-empty">No upcoming appointments.<br>Click <strong>+ Add Appointment</strong> to get started.</p>`;
    return;
  }

  upcoming.forEach((appt) => {
    const cat     = cats.find((c) => c.id === appt.catId);
    const catName = cat ? cat.name : "Unknown cat";
    const catIdx  = cats.findIndex((c) => c.id === appt.catId);
    const color   = CAT_COLORS[catIdx % CAT_COLORS.length] ?? "#7C3AED";
    const dt      = new Date(appt.date + "T12:00:00");
    const dayNum  = dt.getDate();
    const month   = dt.toLocaleString("default", { month: "short" });
    const typeClass = (appt.type || "other").toLowerCase().replace(" ", "");
    const timeStr   = appt.time ? formatTime(appt.time) : "";

    const item = document.createElement("div");
    item.className = "appt-item";
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    item.style.borderLeft = `4px solid ${color}`;
    item.innerHTML = `
      <div class="appt-item-date" style="background: ${color}22; color: ${color}">
        <span class="appt-date-day">${dayNum}</span>
        <span class="appt-date-month">${month}</span>
      </div>
      <div class="appt-item-info">
        <p class="appt-item-title">${catName}</p>
        <p class="appt-item-sub">${timeStr ? timeStr + " · " : ""}${appt.notes ? appt.notes.slice(0, 50) : appt.type}</p>
      </div>
      <span class="appt-type-badge ${typeClass}">${appt.type || "Other"}</span>`;

    item.addEventListener("click", () => showApptForm(appt.id, null));
    item.addEventListener("keydown", (e) => { if (e.key === "Enter") showApptForm(appt.id, null); });
    list.appendChild(item);
  });
}

function saveAppt(e) {
  e.preventDefault();
  const appts  = loadAppts();
  const id     = document.getElementById("apptId").value;
  const catId  = document.getElementById("apptCat").value;
  const date   = buildDateStr(
    document.getElementById("apptDateDay").value,
    document.getElementById("apptDateMonth").value,
    document.getElementById("apptDateYear").value
  );

  if (!catId) { setAppStatus("Please add a cat first."); return; }
  if (!date)  { setAppStatus("Please enter a complete date (day, month and year)."); return; }

  const apptData = {
    id: id || newId(),
    catId,
    date,
    time:  document.getElementById("apptTime").value,
    type:  document.getElementById("apptType").value,
    notes: document.getElementById("apptNotes").value.trim(),
  };

  if (id) {
    const idx = appts.findIndex((a) => a.id === id);
    if (idx !== -1) appts[idx] = apptData;
    else appts.push(apptData);
  } else {
    appts.push(apptData);
  }

  saveAppts(appts);
  showDashboard();
  setAppStatus("Appointment saved.");
}

function deleteAppt() {
  const id = document.getElementById("deleteApptBtn").dataset.apptId;
  if (!id) return;
  saveAppts(loadAppts().filter((a) => a.id !== id));
  showDashboard();
  setAppStatus("Appointment removed.");
}

// ── Calendar ─────────────────────────────────────────────────────────────────

function renderCalendar() {
  const grid   = document.getElementById("calendarGrid");
  const label  = document.getElementById("calMonthLabel");
  const banner = document.getElementById("todayBanner");
  const appts  = loadAppts();
  const cats   = loadCats();
  const year   = calendarDate.getFullYear();
  const month  = calendarDate.getMonth();

  label.textContent = `${calendarDate.toLocaleString("default", { month: "long" })} ${year}`;

  if (banner) {
    const now = new Date();
    banner.textContent = `Today — ${now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`;
  }

  grid.innerHTML = "";

  ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach((d) => {
    const h = document.createElement("div");
    h.className = "cal-day-header";
    h.textContent = d;
    grid.appendChild(h);
  });

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayFull   = todayStr();

  for (let i = 0; i < firstDay; i++) {
    const cell = document.createElement("div");
    cell.className = "cal-day empty";
    grid.appendChild(cell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr  = `${year}-${pad(month + 1)}-${pad(day)}`;
    const dayAppts = appts.filter((a) => a.date === dateStr);

    const birthdayCats = cats.filter((c) => {
      if (!c.dateOfBirth) return false;
      const dob = new Date(c.dateOfBirth + "T12:00:00");
      return dob.getMonth() === month && dob.getDate() === day;
    });

    const cell = document.createElement("div");
    cell.className = "cal-day";
    if (dateStr === todayFull)     cell.classList.add("today");
    if (dayAppts.length > 0)      cell.classList.add("has-appt");
    if (birthdayCats.length > 0)  cell.classList.add("has-birthday");

    let inner = `<span>${day}</span>`;

    if (dayAppts.length > 0) {
      const dots = dayAppts.slice(0, 3).map((a) => {
        const catIdx = cats.findIndex((c) => c.id === a.catId);
        const color  = CAT_COLORS[catIdx % CAT_COLORS.length] ?? "#7C3AED";
        return `<span class="cal-dot" style="background: ${color}"></span>`;
      }).join("");
      inner += `<span class="cal-dot-row">${dots}</span>`;
      const titles = [`${dayAppts.length} appointment${dayAppts.length > 1 ? "s" : ""}`];
      if (birthdayCats.length > 0) titles.push(`🎂 ${birthdayCats.map((c) => c.name).join(", ")}`);
      cell.title = titles.join(" · ");
      cell.addEventListener("click", () => showApptForm(null, null));
    } else if (birthdayCats.length > 0) {
      cell.title = `🎂 ${birthdayCats.map((c) => c.name).join(", ")}'s birthday`;
    }

    if (birthdayCats.length > 0) {
      inner += `<span class="cal-birthday-icon" aria-label="Birthday">🎂</span>`;
    }

    cell.innerHTML = inner;
    grid.appendChild(cell);
  }
}

// ── Notifications ─────────────────────────────────────────────────────────────

function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function checkUpcomingNotifications() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (!currentUser) return;

  const appts   = loadAppts();
  const cats    = loadCats();
  const now     = new Date();
  const in24    = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const todayFull   = todayStr();
  const tomorrowStr = formatDate(in24);

  appts
    .filter((a) => a.date === todayFull || a.date === tomorrowStr)
    .forEach((a) => {
      const cat     = cats.find((c) => c.id === a.catId);
      const catName = cat ? cat.name : "your cat";
      const label   = a.date === todayFull ? "today" : "tomorrow";
      const timeStr = a.time ? ` at ${formatTime(a.time)}` : "";
      const body    = `${catName} — ${a.type}${timeStr}`;
      new Notification(`Appointment ${label}`, { body, icon: "" });
    });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcAge(dob) {
  if (!dob) return "";
  const birth = new Date(dob + "T12:00:00");
  const today = new Date();
  let years  = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }
  if (months < 0) months += 12;
  if (years === 0) return months === 1 ? "1 month old" : `${months} months old`;
  if (months === 0) return years === 1 ? "1 year old" : `${years} years old`;
  return `${years}yr ${months}mo`;
}

function todayStr() {
  return formatDate(new Date());
}

function formatDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const h12  = h % 12 || 12;
  return `${h12}:${pad(m)}${ampm}`;
}

function setAuthStatus(msg) {
  document.getElementById("authStatus").textContent = msg;
}

function setAppStatus(msg) {
  document.getElementById("appStatus").textContent = msg;
}
