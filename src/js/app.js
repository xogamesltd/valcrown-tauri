'use strict';

// ── STATE ──────────────────────────────────────────────────────────────────────
let boostActive = false;
let targetApp = null;
let user = null;
let license = null;
let lastCpu = 0;
let lastRam = 0;
let lastPing = 0;
let bannerDismissed = false;
let currentGame = null;
let sessionTimerInterval = null;

const POPULAR_APPS = [
  { name: 'GeForce NOW', icon: '☁️', sub: 'NVIDIA Cloud Gaming' },
  { name: 'Xbox Cloud', icon: '🎯', sub: 'Microsoft xCloud' },
  { name: 'Boosteroid', icon: '⚡', sub: 'Cloud Gaming' },
  { name: 'Shadow PC', icon: '👤', sub: 'High-End Cloud PC' },
  { name: 'PS Remote', icon: '🕹️', sub: 'PlayStation Remote' },
  { name: 'Amazon Luna', icon: '🌙', sub: 'Amazon Cloud Gaming' },
];

// ── INIT ───────────────────────────────────────────────────────────────────────
async function init() {
  await API.init();

  user = await window.valcrown.store.get('user');
  license = await window.valcrown.store.get('license');
  targetApp = await window.valcrown.store.get('targetApp') || null;

  if (user) {
    const initial = (user.fullName || user.email || 'U')[0].toUpperCase();
    setEl('user-av', initial);
    setEl('user-nm', user.fullName || user.email.split('@')[0]);
    setEl('s-email', user.email);
  }
  if (license) {
    const p = capitalize(license.plan) + ' Plan';
    setEl('user-pl', p);
    setEl('s-plan', p);
  }

  // System info
  const sys = await window.valcrown.getSystemInfo();
  if (sys) {
    setEl('si-cpu', sys.cpuModel.length > 26 ? sys.cpuModel.substring(0, 26) + '…' : sys.cpuModel);
    setEl('si-cores', sys.cpuCores + ' cores');
    setEl('si-ram', sys.totalRam + ' GB');
    setEl('si-os', sys.osType);
  }

  if (targetApp) showTargetApp(targetApp);
  buildAppGrid();
  setupGameDetectionListeners();
  startMetrics();
  startPing();

  // Check if a game is already running
  const activeGame = await window.valcrown.getCurrentGame();
  if (activeGame) handleGameDetected(activeGame);

  // Load session history
  loadSessionHistory();

  setTimeout(runSmartAnalysis, 3000);
  setInterval(runSmartAnalysis, 30000);
  validateSession();
  setInterval(validateSession, 5 * 60 * 1000);

  log('✅ ValCrown started');
  log('📡 Connected to api.valcrown.com');
  log('🎮 Game detector active — monitoring ' + 'processes');
}

// ── GAME DETECTION LISTENERS ──────────────────────────────────────────────────
function setupGameDetectionListeners() {
  window.valcrown.onGameDetected((game) => {
    handleGameDetected(game);
  });

  window.valcrown.onGameEnded((session) => {
    handleGameEnded(session);
  });

  window.valcrown.onSessionTick((time) => {
    setEl('session-time', time);
    updateTrayDisplay(currentGame, time);
  });
}

function handleGameDetected(game) {
  currentGame = game;
  boostActive = true;

  // Show game card
  showGameCard(game);
  updateBoostBtns(true, 'Boosting ' + game.name);
  setEl('v-boost', 'ON');
  const stBoost = document.getElementById('st-boost');
  if (stBoost) stBoost.className = 'stat ok';
  setEl('b-priority', 'High');
  setEl('b-power', 'High Performance');
  setEl('b-level', 'Active');

  log(`🎮 Auto-detected: ${game.name} — Boost activated`);

  // Start session timer in UI
  startSessionTimer();
}

