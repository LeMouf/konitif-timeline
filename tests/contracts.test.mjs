import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createTimelineState,
  projectClipToTimeline,
  reduceTimelineState,
  sampleTimelineTrack,
} from '../dist/index.js';

const clip = {
  id: 'clip:timeline-proof',
  title: 'Timeline proof',
  kind: 'motion',
  durationSeconds: 2,
  tracks: [{
    target: 'joint:head-yaw',
    property: 'angle',
    keys: [
      { frame: 20, time: 2, value: 1 },
      { frame: 0, time: 0, value: 0 },
    ],
  }],
};

test('projects and samples a clip without mutating its tracks', () => {
  const projection = projectClipToTimeline(clip);
  assert.deepEqual(projection.tracks[0].keys.map(key => key.frame), [0, 20]);
  assert.deepEqual(clip.tracks[0].keys.map(key => key.frame), [20, 0]);
  assert.equal(sampleTimelineTrack(projection.tracks[0], 1), 0.5);
});

test('keeps cursor and selection changes in Timeline state', () => {
  const projection = projectClipToTimeline(clip);
  const initial = createTimelineState(projection);
  const sought = reduceTimelineState(projection, initial, { type: 'seek', timeSeconds: 8 });
  const selected = reduceTimelineState(projection, sought, {
    type: 'select-key',
    trackId: 'joint:head-yaw',
    keyIndex: 1,
  });

  assert.equal(sought.cursorSeconds, 2);
  assert.deepEqual(selected, {
    ...sought,
    selectedTrackId: 'joint:head-yaw',
    selectedKeyIndex: 1,
  });
  assert.equal(clip.durationSeconds, 2);
});
