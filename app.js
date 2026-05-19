'use strict';

// =============================================================
// app.js — Logique du compteur, capsules, jeu mémoire, dessin
// =============================================================

// ====== Constantes ======
const TARGET = new Date('2026-06-30T18:34:00+02:00').getTime();
const LS_KEY = 'compteur_retour_v1';

// ====== Helpers généraux ======
function pad(n) { return String(n).padStart(2, '0'); }
function todayKey() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}
function yesterdayKey() {
  const d = new Date(Date.now() - 86400000);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}
function formatDateFr(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ====== Persistance locale ======
function loadState() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
  catch { return {}; }
}
function saveState(s) { localStorage.setItem(LS_KEY, JSON.stringify(s)); }

let state = Object.assign({
  opened: {}, streak: 0, lastOpenDate: null,
  memoryBestTime: null, memoryBestMoves: null,
  memoryBests: {}
}, loadState());
if (!state.memoryBests) state.memoryBests = {};
// Migration : ancien record (4x4) -> nouvelle structure par taille
if (state.memoryBestTime != null && state.memoryBests['4x4'] == null) {
  state.memoryBests['4x4'] = { time: state.memoryBestTime, moves: state.memoryBestMoves };
}
function persist() { saveState(state); }

// =============================================================
// COMPTEUR
// =============================================================
(function initCountdown() {
  const elHours = document.getElementById('hours');
  const elBigLabel = document.getElementById('bigLabel');
  const elD = document.getElementById('d');
  const elH = document.getElementById('h');
  const elM = document.getElementById('m');
  const elS = document.getElementById('s');
  const elHero = document.getElementById('hero');

  function update() {
    const diff = TARGET - Date.now();
    if (diff <= 0) {
      elHero.innerHTML = '<div class="arrived">Tu es là 💕</div><p style="margin-top:16px;color:var(--muted)">Bienvenue à la maison.</p>';
      return;
    }
    const totalHours = Math.floor(diff / 3600000);
    elHours.textContent = totalHours.toLocaleString('fr-FR');
    elBigLabel.textContent = totalHours <= 1 ? 'heure restante' : 'heures restantes';
    elD.textContent = pad(Math.floor(diff / 86400000));
    elH.textContent = pad(Math.floor((diff % 86400000) / 3600000));
    elM.textContent = pad(Math.floor((diff % 3600000) / 60000));
    elS.textContent = pad(Math.floor((diff % 60000) / 1000));
  }
  update();
  setInterval(update, 1000);
})();

function daysRemaining() {
  return Math.max(0, Math.ceil((TARGET - Date.now()) / 86400000));
}

// =============================================================
// CARTE BERLIN → STRASBOURG
// =============================================================
(function initJourneyMap() {
  const fullPath = document.getElementById('journeyPath');
  const donePath = document.getElementById('journeyPathDone');
  const traveler = document.getElementById('journeyTraveler');
  const progressEl = document.getElementById('journeyProgress');
  const remainingEl = document.getElementById('journeyRemaining');
  if (!fullPath || !donePath || !traveler) return;

  const START = new Date(APP_CONFIG.PROMPTS_START_DATE + 'T00:00:00').getTime();
  const totalLen = fullPath.getTotalLength();
  donePath.style.strokeDasharray = totalLen;

  function updateJourney() {
    const now = Date.now();
    const total = TARGET - START;
    const elapsed = Math.max(0, now - START);
    const progress = total > 0 ? Math.min(1, elapsed / total) : 1;

    const pt = fullPath.getPointAtLength(totalLen * progress);
    traveler.setAttribute('x', pt.x);
    traveler.setAttribute('y', pt.y);

    donePath.style.strokeDashoffset = totalLen * (1 - progress);

    progressEl.textContent = Math.round(progress * 100) + '%';
    const remainingMs = Math.max(0, TARGET - now);
    const remainingDays = Math.ceil(remainingMs / 86400000);
    remainingEl.textContent = remainingDays + ' j';
  }
  updateJourney();
  // Rafraîchit toutes les minutes (pas besoin de plus, l'aiguille bouge lentement)
  setInterval(updateJourney, 60000);
})();

// =============================================================
// MODAL générique
// =============================================================
const modal = document.getElementById('modal');
const modalIcon = document.getElementById('modalIcon');
const modalTitle = document.getElementById('modalTitle');
const modalMsg = document.getElementById('modalMsg');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');

modalClose.addEventListener('click', () => modal.classList.remove('show'));
modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });

function showModal(icon, title, msg, bodyHtml) {
  modalIcon.textContent = icon;
  modalTitle.textContent = title;
  modalMsg.textContent = msg || '';
  modalBody.innerHTML = bodyHtml || '';
  modal.classList.add('show');
}

// =============================================================
// CAPSULES
// =============================================================
const todayContainer = document.getElementById('todayContainer');
const milestonesEl = document.getElementById('milestones');
const historyEl = document.getElementById('history');
const streakValueEl = document.getElementById('streakValue');
const openedCountEl = document.getElementById('openedCount');

function capsuleIndexForToday() { return Object.keys(state.opened).length; }

function openTodayCapsule() {
  const k = todayKey();
  if (state.opened[k] !== undefined) return;
  const idx = capsuleIndexForToday();
  const messages = APP_CONTENT.capsules;
  const msg = messages[Math.min(idx, messages.length - 1)];

  state.opened[k] = idx;
  if (state.lastOpenDate === yesterdayKey()) state.streak += 1;
  else if (state.lastOpenDate !== k) state.streak = 1;
  state.lastOpenDate = k;
  persist();

  showModal('💌', "Ta capsule du jour", msg);
  renderCapsules();
}

