/* =============================================================
   LIFE DASHBOARD — script.js
   Sections:
   1. Utility helpers
   2. Greeting & Clock
   3. Focus Timer
   4. To-Do List
   5. Quick Links
   6. Light / Dark Mode
   7. Initialisation
============================================================= */


/* ─────────────────────────────────────────────────────────────
   1. UTILITY HELPERS
───────────────────────────────────────────────────────────── */

/**
 * Read a value from LocalStorage.
 * Returns null if the key doesn't exist.
 */
function storageGet(key) {
  return localStorage.getItem(key);
}

/**
 * Write a string value to LocalStorage.
 */
function storageSet(key, value) {
  localStorage.setItem(key, value);
}

/**
 * Read a JSON array from LocalStorage.
 * Returns an empty array if the key is missing or corrupted.
 */
function storageGetJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

/**
 * Write a JavaScript value as a JSON string to LocalStorage.
 */
function storageSetJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Pad a number to two digits (e.g. 5 → "05").
 */
function pad(n) {
  return String(n).padStart(2, '0');
}


/* ─────────────────────────────────────────────────────────────
   2. GREETING & CLOCK
───────────────────────────────────────────────────────────── */

const greetingTextEl = document.getElementById('greetingText');
const greetingNameEl = document.getElementById('greetingName');
const greetingClockEl = document.getElementById('greetingClock');
const greetingDateEl  = document.getElementById('greetingDate');
const nameInput       = document.getElementById('nameInput');
const saveNameBtn     = document.getElementById('saveNameBtn');

/** Return "Good Morning / Afternoon / Evening" based on current hour. */
function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return 'Good Morning ☀️';
  if (hour >= 12 && hour < 17) return 'Good Afternoon 🌤️';
  if (hour >= 17 && hour < 21) return 'Good Evening 🌆';
  return 'Good Night 🌙';
}

/** Return a formatted date string, e.g. "Monday, 1 January 2026". */
function formatDate(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day    : 'numeric',
    month  : 'long',
    year   : 'numeric',
  });
}

