const { invoke } = window.__TAURI__.core;
const { sendNotification } = window.__TAURI__.notification;

let _store = null;
async function getStore() {
  if (!_store) {
    const { Store } = await import('https://unpkg.com/@tauri-apps/plugin-store@2');
    _store = await Store.load('valcrown.dat');
  }
  return _store;
}

window.valcrown = {
  store: {
    get:    async (k)    => { const s = await getStore(); return s.get(k); },
    set:    async (k, v) => { const s = await getStore(); await s.set(k, v); await s.save(); },
    delete: async (k)    => { const s = await getStore(); await s.delete(k); await s.save(); },
    clear:  async ()     => { const s = await getStore(); await s.clear(); await s.save(); },
  },
  getSystemInfo: () => invoke('get_system_info'),
  getCpuUsage:   () => invoke('get_cpu_usage'),
  getRamUsage:   () => invoke('get_ram_usage'),
  getApiUrl:     () => invoke('get_api_url'),
  getProcesses:  () => invoke('get_processes'),
  killProcess:   (pid) => invoke('kill_process', { pid }),
  pingHost:      (host) => invoke('ping_host', { host: host || '8.8.8.8' }),
  flushDns:      () => invoke('flush_dns'),
  optimizeTcp:   () => invoke('optimize_tcp'),
  applyBoost:    (p) => invoke('apply_boost', { targetProcess: p || null }),
  revertBoost:   () => invoke('revert_boost'),
  minimize:      () => invoke('window_minimize'),
  maximize:      () => invoke('window_maximize'),
  hide:          () => invoke('window_hide'),
  close:         () => invoke('window_hide'),
  notify:        (title, body) => { try { sendNotification({ title, body }); } catch(e) {} },
  openExternal:  (url) => window.open(url, '_blank'),
  currentGame:   null,
};

let _interval = null, _current = null;
window.startGameDetection = function(onStart, onEnd) {
  async function check() {
    try {
      const procs = await window.valcrown.getProcesses();
      if (!window.GAME_PROCESS_MAP) return;
      let found = null;
      for (const p of procs) { const g = window.GAME_PROCESS_MAP[p.name.toLowerCase()]; if (g) { found = g; break; } }
      if (found && !_current) { _current = found; window.valcrown.currentGame = found; if (onStart) onStart(found); }
      else if (!found && _current) { const e = _current; _current = null; window.valcrown.currentGame = null; if (onEnd) onEnd({ game: e }); }
    } catch(e) {}
  }
  check();
  _interval = setInterval(check, 10000);
};
window.stopGameDetection = () => { if (_interval) { clearInterval(_interval); _interval = null; } };

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-minimize')?.addEventListener('click', () => window.valcrown.minimize());
  document.getElementById('btn-maximize')?.addEventListener('click', () => window.valcrown.maximize());
  document.getElementById('btn-close')?.addEventListener('click', () => window.valcrown.hide());
});