function renderCapsules() {
  streakValueEl.textContent = state.streak;
  openedCountEl.textContent = Object.keys(state.opened).length;

  const k = todayKey();
  const messages = APP_CONTENT.capsules;
  todayContainer.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'today-card';
  if (state.opened[k] !== undefined) {
    const idx = state.opened[k];
    const msg = messages[Math.min(idx, messages.length - 1)];
    card.innerHTML = `
      <div class="today-icon">💖</div>
      <div class="today-title">Déjà ouverte aujourd'hui</div>
      <div class="today-message">"${msg}"</div>
      <div class="today-hint" style="margin-top:10px">Reviens demain pour la prochaine 💕</div>`;
  } else {
    card.classList.add('locked');
    card.innerHTML = `
      <div class="today-icon">💌</div>
      <div class="today-title">Une capsule t'attend</div>
      <div class="today-hint">Tape pour l'ouvrir</div>`;
    card.addEventListener('click', openTodayCapsule);
  }
  todayContainer.appendChild(card);

  milestonesEl.innerHTML = '';
  const remaining = daysRemaining();
  const thresholds = Object.keys(APP_CONTENT.milestones).map(Number).sort((a, b) => b - a);
  thresholds.forEach(t => {
    const m = APP_CONTENT.milestones[t];
    const unlocked = remaining <= t;
    const tile = document.createElement('div');
    tile.className = 'milestone ' + (unlocked ? 'unlocked' : 'locked');
    tile.innerHTML = `
      <div class="milestone-icon">${unlocked ? m.icon : '🔒'}</div>
      <div class="milestone-title">${m.title}</div>`;
    tile.addEventListener('click', () => {
      if (unlocked) showModal(m.icon, m.title, m.message);
      else showModal('🔒', m.title, `Cette capsule s'ouvrira à ${m.title}.`);
    });
    milestonesEl.appendChild(tile);
  });

  historyEl.innerHTML = '';
  const entries = Object.entries(state.opened).sort((a, b) => b[0].localeCompare(a[0]));
  if (entries.length === 0) {
    historyEl.innerHTML = '<div class="history-empty">Tes capsules ouvertes apparaîtront ici.</div>';
  } else {
    entries.forEach(([date, idx]) => {
      const msg = messages[Math.min(idx, messages.length - 1)];
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <div class="history-date">${formatDateFr(date)}</div>
        <div class="history-msg">${msg}</div>`;
      historyEl.appendChild(item);
    });
  }
}

// =============================================================
// JEU MÉMOIRE
// =============================================================
const boardEl = document.getElementById('board');
const gameTimeEl = document.getElementById('gameTime');
const gameMovesEl = document.getElementById('gameMoves');
const gameBestEl = document.getElementById('gameBest');
const winBanner = document.getElementById('winBanner');
const gridSizeEl = document.getElementById('gridSize');
document.getElementById('newGame').addEventListener('click', startGame);
gridSizeEl.addEventListener('change', startGame);

let gameState = null;

function currentGridSize() {
  const [cols, rows] = gridSizeEl.value.split('x').map(Number);
  return { key: gridSizeEl.value, cols, rows, cards: cols * rows, pairs: (cols * rows) / 2 };
}

function startGame() {
  const size = currentGridSize();
  const pool = APP_CONTENT.memoryPairs;
  const nbPairs = Math.min(size.pairs, pool.length);
  const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
  const pairs = shuffledPool.slice(0, nbPairs);
  const deck = [...pairs, ...pairs]
    .map(v => ({ v, k: Math.random() }))
    .sort((a, b) => a.k - b.k)
    .map(o => o.v);

  boardEl.style.setProperty('--grid-cols', size.cols);
  boardEl.style.setProperty('--grid-rows', size.rows);

  gameState = {
    deck, flipped: [], matched: new Set(), moves: 0,
    startTime: Date.now(), timer: null, locked: false, won: false,
    sizeKey: size.key
  };

  winBanner.innerHTML = '';
  boardEl.innerHTML = '';
  deck.forEach((v, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    const valueHtml = typeof v === 'string'
      ? v
      : `<img src="${v.img}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:14px;display:block"/>`;
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-face card-front"></div>
        <div class="card-face card-back">${valueHtml}</div>
      </div>`;
    card.addEventListener('click', () => flipCard(i));
    boardEl.appendChild(card);
  });

  gameState.timer = setInterval(updateGameTime, 1000);
  updateGameTime();
  updateBestDisplay();
  gameMovesEl.textContent = '0';
}

function updateGameTime() {
  if (!gameState) return;
  gameTimeEl.textContent = Math.floor((Date.now() - gameState.startTime) / 1000) + 's';
}
function updateBestDisplay() {
  const key = gridSizeEl.value;
  const best = state.memoryBests[key];
  gameBestEl.textContent = best ? best.time + 's' : '—';
}

function flipCard(i) {
  if (!gameState || gameState.locked || gameState.won) return;
  if (gameState.matched.has(i) || gameState.flipped.includes(i)) return;
  const cards = boardEl.querySelectorAll('.card');
  cards[i].classList.add('flipped');
  gameState.flipped.push(i);

  if (gameState.flipped.length === 2) {
    gameState.moves += 1;
    gameMovesEl.textContent = gameState.moves;
    const [a, b] = gameState.flipped;
    const va = gameState.deck[a], vb = gameState.deck[b];
    const same = (typeof va === 'string' && typeof vb === 'string')
      ? va === vb : (va.img && vb.img && va.img === vb.img);
    if (same) {
      gameState.matched.add(a); gameState.matched.add(b);
      cards[a].classList.add('matched'); cards[b].classList.add('matched');
      gameState.flipped = [];
      if (gameState.matched.size === gameState.deck.length) winGame();
    } else {
      gameState.locked = true;
      setTimeout(() => {
        cards[a].classList.remove('flipped');
        cards[b].classList.remove('flipped');
        gameState.flipped = [];
        gameState.locked = false;
      }, 800);
    }
  }
}

function winGame() {
  gameState.won = true;
  clearInterval(gameState.timer);
  const seconds = Math.floor((Date.now() - gameState.startTime) / 1000);
  const key = gameState.sizeKey;
  const prev = state.memoryBests[key];
  const isRecord = !prev || seconds < prev.time;
  if (isRecord) {
    state.memoryBests[key] = { time: seconds, moves: gameState.moves };
    if (key === '4x4') {
      state.memoryBestTime = seconds;
      state.memoryBestMoves = gameState.moves;
    }
    persist();
    updateBestDisplay();
  }
  winBanner.innerHTML = `
    <h3>🎉 Bravo !</h3>
    <p>${seconds}s • ${gameState.moves} coups${isRecord ? ' • <strong style="color:var(--gold)">Nouveau record !</strong>' : ''}</p>
    <p style="margin-top:8px">${APP_CONTENT.memoryWinMessage}</p>`;
}

// =============================================================
// SUPABASE + AUTH (pseudo + mot de passe) + COUPLE
// =============================================================
const sb = window.supabase.createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_ANON_KEY);
let myUser = null;        // auth user
let myProfile = null;     // { id, couple_id, pseudo }
let myCouple = null;      // { id, code }

function pseudoToEmail(pseudo) {
  const slug = pseudo.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  if (!slug) throw new Error("Pseudo invalide (lettres et chiffres seulement).");
  return `${slug}@compteur.local`;
}

async function signUp(pseudo, password) {
  if (password.length < 6) throw new Error("Le mot de passe doit faire au moins 6 caractères.");
  const email = pseudoToEmail(pseudo);
  const { data, error } = await sb.auth.signUp({
    email, password, options: { data: { pseudo } }
  });
  if (error) {
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('already') || msg.includes('registered')) {
      throw new Error("Ce pseudo est déjà pris. Choisis-en un autre ou connecte-toi.");
    }
    throw new Error(error.message);
  }
  if (!data.session) {
    // Email confirmation activée → souci côté Supabase
    throw new Error("Confirmation email activée sur Supabase. Désactive-la dans Auth → Providers → Email.");
  }
  return data.user;
}

async function signIn(pseudo, password) {
  const email = pseudoToEmail(pseudo);
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error("Pseudo ou mot de passe incorrect.");
  return data.user;
}

async function signOut() {
  await sb.auth.signOut();
  myUser = null; myProfile = null; myCouple = null;
  lastLoadedUpdatedAt = null;
  resetCanvas();
}

async function loadProfile() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    myUser = null; myProfile = null; myCouple = null;
    return null;
  }
  myUser = session.user;
  const { data: profile } = await sb.from('profiles')
    .select('*').eq('id', myUser.id).maybeSingle();
  if (!profile) {
    // Filet de sécurité si le trigger handle_new_user n'a pas créé le profile
    const pseudo = myUser.user_metadata?.pseudo || myUser.email.split('@')[0];
    await sb.from('profiles').insert({ id: myUser.id, pseudo });
    const { data: created } = await sb.from('profiles').select('*').eq('id', myUser.id).maybeSingle();
    myProfile = created;
  } else {
    myProfile = profile;
  }
  if (!myProfile?.couple_id) { myCouple = null; return { profile: myProfile, couple: null }; }
  const { data: couple } = await sb.from('couples')
    .select('*').eq('id', myProfile.couple_id).maybeSingle();
  myCouple = couple;
  return { profile: myProfile, couple };
}

function generateCoupleCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

async function createCouple() {
  if (!myUser || !myProfile) throw new Error("Pas connecté.");
  let attempts = 0;
  while (attempts < 5) {
    const code = generateCoupleCode();
    const { data: couple, error } = await sb.from('couples').insert({ code }).select().single();
    if (!error) {
      await sb.from('profiles').update({ couple_id: couple.id }).eq('id', myUser.id);
      myProfile.couple_id = couple.id;
      myCouple = couple;
      return couple;
    }
    attempts++;
  }
  throw new Error("Impossible de générer un code unique. Réessaie.");
}

async function joinCouple(code) {
  if (!myUser || !myProfile) throw new Error("Pas connecté.");
  const { data: couple } = await sb.from('couples')
    .select('*').eq('code', code.toUpperCase()).maybeSingle();
  if (!couple) throw new Error("Code introuvable. Vérifie auprès de ton·a partenaire.");
  await sb.from('profiles').update({ couple_id: couple.id }).eq('id', myUser.id);
  myProfile.couple_id = couple.id;
  myCouple = couple;
  return couple;
}

async function leaveCouple() {
  if (!myProfile) return;
  await sb.from('profiles').update({ couple_id: null }).eq('id', myProfile.id);
  myProfile.couple_id = null;
  myCouple = null;
}

// =============================================================
// DESSIN — Onboarding (Auth → Couple → Main)
// =============================================================
const authView = document.getElementById('authView');
const coupleView = document.getElementById('coupleView');
const drawingMainEl = document.getElementById('drawingMain');
const coupleInfoEl = document.getElementById('coupleInfo');

// --- Auth view ---
let authMode = 'signup'; // 'signup' | 'signin'
const authPseudo = document.getElementById('authPseudo');
const authPwd = document.getElementById('authPwd');
const authSubmit = document.getElementById('authSubmit');
const authError = document.getElementById('authError');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');

