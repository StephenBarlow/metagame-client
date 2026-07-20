import React from 'react';
import { VictoryAxis } from 'victory-axis';
import { VictoryChart } from 'victory-chart';
import { VictoryContainer } from 'victory-core';
import { VictoryHistogram } from 'victory-histogram';
import { VictoryScatter } from 'victory-scatter';
import { VictoryTooltip } from 'victory-tooltip';

const roundForPrecision = (value) => Number(value.toPrecision(12));

const getNiceStep = (rawStep) => {
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalizedStep = rawStep / magnitude;

  if (normalizedStep <= 1) return magnitude;
  if (normalizedStep <= 2) return 2 * magnitude;
  if (normalizedStep <= 5) return 5 * magnitude;
  return 10 * magnitude;
};

const MAX_BUCKET_SIZE = 25;

export const createHistogramBins = (scores) => {
  if (scores.length === 0) return undefined;

  const minimum = Math.min(...scores);
  const maximum = Math.max(...scores);

  if (minimum === maximum) {
    return [minimum - 0.5, maximum + 0.5];
  }

  const targetBinCount = Math.ceil(Math.log2(scores.length) + 1);
  const step = Math.min(getNiceStep((maximum - minimum) / targetBinCount), MAX_BUCKET_SIZE);
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

function ScoreHistogram({ scores, playerScores = [] }) {
  const data = scores.map((score) => ({ x: score }));
  const scoreDotCounts = new Map();
  const playerPositionData = scores.map((score) => {
    const dotCount = scoreDotCounts.get(score) || 0;
    scoreDotCounts.set(score, dotCount + 1);
    return { x: score, y: 0.5 + dotCount * 0.15 };
  });
  const bins = createHistogramBins(scores);

  if (!bins || bins.length - 1 < 3) return null;

  const getBinLabel = ({ datum }) => {
    const lowerBound = datum.x0;
    const upperBound = datum.x1;
    const playersInBin = playerScores
      .filter(({ score }) => score >= lowerBound && score <= upperBound)
      .sort((firstPlayer, secondPlayer) =>
        secondPlayer.score - firstPlayer.score || firstPlayer.name.localeCompare(secondPlayer.name)
      )
      .map(({ name, score }) => ({ name: name.split(' ')[0], score }));

    const longestName = Math.max(...playersInBin.map(({ name }) => name.length), 0);
    const longestScore = Math.max(...playersInBin.map(({ score }) => String(score).length), 0);

    return playersInBin
      .map(({ name, score }) => {
        const namePadding = '\u00a0'.repeat(longestName - name.length);
        const scorePadding = '\u00a0'.repeat(longestScore - String(score).length);
        return `${name}${namePadding}\u00a0\u00a0${scorePadding}${score}`;
      })
      .join('\n');
  };

  return (
    <VictoryChart
      containerComponent={<VictoryContainer responsive={false} style={{ touchAction: 'pan-x' }} />}
      height={400}
      width={700}
      domainPadding={{ x: 0, y: 8 }}
      padding={{ top: 20, right: 30, bottom: 60, left: 60 }}
    >
      <VictoryAxis
        tickValues={bins}
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
        labels={getBinLabel}
        labelComponent={<VictoryTooltip constrainToVisibleArea flyoutStyle={{ fill: '#000' }} style={{ fill: '#fff', textAnchor: 'start', fontFamily: 'monospace' }} />}
        style={{ data: { fill: 'cyan', stroke: 'black', strokeWidth: 2 } }}
      />
      <VictoryScatter
        ariaLabel="Player score positions"
        data={playerPositionData}
        symbol="diamond"
        size={2}
        style={{ data: { fill: 'cyan', stroke: 'magenta', strokeWidth: 1.5 } }}
      />
    </VictoryChart>
  );
}

export default ScoreHistogram;
