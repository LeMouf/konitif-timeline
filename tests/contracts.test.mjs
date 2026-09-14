import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createTimelineState,
  defineTimelineTrackProjectionContribution,
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