document.querySelectorAll('.tab-btn[data-mode]').forEach(b => {
  b.addEventListener('click', () => {
    authMode = b.dataset.mode;
    document.querySelectorAll('.tab-btn[data-mode]').forEach(x => x.classList.toggle('active', x === b));
    authTitle.textContent = authMode === 'signup' ? 'Inscription' : 'Connexion';
    authSubtitle.textContent = authMode === 'signup'
      ? "Crée ton compte avec un pseudo et un mot de passe. Tu pourras te reconnecter depuis n'importe quel appareil."
      : "Reconnecte-toi avec le pseudo et le mot de passe que tu as choisis.";
    authSubmit.textContent = authMode === 'signup' ? "S'inscrire" : "Se connecter";
    authError.textContent = '';
  });
});

authSubmit.addEventListener('click', async () => {
  authError.textContent = '';
  const pseudo = authPseudo.value.trim();
  const pwd = authPwd.value;
  if (!pseudo || !pwd) { authError.textContent = "Pseudo et mot de passe requis."; return; }
  authSubmit.disabled = true;
  authSubmit.textContent = '…';
  try {
    if (authMode === 'signup') await signUp(pseudo, pwd);
    else await signIn(pseudo, pwd);
    await loadProfile();
    authPseudo.value = ''; authPwd.value = '';
    renderDrawingView();
  } catch (e) {
    authError.textContent = e.message;
  } finally {
    authSubmit.disabled = false;
    authSubmit.textContent = authMode === 'signup' ? "S'inscrire" : "Se connecter";
  }
});

// --- Couple view ---
document.getElementById('onCreateBtn').addEventListener('click', async () => {
  try {
    const couple = await createCouple();
    showModal('🎉', 'Couple créé !', `Envoie ce code à ton·a partenaire pour qu'iel le rejoigne :`,
      `<div class="code-display">${couple.code}</div>
       <button class="btn primary" id="copyCodeBtn">Copier le code</button>`);
    document.getElementById('copyCodeBtn').onclick = () => {
      navigator.clipboard?.writeText(couple.code);
      document.getElementById('copyCodeBtn').textContent = "Copié ✓";
    };
    renderDrawingView();
  } catch (e) {
    alert(e.message);
  }
});

document.getElementById('onJoinBtn').addEventListener('click', () => {
  showModal('🔑', 'Rejoindre un couple', 'Entre le code à 6 caractères reçu de ton·a partenaire :', `
    <div class="modal-form">
      <input class="input code-input" id="joinCode" maxlength="6" placeholder="XXXXXX" autocapitalize="characters"/>
    </div>
    <div class="modal-actions">
      <button class="btn" id="joinCancel">Annuler</button>
      <button class="btn primary" id="joinSubmit">Rejoindre</button>
    </div>
    <div class="modal-error" id="joinError"></div>`);
  modalClose.style.display = 'none';
  document.getElementById('joinCancel').onclick = () => { modal.classList.remove('show'); modalClose.style.display = ''; };
  document.getElementById('joinSubmit').onclick = async () => {
    const code = document.getElementById('joinCode').value.trim().toUpperCase();
    const errEl = document.getElementById('joinError');
    if (!code) { errEl.textContent = "Code requis."; return; }
    document.getElementById('joinSubmit').disabled = true;
    try {
      await joinCouple(code);
      modal.classList.remove('show');
      modalClose.style.display = '';
      renderDrawingView();
    } catch (e) {
      errEl.textContent = e.message;
      document.getElementById('joinSubmit').disabled = false;
    }
  };
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  if (!confirm("Te déconnecter ?")) return;
  await signOut();
  renderDrawingView();
});

// =============================================================
// DESSIN — Prompt du jour
// =============================================================
function todayPromptIndex() {
  const start = new Date(APP_CONFIG.PROMPTS_START_DATE + 'T00:00:00');
  const now = new Date();
  const diffDays = Math.floor((now - start) / 86400000);
  const len = APP_CONTENT.dailyPrompts.length;
  return ((diffDays % len) + len) % len;
}
function todayPrompt() { return APP_CONTENT.dailyPrompts[todayPromptIndex()]; }

// =============================================================
// DESSIN — Canvas
// =============================================================
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let drawTool = 'pen';
let drawColor = '#1a0a2e';
let drawSize = 6;
let drawing = false;
let lastX = 0, lastY = 0;
const history = [];
const MAX_HISTORY = 15;

function resetCanvas() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  history.length = 0;
}
resetCanvas();

function pushHistory() {
  history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  if (history.length > MAX_HISTORY) history.shift();
}
function undoOne() {
  if (history.length === 0) return;
  const snap = history.pop();
  ctx.putImageData(snap, 0, 0);
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function applyToolStyle() {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (drawTool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#000';
    ctx.globalAlpha = 1;
    ctx.lineWidth = drawSize * 2;
  } else if (drawTool === 'brush') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = drawColor;
    ctx.fillStyle = drawColor;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = drawSize * 3;
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = drawColor;
    ctx.fillStyle = drawColor;
    ctx.globalAlpha = 1;
    ctx.lineWidth = drawSize;
  }
}
function resetCanvasState() {
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

canvas.addEventListener('pointerdown', (e) => {
  if (canvas.classList.contains('locked')) return;
  e.preventDefault();
  canvas.setPointerCapture(e.pointerId);
  drawing = true;
  pushHistory();
  const { x, y } = getPos(e);
  lastX = x; lastY = y;
  applyToolStyle();
  ctx.beginPath();
  ctx.arc(x, y, ctx.lineWidth / 2, 0, Math.PI * 2);
  ctx.fill();
  resetCanvasState();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drawing) return;
  e.preventDefault();
  const { x, y } = getPos(e);
  applyToolStyle();
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();
  lastX = x; lastY = y;
  resetCanvasState();
});
['pointerup', 'pointercancel', 'pointerleave'].forEach(evt =>
  canvas.addEventListener(evt, () => { drawing = false; })
);

// Toolbar
document.querySelectorAll('.tool-btn[data-tool]').forEach(b => {
  b.addEventListener('click', () => {
    drawTool = b.dataset.tool;
    document.querySelectorAll('.tool-btn[data-tool]').forEach(x => x.classList.toggle('active', x === b));
  });
});
document.getElementById('sizeSlider').addEventListener('input', (e) => { drawSize = +e.target.value; });
document.getElementById('colorInput').addEventListener('input', (e) => {
  drawColor = e.target.value;
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
});
document.getElementById('undoBtn').addEventListener('click', undoOne);
document.getElementById('clearBtn').addEventListener('click', () => {
  if (!confirm("Effacer tout le dessin ?")) return;
  pushHistory();
  resetCanvas();
});

// Swatches
const SWATCH_COLORS = [
  '#000000', '#ffffff', '#ff5e7e', '#ff7eb3', '#ffb3c7', '#ffd084',
  '#ffe88a', '#a0d8ef', '#7fd6c1', '#a78bfa',
  '#4a1942', '#1a0a2e', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#6b7280', '#fde047'
];
const swatchesEl = document.getElementById('swatches');
SWATCH_COLORS.forEach(c => {
  const s = document.createElement('div');
  s.className = 'swatch';
  s.style.background = c;
  s.addEventListener('click', () => {
    drawColor = c;
    document.getElementById('colorInput').value = c;
    document.querySelectorAll('.swatch').forEach(x => x.classList.toggle('active', x === s));
  });
  swatchesEl.appendChild(s);
});

// =============================================================
// DESSIN — Save + Reveal + Galerie
// =============================================================
const drawingStatusEl = document.getElementById('drawingStatus');
const promptTextEl = document.getElementById('promptText');
const promptCountdownEl = document.getElementById('promptCountdown');
const saveBtn = document.getElementById('saveBtn');
const revealedSection = document.getElementById('revealedSection');
const todayRevealEl = document.getElementById('todayReveal');
const galleryEl = document.getElementById('gallery');

let myTodayDrawing = null;
let lastLoadedUpdatedAt = null;

function midnightCountdownText() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  const diff = next - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `Révélation dans ${h} h ${pad(m)} (à minuit)`;
}

function setCanvasLocked(locked) {
  canvas.classList.toggle('locked', locked);
}

function loadImageToCanvas(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resetCanvas();
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve();
    };
    img.src = dataUrl;
  });
}

