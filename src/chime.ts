// Synthesises a 3-note ascending chime using the Web Audio API.
// Each note uses a fundamental sine wave plus a tierce partial (×2.756)
// to give a bell-like quality without any audio files.
export function playChime() {
  const ctx = new AudioContext();

  // E5 → G#5 → B5  (major arpeggio — bright and resolving)
  const notes = [659.25, 830.61, 987.77];

  notes.forEach((freq, i) => {
    const start = ctx.currentTime + i * 0.28;
    const decay = 1.4 - i * 0.1;

    // Fundamental + inharmonic tierce partial for bell character
    ([
      [1,     0.35],
      [2.756, 0.12],
    ] as [number, number][]).forEach(([ratio, amp]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.value = freq * ratio;

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(amp, start + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + decay);

      osc.start(start);
      osc.stop(start + decay + 0.05);
    });
  });

  setTimeout(() => ctx.close(), (notes.length * 0.28 + 1.6) * 1000);
}
