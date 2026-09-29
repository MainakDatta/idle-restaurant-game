import { describe, expect, test } from 'vitest'
import { createLoop } from './loop.ts'
import { makeFakeClock } from './test-utils.ts'

/** A loop on a fake clock that records the seconds each frame was handed. */
function makeLoop() {
  const fake = makeFakeClock()
  const frames: number[] = []
  const loop = createLoop((seconds) => frames.push(seconds), fake.clock)
  return { fake, frames, loop }
}

describe('createLoop', () => {
  test('hands each frame the real time since the previous one, in seconds', () => {
    const { fake, frames, loop } = makeLoop()
    loop.start()
    fake.frameAfter(16)
    fake.frameAfter(17)
    fake.frameAfter(50) // a slow frame counts for more
    expect(frames).toEqual([0.016, 0.017, 0.05])
  })

  test('the first frame counts from start(), not from when the loop was made', () => {
    const { fake, frames, loop } = makeLoop()
    fake.frameAfter(5000) // nothing is running yet, so this only moves time
    loop.start()
    fake.frameAfter(16)
    expect(frames).toEqual([0.016])
  })

  test('a long gap counts in full: the first frame back from a hidden tab catches up (D14)', () => {
    const { fake, frames, loop } = makeLoop()
    loop.start()
    fake.frameAfter(16)
    fake.frameAfter(10 * 60 * 1000) // 10 minutes in another tab
    fake.frameAfter(16)
    expect(frames).toEqual([0.016, 600, 0.016])
  })

  test('a clock set backward counts as no time, and counting resumes from there (D11)', () => {
    const { fake, frames, loop } = makeLoop()
    loop.start()
    fake.frameAfter(16)
    fake.frameAfter(-60 * 60 * 1000) // the clock jumps back an hour
    fake.frameAfter(16)
    expect(frames).toEqual([0.016, 0, 0.016])
  })

  test('starting twice still runs one loop', () => {
    const { fake, frames, loop } = makeLoop()
    loop.start()
    loop.start()
    expect(fake.waitingFrames()).toBe(1)
    fake.frameAfter(16)
    expect(frames).toEqual([0.016])
  })

  test("start, stop, start (StrictMode's double effect) leaves one loop", () => {
    const { fake, frames, loop } = makeLoop()
    loop.start()
    loop.stop()
    loop.start()
    expect(fake.waitingFrames()).toBe(1)
    fake.frameAfter(16)
    expect(frames).toEqual([0.016])
  })

  test('after stop, no more frames run', () => {
    const { fake, frames, loop } = makeLoop()
    loop.start()
    fake.frameAfter(16)
    loop.stop()
    fake.frameAfter(16)
    fake.frameAfter(16)
    expect(frames).toEqual([0.016])
    expect(fake.waitingFrames()).toBe(0)
  })

  test('stop can be called from inside a frame', () => {
    const fake = makeFakeClock()
    let calls = 0
    const loop = createLoop(() => {
      calls++
      loop.stop()
    }, fake.clock)
    loop.start()
    fake.frameAfter(16)
    fake.frameAfter(16)
    expect(calls).toBe(1)
  })
})