function handleGameEnded(session) {
  currentGame = null;
  boostActive = false;

  // Hide game card
  hideGameCard(session);
  updateBoostBtns(false, targetApp ? 'Boost ' + targetApp.name : 'Activate Boost');
  setEl('v-boost', 'OFF');
  const stBoost = document.getElementById('st-boost');
  if (stBoost) stBoost.className = 'stat';
  setEl('b-priority', 'Normal');
  setEl('b-power', 'Balanced');
  setEl('b-level', 'Off');

  stopSessionTimer();
  log(`⏹ Session ended: ${session.game.name} — ${session.durationFormatted}`);
  loadSessionHistory();
}

function showGameCard(game) {
  const card = document.getElementById('game-card');
  const noGame = document.getElementById('no-game-card');
  if (!card) return;

  document.getElementById('gc-icon').textContent = game.icon || '🎮';
  document.getElementById('gc-name').textContent = game.name;
  document.getElementById('gc-genre').textContent = game.genre || 'Gaming';
  document.getElementById('gc-status').textContent = 'Boosting';
  document.getElementById('session-time').textContent = '0m 0s';

  card.style.display = 'flex';
  if (noGame) noGame.style.display = 'none';
}

function hideGameCard(session) {
  const card = document.getElementById('game-card');
  const noGame = document.getElementById('no-game-card');
  if (card) card.style.display = 'none';
  if (noGame) noGame.style.display = 'flex';
}

function startSessionTimer() {
  if (sessionTimerInterval) clearInterval(sessionTimerInterval);
  let seconds = 0;
  sessionTimerInterval = setInterval(() => {
    seconds++;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const h = Math.floor(m / 60);
    const time = h > 0 ? `${h}h ${m % 60}m` : `${m}m ${s}s`;
    setEl('session-time', time);
  }, 1000);
}

function stopSessionTimer() {
  if (sessionTimerInterval) {
    clearInterval(sessionTimerInterval);
    sessionTimerInterval = null;
  }
}

async function loadSessionHistory() {
  const history = await window.valcrown.getSessionHistory();
  const el = document.getElementById('session-history');
  if (!el) return;

  if (!history || !history.length) {
    el.innerHTML = '<div class="empty">No sessions yet — start a game and ValCrown will track it automatically</div>';
    return;
  }

  el.innerHTML = history.slice(0, 10).map(s => `
    <div class="proc-item">
      <div>
        <div class="proc-name">${s.game.icon || '🎮'} ${s.game.name}</div>
        <div class="proc-info">${new Date(s.startTime).toLocaleDateString()} · ${s.durationFormatted}</div>
      </div>
      <span class="tag tag-green">Boosted</span>
    </div>
  `).join('');
}

// ── SMART ANALYSIS ────────────────────────────────────────────────────────────
async function runSmartAnalysis() {
  if (bannerDismissed || currentGame) return;
  const banner = document.getElementById('smart-banner');
  if (!banner) return;

  if (lastCpu > 85) {
    showBanner('bad', '🔥', 'High CPU detected', `CPU at ${lastCpu}% — activate Boost to free resources for gaming`, 'Activate Boost', () => { toggleBoost(); dismissBanner(); });
  } else if (lastRam > 80) {
    showBanner('warn', '💾', 'High RAM detected', `RAM at ${lastRam}% — Boost will suspend background apps`, 'Activate Boost', () => { toggleBoost(); dismissBanner(); });
  } else if (lastPing > 100) {
    showBanner('warn', '📡', 'High latency', `Ping is ${lastPing}ms — try AI network diagnosis`, 'Fix Network', () => { go('network'); dismissBanner(); });
  } else if (!targetApp && !currentGame) {
    showBanner('info', '🎮', 'No target app set', 'Set your gaming app and ValCrown will boost it automatically', 'Set Target App', () => { go('target'); dismissBanner(); });
  } else if (!boostActive && lastCpu < 50 && lastRam < 60) {
    showBanner('ok', '✅', 'System ready for gaming', `CPU ${lastCpu}%, RAM ${lastRam}%, Ping ${lastPing}ms`, null, null);
  }
}

