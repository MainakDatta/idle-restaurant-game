// Big: a game quantity that can grow far past JavaScript's number limit (~1.8e308).
//
// A Big is stored as mantissa × 10^exponent: 1.5e300 is { mantissa: 1.5, exponent: 300 }.
// Method names match break_infinity.js so it could stand in if we ever need it (D6).
// Anything that goes wrong throws a BigError at the line that caused it, instead of
// quietly turning into 0, NaN or Infinity (D6, D24).

/** What Big's methods accept: another Big or a plain number (D5). */
export type BigSource = Big | number

export class BigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BigError'
  }
}

// Strings a Big can be read from: "1500", "1.5", "1.5e300", "2e-3" or "1.5e+300".
// Deliberately strict: no commas, spaces, signs in front, or "NaN"/"Infinity".
const NUMBER_TEXT = /^(\d+(?:\.\d+)?)(?:e([+-]?\d+))?$/

// A double holds about 16 significant digits. Adding something more than 16 powers of ten
// smaller can't change the larger number, so add and sub skip the work.
const MAX_DIGIT_GAP = 16

export class Big {
  /** 1 ≤ mantissa < 10, or 0 when the Big is zero. */
  readonly mantissa: number
  /** A whole number. The value is mantissa × 10^exponent. */
  readonly exponent: number

  static readonly ZERO: Big = new Big(0, 0)
  static readonly ONE: Big = new Big(1, 0)

  // Private, so every Big comes from fromValue or the math below. Both normalize first, and
  // the checks here catch any bug in this file that slips an invalid pair through.
  private constructor(mantissa: number, exponent: number) {
    if (!Number.isSafeInteger(exponent)) {
      throw new BigError(`Big: number out of range (exponent ${exponent})`)
    }
    const isZero = mantissa === 0 && exponent === 0
    const isNormalized = mantissa >= 1 && mantissa < 10
    if (!isZero && !isNormalized) {
      throw new BigError(`Big: internal error, ${mantissa}e${exponent} is not normalized`)
    }
    this.mantissa = mantissa
    this.exponent = exponent
    // `readonly` only exists while TypeScript checks the code. Freezing makes an assignment
    // like `PRICE.mantissa = 9` throw while the game runs, too (modules run in strict mode).
    Object.freeze(this)
  }

  /** The only way to make a Big. Throws on anything that isn't a valid, non-negative value. */
  static fromValue(value: Big | number | string): Big {
    if (value instanceof Big) return value // Bigs never change, so sharing one is safe
    if (typeof value === 'number') return Big.fromNumber(value, 'fromValue')
    if (typeof value === 'string') return Big.fromString(value)
    throw new BigError(`Big.fromValue: expected a number or a string, got ${describe(value)}`)
  }

  add(other: BigSource): Big {
    const b = Big.toBig(other, 'add')
    if (b.mantissa === 0) return this
    if (this.mantissa === 0) return b
    const [larger, smaller] = this.exponent >= b.exponent ? [this, b] : [b, this]
    const gap = larger.exponent - smaller.exponent
    if (gap > MAX_DIGIT_GAP) return larger
    // Line the smaller number up with the larger one's exponent, then add the mantissas.
    return Big.normalize(larger.mantissa + smaller.mantissa / 10 ** gap, larger.exponent)
  }

  /** Throws if the result would be negative: no game quantity ever is (D6). */
  sub(other: BigSource): Big {
    const b = Big.toBig(other, 'sub')
    // Using cmp here means `if (a.gte(b)) a.sub(b)` can never throw.
    const order = this.cmp(b)
    if (order < 0) throw new BigError(`Big.sub: result would be negative (${this} − ${b})`)
    if (order === 0) return Big.ZERO
    if (b.mantissa === 0) return this
    const gap = this.exponent - b.exponent
    if (gap > MAX_DIGIT_GAP) return this
    return Big.normalize(this.mantissa - b.mantissa / 10 ** gap, this.exponent)
  }

  mul(other: BigSource): Big {
    const b = Big.toBig(other, 'mul')
    if (this.mantissa === 0 || b.mantissa === 0) return Big.ZERO
    // (m1 × 10^e1) × (m2 × 10^e2) = (m1 × m2) × 10^(e1 + e2)
    return Big.normalize(this.mantissa * b.mantissa, this.exponent + b.exponent)
  }

  div(other: BigSource): Big {
    const b = Big.toBig(other, 'div')
    if (b.mantissa === 0) throw new BigError(`Big.div: can't divide by zero (${this} ÷ 0)`)
    if (this.mantissa === 0) return Big.ZERO
    return Big.normalize(this.mantissa / b.mantissa, this.exponent - b.exponent)
  }

  /** Raises this to a plain-number power, e.g. a cost growing by 1.26 per level. */
  pow(power: number): Big {
    if (!Number.isFinite(power)) {
      throw new BigError(`Big.pow: power must be a finite number, got ${describe(power)}`)
    }
    if (this.mantissa === 0) {
      if (power < 0) throw new BigError(`Big.pow: can't raise 0 to a negative power (${power})`)
      return power === 0 ? Big.ONE : Big.ZERO
    }
    // Work with powers of ten, so the result can be far too big for a number:
    // value^power = 10^(power × log10(value)). The whole part of that exponent becomes the
    // Big's exponent, and the fraction left over becomes its mantissa.
    const log = power * (Math.log10(this.mantissa) + this.exponent)
    const exponent = Math.floor(log)
    return Big.normalize(10 ** (log - exponent), exponent)
  }