async function saveMyDrawing() {
  if (!myProfile) return;
  saveBtn.disabled = true;
  saveBtn.textContent = 'Envoi…';
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const today = todayKey();
    const prompt = todayPrompt();
    const { error } = await sb.from('drawings').upsert({
      user_id: myProfile.id,
      couple_id: myProfile.couple_id,
      prompt_date: today,
      prompt_text: prompt,
      image_data: dataUrl
    }, { onConflict: 'user_id,prompt_date' });
    if (error) throw error;
    myTodayDrawing = { user_id: myProfile.id, prompt_date: today, prompt_text: prompt, image_data: dataUrl };
    saveBtn.textContent = '✓ Sauvegardé';
    setTimeout(() => { saveBtn.textContent = 'Modifier mon dessin'; saveBtn.disabled = false; }, 1500);
    await refreshDrawingsUI();
  } catch (e) {
    alert("Erreur en sauvegardant : " + e.message);
    saveBtn.disabled = false;
    saveBtn.textContent = 'Valider mon dessin';
  }
}
saveBtn.addEventListener('click', saveMyDrawing);

async function refreshDrawingsUI() {
  if (!myProfile) return;

  const today = todayKey();
  const { data: todays } = await sb.from('drawings').select('*').eq('prompt_date', today);
  const { data: pastRaw } = await sb.from('drawings').select('*')
    .lt('prompt_date', today).order('prompt_date', { ascending: false }).limit(60);

  // Profils du couple pour pseudo
  const { data: profiles } = await sb.from('profiles').select('id,pseudo').eq('couple_id', myProfile.couple_id);
  const pseudoById = Object.fromEntries((profiles || []).map(p => [p.id, p.pseudo]));

  // Aujourd'hui
  const mine = (todays || []).find(d => d.user_id === myProfile.id);
  const partners = (todays || []).filter(d => d.user_id !== myProfile.id);
  myTodayDrawing = mine || null;

  promptTextEl.textContent = todayPrompt();
  promptCountdownEl.textContent = midnightCountdownText();

  if (mine) {
    drawingStatusEl.innerHTML = `<strong>✓ Tu as déjà dessiné aujourd'hui.</strong> Tu peux modifier jusqu'à minuit.`;
    saveBtn.textContent = 'Modifier mon dessin';
    // Recharge le canvas seulement si le dessin a changé (autre appareil, ou première visite)
    if (mine.updated_at !== lastLoadedUpdatedAt) {
      await loadImageToCanvas(mine.image_data);
      lastLoadedUpdatedAt = mine.updated_at;
    }
  } else {
    drawingStatusEl.innerHTML = `Tu n'as pas encore dessiné aujourd'hui. <strong>Lance-toi 🎨</strong>`;
    saveBtn.textContent = 'Valider mon dessin';
    if (lastLoadedUpdatedAt) {
      resetCanvas();
      lastLoadedUpdatedAt = null;
    }
  }

  // Révélation
  revealedSection.style.display = 'none';
  todayRevealEl.innerHTML = '';
  // On ne montre la révélation que si on a accès aux dessins du partenaire (RLS = après minuit)
  // → si partners.length > 0, RLS l'a autorisé donc on est après minuit
  if (partners.length > 0) {
    revealedSection.style.display = 'block';
    [mine, ...partners].filter(Boolean).forEach(d => {
      const card = document.createElement('div');
      card.className = 'reveal-card';
      card.innerHTML = `
        <img src="${d.image_data}" alt=""/>
        <div class="reveal-info">
          <div class="reveal-author">${pseudoById[d.user_id] || '—'}</div>
          <div class="reveal-date">${d.prompt_text}</div>
        </div>`;
      todayRevealEl.appendChild(card);
    });
  }

  // Galerie jours passés (groupés par date)
  galleryEl.innerHTML = '';
  if (!pastRaw || pastRaw.length === 0) {
    galleryEl.innerHTML = '<div class="history-empty">Les dessins des jours précédents apparaîtront ici.</div>';
  } else {
    const byDate = {};
    pastRaw.forEach(d => { (byDate[d.prompt_date] = byDate[d.prompt_date] || []).push(d); });
    Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0])).forEach(([date, items]) => {
      const day = document.createElement('div');
      day.className = 'gallery-day';
      day.innerHTML = `
        <div class="gallery-day-header">
          <div class="gallery-day-date">${formatDateFr(date)}</div>
          <div class="gallery-day-prompt">« ${items[0].prompt_text} »</div>
        </div>
        <div class="reveal-grid">
          ${items.map(d => `
            <div class="reveal-card">
              <img src="${d.image_data}" alt=""/>
              <div class="reveal-info">
                <div class="reveal-author">${pseudoById[d.user_id] || '—'}</div>
              </div>
            </div>`).join('')}
        </div>`;
      galleryEl.appendChild(day);
    });
  }
}

function renderCoupleInfo() {
  if (!myProfile || !myCouple) { coupleInfoEl.innerHTML = ''; return; }
  coupleInfoEl.innerHTML = `
    <div>Couple <strong>${myCouple.code}</strong> · ${myProfile.pseudo}</div>
    <div style="display:flex;gap:12px">
      <button id="leaveBtn">Quitter</button>
      <button id="signoutBtn">Déconnexion</button>
    </div>`;
  document.getElementById('leaveBtn').onclick = async () => {
    if (!confirm("Quitter ce couple ?")) return;
    await leaveCouple();
    lastLoadedUpdatedAt = null;
    resetCanvas();
    renderDrawingView();
  };
  document.getElementById('signoutBtn').onclick = async () => {
    if (!confirm("Te déconnecter ?")) return;
    await signOut();
    renderDrawingView();
  };
}

async function renderDrawingView() {
  // 3 états : pas connecté / connecté sans couple / connecté avec couple
  if (!myUser) {
    authView.style.display = 'block';
    coupleView.style.display = 'none';
    drawingMainEl.style.display = 'none';
    return;
  }
  if (!myCouple) {
    authView.style.display = 'none';
    coupleView.style.display = 'block';
    drawingMainEl.style.display = 'none';
    document.getElementById('coupleViewPseudo').textContent = myProfile?.pseudo || '';
    return;
  }
  authView.style.display = 'none';
  coupleView.style.display = 'none';
  drawingMainEl.style.display = 'block';
  renderCoupleInfo();
  promptTextEl.textContent = todayPrompt();
  promptCountdownEl.textContent = midnightCountdownText();
  await refreshDrawingsUI();
}

// Refresh countdown to midnight every minute
setInterval(() => {
  if (drawingMainEl.style.display !== 'none') {
    promptCountdownEl.textContent = midnightCountdownText();
  }
}, 60000);

// =============================================================
// PUZZLE PHOTO (taquin)
// =============================================================
const puzzleBoardEl = document.getElementById('puzzleBoard');
const puzzlePreviewEl = document.getElementById('puzzlePreview');
const puzzleMovesEl = document.getElementById('puzzleMoves');
const puzzleSizeEl = document.getElementById('puzzleSize');
const puzzleWinBannerEl = document.getElementById('puzzleWinBanner');

let puzzleState = null;

function pickRandomPhoto(exclude) {
  const photos = (APP_CONTENT.memoryPairs || []).filter(p => p && p.img);
  if (photos.length === 0) return null;
  const choices = exclude ? photos.filter(p => p.img !== exclude) : photos;
  const pool = choices.length > 0 ? choices : photos;
  return pool[Math.floor(Math.random() * pool.length)].img;
}

function startPuzzle(size, photo) {
  const n = size * size;
  const pic = photo || pickRandomPhoto();
  if (!pic) return;
  puzzleState = {
    size,
    photo: pic,
    tiles: Array.from({ length: n }, (_, i) => i),
    emptyIdx: n - 1,
    moves: 0,
    won: false
  };
  puzzleBoardEl.style.setProperty('--puzzle-size', size);
  puzzlePreviewEl.src = pic;
  puzzleWinBannerEl.innerHTML = '';
  shufflePuzzle(size * size * 12);
  renderPuzzle();
  puzzleMovesEl.textContent = '0';
}

function shufflePuzzle(steps) {
  // Mouvements aléatoires depuis l'état résolu = puzzle toujours résoluble
  let lastMoved = -1;
  for (let s = 0; s < steps; s++) {
    const neighbors = puzzleNeighbors(puzzleState.emptyIdx);
    const candidates = neighbors.filter(i => i !== lastMoved);
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    lastMoved = puzzleState.emptyIdx;
    swapTiles(pick, puzzleState.emptyIdx);
    puzzleState.emptyIdx = pick;
  }
  puzzleState.moves = 0;
}

function puzzleNeighbors(idx) {
  const size = puzzleState.size;
  const r = Math.floor(idx / size), c = idx % size;
  const out = [];
  if (r > 0) out.push(idx - size);
  if (r < size - 1) out.push(idx + size);
  if (c > 0) out.push(idx - 1);
  if (c < size - 1) out.push(idx + 1);
  return out;
}