function showBanner(type, icon, title, sub, btnLabel, btnAction) {
  const banner = document.getElementById('smart-banner');
  if (!banner) return;
  banner.innerHTML = `
    <div class="smart-banner ${type}">
      <div class="banner-icon">${icon}</div>
      <div class="banner-text">
        <div class="banner-title">${title}</div>
        <div class="banner-sub">${sub}</div>
      </div>
      ${btnLabel ? `<button class="banner-btn ${type === 'bad' ? 'yellow' : type === 'ok' ? 'green' : 'accent'}" id="banner-action-btn">${btnLabel}</button>` : ''}
      <button onclick="dismissBanner()" style="background:none;border:none;color:var(--text3);font-size:16px;cursor:pointer;padding:0 0 0 8px;">✕</button>
    </div>`;
  banner.style.display = 'block';
  if (btnLabel && btnAction) {
    const btn = document.getElementById('banner-action-btn');
    if (btn) btn.onclick = btnAction;
  }
}

function dismissBanner() {
  const el = document.getElementById('smart-banner');
  if (el) el.style.display = 'none';
  bannerDismissed = true;
  setTimeout(() => bannerDismissed = false, 60000);
}

function updateTrayDisplay(game, time) {
  // Tray is updated via main process — this is just UI sync
}

// ── NAVIGATION ─────────────────────────────────────────────────────────────────
function go(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('pg-' + name)?.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => {
    if (b.getAttribute('onclick')?.includes("'" + name + "'")) b.classList.add('active');
  });
}

// ── METRICS ────────────────────────────────────────────────────────────────────
function startMetrics() {
  updateMetrics();
  setInterval(updateMetrics, 2000);
}

async function updateMetrics() {
  const cpu = await window.valcrown.getCpuUsage();
  const ram = await window.valcrown.getRamUsage();
  lastCpu = cpu;
  lastRam = ram;
  updateStat('st-cpu', 'v-cpu', 'm-cpu', cpu, '%', 70, 85);
  updateStat('st-ram', 'v-ram', 'm-ram', ram, '%', 75, 88);
}

function updateStat(cardId, valId, meterId, val, suffix, warn, bad) {
  const card = document.getElementById(cardId);
  const valEl = document.getElementById(valId);
  const meterEl = document.getElementById(meterId);
  if (!valEl) return;
  valEl.textContent = val + suffix;
  if (card) { card.className = 'stat'; card.classList.add(val >= bad ? 'bad' : val >= warn ? 'warn' : 'ok'); }
  if (meterEl) { meterEl.style.width = Math.min(val, 100) + '%'; meterEl.style.background = val >= bad ? 'var(--red)' : val >= warn ? 'var(--yellow)' : 'var(--green)'; }
}

// ── PING ───────────────────────────────────────────────────────────────────────
function startPing() { doPing(); setInterval(doPing, 5000); }
async function doPing() {
  const ping = await window.valcrown.pingHost('8.8.8.8');
  lastPing = ping;
  ['v-ping', 'n-ping'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ping; });
  const card = document.getElementById('st-ping');
  if (card) { card.className = 'stat'; card.classList.add(ping < 50 ? 'ok' : ping < 100 ? 'warn' : 'bad'); }
  const fill = document.getElementById('m-ping');
  if (fill) { fill.style.width = Math.min((ping / 200) * 100, 100) + '%'; fill.style.background = ping < 50 ? 'var(--green)' : ping < 100 ? 'var(--yellow)' : 'var(--red)'; }
  const nFill = document.getElementById('n-ping-fill');
  if (nFill) { nFill.style.width = Math.min((ping / 200) * 100, 100) + '%'; nFill.className = 'ping-fill ' + (ping < 50 ? 'ping-ok' : ping < 100 ? 'ping-warn' : 'ping-bad'); }
  const nQ = document.getElementById('n-ping-q');
  if (nQ) { nQ.textContent = ping < 30 ? 'Excellent' : ping < 60 ? 'Good' : ping < 100 ? 'Fair' : 'Poor'; nQ.style.color = ping < 60 ? 'var(--green)' : ping < 100 ? 'var(--yellow)' : 'var(--red)'; }
}

