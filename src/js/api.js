// ValCrown API Service
// All calls to api.valcrown.com go through here

const API = {
  baseUrl: null,

  async init() {
    this.baseUrl = await window.valcrown.getApiUrl();
  },

  async request(method, endpoint, data = null, auth = false) {
    const headers = { 'Content-Type': 'application/json' };

    if (auth) {
      const token = await window.valcrown.store.get('accessToken');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const options = { method, headers };
    if (data) options.body = JSON.stringify(data);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      const json = await response.json();

      if (response.status === 401 && json.code === 'TOKEN_EXPIRED') {
        const refreshed = await this.refreshToken();
        if (refreshed) return this.request(method, endpoint, data, auth);
      }

      return { ok: response.ok, status: response.status, data: json };
    } catch (err) {
      return { ok: false, status: 0, data: { error: 'Network error — check your connection' } };
    }
  },

  async refreshToken() {
    const refreshToken = await window.valcrown.store.get('refreshToken');
    if (!refreshToken) return false;

    const res = await this.request('POST', '/api/auth/refresh', { refreshToken });
    if (res.ok && res.data.accessToken) {
      await window.valcrown.store.set('accessToken', res.data.accessToken);
      return true;
    }
    return false;
  },

  // Auth
  async login(email, password, deviceVid) {
    return this.request('POST', '/api/auth/login', { email, password, deviceVid });
  },

  async validate(deviceVid) {
    return this.request('POST', '/api/auth/validate', { deviceVid }, true);
  },

  async logout(refreshToken) {
    return this.request('POST', '/api/auth/logout', { refreshToken }, true);
  },

  // Config
  async getConfig() {
    return this.request('GET', '/api/config', null, true);
  },

  async getProcessBlacklist() {
    return this.request('GET', '/api/config/process-blacklist', null, true);
  },

  async checkProcess(processName, cpuUsage, ramUsage) {
    return this.request('POST', '/api/config/process-check', { processName, cpuUsage, ramUsage }, true);
  },

  async diagnoseNetwork(pingMs, packetLoss, isp, jitter) {
    return this.request('POST', '/api/config/network-diagnosis', { pingMs, packetLoss, isp, jitter }, true);
  },

  async getBoostAdvice(systemStats) {
    return this.request('POST', '/api/config/boost-advice', { systemStats }, true);
  },

  async askFAQ(question) {
    return this.request('POST', '/api/config/faq', { question }, true);
  },

  async getSmartConfig(hardware) {
    return this.request('POST', '/api/config/smart', { hardware }, true);
  },
};
