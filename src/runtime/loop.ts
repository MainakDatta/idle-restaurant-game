// The live loop: once per repaint, it works out how much real time has passed and hands that to
// onFrame (D11). It knows nothing about the game; startGame in game.ts connects the two.

/** What the loop needs from the browser. Tests pass a fake one to control time and frames. */
export type Clock = {
  /** The time now in milliseconds, from the wall clock (like Date.now()). */
  now(): number
  /** Runs `callback` once, before the next repaint. Returns an id for cancelFrame. */
  requestFrame(callback: () => void): number
  /** Cancels a callback that requestFrame scheduled and hasn't run yet. */
  cancelFrame(id: number): void
}

/**
 * The real browser. The arrow functions matter: calling requestAnimationFrame as a method of
 * another object (`clock.requestFrame(…)`) throws "Illegal invocation".
 */
export const browserClock: Clock = {
  // The wall clock, not the timestamp requestAnimationFrame passes in. That one comes from
  // performance.now(), which may stop while the device sleeps. Time away has to keep counting,
  // and with one clock everywhere a gap is never counted twice or missed.
  now: () => Date.now(),
  requestFrame: (callback) => requestAnimationFrame(callback),
  cancelFrame: (id) => cancelAnimationFrame(id),
}

export type Loop = {
  /** Starts calling onFrame once per repaint. Does nothing if the loop is already running. */
  start(): void
  /** Stops the loop by cancelling its next frame. Does nothing if it isn't running. */
  stop(): void
}

/**
 * A loop that calls `onFrame(seconds)` once per repaint, with the real time since the previous
 * frame. Browsers pause repaints while the tab is hidden, so the first frame back carries the
 * whole time away: that's catch-up, through the same code as live play.
 */
export function createLoop(onFrame: (seconds: number) => void, clock: Clock = browserClock): Loop {
  let nextFrame: number | undefined // the id of the frame waiting to run, while the loop runs
  let lastTime = 0 // when the previous frame ran, in milliseconds

  function frame(): void {
    const now = clock.now()
    // A clock set backward counts as no time passing, and counting carries on from the new
    // time, so nothing is lost and the game doesn't freeze waiting for the clock to catch up
    // (D11). There's no upper limit: a long gap is time away, and all of it counts (D14).
    const seconds = Math.max(0, now - lastTime) / 1000
    lastTime = now
    // Asking for the next frame first means a stop() inside onFrame cancels it.
    nextFrame = clock.requestFrame(frame)
    onFrame(seconds)
  }

  return {
    start() {
      if (nextFrame !== undefined) return // only one loop, however often start is called
      lastTime = clock.now()
      nextFrame = clock.requestFrame(frame)
    },
    stop() {
      if (nextFrame === undefined) return
      clock.cancelFrame(nextFrame)
      nextFrame = undefined
    },
  }
}