// ── TARGET APP ─────────────────────────────────────────────────────────────────
function buildAppGrid() {
  const grid = document.getElementById('app-grid');
  if (!grid) return;
  grid.innerHTML = POPULAR_APPS.map(app => `
    <div class="app-tile" onclick="setQuickApp('${app.name}')">
      <div class="app-tile-icon">${app.icon}</div>
      <div class="app-tile-name">${app.name}</div>
      <div class="app-tile-sub">${app.sub}</div>
    </div>
  `).join('');
}

async function pickApp() { const result = await window.valcrown.selectApp(); if (result) setTarget(result); }
async function setQuickApp(name) { const app = POPULAR_APPS.find(a => a.name === name); setTarget({ name, path: name + '.exe', icon: app?.icon || '🎮' }); }

async function setTarget(app) {
  targetApp = app;
  await window.valcrown.store.set('targetApp', app);
  showTargetApp(app);
  log('🎯 Target set: ' + app.name);
  window.valcrown.notify('ValCrown', app.name + ' — ValCrown will boost it automatically when launched');
  const hint = document.getElementById('dash-target-hint');
  if (hint) hint.textContent = 'Target: ' + app.name;
  document.querySelectorAll('.app-tile').forEach(t => t.classList.toggle('selected', t.querySelector('.app-tile-name')?.textContent === app.name));
  bannerDismissed = false;
  runSmartAnalysis();
}

function showTargetApp(app) {
  const noT = document.getElementById('no-target');
  const hasT = document.getElementById('has-target');
  if (noT) noT.style.display = 'none';
  if (hasT) hasT.style.display = 'block';
  setEl('t-icon', app.icon || app.name[0].toUpperCase());
  setEl('t-name', app.name);
  setEl('t-path', app.path || '');
  updateBoostBtns(boostActive, boostActive ? 'Boosting ' + app.name : 'Boost ' + app.name);
}

async function clearTarget() {
  targetApp = null;
  await window.valcrown.store.delete('targetApp');
  const noT = document.getElementById('no-target');
  const hasT = document.getElementById('has-target');
  if (noT) noT.style.display = 'block';
  if (hasT) hasT.style.display = 'none';
  document.querySelectorAll('.app-tile').forEach(t => t.classList.remove('selected'));
  updateBoostBtns(boostActive, 'Activate Boost');
  log('🗑 Target removed');
}

// ── BOOST ──────────────────────────────────────────────────────────────────────
async function toggleBoost() {
  boostActive = !boostActive;
  const name = currentGame?.name || targetApp?.name || 'System';
  if (boostActive) {
    await window.valcrown.applyBoost(targetApp?.name || null);
    updateBoostBtns(true, 'Boosting ' + name);
    setEl('v-boost', 'ON');
    const card = document.getElementById('st-boost');
    if (card) card.className = 'stat ok';
    setEl('b-priority', 'High'); setEl('b-power', 'High Performance'); setEl('b-affinity', 'All Cores'); setEl('b-level', 'Active');
    log('🚀 Boost activated — ' + name);
    window.valcrown.notify('ValCrown', 'Boost active — ' + name + ' optimized');
    dismissBanner();
  } else {
    await window.valcrown.revertBoost();
    updateBoostBtns(false, targetApp ? 'Boost ' + targetApp.name : 'Activate Boost');
    setEl('v-boost', 'OFF');
    const card = document.getElementById('st-boost');
    if (card) card.className = 'stat';
    setEl('b-priority', 'Normal'); setEl('b-power', 'Balanced'); setEl('b-affinity', 'Default'); setEl('b-level', 'Off');
    log('⏹ Boost deactivated');
  }
}

function updateBoostBtns(active, label) {
  ['dash-boost-btn', 'boost-btn'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.className = 'boost-btn ' + (active ? 'on' : 'off');
    btn.innerHTML = active ? '<div class="pulse"></div>' + label : label;
  });
}

