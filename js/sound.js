// All sounds are synthesized with WebAudio, so there are no audio files to host.
// The AudioContext is created on the first click (browsers block autoplay).
const Sound = (() => {
  let ctx, master, noise, muted = false, wave = 'triangle';
  const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5]; // C major pentatonic-ish

  function init() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  const live = () => ctx && !muted;

  function tone(freq, dur = 0.12, type = wave, vol = 0.16, delay = 0, to) {
    if (!live()) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.03);
  }

  function swoosh(dur = 0.5, from = 250, to = 3200, vol = 0.22) {
    if (!live()) return;
    const t = ctx.currentTime;
    const s = ctx.createBufferSource();
    s.buffer = noise; s.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.Q.value = 1.1;
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + dur + 0.05);
  }

  return {
    init,
    setTheme(id) { wave = id === 'terminal' ? 'square' : id === 'paper' ? 'sine' : 'triangle'; },
    setMuted(m) { muted = m; },
    isMuted: () => muted,

    hover()  { tone(1400, 0.04, 'sine', 0.035); },
    type(i)  { tone(900 + (i % 6) * 70, 0.05, wave, 0.05); },
    select(i = 0) { const n = SCALE[i % SCALE.length]; tone(n, 0.18, wave, 0.2); tone(n * 1.5, 0.22, 'sine', 0.08, 0.05); },
    tick(p)  { tone(300 + p * 900, 0.04, 'square', 0.04); },
    whoosh() { swoosh(0.55, 220, 3000, 0.2); },
    start()  {
      swoosh(0.9, 150, 5000, 0.28);
      [0, 2, 4].forEach((n, i) => tone(SCALE[n], 0.35, wave, 0.14, 0.08 + i * 0.09));
    },
    theme()  { swoosh(0.7, 800, 200, 0.18); tone(440, 0.3, 'sine', 0.1, 0.15, 880); },
    chime()  { [0, 2, 4, 5, 7].forEach((n, i) => { tone(SCALE[n], 0.5, wave, 0.15, i * 0.1); tone(SCALE[n] * 2, 0.4, 'sine', 0.05, i * 0.1); }); },
    back()   { tone(520, 0.14, wave, 0.12, 0, 330); },
  };
})();
