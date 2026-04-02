export interface FixedStepLoopOptions {
  stepMs: number;
  maxCatchUpSteps?: number;
  onStep: (stepMs: number) => void;
  onFrame?: (alpha: number) => void;
}

export class FixedStepLoop {
  private readonly stepMs: number;
  private readonly maxCatchUpSteps: number;
  private readonly onStep: (stepMs: number) => void;
  private readonly onFrame?: (alpha: number) => void;

  private animationFrameId: number | null = null;
  private running = false;
  private lastFrameTimeMs = 0;
  private accumulatorMs = 0;

  constructor(options: FixedStepLoopOptions) {
    this.stepMs = options.stepMs;
    this.maxCatchUpSteps = options.maxCatchUpSteps ?? 5;
    this.onStep = options.onStep;
    this.onFrame = options.onFrame;
  }

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.lastFrameTimeMs = performance.now();
    this.accumulatorMs = 0;
    this.animationFrameId = window.requestAnimationFrame(this.tick);
  }

  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  private readonly tick = (timestampMs: number): void => {
    if (!this.running) {
      return;
    }

    const rawDeltaMs = timestampMs - this.lastFrameTimeMs;
    this.lastFrameTimeMs = timestampMs;

    const deltaMs = Math.min(rawDeltaMs, this.stepMs * this.maxCatchUpSteps);
    this.accumulatorMs += deltaMs;

    let catchUpSteps = 0;
    while (
      this.accumulatorMs >= this.stepMs &&
      catchUpSteps < this.maxCatchUpSteps
    ) {
      this.onStep(this.stepMs);
      this.accumulatorMs -= this.stepMs;
      catchUpSteps += 1;
    }

    if (this.onFrame) {
      const alpha = this.accumulatorMs / this.stepMs;
      this.onFrame(alpha);
    }

    this.animationFrameId = window.requestAnimationFrame(this.tick);
  };
}
