import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import ScoreHistogram, { createHistogramBins } from './ScoreHistogram';

const getBinWidths = (boundaries) => boundaries
  .slice(1)
  .map((boundary, index) => boundary - boundaries[index]);

describe('createHistogramBins', () => {
  test('returns no boundaries for an empty score list', () => {
    expect(createHistogramBins([])).toBeUndefined();
  });

  test('creates one centered bin for identical scores', () => {
    expect(createHistogramBins([12, 12, 12])).toEqual([11.5, 12.5]);
  });

  test.each([
    ['clustered positive scores', [30, 31, 31, 32, 34, 35, 37, 40, 45]],
    ['sparse positive scores', [5, 10, 20, 30, 40, 50, 60]],
    ['negative scores', [-80, -50, -40, -30, -20, -10]],
    ['mixed scores', [-10, -5, 0, 4, 8, 12, 25, 45, 60]],
  ])('creates equal-width bins containing all %s', (_, scores) => {
    const boundaries = createHistogramBins(scores);
    const widths = getBinWidths(boundaries);

    expect(boundaries[0]).toBeLessThanOrEqual(Math.min(...scores));
    expect(boundaries[boundaries.length - 1]).toBeGreaterThanOrEqual(Math.max(...scores));
    expect(widths.every((width) => width === widths[0])).toBe(true);
  });
});

test('renders at a fixed 700 by 400 size', () => {
  const { container } = render(<ScoreHistogram scores={[30, 31, 35, 40, 45]} />);
  const victoryContainer = container.querySelector('.VictoryContainer');
  const svg = victoryContainer.querySelector('svg');

  expect(victoryContainer.style.width).toBe('700px');
  expect(victoryContainer.style.height).toBe('400px');
  expect(svg.getAttribute('width')).toBe('700');
  expect(svg.getAttribute('height')).toBe('400');
});
