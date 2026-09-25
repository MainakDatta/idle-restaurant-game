// How numbers look to players (D15): three significant digits with a short suffix (1.23K), or
// scientific notation (1.23e45) as a setting. Always rounded down, so the screen never shows
// more money than you have.

import { Big, type BigSource } from './big.ts'

/** The player's number setting (D15). */
export type Notation = 'short' | 'scientific'

// Suffix n stands for 1000^n: K is 1, M is 2, … Dc is 11. After Dc come two-letter codes,
// aa (1000^12) through zz (1000^687).
const NAMED_SUFFIXES = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc']
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'

/** Shows a game quantity to the player: `formatBig(1500, 'short')` is "1.50K". */
export function formatBig(value: BigSource, notation: Notation): string {
  const big = Big.fromValue(value)
  const digits = firstThreeDigits(big.mantissa)
  // Below 1,000 both settings show the plain number, without padded zeros: 3.5, 12.3, 999.
  if (big.exponent < 3) return trimZeros(placePoint(digits, big.exponent))
  const suffix = notation === 'short' ? suffixFor(Math.floor(big.exponent / 3)) : undefined
  // Scientific keeps its zeros too (1.00e3), and takes over in short mode past zz.
  if (suffix === undefined) return `${digits[0]}.${digits.slice(1)}e${big.exponent}`
  // The suffix covers the exponent down to a multiple of 3, and what's left places the point:
  // 1.23e3 is 1.23K, 1.23e4 is 12.3K, 1.23e5 is 123K.
  return placePoint(digits, big.exponent % 3) + suffix
}

/**
 * The mantissa's first three digits, cut from its text: 1.2345 gives "123" and 5 gives "500".
 * Cutting the text rounds down exactly. Math.floor(1.15 * 100) would give 114, because
 * 1.15 * 100 is 114.99999999999999 in floating point.
 */
function firstThreeDigits(mantissa: number): string {
  return String(mantissa).replace('.', '').slice(0, 3).padEnd(3, '0')
}

/** Writes three digits as a number with an exponent of at most 2: "123" and -2 give "0.0123". */
function placePoint(digits: string, exponent: number): string {
  if (exponent < 0) return `0.${'0'.repeat(-exponent - 1)}${digits}`
  const whole = exponent + 1
  return whole === 3 ? digits : `${digits.slice(0, whole)}.${digits.slice(whole)}`
}

/** Drops zeros after the decimal point: "1.50" gives "1.5", "3.00" gives "3", "100" stays. */
function trimZeros(text: string): string {
  return text.includes('.') ? text.replace(/\.?0+$/, '') : text
}

/** The suffix for 1000^group, or undefined past zz. */
function suffixFor(group: number): string | undefined {
  if (group <= NAMED_SUFFIXES.length) return NAMED_SUFFIXES[group - 1]
  const code = group - NAMED_SUFFIXES.length - 1 // aa is 0, ab is 1, … zz is 675
  if (code >= LETTERS.length ** 2) return undefined
  return LETTERS[Math.floor(code / LETTERS.length)] + LETTERS[code % LETTERS.length]
}
