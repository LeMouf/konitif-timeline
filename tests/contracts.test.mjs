import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createTimelineState,
  createTimelineTicks,
  defineTimelineTrackProjectionContribution,
  getTimelineGridMetrics,
  getTimelinePositionPercent,
  getTimelineScrubResult,
  getTimelineWheelZoomWindow,
  normalizeTimelineViewWindow,
  projectTimelineSubject,
  reduceTimelineState,
  sampleTimelineTrack,
} from '../dist/index.js';

const subject = {
  id: 'measurement:timeline-proof',
  durationSeconds: 2,
  metrics: [{
    id: 'temperature',
    kind: 'scalar',
    label: 'Temperature',
    keys: [
      { id: 'warm', timeSeconds: 2, value: 1 },
      { id: 'cold', timeSeconds: 0, value: 0 },
    ],
  }],
};

const metricsContribution = defineTimelineTrackProjectionContribution({
  id: 'proof.metrics',
  version: '1.0.0',
  project: value => value.metrics,
});

function projectSubject() {
  return projectTimelineSubject(subject, {
    getSourceId: value => value.id,
    getDurationSeconds: value => value.durationSeconds,
    trackContributions: [metricsContribution],
  });
}

test('composes and samples generic tracks without mutating their source', () => {
  const projection = projectSubject();
  assert.deepEqual(projection.tracks[0].keys.map(key => key.timeSeconds), [0, 2]);
  assert.deepEqual(subject.metrics[0].keys.map(key => key.timeSeconds), [2, 0]);
  assert.equal(sampleTimelineTrack(projection.tracks[0], 1), 0.5);
});

test('keeps cursor and selection changes in Timeline state', () => {
  const projection = projectSubject();
  const initial = createTimelineState(projection);
  const sought = reduceTimelineState(projection, initial, { type: 'seek', timeSeconds: 8 });
  const selected = reduceTimelineState(projection, sought, {
    type: 'select-key',
    trackId: 'temperature',
    keyIndex: 1,
  });

  assert.equal(sought.cursorSeconds, 2);
  assert.deepEqual(selected, {
    ...sought,
    selectedTrackId: 'temperature',
    selectedKeyIndex: 1,
  });
  assert.equal(subject.durationSeconds, 2);
});

test('rejects ambiguous contribution and track identities', () => {
  assert.throws(() => projectTimelineSubject(subject, {
    getSourceId: value => value.id,
    getDurationSeconds: value => value.durationSeconds,
    trackContributions: [metricsContribution, metricsContribution],
  }), /Duplicate Timeline track contribution id/);

  const duplicateTrackContribution = defineTimelineTrackProjectionContribution({
    id: 'proof.duplicate-track',
    version: '1.0.0',
    project: value => value.metrics,
  });
  assert.throws(() => projectTimelineSubject(subject, {
    getSourceId: value => value.id,
    getDurationSeconds: value => value.durationSeconds,
    trackContributions: [metricsContribution, duplicateTrackContribution],
  }), /Duplicate Timeline track id/);
});

test('normalizes viewport state without mutating or owning its temporal subject', () => {
  assert.deepEqual(normalizeTimelineViewWindow({
    duration: 10,
    start: 3,
    end: 7,
  }), {
    start: 3,
    end: 7,
    span: 4,
    zoomX: 2.5,
    viewCenterTime: 5,
  });

  assert.deepEqual(normalizeTimelineViewWindow({
    duration: 10,
    start: -10,
    end: 20,
    minZoomX: 0.3,
  }), {
    start: 0,
    end: 30,
    span: 30,
    zoomX: 1 / 3,
    viewCenterTime: 15,
  });

  assert.deepEqual(normalizeTimelineViewWindow({
    duration: 0,
    start: 4,
    end: 8,
  }), {
    start: 0,
    end: 0,
    span: 0,
    zoomX: 1,
    viewCenterTime: null,
  });
});

test('derives scale, grid and coordinates from projection-local state', () => {
  const visibleRange = { start: 2, end: 6, span: 4 };
  const ticks = createTimelineTicks(visibleRange.start, visibleRange.end, 2.5);
  const grid = getTimelineGridMetrics({ ticks, visibleRange, fps: 30 });

  assert.ok(ticks.some(tick => tick.major));
  assert.equal(getTimelinePositionPercent(2, visibleRange), 2);
  assert.equal(getTimelinePositionPercent(4, visibleRange), 50);
  assert.equal(getTimelinePositionPercent(6, visibleRange), 98);
  assert.equal(grid.leftInsetPercent, 2);
  assert.equal(grid.rightInsetPercent, 2);
  assert.ok(grid.verticalLayers.every(layer => layer.stepPercent > 0));
  assert.equal(subject.durationSeconds, 2);
});

test('projects wheel zoom and edge scrubbing without a DOM or subject mutation', () => {
  const visibleRange = { start: 0, end: 10, span: 10 };
  const zoomed = getTimelineWheelZoomWindow({
    duration: 10,
    visibleRange,
    zoomX: 1,
    clientRatio: 0.5,
    deltaY: -240,
  });

  assert.ok(Math.abs(zoomed.zoomX - 1.5) < Number.EPSILON * 2);
  assert.ok(zoomed.span < visibleRange.span);
  assert.equal(zoomed.viewCenterTime, 5);

  const scrubbed = getTimelineScrubResult({
    clientRatio: 0.99,
    visibleRange: { start: 2, end: 6, span: 4 },
    duration: 10,
    currentTime: 4,
    viewCenterTime: 4,
  });

  assert.ok(scrubbed.currentTime > 6);
  assert.ok((scrubbed.viewCenterTime ?? 0) > 4);
});
