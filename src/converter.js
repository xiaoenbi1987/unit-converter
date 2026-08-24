/**
 * Conversion logic for the unit converter.
 *
 * This module is pure: it never touches the DOM, never reads global state and
 * never stores anything. Every export is a plain function of its arguments,
 * which is what makes it testable without a browser (see tests/converter.test.js).
 */

/** 1 kilometer = 0.621371 miles (6 significant digits). */
export const KILOMETERS_TO_MILES_FACTOR = 0.621371;

/** 1 mile = 1.609344 kilometers (exact by international definition). */
export const MILES_TO_KILOMETERS_FACTOR = 1.609344;

/**
 * Canonical direction identifiers.
 *
 * These strings are the single source of truth for "what the user selected".
 * The UI carries them verbatim (as the radio inputs' `value` attribute) into
 * `runConversion`, so the selected direction is never inferred from a boolean,
 * an element index, or visible label text.
 */
export const KILOMETERS_TO_MILES = 'kilometers_to_miles';
export const MILES_TO_KILOMETERS = 'miles_to_kilometers';

const DIRECTIONS = {
  [KILOMETERS_TO_MILES]: {
    factor: KILOMETERS_TO_MILES_FACTOR,
    fromUnit: 'kilometers',
    toUnit: 'miles',
  },
  [MILES_TO_KILOMETERS]: {
    factor: MILES_TO_KILOMETERS_FACTOR,
    fromUnit: 'miles',
    toUnit: 'kilometers',
  },
};

/**
 * Convert a finite number in the given direction.
 *
 * Negative values are allowed on purpose: this is a mathematical unit
 * converter, and conversion is linear scaling, so -5 km = -3.10686 mi.
 *
 * @param {string} direction one of KILOMETERS_TO_MILES / MILES_TO_KILOMETERS
 * @param {number} value a finite number
 * @returns {number} the converted value (may be non-finite on overflow)
 */
export function convert(direction, value) {
  const spec = DIRECTIONS[direction];
  if (!spec) {
    throw new Error(`Unknown conversion direction: ${String(direction)}`);
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`convert expects a finite number, received: ${String(value)}`);
  }
  return value * spec.factor;
}

/**
 * Parse raw user text into a number.
 *
 * Surrounding whitespace is ignored, but the text is never otherwise rewritten:
 * "1,5" is rejected rather than guessed as 1.5.
 *
 * @param {string} raw
 * @returns {{ok: true, value: number} | {ok: false, error: string}}
 */
export function parseInput(raw) {
  const text = String(raw ?? '').trim();
  if (text === '') {
    return { ok: false, error: 'Please enter a number.' };
  }
  const value = Number(text);
  if (!Number.isFinite(value)) {
    return { ok: false, error: 'Please enter a valid number, for example 12.5.' };
  }
  return { ok: true, value };
}

/**
 * Format a converted number for display, using 6 significant digits.
 *
 * Why 6: `1 km = 0.621371 mi` is itself a 6-significant-digit rounding of
 * 0.6213711922..., so printing more digits would advertise accuracy the
 * constant does not have. Fixed decimal places are avoided because they render
 * small results as a misleading "0.0000".
 *
 * @param {number} value a finite number
 * @returns {string}
 */
export function formatResult(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`formatResult expects a finite number, received: ${String(value)}`);
  }
  // Covers both 0 and -0, so the UI never shows "-0".
  if (value === 0) {
    return '0';
  }
  const magnitude = Math.abs(value);
  // Outside this range plain notation is unreadable, so use exponential
  // notation with the same 6 significant digits.
  if (magnitude >= 1e15 || magnitude < 1e-6) {
    return value.toExponential(5);
  }
  // Number() strips the trailing zeros toPrecision leaves behind: 6.213710 -> 6.21371.
  return String(Number(value.toPrecision(6)));
}

/**
 * Validate, convert and format in one call. This is the only function the UI
 * layer needs, which keeps all branching out of the DOM code.
 *
 * @param {string} direction canonical direction identifier
 * @param {string} rawInput the text exactly as typed by the user
 * @returns {{ok: true, direction: string, inputText: string, fromUnit: string,
 *            toUnit: string, result: number, formattedResult: string}
 *          | {ok: false, error: string}}
 */
export function runConversion(direction, rawInput) {
  const spec = DIRECTIONS[direction];
  if (!spec) {
    return { ok: false, error: 'Please select a conversion direction.' };
  }

  const parsed = parseInput(rawInput);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const result = convert(direction, parsed.value);
  if (!Number.isFinite(result)) {
    return { ok: false, error: 'The result is too large to display. Please enter a smaller number.' };
  }

  return {
    ok: true,
    direction,
    inputText: String(rawInput).trim(),
    fromUnit: spec.fromUnit,
    toUnit: spec.toUnit,
    result,
    formattedResult: formatResult(result),
  };
}