function swapTiles(a, b) {
  const t = puzzleState.tiles[a];
  puzzleState.tiles[a] = puzzleState.tiles[b];
  puzzleState.tiles[b] = t;
}

function renderPuzzle() {
  const size = puzzleState.size;
  puzzleBoardEl.innerHTML = '';
  for (let i = 0; i < size * size; i++) {
    const tile = document.createElement('div');
    tile.className = 'puzzle-tile';
    if (i === puzzleState.emptyIdx) {
      tile.classList.add('empty');
    } else {
      const origin = puzzleState.tiles[i];
      const r = Math.floor(origin / size), c = origin % size;
      tile.style.backgroundImage = `url(${puzzleState.photo})`;
      tile.style.backgroundPosition = `${(c / (size - 1)) * 100}% ${(r / (size - 1)) * 100}%`;
      if (puzzleState.tiles[i] === i) tile.classList.add('solved');
      tile.addEventListener('click', () => tryPuzzleMove(i));
    }
    puzzleBoardEl.appendChild(tile);
  }
}

function tryPuzzleMove(i) {
  if (!puzzleState || puzzleState.won) return;
  if (!puzzleNeighbors(i).includes(puzzleState.emptyIdx)) return;
  swapTiles(i, puzzleState.emptyIdx);
  puzzleState.emptyIdx = i;
  puzzleState.moves += 1;
  puzzleMovesEl.textContent = puzzleState.moves;
  renderPuzzle();
  if (puzzleState.tiles.every((v, idx) => v === idx)) winPuzzle();
}

function winPuzzle() {
  puzzleState.won = true;
  puzzleWinBannerEl.innerHTML = `
    <div class="win-banner">
      <h3>🎉 Reconstitué !</h3>
      <p>${puzzleState.moves} coups • ${puzzleState.size}×${puzzleState.size}</p>
      <p style="margin-top:8px">${APP_CONTENT.puzzleWinMessage || ''}</p>
    </div>`;
  // On retire la case vide pour révéler la photo entière
  const tiles = puzzleBoardEl.querySelectorAll('.puzzle-tile');
  const emptyTile = tiles[puzzleState.emptyIdx];
  if (emptyTile) {
    const size = puzzleState.size;
    const r = Math.floor(puzzleState.emptyIdx / size), c = puzzleState.emptyIdx % size;
    emptyTile.classList.remove('empty');
    emptyTile.style.backgroundImage = `url(${puzzleState.photo})`;
    emptyTile.style.backgroundPosition = `${(c / (size - 1)) * 100}% ${(r / (size - 1)) * 100}%`;
  }
}

puzzleSizeEl.addEventListener('change', () => startPuzzle(+puzzleSizeEl.value));
document.getElementById('puzzleNewPhoto').addEventListener('click', () => {
  startPuzzle(+puzzleSizeEl.value, pickRandomPhoto(puzzleState?.photo));
});
document.getElementById('puzzleShuffle').addEventListener('click', () => {
  startPuzzle(+puzzleSizeEl.value, puzzleState?.photo);
});

// =============================================================
// QUESTION DU JOUR
// =============================================================
const questionGateEl = document.getElementById('questionGate');
const questionMainEl = document.getElementById('questionMain');
const questionTextEl = document.getElementById('questionText');
const questionInputEl = document.getElementById('questionInput');
const questionSaveBtn = document.getElementById('questionSave');
const questionAnswerWrap = document.getElementById('questionAnswerWrap');
const questionRevealEl = document.getElementById('questionReveal');
const questionHistoryEl = document.getElementById('questionHistory');

function todayQuestionIndex() {
  const start = new Date(APP_CONFIG.PROMPTS_START_DATE + 'T00:00:00');
  const now = new Date();
  const diffDays = Math.floor((now - start) / 86400000);
  const len = (APP_CONTENT.dailyQuestions || []).length;
  if (len === 0) return 0;
  return ((diffDays % len) + len) % len;
}
function todayQuestion() {
  return (APP_CONTENT.dailyQuestions || [])[todayQuestionIndex()] || '';
}

async function saveMyAnswer() {
  if (!myProfile || !myProfile.couple_id) return;
  const text = questionInputEl.value.trim();
  if (!text) return;
  questionSaveBtn.disabled = true;
  questionSaveBtn.textContent = 'Envoi…';
  try {
    const today = todayKey();
    const { error } = await sb.from('daily_answers').upsert({
      user_id: myProfile.id,
      couple_id: myProfile.couple_id,
      question_date: today,
      question_text: todayQuestion(),
      answer_text: text
    }, { onConflict: 'user_id,question_date' });
    if (error) throw error;
    await refreshQuestionUI();
  } catch (e) {
    alert("Erreur en sauvegardant : " + e.message);
    questionSaveBtn.disabled = false;
    questionSaveBtn.textContent = 'Envoyer ma réponse';
  }
}
questionSaveBtn.addEventListener('click', saveMyAnswer);

