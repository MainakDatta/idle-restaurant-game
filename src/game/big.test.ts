import { describe, expect, test } from 'vitest'
import { Big, BigError } from './big.ts'

// A tiny seeded random generator (a linear congruential generator). The same seed always
// gives the same sequence, so a failing random test fails the same way every run.
function makeRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32
    return state / 2 ** 32
  }
}

/** A random number between 1 × 10^minExponent and 10 × 10^maxExponent. */
function randomValue(random: () => number, minExponent: number, maxExponent: number): number {
  const exponent = minExponent + Math.floor(random() * (maxExponent - minExponent + 1))
  return (1 + 9 * random()) * 10 ** exponent
}

// Big keeps about 15–16 significant digits, like a number, so results can differ from
// native math in the last digit. `scale` is what the error is measured against: usually the
// expected value, but the inputs for subtraction, which can cancel most of the digits.
function expectClose(actual: number, expected: number, scale = expected): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1e-12 * Math.abs(scale))
}

/** For values past the number range: close if their ratio is close to 1. */
function expectBigClose(actual: Big, expected: Big): void {
  expectClose(actual.div(expected).toNumber(), 1)
}

describe('creating a Big', () => {
  test('from numbers', () => {
    expect(Big.fromValue(1500)).toMatchObject({ mantissa: 1.5, exponent: 3 })
    expect(Big.fromValue(0.001)).toMatchObject({ mantissa: 1, exponent: -3 })
    expect(Big.fromValue(0)).toBe(Big.ZERO)
    expect(Big.fromValue(-0)).toBe(Big.ZERO)
  })

  test('from strings', () => {
    expect(Big.fromValue('1500')).toMatchObject({ mantissa: 1.5, exponent: 3 })
    expect(Big.fromValue('1.5e300')).toMatchObject({ mantissa: 1.5, exponent: 300 })
    expect(Big.fromValue('15e2')).toMatchObject({ mantissa: 1.5, exponent: 3 })
    expect(Big.fromValue('2e-3')).toMatchObject({ mantissa: 2, exponent: -3 })
    expect(Big.fromValue('1e+6')).toMatchObject({ mantissa: 1, exponent: 6 })
    expect(Big.fromValue('0')).toBe(Big.ZERO)
  })

  test('from a Big returns the same Big', () => {
    const price = Big.fromValue(10)
    expect(Big.fromValue(price)).toBe(price)
  })

  // Every bad input from D6's break_infinity.js table throws instead of turning into 0 or 1.
  test.each([
    ['text', 'abc'],
    ['a comma', '1,000'],
    ['spaces', ' 12'],
    ['an empty string', ''],
    ['a minus sign', '-5'],
    ['no leading digit', '.5'],
    ['a missing exponent', '1e'],
    ['"NaN"', 'NaN'],
    ['"Infinity"', 'Infinity'],
    ['hex', '0x10'],
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['a negative number', -5],
    ['undefined', undefined],
    ['null', null],
    ['an object', {}],
  ])('rejects %s', (_label, input) => {
    expect(() => Big.fromValue(input as never)).toThrow(BigError)
  })

  test('rejects an exponent out of range', () => {
    expect(() => Big.fromValue('1e99999999999999999')).toThrow(/out of range/)
  })
})

describe('mistakes fail loudly', () => {
  test('a Big cannot be changed after it is made', () => {
    const price = Big.fromValue(100)
    // @ts-expect-error: mantissa is readonly. This checks it is enforced at runtime too.
    expect(() => (price.mantissa = 9)).toThrow(TypeError)
    expect(price.toNumber()).toBe(100)
  })

  test('comparing with < throws instead of comparing text', () => {
    const a = Big.fromValue(1500)
    const b = Big.fromValue(200)
    expect(() => a < b).toThrow(BigError)
  })

  test('errors name the operation that failed', () => {
    const price = Big.fromValue(10)
    expect(() => price.mul(NaN)).toThrow('Big.mul')
    expect(() => price.add(-1)).toThrow('Big.add')
    expect(() => price.div(0)).toThrow('Big.div')
    expect(() => price.mul('2' as never)).toThrow('Big.mul')
  })

  test('sub throws when the result would be negative', () => {
    expect(() => Big.fromValue(1500).sub(2000)).toThrow(/result would be negative/)
  })

  test('0 to a negative power, and non-finite powers, throw', () => {
    expect(() => Big.ZERO.pow(-1)).toThrow(BigError)
    expect(() => Big.fromValue(2).pow(NaN)).toThrow(BigError)
    expect(() => Big.fromValue(2).pow(Infinity)).toThrow(BigError)
  })

  test('toNumber throws when the value is too big for a number', () => {
    expect(Big.fromValue('1.7e308').toNumber()).toBe(1.7e308)
    expect(() => Big.fromValue('1e400').toNumber()).toThrow(/too big/)
  })
})

