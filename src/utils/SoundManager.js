export default class SoundManager {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.isEnabled = false;
    this.init();
  }

  init() {
    this.loadSound("hover", "https://assets.codepen.io/7558/click-reverb-001.mp3", 0.15);
    this.loadSound("click", "https://assets.codepen.io/7558/shutter-fx-001.mp3", 0.3);
    this.loadSound("textChange", "https://assets.codepen.io/7558/whoosh-fx-001.mp3", 0.3);
  }

  async loadSound(name, url, volume = 0.3) {
    try {
      if (!this.audioContext)
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      const res = await fetch(url);
      const arrBuf = await res.arrayBuffer();
      const audioBuf = await this.audioContext.decodeAudioData(arrBuf);
      this.sounds[name] = { buffer: audioBuf, volume };
    } catch (err) {
      console.error("Failed to load sound:", name, err);
    }
  }

  async enableAudio() {
    if (!this.audioContext)
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    this.isEnabled = true;
    console.log("🔊 Audio enabled");
  }

  play(name, delay = 0) {
    if (!this.isEnabled || !this.audioContext || !this.sounds[name]) return;

    const { buffer, volume } = this.sounds[name];
    const src = this.audioContext.createBufferSource();
    src.buffer = buffer;
    const gain = this.audioContext.createGain();
    gain.gain.value = volume;
    src.connect(gain).connect(this.audioContext.destination);
    src.start(this.audioContext.currentTime + delay / 1000);
  }
}