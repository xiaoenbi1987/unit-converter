# Unit Converter — Kilometers and Miles

A deliberately small web app that converts a numeric value between kilometers and miles,
in either direction. Built with plain HTML, CSS and vanilla JavaScript: no framework,
no build step and no runtime dependencies.

**Live demo:** <https://xiaoenbi1987.github.io/unit-converter/>

## Features

- Enter any number and convert it in one click.
- Choose the direction explicitly: **km → mi** or **mi → km**.
- The result is shown as a full sentence — input value, input unit, output unit and result
  together, so the answer can never be read out of context.
- Clear validation messages for blank and non-numeric input.
- No accounts, no tracking, no stored data.

## Project structure

```
.
├── index.html               # Markup: input, direction radios, Convert button, result/error regions
├── styles.css               # Presentation only
├── src/
│   ├── converter.js         # Pure conversion, validation and formatting logic (no DOM)
│   └── app.js               # DOM wiring only (no arithmetic, no validation rules)
├── tests/
│   └── converter.test.js    # Automated tests for src/converter.js
├── package.json             # Declares ES modules + the test script. No dependencies.
└── README.md
```

The dependency direction is one way only:

```
index.html → src/app.js → src/converter.js   (a leaf module that imports nothing)
tests/converter.test.js → src/converter.js
```

`src/converter.js` has no knowledge of the user interface, which is what allows the logic to be
tested without a browser.

## Setup

There is nothing to install. You only need one of the following to serve the folder:

- Python 3 (used in the examples below), or
- Node.js 18+ if you also want to run the automated tests.

## How to run it

The app uses an ES-module `import`, which browsers block over the `file://` protocol.
Serve the folder over HTTP instead:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000> in a browser.

Equivalent alternatives: `npm start` (same command) or `npx serve`.

### How to use it

1. Enter a number.
2. Select the conversion direction (**km → mi** is preselected).
3. Click **Convert**, or just press Enter.
4. Read the result below the button.

Changing the value or the direction clears the previous result, so whatever is on screen always
corresponds to the inputs currently selected.

## Running the tests

```bash
npm test
```

This runs `node --test tests/converter.test.js` using Node's built-in test runner.
No test framework is installed and there is no `node_modules` directory.

## Conversion logic

The constants used are:

| Direction | Factor |
|---|---|
| kilometers → miles | `1 km = 0.621371 mi` |
| miles → kilometers | `1 mi = 1.609344 km` |

Conversion is a single multiplication: `result = value × factor`.

### Direction identifiers

The selected direction is represented by an explicit identifier that is carried unchanged from the
radio input's `value` attribute into the conversion function:

- `kilometers_to_miles`
- `miles_to_kilometers`

The meaning is never inferred from a boolean, an element index or visible label text, so there is
no way for the recorded intent to drift from what the user actually selected.

### Display precision

Results are displayed with **6 significant digits**, and trailing zeros are removed
(`6.213710` is shown as `6.21371`).

Why 6 significant digits:

- `1 km = 0.621371 mi` is itself a 6-significant-digit rounding of `0.6213711922…`. Printing more
  digits would advertise accuracy that the constant does not have.
- Fixed decimal places were rejected because they are misleading at the extremes: at 4 decimal
  places, `0.0000001 km` would be rendered as `0.0000`, which reads as zero.

Values outside the range where plain notation stays readable (magnitude `≥ 1e15` or `< 1e-6`) are
shown in exponential notation with the same 6 significant digits, for example `6.21371e-8`.

The value the user typed is echoed back exactly as entered (apart from surrounding whitespace) and
is never silently rewritten.

### Negative values

Negative numbers are **accepted**. This is a mathematical unit converter, and conversion is linear
scaling, so `-5 km = -3.10685 mi`. The product is not scoped to physical distance only, so silently
rejecting or discarding a negative input would invent a requirement the user did not ask for.

## Data handling

The application stores nothing. There is no database, no backend, no cookie, no `localStorage`
entry, no analytics and no logging. All computation happens in the browser and nothing leaves the
page.

## Test cases and edge cases

All of the following are covered by the automated suite in `tests/converter.test.js`
(17 tests, all passing) and were additionally exercised by hand in the browser.

| Case | Input | Result |
|---|---|---|
| Zero | `0` (both directions) | `0` |
| Positive integer | `10` km → mi | `6.21371` |
| Positive integer | `10` mi → km | `16.0934` |
| Positive decimal | `12.5` km → mi | `7.76714` |
| Positive decimal | `12.3456789` km → mi | `7.67125` |
| Negative value | `-5` km → mi | `-3.10685` |
| Negative value | `-5` mi → km | `-8.04672` |
| Large value | `1000000` km → mi | `621371` |
| Very large value | `1e20` km → mi | `6.21371e+19` |
| Overflow | `1.5e308` mi → km | Error: "The result is too large to display." |
| Very small decimal | `0.0000001` km → mi | `6.21371e-8` (never `0`) |
| Blank input | `""` / `"   "` | Error: "Please enter a number." |
| Non-numeric input | `abc`, `10abc`, `1.2.3`, `--3`, `Infinity` | Error: "Please enter a valid number…" |
| Ambiguous separator | `1,5` | Rejected, never guessed as `1.5` |
| Padded input | `"  5  "` | `3.10685`, echoed as `5` |
| Missing direction | no radio selected | Error: "Please select a conversion direction." |
| Direction switching | `100` km → mi vs mi → km | `62.1371` vs `160.934` |
| Repeated conversions | same input five times | identical output (stateless) |
| Round trip | `100` km → mi → km | back to `100` within the constants' accuracy |

### Known limitation

`5 km` displays as `3.10685 mi`. The exact decimal product is `3.106855`, an exact tie at the 6th
significant digit, but the nearest IEEE-754 double is `3.1068549999999999…`, which correctly rounds
down. This is inherent to binary floating-point arithmetic and affects only the final digit.

## License

Provided as-is for assessment purposes.