function bubbleHtml(authorLabel, text, mine) {
  return `
    <div class="bubble ${mine ? 'mine' : 'partner'}">
      <div class="bubble-author">${authorLabel}</div>
      <div class="bubble-text">${escapeHtml(text)}</div>
    </div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

async function refreshQuestionUI() {
  if (!myProfile || !myProfile.couple_id) return;
  questionTextEl.textContent = todayQuestion();

  const today = todayKey();
  const { data: todays } = await sb.from('daily_answers')
    .select('*').eq('question_date', today);

  const { data: profiles } = await sb.from('profiles')
    .select('id,pseudo').eq('couple_id', myProfile.couple_id);
  const pseudoById = Object.fromEntries((profiles || []).map(p => [p.id, p.pseudo]));

  const mine = (todays || []).find(d => d.user_id === myProfile.id);
  const partner = (todays || []).find(d => d.user_id !== myProfile.id);

  questionRevealEl.innerHTML = '';
  questionRevealEl.style.display = 'none';

  if (!mine) {
    // Pas encore répondu : on montre l'éditeur
    questionAnswerWrap.style.display = 'block';
    questionInputEl.value = '';
    questionSaveBtn.disabled = false;
    questionSaveBtn.textContent = 'Envoyer ma réponse';
  } else {
    // J'ai répondu : on montre ma bulle + bouton éditer
    questionAnswerWrap.style.display = 'none';
    questionRevealEl.style.display = 'block';
    questionRevealEl.innerHTML = bubbleHtml(`Toi (${myProfile.pseudo})`, mine.answer_text, true);

    if (partner) {
      questionRevealEl.innerHTML += bubbleHtml(pseudoById[partner.user_id] || 'Partenaire', partner.answer_text, false);
    } else {
      questionRevealEl.innerHTML += `<div class="question-waiting">En attente de la réponse de ton·a partenaire…</div>`;
    }
    questionRevealEl.innerHTML += `
      <div class="game-actions">
        <button class="btn" id="questionEditBtn">Modifier ma réponse</button>
      </div>`;
    document.getElementById('questionEditBtn').onclick = () => {
      questionAnswerWrap.style.display = 'block';
      questionInputEl.value = mine.answer_text;
      questionInputEl.focus();
    };
  }

  // Historique des jours passés (groupés par date)
  const { data: pastRaw } = await sb.from('daily_answers').select('*')
    .lt('question_date', today).order('question_date', { ascending: false }).limit(120);

  questionHistoryEl.innerHTML = '';
  if (!pastRaw || pastRaw.length === 0) {
    questionHistoryEl.innerHTML = '<div class="history-empty">Les questions précédentes apparaîtront ici.</div>';
    return;
  }
  const byDate = {};
  pastRaw.forEach(d => { (byDate[d.question_date] = byDate[d.question_date] || []).push(d); });
  Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0])).forEach(([date, items]) => {
    const day = document.createElement('div');
    day.className = 'question-day';
    const bubbles = items.map(it => bubbleHtml(
      pseudoById[it.user_id] || '—',
      it.answer_text,
      it.user_id === myProfile.id
    )).join('');
    day.innerHTML = `
      <div class="question-day-header">
        <div class="question-day-date">${formatDateFr(date)}</div>
        <div class="question-day-text">« ${escapeHtml(items[0].question_text)} »</div>
      </div>
      ${bubbles}`;
    questionHistoryEl.appendChild(day);
  });
}

async function renderQuestionView() {
  if (!myUser || !myProfile || !myProfile.couple_id) {
    questionGateEl.style.display = 'block';
    questionMainEl.style.display = 'none';
    return;
  }
  questionGateEl.style.display = 'none';
  questionMainEl.style.display = 'block';
  questionTextEl.textContent = todayQuestion();
  await refreshQuestionUI();
}

document.getElementById('questionGoAuth').addEventListener('click', () => switchView('drawing'));

// =============================================================
// LISTE À FAIRE AU RETOUR (bucket)
// =============================================================
const bucketGateEl = document.getElementById('bucketGate');
const bucketMainEl = document.getElementById('bucketMain');
const bucketListEl = document.getElementById('bucketList');
const bucketInputEl = document.getElementById('bucketInput');
const bucketAddBtn = document.getElementById('bucketAdd');
const bucketStatsEl = document.getElementById('bucketStats');

async function loadBucketItems() {
  if (!myProfile || !myProfile.couple_id) return [];
  const { data, error } = await sb.from('bucket_items')
    .select('*').eq('couple_id', myProfile.couple_id)
    .order('done', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
}

async function refreshBucketUI() {
  if (!myProfile || !myProfile.couple_id) return;
  const items = await loadBucketItems();

  const { data: profiles } = await sb.from('profiles')
    .select('id,pseudo').eq('couple_id', myProfile.couple_id);
  const pseudoById = Object.fromEntries((profiles || []).map(p => [p.id, p.pseudo]));

  const total = items.length;
  const done = items.filter(i => i.done).length;
  bucketStatsEl.innerHTML = total === 0
    ? `Commencez votre liste : <strong>0 idée</strong>`
    : `<strong>${done}/${total}</strong> chose${total > 1 ? 's' : ''} cochée${done > 1 ? 's' : ''}`;

  bucketListEl.innerHTML = '';
  if (items.length === 0) {
    bucketListEl.innerHTML = '<div class="history-empty">Ajoutez votre première idée 💫</div>';
    return;
  }
  items.forEach(it => {
    const row = document.createElement('div');
    row.className = 'bucket-item' + (it.done ? ' done' : '');
    const author = pseudoById[it.created_by] || '—';
    const doneBy = it.done && it.done_by ? (pseudoById[it.done_by] || '—') : null;
    row.innerHTML = `
      <div class="bucket-check">${it.done ? '✓' : ''}</div>
      <div class="bucket-text">
        ${escapeHtml(it.text)}
        <div class="bucket-meta">Ajouté par ${escapeHtml(author)}${doneBy ? ` · coché par ${escapeHtml(doneBy)}` : ''}</div>
      </div>
      <button class="bucket-del" title="Supprimer">🗑</button>`;
    row.querySelector('.bucket-check').onclick = () => toggleBucketItem(it);
    row.querySelector('.bucket-del').onclick = () => {
      if (confirm("Supprimer cette idée ?")) deleteBucketItem(it.id);
    };
    bucketListEl.appendChild(row);
  });
}

async function addBucketItem() {
  if (!myProfile || !myProfile.couple_id) return;
  const text = bucketInputEl.value.trim();
  if (!text) return;
  bucketAddBtn.disabled = true;
  try {
    const { error } = await sb.from('bucket_items').insert({
      couple_id: myProfile.couple_id,
      created_by: myProfile.id,
      text
    });
    if (error) throw error;
    bucketInputEl.value = '';
    await refreshBucketUI();
  } catch (e) {
    alert("Erreur : " + e.message);
  } finally {
    bucketAddBtn.disabled = false;
  }
}
bucketAddBtn.addEventListener('click', addBucketItem);
bucketInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); addBucketItem(); }
});

async function toggleBucketItem(item) {
  const newDone = !item.done;
  const { error } = await sb.from('bucket_items').update({
    done: newDone,
    done_by: newDone ? myProfile.id : null,
    done_at: newDone ? new Date().toISOString() : null
  }).eq('id', item.id);
  if (error) { alert("Erreur : " + error.message); return; }
  await refreshBucketUI();
}

async function deleteBucketItem(id) {
  const { error } = await sb.from('bucket_items').delete().eq('id', id);
  if (error) { alert("Erreur : " + error.message); return; }
  await refreshBucketUI();
}

async function renderBucketView() {
  if (!myUser || !myProfile || !myProfile.couple_id) {
    bucketGateEl.style.display = 'block';
    bucketMainEl.style.display = 'none';
    return;
  }
  bucketGateEl.style.display = 'none';
  bucketMainEl.style.display = 'block';
  await refreshBucketUI();
}

document.getElementById('bucketGoAuth').addEventListener('click', () => switchView('drawing'));

// =============================================================
// JOURNAL COMMUN
// =============================================================
const journalGateEl = document.getElementById('journalGate');
const journalMainEl = document.getElementById('journalMain');
const journalInputEl = document.getElementById('journalInput');
const journalPublishBtn = document.getElementById('journalPublish');
const journalListEl = document.getElementById('journalList');
const moodPickerEl = document.getElementById('moodPicker');

let journalMood = '';
let journalEditingId = null;

moodPickerEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.mood-btn');
  if (!btn) return;
  journalMood = btn.dataset.mood || '';
  moodPickerEl.querySelectorAll('.mood-btn').forEach(b =>
    b.classList.toggle('active', b === btn)
  );
});

function formatJournalDate(iso) {
  const d = new Date(iso);
  const today = new Date(); today.setHours(0,0,0,0);
  const yest = new Date(today.getTime() - 86400000);
  const that = new Date(d); that.setHours(0,0,0,0);
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (that.getTime() === today.getTime()) return `Aujourd'hui • ${time}`;
  if (that.getTime() === yest.getTime()) return `Hier • ${time}`;
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) + ` • ${time}`;
}

async function publishJournalEntry() {
  if (!myProfile || !myProfile.couple_id) return;
  const text = journalInputEl.value.trim();
  if (!text) return;
  journalPublishBtn.disabled = true;
  journalPublishBtn.textContent = '…';
  try {
    if (journalEditingId) {
      const { error } = await sb.from('journal_entries').update({
        text, mood: journalMood || null
      }).eq('id', journalEditingId);
      if (error) throw error;
      journalEditingId = null;
    } else {
      const { error } = await sb.from('journal_entries').insert({
        couple_id: myProfile.couple_id,
        user_id: myProfile.id,
        text,
        mood: journalMood || null
      });
      if (error) throw error;
    }
    journalInputEl.value = '';
    journalMood = '';
    moodPickerEl.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    await refreshJournalUI();
  } catch (e) {
    alert("Erreur : " + e.message);
  } finally {
    journalPublishBtn.disabled = false;
    journalPublishBtn.textContent = journalEditingId ? 'Modifier' : 'Publier';
  }
}
journalPublishBtn.addEventListener('click', publishJournalEntry);

async function deleteJournalEntry(id) {
  const { error } = await sb.from('journal_entries').delete().eq('id', id);
  if (error) { alert("Erreur : " + error.message); return; }
  if (journalEditingId === id) {
    journalEditingId = null;
    journalInputEl.value = '';
    journalPublishBtn.textContent = 'Publier';
  }
  await refreshJournalUI();
}

