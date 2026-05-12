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
  memoryBestTime: null, memoryBestMoves: null
}, loadState());
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
document.getElementById('newGame').addEventListener('click', startGame);

let gameState = null;

function startGame() {
  const pool = APP_CONTENT.memoryPairs;
  const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
  const pairs = shuffledPool.slice(0, 8);
  const deck = [...pairs, ...pairs]
    .map(v => ({ v, k: Math.random() }))
    .sort((a, b) => a.k - b.k)
    .map(o => o.v);

  gameState = {
    deck, flipped: [], matched: new Set(), moves: 0,
    startTime: Date.now(), timer: null, locked: false, won: false
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
  gameBestEl.textContent = state.memoryBestTime != null ? state.memoryBestTime + 's' : '—';
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
  const isRecord = state.memoryBestTime == null || seconds < state.memoryBestTime;
  if (isRecord) {
    state.memoryBestTime = seconds;
    state.memoryBestMoves = gameState.moves;
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

async function switchView(view) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('.menu-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  if (view === 'capsules') renderCapsules();
  if (view === 'game' && !gameState) startGame();
  if (view === 'drawing') {
    try { await loadProfile(); renderDrawingView(); }
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