  /** -1 if this is smaller, 0 if equal, 1 if larger. */
  cmp(other: BigSource): -1 | 0 | 1 {
    const b = Big.toBig(other, 'cmp')
    // Zero's exponent is 0 by convention, so zero is compared by mantissa alone.
    // Otherwise 0.001 (exponent -3) would count as smaller than 0 (exponent 0).
    if (this.mantissa === 0 || b.mantissa === 0) return compareNumbers(this.mantissa, b.mantissa)
    if (this.exponent !== b.exponent) return compareNumbers(this.exponent, b.exponent)
    return compareNumbers(this.mantissa, b.mantissa)
  }

  // Each converts its own argument, so an error names eq or gt rather than cmp.
  eq(other: BigSource): boolean {
    return this.cmp(Big.toBig(other, 'eq')) === 0
  }

  gt(other: BigSource): boolean {
    return this.cmp(Big.toBig(other, 'gt')) > 0
  }

  gte(other: BigSource): boolean {
    return this.cmp(Big.toBig(other, 'gte')) >= 0
  }

  lt(other: BigSource): boolean {
    return this.cmp(Big.toBig(other, 'lt')) < 0
  }

  lte(other: BigSource): boolean {
    return this.cmp(Big.toBig(other, 'lte')) <= 0
  }

  max(other: BigSource): Big {
    const b = Big.toBig(other, 'max')
    return this.cmp(b) >= 0 ? this : b
  }

  min(other: BigSource): Big {
    const b = Big.toBig(other, 'min')
    return this.cmp(b) <= 0 ? this : b
  }

  /** For small values such as percentages. Throws if the value is too big for a number. */
  toNumber(): number {
    // Reading our own "1.1e-1" back as text is exact: JavaScript turns decimal text into the
    // closest number. Arithmetic isn't: 1.1 × 0.1 and 1.1 ÷ 10 both give 0.11000000000000001.
    const value = Number(this.toString())
    if (!Number.isFinite(value)) {
      throw new BigError(`Big.toNumber: ${this} is too big for a JavaScript number`)
    }
    return value
  }

  /**
   * "1.5e300": the save format (D10, D24), also used in error messages. Players see
   * formatted numbers instead (D15). String(mantissa) is the shortest text that reads back
   * as exactly the same number, so saving and loading never changes a value.
   */
  toString(): string {
    return `${this.mantissa}e${this.exponent}`
  }

  /** Lets JSON.stringify write a Big as its string, with no extra code in the save system. */
  toJSON(): string {
    return this.toString()
  }

  /**
   * JavaScript calls valueOf for <, >, + and -. Without this, `a < b` would compare the
   * strings ("1.5e3" < "2e2" is true, so 1500 < 200 would be true), and TypeScript allows
   * `<` between objects. Throwing makes that mistake loud.
   */
  valueOf(): never {
    throw new BigError(
      'Big: operators like <, >, + and - don\'t work on Bigs. Use a.lt(b), a.add(b) and so on.',
    )
  }

  private static fromNumber(value: number, operation: string): Big {
    if (!Number.isFinite(value)) {
      throw new BigError(`Big.${operation}: expected a finite number, got ${value}`)
    }
    if (value < 0) {
      throw new BigError(`Big.${operation}: game quantities are never negative, got ${value}`)
    }
    // toExponential() writes the number as "1.5e+300", which splits it into mantissa and
    // exponent exactly, even for numbers too small for arithmetic to scale safely.
    return Big.fromString(value.toExponential())
  }

  private static fromString(text: string): Big {
    const match = NUMBER_TEXT.exec(text)
    if (!match) {
      throw new BigError(
        `Big.fromValue: can't read ${JSON.stringify(text)}, expected text like "1500", "1.5" or "1.5e300"`,
      )
    }
    const coefficient = Number(match[1])
    if (!Number.isFinite(coefficient)) {
      throw new BigError(`Big.fromValue: too many digits in ${JSON.stringify(text)}`)
    }
    const exponent = match[2] === undefined ? 0 : Number(match[2])
    return Big.normalize(coefficient, exponent)
  }

  /** Turns the argument of a method into a Big, naming the method if it's invalid. */
  private static toBig(value: BigSource, operation: string): Big {
    if (value instanceof Big) return value
    if (typeof value === 'number') return Big.fromNumber(value, operation)
    // Strings are read once, where saves and data files load, never mid-calculation (D24).
    throw new BigError(`Big.${operation}: expected a Big or a number, got ${describe(value)}`)
  }

  /** Shifts any non-negative mantissa into the range 1 ≤ m < 10, adjusting the exponent. */
  private static normalize(mantissa: number, exponent: number): Big {
    if (mantissa === 0) return Big.ZERO
    const shift = Math.floor(Math.log10(mantissa))
    let m = shift >= 0 ? mantissa / 10 ** shift : mantissa * 10 ** -shift
    let e = exponent + shift
    // Math.log10 can be off by one right next to a power of ten, so nudge once if needed.
    if (m >= 10) {
      m /= 10
      e += 1
    } else if (m < 1) {
      m *= 10
      e -= 1
    }
    return new Big(m, e)
  }
}

function compareNumbers(a: number, b: number): -1 | 0 | 1 {
  if (a === b) return 0
  return a > b ? 1 : -1
}

/** Readable text for any value in an error message, including undefined and objects. */
function describe(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'object' && value !== null) return 'an object'
  return String(value)
}
