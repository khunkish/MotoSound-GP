import { EngineType, ExhaustType } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  
  // -- Sound Sources --
  // 1. Combustion (The Tones)
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null; // For V-Twin thump
  private combustionGain: GainNode | null = null;
  private distortion: WaveShaperNode | null = null;

  // 2. Intake (The Roar - depends on Load)
  private intakeNode: AudioBufferSourceNode | null = null;
  private intakeFilter: BiquadFilterNode | null = null;
  private intakeGain: GainNode | null = null;

  // 3. Mechanical (The Whine/Click)
  private mechNode: AudioBufferSourceNode | null = null;
  private mechGain: GainNode | null = null;

  // 4. Exhaust (The Pipe Texture)
  private exhaustFilter: BiquadFilterNode | null = null;

  // Buffers
  private whiteNoiseBuffer: AudioBuffer | null = null;
  private pinkNoiseBuffer: AudioBuffer | null = null;

  private isInitialized = false;

  constructor() {
    // Singleton
  }

  public init() {
    if (this.isInitialized) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    // Master Chain
    this.masterGain = this.ctx.createGain();
    this.compressor = this.ctx.createDynamicsCompressor();
    // Heavy compression to glue layers together like a recorded track
    this.compressor.threshold.value = -20;
    this.compressor.knee.value = 10;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.005;
    this.compressor.release.value = 0.1;

    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);
    
    this.masterGain.gain.value = 0; 
    
    this.createBuffers();
    this.isInitialized = true;
  }

  private createBuffers() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    
    // White Noise (Mechanical)
    this.whiteNoiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const whiteData = this.whiteNoiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      whiteData[i] = Math.random() * 2 - 1;
    }

    // Pink Noise (Intake/Exhaust - Deeper)
    this.pinkNoiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const pinkData = this.pinkNoiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168981;
      pinkData[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      pinkData[i] *= 0.11; 
      b6 = white * 0.115926;
    }
  }

  // Create a distortion curve to simulate "Growl" and harmonics
  private makeDistortionCurve(amount: number) {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      let x = i * 2 / n_samples - 1;
      // Soft clipping curve
      curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  public async startEngine(type: EngineType) {
    if (!this.ctx || !this.masterGain) this.init();
    if (this.ctx?.state === 'suspended') await this.ctx.resume();

    this.stopEngine(); // Clear previous

    const now = this.ctx!.currentTime;
    
    // --- 1. COMBUSTION LAYER ---
    this.combustionGain = this.ctx!.createGain();
    this.distortion = this.ctx!.createWaveShaper();
    this.distortion.curve = this.makeDistortionCurve(100); // Amount of grit
    this.distortion.oversample = '4x';

    this.osc1 = this.ctx!.createOscillator();
    this.osc2 = this.ctx!.createOscillator();
    this.subOsc = this.ctx!.createOscillator();

    if (type === EngineType.INLINE_4) {
      // Inline 4: Smooth, screaming harmonics
      this.osc1.type = 'sawtooth';
      this.osc2.type = 'sawtooth';
      this.subOsc.type = 'square'; // Sub-bass
    } else if (type === EngineType.V_TWIN) {
      // V-Twin: Thumping, syncopated
      this.osc1.type = 'sawtooth';
      this.osc2.type = 'square';
      this.subOsc.type = 'sawtooth';
    } else {
      // Single: Punchy
      this.osc1.type = 'square';
      this.osc2.type = 'sawtooth';
      this.subOsc.type = 'triangle';
    }

    this.osc1.connect(this.combustionGain);
    this.osc2.connect(this.combustionGain);
    this.subOsc.connect(this.combustionGain);

    this.exhaustFilter = this.ctx!.createBiquadFilter();
    this.exhaustFilter.type = 'lowpass';
    
    this.combustionGain.connect(this.distortion);
    this.distortion.connect(this.exhaustFilter);
    this.exhaustFilter.connect(this.masterGain!);

    this.osc1.start(now);
    this.osc2.start(now);
    this.subOsc.start(now);

    // --- 2. INTAKE LAYER (Throaty Roar) ---
    this.intakeGain = this.ctx!.createGain();
    this.intakeFilter = this.ctx!.createBiquadFilter();
    this.intakeFilter.type = 'lowpass';
    this.intakeFilter.Q.value = 5; // Resonant intake

    this.intakeNode = this.ctx!.createBufferSource();
    this.intakeNode.buffer = this.pinkNoiseBuffer;
    this.intakeNode.loop = true;
    
    this.intakeNode.connect(this.intakeFilter);
    this.intakeFilter.connect(this.intakeGain);
    this.intakeGain.connect(this.masterGain!);
    
    this.intakeNode.start(now);

    // --- 3. MECHANICAL LAYER (Chain/Valves) ---
    this.mechGain = this.ctx!.createGain();
    const mechFilter = this.ctx!.createBiquadFilter();
    mechFilter.type = 'highpass';
    mechFilter.frequency.value = 2000;

    this.mechNode = this.ctx!.createBufferSource();
    this.mechNode.buffer = this.whiteNoiseBuffer;
    this.mechNode.loop = true;

    this.mechNode.connect(mechFilter);
    mechFilter.connect(this.mechGain);
    this.mechGain.connect(this.masterGain!);

    this.mechNode.start(now);

    // Fade in
    this.masterGain!.gain.setValueAtTime(0, now);
    this.masterGain!.gain.linearRampToValueAtTime(1.0, now + 0.5);
  }

  public stopEngine() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.masterGain?.gain.setTargetAtTime(0, now, 0.2);

    setTimeout(() => {
      this.osc1?.stop(); this.osc1?.disconnect();
      this.osc2?.stop(); this.osc2?.disconnect();
      this.subOsc?.stop(); this.subOsc?.disconnect();
      this.intakeNode?.stop(); this.intakeNode?.disconnect();
      this.mechNode?.stop(); this.mechNode?.disconnect();
    }, 300);
  }

  public updateSound(rpm: number, load: number, bikeType: EngineType, baseFreq: number, exhaust: ExhaustType) {
    if (!this.ctx || !this.osc1 || !this.osc2 || !this.subOsc) return;

    const now = this.ctx.currentTime;
    const rpmFactor = Math.max(0, rpm / 14000); 

    // --- 1. COMBUSTION PITCH & TEXTURE ---
    let freq1 = baseFreq * (1 + rpmFactor * 8); // Fundamental
    
    if (bikeType === EngineType.V_TWIN) {
       // V-Twin Physics: Syncopated beat
       // We detune osc2 heavily to create a "beating" effect
       this.osc1.frequency.setTargetAtTime(freq1, now, 0.05);
       this.osc2.frequency.setTargetAtTime(freq1 * 0.5, now, 0.05); // Sub-octave
       this.subOsc.frequency.setTargetAtTime(freq1 * 0.75, now, 0.05); // The "Lope"
       
       // Thumpy gain
       if (this.combustionGain) this.combustionGain.gain.setTargetAtTime(0.8 + (load * 0.4), now, 0.1);

    } else if (bikeType === EngineType.INLINE_4) {
       // Inline 4: Screaming chords
       this.osc1.frequency.setTargetAtTime(freq1, now, 0.05);
       this.osc2.frequency.setTargetAtTime(freq1 * 2.01, now, 0.05); // Octave + slight detune for chorus
       this.subOsc.frequency.setTargetAtTime(freq1 * 0.5, now, 0.05);
       
       if (this.combustionGain) this.combustionGain.gain.setTargetAtTime(0.6 + (load * 0.2), now, 0.1);

    } else {
       // Single
       this.osc1.frequency.setTargetAtTime(freq1, now, 0.05);
       this.osc2.frequency.setTargetAtTime(freq1 * 0.5, now, 0.05);
       this.subOsc.frequency.setTargetAtTime(freq1 * 0.25, now, 0.05);
    }

    // --- 2. EXHAUST CHARACTERISTICS (Filter) ---
    // Modify the tone based on the pipe
    let exhaustFreq = 2000;
    let exhaustQ = 1;
    let exhaustGain = 1.0;

    switch (exhaust) {
      case ExhaustType.STOCK: exhaustFreq = 600; exhaustQ = 0.5; exhaustGain = 0.8; break;
      case ExhaustType.SLIP_ON: exhaustFreq = 1200; exhaustQ = 1; exhaustGain = 1.0; break;
      case ExhaustType.FULL_RACE: exhaustFreq = 2500; exhaustQ = 2; exhaustGain = 1.2; break;
      case ExhaustType.SC_PROJECT: exhaustFreq = 4000; exhaustQ = 4; exhaustGain = 1.4; break; // Screamer
      case ExhaustType.TITANIUM: exhaustFreq = 3000; exhaustQ = 8; exhaustGain = 1.1; break; // Metallic ring
      case ExhaustType.SHORT_PIPE: exhaustFreq = 800; exhaustQ = 0.5; exhaustGain = 1.5; break; // Loud, unfiltered
    }
    
    if (this.exhaustFilter) {
       // Open the filter as RPM increases (Valves opening)
       this.exhaustFilter.frequency.setTargetAtTime(exhaustFreq + (rpm * 0.5), now, 0.1);
       this.exhaustFilter.Q.value = exhaustQ;
    }

    // --- 3. INTAKE ROAR (The "Bwaaah") ---
    // Heavily dependent on LOAD (Throttle)
    if (this.intakeGain && this.intakeFilter) {
       const intakeVol = load * 0.8; // Only loud when throttle is open
       this.intakeGain.gain.setTargetAtTime(intakeVol, now, 0.1);
       
       // Filter opens with RPM
       this.intakeFilter.frequency.setTargetAtTime(400 + (rpm * 0.8), now, 0.1);
    }

    // --- 4. MECHANICAL WHINE ---
    // Constant background noise that increases pitch with RPM
    if (this.mechGain) {
       this.mechGain.gain.setTargetAtTime(0.1 + (rpmFactor * 0.2), now, 0.1);
    }
    
    // Master Volume Mix
    // SC Project / Short Pipe make the whole bike louder
    if (this.masterGain) {
       this.masterGain.gain.setTargetAtTime(Math.min(1.0, exhaustGain), now, 0.1);
    }
  }

  public triggerBackfire() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    // Gunshot sound
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(10, t + 0.1);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(2.0, t); // Very Loud
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(t);
    osc.stop(t + 0.1);
  }

  public triggerShiftSound() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.08);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }
}

export const audioEngine = new AudioEngine();