/** Refresh the clock, date, and greeting text every call. */
function updateClock() {
  const now  = new Date();
  const hour = now.getHours();

  greetingClockEl.textContent = `${pad(hour)}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  greetingDateEl.textContent  = formatDate(now);
  greetingTextEl.textContent  = getGreeting(hour);
}

/** Load a saved name from LocalStorage and display it. */
function loadName() {
  const saved = storageGet('userName');
  if (saved) {
    greetingNameEl.textContent = `Hello, ${saved}! 👋`;
    nameInput.value = saved;
  }
}

/** Save the name typed in the input, then update the greeting. */
function saveName() {
  const name = nameInput.value.trim();
  if (!name) return;
  storageSet('userName', name);
  greetingNameEl.textContent = `Hello, ${name}! 👋`;
}

/** Initialise greeting: load saved name, start clock interval. */
function initGreeting() {
  loadName();
  updateClock();
  setInterval(updateClock, 1000);
  saveNameBtn.addEventListener('click', saveName);
  nameInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') saveName();
  });
}


/* ─────────────────────────────────────────────────────────────
   3. FOCUS TIMER
───────────────────────────────────────────────────────────── */

const timerDisplayEl = document.getElementById('timerDisplay');
const timerStartBtn  = document.getElementById('timerStart');
const timerStopBtn   = document.getElementById('timerStop');
const timerResetBtn  = document.getElementById('timerReset');

const TIMER_DEFAULT = 25 * 60; // 25 minutes in seconds

let timerSeconds  = TIMER_DEFAULT; // current remaining seconds
let timerInterval = null;          // holds the setInterval reference

/** Render the current timerSeconds value onto the display element. */
function renderTimer() {
  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  timerDisplayEl.textContent = `${pad(mins)}:${pad(secs)}`;
}

/** Tick the timer down by one second; stop at zero. */
function tickTimer() {
  if (timerSeconds <= 0) {
    clearInterval(timerInterval);
    timerInterval = null;
    timerDisplayEl.textContent = '00:00';
    return;
  }
  timerSeconds -= 1;
  renderTimer();
}

/** Start the countdown. Prevents a second interval from starting if already running. */
function startTimer() {
  if (timerInterval !== null) return; // already running
  if (timerSeconds <= 0) return;      // nothing left to count
  timerInterval = setInterval(tickTimer, 1000);
}

/** Pause the countdown without resetting the remaining time. */
function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

/** Stop and restore the full 25-minute duration. */
function resetTimer() {
  stopTimer();
  timerSeconds = TIMER_DEFAULT;
  renderTimer();
}

/** Initialise timer: render default state and attach button listeners. */
function initTimer() {
  renderTimer();
  timerStartBtn.addEventListener('click', startTimer);
  timerStopBtn.addEventListener('click', stopTimer);
  timerResetBtn.addEventListener('click', resetTimer);
}


/* ─────────────────────────────────────────────────────────────
   4. TO-DO LIST
───────────────────────────────────────────────────────────── */

const todoInput        = document.getElementById('todoInput');
const todoAddBtn       = document.getElementById('todoAddBtn');
const todoListEl       = document.getElementById('todoList');
const duplicateWarning = document.getElementById('duplicateWarning');

const STORAGE_KEY_TODOS = 'lifeDashboard_todos';

/*
  Each task is an object:  { id: number, text: string, completed: boolean }
*/
let tasks = storageGetJSON(STORAGE_KEY_TODOS);

/** Persist the current tasks array to LocalStorage. */
function saveTasks() {
  storageSetJSON(STORAGE_KEY_TODOS, tasks);
}

/** Check whether a task with the same text (case-insensitive) already exists. */
function isDuplicateTask(text) {
  return tasks.some(
    (t) => t.text.toLowerCase() === text.toLowerCase()
  );
}

/**
 * Build and return a <li> element representing a single task.
 * This function is the single source of truth for task item markup.
 */
function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = `todo-item${task.completed ? ' completed' : ''}`;
  li.dataset.id = task.id;

  // ── Checkbox ──────────────────────────────────────────────
  const checkbox = document.createElement('input');
  checkbox.type      = 'checkbox';
  checkbox.className = 'todo-checkbox';
  checkbox.checked   = task.completed;
  checkbox.setAttribute('aria-label', `Mark "${task.text}" as completed`);

  checkbox.addEventListener('change', function () {
    toggleTask(task.id);
  });

  // ── Task text span ─────────────────────────────────────────
  const span = document.createElement('span');
  span.className   = 'todo-text';
  span.textContent = task.text;

  // ── Action buttons ─────────────────────────────────────────
  const actions = document.createElement('div');
  actions.className = 'todo-item-actions';

  const editBtn = document.createElement('button');
  editBtn.className   = 'btn btn-secondary';
  editBtn.textContent = '✏️ Edit';
  editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
  editBtn.addEventListener('click', function () {
    startEditTask(task.id, li, span);
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className   = 'btn btn-danger';
  deleteBtn.textContent = '🗑️';
  deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
  deleteBtn.addEventListener('click', function () {
    deleteTask(task.id);
  });

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(actions);

  return li;
}

/** Re-render the entire task list from the tasks array. */
function renderTasks() {
  todoListEl.innerHTML = '';
  tasks.forEach(function (task) {
    todoListEl.appendChild(createTaskElement(task));
  });
}

/** Add a new task from the input field. */
function addTask() {
  const text = todoInput.value.trim();

  if (!text) return; // ignore empty input

  // Duplicate check
  if (isDuplicateTask(text)) {
    duplicateWarning.classList.remove('hidden');
    // Auto-hide the warning after 2.5 seconds
    setTimeout(function () {
      duplicateWarning.classList.add('hidden');
    }, 2500);
    return;
  }

  duplicateWarning.classList.add('hidden');

  tasks.push({
    id       : Date.now(),   // unique numeric id from timestamp
    text     : text,
    completed: false,
  });

  saveTasks();
  renderTasks();
  todoInput.value = '';
  todoInput.focus();
}

/** Toggle the completed state of the task with the given id. */
function toggleTask(id) {
  tasks = tasks.map(function (t) {
    return t.id === id ? { ...t, completed: !t.completed } : t;
  });
  saveTasks();
  renderTasks();
}

/** Delete the task with the given id. */
function deleteTask(id) {
  tasks = tasks.filter(function (t) { return t.id !== id; });
  saveTasks();
  renderTasks();
}

/**
 * Switch a task item into inline edit mode.
 * Replaces the text span with an <input> and swaps Edit → Save.
 */
function startEditTask(id, li, span) {
  const task = tasks.find(function (t) { return t.id === id; });
  if (!task) return;

  // Replace span with input
  const editInput = document.createElement('input');
  editInput.type      = 'text';
  editInput.className = 'todo-edit-input';
  editInput.value     = task.text;
  editInput.maxLength = 100;
  li.replaceChild(editInput, span);
  editInput.focus();
  editInput.select();

  // Replace Edit button with Save button
  const actionsDiv = li.querySelector('.todo-item-actions');
  const editBtn    = actionsDiv.querySelector('.btn-secondary');

  const saveBtn = document.createElement('button');
  saveBtn.className   = 'btn btn-primary';
  saveBtn.textContent = '💾 Save';
  saveBtn.setAttribute('aria-label', 'Save edited task');
  actionsDiv.replaceChild(saveBtn, editBtn);

  function commitEdit() {
    const newText = editInput.value.trim();
    if (!newText) return; // don't save empty text

    // Duplicate check: allow saving unchanged text
    if (
      newText.toLowerCase() !== task.text.toLowerCase() &&
      isDuplicateTask(newText)
    ) {
      editInput.style.borderColor = '#d63031';
      editInput.setAttribute('title', 'Task already exists');
      return;
    }

    tasks = tasks.map(function (t) {
      return t.id === id ? { ...t, text: newText } : t;
    });
    saveTasks();
    renderTasks();
  }

  saveBtn.addEventListener('click', commitEdit);
  editInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') renderTasks(); // cancel edit
  });
}

/** Initialise To-Do list: load from storage, render, attach listeners. */
function initTodo() {
  renderTasks();
  todoAddBtn.addEventListener('click', addTask);
  todoInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') addTask();
  });
}


/* ─────────────────────────────────────────────────────────────
   5. QUICK LINKS
───────────────────────────────────────────────────────────── */

const linkNameInput = document.getElementById('linkNameInput');
const linkUrlInput  = document.getElementById('linkUrlInput');
const linkAddBtn    = document.getElementById('linkAddBtn');
const linksListEl   = document.getElementById('linksList');

const STORAGE_KEY_LINKS = 'lifeDashboard_links';

/*
  Each link is an object:  { id: number, name: string, url: string }
*/
let links = storageGetJSON(STORAGE_KEY_LINKS);

/** Persist the current links array to LocalStorage. */
function saveLinks() {
  storageSetJSON(STORAGE_KEY_LINKS, links);
}

/**
 * Ensure a URL starts with a protocol so the browser treats it as absolute.
 * "github.com" → "https://github.com"
 */
function normaliseUrl(url) {
  if (!/^https?:\/\//i.test(url)) {
    return 'https://' + url;
  }
  return url;
}

/** Re-render the entire links list from the links array. */
function renderLinks() {
  linksListEl.innerHTML = '';
  links.forEach(function (link) {
    const li = document.createElement('li');
    li.className = 'link-item';

    const a = document.createElement('a');
    a.href        = link.url;
    a.target      = '_blank';
    a.rel         = 'noopener noreferrer';
    a.textContent = link.name;
    a.title       = link.url;

    const deleteBtn = document.createElement('button');
    deleteBtn.className   = 'btn btn-danger';
    deleteBtn.textContent = '✕';
    deleteBtn.setAttribute('aria-label', `Delete link: ${link.name}`);
    deleteBtn.addEventListener('click', function () {
      deleteLink(link.id);
    });

    li.appendChild(a);
    li.appendChild(deleteBtn);
    linksListEl.appendChild(li);
  });
}

/** Add a new link from the two input fields. */
function addLink() {
  const name = linkNameInput.value.trim();
  const url  = linkUrlInput.value.trim();

  if (!name || !url) return; // both fields are required

  const normalisedUrl = normaliseUrl(url);

  links.push({
    id  : Date.now(),
    name: name,
    url : normalisedUrl,
  });

  saveLinks();
  renderLinks();
  linkNameInput.value = '';
  linkUrlInput.value  = '';
  linkNameInput.focus();
}

/** Delete the link with the given id. */
function deleteLink(id) {
  links = links.filter(function (l) { return l.id !== id; });
  saveLinks();
  renderLinks();
}

/** Initialise Quick Links: load from storage, render, attach listeners. */
function initLinks() {
  renderLinks();
  linkAddBtn.addEventListener('click', addLink);
  linkUrlInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') addLink();
  });
}


/* ─────────────────────────────────────────────────────────────
   6. LIGHT / DARK MODE
───────────────────────────────────────────────────────────── */

const themeToggleBtn = document.getElementById('themeToggle');
const STORAGE_KEY_THEME = 'lifeDashboard_theme';

/** Apply a theme ('dark' or 'light') to <body> and update button label. */
function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
    themeToggleBtn.textContent = '☀️ Light Mode';
  } else {
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
    themeToggleBtn.textContent = '🌙 Dark Mode';
  }
}

/** Toggle between dark and light, then save the choice. */
function toggleTheme() {
  const isDark = document.body.classList.contains('dark-mode');
  const next   = isDark ? 'light' : 'dark';
  applyTheme(next);
  storageSet(STORAGE_KEY_THEME, next);
}

/** Initialise theme: load saved preference or default to light. */
function initTheme() {
  const saved = storageGet(STORAGE_KEY_THEME) || 'light';
  applyTheme(saved);
  themeToggleBtn.addEventListener('click', toggleTheme);
}


/* ─────────────────────────────────────────────────────────────
   7. INITIALISATION
   Run all init functions once the DOM is fully loaded.
───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  initTheme();    // theme first so there's no flash of wrong colour
  initGreeting();
  initTimer();
  initTodo();
  initLinks();
});
