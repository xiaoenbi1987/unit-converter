/**
 * UI layer: reads the DOM, delegates every decision to converter.js and writes
 * the outcome back to the page. It contains no arithmetic and no validation
 * rules of its own.
 */
import { runConversion } from './converter.js';

const form = document.querySelector('#converter-form');
const valueInput = document.querySelector('#value-input');
const errorEl = document.querySelector('#error');
const resultEl = document.querySelector('#result');

/**
 * Read the selected direction straight from the checked radio's value, which is
 * already the canonical identifier ("kilometers_to_miles" / "miles_to_kilometers").
 * Nothing here re-derives the meaning from position or label text.
 */
function selectedDirection() {
  const checked = form.querySelector('input[name="direction"]:checked');
  return checked ? checked.value : null;
}

/**
 * Clear the previous outcome. Called whenever the inputs change, so a result on
 * screen always matches the value and direction currently selected.
 */
function clearOutput() {
  errorEl.textContent = '';
  resultEl.textContent = '';
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const outcome = runConversion(selectedDirection(), valueInput.value);
  clearOutput();

  if (!outcome.ok) {
    errorEl.textContent = outcome.error;
    return;
  }

  resultEl.textContent =
    `${outcome.inputText} ${outcome.fromUnit} = ${outcome.formattedResult} ${outcome.toUnit}`;
});

valueInput.addEventListener('input', clearOutput);
form.querySelectorAll('input[name="direction"]').forEach((radio) => {
  radio.addEventListener('change', clearOutput);
});
