/* Goldstack Keep audio engine - plain JavaScript, no build step.
   Add to index.html with a script tag pointing at audio.js, then use the global gsAudio. */
var GSA = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  var GoldstackAudio_exports = {};
  __export(GoldstackAudio_exports, {
    GoldstackAudio: () => GoldstackAudio,
    audio: () => audio
  });
  const MIDI_A4 = 69;
  const mtof = (m) => 440 * Math.pow(2, (m - MIDI_A4) / 12);
  const YO = [0, 2, 5, 7, 9];
  const IN = [0, 1, 5, 7, 8];
  const STAGES = [
    {
      name: "Maple Road",
      bpm: 82,
      root: 50,
      // D3
      chords: [[0, "min"], [-2, "maj"], [3, "maj"], [-5, "maj"]],
      scale: YO,
      motif: [0, 2, 1, 4, 3, 2, 1, 0]
    },
    {
      name: "The Stone Wall",
      bpm: 88,
      root: 50,
      chords: [[0, "min"], [5, "min"], [-2, "maj"], [7, "maj"]],
      scale: YO,
      motif: [0, 2, 1, 4, 3, 2, 1, 0]
    },
    {
      name: "Dusk Over the Keep",
      bpm: 94,
      root: 50,
      chords: [[0, "min"], [-2, "maj"], [5, "min"], [7, "maj"]],
      scale: IN,
      motif: [0, 2, 1, 4, 4, 3, 1, 0]
    },
    {
      name: "Storm Banner",
      bpm: 100,
      root: 50,
      chords: [[0, "min"], [1, "maj"], [-2, "maj"], [7, "maj"]],
      scale: IN,
      motif: [0, 2, 1, 4, 4, 3, 2, 0]
    },
    {
      name: "The Golden Wolf",
      bpm: 108,
      root: 50,
      chords: [[0, "min"], [0, "min"], [1, "maj"], [7, "maj"]],
      scale: IN,
      motif: [0, 4, 3, 2, 4, 3, 1, 0]
    }
  ];
  const LAYERS = {
    drone: 0,
    breath: 0,
    taiko: 0.18,
    koto: 0.35,
    strings: 0.55,
    shime: 0.72,
    brass: 0.88
  };
  const PHASE_INTENSITY = {
    silent: 0,
    menu: 0.12,
    build: 0.3,
    combat: 0.62,
    boss: 1,
    victory: 0.35,
    defeat: 0.1
  };
  class GoldstackAudio {
    constructor() {
      __publicField(this, "ctx", null);
      __publicField(this, "master");
      __publicField(this, "comp");
      __publicField(this, "musicBus");
      __publicField(this, "musicDuck");
      __publicField(this, "sfxBus");
      __publicField(this, "verb");
      __publicField(this, "verbSend");
      __publicField(this, "noise");
      __publicField(this, "started", false);
      __publicField(this, "musicOn", false);
      __publicField(this, "stageIndex", 0);
      __publicField(this, "phase", "menu");
      __publicField(this, "intensity", PHASE_INTENSITY.menu);
      __publicField(this, "targetIntensity", PHASE_INTENSITY.menu);
      __publicField(this, "step", 0);
      __publicField(this, "nextStepTime", 0);
      __publicField(this, "timer", null);
      __publicField(this, "volumes", { master: 0.9, music: 0.55, sfx: 0.8 });
      __publicField(this, "muted", false);
      /** Cheap voice limiter so 30 towers firing at once doesn't shred the mix. */
      __publicField(this, "lastFired", {});
      __publicField(this, "voices", 0);
      __publicField(this, "LOOKAHEAD", 0.14);
      // seconds scheduled in advance
      __publicField(this, "TICK", 25);
      // ms between scheduler wake-ups
      __publicField(this, "MAX_VOICES", 24);
    }
    /* ---------------- lifecycle ---------------- */
    /** Call inside the first real user gesture (pointerdown / touchend / keydown). */
    unlock() {
      var _a;
      if (this.started) {
        void ((_a = this.ctx) == null ? void 0 : _a.resume());
        return;
      }
      const Ctor = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctor({ latencyHint: "interactive" });
      this.ctx = ctx;
      this.comp = ctx.createDynamicsCompressor();
      this.comp.threshold.value = -14;
      this.comp.knee.value = 24;
      this.comp.ratio.value = 3.2;
      this.comp.attack.value = 4e-3;
      this.comp.release.value = 0.22;
      this.master = ctx.createGain();
      this.master.gain.value = this.volumes.master;
      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = this.volumes.music;
      this.musicDuck = ctx.createGain();
      this.musicDuck.gain.value = 1;
      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = this.volumes.sfx;
      this.verb = ctx.createConvolver();
      this.verb.buffer = this.makeImpulse(2.4, 2.6);
      this.verbSend = ctx.createGain();
      this.verbSend.gain.value = 0.9;
      this.noise = this.makeNoise(2);
      this.musicBus.connect(this.musicDuck).connect(this.comp);
      this.sfxBus.connect(this.comp);
      this.verbSend.connect(this.verb).connect(this.comp);
      this.comp.connect(this.master).connect(ctx.destination);
      document.addEventListener("visibilitychange", () => {
        if (!this.ctx) return;
        if (document.hidden) void this.ctx.suspend();
        else if (this.musicOn) void this.ctx.resume();
      });
      this.started = true;
      void ctx.resume();
    }
    get ready() {
      return this.started;
    }
    get now() {
      return this.ctx ? this.ctx.currentTime : 0;
    }
    /* ---------------- mixing ---------------- */
    setMasterVolume(v) {
      this.volumes.master = clamp(v, 0, 1);
      if (this.started) this.master.gain.setTargetAtTime(this.muted ? 0 : this.volumes.master, this.now, 0.02);
    }
    setMusicVolume(v) {
      this.volumes.music = clamp(v, 0, 1);
      if (this.started) this.musicBus.gain.setTargetAtTime(this.volumes.music, this.now, 0.05);
    }
    setSfxVolume(v) {
      this.volumes.sfx = clamp(v, 0, 1);
      if (this.started) this.sfxBus.gain.setTargetAtTime(this.volumes.sfx, this.now, 0.02);
    }
    setMuted(m) {
      this.muted = m;
      if (this.started) this.master.gain.setTargetAtTime(m ? 0 : this.volumes.master, this.now, 0.02);
    }
    get isMuted() {
      return this.muted;
    }
    /* ---------------- score control ---------------- */
    /** 1-based stage number. Crossfades if the score is already running. */
    setStage(stage) {
      const idx = clamp(Math.round(stage) - 1, 0, STAGES.length - 1);
      if (idx === this.stageIndex) return;
      this.stageIndex = idx;
      if (this.musicOn && this.started) {
        this.musicDuck.gain.cancelScheduledValues(this.now);
        this.musicDuck.gain.setTargetAtTime(1e-4, this.now, 0.25);
        window.setTimeout(() => {
          this.step = 0;
          this.nextStepTime = this.now + 0.05;
          this.musicDuck.gain.setTargetAtTime(1, this.now, 0.6);
        }, 900);
      }
    }
    get stage() {
      return this.stageIndex + 1;
    }
    get stageName() {
      return STAGES[this.stageIndex].name;
    }
    setPhase(phase) {
      var _a;
      this.phase = phase;
      this.targetIntensity = (_a = PHASE_INTENSITY[phase]) != null ? _a : 0.4;
    }
    /** Fine control, 0..1. Drive it from wave progress for a true build. */
    setIntensity(v) {
      this.targetIntensity = clamp(v, 0, 1);
    }
    playMusic() {
      if (!this.started) this.unlock();
      if (!this.ctx || this.musicOn) return;
      this.musicOn = true;
      this.step = 0;
      this.nextStepTime = this.now + 0.08;
      this.musicDuck.gain.setValueAtTime(1e-4, this.now);
      this.musicDuck.gain.setTargetAtTime(1, this.now, 0.8);
      this.timer = window.setInterval(() => this.scheduler(), this.TICK);
    }
    stopMusic(fade = 1.2) {
      if (!this.ctx || !this.musicOn) return;
      this.musicDuck.gain.cancelScheduledValues(this.now);
      this.musicDuck.gain.setTargetAtTime(1e-4, this.now, fade / 3);
      window.setTimeout(() => {
        if (this.timer !== null) window.clearInterval(this.timer);
        this.timer = null;
        this.musicOn = false;
      }, fade * 1e3);
    }
    get playing() {
      return this.musicOn;
    }
    /** 0..1, for driving a visualiser. */
    get liveIntensity() {
      return this.intensity;
    }
    /** Current sixteenth-note step, 0..63. Useful for spawning waves on the beat. */
    get beat() {
      return this.step;
    }
    get bpm() {
      return STAGES[this.stageIndex].bpm;
    }
    activeLayers() {
      return Object.keys(LAYERS).filter((k) => this.intensity >= LAYERS[k]);
    }
    /* ---------------- scheduler ---------------- */
    scheduler() {
      if (!this.ctx || !this.musicOn) return;
      const s = STAGES[this.stageIndex];
      const stepDur = 60 / s.bpm / 4;
      this.intensity += (this.targetIntensity - this.intensity) * 0.06;
      while (this.nextStepTime < this.now + this.LOOKAHEAD) {
        this.playStep(this.step, this.nextStepTime, s);
        this.nextStepTime += stepDur;
        this.step = (this.step + 1) % 64;
      }
    }
    playStep(step, t, s) {
      const bar = Math.floor(step / 16);
      const beat = step % 16;
      const I = this.intensity;
      const [chordOffset, quality] = s.chords[bar];
      const chordRoot = s.root + chordOffset;
      const third = quality === "min" ? 3 : 4;
      if (beat === 0) {
        const barDur = 60 / s.bpm * 4;
        this.drone(t, mtof(chordRoot - 12), barDur * 1.05, 0.5 + I * 0.3);
        if (I >= LAYERS.breath) {
          this.breathPad(t, [chordRoot + 12, chordRoot + 12 + third, chordRoot + 19], barDur, 0.16 + I * 0.1);
        }
      }
      if (I >= LAYERS.taiko) {
        const onBeat = beat % 8 === 0;
        const busy = I >= LAYERS.shime ? beat % 4 === 0 : beat % 8 === 0;
        if (busy || onBeat) this.taiko(t, beat === 0 ? 62 : 54, 0.55 + I * 0.4);
        if (I >= LAYERS.shime && (beat === 6 || beat === 14)) this.taiko(t, 48, 0.3);
      }
      if (I >= LAYERS.shime && beat % 2 === 1) {
        this.shime(t, 0.16 + I * 0.14);
      }
      if (I >= LAYERS.koto && beat % 4 === 0) {
        const idx = bar % 2 * 4 + beat / 4;
        const deg = s.motif[idx % s.motif.length];
        const note = s.root + 12 + degreeToSemitone(deg, s.scale);
        this.koto(t, mtof(note), 0.5 + (I - LAYERS.koto) * 0.6);
        if (I >= LAYERS.strings && beat === 8) this.koto(t + 0.06, mtof(note + 12), 0.25);
      }
      if (I >= LAYERS.strings) {
        const cell = [0, 7, 12, 7, 3, 7, 12, 7];
        const semi = cell[beat % cell.length];
        this.strings(t, mtof(chordRoot + 12 + (semi === 3 ? third : semi)), 60 / s.bpm / 4, 0.16 + I * 0.12);
      }
      if (I >= LAYERS.brass && (beat === 0 || beat === 10)) {
        this.brass(t, mtof(chordRoot), 0.45, 0.32);
        this.brass(t, mtof(chordRoot + third + 12), 0.45, 0.16);
      }
    }
    /* ---------------- instruments ---------------- */
    drone(t, f, dur, g) {
      const ctx = this.ctx;
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const lp = ctx.createBiquadFilter();
      const env = ctx.createGain();
      o1.type = "sine";
      o2.type = "triangle";
      o1.frequency.value = f;
      o2.frequency.value = f * 1.004;
      lp.type = "lowpass";
      lp.frequency.value = 320;
      env.gain.setValueAtTime(1e-4, t);
      env.gain.exponentialRampToValueAtTime(g * 0.5, t + 0.4);
      env.gain.exponentialRampToValueAtTime(1e-4, t + dur);
      o1.connect(lp);
      o2.connect(lp);
      lp.connect(env).connect(this.musicBus);
      o1.start(t);
      o2.start(t);
      o1.stop(t + dur + 0.1);
      o2.stop(t + dur + 0.1);
    }
    breathPad(t, notes, dur, g) {
      const ctx = this.ctx;
      const bp = ctx.createBiquadFilter();
      bp.type = "lowpass";
      bp.frequency.setValueAtTime(600, t);
      bp.frequency.linearRampToValueAtTime(1600, t + dur * 0.5);
      bp.frequency.linearRampToValueAtTime(700, t + dur);
      bp.Q.value = 1.2;
      const env = ctx.createGain();
      env.gain.setValueAtTime(1e-4, t);
      env.gain.exponentialRampToValueAtTime(g, t + dur * 0.35);
      env.gain.exponentialRampToValueAtTime(1e-4, t + dur);
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 4.6;
      lfoGain.gain.value = 3.4;
      lfo.connect(lfoGain);
      for (const n of notes) {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = mtof(n);
        o.detune.value = (Math.random() - 0.5) * 9;
        lfoGain.connect(o.detune);
        o.connect(bp);
        o.start(t);
        o.stop(t + dur + 0.1);
      }
      const air = ctx.createBufferSource();
      air.buffer = this.noise;
      air.loop = true;
      const airBp = ctx.createBiquadFilter();
      airBp.type = "bandpass";
      airBp.frequency.value = 1400;
      airBp.Q.value = 1.4;
      const airG = ctx.createGain();
      airG.gain.value = 0.05;
      air.connect(airBp).connect(airG).connect(bp);
      air.start(t);
      air.stop(t + dur);
      bp.connect(env);
      env.connect(this.musicBus);
      env.connect(this.verbSend);
      lfo.start(t);
      lfo.stop(t + dur + 0.1);
    }
    taiko(t, pitch, g) {
      const ctx = this.ctx;
      const o = ctx.createOscillator();
      const env = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(mtof(pitch) * 2.2, t);
      o.frequency.exponentialRampToValueAtTime(mtof(pitch) * 0.55, t + 0.13);
      env.gain.setValueAtTime(g, t);
      env.gain.exponentialRampToValueAtTime(1e-4, t + 0.42);
      o.connect(env).connect(this.musicBus);
      o.start(t);
      o.stop(t + 0.45);
      const skin = ctx.createBufferSource();
      skin.buffer = this.noise;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 420;
      bp.Q.value = 0.9;
      const senv = ctx.createGain();
      senv.gain.setValueAtTime(g * 0.5, t);
      senv.gain.exponentialRampToValueAtTime(1e-4, t + 0.09);
      skin.connect(bp).connect(senv).connect(this.musicBus);
      senv.connect(this.verbSend);
      skin.start(t);
      skin.stop(t + 0.12);
    }
    shime(t, g) {
      const ctx = this.ctx;
      const n = ctx.createBufferSource();
      n.buffer = this.noise;
      const hp = ctx.createBiquadFilter();
      hp.type = "bandpass";
      hp.frequency.value = 2600;
      hp.Q.value = 1.6;
      const env = ctx.createGain();
      env.gain.setValueAtTime(g, t);
      env.gain.exponentialRampToValueAtTime(1e-4, t + 0.05);
      n.connect(hp).connect(env).connect(this.musicBus);
      n.start(t);
      n.stop(t + 0.06);
    }
    /** Karplus–Strong pluck: genuinely a string, not a filtered blip. */
    koto(t, f, g, bus) {
      const ctx = this.ctx;
      const out = bus != null ? bus : this.musicBus;
      const exc = ctx.createBufferSource();
      exc.buffer = this.noise;
      const excEnv = ctx.createGain();
      excEnv.gain.setValueAtTime(g, t);
      excEnv.gain.exponentialRampToValueAtTime(1e-4, t + 0.012);
      const delay = ctx.createDelay(0.05);
      delay.delayTime.value = 1 / Math.max(f, 40);
      const fb = ctx.createGain();
      fb.gain.value = 0.93;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = Math.min(f * 7, 7e3);
      const body = ctx.createBiquadFilter();
      body.type = "peaking";
      body.frequency.value = 900;
      body.gain.value = 4;
      const env = ctx.createGain();
      env.gain.setValueAtTime(1, t);
      env.gain.exponentialRampToValueAtTime(1e-4, t + 1.6);
      exc.connect(excEnv).connect(delay);
      delay.connect(lp).connect(fb).connect(delay);
      delay.connect(body).connect(env);
      env.connect(out);
      env.connect(this.verbSend);
      exc.start(t);
      exc.stop(t + 0.05);
      window.setTimeout(() => {
        try {
          fb.disconnect();
          delay.disconnect();
        } catch {
        }
      }, 2600);
    }
    strings(t, f, dur, g) {
      const ctx = this.ctx;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(900 + g * 5200, t);
      lp.frequency.exponentialRampToValueAtTime(700, t + dur * 1.6);
      lp.Q.value = 3;
      const env = ctx.createGain();
      env.gain.setValueAtTime(1e-4, t);
      env.gain.exponentialRampToValueAtTime(g, t + 0.012);
      env.gain.exponentialRampToValueAtTime(1e-4, t + dur * 1.7);
      for (let i = 0; i < 3; i++) {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = f;
        o.detune.value = (i - 1) * 7;
        o.connect(lp);
        o.start(t);
        o.stop(t + dur * 1.8);
      }
      lp.connect(env).connect(this.musicBus);
      env.connect(this.verbSend);
    }
    brass(t, f, dur, g) {
      const ctx = this.ctx;
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.makeCurve(14);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(400, t);
      lp.frequency.exponentialRampToValueAtTime(3200, t + 0.09);
      lp.frequency.exponentialRampToValueAtTime(900, t + dur);
      const env = ctx.createGain();
      env.gain.setValueAtTime(1e-4, t);
      env.gain.exponentialRampToValueAtTime(g, t + 0.05);
      env.gain.setValueAtTime(g, t + dur * 0.6);
      env.gain.exponentialRampToValueAtTime(1e-4, t + dur * 1.4);
      for (let i = 0; i < 4; i++) {
        const o = ctx.createOscillator();
        o.type = i < 2 ? "sawtooth" : "square";
        o.frequency.value = f;
        o.detune.value = (i - 1.5) * 11;
        o.connect(shaper);
        o.start(t);
        o.stop(t + dur * 1.5);
      }
      shaper.connect(lp).connect(env).connect(this.musicBus);
      env.connect(this.verbSend);
    }
    /* ---------------- sound effects ---------------- */
    sfx(name, opts = {}) {
      var _a, _b, _c, _d, _e;
      if (!this.started || !this.ctx) return;
      const t = this.now + 1e-3;
      const last = (_a = this.lastFired[name]) != null ? _a : -1;
      if (t - last < 0.028) return;
      if (this.voices > this.MAX_VOICES && !HEAVY.has(name)) return;
      this.lastFired[name] = t;
      const pan = this.ctx.createStereoPanner();
      pan.pan.value = clamp((_b = opts.pan) != null ? _b : 0, -1, 1);
      const out = this.ctx.createGain();
      out.gain.value = clamp((_c = opts.gain) != null ? _c : 1, 0, 2);
      pan.connect(out).connect(this.sfxBus);
      const semis = (_d = opts.pitch) != null ? _d : 0;
      const p = (hz) => hz * Math.pow(2, semis / 12);
      this.voices++;
      window.setTimeout(() => {
        this.voices--;
      }, 900);
      switch (name) {
        case "uiTap":
          this.blip(t, p(1100), 0.05, 0.25, pan, "triangle");
          break;
        case "uiOpen":
          this.blip(t, p(640), 0.08, 0.2, pan, "triangle");
          this.blip(t + 0.05, p(960), 0.1, 0.16, pan, "triangle");
          break;
        case "uiDenied":
          this.blip(t, p(190), 0.09, 0.3, pan, "square");
          this.blip(t + 0.08, p(150), 0.14, 0.26, pan, "square");
          break;
        case "coin":
          this.blip(t, p(1860), 0.05, 0.22, pan, "triangle");
          this.blip(t + 0.035, p(2480), 0.11, 0.18, pan, "triangle");
          this.noiseHit(t, 5200, 0.03, 0.1, pan, "bandpass");
          break;
        case "stack": {
          const k = clamp((_e = opts.step) != null ? _e : 0, 0, 12);
          this.blip(t, p(520 + k * 46), 0.07, 0.3, pan, "sine");
          this.blip(t + 0.02, p(1560 + k * 92), 0.09, 0.14, pan, "triangle");
          this.thump(t, 96, 0.1, 0.25, pan);
          break;
        }
        case "build":
          this.thump(t, 84, 0.16, 0.5, pan);
          this.noiseHit(t, 1800, 0.07, 0.22, pan, "bandpass");
          [0, 2, 4].forEach((d, i) => this.koto(t + i * 0.055, p(mtof(62 + d)), 0.5, out));
          break;
        case "upgrade":
          [0, 4, 7, 12].forEach((d, i) => this.blip(t + i * 0.045, p(mtof(69 + d)), 0.18, 0.2, pan, "triangle"));
          this.noiseHit(t + 0.14, 4200, 0.3, 0.1, pan, "bandpass");
          break;
        case "sell":
          [12, 7, 4, 0].forEach((d, i) => this.blip(t + i * 0.04, p(mtof(69 + d)), 0.14, 0.16, pan, "triangle"));
          break;
        case "shootArrow":
          this.sweepNoise(t, 3400, 900, 0.1, 0.22, pan);
          break;
        case "shootMagic": {
          const o = this.ctx.createOscillator();
          const mod = this.ctx.createOscillator();
          const modG = this.ctx.createGain();
          const env = this.ctx.createGain();
          o.frequency.setValueAtTime(p(760), t);
          o.frequency.exponentialRampToValueAtTime(p(1600), t + 0.16);
          mod.frequency.value = p(1240);
          modG.gain.value = 600;
          mod.connect(modG).connect(o.frequency);
          env.gain.setValueAtTime(0.22, t);
          env.gain.exponentialRampToValueAtTime(1e-4, t + 0.3);
          o.connect(env).connect(pan);
          this.send(env, 0.35);
          o.start(t);
          mod.start(t);
          o.stop(t + 0.32);
          mod.stop(t + 0.32);
          break;
        }
        case "shootCannon":
          this.thump(t, 70, 0.26, 0.7, pan);
          this.noiseHit(t, 900, 0.16, 0.4, pan, "lowpass");
          break;
        case "hit":
          this.noiseHit(t, 2600, 0.05, 0.18, pan, "bandpass");
          this.blip(t, p(320), 0.05, 0.12, pan, "square");
          break;
        case "enemyDeath":
          this.sweepNoise(t, 1800, 300, 0.22, 0.2, pan);
          this.blipSweep(t, p(420), p(120), 0.24, 0.16, pan, "sawtooth");
          break;
        case "gateHit":
          this.thump(t, 54, 0.5, 0.85, pan);
          this.noiseHit(t, 500, 0.3, 0.35, pan, "lowpass");
          this.duck(0.55, 0.7);
          break;
        case "waveIncoming":
          this.horn(t, p(mtof(45)), 0.6, 0.3, pan);
          this.horn(t + 0.42, p(mtof(52)), 0.8, 0.28, pan);
          this.duck(0.6, 1);
          break;
        case "bossRoar": {
          const o = this.ctx.createOscillator();
          const o2 = this.ctx.createOscillator();
          const sh = this.ctx.createWaveShaper();
          sh.curve = this.makeCurve(40);
          const lp = this.ctx.createBiquadFilter();
          lp.type = "lowpass";
          lp.frequency.setValueAtTime(260, t);
          lp.frequency.linearRampToValueAtTime(1500, t + 0.4);
          lp.frequency.linearRampToValueAtTime(300, t + 1.3);
          const env = this.ctx.createGain();
          env.gain.setValueAtTime(1e-4, t);
          env.gain.exponentialRampToValueAtTime(0.6, t + 0.15);
          env.gain.exponentialRampToValueAtTime(1e-4, t + 1.5);
          o.type = "sawtooth";
          o2.type = "sawtooth";
          o.frequency.setValueAtTime(p(58), t);
          o.frequency.linearRampToValueAtTime(p(46), t + 1.4);
          o2.frequency.setValueAtTime(p(87), t);
          o2.frequency.linearRampToValueAtTime(p(69), t + 1.4);
          o.connect(sh);
          o2.connect(sh);
          sh.connect(lp).connect(env).connect(pan);
          this.send(env, 0.5);
          o.start(t);
          o2.start(t);
          o.stop(t + 1.6);
          o2.stop(t + 1.6);
          this.duck(0.4, 1.6);
          break;
        }
        case "stageClear": {
          const notes = [62, 65, 69, 74, 77];
          notes.forEach((n, i) => {
            this.koto(t + i * 0.12, p(mtof(n)), 0.6, out);
            if (i % 2 === 0) this.thumpAt(t + i * 0.12, 60, 0.3, 0.35, pan);
          });
          this.horn(t + 0.62, p(mtof(50)), 1.2, 0.26, pan);
          break;
        }
        case "gameOver":
          this.horn(t, p(mtof(45)), 1.4, 0.3, pan);
          this.blipSweep(t + 0.2, p(300), p(70), 1.6, 0.2, pan, "sawtooth");
          this.duck(0.25, 2.2);
          break;
      }
    }
    /* ---------------- primitives ---------------- */
    send(node, amount) {
      const g = this.ctx.createGain();
      g.gain.value = amount;
      node.connect(g).connect(this.verbSend);
    }
    blip(t, f, dur, g, dest, type) {
      const o = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      o.type = type;
      o.frequency.value = f;
      env.gain.setValueAtTime(1e-4, t);
      env.gain.exponentialRampToValueAtTime(g, t + 6e-3);
      env.gain.exponentialRampToValueAtTime(1e-4, t + dur);
      o.connect(env).connect(dest);
      this.send(env, 0.25);
      o.start(t);
      o.stop(t + dur + 0.02);
    }
    blipSweep(t, from, to, dur, g, dest, type) {
      const o = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(from, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(to, 20), t + dur);
      env.gain.setValueAtTime(g, t);
      env.gain.exponentialRampToValueAtTime(1e-4, t + dur);
      o.connect(env).connect(dest);
      o.start(t);
      o.stop(t + dur + 0.02);
    }
    thump(t, f, dur, g, dest) {
      this.thumpAt(t, f, dur, g, dest);
    }
    thumpAt(t, f, dur, g, dest) {
      const o = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(f * 2.4, t);
      o.frequency.exponentialRampToValueAtTime(f * 0.6, t + dur * 0.5);
      env.gain.setValueAtTime(g, t);
      env.gain.exponentialRampToValueAtTime(1e-4, t + dur);
      o.connect(env).connect(dest);
      o.start(t);
      o.stop(t + dur + 0.02);
    }
    noiseHit(t, freq, dur, g, dest, type) {
      const n = this.ctx.createBufferSource();
      n.buffer = this.noise;
      const f = this.ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = 1.1;
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(g, t);
      env.gain.exponentialRampToValueAtTime(1e-4, t + dur);
      n.connect(f).connect(env).connect(dest);
      this.send(env, 0.3);
      n.start(t);
      n.stop(t + dur + 0.02);
    }
    sweepNoise(t, from, to, dur, g, dest) {
      const n = this.ctx.createBufferSource();
      n.buffer = this.noise;
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.Q.value = 3.5;
      f.frequency.setValueAtTime(from, t);
      f.frequency.exponentialRampToValueAtTime(to, t + dur);
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(g, t);
      env.gain.exponentialRampToValueAtTime(1e-4, t + dur);
      n.connect(f).connect(env).connect(dest);
      this.send(env, 0.25);
      n.start(t);
      n.stop(t + dur + 0.02);
    }
    horn(t, f, dur, g, dest) {
      const sh = this.ctx.createWaveShaper();
      sh.curve = this.makeCurve(10);
      const lp = this.ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(350, t);
      lp.frequency.exponentialRampToValueAtTime(2400, t + 0.2);
      lp.frequency.exponentialRampToValueAtTime(600, t + dur);
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(1e-4, t);
      env.gain.exponentialRampToValueAtTime(g, t + 0.12);
      env.gain.setValueAtTime(g, t + dur * 0.7);
      env.gain.exponentialRampToValueAtTime(1e-4, t + dur * 1.3);
      for (let i = 0; i < 3; i++) {
        const o = this.ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = f;
        o.detune.value = (i - 1) * 9;
        o.connect(sh);
        o.start(t);
        o.stop(t + dur * 1.4);
      }
      sh.connect(lp).connect(env).connect(dest);
      this.send(env, 0.6);
    }
    /** Pull the score down under a big moment, then let it breathe back in. */
    duck(depth, time) {
      if (!this.ctx) return;
      const t = this.now;
      this.musicDuck.gain.cancelScheduledValues(t);
      this.musicDuck.gain.setTargetAtTime(depth, t, 0.04);
      this.musicDuck.gain.setTargetAtTime(1, t + time * 0.5, time * 0.4);
    }
    /* ---------------- buffers ---------------- */
    makeNoise(seconds) {
      const ctx = this.ctx;
      const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return buf;
    }
    /** A hall, generated: noise with an exponential tail. Cheaper than a 2 MB IR file. */
    makeImpulse(seconds, decay) {
      const ctx = this.ctx;
      const len = Math.floor(ctx.sampleRate * seconds);
      const buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < len; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
        }
      }
      return buf;
    }
    makeCurve(amount) {
      const n = 1024;
      const curve = new Float32Array(n);
      const k = amount;
      for (let i = 0; i < n; i++) {
        const x = i * 2 / n - 1;
        curve[i] = (3 + k) * x * 20 * Math.PI / (Math.PI + k * Math.abs(x)) / 20;
      }
      return curve;
    }
  }
  const HEAVY = /* @__PURE__ */ new Set(["bossRoar", "waveIncoming", "stageClear", "gameOver", "gateHit"]);
  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }
  function degreeToSemitone(deg, scale) {
    const oct = Math.floor(deg / scale.length);
    const i = (deg % scale.length + scale.length) % scale.length;
    return scale[i] + oct * 12;
  }
  const audio = new GoldstackAudio();
  return __toCommonJS(GoldstackAudio_exports);
})();

window.gsAudio = GSA.audio;
