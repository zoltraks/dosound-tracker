export interface WorkletChannelParams {
  frequency: number;
  volume: number; // Linear gain 0..1
  toneActive: boolean;
  noiseActive: boolean;
}

export class YM2149WorkletController {
  private audioContext: AudioContext;
  private node: AudioWorkletNode | null = null;
  private ready: Promise<void>;
  private isReady: boolean = false;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.ready = this.init();
  }

  private async init(): Promise<void> {
    try {
      await this.audioContext.audioWorklet.addModule(
        new URL('./ym2149-worklet-processor.ts', import.meta.url)
      );

      const node = new AudioWorkletNode(this.audioContext, 'ym2149-processor', {
        outputChannelCount: [1]
      });

      node.connect(this.audioContext.destination);
      this.node = node;
      this.isReady = true;
    } catch (error) {
      console.error('Failed to initialize YM2149 AudioWorklet:', error);
    }
  }

  /**
   * Returns a promise that resolves once the underlying AudioWorklet has been
   * successfully loaded and the AudioWorkletNode has been created.
   */
  waitUntilReady(): Promise<void> {
    return this.ready;
  }

  get readyState(): boolean {
    return this.isReady && !!this.node;
  }

  setChannelParams(channel: number, params: WorkletChannelParams): void {
    if (!this.node || !this.isReady) {
      return;
    }

    if (channel < 0 || channel > 2) {
      return;
    }

    this.node.port.postMessage({
      type: 'setChannelParams',
      channel,
      frequency: params.frequency,
      volume: params.volume,
      toneActive: params.toneActive,
      noiseActive: params.noiseActive
    });
  }

  setNoiseFrequency(frequency: number): void {
    if (!this.node || !this.isReady) {
      return;
    }

    this.node.port.postMessage({
      type: 'setNoiseFrequency',
      frequency
    });
  }

  silenceAll(): void {
    if (!this.node || !this.isReady) {
      return;
    }

    this.node.port.postMessage({ type: 'silenceAll' });
  }

  dispose(): void {
    if (this.node) {
      try {
        this.node.port.postMessage({ type: 'silenceAll' });
      } catch {
        // ignore
      }
      this.node.disconnect();
      this.node = null;
    }
  }
}