async function getBoostAdvice() {
  const el = document.getElementById('boost-advice');
  el.innerHTML = '<span style="color:var(--text3)">Analyzing system...</span>';
  const result = await API.getBoostAdvice({ cpuPercent: lastCpu, ramPercent: lastRam, processCount: 60, game: currentGame?.name || targetApp?.name || 'cloud gaming' });
  if (result.ok && result.data) {
    const { level, reason } = result.data;
    const color = level === 'conservative' ? 'var(--green)' : level === 'medium' ? 'var(--yellow)' : 'var(--red)';
    el.innerHTML = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><span class="tag" style="background:${color}22;color:${color};">${(level || 'MEDIUM').toUpperCase()}</span><span style="font-size:11px;color:var(--text3)">AI Recommendation</span></div><div style="font-size:13px;color:var(--text2);line-height:1.5;">${reason}</div><div style="margin-top:10px;"><button class="btn btn-primary btn-sm" onclick="toggleBoost()">Apply Now</button></div>`;
    setEl('b-level', level || 'Medium');
  } else { el.innerHTML = '<span style="color:var(--text2)">AI unavailable — add ANTHROPIC_API_KEY to environment variables.</span>'; }
}

// ── PROCESSES ──────────────────────────────────────────────────────────────────
async function loadProcs() {
  const list = document.getElementById('proc-list');
  list.innerHTML = '<div class="empty">Loading...</div>';
  const procs = await window.valcrown.getProcesses();
  if (!procs?.length) { list.innerHTML = '<div class="empty">No processes found</div>'; return; }
  procs.sort((a, b) => (b.memory || 0) - (a.memory || 0));
  list.innerHTML = procs.slice(0, 25).map(p => `
    <div class="proc-item" id="proc-${p.pid}">
      <div>
        <div class="proc-name">${p.name}</div>
        <div class="proc-info">PID ${p.pid} · ${p.memory ? Math.round(p.memory / 1024) + ' MB' : (p.cpu || 0) + '% CPU'}</div>
      </div>
      <div class="proc-actions">
        <button class="btn btn-ghost btn-sm" onclick="aiCheckProc('${p.name}',${p.pid})">AI Check</button>
        <button class="btn btn-red btn-sm" onclick="killProc(${p.pid},'${p.name}')">Kill</button>
      </div>
    </div>`).join('');
}

async function aiCheckProc(name, pid) {
  const result = await API.checkProcess(name, 0, 0);
  if (result.ok && result.data) {
    const { action, reason } = result.data;
    const colors = { kill: 'var(--red)', suspend: 'var(--yellow)', skip: 'var(--green)' };
    const row = document.getElementById('proc-' + pid);
    if (row) {
      row.querySelector('.ai-result')?.remove();
      const div = document.createElement('div');
      div.className = 'ai-result';
      div.style.cssText = `font-size:10px;color:${colors[action]||'var(--text2)'};margin-top:2px;`;
      div.textContent = '🤖 ' + (action || '').toUpperCase() + ' — ' + reason;
      row.querySelector('.proc-info').after(div);
    }
    log('🤖 AI: ' + name + ' → ' + action);
  }
}

async function aiCheckAll() {
  const rows = document.querySelectorAll('.proc-item');
  if (!rows.length) { loadProcs(); return; }
  for (const row of Array.from(rows).slice(0, 8)) {
    const name = row.querySelector('.proc-name')?.textContent;
    const pid = row.id.split('-')[1];
    if (name && pid) await aiCheckProc(name, parseInt(pid));
  }
}

async function killProc(pid, name) {
  const ok = await window.valcrown.killProcess(pid);
  if (ok) { document.getElementById('proc-' + pid)?.remove(); log('🔴 Killed: ' + name); }
}

// ── NETWORK ────────────────────────────────────────────────────────────────────
async function doFlushDns() {
  const btn = document.getElementById('dns-btn');
  if (btn) { btn.textContent = 'Flushing...'; btn.disabled = true; }
  const ok = await window.valcrown.flushDns();
  if (btn) { btn.textContent = 'Flush DNS Cache'; btn.disabled = false; }
  log(ok ? '🌐 DNS flushed' : '⚠️ DNS flush failed — run as administrator');
  if (ok) window.valcrown.notify('ValCrown', 'DNS cache flushed');
}

async function doTcpOpt() {
  const ok = await window.valcrown.optimizeTcp();
  log(ok ? '⚡ TCP optimized' : '⚠️ TCP optimization failed');
  if (ok) window.valcrown.notify('ValCrown', 'TCP settings optimized');
}

async function doNetDiag() {
  const el = document.getElementById('net-diag');
  el.innerHTML = '<span style="color:var(--text3)">Analyzing...</span>';
  const result = await API.diagnoseNetwork(lastPing, 0.5, 'Unknown', 8);
  if (result.ok && result.data) {
    const { severity, diagnosis, fixes, dns_recommendation } = result.data;
    const tagClass = severity === 'low' ? 'tag-green' : severity === 'medium' ? 'tag-yellow' : 'tag-red';
    el.innerHTML = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><span class="tag ${tagClass}">${(severity||'').toUpperCase()}</span><span style="font-size:11px;color:var(--text3)">Ping: ${lastPing}ms</span></div><div style="font-size:13px;margin-bottom:10px;">${diagnosis}</div>${fixes?.length ? fixes.map(f => `<div style="font-size:12px;color:var(--text2);padding:5px 0;border-bottom:1px solid var(--border);">→ ${f}</div>`).join('') : ''}${dns_recommendation && dns_recommendation !== 'current is fine' ? `<div style="margin-top:8px;font-size:12px;color:var(--blue);">💡 Try DNS: ${dns_recommendation}</div>` : ''}`;
    log('🔍 Network: ' + severity);
  } else { el.innerHTML = '<span style="color:var(--text2)">AI diagnosis unavailable.</span>'; }
}

