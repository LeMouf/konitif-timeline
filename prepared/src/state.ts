import type { TimelineIntent, TimelineProjection, TimelineState } from './contracts.js';

export function createTimelineState(
  projection: TimelineProjection,
  input: Partial<TimelineState> = {}
): TimelineState {
  const visibleStartSeconds = clamp(finite(input.visibleStartSeconds), 0, projection.durationSeconds);
  const visibleEndSeconds = clamp(
    finite(input.visibleEndSeconds, projection.durationSeconds),
    visibleStartSeconds,
    projection.durationSeconds
  );

  return {
    cursorSeconds: clamp(finite(input.cursorSeconds), 0, projection.durationSeconds),
    visibleStartSeconds,
    visibleEndSeconds,
    selectedTrackId: input.selectedTrackId ?? null,
    selectedKeyIndex: input.selectedKeyIndex ?? null
  };
}

export function reduceTimelineState(
  projection: TimelineProjection,
  state: TimelineState,
  intent: TimelineIntent
): TimelineState {
  switch (intent.type) {
    case 'seek':
      return { ...state, cursorSeconds: clamp(finite(intent.timeSeconds), 0, projection.durationSeconds) };
    case 'set-visible-range': {
      const visibleStartSeconds = clamp(finite(intent.startSeconds), 0, projection.durationSeconds);
      return {
        ...state,
        visibleStartSeconds,
        visibleEndSeconds: clamp(finite(intent.endSeconds), visibleStartSeconds, projection.durationSeconds)
      };
    }
    case 'select-track':
      return { ...state, selectedTrackId: intent.trackId, selectedKeyIndex: null };
    case 'select-key': {
      const track = projection.tracks.find((candidate) => candidate.id === intent.trackId);
      const selectedKeyIndex = track && intent.keyIndex >= 0 && intent.keyIndex < track.keys.length
        ? Math.floor(intent.keyIndex)
        : null;
      return { ...state, selectedTrackId: selectedKeyIndex === null ? null : intent.trackId, selectedKeyIndex };
    }
  }
}

function finite(value: number | undefined, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