function startEditJournal(entry) {
  journalEditingId = entry.id;
  journalInputEl.value = entry.text;
  journalMood = entry.mood || '';
  moodPickerEl.querySelectorAll('.mood-btn').forEach(b =>
    b.classList.toggle('active', (b.dataset.mood || '') === journalMood)
  );
  journalPublishBtn.textContent = 'Modifier';
  journalInputEl.focus();
  journalInputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function refreshJournalUI() {
  if (!myProfile || !myProfile.couple_id) return;
  const { data: entries, error } = await sb.from('journal_entries')
    .select('*').eq('couple_id', myProfile.couple_id)
    .order('created_at', { ascending: false }).limit(200);
  if (error) { console.error(error); return; }

  const { data: profiles } = await sb.from('profiles')
    .select('id,pseudo').eq('couple_id', myProfile.couple_id);
  const pseudoById = Object.fromEntries((profiles || []).map(p => [p.id, p.pseudo]));

  journalListEl.innerHTML = '';
  if (!entries || entries.length === 0) {
    journalListEl.innerHTML = '<div class="history-empty">Aucune entrée pour l\'instant. Écris la première 💕</div>';
    return;
  }
  entries.forEach(e => {
    const mine = e.user_id === myProfile.id;
    const row = document.createElement('div');
    row.className = 'journal-entry ' + (mine ? 'mine' : 'partner');
    const author = pseudoById[e.user_id] || '—';
    const moodHtml = e.mood ? `<span class="journal-mood">${e.mood}</span>` : '';
    row.innerHTML = `
      <div class="journal-meta">
        <div class="journal-author">${moodHtml}${escapeHtml(author)}</div>
        <div class="journal-date">${formatJournalDate(e.created_at)}${e.updated_at && e.updated_at !== e.created_at ? ' · modifié' : ''}</div>
      </div>
      <div class="journal-text">${escapeHtml(e.text)}</div>
      ${mine ? `
        <div class="journal-actions">
          <button class="journal-edit">Modifier</button>
          <button class="journal-del">Supprimer</button>
        </div>` : ''}`;
    if (mine) {
      row.querySelector('.journal-edit').onclick = () => startEditJournal(e);
      row.querySelector('.journal-del').onclick = () => {
        if (confirm("Supprimer cette entrée ?")) deleteJournalEntry(e.id);
      };
    }
    journalListEl.appendChild(row);
  });
}

async function renderJournalView() {
  if (!myUser || !myProfile || !myProfile.couple_id) {
    journalGateEl.style.display = 'block';
    journalMainEl.style.display = 'none';
    return;
  }
  journalGateEl.style.display = 'none';
  journalMainEl.style.display = 'block';
  await refreshJournalUI();
}

document.getElementById('journalGoAuth').addEventListener('click', () => switchView('drawing'));

// =============================================================
// NAVIGATION (bottom nav + top burger)
// =============================================================
const burgerBtn = document.getElementById('burgerBtn');
const menuOverlay = document.getElementById('menuOverlay');

function setBurgerOpen(open) {
  burgerBtn.classList.toggle('open', open);
  menuOverlay.classList.toggle('open', open);
  burgerBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  document.body.style.overflow = open ? 'hidden' : '';
}
burgerBtn.addEventListener('click', () => setBurgerOpen(!menuOverlay.classList.contains('open')));

// =============================================================
// JIGSAW (vrai puzzle pièces avec drag-and-drop)
// =============================================================
const jigWorkspaceEl = document.getElementById('jigWorkspace');
const jigTargetEl = document.getElementById('jigTarget');
const jigPileEl = document.getElementById('jigPile');
const jigPreviewEl = document.getElementById('jigPreview');
const jigSizeEl = document.getElementById('jigSize');
const jigPlacedEl = document.getElementById('jigPlaced');
const jigTotalEl = document.getElementById('jigTotal');
const jigWinBannerEl = document.getElementById('jigWinBanner');

let jigsawState = null;
let jigGrid = null;          // jigGrid[i][j] = piece occupying cell, ou null
let jigZCounter = 10;
let jigDragging = null;
let jigDragOffset = { x: 0, y: 0 };

function pickRandomJigPhoto() {
  const photos = (APP_CONTENT.memoryPairs || []).filter(p => p && p.img);
  if (photos.length === 0) return null;
  return photos[Math.floor(Math.random() * photos.length)].img;
}

function generateJigEdges(rows, cols) {
  const edges = [];
  for (let i = 0; i < rows; i++) {
    edges[i] = [];
    for (let j = 0; j < cols; j++) {
      edges[i][j] = {
        top: i === 0 ? 0 : -edges[i-1][j].bottom,
        left: j === 0 ? 0 : -edges[i][j-1].right,
        right: j === cols - 1 ? 0 : (Math.random() < 0.5 ? 1 : -1),
        bottom: i === rows - 1 ? 0 : (Math.random() < 0.5 ? 1 : -1),
      };
    }
  }
  return edges;
}

function jigEdgeSegment(d, x1, y1, x2, y2, side, W) {
  if (d === 0) return `L ${x2.toFixed(2)} ${y2.toFixed(2)} `;
  let px = 0, py = 0;
  if (side === 'top') py = -1;
  if (side === 'right') px = 1;
  if (side === 'bottom') py = 1;
  if (side === 'left') px = -1;
  px *= d; py *= d;
  const ex = (x2 - x1) / W;
  const ey = (y2 - y1) / W;
  const NECK = 0.32, HEAD = 0.18, TAB_H = 0.20, CM = 1.3;
  const pt = (f, perp = 0) => ({
    x: x1 + ex * W * f + px * W * perp,
    y: y1 + ey * W * f + py * W * perp,
  });
  const s = pt(NECK, 0);
  const c1 = pt(NECK - HEAD, TAB_H * CM);
  const c2 = pt(1 - NECK + HEAD, TAB_H * CM);
  const e = pt(1 - NECK, 0);
  return `L ${s.x.toFixed(2)} ${s.y.toFixed(2)} `
       + `C ${c1.x.toFixed(2)} ${c1.y.toFixed(2)}, ${c2.x.toFixed(2)} ${c2.y.toFixed(2)}, ${e.x.toFixed(2)} ${e.y.toFixed(2)} `
       + `L ${x2.toFixed(2)} ${y2.toFixed(2)} `;
}

function buildJigPiecePath(edges, W, PAD) {
  let x = PAD, y = PAD;
  let path = `M ${x.toFixed(2)} ${y.toFixed(2)} `;
  path += jigEdgeSegment(edges.top, x, y, x + W, y, 'top', W);          x += W;
  path += jigEdgeSegment(edges.right, x, y, x, y + W, 'right', W);      y += W;
  path += jigEdgeSegment(edges.bottom, x, y, x - W, y, 'bottom', W);    x -= W;
  path += jigEdgeSegment(edges.left, x, y, x, y - W, 'left', W);
  path += 'Z';
  return path;
}

function startJigsaw(size, photoUrl) {
  // Nettoyer l'ancien puzzle
  if (jigsawState) {
    jigsawState.pieces.forEach(p => p.el?.remove());
  }
  jigWinBannerEl.innerHTML = '';
  jigDragging = null;
  jigGrid = null;
  jigsawState = null;

  const photo = photoUrl || pickRandomJigPhoto();
  if (!photo) {
    jigWinBannerEl.innerHTML = '<p style="color:var(--muted);text-align:center">Aucune photo disponible.</p>';
    return;
  }
  jigPreviewEl.src = photo;

  const rows = size, cols = size;

  // Précharger l'image pour éviter le flash, puis layout après le prochain paint
  const preload = new Image();
  preload.onload = () => requestAnimationFrame(() => buildJigsaw(size, photo, rows, cols));
  preload.src = photo;
}

function buildJigsaw(size, photo, rows, cols) {
  const targetRect0 = jigTargetEl.getBoundingClientRect();
  const targetW = targetRect0.width;
  if (targetW === 0) {
    // Vue pas visible (user a navigué ailleurs avant la fin du preload). Abandon.
    return;
  }

  const pieceW = targetW / cols;
  const PAD = pieceW * 0.28;
  const containerSize = pieceW + 2 * PAD;

  // Hauteur de la pile zone : juste un peu plus qu'une pièce
  const pileHeight = containerSize + 30;
  jigPileEl.style.height = pileHeight + 'px';

  const edges = generateJigEdges(rows, cols);

  // Forcer le recompute du layout
  void jigPileEl.offsetHeight;

  // Positions en coords workspace
  const wsRect = jigWorkspaceEl.getBoundingClientRect();
  const targetRect = jigTargetEl.getBoundingClientRect();
  const pileRect = jigPileEl.getBoundingClientRect();
  const targetX = targetRect.left - wsRect.left;
  const targetY = targetRect.top - wsRect.top;
  const pileX = pileRect.left - wsRect.left;
  const pileY = pileRect.top - wsRect.top;
  const pileW = pileRect.width;

  // Init grille
  jigGrid = Array.from({length: rows}, () => Array(cols).fill(null));

  const pieces = [];

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const correctX = targetX + j * pieceW - PAD;
      const correctY = targetY + i * pieceW - PAD;

      const el = document.createElement('div');
      el.className = 'jig-piece';
      el.style.width = containerSize + 'px';
      el.style.height = containerSize + 'px';
      el.style.backgroundImage = `url('${photo}')`;
      el.style.backgroundSize = `${cols * pieceW}px ${rows * pieceW}px`;
      el.style.backgroundPosition = `${-(j * pieceW - PAD)}px ${-(i * pieceW - PAD)}px`;

      const pathD = buildJigPiecePath(edges[i][j], pieceW, PAD);
      el.style.clipPath = `path('${pathD}')`;
      el.style.webkitClipPath = `path('${pathD}')`;

      const piece = { i, j, correctX, correctY, x: 0, y: 0, el, containerSize, cell: null, previousCell: null };

      // Position initiale empilée au centre de la zone pile, avec petit offset random
      const pileCenterX = pileX + (pileW - containerSize) / 2;
      const pileCenterY = pileY + (pileHeight - containerSize) / 2;
      const scatterX = Math.min(60, Math.max(0, pileW - containerSize) / 2);
      piece.x = pileCenterX + (Math.random() - 0.5) * 2 * scatterX;
      piece.y = pileCenterY + (Math.random() - 0.5) * 16;
      el.style.transform = `translate(${piece.x}px, ${piece.y}px)`;

      el.addEventListener('pointerdown', (e) => jigOnPointerDown(e, piece));
      el.addEventListener('pointermove', (e) => jigOnPointerMove(e, piece));
      el.addEventListener('pointerup', (e) => jigOnPointerUp(e, piece));
      el.addEventListener('pointercancel', (e) => jigOnPointerUp(e, piece));

      jigWorkspaceEl.appendChild(el);
      pieces.push(piece);
    }
  }

  // Mélanger l'ordre Z (pour que la pile semble aléatoire, pas ordonnée par i,j)
  [...pieces].sort(() => Math.random() - 0.5).forEach((p, idx) => {
    p.el.style.zIndex = 10 + idx;
  });
  jigZCounter = 10 + pieces.length;

  jigsawState = { rows, cols, pieces, photo, pieceW, PAD, containerSize, targetX, targetY };
  updateJigCounter();
}

