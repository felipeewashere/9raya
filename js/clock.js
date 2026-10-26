// Morocco time (Africa/Casablanca). Asks a time server for the real time so a wrong device clock
// doesn't break the "now" phase; falls back to the device clock (still shown in Morocco time) if offline.
// Google has no public time API, so this uses timeapi.io with worldtimeapi.org as backup.
const Clock = (() => {
  const TZ = 'Africa/Casablanca';
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  let skew = 0, source = 'device';
  const listeners = [];

  // Morocco wall-clock time of this device, as milliseconds "as if it were UTC"
  function deviceWallMs() {
    const p = {};
    fmt.formatToParts(new Date()).forEach(x => { p[x.type] = x.value; });
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) + (Date.now() % 1000);
  }
  const wallMs = () => deviceWallMs() + skew;

  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
  const sources = [
    ['timeapi.io', async () => (await (await fetch('https://timeapi.io/api/Time/current/zone?timeZone=' + TZ, { cache: 'no-store' })).json()).dateTime],
    ['worldtimeapi.org', async () => (await (await fetch('https://worldtimeapi.org/api/timezone/' + TZ, { cache: 'no-store' })).json()).datetime],
  ];

  async function sync() {
    for (const [name, get] of sources) {
      try {
        const t0 = Date.now();
        const s = await withTimeout(get(), 4000);
        const rtt = (Date.now() - t0) / 2;
        const m = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/.exec(s || '');
        if (!m) continue;
        const ms = m[7] ? Math.round(parseFloat('0.' + m[7]) * 1000) : 0;
        skew = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6], ms) + rtt - deviceWallMs();
        source = name;
        break;
      } catch (e) { /* try the next source */ }
    }
    listeners.forEach(f => f());
  }

  return {
    sync,
    onSync: f => listeners.push(f),
    source: () => source,
    iso() { return new Date(wallMs()).toISOString().slice(0, 10); },
    min() { const d = new Date(wallMs()); return d.getUTCHours() * 60 + d.getUTCMinutes(); },
  };
})();
