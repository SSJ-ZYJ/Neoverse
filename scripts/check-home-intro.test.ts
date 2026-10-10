import { expect, test } from 'bun:test';
import { cssTimeToMilliseconds } from '../app/utils/homeIntroTiming';

test('intro timing is unchanged when production CSS converts milliseconds to seconds', () => {
  for (const [development, production, milliseconds] of [
    ['680ms', '.68s', 680],
    ['180ms', '.18s', 180],
    ['650ms', '.65s', 650],
    ['230ms', '.23s', 230],
    ['1000ms', '1s', 1000],
    ['600ms', '.6s', 600],
    ['250ms', '.25s', 250],
  ] as const) {
    expect(cssTimeToMilliseconds(development)).toBe(milliseconds);
    expect(cssTimeToMilliseconds(production)).toBe(milliseconds);
  }
});

test('intro timing tolerates CSS whitespace and rejects missing or invalid durations', () => {
  expect(cssTimeToMilliseconds(' 0.68s ')).toBe(680);
  expect(cssTimeToMilliseconds('0ms')).toBe(0);
  for (const invalid of ['', '680', '-1ms', 'invalid', '1.2.3s']) {
    expect(cssTimeToMilliseconds(invalid)).toBeNaN();
  }
});
