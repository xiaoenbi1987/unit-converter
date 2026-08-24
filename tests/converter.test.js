/**
 * Tests for the pure conversion logic. No DOM and no browser required:
 * `npm test` (or `node --test tests/`) runs these with Node's built-in runner.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  KILOMETERS_TO_MILES,
  MILES_TO_KILOMETERS,
  convert,
  formatResult,
  parseInput,
  runConversion,
} from '../src/converter.js';

test('zero converts to zero in both directions', () => {
  assert.equal(convert(KILOMETERS_TO_MILES, 0), 0);
  assert.equal(convert(MILES_TO_KILOMETERS, 0), 0);
  assert.equal(runConversion(KILOMETERS_TO_MILES, '0').formattedResult, '0');
  assert.equal(runConversion(MILES_TO_KILOMETERS, '0').formattedResult, '0');
});

test('positive integers convert correctly in both directions', () => {
  assert.equal(runConversion(KILOMETERS_TO_MILES, '10').formattedResult, '6.21371');
  // 10 * 1.609344 = 16.09344, shown at 6 significant digits.
  assert.equal(runConversion(MILES_TO_KILOMETERS, '10').formattedResult, '16.0934');
  assert.equal(runConversion(KILOMETERS_TO_MILES, '1').formattedResult, '0.621371');
  assert.equal(runConversion(MILES_TO_KILOMETERS, '1').formattedResult, '1.60934');
});

test('positive decimals convert correctly', () => {
  assert.equal(runConversion(KILOMETERS_TO_MILES, '2.5').formattedResult, '1.55343');
  assert.equal(runConversion(MILES_TO_KILOMETERS, '2.5').formattedResult, '4.02336');
  assert.equal(runConversion(KILOMETERS_TO_MILES, '12.3456789').formattedResult, '7.67125');
});

test('negative values are allowed and keep their sign', () => {
  assert.equal(runConversion(KILOMETERS_TO_MILES, '-5').formattedResult, '-3.10685');
  assert.equal(runConversion(MILES_TO_KILOMETERS, '-5').formattedResult, '-8.04672');
  assert.equal(runConversion(KILOMETERS_TO_MILES, '-0.001').formattedResult, '-0.000621371');
});

test('very large values convert, and overflow is reported instead of Infinity', () => {
  assert.equal(runConversion(KILOMETERS_TO_MILES, '1000000').formattedResult, '621371');
  assert.equal(runConversion(KILOMETERS_TO_MILES, '1e20').formattedResult, '6.21371e+19');

  const overflow = runConversion(MILES_TO_KILOMETERS, '1.5e308');
  assert.equal(overflow.ok, false);
  assert.match(overflow.error, /too large/i);
});

test('very small decimals never collapse to a misleading zero', () => {
  assert.equal(runConversion(KILOMETERS_TO_MILES, '0.0000001').formattedResult, '6.21371e-8');
  assert.equal(runConversion(MILES_TO_KILOMETERS, '1e-9').formattedResult, '1.60934e-9');
});

test('blank input is rejected with a clear message', () => {
  for (const blank of ['', '   ', '\t']) {
    const outcome = runConversion(KILOMETERS_TO_MILES, blank);
    assert.equal(outcome.ok, false);
    assert.equal(outcome.error, 'Please enter a number.');
  }
});

test('non-numeric input is rejected and never guessed', () => {
  for (const bad of ['abc', '10abc', '1,5', '--3', '1.2.3', 'Infinity']) {
    const outcome = runConversion(KILOMETERS_TO_MILES, bad);
    assert.equal(outcome.ok, false, `expected "${bad}" to be rejected`);
    assert.match(outcome.error, /valid number/i);
  }
});

test('surrounding whitespace is ignored but the input is not otherwise rewritten', () => {
  const outcome = runConversion(KILOMETERS_TO_MILES, '  5  ');
  assert.equal(outcome.ok, true);
  assert.equal(outcome.inputText, '5');
  assert.equal(outcome.formattedResult, '3.10685');
});

test('an unknown or missing direction is rejected', () => {
  for (const direction of [null, undefined, '', 'km_to_mi']) {
    const outcome = runConversion(direction, '10');
    assert.equal(outcome.ok, false);
    assert.equal(outcome.error, 'Please select a conversion direction.');
  }
});

test('each direction reports its own units and echoes the canonical identifier', () => {
  const forward = runConversion(KILOMETERS_TO_MILES, '3');
  assert.equal(forward.direction, 'kilometers_to_miles');
  assert.equal(forward.fromUnit, 'kilometers');
  assert.equal(forward.toUnit, 'miles');

  const backward = runConversion(MILES_TO_KILOMETERS, '3');
  assert.equal(backward.direction, 'miles_to_kilometers');
  assert.equal(backward.fromUnit, 'miles');
  assert.equal(backward.toUnit, 'kilometers');
});

test('switching direction on the same value produces the other conversion', () => {
  assert.equal(runConversion(KILOMETERS_TO_MILES, '100').formattedResult, '62.1371');
  assert.equal(runConversion(MILES_TO_KILOMETERS, '100').formattedResult, '160.934');
});

test('repeated conversions are deterministic and stateless', () => {
  const first = runConversion(KILOMETERS_TO_MILES, '42.5');
  for (let i = 0; i < 5; i += 1) {
    assert.deepEqual(runConversion(KILOMETERS_TO_MILES, '42.5'), first);
  }
});

test('a round trip returns to the original value within the constants accuracy', () => {
  const there = convert(KILOMETERS_TO_MILES, 100);
  const back = convert(MILES_TO_KILOMETERS, there);
  assert.ok(Math.abs(back - 100) < 0.001, `round trip drifted too far: ${back}`);
});

test('formatResult keeps 6 significant digits and strips trailing zeros', () => {
  assert.equal(formatResult(6.2137100000000004), '6.21371');
  assert.equal(formatResult(1.5), '1.5');
  assert.equal(formatResult(-0), '0');
  assert.equal(formatResult(1234567), '1234570');
  assert.equal(formatResult(1e15), '1.00000e+15');
});

test('the primitive functions guard their own inputs', () => {
  assert.deepEqual(parseInput('7'), { ok: true, value: 7 });
  assert.throws(() => convert('nonsense', 1), /Unknown conversion direction/);
  assert.throws(() => convert(KILOMETERS_TO_MILES, 'ten'), TypeError);
  assert.throws(() => formatResult(Number.POSITIVE_INFINITY), TypeError);
});