// ── AI CHAT ────────────────────────────────────────────────────────────────────
async function sendMsg() {
  const inp = document.getElementById('chat-in');
  const q = inp.value.trim();
  if (!q) return;
  inp.value = '';
  addMsg(q, 'user');
  const thinking = addMsg('Thinking...', 'ai');
  const result = await API.askFAQ(q);
  thinking.textContent = result.ok ? result.data.answer : 'AI unavailable right now.';
}

function addMsg(text, who) {
  const box = document.getElementById('chat-box');
  const m = document.createElement('div');
  m.className = 'msg ' + who;
  m.textContent = text;
  box.appendChild(m);
  box.scrollTop = box.scrollHeight;
  return m;
}

// ── LOG ────────────────────────────────────────────────────────────────────────
function log(msg) {
  const box = document.getElementById('activity-log');
  if (!box) return;
  const time = new Date().toLocaleTimeString('en', { hour12: false });
  const entry = document.createElement('div');
  entry.className = 'activity-item';
  entry.innerHTML = `<span class="activity-time">${time}</span><span class="activity-msg">${msg}</span>`;
  if (box.querySelector('.empty')) box.innerHTML = '';
  box.insertBefore(entry, box.firstChild);
  while (box.children.length > 20) box.removeChild(box.lastChild);
}

function clearLog() { const b = document.getElementById('activity-log'); if (b) b.innerHTML = '<div class="empty">Log cleared</div>'; }

// ── SESSION VALIDATION ─────────────────────────────────────────────────────────
async function validateSession() {
  const vid = await DeviceID.get();
  const result = await API.validate(vid);
  if (!result.ok && result.data?.code === 'DEVICE_MISMATCH') doLogout();
}

// ── LOGOUT ─────────────────────────────────────────────────────────────────────
async function doLogout() {
  const rt = await window.valcrown.store.get('refreshToken');
  await API.logout(rt);
  window.valcrown.logout();
}

// ── HELPERS ────────────────────────────────────────────────────────────────────
function setEl(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

document.addEventListener('DOMContentLoaded', init);
