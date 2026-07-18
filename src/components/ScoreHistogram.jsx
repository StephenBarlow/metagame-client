import React from 'react';
import { VictoryAxis } from 'victory-axis';
import { VictoryChart } from 'victory-chart';
import { VictoryContainer } from 'victory-core';
import { VictoryHistogram } from 'victory-histogram';

const roundForPrecision = (value) => Number(value.toPrecision(12));

const getNiceStep = (rawStep) => {
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalizedStep = rawStep / magnitude;

  if (normalizedStep <= 1) return magnitude;
  if (normalizedStep <= 2) return 2 * magnitude;
  if (normalizedStep <= 5) return 5 * magnitude;
  return 10 * magnitude;
};

export const createHistogramBins = (scores) => {
  if (scores.length === 0) return undefined;

  const minimum = Math.min(...scores);
  const maximum = Math.max(...scores);

  if (minimum === maximum) {
    return [minimum - 0.5, maximum + 0.5];
  }

  const targetBinCount = Math.ceil(Math.log2(scores.length) + 1);
  const step = getNiceStep((maximum - minimum) / targetBinCount);
  const firstBoundary = Math.floor(minimum / step) * step;
  const lastBoundary = Math.ceil(maximum / step) * step;
  const boundaryCount = Math.round((lastBoundary - firstBoundary) / step) + 1;

  return Array.from(
    { length: boundaryCount },
    (_, index) => roundForPrecision(firstBoundary + index * step)
  );
};

const axisStyle = {
  axis: { stroke: '#ddd' },
  ticks: { stroke: '#ddd' },
  tickLabels: { fill: '#ddd' },
};

function ScoreHistogram({ scores }) {
  const data = scores.map((score) => ({ x: score }));
  const bins = createHistogramBins(scores);

  return (
    <VictoryChart
      containerComponent={<VictoryContainer responsive={false} />}
      height={400}
      width={600}
      domainPadding={{ x: 10, y: 8 }}
      padding={{ top: 20, right: 30, bottom: 60, left: 60 }}
    >
      <VictoryAxis
        label="Score"
        style={{
          ...axisStyle,
          axisLabel: { fill: '#ddd', padding: 35 },
        }}
      />
      <VictoryAxis
        dependentAxis
        label="# of Players"
        style={{
          ...axisStyle,
          axisLabel: { fill: '#ddd', padding: 45 },
        }}
      />
      <VictoryHistogram
        ariaLabel="Histogram of Pick 2 scores"
        bins={bins}
        data={data}
        style={{ data: { fill: 'cyan', stroke: 'black', strokeWidth: 2 } }}
      />
    </VictoryChart>
  );
}

export default ScoreHistogram;
