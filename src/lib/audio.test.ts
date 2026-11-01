import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { _resetAudio, playChord, playLoopTone, playTone, TONES } from "./audio";

function fakeAudioContext() {
  const started: number[] = [];
  class Osc {
    type = "";
    frequency = { setValueAtTime: (f: number) => started.push(f) };
    connect() {
      return { connect: () => undefined };
    }
    start() {}
    stop() {}
  }
  class Ctx {
    currentTime = 0;
    state = "running";
    destination = {};
    resume = () => Promise.resolve();
    createOscillator() {
      return new Osc();
    }
    createGain() {
      return {
        gain: {
          setValueAtTime: () => undefined,
          exponentialRampToValueAtTime: () => undefined,
        },
        connect: (d: unknown) => d,
      };
    }
  }
  return { Ctx, started };
}

describe("audio", () => {
  beforeEach(_resetAudio);
  afterEach(() => vi.unstubAllGlobals());

  it("has the four fixed tones", () => {
    expect(TONES).toEqual({ read: 523.25, write: 659.25, explain: 783.99, review: 1046.5 });
  });

  it("is a no-op without Web Audio", () => {
    vi.stubGlobal("AudioContext", undefined);
    expect(playTone(440)).toBe(false);
  });

  it("plays loop tones and the chord through the AudioContext", () => {
    const { Ctx, started } = fakeAudioContext();
    vi.stubGlobal("AudioContext", Ctx);
    expect(playLoopTone("write")).toBe(true);
    expect(started).toEqual([659.25]);
    expect(playChord()).toBe(true);
    expect(started).toEqual([659.25, 523.25, 659.25, 783.99, 1046.5]);
  });
});
