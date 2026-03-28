// ValCrown Device ID
// Generates a unique ID for this PC
// Used for license binding — 1 license = 1 device

const DeviceID = {
  async get() {
    // Try to get stored VID first
    const stored = await window.valcrown.store.get('deviceVid');
    if (stored) return stored;

    // Generate new VID from available browser/system info
    const vid = await this.generate();
    await window.valcrown.store.set('deviceVid', vid);
    return vid;
  },

  async generate() {
    // Collect system fingerprint data
    const data = [
      navigator.userAgent,
      navigator.language,
      navigator.hardwareConcurrency,
      screen.width,
      screen.height,
      screen.colorDepth,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.platform,
    ].join('|');

    // Hash it to create VID
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const vid = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return `VC-${vid.substring(0, 8)}-${vid.substring(8, 16)}-${vid.substring(16, 24)}-${vid.substring(24, 32)}`.toUpperCase();
  }
};