function updateJigCounter() {
  if (!jigsawState) { jigPlacedEl.textContent = '0'; return; }
  const correct = jigsawState.pieces.filter(p => p.cell && p.cell.i === p.i && p.cell.j === p.j).length;
  jigPlacedEl.textContent = correct;
  jigTotalEl.textContent = jigsawState.pieces.length;
}

function snapPieceToCell(piece, i, j) {
  if (!jigsawState) return;
  const {targetX, targetY, pieceW, PAD} = jigsawState;
  piece.x = targetX + j * pieceW - PAD;
  piece.y = targetY + i * pieceW - PAD;
  piece.el.style.transform = `translate(${piece.x}px, ${piece.y}px)`;
  piece.cell = {i, j};
  jigGrid[i][j] = piece;
  piece.el.classList.toggle('correct', i === piece.i && j === piece.j);
}

function sendPieceToPile(piece) {
  const wsRect = jigWorkspaceEl.getBoundingClientRect();
  const pileRect = jigPileEl.getBoundingClientRect();
  const pileX = pileRect.left - wsRect.left;
  const pileY = pileRect.top - wsRect.top;
  const pileW = pileRect.width;
  const pileH = pileRect.height;
  const cs = piece.containerSize;
  const pileCenterX = pileX + (pileW - cs) / 2;
  const pileCenterY = pileY + (pileH - cs) / 2;
  const scatterX = Math.min(60, Math.max(0, pileW - cs) / 2);
  piece.x = pileCenterX + (Math.random() - 0.5) * 2 * scatterX;
  piece.y = pileCenterY + (Math.random() - 0.5) * 16;
  piece.el.style.transform = `translate(${piece.x}px, ${piece.y}px)`;
  piece.cell = null;
  piece.el.classList.remove('correct');
}

function jigOnPointerDown(e, piece) {
  e.preventDefault();
  e.stopPropagation();
  jigDragging = piece;
  piece.el.classList.add('dragging');
  piece.el.classList.remove('correct');
  piece.el.style.zIndex = ++jigZCounter;
  piece.el.setPointerCapture(e.pointerId);

  // Mémoriser la cellule actuelle pour le swap éventuel, puis libérer la grille
  piece.previousCell = piece.cell;
  if (piece.cell && jigGrid) {
    jigGrid[piece.cell.i][piece.cell.j] = null;
    piece.cell = null;
  }

  const wsRect = jigWorkspaceEl.getBoundingClientRect();
  jigDragOffset.x = e.clientX - wsRect.left - piece.x;
  jigDragOffset.y = e.clientY - wsRect.top - piece.y;
}

function jigOnPointerMove(e, piece) {
  if (jigDragging !== piece) return;
  e.preventDefault();
  const wsRect = jigWorkspaceEl.getBoundingClientRect();
  piece.x = e.clientX - wsRect.left - jigDragOffset.x;
  piece.y = e.clientY - wsRect.top - jigDragOffset.y;
  piece.el.style.transform = `translate(${piece.x}px, ${piece.y}px)`;
}

function jigOnPointerUp(e, piece) {
  if (jigDragging !== piece) return;
  jigDragging = null;
  piece.el.classList.remove('dragging');

  if (!jigsawState) return;
  const {targetX, targetY, pieceW, containerSize, rows, cols} = jigsawState;

  // Centre de la pièce
  const cx = piece.x + containerSize / 2;
  const cy = piece.y + containerSize / 2;

  // Centre dans la zone cible ?
  const insideTarget = (
    cx >= targetX && cx < targetX + cols * pieceW &&
    cy >= targetY && cy < targetY + rows * pieceW
  );

  if (insideTarget) {
    const j = Math.max(0, Math.min(cols - 1, Math.floor((cx - targetX) / pieceW)));
    const i = Math.max(0, Math.min(rows - 1, Math.floor((cy - targetY) / pieceW)));

    const occupant = jigGrid[i][j];
    if (occupant && occupant !== piece) {
      // Swap : déplace l'occupant vers la cellule précédente, ou vers la pile
      if (piece.previousCell) {
        snapPieceToCell(occupant, piece.previousCell.i, piece.previousCell.j);
      } else {
        sendPieceToPile(occupant);
      }
    }
    snapPieceToCell(piece, i, j);
  }
  // Sinon : pièce reste libre où l'utilisateur l'a lâchée

  updateJigCounter();

  // Win = toutes les pièces sur leur bonne case
  const allCorrect = jigsawState.pieces.every(p =>
    p.cell && p.cell.i === p.i && p.cell.j === p.j
  );
  if (allCorrect) jigWin();
}

function jigWin() {
  const msg = APP_CONTENT.puzzleWinMessage || "Puzzle terminé !";
  const photo = jigsawState?.photo || '';
  jigWinBannerEl.innerHTML = `
    <div class="win-banner">
      <h3>🎉 Bravo !</h3>
      ${photo ? `<img src="${photo}" alt="" style="width:100%;max-width:340px;border-radius:14px;margin:12px auto;display:block"/>` : ''}
      <p>${msg}</p>
    </div>`;
  jigWinBannerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

document.getElementById('jigShuffle').addEventListener('click', () => {
  startJigsaw(+jigSizeEl.value, jigsawState?.photo);
});
document.getElementById('jigNewPhoto').addEventListener('click', () => {
  startJigsaw(+jigSizeEl.value);
});
jigSizeEl.addEventListener('change', () => startJigsaw(+jigSizeEl.value));

async function switchView(view) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('.menu-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  if (view === 'capsules') renderCapsules();
  if (view === 'game' && !gameState) startGame();
  if (view === 'puzzle' && !puzzleState) startPuzzle(+puzzleSizeEl.value);
  if (view === 'jigsaw' && !jigsawState) startJigsaw(+jigSizeEl.value);
  if (view === 'drawing') {
    try { await loadProfile(); renderDrawingView(); }
    catch (e) { console.error(e); }
  }
  if (view === 'question') {
    try { await loadProfile(); renderQuestionView(); }
    catch (e) { console.error(e); }
  }
  if (view === 'bucket') {
    try { await loadProfile(); renderBucketView(); }
    catch (e) { console.error(e); }
  }
  if (view === 'journal') {
    try { await loadProfile(); renderJournalView(); }
    catch (e) { console.error(e); }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});
document.querySelectorAll('.menu-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    switchView(btn.dataset.view);
    setBurgerOpen(false);
  });
});

// =============================================================
// COEURS FLOTTANTS (déco)
// =============================================================
(function hearts() {
  const heartsEl = document.getElementById('hearts');
  const symbols = ['❤', '💕', '✦', '♥'];
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('span');
    s.className = 'heart';
    s.textContent = symbols[i % symbols.length];
    s.style.left = (Math.random() * 100) + '%';
    s.style.animationDelay = (Math.random() * 14) + 's';
    s.style.animationDuration = (12 + Math.random() * 8) + 's';
    s.style.fontSize = (12 + Math.random() * 16) + 'px';
    heartsEl.appendChild(s);
  }
})();

// =============================================================
// INIT
// =============================================================
renderCapsules();

// Précharger les photos du jeu mémoire
(function preloadPhotos() {
  (APP_CONTENT.memoryPairs || []).forEach(p => {
    if (p && typeof p === 'object' && p.img) {
      const img = new Image();
      img.src = p.img;
    }
  });
})();

// Précharger la session Supabase en arrière-plan (sans bloquer)
(async function preloadSession() {
  try { await loadProfile(); } catch (e) { /* silencieux */ }
})();