// D6: tested against native number wherever both are valid (below ~1e300).
describe('matches native number math', () => {
  const random = makeRandom(42)
  const CASES = 2000

  test('add', () => {
    for (let i = 0; i < CASES; i++) {
      const a = randomValue(random, -20, 299)
      const b = randomValue(random, -20, 299)
      expectClose(Big.fromValue(a).add(b).toNumber(), a + b)
    }
  })

  test('sub', () => {
    for (let i = 0; i < CASES; i++) {
      const x = randomValue(random, -20, 299)
      const y = randomValue(random, -20, 299)
      const [a, b] = x >= y ? [x, y] : [y, x]
      expectClose(Big.fromValue(a).sub(b).toNumber(), a - b, a)
    }
  })

  test('mul', () => {
    for (let i = 0; i < CASES; i++) {
      const a = randomValue(random, -100, 140)
      const b = randomValue(random, -100, 140)
      expectClose(Big.fromValue(a).mul(b).toNumber(), a * b)
    }
  })

  test('div', () => {
    for (let i = 0; i < CASES; i++) {
      const a = randomValue(random, -100, 140)
      const b = randomValue(random, -100, 140)
      expectClose(Big.fromValue(a).div(b).toNumber(), a / b)
    }
  })

  test('pow, with whole and fractional powers', () => {
    for (let i = 0; i < CASES; i++) {
      const base = randomValue(random, -1, 1) // 0.1 to 100
      const power = i % 2 === 0 ? Math.round(random() * 80 - 40) : random() * 10 - 5
      expectClose(Big.fromValue(base).pow(power).toNumber(), base ** power)
    }
  })

  test('everyday decimals come back from toNumber unchanged', () => {
    // Prices like 0.3 or 12.75 must not come back as 0.30000000000000004.
    for (let cents = 1; cents <= 100_000; cents++) {
      const value = cents / 100
      expect(Big.fromValue(value).toNumber()).toBe(value)
    }
  })

  test('numbers with up to 15 significant digits come back unchanged', () => {
    // A full 17-digit number can come back off in its last digit (D24), like break_infinity.
    for (let i = 0; i < CASES; i++) {
      const value = Number(randomValue(random, -300, 300).toPrecision(15))
      expect(Big.fromValue(value).toNumber()).toBe(value)
    }
  })

  test('comparisons', () => {
    for (let i = 0; i < CASES; i++) {
      const a = randomValue(random, -20, 299)
      // Every tenth pair is equal, to exercise eq as well.
      const b = i % 10 === 0 ? a : randomValue(random, -20, 299)
      const expected = a === b ? 0 : a > b ? 1 : -1
      expect(Big.fromValue(a).cmp(b)).toBe(expected)
    }
  })
})

describe('past the number range', () => {
  const random = makeRandom(7)

  test('multiplying huge numbers', () => {
    const a = Big.fromValue('1e400')
    expect(a.mul(a).toString()).toBe('1e800')
    expect(Big.fromValue(10).pow(1000).toString()).toBe('1e1000')
  })

  test('multiplying then dividing gets back where it started', () => {
    for (let i = 0; i < 500; i++) {
      const a = Big.fromValue(randomValue(random, 0, 300)).pow(1 + random() * 20)
      const b = Big.fromValue(randomValue(random, 0, 300)).pow(1 + random() * 20)
      expectBigClose(a.mul(b).div(b), a)
    }
  })

  test('pow agrees with repeated multiplication', () => {
    // A cost growing 26% per level (the coffee shop's placeholder rate), 3,000 levels in.
    const growth = Big.fromValue(1.26)
    let repeated = Big.ONE
    for (let level = 0; level < 3000; level++) repeated = repeated.mul(growth)
    expectBigClose(growth.pow(3000), repeated)
    expect(repeated.exponent).toBe(301)
  })

  test('adding something far smaller changes nothing', () => {
    const huge = Big.fromValue('1e300')
    expect(huge.add(1)).toBe(huge)
    expect(huge.sub(1)).toBe(huge)
  })

  test('comparisons across huge exponents', () => {
    expect(Big.fromValue('1e1000').gt(Big.fromValue('9.99e999'))).toBe(true)
    expect(Big.fromValue('1e-300').gt(0)).toBe(true)
    expect(Big.fromValue(0.001).gt(Big.ZERO)).toBe(true)
    expect(Big.ZERO.lt(0.001)).toBe(true)
  })
})

describe('everyday use', () => {
  const random = makeRandom(1234)

  test('checking gte before sub never throws', () => {
    for (let i = 0; i < 5000; i++) {
      // Close pairs, including ones built by different calculations, are the risky ones.
      const cost = Big.fromValue(randomValue(random, 0, 12))
      const money = i % 2 === 0 ? cost.mul(1 + (random() - 0.5) * 1e-14) : cost.div(3).mul(3)
      if (money.gte(cost)) expect(() => money.sub(cost)).not.toThrow()
    }
  })

  test('a number minus itself is exactly zero', () => {
    const money = Big.fromValue(1234.5678)
    expect(money.sub(money)).toBe(Big.ZERO)
  })

  test('max and min', () => {
    const demand = Big.fromValue(24)
    const service = Big.fromValue(36)
    expect(demand.min(service)).toBe(demand)
    expect(demand.max(service)).toBe(service)
    expect(demand.min(24)).toBe(demand)
  })
})

describe('saving', () => {
  const random = makeRandom(99)

  test('the string format', () => {
    expect(Big.fromValue('1.5e300').toString()).toBe('1.5e300')
    expect(Big.fromValue(150).toString()).toBe('1.5e2')
    expect(Big.fromValue(0.001).toString()).toBe('1e-3')
    expect(Big.ZERO.toString()).toBe('0e0')
  })

  test('JSON.stringify writes Bigs as strings', () => {
    const state = { money: Big.fromValue('1.5e300'), level: 3 }
    expect(JSON.stringify(state)).toBe('{"money":"1.5e300","level":3}')
  })

  test('saving and loading gives back exactly the same value', () => {
    for (let i = 0; i < 2000; i++) {
      // Results of arithmetic have long mantissas, the hardest case for an exact round trip.
      const value = Big.fromValue(randomValue(random, -50, 300))
        .mul(randomValue(random, -50, 300))
        .div(3)
      const loaded = Big.fromValue(value.toString())
      expect(loaded.mantissa).toBe(value.mantissa)
      expect(loaded.exponent).toBe(value.exponent)
    }
  })
})
