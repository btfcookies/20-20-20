(() => {
  const FOCUS_MS = 20 * 60 * 1000;
  const BREAK_MS = 20 * 1000;
  const STORAGE_KEY = "20-20-20-state";

  const body = document.body;
  const stateLabelEl = document.getElementById("stateLabel");
  const clockEl = document.getElementById("clock");
  const messageEl = document.getElementById("message");
  const glyphEl = document.getElementById("glyph");
  const actionBtn = document.getElementById("actionBtn");

  const COPY = {
    focus: {
      label: "Focus",
      message: "Stay on task. Your eyes will thank you in…",
      title: (mmss) => `${mmss} · Focus`,
    },
    breakReady: {
      label: "Break time",
      message: "Time to rest your eyes.",
      title: () => "Break time · 20-20-20",
    },
    breakActive: {
      label: "Break",
      message: "Look at something 20 feet away.",
      title: (mmss) => `${mmss} · Break`,
    },
    breakDone: {
      label: "Good",
      message: "Nicely done. Ready when you are.",
      title: () => "Ready · 20-20-20",
    },
  };

  let phase = "focus";
  let endTime = null;
  let tickHandle = null;

  function load() {
    let stored = null;
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (_) {
      stored = null;
    }

    if (!stored || !stored.phase) {
      startFocus();
      return;
    }

    phase = stored.phase;
    endTime = stored.endTime ?? null;

    const now = Date.now();
    if (phase === "focus" && endTime !== null && endTime <= now) {
      phase = "breakReady";
      endTime = null;
    } else if (phase === "breakActive" && endTime !== null && endTime <= now) {
      phase = "breakDone";
      endTime = null;
    }

    save();
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ phase, endTime }));
  }

  function startFocus() {
    phase = "focus";
    endTime = Date.now() + FOCUS_MS;
    save();
  }

  function startBreak() {
    phase = "breakActive";
    endTime = Date.now() + BREAK_MS;
    save();
  }

  function formatClock(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function setGlyph(blurPx, opacity) {
    glyphEl.style.filter = `blur(${blurPx}px)`;
    glyphEl.style.opacity = opacity;
  }

  function render() {
    const copy = COPY[phase];
    body.dataset.phase = phase;
    stateLabelEl.textContent = copy.label;

    if (phase === "focus" || phase === "breakActive") {
      const total = phase === "focus" ? FOCUS_MS : BREAK_MS;
      const remaining = Math.max(0, endTime - Date.now());
      const mmss = formatClock(remaining);

      clockEl.hidden = false;
      clockEl.textContent = mmss;
      messageEl.textContent = copy.message;
      actionBtn.hidden = true;
      document.title = copy.title(mmss);

      if (phase === "focus") {
        setGlyph(6, 0.55);
      } else {
        const progress = 1 - remaining / total; // 0 -> 1 as break proceeds
        setGlyph(6 * (1 - progress), 0.55 + 0.45 * progress);
      }
    } else {
      clockEl.hidden = true;
      messageEl.textContent = copy.message;
      document.title = copy.title();

      if (phase === "breakReady") {
        setGlyph(6, 0.55);
        actionBtn.textContent = "Start Break";
      } else {
        setGlyph(0, 1);
        actionBtn.textContent = "Finish Break";
      }
      actionBtn.hidden = false;
    }
  }

  function tick() {
    if (phase === "focus" && Date.now() >= endTime) {
      phase = "breakReady";
      endTime = null;
      save();
      playChime();
    } else if (phase === "breakActive" && Date.now() >= endTime) {
      phase = "breakDone";
      endTime = null;
      save();
      playChime();
    }
    render();
  }

  actionBtn.addEventListener("click", () => {
    if (phase === "breakReady") {
      startBreak();
    } else if (phase === "breakDone") {
      startFocus();
    }
    render();
  });

  // --- Web Audio chime ---
  let audioCtx = null;

  function ensureAudio() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }

  document.addEventListener("pointerdown", ensureAudio);
  document.addEventListener("keydown", ensureAudio);

  function playChime() {
    ensureAudio();
    if (!audioCtx || audioCtx.state !== "running") return;

    const notes = [
      { freq: 784.0, start: 0, dur: 0.9 }, // G5
      { freq: 1046.5, start: 0.15, dur: 1.0 }, // C6
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;

      const t0 = audioCtx.currentTime + start;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.16, t0 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    });
  }

  load();
  render();
  tickHandle = setInterval(tick, 250);
})();
