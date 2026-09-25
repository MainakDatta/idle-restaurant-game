import { describe, expect, test } from 'vitest'
import { Big } from './big.ts'
import { formatBig } from './format.ts'

// The same seeded generator as big.test.ts: a failing random test fails the same way every run.
function makeRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32
    return state / 2 ** 32
  }
}

/**
 * A random Big with the given exponent. Half have long mantissas (1.2345678901234567), half
 * have exactly three digits (1.23), the case where rounding mistakes show up.
 */
function randomBig(random: () => number, exponent: number): Big {
  const mantissa =
    random() < 0.5 ? 1 + 9 * random() : (100 + Math.floor(random() * 900)) / 100
  return Big.fromValue(`${mantissa}e${exponent}`)
}

/** Reads a scientific or plain result back as a Big, without floating point: "12.3" → 123e-1. */
function readShown(text: string): Big {
  const [number = '', exponent = '0'] = text.split('e')
  const [whole = '', fraction = ''] = number.split('.')
  return Big.fromValue(`${whole}${fraction}e${Number(exponent) - fraction.length}`)
}

describe('short notation', () => {
  test("D15's own examples", () => {
    expect(formatBig(1230, 'short')).toBe('1.23K')
    expect(formatBig(45.6e6, 'short')).toBe('45.6M')
    expect(formatBig(789e9, 'short')).toBe('789B')
    expect(formatBig(1.23e12, 'short')).toBe('1.23T')
  })

  test.each([
    [1000, '1.00K'],
    [1500, '1.50K'],
    [10_000, '10.0K'],
    [12_345, '12.3K'],
    [100_000, '100K'],
    [123_456, '123K'],
  ])('keeps three digits once a suffix appears: %d is %s', (value, shown) => {
    expect(formatBig(value, 'short')).toBe(shown)
  })

  test('every named suffix, in order', () => {
    const names = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc']
    names.forEach((name, i) => {
      expect(formatBig(Big.fromValue(`1e${3 * (i + 1)}`), 'short')).toBe(`1.00${name}`)
    })
  })

  test('then aa to zz, in alphabetical order', () => {
    const letters = [...'abcdefghijklmnopqrstuvwxyz']
    const codes = letters.flatMap((first) => letters.map((second) => first + second))
    expect(codes).toHaveLength(676)
    // Dc is 1e33, so aa is 1e36 and each code after it is 1000 times bigger.
    codes.forEach((code, i) => {
      expect(formatBig(Big.fromValue(`1e${36 + 3 * i}`), 'short')).toBe(`1.00${code}`)
    })
  })

  test('past zz it switches to scientific', () => {
    expect(formatBig(Big.fromValue('9.999e2063'), 'short')).toBe('999zz')
    expect(formatBig(Big.fromValue('1e2064'), 'short')).toBe('1.00e2064')
  })

  test('shows the same digits as scientific, with the point where the suffix puts it', () => {
    const random = makeRandom(1)
    for (let i = 0; i < 2000; i++) {
      const value = randomBig(random, 3 + Math.floor(random() * 2061))
      const short = formatBig(value, 'short')
      const scientific = formatBig(value, 'scientific')
      expect(short.replace(/\D/g, '')).toBe(scientific.split('e')[0]?.replace('.', ''))
      // 1.23K, 12.3K, 123K: the exponent's remainder after dividing by 3, plus one.
      expect(short.split(/[.A-Za-z]/)[0]).toHaveLength((value.exponent % 3) + 1)
    }
  })
})

describe('scientific notation', () => {
  test.each([
    [1000, '1.00e3'],
    [1500, '1.50e3'],
    [12_345, '1.23e4'],
    [1e300, '1.00e300'],
  ])('keeps three digits: %d is %s', (value, shown) => {
    expect(formatBig(value, 'scientific')).toBe(shown)
  })

  test('works far past the number range', () => {
    expect(formatBig(Big.fromValue('4.5678e999999'), 'scientific')).toBe('4.56e999999')
  })
})

describe('below 1,000', () => {
  test.each([
    [0, '0'],
    [1, '1'],
    [3.5, '3.5'],
    [10.5, '10.5'],
    [12.34, '12.3'],
    [100, '100'],
    [120, '120'],
    [999, '999'],
    [0.5, '0.5'],
    [0.05, '0.05'],
    [0.0123, '0.0123'],
  ])('shows up to three significant digits, without padded zeros: %d is %s', (value, shown) => {
    expect(formatBig(value, 'short')).toBe(shown)
    expect(formatBig(value, 'scientific')).toBe(shown)
  })
})

describe('rounding down', () => {
  test.each([
    [999.99, '999'],
    [999_999, '999K'],
    [1999, '1.99K'],
    [1.999, '1.99'],
    [1.005, '1'],
  ])('never rounds up: %d is %s', (value, shown) => {
    expect(formatBig(value, 'short')).toBe(shown)
  })

  test('cuts digits exactly where floating point math slips', () => {
    // 1.15 * 100 is 114.99999999999999, so rounding down with Math.floor would show 1.14.
    expect(formatBig(1.15, 'short')).toBe('1.15')
    expect(formatBig(1150, 'short')).toBe('1.15K')
    expect(formatBig(1150, 'scientific')).toBe('1.15e3')
  })

  test('the shown number is never more than the value, and less than one step below it', () => {
    const random = makeRandom(2)
    for (let i = 0; i < 3000; i++) {
      // Half near the plain-number range, half anywhere up to 1e3000.
      const exponent = random() < 0.5 ? -4 + Math.floor(random() * 10) : Math.floor(random() * 3000)
      const value = randomBig(random, exponent)
      const shown = readShown(formatBig(value, 'scientific'))
      // One step is 1 in the third digit: 1.23e45 → 1.24e45.
      const nextDigits = Math.round(shown.mantissa * 100) + 1
      const oneStepUp = Big.fromValue(`${nextDigits}e${shown.exponent - 2}`)
      expect(shown.lte(value)).toBe(true)
      expect(value.lt(oneStepUp)).toBe(true)
    }
  })
})

test('takes a Big or a plain number', () => {
  expect(formatBig(Big.fromValue(1500), 'short')).toBe('1.50K')
  expect(formatBig(1500, 'short')).toBe('1.50K')
})
